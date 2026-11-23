// Лид-формы 2.0: «Вид страницы» — тема и блоки (offer_config.page формы → ключ `page` ответа get_landing).
// Сервер (public.clubform_page_public в репо ЕРП) уже отфильтровал тему, типы блоков и ссылки, но ответ
// всё равно разбираем строго: лендинг не должен падать от неожиданной формы, а старая форма без `page`
// рисуется прежним видом.

export type PageTheme = 'night' | 'photo' | 'light';
export type PageBlockType = 'free' | 'prices' | 'gallery' | 'video' | 'map' | 'social' | 'clubs';
/** Значок подарка над заголовком оффера: крупный (как было) / маленький на плашке-бейдже / без значка. */
export type GiftIconMode = 'big' | 'badge' | 'none';
export type OfferTextSize = 'm' | 'l';
export type OfferTextAlign = 'left' | 'center';

/** Железо зоны — та же сводка, что «Характеристики зон» ТВ-карты (widget_zone_specs). */
export interface PageZoneSpecs { cpu?: string; gpu?: string; ram?: string; monitor?: string; note?: string }
export interface PageFreeZone { name: string; total: number; available: number; specs?: PageZoneSpecs | null }
/** Клуб того же владельца для блока «Наши клубы». */
export interface PageClub { name: string; city: string | null; address: string | null; lat: number | null; lng: number | null; current: boolean }
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
    clubs: PageClub[] | null;
    giftIcon: GiftIconMode;
    /** null — нейтральные кнопки соцсетей; 'accent' — цвет кнопки страницы; '#RRGGBB' — свой цвет. */
    socialColor: string | null;
    /** Показывать железо зон в «Свободно сейчас». */
    freeSpecs: boolean;
    /** Текст оффера: размер и выравнивание (23.11.2026). */
    textSize: OfferTextSize;
    textAlign: OfferTextAlign;
}

const THEMES: PageTheme[] = ['night', 'photo', 'light'];
const BLOCKS: PageBlockType[] = ['free', 'prices', 'gallery', 'video', 'map', 'social', 'clubs'];
const GIFT_ICONS: GiftIconMode[] = ['big', 'badge', 'none'];
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const SPEC_KEYS = ['cpu', 'gpu', 'ram', 'monitor', 'note'] as const;
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
        .map((z: any) => ({ name: str(z?.name, 60), total: num(z?.total) ?? 0, available: num(z?.available) ?? 0, specs: readSpecs(z?.specs) }))
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
    const clubs: PageClub[] = (Array.isArray(p.clubs) ? p.clubs : [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- элементы недоверенного массива
        .map((c: any) => {
            const cLat = num(c?.lat), cLng = num(c?.lng);
            const geo = cLat !== null && cLng !== null && Math.abs(cLat) <= 90 && Math.abs(cLng) <= 180;
            return { name: str(c?.name, 60), city: str(c?.city, 40) || null, address: str(c?.address, 120) || null,
                lat: geo ? cLat : null, lng: geo ? cLng : null, current: c?.current === true };
        })
        .filter((c: PageClub) => c.name)
        .slice(0, 40);
    const lat = num(p.map?.lat), lng = num(p.map?.lng);
    const map = lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;

    return {
        theme: p.theme,
        accent: typeof p.accent === 'string' && HEX_RE.test(p.accent) ? p.accent : null,
        blocks,
        gallery,
        video,
        free: freeZones.length ? { updatedAt: str(p.free?.updatedAt, 40) || null, zones: freeZones } : null,
        prices: prices.length ? prices : null,
        map,
        clubs: clubs.length > 1 ? clubs : null,
        giftIcon: GIFT_ICONS.includes(p.giftIcon) ? p.giftIcon : 'big',
        socialColor: p.socialColor === 'accent' || (typeof p.socialColor === 'string' && HEX_RE.test(p.socialColor)) ? p.socialColor : null,
        freeSpecs: p.freeSpecs === true,
        textSize: p.textSize === 'l' ? 'l' : 'm',
        textAlign: p.textAlign === 'center' ? 'center' : 'left',
    };
}

function readSpecs(raw: unknown): PageZoneSpecs | null {
    if (!raw || typeof raw !== 'object') return null;
    const out: PageZoneSpecs = {};
    for (const k of SPEC_KEYS) {
        const v = str((raw as Record<string, unknown>)[k], 60).trim();
        if (v) out[k] = v;
    }
    return Object.keys(out).length ? out : null;
}

/** «RTX 4070 Ti · i7-12700 · 32 ГБ · 300 Гц» — железо зоны одной строкой (видеокарта первой: её гость ищет). */
export const specsLine = (s?: PageZoneSpecs | null): string | null => {
    if (!s) return null;
    const parts = [s.gpu, s.cpu, s.ram, s.monitor].filter(Boolean);
    return parts.length ? parts.join(' · ') : null;
};

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
