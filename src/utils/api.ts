// API для ClubForm — вызовы к публичному webhook n8n

// Для dev используем proxy (настроен в vite.config.ts), для prod — прямой URL
const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://n8n.lootarena.ru/webhook';

export interface ClubLanding {
    club: {
        name: string;
        address: string;
        workingHours?: string;
        logoUrl?: string;
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
    };
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
}

export interface SubmitResult {
    ok: boolean;
    promoCode?: string;
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

// Получить данные лендинга по slug
export async function getLandingData(slug: string): Promise<ClubLanding | null> {
    try {
        const res = await callPublicAPI('get_landing', { slug });
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
            promoCode: result?.promoCode || result?.promo_code,
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
}): Promise<void> {
    try {
        await callPublicAPI('track_view', {
            form_id: formId,
            utm_source: utm.source || '',
            utm_medium: utm.medium || '',
            utm_campaign: utm.campaign || '',
            user_agent: navigator.userAgent,
            ip_hash: '', // заполняет бэкенд при необходимости
        });
    } catch (e) {
        // Молча проглатываем ошибки трекинга — не критично
        console.warn('trackView error:', e);
    }
}
