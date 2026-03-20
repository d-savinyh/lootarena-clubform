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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
            {/* Фоновый glow */}
            <div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06]"
                style={{ backgroundColor: brandColor }}
            />

            <div className="relative max-w-md w-full animate-scale-in">
                {/* Иконка успеха */}
                <div className="flex justify-center mb-10">
                    <div className="relative">
                        <div
                            className="w-28 h-28 rounded-full flex items-center justify-center animate-float"
                            style={{ backgroundColor: `${brandColor}12` }}
                        >
                            <svg className="w-14 h-14" style={{ color: brandColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div
                            className="absolute -inset-6 rounded-full opacity-15 blur-3xl animate-glow-pulse"
                            style={{ backgroundColor: brandColor }}
                        />
                    </div>
                </div>

                {/* Текст */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-white mb-4">Вы записаны!</h2>
                    <p className="text-lg text-white/45 leading-relaxed">
                        Мы свяжемся с вами в ближайшее время.<br />
                        Ждём вас в <span className="text-white font-bold">{clubName}</span>!
                    </p>
                </div>

                {/* Промокод */}
                {promoCode && (
                    <div className="glass rounded-[24px] p-6 mb-5">
                        <div className="text-[11px] text-white/35 font-semibold uppercase tracking-wider mb-3">Ваш промокод</div>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex-1 px-5 py-3.5 rounded-2xl text-center text-xl font-black tracking-[0.15em] text-black"
                                style={{ backgroundColor: brandColor }}
                            >
                                {promoCode}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="px-5 py-3.5 rounded-2xl glass-light text-white/50 hover:text-white transition-all text-sm font-bold shrink-0"
                            >
                                {copied ? '✓' : 'Копировать'}
                            </button>
                        </div>
                        <p className="text-xs text-white/25 mt-3">Назовите промокод администратору при визите</p>
                    </div>
                )}

                {/* Маршрут */}
                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl glass-light text-white/60 hover:text-white hover:bg-white/8 transition-all text-sm font-bold mb-5"
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
