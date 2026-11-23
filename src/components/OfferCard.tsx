import React from 'react';
import HealthWarning from './HealthWarning';
import GiftIcon from './GiftIcon';
import RichText from './RichText';
import type { GiftIconMode, OfferTextAlign, OfferTextSize } from '../utils/page';

interface OfferCardProps {
    title: string;
    description: string;
    terms?: string;
    badge?: string;
    brandColor: string;
    /** Десктопный стиль — крупная типографика */
    isDesktop?: boolean;
    /** В акции энергетик: надпись о вреде на 7,5% площади рекламы (ageGate.healthWarning). */
    healthWarning?: boolean;
    /** Пересчитать кегль надписи, когда меняется реклама (выбран другой филиал — другой подарок). */
    warningFitKey?: string;
    /** Значок подарка над заголовком: крупный (по умолчанию) / маленький на плашке / без значка (настройка «Вида страницы»). */
    giftIcon?: GiftIconMode;
    /** Размер текста оффера (заголовок и описание): обычный / крупный. */
    textSize?: OfferTextSize;
    /** Выравнивание текста оффера: слева / по центру. */
    textAlign?: OfferTextAlign;
}

const OfferCard: React.FC<OfferCardProps> = ({ title, description, terms, badge, brandColor, isDesktop, healthWarning, warningFitKey, giftIcon = 'big', textSize = 'm', textAlign = 'left' }) => {
    const big = textSize === 'l';
    const center = textAlign === 'center';
    const titleCls = isDesktop ? (big ? 'text-4xl' : 'text-3xl') : (big ? 'text-3xl' : 'text-2xl');
    const descCls = isDesktop ? (big ? 'text-xl mb-6' : 'text-lg mb-6') : (big ? 'text-lg mb-4' : 'text-base mb-4');
    return (
        <div className="relative animate-slide-up-delay-1">

            {/* Карточка. data-ad-area — площадь рекламы для надписи о вреде энергетиков (HealthWarning). */}
            <div data-ad-area="offer" className={`relative glass rounded-[28px] overflow-hidden ${isDesktop ? 'p-8' : 'p-6'}`}>

                <div className={`relative${center ? ' text-center' : ''}`}>
                    {/* Бейдж. Пометок «18+» и «0%» нет по решению 15.10.2026 (specs/content-policy.md) */}
                    {badge && (
                        <div className={`flex flex-wrap items-center gap-1.5 mb-5${center ? ' justify-center' : ''}`}>
                            {badge && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-black"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    {giftIcon === 'badge' && <GiftIcon className="w-3.5 h-3.5 -ml-0.5 shrink-0" />}
                                    {badge}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Иконка подарка: крупная над заголовком; «на плашке» — маленькая в бейдже выше; «без значка» — нет. */}
                    {giftIcon === 'big' && (
                    <div className={`mb-5 animate-float ${isDesktop ? '' : ''}`}>
                        <div
                            className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} rounded-2xl flex items-center justify-center${center ? ' mx-auto' : ''}`}
                            style={{ backgroundColor: `${brandColor}12` }}
                        >
                            <svg
                                className={`${isDesktop ? 'w-10 h-10' : 'w-8 h-8'}`}
                                style={{ color: brandColor }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                        </div>
                    </div>
                    )}

                    {/* Заголовок */}
                    <h2 className={`font-black text-white leading-tight mb-3 ${titleCls}`}>
                        {title}
                    </h2>

                    {/* Описание */}
                    {/* Абзацы, переносы и списки — как клуб набрал в ЕРП (раньше HTML схлопывал их в одну строку). */}
                    {description && (
                        <RichText text={description} center={center} className={`text-white/50 leading-relaxed ${descCls}`} />
                    )}

                    {/* Условия */}
                    {terms && (
                        <div className={`flex items-start gap-2.5 pt-5 border-t border-white/5${center ? ' justify-center text-left' : ''}`}>
                            <svg className="w-4 h-4 text-white/25 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <RichText text={terms} className="text-xs text-white/25 leading-relaxed" style={{ gap: '0.4em' }} />
                        </div>
                    )}

                    {/* Надпись о вреде энергетиков — в самой карточке, кегль по замеру площади */}
                    {healthWarning && <HealthWarning fitKey={warningFitKey} />}
                </div>
            </div>
        </div>
    );
};

export default OfferCard;
