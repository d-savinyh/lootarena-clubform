import React, { useState, useEffect } from 'react';
import ClubHeader from '../components/ClubHeader';
import ClubPicker from '../components/ClubPicker';
import OfferCard from '../components/OfferCard';
import LeadForm from '../components/LeadForm';
import SuccessScreen from '../components/SuccessScreen';
import { getLandingData, submitLead, trackView, trackEvent, injectPixels, fireLeadConversion, type ClubLanding, type GiftReason, type SubmitResult, type LandingClub } from '../utils/api';
import { solveCaptcha } from '../utils/captcha';

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
    const [giftReason, setGiftReason] = useState<GiftReason>();
    // Признаки, объясняющие экран успеха: повтор в пределах 30 минут и то, под какое
    // условие формы гость не подошёл (уже гость клуба / уже есть аккаунт).
    const [submitMeta, setSubmitMeta] = useState<{
        duplicate?: boolean;
        isClubGuest?: boolean;
        isAppUser?: boolean;
        prevGiftState?: SubmitResult['prevGiftState'];
    }>();
    // Ошибка ОТПРАВКИ (лимит, отказ капчи) — в отличие от `error` не подменяет собой весь лендинг,
    // а показывается под полем телефона: страница жива, гость может повторить.
    const [submitError, setSubmitError] = useState<string>();
    const [submittedPhone, setSubmittedPhone] = useState<string>();
    const [variant, setVariant] = useState<string>();
    const [error, setError] = useState<string>();
    // Сетевая форма: филиал выбирает ГОСТЬ, и до выбора мы не знаем ни адреса, ни маски
    // телефона (валюта филиала), ни номинала подарка — поэтому выбор стоит ПЕРЕД контактами.
    const [selectedClub, setSelectedClub] = useState<LandingClub | null>(null);
    // Подсветка блока выбора, когда гость жмёт «Забрать», не выбрав филиал.
    const [clubHighlight, setClubHighlight] = useState(false);
    const isDesktop = useIsDesktop();

    // UTM параметры из URL. Источник нормализуем к нижнему регистру, чтобы 2gis/2GIS не двоились в аналитике.
    const params = new URLSearchParams(window.location.search);
    const utm = {
        source: (params.get('utm_source') || '').trim().toLowerCase() || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        content: params.get('utm_content') || undefined,   // VK Реклама: ID объявления (banner_id)
        term: params.get('utm_term') || undefined,
    };

    // Сырые метки: сохраняем ВСЕ query-параметры страницы (в т.ч. VK/Яндекс-специфичные),
    // чтобы никогда не потерять детализацию, даже если она не в стандартных utm_*.
    const rawUtm: Record<string, string> = (() => {
        const o: Record<string, string> = {};
        params.forEach((v, k) => { if (v && k.length <= 64 && v.length <= 512) o[k] = v; });
        return o;
    })();

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
                    // Набор из одного филиала выбирать не заставляем; выбор гостя переживает
                    // перезагрузку страницы (иначе возврат «назад» стирает шаг и путает).
                    const nc = data.form.clubs || null;
                    if (data.form.isNetwork && nc && nc.length) {
                        let restored: LandingClub | null = null;
                        try {
                            const saved = sessionStorage.getItem(`cf_club_${slug}`);
                            restored = saved ? nc.find(c => c.id === saved) || null : null;
                        } catch { /* нет sessionStorage */ }
                        setSelectedClub(restored || (nc.length === 1 ? nc[0] : null));
                    }
                    trackView(data.form.id, utm, v, rawUtm);
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

    // Возврат к невыполненному требованию: подсветить блок и подскроллить к нему.
    // Требование живёт выше по странице и на телефоне не видно.
    const focusClubPicker = () => {
        setClubHighlight(true);
        try { document.getElementById('club-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { /* старый браузер */ }
        window.setTimeout(() => setClubHighlight(false), 2200);
    };

    const handleSubmit = async (formData: { name: string; phone: string; telegram?: string; hp?: string; formMs?: number }) => {
        if (!landing || isSubmitting) return;
        if (landing.form.isNetwork && !selectedClub) { focusClubPicker(); return; }
        // Блок повторной отправки: заявка уже принята — просто показываем экран успеха, новую заявку не шлём
        if (submitted) {
            setShowSuccess(true);
            return;
        }
        setIsSubmitting(true);
        setError(undefined);
        setSubmitError(undefined);
        setSubmittedPhone(formData.phone);

        try {
            const payload = {
                form_id: landing.form.id,
                club_id: '',
                // Филиал сетевой формы — отдельным ключом: club_id остаётся служебным полем
                // обёртки, доменное значение туда класть нельзя.
                target_club_id: selectedClub?.id,
                name: formData.name,
                phone: formData.phone,
                telegram: formData.telegram,
                hp: formData.hp,
                form_ms: formData.formMs,
                utm_source: utm.source,
                utm_medium: utm.medium,
                utm_campaign: utm.campaign,
                utm_content: utm.content,
                utm_term: utm.term,
                raw_utm: Object.keys(rawUtm).length ? rawUtm : undefined,
                variant,
                click_ids: Object.keys(clickIds).length ? clickIds : undefined,
            };

            let result = await submitLead(payload);

            // Сервер счёл отправку подозрительной (скорость заполнения / всплеск с одного IP)
            // и просит капчу. Прогоняем невидимую проверку и отправляем ту же заявку с токеном.
            if (!result.ok && result.requireCaptcha && result.captchaKey) {
                trackEvent(landing.form.id, 'submit_error', { error: 'captcha_required' }, { variant, utm });
                const token = await solveCaptcha(result.captchaKey);
                if (!token) {
                    setSubmitError('Не удалось подтвердить, что вы не робот. Попробуйте ещё раз.');
                    return;
                }
                result = await submitLead({ ...payload, captcha_token: token });
            }

            // Отказы сетевой формы объясняем словами и возвращаем к блоку выбора: «ошибка»
            // без причины заставляет гостя жать кнопку снова.
            if (!result.ok && (result.error === 'club_required' || result.error === 'club_not_in_form')) {
                setSubmitError(result.error === 'club_required'
                    ? 'Выберите клуб, в который придёте.'
                    : 'Этот клуб больше не участвует в акции — выберите другой.');
                if (result.error === 'club_not_in_form') setSelectedClub(null);
                focusClubPicker();
                trackEvent(landing.form.id, 'submit_error', { error: result.error }, { variant, utm });
                return;
            }

            if (!result.ok && result.error === 'too_many_requests') {
                setSubmitError('Слишком много заявок с этого устройства. Попробуйте через 10 минут или позвоните в клуб.');
                trackEvent(landing.form.id, 'submit_error', { error: 'too_many_requests' }, { variant, utm });
                return;
            }

            if (result.ok) {
                setGiftStatus(result.giftStatus ?? (landing.form.gift ? 'reserved' : 'none'));
                setGiftReason(result.giftReason);
                setSubmitMeta({ duplicate: result.duplicate, isClubGuest: result.isClubGuest, isAppUser: result.isAppUser, prevGiftState: result.prevGiftState });
                setSubmitted(true);
                setShowSuccess(true);
                // Конверсия «лид» во все подключённые пиксели + поведенческое событие
                const paidGift = selectedClub?.gift ?? landing.form.gift;
                fireLeadConversion(landing.form.tracking, Number(paidGift?.reward_meta?.bonus_amount) || undefined);
                trackEvent(landing.form.id, 'submit_success', { giftStatus: result.giftStatus || 'none', giftReason: result.giftReason || '', duplicate: !!result.duplicate }, { variant, utm });
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

    // Сетевая форма: до выбора филиала в шапке стоит сеть (адрес/часы клуба-держателя
    // гостю ничего не обещают), после выбора — данные ВЫБРАННОГО клуба, включая валюту
    // (от неё зависит маска телефона) и его собственный номинал подарка.
    const netClubs: LandingClub[] | null =
        landing.form.isNetwork && landing.form.clubs && landing.form.clubs.length ? landing.form.clubs : null;
    const club = netClubs && selectedClub
        ? {
            ...landing.club,
            name: selectedClub.name,
            address: selectedClub.address || landing.club.address,
            workingHours: selectedClub.workingHours || landing.club.workingHours,
            currency: selectedClub.currency || landing.club.currency,
        }
        : landing.club;
    const needClub = !!netClubs && !selectedClub;

    const brandColor = landing.form.brandColor || '#30D158';
    const clean = (v?: string) => v && v !== 'none' ? v : undefined;
    const track = (type: string, meta: Record<string, any> = {}) => trackEvent(landing.form.id, type, meta, { variant, utm });
    const handleSelectClub = (c: LandingClub) => {
        setSelectedClub(c);
        setClubHighlight(false);
        setSubmitError(undefined);
        try { sessionStorage.setItem(`cf_club_${slug}`, c.id); } catch { /* нет sessionStorage */ }
        // Событие даёт воронку «показ → выбор филиала → заявка»: показы у сетевой формы
        // общие, и распределение спроса по филиалам видно только отсюда.
        track('club_selected', { club_id: c.id });
    };
    const clubPicker = netClubs && netClubs.length > 1 ? (
        <ClubPicker
            clubs={netClubs}
            selectedId={selectedClub?.id ?? null}
            onSelect={handleSelectClub}
            brandColor={brandColor}
            highlight={clubHighlight}
            isDesktop={isDesktop}
            onEvent={track}
        />
    ) : null;
    const ctaText = clean(landing.form.ctaText || undefined);
    const socialRow = (() => {
        const s = club.socialLinks || {};
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

    const gift = (selectedClub ? (selectedClub.gift ?? landing.form.gift) : landing.form.gift) || null;
    const coverUrl = landing.form.coverImage || club.coverUrl;
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

    // Номинал подарка у филиалов бывает РАЗНЫЙ (410/520/560 ₽ у Убежища 78). До выбора
    // филиала конкретную сумму не показываем: это обещание, которое может не сбыться.
    const giftVaries = !!netClubs && new Set(netClubs.map(c => c.gift?.reward_text || '')).size > 1;
    const giftUnknown = giftVaries && !selectedClub;
    const giftCard = gift ? (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${brandColor}18` }}>
                {gift.reward_icon || '🎁'}
            </div>
            <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-white/35 font-semibold mb-0.5">Подарок за регистрацию</div>
                <div className="text-base font-black text-white truncate">
                    {giftUnknown
                        ? 'Зависит от клуба'
                        : (gift.reward_text || (gift.reward_meta?.bonus_amount ? `${gift.reward_meta.bonus_amount} бонусов` : 'Подарок'))}
                </div>
                {giftUnknown && <div className="text-[12px] text-white/30 mt-0.5">Выберите клуб — покажем ваш подарок</div>}
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
                            clubName={club.name}
                            clubLogo={club.avatarUrl}
                            coverUrl={coverUrl}
                            address={club.address}
                            workingHours={club.workingHours}
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

                            {/* Выбор филиала — ДО контактов: от него зависят адрес, маска
                                телефона и номинал подарка */}
                            {clubPicker}

                            {giftCard}

                            {/* Форма */}
                            <LeadForm
                                brandColor={brandColor}
                                clubAddress={club.address}
                                currency={club.currency}
                                onSubmit={handleSubmit}
                                isLoading={isSubmitting}
                                ctaText={ctaText}
                                onEvent={track}
                                submitError={submitError}
                                blocked={needClub}
                                blockReason={needClub ? 'Сначала выберите клуб' : undefined}
                                onBlocked={focusClubPicker}
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
                        clubName={club.name}
                        giftStatus={giftStatus}
                        giftReason={giftReason}
                        duplicate={submitMeta?.duplicate}
                        isClubGuest={submitMeta?.isClubGuest}
                        isAppUser={submitMeta?.isAppUser}
                        prevGiftState={submitMeta?.prevGiftState}
                        gift={gift}
                        appUrl={buildAppUrl(submittedPhone)}
                        brandColor={brandColor}
                        address={club.address}
                        onClose={() => setShowSuccess(false)}
                        onEvent={track}
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
                            clubName={club.name}
                            clubLogo={club.avatarUrl}
                            coverUrl={coverUrl}
                            address={club.address}
                            workingHours={club.workingHours}
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

                        {/* Выбор филиала — ДО контактов */}
                        {clubPicker}

                        {giftCard}

                        {/* Форма */}
                        <LeadForm
                            brandColor={brandColor}
                            clubAddress={club.address}
                            currency={club.currency}
                            onSubmit={handleSubmit}
                            isLoading={isSubmitting}
                            ctaText={ctaText}
                            onEvent={track}
                            submitError={submitError}
                            blocked={needClub}
                            blockReason={needClub ? 'Сначала выберите клуб' : undefined}
                            onBlocked={focusClubPicker}
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
                    clubName={club.name}
                    giftStatus={giftStatus}
                    giftReason={giftReason}
                    duplicate={submitMeta?.duplicate}
                    isClubGuest={submitMeta?.isClubGuest}
                    isAppUser={submitMeta?.isAppUser}
                    prevGiftState={submitMeta?.prevGiftState}
                    gift={gift}
                    appUrl={buildAppUrl(submittedPhone)}
                    brandColor={brandColor}
                    address={club.address}
                    onClose={() => setShowSuccess(false)}
                    onEvent={track}
                />
            )}
        </>
    );
};

export default LandingPage;
