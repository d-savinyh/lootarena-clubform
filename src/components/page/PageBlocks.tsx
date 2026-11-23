import React, { useEffect, useRef, useState } from 'react';
import type { LandingPageDesign, PageClub, PageTheme } from '../../utils/page';
import { formatMinutes, formatMoney, freshnessLabel, specsLine, summarizePrices } from '../../utils/page';
import type { SocialKind, SocialLink } from '../../utils/socialLinks';

type Track = (type: string, meta?: Record<string, unknown>) => void;

// ─── Свободно сейчас ──────────────────────────────────────────────────────────
// Те же цифры, что «Сейчас в клубе» в приложении (fn_app_club_load), и тот же вид, что окно зоны приложения 2.0
// (App2ZoneSheet): крупное число «свободно из N» и полоса мест-плиток. Зелёный = свободно — во всех темах.
const seatSize = (total: number) => (total <= 24 ? 18 : total <= 48 ? 14 : 10);

const SeatStrip: React.FC<{ free: number; total: number; label: string }> = ({ free, total, label }) => (
    <span className="lf-seats" role="img" aria-label={label} style={{ '--seat': `${seatSize(total)}px` } as React.CSSProperties}>
        {Array.from({ length: Math.max(0, Math.min(total, 96)) }, (_, i) => (
            <span key={i} className={`lf-seat${i < free ? ' is-free' : ''}`} />
        ))}
    </span>
);

/** Железо зоны под строкой «свободно»: видеокарта, процессор, память, герцовка (23.11.2026, «Сектор»). */
const ZoneSpecs: React.FC<{ specs: NonNullable<LandingPageDesign['free']>['zones'][number]['specs'] }> = ({ specs }) => {
    const line = specsLine(specs);
    if (!line && !specs?.note) return null;
    return (
        <div className="lf-label" style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowWrap: 'anywhere' }}>
            {line && <span>{line}</span>}
            {specs?.note && <span>{specs.note}</span>}
        </div>
    );
};

