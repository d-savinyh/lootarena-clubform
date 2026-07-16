import React from 'react';
import { createPortal } from 'react-dom';
import type { LeadGift, GiftStatus } from '../utils/api';

interface SuccessScreenProps {
    clubName: string;
    brandColor: string;
    address: string;
    onClose?: () => void;
    gift?: LeadGift | null;
    appUrl?: string;
    giftStatus?: GiftStatus;
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

const giftSummary = (gift: LeadGift): string => {
    const t = gift.reward_text?.trim();
    if (t) return t;
    const amt = gift.reward_meta?.bonus_amount;
    if (gift.reward_type === 'BONUSES' && amt) return `${amt} бонусов`;
    if (gift.reward_type === 'MONEY' && amt) return `${amt} ₽`;
    return 'Подарок';
};

const SuccessScreen: React.FC<SuccessScreenProps> = ({ clubName, brandColor, address, onClose, gift, appUrl, giftStatus, onEvent }) => {
    const mapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
    // Подарок показываем, только если он реально положен этому гостю (inventory/reserved).
    // Если giftStatus='none' (форма без подарка ИЛИ гость не подходит под условие) — экран «Вы записаны».
    const showGift = !!gift && giftStatus !== 'none';
    const inInventory = giftStatus === 'inventory';

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
                {/* Иконка успеха */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center animate-float text-5xl"
                            style={{ backgroundColor: `${brandColor}12` }}
                        >
                            {showGift ? (
                                <span>{gift!.reward_icon || '🎁'}</span>
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
                        {/* Заголовок зависит от того, выдан ли подарок сразу или забронирован */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-white mb-4">
                                {inInventory ? 'Подарок уже в инвентаре!' : 'Подарок забронирован!'}
                            </h2>
                            <p className="text-lg text-white/45 leading-relaxed">
                                {inInventory ? (
                                    <>Открой приложение <span className="text-white font-bold">Loot Arena</span> — подарок уже лежит в твоём инвентаре.</>
                                ) : (
                                    <>Забери его в приложении <span className="text-white font-bold">Loot Arena</span> — зарегистрируйся по своему номеру, и подарок уже будет ждать в инвентаре.</>
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

                        {/* Кнопка — в приложение. href оставлен для семантики и ПКМ «копировать адрес»,
                            но реальное открытие идёт через openExternal (см. коммент к хелперу). */}
                        <a
                            href={appUrl || 'https://app.lootarena.ru'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => openExternal(e, appUrl || 'https://app.lootarena.ru', 'success_app', onEvent)}
                            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-black font-black text-base mb-3 transition-transform hover:scale-[1.02] active:scale-[0.97]"
                            style={{ backgroundColor: brandColor }}
                        >
                            {inInventory ? 'Открыть приложение' : 'Забрать в приложении'}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </>
                ) : (
                    <>
                        {/* Записаны (форма без подарка ИЛИ гость не подходит под условие подарка) */}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-white mb-4">Вы записаны!</h2>
                            <p className="text-lg text-white/45 leading-relaxed">
                                Мы свяжемся с вами в ближайшее время.<br />
                                Ждём вас в <span className="text-white font-bold">{clubName}</span>!
                            </p>
                        </div>
                    </>
                )}

                {/* Маршрут */}
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => openExternal(e, mapsUrl, 'success_maps', onEvent)}
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl glass-light text-white/60 hover:text-white hover:bg-white/8 active:bg-white/12 active:scale-[0.98] transition-all text-sm font-bold mb-3"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Построить маршрут
                </a>

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
