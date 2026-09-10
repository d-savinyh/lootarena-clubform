import React, { useMemo, useState } from 'react';
import type { LandingClub } from '../utils/api';

interface Props {
    clubs: LandingClub[];
    selectedId: string | null;
    onSelect: (club: LandingClub) => void;
    brandColor: string;
    isDesktop?: boolean;
    /** Подсветка, когда гость жмёт «Забрать», не выбрав филиал. */
    highlight?: boolean;
    onEvent?: (type: string, meta?: Record<string, any>) => void;
}

/** Расстояние по прямой, км. Нужна не точность, а порядок «какой ближе». */
const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const R = 6371;
    const dLat = ((bLat - aLat) * Math.PI) / 180;
    const dLng = ((bLng - aLng) * Math.PI) / 180;
    const la1 = (aLat * Math.PI) / 180;
    const la2 = (bLat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};

const giftLabel = (c: LandingClub) =>
    c.gift?.reward_text || (c.gift?.reward_meta?.bonus_amount ? `${c.gift.reward_meta.bonus_amount} бонусов` : null);

const ClubPicker: React.FC<Props> = ({ clubs, selectedId, onSelect, brandColor, isDesktop, highlight, onEvent }) => {
    // Геолокацию НЕ запрашиваем сами: браузерный промпт на входе пугает и роняет конверсию.
    // Кнопка «ближайший» — по явному действию гостя, отказ ничего не ломает.
    const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
    const [geoState, setGeoState] = useState<'idle' | 'busy' | 'denied'>('idle');

    // Подарок показываем на карточке только если он у филиалов РАЗНЫЙ — иначе это шум,
    // тот же номинал уже написан в блоке оффера выше.
    const giftsDiffer = useMemo(() => {
        const set = new Set(clubs.map(c => giftLabel(c) || ''));
        return set.size > 1;
    }, [clubs]);

    const withDistance = useMemo(() => {
        const list = clubs.map(c => ({
            club: c,
            km: geo && c.lat != null && c.lng != null ? distanceKm(geo.lat, geo.lng, Number(c.lat), Number(c.lng)) : null,
        }));
        if (!geo) return list;
        return [...list].sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
    }, [clubs, geo]);

    const nearestId = geo ? withDistance.find(x => x.km != null)?.club.id ?? null : null;

    const askGeo = () => {
        if (!navigator.geolocation) { setGeoState('denied'); return; }
        setGeoState('busy');
        onEvent?.('geo_request');
        navigator.geolocation.getCurrentPosition(
            pos => { setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoState('idle'); onEvent?.('geo_ok'); },
            () => { setGeoState('denied'); onEvent?.('geo_denied'); },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
        );
    };

    const hasCoords = clubs.some(c => c.lat != null && c.lng != null);

    return (
        <div
            id="club-picker"
            className={`glass rounded-[28px] ${isDesktop ? 'p-8' : 'p-6'} animate-slide-up-delay-1 transition-all`}
            style={highlight ? { boxShadow: `0 0 0 2px ${brandColor}, 0 0 30px ${brandColor}40` } : undefined}
        >
            <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className={`font-black text-white ${isDesktop ? 'text-2xl' : 'text-xl'}`}>Куда придёшь?</h3>
                {hasCoords && !geo && (
                    <button
                        type="button"
                        onClick={askGeo}
                        disabled={geoState === 'busy'}
                        className="shrink-0 text-[12px] font-semibold text-white/35 hover:text-white/70 transition-colors disabled:opacity-40"
                    >
                        {geoState === 'busy' ? 'Ищем…' : geoState === 'denied' ? 'Гео недоступно' : 'Ближайший ко мне'}
                    </button>
                )}
            </div>
            <p className="text-sm text-white/35 mb-5">
                {highlight ? 'Сначала выберите клуб — подарок закрепится за ним' : 'Выберите клуб — подарок закрепится за ним'}
            </p>

            <div className="space-y-2.5">
                {withDistance.map(({ club, km }) => {
                    const active = club.id === selectedId;
                    const gl = giftsDiffer ? giftLabel(club) : null;
                    return (
                        <button
                            key={club.id}
                            type="button"
                            onClick={() => onSelect(club)}
                            aria-pressed={active}
                            className={`w-full text-left rounded-2xl px-4 py-3.5 transition-all border ${
                                active ? 'bg-white/[0.07]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                            }`}
                            style={active ? { borderColor: brandColor, backgroundColor: `${brandColor}14` } : undefined}
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={`w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all ${active ? '' : 'border-white/15'}`}
                                    style={active ? { borderColor: brandColor, backgroundColor: brandColor } : undefined}
                                >
                                    {active && (
                                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className="text-[15px] font-bold text-white truncate">{club.name}</span>
                                        {nearestId === club.id && (
                                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                                style={{ backgroundColor: `${brandColor}22`, color: brandColor }}>
                                                ближе всего
                                            </span>
                                        )}
                                    </span>
                                    {(club.address || club.city) && (
                                        <span className="block text-[12px] text-white/35 truncate mt-0.5">
                                            {club.address || club.city}
                                            {km != null && <span className="text-white/25"> · {km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(km < 10 ? 1 : 0)} км`}</span>}
                                        </span>
                                    )}
                                    {gl && (
                                        <span className="block text-[12px] font-semibold mt-1" style={{ color: brandColor }}>
                                            {gl}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ClubPicker;
