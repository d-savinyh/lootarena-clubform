import React from 'react';
import type { LeadGift, GiftStatus } from '../utils/api';

interface SuccessScreenProps {
    clubName: string;
    brandColor: string;
    address: string;
    onClose?: () => void;
    gift?: LeadGift | null;
    appUrl?: string;
    giftStatus?: GiftStatus;
}

const giftSummary = (gift: LeadGift): string => {
    const t = gift.reward_text?.trim();
    if (t) return t;
    const amt = gift.reward_meta?.bonus_amount;
    if (gift.reward_type === 'BONUSES' && amt) return `${amt} бонусов`;
    if (gift.reward_type === 'MONEY' && amt) return `${amt} ₽`;
    return 'Подарок';
};

const SuccessScreen: React.FC<SuccessScreenProps> = ({ clubName, brandColor, address, onClose, gift, appUrl, giftStatus }) => {
    const mapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
    // Подарок показываем, только если он реально положен этому гостю (inventory/reserved).
    // Если giftStatus='none' (форма без подарка ИЛИ гость не подходит под условие) — экран «Вы записаны».
    const showGift = !!gift && giftStatus !== 'none';
    const inInventory = giftStatus === 'inventory';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
            {/* Фоновый glow */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06]"
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

                        {/* Кнопка — в приложение */}
                        <a
                            href={appUrl || 'https://app.lootarena.ru'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-black font-black text-base mb-3 transition-transform hover:scale-[1.02]"
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
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl glass-light text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm font-bold mb-3"
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
                        className="w-full py-3 text-sm text-white/25 hover:text-white/50 transition-colors"
                    >
                        Вернуться
                    </button>
                )}
            </div>
        </div>
    );
};

export default SuccessScreen;
