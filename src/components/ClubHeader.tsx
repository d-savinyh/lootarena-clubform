import React from 'react';

interface ClubHeaderProps {
    clubName: string;
    clubLogo?: string;
    coverUrl?: string;
    address: string;
    workingHours?: any;
    brandColor: string;
    /** Десктопный режим — hero на всю высоту */
    isDesktopHero?: boolean;
}

const formatWorkingHours = (wh: any): string | null => {
    if (!wh) return null;
    if (typeof wh === 'string') return wh;
    if (wh.is24_7) return 'Круглосуточно';
    if (wh.days) {
        const first = Object.values(wh.days)[0] as any;
        if (first?.open && first?.close) return `${first.open} — ${first.close}`;
    }
    return null;
};

const ClubHeader: React.FC<ClubHeaderProps> = ({ clubName, clubLogo, coverUrl, address, workingHours, brandColor, isDesktopHero }) => {
    const initials = clubName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const hoursText = formatWorkingHours(workingHours);

    // ── Десктопный Hero-режим ──
    if (isDesktopHero) {
        return (
            <div className="relative w-full h-full animate-fade-in">
                {/* Фоновое изображение */}
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={`${clubName} cover`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(135deg, ${brandColor}15 0%, transparent 60%)`,
                            backgroundColor: '#0a0a0a',
                        }}
                    />
                )}

                {/* Overlay градиент */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)',
                    }}
                />

                {/* Декоративный glow */}
                <div
                    className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[120px] opacity-[0.08]"
                    style={{ backgroundColor: brandColor }}
                />

                {/* Контент внизу */}
                <div className="absolute bottom-0 left-0 right-0 p-10 pb-12">
                    <div className="flex items-center gap-5 mb-6 animate-slide-up">
                        {clubLogo ? (
                            <img
                                src={clubLogo}
                                alt={clubName}
                                className="w-[72px] h-[72px] rounded-[20px] object-cover border border-white/10 shadow-2xl"
                            />
                        ) : (
                            <div
                                className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-2xl font-black text-black shadow-2xl"
                                style={{ backgroundColor: brandColor }}
                            >
                                {initials}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                                {clubName}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 animate-slide-up-delay-1">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-white/50">{address}</span>
                        </div>
                        {hoursText && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-white/50">{hoursText}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Мобильный режим (оригинальный) ──
    return (
        <div className="animate-slide-up">
            {/* Обложка клуба */}
            {coverUrl && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-5">
                    <img
                        src={coverUrl}
                        alt={`${clubName} cover`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
            )}

            <div className="flex items-center gap-4">
                {/* Аватар или инициалы */}
                {clubLogo ? (
                    <img
                        src={clubLogo}
                        alt={clubName}
                        className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-xl"
                    />
                ) : (
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-black shadow-xl"
                        style={{ backgroundColor: brandColor }}
                    >
                        {initials}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                        {clubName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <svg className="w-3.5 h-3.5 text-white/35 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-white/35 truncate">{address}</span>
                    </div>
                    {hoursText && (
                        <div className="flex items-center gap-2 mt-0.5">
                            <svg className="w-3.5 h-3.5 text-white/35 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-white/35">{hoursText}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClubHeader;