export const FreeNowBlock: React.FC<{ free: NonNullable<LandingPageDesign['free']>; compact?: boolean; showSpecs?: boolean }> = ({ free, compact, showSpecs }) => {
    const fresh = freshnessLabel(free.updatedAt);
    const sumFree = free.zones.reduce((acc, z) => acc + Math.max(0, z.available), 0);
    const sumTotal = free.zones.reduce((acc, z) => acc + Math.max(0, z.total), 0);
    return (
        <section className="lf-card" style={{ padding: 24 }} aria-labelledby="lf-free-h">
            <div className="lf-kicker">Сейчас в клубе</div>
            <h2 id="lf-free-h" className="lf-h2" style={{ marginTop: 2 }}>Свободно сейчас</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <span className="lf-num lf-big" style={{ fontSize: 46, color: sumFree > 0 ? 'var(--brand-green-ink)' : 'var(--lf-muted)' }}>{sumFree}</span>
                <span className="lf-kicker">свободно из {sumTotal}</span>
            </div>
            {fresh && <div className="lf-label" style={{ marginTop: 2 }}>{fresh}</div>}
            <div style={compact
                ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 16 }
                : { display: 'flex', flexDirection: 'column', marginTop: 12 }}>
                {free.zones.map((z) => {
                    const label = `${z.name}: свободно ${z.available} из ${z.total}`;
                    const count = (
                        <span style={{ whiteSpace: 'nowrap', fontSize: 15, fontWeight: 700, color: z.available > 0 ? 'var(--lf-ink)' : 'var(--lf-muted)' }}>
                            {z.available > 0 ? <><span className="lf-num" style={{ color: 'var(--brand-green-ink)' }}>{z.available}</span> из {z.total}</> : 'всё занято'}
                        </span>
                    );
                    return compact ? (
                        <div key={z.name} style={{ padding: 16, borderRadius: 'var(--brand-radius-inner)', background: 'var(--lf-raised)', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                <span className="lf-kicker" style={{ color: 'var(--lf-ink)', overflowWrap: 'anywhere' }}>{z.name}</span>
                                {count}
                            </div>
                            <SeatStrip free={z.available} total={z.total} label={label} />
                            {showSpecs && <ZoneSpecs specs={z.specs} />}
                        </div>
                    ) : (
                        <div key={z.name} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: '1px solid var(--lf-line)' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                <span style={{ flexGrow: 1, fontSize: 17, minWidth: 0 }}>{z.name}</span>
                                {count}
                            </div>
                            {showSpecs && <ZoneSpecs specs={z.specs} />}
                            <SeatStrip free={z.available} total={z.total} label={label} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

// ─── Цены ─────────────────────────────────────────────────────────────────────
// Публикуются, только если клуб включил цены для приложения (fn_app_club_public_details).
export const PricesBlock: React.FC<{ prices: NonNullable<LandingPageDesign['prices']>; currency?: string; onEvent?: Track }> = ({ prices, currency, onEvent }) => {
    const [open, setOpen] = useState(false);
    const zones = summarizePrices(prices);
    const cur = prices[0]?.currency || currency;
    return (
        <section className="lf-card" style={{ padding: 24 }} aria-labelledby="lf-prices-h">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <h2 id="lf-prices-h" className="lf-h2">Цены</h2>
                <span className="lf-label">обновляются сами</span>
            </div>
            {zones.map((z) => (
                <div key={z.zone} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 0', borderTop: '1px solid var(--lf-line)' }}>
                    <span style={{ flexGrow: 1, fontSize: 17 }}>{z.zone}</span>
                    <span className="lf-num" style={{ fontSize: 17, textAlign: 'right' }}>
                        {z.hourFrom !== null
                            ? `от ${formatMoney(z.hourFrom, cur)}/ч`
                            : z.packetFrom ? `от ${formatMoney(z.packetFrom.price, cur)} за ${formatMinutes(z.packetFrom.minutes)}` : ''}
                    </span>
                </div>
            ))}
            <button type="button" className="lf-btn" style={{ width: '100%', marginTop: 12 }}
                aria-expanded={open}
                onClick={() => { setOpen((v) => !v); if (!open) onEvent?.('page_prices_open'); }}>
                {open ? 'Свернуть' : 'Все тарифы и пакеты'}
            </button>
            {open && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {zones.map((z) => (
                        <div key={z.zone}>
                            <div className="lf-kicker" style={{ marginBottom: 6 }}>{z.zone}</div>
                            {z.items.map((p, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderTop: '1px solid var(--lf-line)' }}>
                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 15, fontWeight: 600 }}>{p.title}{p.minutes ? ` · ${formatMinutes(p.minutes)}` : ''}</div>
                                        {p.schedule && <div className="lf-label" style={{ marginTop: 2 }}>{p.schedule}</div>}
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {formatMoney(p.price, p.currency || cur)}{p.minutes ? '' : '/ч'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

// ─── Галерея ──────────────────────────────────────────────────────────────────
const Lightbox: React.FC<{ images: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }> = ({ images, index, onClose, onIndex }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Escape') onClose();
            if (e.code === 'ArrowRight') onIndex((index + 1) % images.length);
            if (e.code === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length);
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [index, images.length, onClose, onIndex]);
    const arrow = (dir: 1 | -1) => (
        <button type="button" aria-label={dir > 0 ? 'Следующее фото' : 'Предыдущее фото'}
            onClick={(e) => { e.stopPropagation(); onIndex((index + dir + images.length) % images.length); }}
            style={{ position: 'absolute', top: '50%', [dir > 0 ? 'right' : 'left']: 12, transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: 999, border: 0, background: 'var(--brand-surface-glass)', color: 'var(--brand-on-photo)', fontSize: 22, cursor: 'pointer' }}>
            {dir > 0 ? '›' : '‹'}
        </button>
    );
    return (
        <div role="dialog" aria-modal="true" aria-label="Фото клуба" onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--brand-scrim-cut)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <img src={images[index]} alt={`Фото клуба ${index + 1} из ${images.length}`} onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '100%', maxHeight: '86vh', borderRadius: 20, objectFit: 'contain' }} />
            {images.length > 1 && arrow(-1)}
            {images.length > 1 && arrow(1)}
            <button type="button" aria-label="Закрыть" onClick={onClose}
                style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 999, border: 0, background: 'var(--brand-surface-glass)', color: 'var(--brand-on-photo)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: 'var(--brand-ink-muted)', fontSize: 14, fontWeight: 500 }}>{index + 1} / {images.length}</div>
        </div>
    );
};

export const GalleryBlock: React.FC<{ images: string[]; theme: PageTheme; desktop: boolean; onEvent?: Track }> = ({ images, theme, desktop, onEvent }) => {
    const [open, setOpen] = useState<number | null>(null);
    const show = (i: number) => { setOpen(i); onEvent?.('page_gallery_open', { index: i }); };
    const img = (src: string, i: number, style: React.CSSProperties) => (
        <button key={src + i} type="button" onClick={() => show(i)} aria-label={`Открыть фото ${i + 1}`}
            style={{ padding: 0, border: 0, background: 'var(--lf-raised)', borderRadius: 'var(--brand-radius-inner)', overflow: 'hidden', cursor: 'zoom-in', ...style }}>
            <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </button>
    );
    let body: React.ReactNode;
    if (desktop) {
        body = (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridAutoRows: 160, gap: 8 }}>
                {images.slice(0, 6).map((src, i) => img(src, i, i === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : {}))}
            </div>
        );
    } else if (theme === 'photo') {
        // Лента с листанием — продолжение «фото на весь экран».
        body = (
            <div className="lf-scroll-x" style={{ marginRight: -16, paddingRight: 16 }}>
                {images.map((src, i) => img(src, i, { width: 220, height: 300, borderRadius: 'var(--brand-radius-panel)' }))}
            </div>
        );
    } else {
        // Мозаика: большое фото и миниатюры.
        const rest = images.length - 4;
        body = (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridAutoRows: 96, gap: 8 }}>
                {images.slice(0, 1).map((src, i) => img(src, i, { gridColumn: 'span 3', gridRow: 'span 2' }))}
                {images.slice(1, 4).map((src, i) => (
                    i === 2 && rest > 0 ? (
                        <button key={src} type="button" onClick={() => show(3)} aria-label={`Ещё ${rest} фото`}
                            style={{ position: 'relative', padding: 0, border: 0, borderRadius: 'var(--brand-radius-small)', overflow: 'hidden', cursor: 'zoom-in' }}>
                            <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <span style={{ position: 'absolute', inset: 0, background: 'color-mix(in srgb, var(--brand-night) 55%, transparent)', color: 'var(--brand-on-photo)', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{rest}</span>
                        </button>
                    ) : img(src, i + 1, { borderRadius: 'var(--brand-radius-small)' })
                ))}
            </div>
        );
    }
    return (
        <section aria-labelledby="lf-gallery-h" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px' }}>
                <h2 id="lf-gallery-h" className="lf-h2">Как у нас</h2>
                <span className="lf-kicker">{images.length} фото</span>
            </div>
            {body}
            {open !== null && <Lightbox images={images} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
        </section>
    );
};

// ─── Видео ────────────────────────────────────────────────────────────────────
// preload="none": первый экран не тянет мегабайты; звук — только по нажатию «смотреть».
export const VideoBlock: React.FC<{ video: NonNullable<LandingPageDesign['video']>; fallbackPoster?: string; onEvent?: Track }> = ({ video, fallbackPoster, onEvent }) => {
    const [playing, setPlaying] = useState(false);
    // Рамка — по пропорциям самого ролика (вертикальный 9:16 целиком, а не полоса из середины в 16:9).
    // До метаданных — 16:9; вертикаль не выше 80% экрана, ролик вписывается без обрезки.
    const [ratio, setRatio] = useState(16 / 9);
    const ref = useRef<HTMLVideoElement>(null);
    const poster = video.poster || fallbackPoster || undefined;
    const vertical = ratio < 1;
    return (
        <section aria-label="Видео клуба" className="lf-card" style={{ position: 'relative', overflow: 'hidden', aspectRatio: String(ratio), maxHeight: vertical ? '80vh' : undefined, padding: 0, background: 'var(--brand-night)' }}>
            <video ref={ref} src={video.url} poster={poster} preload="metadata" playsInline controls={playing}
                onPlay={() => setPlaying(true)}
                onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth > 0 && v.videoHeight > 0) setRatio(Math.min(Math.max(v.videoWidth / v.videoHeight, 9 / 16), 21 / 9));
                }}
                style={{ width: '100%', height: '100%', objectFit: vertical ? 'contain' : 'cover', display: 'block', background: 'var(--brand-night)' }} />
            {!playing && (
                <button type="button" aria-label="Смотреть видео клуба"
                    onClick={() => { setPlaying(true); onEvent?.('page_video_play'); void ref.current?.play().catch(() => { /* браузер запретил — останутся контролы */ }); }}
                    style={{ position: 'absolute', inset: 0, border: 0, cursor: 'pointer', background: 'linear-gradient(175deg, color-mix(in srgb, var(--brand-night) 5%, transparent) 40%, color-mix(in srgb, var(--brand-night) 85%, transparent) 100%)', display: 'flex', alignItems: 'flex-end', padding: 20, gap: 14 }}>
                    <span style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--lf-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="var(--lf-on-accent)" /></svg>
                    </span>
                    <span style={{ color: 'var(--brand-on-photo)', fontSize: 17, fontWeight: 600, alignSelf: 'center' }}>Видео клуба</span>
                </button>
            )}
        </section>
    );
};

// ─── Карта и адрес ────────────────────────────────────────────────────────────
// Карта грузится, только когда блок доходит до экрана; нет WebGL или тайлов — остаётся адрес и маршрут.
export const MapBlock: React.FC<{
    map: NonNullable<LandingPageDesign['map']>; theme: PageTheme; address?: string | null; hours?: string | null;
    clubName: string; logoUrl?: string; onEvent?: Track;
}> = ({ map, theme, address, hours, clubName, logoUrl, onEvent }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        let handle: { destroy: () => void } | null = null;
        let cancelled = false;
        const start = () => {
            import('./clubMap')
                .then(({ mountClubMap }) => {
                    if (cancelled || !boxRef.current) return;
                    try {
                        handle = mountClubMap(boxRef.current, {
                            lat: map.lat, lng: map.lng, logoUrl, clubName, onError: () => setFailed(true),
                        });
                    } catch { setFailed(true); }
                })
                .catch(() => setFailed(true));
        };
        if (!('IntersectionObserver' in window)) { start(); return () => { cancelled = true; handle?.destroy(); }; }
        const io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
        }, { rootMargin: '300px' });
        io.observe(el);
        return () => { cancelled = true; io.disconnect(); handle?.destroy(); };
    }, [map.lat, map.lng, logoUrl, clubName]);

    const route = `https://yandex.ru/maps/?rtext=~${map.lat},${map.lng}&rtt=auto`;
    return (
        // Карта в приложении всегда тёмная (картинка — на тёмном): карточка карты — тёмный островок в любой теме страницы.
        <section aria-labelledby="lf-map-h" className={`lf-card${theme === 'light' ? ' surface-always-dark lf-dark-island' : ''}`} style={{ overflow: 'hidden', padding: 0 }}>
            {!failed && <div ref={boxRef} style={{ height: 280, background: 'var(--brand-night)' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 16px 20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <h2 id="lf-map-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{address || clubName}</h2>
                    {hours && <div className="lf-kicker" style={{ marginTop: 2 }}>{hours}</div>}
                </div>
                <a className="lf-btn lf-btn--accent" href={route} target="_blank" rel="noopener noreferrer"
                    onClick={() => onEvent?.('page_route_click')}>Маршрут</a>
            </div>
        </section>
    );
};

// ─── Соцсети ──────────────────────────────────────────────────────────────────
// Фирменные знаки сетей (23.11.2026, «Сектор»: «хочется нативные иконки»). Знак — цветом текста кнопки, цвет
// кнопки выбирает клуб: нейтральные (как было), цвет кнопки страницы или свой из палитры мастера ЕРП.
// Пути знаков — Material Design Icons (Apache 2.0), сайт — значок глобуса.
const SOCIAL_PATHS: Record<Exclude<SocialKind, 'website'>, string> = {
    vk: 'M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2m3.08 14.27h-1.46c-.55 0-.72-.45-1.71-1.44-.86-.83-1.25-.94-1.46-.94-.3 0-.39.08-.39.5v1.31c0 .35-.11.57-1.04.57-1.54 0-3.25-.94-4.45-2.67-1.81-2.54-2.3-4.44-2.3-4.83 0-.21.08-.4.5-.4h1.47c.37 0 .51.16.65.56.72 2.09 1.92 3.91 2.41 3.91.19 0 .27-.09.27-.55V9.13c-.05-.99-.58-1.07-.58-1.43 0-.17.14-.34.37-.34h2.3c.31 0 .42.16.42.54v2.89c0 .31.13.42.23.42.18 0 .33-.11.67-.45 1.05-1.17 1.8-2.98 1.8-2.98.1-.21.26-.4.63-.4h1.46c.44 0 .54.22.44.54-.18.85-1.96 3.36-1.96 3.36-.15.26-.21.37 0 .65.15.21.66.65 1 1.04.62.71 1.1 1.3 1.22 1.71.13.41-.08.62-.49.62Z',
    telegram: 'M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z',
    instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z',
};

export const SocialIcon: React.FC<{ kind: SocialKind; size?: number }> = ({ kind, size = 20 }) => kind === 'website' ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
    </svg>
) : (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={SOCIAL_PATHS[kind]} fill="currentColor" /></svg>
);

/** `tone` — цвет кнопок: null — нейтральные; иначе фон и цвет знака (контраст считает PageLanding). */
export const SocialBlock: React.FC<{ links: SocialLink[]; tone?: { bg: string; fg: string } | null; onEvent?: Track }> = ({ links, tone, onEvent }) => (
    <nav aria-label="Клуб в соцсетях"
        style={{
            display: 'grid', gridTemplateColumns: `repeat(${links.length === 4 ? 2 : Math.min(links.length, 3)}, minmax(0, 1fr))`, gap: 8,
            ...(tone ? { '--lf-accent': tone.bg, '--lf-on-accent': tone.fg } as React.CSSProperties : {}),
        }}>
        {links.map((l) => (
            <a key={l.label} className={`lf-btn${tone ? ' lf-btn--accent' : ''}`} href={l.url} target="_blank" rel="noopener noreferrer"
                style={{ minWidth: 0 }}
                onClick={() => onEvent?.('app_redirect_click', { social: l.label })}>
                <SocialIcon kind={l.kind} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.label}</span>
            </a>
        ))}
    </nav>
);

// ─── Наши клубы ───────────────────────────────────────────────────────────────
// 23.11.2026 «Сектор»: «в самом низу нужно выбрать город и клуб, чтобы человек не думал, что у нас один клуб».
// Клубы того же владельца (сервер: clubform_page_public), город — переключателем, у клуба — адрес и маршрут.
const plural = (n: number, one: string, few: string, many: string) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
};

export const ClubsBlock: React.FC<{ clubs: PageClub[]; onEvent?: Track }> = ({ clubs, onEvent }) => {
    const cities: string[] = [];
    clubs.forEach((c) => { const k = c.city || 'Другие'; if (!cities.includes(k)) cities.push(k); });
    const home = clubs.find((c) => c.current)?.city || cities[0];
    const [city, setCity] = useState(home);
    const shown = cities.length > 1 ? clubs.filter((c) => (c.city || 'Другие') === city) : clubs;
    return (
        <section className="lf-card" style={{ padding: 24 }} aria-labelledby="lf-clubs-h">
            <div className="lf-kicker">
                {clubs.length} {plural(clubs.length, 'клуб', 'клуба', 'клубов')}
                {cities.length > 1 ? ` · ${cities.length} ${plural(cities.length, 'город', 'города', 'городов')}` : ''}
            </div>
            <h2 id="lf-clubs-h" className="lf-h2" style={{ marginTop: 2 }}>Наши клубы</h2>
            {cities.length > 1 && (
                <div className="lf-scroll-x" role="group" aria-label="Город" style={{ marginTop: 14, marginRight: -24, paddingRight: 24 }}>
                    {cities.map((c) => (
                        <button key={c} type="button" aria-pressed={c === city}
                            className={`lf-btn${c === city ? ' lf-btn--accent' : ''}`}
                            style={{ height: 36, padding: '0 14px', borderRadius: 999, fontSize: 14 }}
                            onClick={() => { setCity(c); onEvent?.('page_city_select', { city: c }); }}>
                            {c}
                        </button>
                    ))}
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
                {shown.map((c) => {
                    // Адрес «Находка» у клуба в Находке — повтор города: не показываем. Один город — показываем город.
                    const sub = (c.address && c.address !== c.city ? c.address : null) || (cities.length < 2 ? c.city : null);
                    const route = c.lat !== null && c.lng !== null ? `https://yandex.ru/maps/?rtext=~${c.lat},${c.lng}&rtt=auto` : null;
                    return (
                        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--lf-line)' }}>
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 17, fontWeight: 600 }}>{c.name}</span>
                                    {c.current && <span className="lf-kicker" style={{ color: 'var(--brand-green-ink)' }}>вы здесь</span>}
                                </div>
                                {sub && <div className="lf-label" style={{ marginTop: 2 }}>{sub}</div>}
                            </div>
                            {route && (
                                <a className="lf-btn" href={route} target="_blank" rel="noopener noreferrer"
                                    style={{ height: 40, padding: '0 14px', fontSize: 14, flexShrink: 0 }}
                                    onClick={() => onEvent?.('page_club_route', { club: c.name })}>Маршрут</a>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
