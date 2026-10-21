// Публичная страница турнира `/t/<токен>` → n8n `PUBLIC - Tournament` (POST /public/tournament) → trn_public_dispatch.
// Сервер отвечает СПИСКОМ полей: ни телефонов, ни ников других игроков, ни id участников здесь нет и быть не должно.
// ip и прохождение капчи ставит n8n — из тела они не принимаются.

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://n8n.lootarena.ru/webhook';

export type TournamentStatus = 'published' | 'checkin' | 'live' | 'finished' | 'cancelled';

export interface PublicPrize { place_from: number; place_to: number; text: string }

export interface PublicTournament {
    club: {
        name: string;
        avatar_url: string | null;
        cover_url: string | null;
        address: string | null;
        city: string | null;
        currency_code: string | null;
        /** POSIX-пояс ЕРП: '-03' = UTC+3. */
        timezone: string | null;
    };
    tournament: {
        title: string;
        game_key: 'cs2' | 'dota2' | 'other';
        game_title: string | null;
        format: 'se' | 'de';
        team_size: number;
        entry_mode: 'mix' | 'teams';
        capacity: number;
        capacity_unit: 'players' | 'teams';
        best_of: { default: number; final: number };
        third_place_match: boolean;
        entry_fee: number;
        starts_at: string | null;
        registration_closes_at: string | null;
        checkin_opens_at: string | null;
        status: TournamentStatus;
        rules: string | null;
        age_policy: 'adults' | 'minors_allowed';
        stream_url: string | null;
        prizes: PublicPrize[];
        nominations: Array<{ title: string; prize: string | null }>;
        participation_prize: string | null;
        /** «Только с подтверждённым номером»: без подтверждения в Telegram заявка освободит место через 30 минут. */
        confirm_required?: boolean;
    };
    counts: { used: number; waitlist: number };
    registration_open: boolean;
    teams: Array<{ id: string; name: string; seed: number | null; place: number | null; status: string }> | null;
    matches: Array<{
        id: string; bracket: 'upper' | 'lower' | 'third_place' | 'grand_final'; round: number; slot: number; best_of: number;
        status: string; team_a_id: string | null; team_b_id: string | null; winner_team_id: string | null;
        score: Array<{ a: number; b: number }> | null;
        /** Номера ПК сторон матча — куда садиться. */
        pcs?: { a?: number[]; b?: number[] } | null;
    }> | null;
    invite: { valid: boolean; kind?: 'party' | 'team'; team_name?: string | null; members?: number; size?: number } | null;
}

export type ViewResult =
    | { ok: true; unchanged: true; etag: string }
    | { ok: true; unchanged?: false; etag: string; data: PublicTournament }
    | { ok: false; error: string };

export type RegisterStatus = 'registered' | 'waitlist' | 'already' | 'joined';

export interface RegisterResult {
    ok: boolean;
    error?: string;
    status?: RegisterStatus;
    number?: number;
    waitlist_pos?: number;
    checkin_code?: string;
    invite_code?: string;
    kind?: 'solo' | 'party' | 'team';
    members?: number;
    size?: number;
    team_name?: string;
    team_name_pending?: boolean;
    requireCaptcha?: boolean;
    captchaKey?: string;
}

