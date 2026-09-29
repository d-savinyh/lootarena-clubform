import React from 'react';
import { createPortal } from 'react-dom';
import type { LeadGift, GiftStatus, GiftReason, IneligibleBy, PrevGiftState } from '../utils/api';

interface SuccessScreenProps {
    clubName: string;
    brandColor: string;
    address: string;
    onClose?: () => void;
    gift?: LeadGift | null;
    appUrl?: string;
    giftStatus?: GiftStatus;
    giftReason?: GiftReason;
    /** Заявка уже была отправлена только что (дедуп 30 минут) — новой строки не создалось. */
    duplicate?: boolean;
    /** Подарок прошлой заявки этой формы ещё не забран (лежит в инвентаре или ждёт регистрации). */
    prevGiftState?: PrevGiftState;
    /** Правило формы, под которое гость не подошёл: «новым для клуба» / «новым в приложении» / «новым для сети». */
    ineligibleBy?: IneligibleBy;
    /** Сколько миссий клуба открыто в Loot Arena прямо сейчас (0 — не знаем или нет). */
    clubPromoCount?: number;
    onEvent?: (type: string, meta?: Record<string, any>) => void;
}

/**
 * Устойчивое открытие внешней ссылки.
 *
 * В клубном игровом шелле (встроенный WebView2, UA Chrome/119 + Edg/119.0.0.0)
 * голый `<a target="_blank">` мёртв: default action уходит хосту как запрос нового
 * окна (NewWindowRequested), хост его молча отклоняет — ни перехода, ни ошибки.
 * При этом обычные React-onClick там работают (в телеметрии 294 cta_click).
 *
 * Поэтому открываем окно из JS: результат различим (null = хост отказал), и только
 * при явном отказе уходим в текущую вкладку. Безусловный same-tab делать нельзя:
 * если шелл режет и навигацию, мы снесём экран успеха (это state, не роут) и гость
 * останется без пути назад при уже выданном подарке.
 */
const openExternal = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
    where: string,
    onEvent?: (type: string, meta?: Record<string, any>) => void,
) => {
    // Ctrl/Cmd/Shift-клик — отдаём браузеру, не угоняем.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    onEvent?.('app_redirect_click', { where });

    // Гасим нативный _blank всегда — иначе при удачном window.open откроется два окна.
    e.preventDefault();

    let w: Window | null = null;
    try {
        // Без 'noopener': с этим флагом window.open по спеке возвращает null даже
        // при успехе — детект отказа сломался бы. Chromium и так рвёт opener для _blank.
        w = window.open(url, '_blank');
    } catch {
        w = null;
    }

    if (w) return;

    // Хост отказал в новом окне — единственный оставшийся путь.
    window.location.assign(url);
};

const APP_STORE_URL = 'https://apps.apple.com/app/id6778439237';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=ru.lootarena.app';

/**
 * Магазин приложений по устройству гостя — сразу, без промежуточной страницы.
 *
 * Страницу lootarena.ru/links целиком не даём: там же вход через Telegram и MAX, а такие
 * аккаунты создаются БЕЗ телефона (за 60 дней до 29.09.2026 — 674 штуки, номер у 0).
 * Подарок лид-формы и инвентарь привязаны к номеру, так что в таком аккаунте гость не
 * найдёт ни того, ни другого и решит, что его обманули. Приложения iOS/Android входят по
 * номеру. На компьютере и в клубном шелле (WebView2 на Windows) магазина нет — только веб.
 */
const detectStore = (): { url: string; label: string; where: string } | null => {
    if (typeof navigator === 'undefined') return null;
    const ua = navigator.userAgent || '';
    // iPadOS 13+ представляется маком — выдаёт его только тач.
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (isIOS) return { url: APP_STORE_URL, label: 'App Store', where: 'success_store_ios' };
    if (/Android/i.test(ua)) return { url: GOOGLE_PLAY_URL, label: 'Google Play', where: 'success_store_android' };
    return null;
};

const plural = (n: number, one: string, few: string, many: string): string => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
};

const giftSummary = (gift: LeadGift): string => {
    const t = gift.reward_text?.trim();
    if (t) return t;
    const amt = gift.reward_meta?.bonus_amount;
    if (gift.reward_type === 'BONUSES' && amt) return `${amt} бонусов`;
    if (gift.reward_type === 'MONEY' && amt) return `${amt} ₽`;
    return 'Подарок';
};

const secondaryBtn = 'flex items-center justify-center gap-2 w-full py-4 rounded-2xl glass-light text-white/60 hover:text-white hover:bg-white/8 active:bg-white/12 active:scale-[0.98] transition-all text-sm font-bold';

