import type { LeadGift } from '../utils/api';
import './GiftPoster.css';

/**
 * Подарок формы — постер 2.0 (тот же вид, что подарок в приложении Loot Arena: App2GiftPoster). Гость оставляет заявку
 * и потом находит этот подарок в инвентаре приложения — карточка должна выглядеть одинаково.
 *
 * Чего у формы нет по сравнению с приложением: «Стиля клуба» (цвет света, узор, маскот) — свет берётся из цвета
 * формы, персонаж — фирменный волк Loot Arena; фото товара-подарка — вместо фото в плитке название товара.
 */
type Kind = 'amount' | 'name';

const CURRENCY_SIGN: Record<string, string> = { RUB: '₽', KZT: '₸', BYN: 'Br', UZS: 'сум', KGS: 'сом' };

/** «500 бонусов» → { 500, бонусов }; «1 500 ₽» → { 1 500, ₽ }. Не сумма — null. */
const splitAmount = (title: string): { value: string; unit: string } | null => {
    const m = /^\+?\s*([\d\s  ]*\d)\s*(\S.*)$/.exec(title.trim());
    return m ? { value: m[1].replace(/[  ]/g, ' ').trim(), unit: m[2] } : null;
};

export const giftAmountOf = (gift: LeadGift, currency?: string): { value: string; unit: string } | null => {
    const type = String(gift.reward_type || '').toUpperCase();
    if (type !== 'BONUSES' && type !== 'MONEY') return null;
    const bonus = Number(gift.reward_meta?.bonus_amount);
    // Бонусы в приложении — «Б» (как на постере подарка в инвентаре).
    if (type === 'BONUSES' && Number.isFinite(bonus) && bonus > 0) return { value: bonus.toLocaleString('ru-RU'), unit: 'Б' };
    const parsed = gift.reward_text ? splitAmount(gift.reward_text) : null;
    if (!parsed) return null;
    if (type === 'BONUSES' && /^бонус/i.test(parsed.unit)) return { value: parsed.value, unit: 'Б' };
    if (type === 'MONEY' && /^(руб|₽)/i.test(parsed.unit)) return { value: parsed.value, unit: CURRENCY_SIGN[currency || 'RUB'] || '₽' };
    return parsed;
};

export const giftTitleOf = (gift: LeadGift): string =>
    gift.reward_text || (gift.reward_meta?.bonus_amount ? `${gift.reward_meta.bonus_amount} бонусов` : 'Подарок');

interface Props {
    gift: LeadGift;
    clubName: string;
    clubLogo?: string | null;
    /** Цвет клуба из настроек формы — свет за персонажем и плитка подарка. */
    accent: string;
    currency?: string;
    /** Сетевая форма до выбора филиала: номинал у филиалов разный — суммы не обещаем. */
    unknown?: boolean;
    /** Пояснение под названием («Выберите клуб — покажем ваш подарок», «откроется через …»). */
    hint?: string | null;
    className?: string;
}

const GiftPoster: React.FC<Props> = ({ gift, clubName, clubLogo, accent, currency, unknown = false, hint, className }) => {
    const amount = unknown ? null : giftAmountOf(gift, currency);
    const kind: Kind = amount ? 'amount' : 'name';
    const type = String(gift.reward_type || '').toUpperCase();
    const title = giftTitleOf(gift);
    // Название — что за подарок: у суммы «Бонусы клуба» / «Деньги на счёт клуба», у остального — сама награда.
    const name = unknown ? 'Зависит от клуба'
        : kind === 'amount' ? (type === 'MONEY' ? 'Деньги на счёт клуба' : 'Бонусы клуба') : title;
    const days = Number(gift.expires_in_days);
    const when = Number.isFinite(days) && days > 0 ? `действует ${days} дн.` : null;
    return (
        // data-ad-area: карточка подарка — часть рекламы, по ней считается площадь надписи о вреде энергетиков.
        <div data-ad-area="gift" className={`cf-gp surface-always-dark animate-fade-in${className ? ` ${className}` : ''}`} style={{ '--club': accent } as React.CSSProperties}>
            <span className="cf-gp-glow" aria-hidden="true" />
            <img className="cf-gp-art" src="/brand/series/wolf-headset-wave.webp" alt="" draggable={false} />
            <span className="cf-gp-plate" aria-hidden="true">
                <span className="cf-gp-tile" />
                {amount ? (
                    <b className={`cf-gp-count${amount.unit.length > 3 ? ' is-long' : ''}`}><span>+{amount.value}</span><small>{amount.unit}</small></b>
                ) : unknown ? (
                    <b className="cf-gp-word">?</b>
                ) : gift.reward_icon ? (
                    <span className="cf-gp-icon">{gift.reward_icon}</span>
                ) : (
                    <b className="cf-gp-word is-name">{title}</b>
                )}
            </span>
            {when && !unknown && <span className="cf-gp-when">{when}</span>}
            <span className="cf-gp-body">
                <span className="cf-gp-club">
                    <span className="cf-gp-logo">{clubLogo ? <img src={clubLogo} alt="" /> : clubName.slice(0, 1)}</span>
                    <span>Подарок за заявку · {clubName}</span>
                </span>
                <b className="cf-gp-title">{name}</b>
                {hint && <span className="cf-gp-hint">{hint}</span>}
            </span>
        </div>
    );
};

export default GiftPoster;
