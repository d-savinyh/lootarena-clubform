import React, { useEffect, useRef, useState } from 'react';
import type { LandingPageDesign, PageTheme } from '../../utils/page';
import { formatMinutes, formatMoney, freshnessLabel, summarizePrices } from '../../utils/page';

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

export const FreeNowBlock: React.FC<{ free: NonNullable<LandingPageDesign['free']>; compact?: boolean }> = ({ free, compact }) => {
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
                        </div>
                    ) : (
                        <div key={z.name} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: '1px solid var(--lf-line)' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                                <span style={{ flexGrow: 1, fontSize: 17, minWidth: 0 }}>{z.name}</span>
                                {count}
                            </div>
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
    const ref = useRef<HTMLVideoElement>(null);
    const poster = video.poster || fallbackPoster || undefined;
    return (
        <section aria-label="Видео клуба" className="lf-card" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16 / 9', padding: 0 }}>
            <video ref={ref} src={video.url} poster={poster} preload="none" playsInline controls={playing}
                onPlay={() => setPlaying(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: 'var(--brand-night)' }} />
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
export const SocialBlock: React.FC<{ links: { label: string; url: string }[]; onEvent?: Track }> = ({ links, onEvent }) => (
    <nav aria-label="Клуб в соцсетях" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(links.length, 3)}, minmax(0, 1fr))`, gap: 8 }}>
        {links.map((l) => (
            <a key={l.label} className="lf-btn" href={l.url} target="_blank" rel="noopener noreferrer"
                onClick={() => onEvent?.('app_redirect_click', { social: l.label })}>{l.label}</a>
        ))}
    </nav>
);
