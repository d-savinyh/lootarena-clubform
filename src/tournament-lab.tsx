/**
 * Стенд публичной страницы турнира на моках. Сеть к n8n не уходит: перехват /public/tournament.
 *   /tournament-lab.html?s=open|party|invite|full|captcha|live|finished|closed|notfound
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import TournamentPage from './pages/TournamentPage';

const q = new URLSearchParams(location.search);
const sc = q.get('s') || 'open';
const TOKEN = 'a'.repeat(32);

const teams = ['Пятый элемент', 'Ночной дозор', 'Без шансов', 'Кибер-пенсия'].map((name, i) => ({ id: `t${i}`, name, seed: i + 1, place: sc === 'finished' ? i + 1 : null, status: 'active' }));
const m = (id: string, round: number, slot: number, a: string | null, b: string | null, status: string, win: string | null, score: Array<{ a: number; b: number }> | null) =>
    ({ id, bracket: 'upper', round, slot, best_of: round === 2 ? 3 : 1, status, team_a_id: a, team_b_id: b, winner_team_id: win, score });

const data = () => ({
    club: { name: 'Cyber X Community', avatar_url: null, cover_url: null, address: 'ул. Республики, 1', city: 'Тюмень', currency_code: 'RUB', timezone: '-05' },
    tournament: {
        title: 'Пятничный кубок CS2 — самый длинный турнир сезона с очень длинным названием', game_key: 'cs2', game_title: null, format: 'se',
        team_size: sc === 'party' || sc === 'invite' ? 5 : 5, entry_mode: 'mix', capacity: 40, capacity_unit: 'players',
        best_of: { default: 1, final: 3 }, third_place_match: false, entry_fee: 300,
        starts_at: new Date(Date.now() + 3 * 864e5).toISOString(), registration_closes_at: null, checkin_opens_at: null,
        status: sc === 'live' ? 'live' : sc === 'finished' ? 'finished' : 'published',
        rules: 'Неявка: ждём 15 минут, затем техническое поражение.\nНа карту — не больше часа.',
        age_policy: sc === 'party' ? 'minors_allowed' : 'adults', stream_url: 'https://twitch.tv/example',
        prizes: [{ place_from: 1, place_to: 1, text: '5000 бонусов' }, { place_from: 2, place_to: 3, text: 'Футболка клуба' }],
        nominations: [{ title: 'Лучший игрок турнира', prize: '1000 бонусов' }], participation_prize: '100 бонусов',
        confirm_required: q.get('confirm') === 'required',
    },
    counts: { used: sc === 'full' ? 40 : 31, waitlist: sc === 'full' ? 3 : 0 },
    registration_open: sc !== 'closed',
    teams: sc === 'live' || sc === 'finished' ? teams : null,
    matches: sc === 'live' || sc === 'finished' ? [
        m('m1', 1, 1, 't0', 't3', 'confirmed', 't0', [{ a: 13, b: 8 }]),
        m('m2', 1, 2, 't1', 't2', sc === 'finished' ? 'confirmed' : 'ready', sc === 'finished' ? 't1' : null, sc === 'finished' ? [{ a: 13, b: 11 }] : null),
        m('m3', 2, 1, 't0', sc === 'finished' ? 't1' : null, sc === 'finished' ? 'confirmed' : 'pending', sc === 'finished' ? 't0' : null, sc === 'finished' ? [{ a: 13, b: 9 }, { a: 13, b: 7 }] : null),
    ] : null,
    invite: sc === 'invite' ? { valid: true, kind: 'party', team_name: null, members: 1, size: 3 } : null,
});

const json = (v: unknown) => new Response(JSON.stringify([v]), { status: 200, headers: { 'Content-Type': 'application/json' } });
const realFetch = window.fetch.bind(window);
let captchaAsked = false;
let confirmPolls = 0;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.includes('/public/')) return realFetch(input, init);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const w = window as unknown as { __labCalls?: unknown[] };
    w.__labCalls = [...(w.__labCalls || []), body];
    await new Promise((r) => setTimeout(r, 250));
    if (body.action === 'view') return sc === 'notfound' ? json({ ok: false, error: 'not_found' }) : json({ ok: true, etag: 'e1', data: data() });
    if (sc === 'captcha' && !captchaAsked) { captchaAsked = true; return json({ ok: false, error: 'captcha', requireCaptcha: true, captchaKey: 'lab' }); }
    if (body.action === 'register') {
        if (sc === 'full') return json({ ok: true, status: 'waitlist', waitlist_pos: 4, checkin_code: '873a760e28d34320507d', kind: 'solo', members: 1, size: 1 });
        if (body.mode === 'party') return json({ ok: true, status: 'registered', number: 32, checkin_code: '873a760e28d34320507d', invite_code: '4c0231842d9d', kind: 'party', members: 1, size: body.party_size });
        return json({ ok: true, status: 'registered', number: 32, checkin_code: '873a760e28d34320507d', kind: 'solo', members: 1, size: 1 });
    }
    // Подтверждение номера: ссылка на бота; ?confirm=done — статус «подтверждён» после двух опросов.
    if (body.action === 'confirm_issue') return json({ ok: true, data: { confirmed: false, link: '#bot-opened', expires_at: new Date(Date.now() + 30 * 6e4).toISOString() } });
    if (body.action === 'confirm_status') {
        confirmPolls += 1;
        const done = q.get('confirm') === 'done' && confirmPolls > 2;
        return json({ ok: true, data: { confirmed: done, waiting_contact: !done && confirmPolls > 1, result: q.get('confirm') === 'mismatch' ? 'phone_mismatch' : null } });
    }
    if (body.action === 'withdraw') return json(body.confirm
        ? { ok: true, data: { status: 'withdrawn', whole_entry: true, promoted: 1 } }
        : { ok: true, data: { status: 'active', title: 'Пятничный кубок', nick: 'Шторм_капитан', kind: 'party', team_name: 'Шторм', whole_entry: true, members: 3 } });
    if (body.action === 'join') return json({ ok: true, status: 'joined', checkin_code: '1111aaaa2222bbbb3333', kind: 'party', members: 2, size: 3 });
    return json({ ok: false, error: 'unknown_action' });
};

if (sc === 'invite' && !q.get('team')) history.replaceState(null, '', `${location.pathname}?s=invite&team=4c0231842d9d`);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <TournamentPage token={TOKEN} />
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6, background: '#222' }}>
            {['open', 'party', 'invite', 'full', 'captcha', 'live', 'finished', 'closed', 'notfound'].map((k) => (
                <a key={k} href={`?s=${k}`} style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 6px', color: k === sc ? '#000' : '#fff', background: k === sc ? '#30D058' : '#444', borderRadius: 4, textDecoration: 'none' }}>{k}</a>
            ))}
        </div>
    </StrictMode>,
);
