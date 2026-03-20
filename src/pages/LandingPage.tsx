import React, { useState, useEffect } from 'react';
import ClubHeader from '../components/ClubHeader';
import OfferCard from '../components/OfferCard';
import LeadForm from '../components/LeadForm';
import SuccessScreen from '../components/SuccessScreen';
import { getLandingData, submitLead, trackView, type ClubLanding } from '../utils/api';

interface LandingPageProps {
    slug: string;
}

/** Хук для определения десктопного экрана */
const useIsDesktop = (breakpoint = 1024) => {
    const [isDesktop, setIsDesktop] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false
    );

    useEffect(() => {
        const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handler);
        setIsDesktop(mq.matches);
        return () => mq.removeEventListener('change', handler);
    }, [breakpoint]);

    return isDesktop;
};

const LandingPage: React.FC<LandingPageProps> = ({ slug }) => {
    const [landing, setLanding] = useState<ClubLanding | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [promoCode, setPromoCode] = useState<string>();
    const [error, setError] = useState<string>();
    const isDesktop = useIsDesktop();

    // UTM параметры из URL
    const params = new URLSearchParams(window.location.search);
    const utm = {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getLandingData(slug);
                if (data) {
                    setLanding(data);
                    trackView(data.form.id, utm);
                    // Обновляем title страницы
                    document.title = `${data.club.name} — ${data.form.offerTitle}`;
                } else {
                    setError('Страница не найдена');
                }
            } catch {
                setError('Страница не найдена');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [slug]);

    const handleSubmit = async (formData: { name: string; phone: string; telegram?: string }) => {
        if (!landing) return;
        setIsSubmitting(true);
        setError(undefined);

        try {
            const result = await submitLead({
                form_id: landing.form.id,
                club_id: '',
                name: formData.name,
                phone: formData.phone,
                telegram: formData.telegram,
                utm_source: utm.source,
                utm_medium: utm.medium,
                utm_campaign: utm.campaign,
            });

            if (result.ok) {
                setPromoCode(result.promoCode);
                setShowSuccess(true);
            } else {
                setError(result.error || 'Произошла ошибка. Попробуйте ещё раз.');
            }
        } catch {
            setError('Произошла ошибка. Попробуйте ещё раз.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Лоадер ──
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-white/8 border-t-white/40 rounded-full animate-spin" />
                    <span className="text-xs text-white/20 font-medium tracking-[0.15em] uppercase">Загрузка</span>
                </div>
            </div>
        );
    }

    // ── Ошибка ──
    if (error && !landing) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-[22px] bg-white/3 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-9 h-9 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-black text-white mb-2">Страница не найдена</h2>
                    <p className="text-sm text-white/35">Проверьте ссылку и попробуйте ещё раз</p>
                </div>
            </div>
        );
    }

    if (!landing) return null;

    const brandColor = landing.form.brandColor || '#30D158';
    const clean = (v?: string) => v && v !== 'none' ? v : undefined;

    // ══════════════════════════════════════════════
    // ██  ДЕСКТОПНЫЙ LAYOUT — двухколоночный       ██
    // ══════════════════════════════════════════════
    if (isDesktop) {
        return (
            <>
                <div className="desktop-grid">
                    {/* ── Левая колонка: Hero + обложка ── */}
                    <div className="desktop-left">
                        <ClubHeader
                            clubName={landing.club.name}
                            clubLogo={landing.club.avatarUrl}
                            coverUrl={landing.club.coverUrl}
                            address={landing.club.address}
                            workingHours={landing.club.workingHours}
                            brandColor={brandColor}
                            isDesktopHero
                        />
                    </div>

                    {/* ── Правая колонка: Оффер + Форма ── */}
                    <div className="desktop-right">
                        <div className="w-full max-w-lg space-y-8">
                            {/* Фоновые декорации */}
                            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                                <div
                                    className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.03]"
                                    style={{ backgroundColor: brandColor }}
                                />
                            </div>

                            {/* Оффер */}
                            <OfferCard
                                title={landing.form.offerTitle}
                                description={clean(landing.form.offerDescription) || ''}
                                terms={clean(landing.form.offerTerms)}
                                badge={clean(landing.form.offerBadge)}
                                brandColor={brandColor}
                                isDesktop
                            />

                            {/* Форма */}
                            <LeadForm
                                brandColor={brandColor}
                                clubAddress={landing.club.address}
                                onSubmit={handleSubmit}
                                isLoading={isSubmitting}
                                isDesktop
                            />

                            {/* Ошибка */}
                            {error && (
                                <div className="glass rounded-2xl p-4 text-center animate-fade-in">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Футер */}
                            <footer className="pt-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/10">
                                    <span>Powered by</span>
                                    <span className="font-bold text-white/20">Loot Arena</span>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>

                {/* Экран успеха */}
                {showSuccess && (
                    <SuccessScreen
                        clubName={landing.club.name}
                        promoCode={promoCode}
                        brandColor={brandColor}
                        address={landing.club.address}
                        onClose={() => setShowSuccess(false)}
                    />
                )}
            </>
        );
    }

    // ══════════════════════════════════════════════
    // ██  МОБИЛЬНЫЙ LAYOUT — вертикальный          ██
    // ══════════════════════════════════════════════
    return (
        <>
            {/* Фоновые декорации */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.04]"
                    style={{ backgroundColor: brandColor }}
                />
                <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.03] bg-neon-purple" />
            </div>

            {/* Основной контент */}
            <div className="relative min-h-screen flex flex-col">
                <div className="flex-1 flex items-center justify-center px-5 py-10">
                    <div className="w-full max-w-md space-y-6">
                        {/* Шапка клуба */}
                        <ClubHeader
                            clubName={landing.club.name}
                            clubLogo={landing.club.avatarUrl}
                            coverUrl={landing.club.coverUrl}
                            address={landing.club.address}
                            workingHours={landing.club.workingHours}
                            brandColor={brandColor}
                        />

                        {/* Оффер */}
                        <OfferCard
                            title={landing.form.offerTitle}
                            description={clean(landing.form.offerDescription) || ''}
                            terms={clean(landing.form.offerTerms)}
                            badge={clean(landing.form.offerBadge)}
                            brandColor={brandColor}
                        />

                        {/* Форма */}
                        <LeadForm
                            brandColor={brandColor}
                            clubAddress={landing.club.address}
                            onSubmit={handleSubmit}
                            isLoading={isSubmitting}
                        />

                        {/* Ошибка */}
                        {error && (
                            <div className="glass rounded-2xl p-3 text-center">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Футер */}
                <footer className="py-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/10">
                        <span>Powered by</span>
                        <span className="font-bold text-white/20">Loot Arena</span>
                    </div>
                </footer>
            </div>

            {/* Экран успеха */}
            {showSuccess && (
                <SuccessScreen
                    clubName={landing.club.name}
                    promoCode={promoCode}
                    brandColor={brandColor}
                    address={landing.club.address}
                    onClose={() => setShowSuccess(false)}
                />
            )}
        </>
    );
};

export default LandingPage;
