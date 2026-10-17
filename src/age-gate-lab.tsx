// Стенд формы 18+ (энергетик, безалкогольное пиво): вопрос о возрасте, «Нет», надпись о вреде, «0%».
// Открывается по /age-gate-lab.html?s=<сценарий> в dev-режиме, в прод-сборку не попадает.
// Сеть подменена: fetch к /public/clubform отвечает фикстурой, как ответит n8n после правки 17.10.2026 —
// форму 18+ без with_adult: true сервер не отдаёт (пустой ответ). sendBeacon заглушён: события в прод не уходят.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import LandingPage from './pages/LandingPage';
import type { ClubLanding, LeadAgeGate } from './utils/api';
import './index.css';

type Scenario = { gate: LeadAgeGate | null; title: string; description: string; gift: string; network?: boolean; omitKey?: boolean };

const SCENARIOS: Record<string, Scenario> = {
    energy: { gate: { minAge: 18, healthWarning: true, nonalcMark: false }, title: 'Энергетик Gorilla в подарок новичкам', description: 'Оставьте заявку, приходите в клуб и заберите банку Gorilla на кассе к первой игре.', gift: 'Энергетик Gorilla 0,5 л' },
    beer: { gate: { minAge: 18, healthWarning: false, nonalcMark: true }, title: 'Безалкогольное пиво к первой игре', description: 'Баночка безалкогольного пива Bud 0,0 в подарок к первому часу игры.', gift: 'Безалкогольное пиво Bud 0,0' },
    both: { gate: { minAge: 18, healthWarning: true, nonalcMark: true }, title: 'Энергетик или безалкогольное пиво на выбор', description: 'Выберите на кассе: энергетик Adrenaline Rush или безалкогольное пиво Bud 0,0.', gift: 'Напиток на выбор' },
    kz21: { gate: { minAge: 21, healthWarning: true, nonalcMark: false }, title: 'Энергетик в подарок', description: 'Энергетик к первой игре в клубе.', gift: 'Энергетик Burn 0,45 л' },
    network: { gate: { minAge: 18, healthWarning: true, nonalcMark: false }, title: 'Энергетик в подарок в любом клубе сети', description: 'Выберите клуб — подарок ждёт на кассе.', gift: 'Энергетик Gorilla', network: true },
    plain: { gate: null, title: 'Час игры бесплатно', description: 'Оставьте заявку и получите час игры в подарок.', gift: '1 час игры бесплатно' },
    old_server: { gate: null, title: 'Час игры бесплатно', description: 'Ответ сервера до правки: ключа ageGate нет вовсе.', gift: '1 час игры бесплатно', omitKey: true },
};

const key = new URLSearchParams(window.location.search).get('s') || 'energy';
const sc = SCENARIOS[key] || SCENARIOS.energy;

const landing = (): ClubLanding => {
    const gift = { reward_type: 'MANUAL' as const, reward_text: sc.gift, reward_icon: '🥤', expires_in_days: '14' };
    const form: ClubLanding['form'] = {
        id: '00000000-0000-4000-8000-00000000a6e0', slug: 'age-gate-lab', offerType: 'custom',
        offerTitle: sc.title, offerDescription: sc.description, offerTerms: 'Подарок выдаётся на кассе по QR из приложения Loot Arena.',
        offerBadge: 'Новичкам', brandColor: '#30D158', gift, variant: 'A', coverImage: null, ctaText: null, tracking: null,
        isNetwork: !!sc.network,
        clubs: sc.network ? [
            { id: 'c1', name: 'Клуб на Ленина', city: 'Тюмень', address: 'ул. Ленина, 1', currency: 'RUB', gift },
            { id: 'c2', name: 'Клуб на Мира', city: 'Тюмень', address: 'ул. Мира, 5', currency: 'RUB', gift: { ...gift, reward_text: 'Энергетик Adrenaline Rush' } },
        ] : null,
    };
    if (!sc.omitKey) form.ageGate = sc.gate;
    return {
        club: { name: 'Cyber X Community', address: 'Тюмень, ул. Республики, 1', workingHours: 'Круглосуточно', currency: 'RUB' },
        form,
    };
};

const realFetch = window.fetch.bind(window);
const calls: unknown[] = [];
Object.assign(window, { __labCalls: calls });
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!url.includes('/public/clubform')) return realFetch(input, init);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    calls.push(body);
    const json = (v: unknown) => new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (url.includes('clubform-event')) return json({ ok: true });
    if (body.action === 'get_landing') {
        // Как n8n после правки: форма 18+ только для with_adult === true, иначе — пустой ответ.
        if (sc.gate && body.with_adult !== true) return new Response('', { status: 200 });
        return json([landing()]);
    }
    if (body.action === 'submit_lead') return json([{ ok: true, gift_status: 'granted', gift_reason: 'granted', club_promo_count: 3 }]);
    return json([{}]);
};
navigator.sendBeacon = () => true;

const bar = (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6, background: '#222' }}>
        {Object.keys(SCENARIOS).map(k => (
            <a key={k} href={`?s=${k}`} data-testid={`s-${k}`}
                style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 6px', color: k === key ? '#000' : '#fff', background: k === key ? '#30D058' : '#444', borderRadius: 4, textDecoration: 'none' }}>
                {k}
            </a>
        ))}
        <button data-testid="reset" onClick={() => { sessionStorage.clear(); location.reload(); }}
            style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 6px', color: '#fff', background: '#a33', borderRadius: 4 }}>
            сбросить ответ
        </button>
    </div>
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LandingPage slug="age-gate-lab" />
        {bar}
    </StrictMode>
);
