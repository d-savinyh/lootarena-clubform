import React from 'react';

interface OfferCardProps {
    title: string;
    description: string;
    terms?: string;
    badge?: string;
    brandColor: string;
    /** Десктопный стиль — крупная типографика */
    isDesktop?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({ title, description, terms, badge, brandColor, isDesktop }) => {
    return (
        <div className="relative animate-slide-up-delay-1">
            {/* Фоновый glow */}
            <div
                className="absolute -inset-2 rounded-[28px] opacity-15 blur-2xl animate-glow-pulse"
                style={{ backgroundColor: brandColor }}
            />

            {/* Карточка */}
            <div className={`relative glass rounded-[28px] overflow-hidden ${isDesktop ? 'p-8' : 'p-6'}`}>
                {/* Декоративный градиент */}
                <div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-8"
                    style={{ backgroundColor: brandColor }}
                />

                <div className="relative">
                    {/* Бейдж */}
                    {badge && (
                        <div className="inline-flex items-center gap-1.5 mb-5">
                            <span
                                className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-black"
                                style={{ backgroundColor: brandColor }}
                            >
                                {badge}
                            </span>
                        </div>
                    )}

                    {/* Иконка подарка */}
                    <div className={`mb-5 animate-float ${isDesktop ? '' : ''}`}>
                        <div
                            className={`${isDesktop ? 'w-20 h-20' : 'w-16 h-16'} rounded-2xl flex items-center justify-center`}
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

                    {/* Заголовок */}
                    <h2 className={`font-black text-white leading-tight mb-3 ${isDesktop ? 'text-3xl' : 'text-2xl'}`}>
                        {title}
                    </h2>

                    {/* Описание */}
                    <p className={`text-white/50 leading-relaxed ${isDesktop ? 'text-lg mb-6' : 'text-base mb-4'}`}>
                        {description}
                    </p>

                    {/* Условия */}
                    {terms && (
                        <div className="flex items-start gap-2.5 pt-5 border-t border-white/5">
                            <svg className="w-4 h-4 text-white/25 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-white/25 leading-relaxed">{terms}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfferCard;
