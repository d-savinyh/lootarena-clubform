// Превью страницы формы в ЕРП (мастер лид-формы, 12.11.2026). ЕРП открывает /__preview во фрейме и шлёт черновик
// формы сообщением `lf-preview`; страница рисует его тем же кодом, что и боевую форму, но:
//  · ничего не пишет на сервер: просмотры, события, заявка и пиксели в превью не уходят;
//  · принимает сообщения только от ЕРП (список адресов ниже) и только своего формата;
//  · живые блоки («Свободно», «Цены», «Карта») берёт из настоящей формы клуба (`liveSlug`, только чтение get_landing),
//    а если у клуба таких данных нет — «Свободно» и «Цены» показывает примером и говорит об этом плашкой.
import type { ClubLanding } from './api';
import { normalizePage, type LandingPageDesign } from './page';

export const IS_PREVIEW = typeof window !== 'undefined' && window.location.pathname.replace(/\/+$/, '') === '/__preview';

const ALLOWED_ORIGINS: RegExp[] = [
    /^https:\/\/erp\.lootarena\.ru$/,
    /^http:\/\/localhost:\d{2,5}$/,
    /^http:\/\/127\.0\.0\.1:\d{2,5}$/,
];

export interface PreviewPayload {
    club: ClubLanding['club'];
    form: Omit<ClubLanding['form'], 'page'> & { page: unknown };
    /** Slug настоящей формы клуба — из неё берутся живые блоки и данные клуба (адрес, часы, соцсети). */
    liveSlug?: string | null;
}

let current: PreviewPayload | null = null;
let live: ClubLanding | null = null;
let liveFor: string | null = null;
let sampleUsed = false;
const listeners = new Set<(l: ClubLanding | null) => void>();

const SAMPLE_FREE: NonNullable<LandingPageDesign['free']> = {
    updatedAt: null,
    zones: [
        { name: 'Общий зал', total: 20, available: 12 },
        { name: 'VIP', total: 10, available: 4 },
        { name: 'Буткемп', total: 5, available: 0 },
    ],
};
const SAMPLE_PRICES: NonNullable<LandingPageDesign['prices']> = [
    { zone: 'Общий зал', title: 'Час игры', price: 150, schedule: 'Каждый день', minutes: null, currency: null },
    { zone: 'Общий зал', title: 'Пакет 3 часа', price: 400, schedule: 'Каждый день', minutes: 180, currency: null },
    { zone: 'VIP', title: 'Час игры', price: 250, schedule: 'Каждый день', minutes: null, currency: null },
];

/** Собрать то, что страница нарисует: черновик ЕРП + живые блоки настоящей формы (или пример). */
export function previewLanding(): ClubLanding | null {
    if (!current) return null;
    const page = normalizePage(current.form.page);
    sampleUsed = false;
    if (page) {
        const livePage = live?.form.page || null;
        const network = !!current.form.isNetwork;
        if (page.blocks.includes('free') && !network) {
            page.free = livePage?.free || null;
            if (!page.free) { page.free = SAMPLE_FREE; sampleUsed = true; }
        }
        if (page.blocks.includes('prices') && !network) {
            page.prices = livePage?.prices || null;
            if (!page.prices) { page.prices = SAMPLE_PRICES; sampleUsed = true; }
        }
        // Карту примером не показываем: чужой адрес на карте вводил бы в заблуждение.
        page.map = !network ? livePage?.map || null : null;
    }
    const liveClub = live?.club;
    return {
        club: {
            ...current.club,
            address: current.club.address || liveClub?.address || '',
            workingHours: current.club.workingHours || liveClub?.workingHours,
            avatarUrl: current.club.avatarUrl || liveClub?.avatarUrl,
            coverUrl: current.club.coverUrl || liveClub?.coverUrl,
            socialLinks: current.club.socialLinks || liveClub?.socialLinks,
            operator: current.club.operator || liveClub?.operator || null,
        },
        form: {
            ...current.form,
            id: 'preview',
            slug: '__preview',
            tracking: null,
            linkUtm: null,
            page,
        },
    };
}

export const previewUsesSample = () => sampleUsed;

export function subscribePreview(fn: (l: ClubLanding | null) => void): () => void {
    listeners.add(fn);
    fn(previewLanding());
    return () => { listeners.delete(fn); };
}

const emit = () => { const l = previewLanding(); listeners.forEach((fn) => fn(l)); };

/** Слушать ЕРП. `loadLive` — чтение настоящей формы клуба (get_landing) для живых блоков. */
export function startPreview(loadLive: (slug: string) => Promise<ClubLanding | null>): () => void {
    const onMessage = (e: MessageEvent) => {
        if (!ALLOWED_ORIGINS.some((re) => re.test(e.origin))) return;
        const data = e.data as { type?: unknown; payload?: unknown } | null;
        if (!data || data.type !== 'lf-preview' || !data.payload || typeof data.payload !== 'object') return;
        const p = data.payload as PreviewPayload;
        if (!p.club || typeof p.club.name !== 'string' || !p.form || typeof p.form.offerTitle !== 'string') return;
        current = p;
        const slug = typeof p.liveSlug === 'string' && /^[a-z0-9-]{1,80}$/.test(p.liveSlug) ? p.liveSlug : null;
        if (slug && slug !== liveFor) {
            liveFor = slug;
            void loadLive(slug).then((l) => { if (liveFor === slug) { live = l; emit(); } }).catch(() => { /* живых блоков нет — пример */ });
        }
        emit();
    };
    window.addEventListener('message', onMessage);
    // Сказать ЕРП, что страница готова принимать черновик (сообщение родителю — без данных).
    if (window.parent !== window) window.parent.postMessage({ type: 'lf-preview-ready' }, '*');
    return () => window.removeEventListener('message', onMessage);
}