const SuccessScreen: React.FC<SuccessScreenProps> = ({ clubName, brandColor, address, onClose, gift, appUrl, giftStatus, giftReason, duplicate, prevGiftState, ineligibleBy, clubPromoCount, onEvent }) => {
    const mapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
    const app = appUrl || 'https://app.lootarena.ru';
    const store = detectStore();

    // Подарок показываем, только если он реально положен этому гостю.
    // «Уже в инвентаре» и «ждёт регистрации» НЕ различаем: разница выдаёт, есть ли у номера
    // аккаунт, а номер в форме может быть чужим. «Зайдите по номеру» верно для обоих.
    const showGift = !!gift && giftStatus !== 'none';
    // Повторная отправка в пределах 30 минут: заявка одна, подарок за неё уже решён.
    const repeatedNow = !!duplicate;
    // Подарок ПРОШЛОЙ заявки этой формы ещё не забран. Бьёт любую причину отказа: гостю,
    // который с первой заявки успел поиграть в клубе, форма отвечала «вы у нас уже играли»,
    // хотя подарок лежал в его инвентаре (фидбек Cyber X 29.09; за 60 дней таких 616 из
    // 2 732 заявок без подарка). Говорим только «не забран» — без суммы и без содержимого.
    const unclaimed = !showGift && prevGiftState === 'unclaimed';
    // Подарок по номеру уже выдавался. Судьбу (потрачен / сгорел) не называем: это факт о
    // человеке, а не о заявке. Без объяснения гость решит, что заявка не прошла, и отправит снова.
    const alreadyGifted = !showGift && !unclaimed && giftReason === 'already_gifted';
    // Гость не подошёл под условие формы. Причину называем по ПРАВИЛУ формы.
    const notEligible = !showGift && !unclaimed && giftReason === 'not_eligible' && !!gift;

    const primary = showGift
        ? { label: 'Забрать в Loot Arena', where: 'success_app' }
        : unclaimed
            ? { label: 'Забрать подарок', where: 'success_app_unclaimed' }
            : { label: 'Открыть Loot Arena', where: 'success_app_nogift' };

    // Без подарка гость всё равно получает дорогу в приложение (просьба клуба): миссии клуба
    // — факт о КЛУБЕ, называть можно; про его инвентарь — только «загляните».
    const promoCount = Math.max(0, clubPromoCount || 0);
    const promoCard = (
        <div className="glass rounded-[24px] p-5 mb-5 flex items-start gap-4 text-left">
            <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${brandColor}18` }}
            >
                🎮
            </div>
            <div className="min-w-0">
                <div className="text-base font-black text-white leading-snug">
                    {promoCount > 0
                        ? <>В Loot Arena у клуба {promoCount} {plural(promoCount, 'миссия', 'миссии', 'миссий')} с наградами</>
                        : <>Loot Arena — награды за игру в клубах</>}
                </div>
                <div className="text-sm text-white/45 mt-1 leading-relaxed">
                    Зайдите по номеру из заявки. Уже пользуетесь приложением? Загляните в инвентарь — награды клубов лежат там.
                </div>
            </div>
        </div>
    );

    const overlay = (
        // Прокручиваемый оверлей: на невысоких экранах контент выше вьюпорта —
        // overflow-y-auto + min-h-full позволяют доскроллить до нижних кнопок, иначе они уезжают за край.
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
            <div className="min-h-full flex items-center justify-center p-6">
                {/* Фоновый glow — чисто декоративный, не должен перехватывать клики */}
                <div
                    className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06]"
                    style={{ backgroundColor: brandColor }}
                />

                <div className="relative max-w-md w-full animate-scale-in">
                {/* Иконка */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center animate-float text-5xl"
                            style={{ backgroundColor: `${brandColor}12` }}
                        >
                            {showGift ? (
                                <span>{gift!.reward_icon || '🎁'}</span>
                            ) : unclaimed ? (
                                <span>🎁</span>
                            ) : (
                                <svg className="w-14 h-14" style={{ color: brandColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div
                            className="absolute -inset-6 rounded-full opacity-15 blur-3xl animate-glow-pulse"
                            style={{ backgroundColor: brandColor }}
                        />
                    </div>
                </div>

                {showGift ? (
                    <>
                        {/* При повторной отправке в пределах 30 минут заявка НЕ создаётся заново —
                            говорим об этом прямо, иначе экран выглядит как второй подарок. */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white mb-4">
                                {repeatedNow ? 'Заявка уже принята!' : 'Подарок ваш!'}
                            </h2>
                            <p className="text-lg text-white/45 leading-relaxed">
                                {repeatedNow ? (
                                    <>Вы отправили её только что — второй раз подарок не выдаётся. Он уже закреплён за вашим номером в <span className="text-white font-bold">Loot Arena</span>.</>
                                ) : (
                                    <>Зайдите в <span className="text-white font-bold">Loot Arena</span> по номеру из заявки — подарок будет ждать в инвентаре.</>
                                )}
                            </p>
                        </div>

                        {/* Карточка подарка */}
                        <div className="glass rounded-[24px] p-5 mb-5 flex items-center gap-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                                style={{ backgroundColor: `${brandColor}18` }}
                            >
                                {gift!.reward_icon || '🎁'}
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-black text-white truncate">{giftSummary(gift!)}</div>
                                {gift!.expires_in_days && (
                                    <div className="text-xs text-white/35 mt-0.5">Действует {gift!.expires_in_days} дн. после получения</div>
                                )}
                            </div>
                        </div>
                    </>
                ) : unclaimed ? (
                    <>
                        {/* Подарок прошлой заявки ждёт гостя: лежит в инвентаре или материализуется
                            при регистрации по номеру (у брони нет срока до регистрации). */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white mb-4">
                                {repeatedNow ? 'Заявка уже принята!' : 'Подарок уже ждёт вас!'}
                            </h2>
                            <p className="text-lg text-white/45 leading-relaxed">
                                Вы уже оставляли заявку по этой акции, и подарок за неё ещё не забран. Второй раз он не начисляется —
                                зайдите в <span className="text-white font-bold">Loot Arena</span> по номеру из заявки и заберите первый.
                            </p>
                        </div>
                    </>
                ) : alreadyGifted ? (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-black text-white mb-4">
                                {repeatedNow ? 'Заявка уже принята!' : 'Заявка принята!'}
                            </h2>
                            <p className="text-lg text-white/45 leading-relaxed">
                                Подарок по этой акции выдаётся один раз на номер, и на ваш номер он уже начислялся.
                                Ждём вас в <span className="text-white font-bold">{clubName}</span>!
                            </p>
                        </div>
                        {promoCard}
                    </>
                ) : notEligible ? (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-black text-white mb-4">
                                {repeatedNow ? 'Заявка уже принята!' : 'Заявка принята!'}
                            </h2>
                            <p className="text-lg text-white/45 leading-relaxed">
                                {ineligibleBy === 'new_club' ? (
                                    <>Этот подарок — для тех, кто ещё не был в <span className="text-white font-bold">{clubName}</span>, поэтому за эту заявку он не начисляется. Мы свяжемся с вами!</>
                                ) : ineligibleBy === 'new_network' ? (
                                    <>Этот подарок — для тех, кто ещё не был в клубах сети, поэтому за эту заявку он не начисляется.
                                        Мы свяжемся с вами, ждём в <span className="text-white font-bold">{clubName}</span>!</>
                                ) : ineligibleBy === 'new_app' ? (
                                    <>Этот подарок — для новых пользователей <span className="text-white font-bold">Loot Arena</span>, поэтому за эту заявку он не начисляется.
                                        Мы свяжемся с вами, ждём в клубе!</>
                                ) : (
                                    <>Этот подарок положен только новым гостям, поэтому за эту заявку он не начисляется.
                                        Мы свяжемся с вами, ждём в <span className="text-white font-bold">{clubName}</span>!</>
                                )}
                            </p>
                        </div>
                        {promoCard}
                    </>
                ) : (
                    <>
                        {/* Записаны (форма без подарка) */}
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-black text-white mb-4">
                                {repeatedNow ? 'Заявка уже принята!' : 'Вы записаны!'}
                            </h2>
                            <p className="text-lg text-white/45 leading-relaxed">
                                {repeatedNow
                                    ? <>Вы отправили её только что — повторно ничего заполнять не нужно.<br /></>
                                    : <>Мы свяжемся с вами в ближайшее время.<br /></>}
                                Ждём вас в <span className="text-white font-bold">{clubName}</span>!
                            </p>
                        </div>
                        {promoCard}
                    </>
                )}

                {/* В приложение — веб-версия с уже подставленным номером: до 21.08.2026, пока номер
                    не подставлялся, треть гостей с забронированным подарком отваливалась до SMS.
                    href оставлен для семантики и ПКМ «копировать адрес», открытие — через openExternal. */}
                <a
                    href={app}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => openExternal(e, app, primary.where, onEvent)}
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-black font-black text-base mb-3 transition-transform hover:scale-[1.02] active:scale-[0.97]"
                    style={{ backgroundColor: brandColor }}
                >
                    {primary.label}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </a>

                {/* Магазин приложений (только на телефоне) + маршрут */}
                <div className={store ? 'grid grid-cols-2 gap-3 mb-3' : 'mb-3'}>
                    {store && (
                        <a
                            href={store.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => openExternal(e, store.url, store.where, onEvent)}
                            className={secondaryBtn}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {store.label}
                        </a>
                    )}
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => openExternal(e, mapsUrl, 'success_maps', onEvent)}
                        className={secondaryBtn}
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {store ? 'Маршрут' : 'Построить маршрут'}
                    </a>
                </div>
                {store && (
                    // Подарок и инвентарь привязаны к номеру: вход по другому номеру — пустой аккаунт.
                    <p className="text-xs text-white/30 text-center mb-2">
                        Приложение Loot Arena — входите по номеру из заявки
                    </p>
                )}

                    {/* Назад */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-full py-3 text-sm text-white/25 hover:text-white/50 active:text-white/70 transition-colors"
                        >
                            Вернуться
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    // Рендерим в body через портал — так fixed-оверлей всегда привязан к вьюпорту
    // и не может оказаться «заперт» внутри трансформированного/позиционированного родителя.
    return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
};

export default SuccessScreen;
