// Метки рекламного перехода для офлайн-конверсий «гость пришёл / оплатил» (Метрика → Директ, VK Реклама).
// Сервер отбирает из них только допустимые значения (clubform_sync_ad_conversions), здесь — только сбор.
// План: specs/lead-form/offline-conversions-plan.md в репозитории ЕРП.

/** Параметры адреса, которые храним как метку клика. `rb_clickid` дописывает к ссылке VK Реклама. */
export const CLICK_KEYS = ['yclid', 'ymclid', 'gclid', 'fbclid', '_openstat', 'rb_clickid', 'erid'] as const;

/** Сколько живёт сохранённый клик: гость открыл рекламу, ушёл и вернулся на форму без метки в адресе. */
const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

const storageKey = (slug: string) => `cf_clicks_${slug}`;

/**
 * Метки клика из адреса; если в адресе их нет — последний сохранённый клик по этой форме (до 30 дней).
 * Новый клик перезаписывает сохранённый целиком: атрибуция по последнему клику, как советует VK.
 */
export function readClickIds(slug: string, params: URLSearchParams): Record<string, string> {
    const fromUrl: Record<string, string> = {};
    CLICK_KEYS.forEach(k => {
        const v = (params.get(k) || '').trim();
        if (v && v.length <= 256) fromUrl[k] = v;
    });
    try {
        if (Object.keys(fromUrl).length) {
            localStorage.setItem(storageKey(slug), JSON.stringify({ at: Date.now(), ids: fromUrl }));
            return fromUrl;
        }
        const raw = localStorage.getItem(storageKey(slug));
        if (!raw) return fromUrl;
        const saved = JSON.parse(raw) as { at?: number; ids?: Record<string, string> };
        if (!saved?.at || Date.now() - saved.at > KEEP_MS || !saved.ids) {
            localStorage.removeItem(storageKey(slug));
            return fromUrl;
        }
        const ids: Record<string, string> = {};
        CLICK_KEYS.forEach(k => { const v = saved.ids?.[k]; if (typeof v === 'string' && v) ids[k] = v; });
        return ids;
    } catch {
        return fromUrl; // нет localStorage (приватный режим) — только адрес
    }
}

/**
 * ClientID Метрики — номер посетителя в счётчике клуба. По нему Метрика привязывает офлайн-конверсию
 * к визиту из любого источника, а не только из Директа (yclid). Берём из cookie `_ym_uid`, которую
 * ставит счётчик; если её ещё нет — из ответа `ym(counter, 'getClientID')`.
 */
let ymClientId: string | undefined;

export function rememberMetrikaClientId(counter: number): void {
    const ym = (window as unknown as { ym?: (counter: number, method: string, cb: (id: unknown) => void) => void }).ym;
    try {
        if (typeof ym === 'function') {
            ym(counter, 'getClientID', (id: unknown) => {
                const s = String(id ?? '');
                if (/^[0-9]{6,30}$/.test(s)) ymClientId = s;
            });
        }
    } catch { /* счётчик не загрузился — обойдёмся yclid */ }
}

export function metrikaClientId(): string | undefined {
    try {
        const m = /(?:^|;\s*)_ym_uid=([0-9]{6,30})(?:;|$)/.exec(document.cookie);
        if (m) return m[1];
    } catch { /* нет доступа к cookie */ }
    return ymClientId;
}
