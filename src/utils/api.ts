// API для ClubForm — вызовы к публичному webhook n8n

// Для dev используем proxy (настроен в vite.config.ts), для prod — прямой URL
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://n8n.lootarena.ru/webhook';

export interface ClubLanding {
    club: {
        name: string;
        address: string;
        workingHours?: string;
        avatarUrl?: string;
        coverUrl?: string;
        socialLinks?: {
            vk?: string;
            telegram?: string;
            instagram?: string;
        };
    };
    form: {
        id: string;
        slug: string;
        offerType: 'free_hour' | 'bring_friend' | 'night_pack' | 'custom';
        offerTitle: string;
        offerDescription?: string;
        offerTerms?: string;
        offerBadge?: string;
        brandColor: string;
        gift?: LeadGift | null;
        variant?: 'A' | 'B';
        coverImage?: string | null;
        ctaText?: string | null;
        tracking?: { metrika?: string; vk_pixel?: string; top_mail?: string; meta?: string; gtag?: string } | null;
    };
}

export interface LeadGift {
    reward_type: 'BONUSES' | 'MONEY' | 'PRODUCT' | 'MANUAL';
    reward_text?: string;
    reward_icon?: string;
    reward_meta?: { bonus_amount?: number;[k: string]: any };
    expires_in_days?: string;
}

export interface LeadSubmission {
    form_id: string;
    club_id: string;
    name: string;
    phone: string;
    telegram?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    variant?: string;
    click_ids?: Record<string, string>;
}

export type GiftStatus = 'inventory' | 'reserved' | 'none';

export interface SubmitResult {
    ok: boolean;
    giftStatus?: GiftStatus;
    eligible?: boolean;
    duplicate?: boolean;
    submissionId?: string;
    error?: string;
}

