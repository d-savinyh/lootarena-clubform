import React, { useState, useEffect } from 'react';
import ClubHeader from '../components/ClubHeader';
import OfferCard from '../components/OfferCard';
import LeadForm from '../components/LeadForm';
import SuccessScreen from '../components/SuccessScreen';
import { getLandingData, submitLead, trackView, type ClubLanding } from '../utils/api';

interface LandingPageProps {
    slug: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ slug }) => {
    const [landing, setLanding] = useState<ClubLanding | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [promoCode, setPromoCode] = useState<string>();
    const [error, setError] = useState<string>();

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
                    // Трекаем просмотр
                    trackView(data.form.id, utm);
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
                club_id: '', // будет определён на бэкенде через form_id
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

    // Лоадер
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-white/10 border-t-brand rounded-full animate-spin" />
                    <span className="text-xs text-white/30 font-medium tracking-wider uppercase">Загрузка...</span>
                </div>
            </div>
        );
    }

    // Ошибка
    if (error && !landing) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-white mb-1">Страница не найдена</h2>
                    <p className="text-sm text-white/40">Проверьте ссылку и попробуйте ещё раз</p>
                </div>
            </div>
        );
    }

    if (!landing) return null;

    const brandColor = landing.form.brandColor || '#30D158';

    return (
        <>
            {/* Фоновые декорации */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.04]"
                    style={{ backgroundColor: brandColor }}
                />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.03] bg-neon-purple" />
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* Основной контент */}
            <div className="relative min-h-screen flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                    <div className="w-full max-w-md space-y-6">
                        {/* Шапка клуба */}
                        <ClubHeader
                            clubName={landing.club.name}
                            clubLogo={landing.club.logoUrl}
                            address={landing.club.address}
                            workingHours={landing.club.workingHours}
                            brandColor={brandColor}
                        />

                        {/* Карточка оффера */}
                        <OfferCard
                            title={landing.form.offerTitle}
                            description={landing.form.offerDescription || ''}
                            terms={landing.form.offerTerms}
                            badge={landing.form.offerBadge}
                            brandColor={brandColor}
                        />

                        {/* Форма */}
                        <LeadForm
                            brandColor={brandColor}
                            onSubmit={handleSubmit}
                            isLoading={isSubmitting}
                        />

                        {/* Ошибка отправки */}
                        {error && (
                            <div className="glass rounded-xl p-3 text-center">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Футер */}
                <footer className="py-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/15">
                        <span>Powered by</span>
                        <span className="font-bold text-white/25">ClubForm</span>
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
