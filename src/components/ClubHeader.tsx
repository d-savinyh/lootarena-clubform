import React from 'react';

interface ClubHeaderProps {
    clubName: string;
    clubLogo?: string;
    address: string;
    workingHours?: string;
    brandColor: string;
}

const ClubHeader: React.FC<ClubHeaderProps> = ({ clubName, clubLogo, address, workingHours, brandColor }) => {
    const initials = clubName
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex items-center gap-4 animate-slide-up">
            {/* Лого или инициалы */}
            {clubLogo ? (
                <img
                    src={clubLogo}
                    alt={clubName}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg"
                />
            ) : (
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-black shadow-lg"
                    style={{ backgroundColor: brandColor }}
                >
                    {initials}
                </div>
            )}

            <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black text-white tracking-tight truncate">
                    {clubName}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-white/40 truncate">{address}</span>
                </div>
                {workingHours && (
                    <div className="flex items-center gap-2 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-white/40">{workingHours}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubHeader;
