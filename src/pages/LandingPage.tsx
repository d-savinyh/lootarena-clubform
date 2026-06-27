import React, { useState, useEffect } from 'react';
import ClubHeader from '../components/ClubHeader';
import OfferCard from '../components/OfferCard';
import LeadForm from '../components/LeadForm';
import SuccessScreen from '../components/SuccessScreen';
import { getLandingData, submitLead, trackView, trackEvent, injectPixels, fireLeadConversion, type ClubLanding } from '../utils/api';

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
    const [submitted, setSubmitted] = useState(false);
    const [giftStatus, setGiftStatus] = useState<'inventory' | 'reserved' | 'none'>();
    const [submittedPhone, setSubmittedPhone] = useState<string>();
    const [variant, setVariant] = useState<string>();
    const [error, setError] = useState<string>();
    const isDesktop = useIsDesktop();

    // UTM параметры из URL
    const params = new URLSearchParams(window.location.search);
    const utm = {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
    };

    // Click ID рекламных систем (для offline-конверсий VK/Яндекс)
    const clickIds: Record<string, string> = (() => {
        const keys = ['yclid', 'ymclid', 'gclid', 'fbclid', '_openstat', 'vk_click_id', 'erid'];
        const o: Record<string, string> = {};
        keys.forEach(k => { const v = params.get(k); if (v) o[k] = v; });
        return o;
    })();

    useEffect(() => {
        const load = async () => {
            try {
                let stored: string | undefined;
                try { stored = localStorage.getItem(`cf_variant_${slug}`) || undefined; } catch { /* нет localStorage */ }
                const data = await getLandingData(slug, stored);
                if (data) {
                    setLanding(data);
                    const v = data.form.variant;
                    if (v) {
                        setVariant(v);
                        try { localStorage.setItem(`cf_variant_${slug}`, v); } catch { /* игнор */ }
                    }
                    trackView(data.form.id, utm, v);
                    // Пиксели рекламных систем (по ID) + поведенческое событие просмотра
                    injectPixels(data.form.tracking);
                    trackEvent(data.form.id, 'page_view', {}, { variant: v, utm });
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

    // Поведенческие события: глубина скролла (25/50/75/100) + уход со страницы (abandon через sendBeacon).
    useEffect(() => {
        if (!landing) return;
        const fid = landing.form.id;
        const ctx = { variant, utm };
        let maxDepth = 0;
        const sent = new Set<number>();
        const onScroll = () => {
            const h = document.documentElement;
            const denom = (h.scrollHeight - h.clientHeight) || 1;
            const pct = Math.min(100, Math.max(0, Math.round((h.scrollTop / denom) * 100)));
            if (pct > maxDepth) maxDepth = pct;
            [25, 50, 75, 100].forEach(d => { if (pct >= d && !sent.has(d)) { sent.add(d); trackEvent(fid, 'scroll_depth', { pct: d }, ctx); } });
        };
        const onHide = () => trackEvent(fid, 'abandon', { max_scroll: maxDepth, converted: submitted }, ctx, true);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('pagehide', onHide);
        return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pagehide', onHide); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [landing, variant, submitted]);

    const handleSubmit = async (formData: { name: string; phone: string; telegram?: string }) => {
        if (!landing || isSubmitting) return;
        // Блок повторной отправки: заявка уже принята — просто показываем экран успеха, новую заявку не шлём
        if (submitted) {
            setShowSuccess(true);
            return;
        }
        setIsSubmitting(true);
        setError(undefined);
        setSubmittedPhone(formData.phone);

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
                variant,
                click_ids: Object.keys(clickIds).length ? clickIds : undefined,
            });

            if (result.ok) {
                setGiftStatus(result.giftStatus ?? (landing.form.gift ? 'reserved' : 'none'));
                setSubmitted(true);
                setShowSuccess(true);
                // Конверсия «лид» во все подключённые пиксели + поведенческое событие
                fireLeadConversion(landing.form.tracking, Number(landing.form.gift?.reward_meta?.bonus_amount) || undefined);
                trackEvent(landing.form.id, 'submit_success', { giftStatus: result.giftStatus || 'none', duplicate: !!result.duplicate }, { variant, utm });
            } else {
                setError(result.error || 'Произошла ошибка. Попробуйте ещё раз.');
                trackEvent(landing.form.id, 'submit_error', { error: result.error || '' }, { variant, utm });
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
    const track = (type: string, meta: Record<string, any> = {}) => trackEvent(landing.form.id, type, meta, { variant, utm });
    const ctaText = clean(landing.form.ctaText || undefined);
    const socialRow = (() => {
        const s = landing.club.socialLinks || {};
        const items = ([
            s.vk ? { label: 'ВКонтакте', url: s.vk } : null,
            s.telegram ? { label: 'Telegram', url: s.telegram.startsWith('http') ? s.telegram : `https://t.me/${s.telegram.replace(/^@/, '')}` } : null,
            s.instagram ? { label: 'Instagram', url: s.instagram } : null,
        ].filter(Boolean)) as { label: string; url: string }[];
        if (!items.length) return null;
        return (
            <div className="flex items-center justify-center gap-4 mb-3">
                {items.map(it => (
                    <a key={it.label} href={it.url} target="_blank" rel="noopener noreferrer"
                        onClick={() => track('app_redirect_click', { social: it.label })}
                        className="text-[12px] font-semibold text-white/30 hover:text-white/60 transition-colors">{it.label}</a>
                ))}
            </div>
        );
    })();

    const gift = landing.form.gift || null;
    const coverUrl = landing.form.coverImage || landing.club.coverUrl;
    const buildAppUrl = (phone?: string) => {
        const p = new URLSearchParams();
        if (phone) p.set('phone', phone);
        p.set('ref', 'clubform');
        p.set('club', landing.form.slug);
        if (utm.source) p.set('utm_source', utm.source);
        if (utm.medium) p.set('utm_medium', utm.medium);
        if (utm.campaign) p.set('utm_campaign', utm.campaign);
        return `https://app.lootarena.ru/?${p.toString()}`;
    };

    const giftCard = gift ? (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${brandColor}18` }}>
                {gift.reward_icon || '🎁'}
            </div>
            <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-white/35 font-semibold mb-0.5">Подарок за регистрацию</div>
                <div className="text-base font-black text-white truncate">
                    {gift.reward_text || (gift.reward_meta?.bonus_amount ? `${gift.reward_meta.bonus_amount} бонусов` : 'Подарок')}
                </div>
            </div>
        </div>
    ) : null;

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
                            coverUrl={coverUrl}
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

                            {giftCard}

                            {/* Форма */}
                            <LeadForm
                                brandColor={brandColor}
                                clubAddress={landing.club.address}
                                onSubmit={handleSubmit}
                                isLoading={isSubmitting}
                                ctaText={ctaText}
                                onEvent={track}
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
                                {socialRow}
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
                        giftStatus={giftStatus}
                        gift={gift}
                        appUrl={buildAppUrl(submittedPhone)}
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
                            coverUrl={coverUrl}
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

                        {giftCard}

                        {/* Форма */}
                        <LeadForm
                            brandColor={brandColor}
                            clubAddress={landing.club.address}
                            onSubmit={handleSubmit}
                            isLoading={isSubmitting}
                            ctaText={ctaText}
                            onEvent={track}
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
                    {socialRow}
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
                    giftStatus={giftStatus}
                    gift={gift}
                    appUrl={buildAppUrl(submittedPhone)}
                    brandColor={brandColor}
                    address={landing.club.address}
                    onClose={() => setShowSuccess(false)}
                />
            )}
        </>
    );
};

export default LandingPage;
