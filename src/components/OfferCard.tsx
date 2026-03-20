import React from 'react';

interface OfferCardProps {
    title: string;
    description: string;
    terms?: string;
    badge?: string;
    brandColor: string;
}

const OfferCard: React.FC<OfferCardProps> = ({ title, description, terms, badge, brandColor }) => {
    return (
        <div className="relative animate-slide-up-delay-1">
            {/* Фоновый glow */}
            <div
                className="absolute -inset-1 rounded-3xl opacity-20 blur-xl animate-glow-pulse"
                style={{ backgroundColor: brandColor }}
            />

            {/* Карточка */}
            <div className="relative glass rounded-3xl p-6 overflow-hidden">
                {/* Декоративный градиент */}
                <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10"
                    style={{ backgroundColor: brandColor }}
                />

                {/* Бейдж */}
                {badge && (
                    <div className="inline-flex items-center gap-1.5 mb-4">
                        <span
                            className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-black"
                            style={{ backgroundColor: brandColor }}
                        >
                            {badge}
                        </span>
                    </div>
                )}

                {/* Иконка подарка */}
                <div className="mb-4 animate-float">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: `${brandColor}15` }}
                    >
                        <svg className="w-8 h-8" style={{ color: brandColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                    </div>
                </div>

                {/* Заголовок */}
                <h2 className="text-2xl font-black text-white mb-3 leading-tight">
                    {title}
                </h2>

                {/* Описание */}
                <p className="text-base text-white/60 leading-relaxed mb-4">
                    {description}
                </p>

                {/* Условия */}
                {terms && (
                    <div className="flex items-start gap-2 pt-4 border-t border-white/5">
                        <svg className="w-4 h-4 text-white/30 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-white/30 leading-relaxed">{terms}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfferCard;