// Вызов публичного n8n webhook
async function callPublicAPI(action: string, data: Record<string, any> = {}): Promise<any> {
    const response = await fetch(`${API_URL}/public/clubform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
}

// Получить данные лендинга по slug (variant — сохранённый выбор A/B для консистентности при перезагрузке)
export async function getLandingData(slug: string, variant?: string): Promise<ClubLanding | null> {
    try {
        const res = await callPublicAPI('get_landing', { slug, variant });
        // n8n может вернуть массив или объект
        const data = Array.isArray(res) ? res[0] : res;
        if (!data || data.error) return null;
        return data;
    } catch (e) {
        console.error('getLandingData error:', e);
        return null;
    }
}

// Отправить заявку
export async function submitLead(data: LeadSubmission): Promise<SubmitResult> {
    try {
        const res = await callPublicAPI('submit_lead', data);
        const result = Array.isArray(res) ? res[0] : res;
        return {
            ok: result?.ok ?? true,
            giftStatus: (result?.giftStatus || result?.gift_status) as GiftStatus | undefined,
            eligible: result?.eligible,
            duplicate: result?.duplicate,
            submissionId: result?.submissionId || result?.id,
        };
    } catch (e) {
        console.error('submitLead error:', e);
        return { ok: false, error: 'Ошибка отправки. Попробуйте ещё раз.' };
    }
}

// Трекинг просмотра страницы
export async function trackView(formId: string, utm: {
    source?: string;
    medium?: string;
    campaign?: string;
}, variant?: string): Promise<void> {
    try {
        await callPublicAPI('track_view', {
            form_id: formId,
            utm_source: utm.source || '',
            utm_medium: utm.medium || '',
            utm_campaign: utm.campaign || '',
            variant: variant || 'A',
            user_agent: navigator.userAgent,
            ip_hash: '', // заполняет бэкенд при необходимости
        });
    } catch (e) {
        // Молча проглатываем ошибки трекинга — не критично
        console.warn('trackView error:', e);
    }
}

// ── Поведенческая аналитика «кто что тыкает» (lead-forms v2, Фаза 1) ──
const EVENT_URL = `${API_URL}/public/clubform-event`;

export function getSessionId(): string {
    try {
        let s = sessionStorage.getItem('cf_sid');
        if (!s) {
            s = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            sessionStorage.setItem('cf_sid', s);
        }
        return s;
    } catch { return 'anon'; }
}

export interface EvtCtx {
    variant?: string;
    utm?: { source?: string; medium?: string; campaign?: string };
}

// Отправка поведенческого события. useBeacon — для ухода со страницы (pagehide/abandon),
// чтобы событие не потерялось. Иначе fetch keepalive. Трекинг не критичен — ошибки глотаем.
export function trackEvent(
    formId: string,
    eventType: string,
    meta: Record<string, any> = {},
    ctx: EvtCtx = {},
    useBeacon = false,
): void {
    if (!formId) return;
    const body = JSON.stringify({
        form_id: formId,
        event_type: eventType,
        session_id: getSessionId(),
        variant: ctx.variant || 'A',
        meta,
        utm_source: ctx.utm?.source || '',
        utm_medium: ctx.utm?.medium || '',
        utm_campaign: ctx.utm?.campaign || '',
        user_agent: navigator.userAgent,
    });
    try {
        if (useBeacon && navigator.sendBeacon) {
            navigator.sendBeacon(EVENT_URL, new Blob([body], { type: 'application/json' }));
        } else {
            fetch(EVENT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => { });
        }
    } catch { /* трекинг не критичен */ }
}

// ── Пиксели рекламных систем: инжект по ID из стандартных шаблонов (не сырой скрипт клуба) ──
let pixelsInjected = false;
export function injectPixels(t?: ClubLanding['form']['tracking']): void {
    if (!t || pixelsInjected || typeof document === 'undefined') return;
    pixelsInjected = true;
    const w = window as any;
    const addScript = (src: string) => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };
    // Яндекс.Метрика
    if (t.metrika) {
        w.ym = w.ym || function () { (w.ym.a = w.ym.a || []).push(arguments); };
        w.ym.l = Date.now();
        addScript('https://mc.yandex.ru/metrika/tag.js');
        try { w.ym(Number(t.metrika), 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false }); } catch { /* noop */ }
    }
    // VK Пиксель / top.mail.ru (общий top-API _tmr)
    if (t.vk_pixel || t.top_mail) {
        w._tmr = w._tmr || [];
        addScript('https://top-fwz1.mail.ru/js/code.js');
        if (t.vk_pixel) w._tmr.push({ id: t.vk_pixel, type: 'pageView', start: Date.now() });
        if (t.top_mail) w._tmr.push({ id: t.top_mail, type: 'pageView', start: Date.now() });
    }
    // Meta Pixel
    if (t.meta) {
        if (!w.fbq) {
            const n: any = w.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
            if (!w._fbq) w._fbq = n;
            n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
            addScript('https://connect.facebook.net/en_US/fbevents.js');
        }
        try { w.fbq('init', t.meta); w.fbq('track', 'PageView'); } catch { /* noop */ }
    }
    // Google tag (GA4 / Google Ads)
    if (t.gtag) {
        addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(t.gtag)}`);
        w.dataLayer = w.dataLayer || [];
        w.gtag = function () { w.dataLayer.push(arguments); };
        try { w.gtag('js', new Date()); w.gtag('config', t.gtag); } catch { /* noop */ }
    }
}

// Конверсия «лид» во все подключённые пиксели — на успешном сабмите. value = стоимость подарка (опц.).
export function fireLeadConversion(t?: ClubLanding['form']['tracking'], value?: number): void {
    if (!t || typeof window === 'undefined') return;
    const w = window as any;
    try { if (t.metrika && w.ym) w.ym(Number(t.metrika), 'reachGoal', 'lead'); } catch { /* noop */ }
    try { if ((t.vk_pixel || t.top_mail) && w._tmr) w._tmr.push({ type: 'reachGoal', id: t.vk_pixel || t.top_mail, goal: 'lead', value: value || 0 }); } catch { /* noop */ }
    try { if (t.meta && w.fbq) w.fbq('track', 'Lead', value ? { value, currency: 'RUB' } : {}); } catch { /* noop */ }
    try { if (t.gtag && w.gtag) w.gtag('event', 'generate_lead', value ? { value, currency: 'RUB' } : {}); } catch { /* noop */ }
}
