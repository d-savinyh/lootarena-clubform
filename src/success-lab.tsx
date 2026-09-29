// Стенд экрана успеха: все ветки SuccessScreen без отправки заявок в прод.
// Открывается по /success-lab.html?s=<сценарий> в dev-режиме, в прод-сборку не попадает.
// Кнопки магазинов видны только с мобильным UA (resize_window mobile → Android).
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SuccessScreen from './components/SuccessScreen';
import type { LeadGift } from './utils/api';
import './index.css';

const GIFT: LeadGift = { reward_type: 'BONUSES', reward_text: '777 бонусов', reward_icon: '💎', reward_meta: { bonus_amount: 777 }, expires_in_days: '14' };

type Scenario = Omit<React.ComponentProps<typeof SuccessScreen>, 'clubName' | 'brandColor' | 'address'>;

const SCENARIOS: Record<string, Scenario> = {
    granted: { gift: GIFT, giftStatus: 'granted', giftReason: 'granted' },
    granted_repeat: { gift: GIFT, giftStatus: 'granted', giftReason: 'duplicate', duplicate: true },
    unclaimed: { gift: GIFT, giftStatus: 'none', giftReason: 'not_eligible', prevGiftState: 'unclaimed', ineligibleBy: 'new_club', clubPromoCount: 27 },
    already_gifted: { gift: GIFT, giftStatus: 'none', giftReason: 'already_gifted', clubPromoCount: 27 },
    not_eligible_club: { gift: GIFT, giftStatus: 'none', giftReason: 'not_eligible', ineligibleBy: 'new_club', clubPromoCount: 27 },
    not_eligible_app: { gift: GIFT, giftStatus: 'none', giftReason: 'not_eligible', ineligibleBy: 'new_app', clubPromoCount: 1 },
    not_eligible_old_server: { gift: GIFT, giftStatus: 'none', giftReason: 'not_eligible' },
    no_gift: { gift: null, giftStatus: 'none', giftReason: 'no_gift', clubPromoCount: 3 },
};

const Lab = () => {
    const initial = new URLSearchParams(window.location.search).get('s') || 'unclaimed';
    const [key, setKey] = useState(SCENARIOS[initial] ? initial : 'unclaimed');
    return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6, background: '#222' }}>
                {Object.keys(SCENARIOS).map(k => (
                    <button key={k} data-testid={`s-${k}`} onClick={() => setKey(k)}
                        style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 6px', color: k === key ? '#000' : '#fff', background: k === key ? '#30D058' : '#444', borderRadius: 4 }}>
                        {k}
                    </button>
                ))}
            </div>
            <SuccessScreen
                key={key}
                clubName="Cyber X Community"
                brandColor="#30D058"
                address="Тюмень, ул. Республики, 1"
                appUrl="https://app.lootarena.ru/?phone=%2B79000000000&ref=clubform"
                onClose={() => {}}
                onEvent={(t, m) => console.log('event', t, m)}
                {...SCENARIOS[key]}
            />
        </div>
    );
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Lab />
    </StrictMode>
);