/** Версия текста согласий: меняешь текст на странице — меняй версию (она пишется в consents участника). */
export const CONSENT_VERSION = 'trn-2026-10-20';
export const PRIVACY_URL = 'https://app.lootarena.ru/legal/privacy/index.html';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ответ разбирают типизированные обёртки ниже
async function post(body: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${API_URL}/public/tournament`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
}

export const viewTournament = async (token: string, opts: { invite?: string | null; etag?: string | null } = {}): Promise<ViewResult> => {
    try {
        const r = await post({ action: 'view', token, invite: opts.invite || undefined, etag: opts.etag || undefined });
        return r && typeof r === 'object' ? r : { ok: false, error: 'network' };
    } catch {
        return { ok: false, error: 'network' };
    }
};

export interface PersonForm {
    nick: string;
    phone: string;
    age: 'adult' | 'minor';
    birth_year?: string;
    level?: 'novice' | 'amateur' | 'experienced' | 'pro';
    consents: { pd: boolean; rules: boolean; show_nick: boolean; marketing: boolean };
    hp?: string;
    form_ms?: number;
    captcha_token?: string;
}

export const registerTournament = async (
    token: string,
    mode: 'solo' | 'party' | 'team',
    person: PersonForm,
    extra: { party_size?: number; team_name?: string; utm?: Record<string, string> } = {},
): Promise<RegisterResult> => {
    try {
        return await post({
            action: 'register', token, mode, ...extra, ...person,
            age: person.age === 'adult' ? 'adult' : undefined, consent_version: CONSENT_VERSION,
        });
    } catch {
        return { ok: false, error: 'network' };
    }
};

export const joinTournament = async (token: string, inviteCode: string, person: PersonForm): Promise<RegisterResult> => {
    try {
        return await post({
            action: 'join', token, invite_code: inviteCode, ...person,
            age: person.age === 'adult' ? 'adult' : undefined, consent_version: CONSENT_VERSION,
        });
    } catch {
        return { ok: false, error: 'network' };
    }
};

export interface ConfirmState {
    confirmed: boolean;
    /** Ссылка на бота: /start link_<токен> — бот попросит «Поделиться номером». */
    link?: string;
    expires_at?: string;
    /** Бот открыт и ждёт контакт. */
    waiting_contact?: boolean;
    /** Итог последней попытки: phone_mismatch — номер в Telegram не совпал. */
    result?: string | null;
}

/** Подтверждение номера заявки в Telegram: issue — получить ссылку, иначе — узнать статус. Код — код чек-ина участника. */
export const confirmPhone = async (token: string, code: string, issue: boolean): Promise<{ ok: boolean; error?: string; data?: ConfirmState }> => {
    try {
        const r = await post({ action: issue ? 'confirm_issue' : 'confirm_status', token, code });
        return r && typeof r === 'object' ? r : { ok: false, error: 'network' };
    } catch {
        return { ok: false, error: 'network' };
    }
};

export interface WithdrawInfo {
    status: 'active' | 'withdrawn' | 'already_withdrawn';
    title?: string;
    nick?: string;
    kind?: 'solo' | 'party' | 'team';
    team_name?: string | null;
    /** Снимется вся заявка (капитан или одиночка) или только этот игрок. */
    whole_entry?: boolean;
    members?: number;
    waitlist?: boolean;
    promoted?: number;
}

/** «Не смогу прийти» по коду чек-ина: confirm=false — что будет снято, true — снять. */
export const withdrawTournament = async (token: string, code: string, confirm: boolean): Promise<{ ok: boolean; error?: string; data?: WithdrawInfo }> => {
    try {
        const r = await post({ action: 'withdraw', token, code, confirm });
        return r && typeof r === 'object' ? r : { ok: false, error: 'network' };
    } catch {
        return { ok: false, error: 'network' };
    }
};

/** Отказ сервера — словами человека. */
export const errorText = (code?: string): string => ({
    not_found: 'Турнир не найден — проверьте ссылку',
    closed: 'Запись на турнир закрыта',
    too_many_requests: 'Слишком много попыток. Попробуйте через 10 минут',
    captcha: 'Подтвердите, что вы не робот',
    bad_nick: 'Укажите ник — от 1 до 32 символов',
    bad_phone: 'Проверьте номер телефона',
    consent_required: 'Нужно согласие на обработку данных и с правилами турнира',
    age_required: 'Укажите год рождения',
    age_restricted: 'Турнир только для игроков старше 18 лет',
    bad_party_size: 'В пати — 2 или 3 игрока',
    bad_mode: 'Этот способ записи здесь недоступен',
    team_name_required: 'Укажите название команды — до 40 символов',
    bad_code: 'Код приглашения не подходит — попросите у капитана новую ссылку',
    team_full: 'В этой команде уже нет мест',
    bad_request: 'Проверьте поля формы',
    network: 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз',
} as Record<string, string>)[code || ''] || 'Не получилось — попробуйте ещё раз';

/** Время турнира по часам клуба: POSIX '-03' → Etc/GMT-3. */
export const clubTz = (tz?: string | null): string | undefined => {
    const m = /^([+-]?)(\d{1,2})$/.exec(String(tz || '').trim());
    if (!m) return undefined;
    const n = Number(m[2]);
    return `Etc/GMT${m[1] === '-' ? '-' : '+'}${n}`;
};

export const formatStart = (iso: string | null, tz?: string | null): string => {
    if (!iso) return 'дата уточняется';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'дата уточняется';
    const zone = clubTz(tz);
    const day = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', ...(zone ? { timeZone: zone } : {}) });
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', ...(zone ? { timeZone: zone } : {}) });
    return `${day}, ${time}`;
};
