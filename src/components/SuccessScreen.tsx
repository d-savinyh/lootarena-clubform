import React from 'react';

interface SuccessScreenProps {
    clubName: string;
    promoCode?: string;
    brandColor: string;
    address: string;
    onClose?: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ clubName, promoCode, brandColor, address, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (promoCode) {
            navigator.clipboard.writeText(promoCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const mapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(5, 5, 5, 0.95)' }}>
            <div className="max-w-md w-full animate-slide-up">
                {/* Иконка успеха */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center animate-float"
                            style={{ backgroundColor: `${brandColor}15` }}
                        >
                            <svg className="w-12 h-12" style={{ color: brandColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div
                            className="absolute -inset-4 rounded-full opacity-20 blur-2xl animate-glow-pulse"
                            style={{ backgroundColor: brandColor }}
                        />
                    </div>
                </div>

                {/* Текст */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-white mb-3">Вы записаны!</h2>
                    <p className="text-base text-white/50 leading-relaxed">
                        Мы свяжемся с вами в ближайшее время. Ждём вас в <span className="text-white font-bold">{clubName}</span>!
                    </p>
                </div>

                {/* Промокод */}
                {promoCode && (
                    <div className="glass rounded-2xl p-5 mb-4">
                        <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2">Ваш промокод</div>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex-1 px-4 py-3 rounded-xl text-center text-xl font-black tracking-[0.2em] text-black"
                                style={{ backgroundColor: brandColor }}
                            >
                                {promoCode}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm font-bold shrink-0"
                            >
                                {copied ? 'Скопировано!' : 'Копировать'}
                            </button>
                        </div>
                        <p className="text-xs text-white/30 mt-3">Назовите промокод администратору при визите</p>
                    </div>
                )}

                {/* Маршрут */}
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/5 border border-white/8 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-bold mb-4"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Построить маршрут
                </a>

                {/* Назад */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                        Вернуться
                    </button>
                )}
            </div>
        </div>
    );
};

export default SuccessScreen;
