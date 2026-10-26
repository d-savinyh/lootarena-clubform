// Лид-формы 2.0: «Вид страницы» — тема и блоки (offer_config.page формы → ключ `page` ответа get_landing).
// Сервер (public.clubform_page_public в репо ЕРП) уже отфильтровал тему, типы блоков и ссылки, но ответ
// всё равно разбираем строго: лендинг не должен падать от неожиданной формы, а старая форма без `page`
// рисуется прежним видом.

export type PageTheme = 'night' | 'photo' | 'light';
export type PageBlockType = 'free' | 'prices' | 'gallery' | 'video' | 'map' | 'social';

export interface PageFreeZone { name: string; total: number; available: number }
export interface PagePrice {
    zone: string;
    title: string;
    price: number;
    schedule?: string | null;
    /** Длительность пакета в минутах; null — почасовой тариф. */
    minutes?: number | null;
    currency?: string | null;
}

export interface LandingPageDesign {
    theme: PageTheme;
    accent: string | null;
    blocks: PageBlockType[];
    gallery: string[];
    video: { url: string; poster: string | null } | null;
    free: { updatedAt: string | null; zones: PageFreeZone[] } | null;
    prices: PagePrice[] | null;
    map: { lat: number; lng: number } | null;
}

const THEMES: PageTheme[] = ['night', 'photo', 'light'];
const BLOCKS: PageBlockType[] = ['free', 'prices', 'gallery', 'video', 'map', 'social'];
const S3_RE = /^https:\/\/s3\.lootarena\.ru\/[A-Za-z0-9/_.%-]+$/;

const num = (v: unknown): number | null => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
};
const str = (v: unknown, max = 120): string => (typeof v === 'string' ? v.slice(0, max) : '');

/** Разбор ключа `page`: что-то не так с темой — null, и страница рисуется прежним видом. */
export function normalizePage(raw: unknown): LandingPageDesign | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- разбор недоверенного JSON: каждое поле проверяется ниже
    let p: any = raw;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch { return null; } }
    if (!p || typeof p !== 'object') return null;
    if (!THEMES.includes(p.theme)) return null;

    const blocks = (Array.isArray(p.blocks) ? p.blocks : [])
        .filter((b: unknown): b is PageBlockType => BLOCKS.includes(b as PageBlockType));
    const gallery = (Array.isArray(p.gallery) ? p.gallery : [])
        .filter((u: unknown): u is string => typeof u === 'string' && S3_RE.test(u))
        .slice(0, 12);
    const video = p.video && typeof p.video.url === 'string' && S3_RE.test(p.video.url)
        ? { url: p.video.url, poster: typeof p.video.poster === 'string' && S3_RE.test(p.video.poster) ? p.video.poster : null }
        : null;
    const freeZones: PageFreeZone[] = (Array.isArray(p.free?.zones) ? p.free.zones : [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- элементы недоверенного массива
        .map((z: any) => ({ name: str(z?.name, 60), total: num(z?.total) ?? 0, available: num(z?.available) ?? 0 }))
        .filter((z: PageFreeZone) => z.name && z.total > 0);
    const prices: PagePrice[] = (Array.isArray(p.prices) ? p.prices : [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- элементы недоверенного массива
        .map((x: any) => ({
            zone: str(x?.zone, 60),
            title: str(x?.title, 80),
            price: num(x?.price) ?? -1,
            schedule: str(x?.schedule, 80) || null,
            minutes: num(x?.minutes),
            currency: str(x?.currency, 3) || null,
        }))
        .filter((x: PagePrice) => x.zone && x.price >= 0);
    const lat = num(p.map?.lat), lng = num(p.map?.lng);
    const map = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;

    return {
        theme: p.theme,
        accent: typeof p.accent === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p.accent) ? p.accent : null,
        blocks,
        gallery,
        video,
        free: freeZones.length ? { updatedAt: str(p.free?.updatedAt, 40) || null, zones: freeZones } : null,
        prices: prices.length ? prices : null,
        map,
    };
}

const CURRENCY_SYMBOL: Record<string, string> = { RUB: '₽', KZT: '₸', BYN: 'Br', UZS: 'сум', KGS: 'сом', USD: '$', EUR: '€' };
export const currencySymbol = (code?: string | null) => CURRENCY_SYMBOL[(code || 'RUB').toUpperCase()] || (code || '₽');

export const formatMoney = (value: number, code?: string | null) =>
    `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: value % 1 ? 2 : 0 }).format(value)} ${currencySymbol(code)}`;

export const formatMinutes = (m: number) => {
    if (m % 60 === 0) {
        const h = m / 60;
        return `${h} ч`;
    }
    return m > 60 ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${m} мин`;
};

export interface ZonePriceSummary {
    zone: string;
    /** Минимальная цена часа (тарифы без длительности). */
    hourFrom: number | null;
    /** Самый дешёвый пакет. */
    packetFrom: { price: number; minutes: number } | null;
    items: PagePrice[];
}

/** Цены по зонам: «от … за час» и самый дешёвый пакет. Порядок зон — как пришли с сервера. */
export function summarizePrices(prices: PagePrice[]): ZonePriceSummary[] {
    const byZone = new Map<string, ZonePriceSummary>();
    for (const p of prices) {
        let z = byZone.get(p.zone);
        if (!z) { z = { zone: p.zone, hourFrom: null, packetFrom: null, items: [] }; byZone.set(p.zone, z); }
        z.items.push(p);
        if (p.minutes && p.minutes > 0) {
            if (!z.packetFrom || p.price < z.packetFrom.price) z.packetFrom = { price: p.price, minutes: p.minutes };
        } else if (z.hourFrom === null || p.price < z.hourFrom) {
            z.hourFrom = p.price;
        }
    }
    return [...byZone.values()];
}

/** «обновлено 3 мин назад» — без даты: данные «свободно» живут минутами. */
export function freshnessLabel(iso: string | null): string | null {
    if (!iso) return null;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return null;
    const min = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (min < 1) return 'обновлено только что';
    if (min < 60) return `обновлено ${min} мин назад`;
    return null;
}
