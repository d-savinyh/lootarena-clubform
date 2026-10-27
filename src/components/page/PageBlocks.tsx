import React, { useEffect, useRef, useState } from 'react';
import type { LandingPageDesign, PageTheme } from '../../utils/page';
import { formatMinutes, formatMoney, freshnessLabel, summarizePrices } from '../../utils/page';

type Track = (type: string, meta?: Record<string, unknown>) => void;

// ─── Свободно сейчас ──────────────────────────────────────────────────────────
// Те же цифры, что «Клуб сейчас» в приложении (fn_app_club_load). Зелёный = свободно — во всех темах.
export const FreeNowBlock: React.FC<{ free: NonNullable<LandingPageDesign['free']>; compact?: boolean }> = ({ free, compact }) => {
    const fresh = freshnessLabel(free.updatedAt);
    return (
        <section className="lf-card" style={{ padding: 24 }} aria-labelledby="lf-free-h">
            <div style={{ marginBottom: 6 }}>
                <h2 id="lf-free-h" className="lf-h2">Свободно сейчас</h2>
                {fresh && <div className="lf-label" style={{ marginTop: 4 }}>{fresh}</div>}
            </div>
            <div style={compact ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 10 } : undefined}>
                {free.zones.map((z) => (
                    compact ? (
                        <div key={z.name} style={{ padding: 16, borderRadius: 20, background: 'var(--lf-raised)' }}>
                            <div className="lf-kicker">{z.name}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                                <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: z.available > 0 ? 'var(--lf-free)' : 'var(--lf-muted)' }}>{z.available}</span>
                                <span className="lf-kicker">из {z.total}</span>
                            </div>
                        </div>
                    ) : (
                        <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, borderTop: '1px solid var(--lf-line)' }}>
                            <span style={{ flexGrow: 1, fontSize: 17 }}>{z.name}</span>
                            <span style={{
                                height: 28, padding: '0 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center',
                                fontSize: 15, fontWeight: 700,
                                background: z.available > 0 ? 'var(--lf-free)' : 'var(--lf-busy)',
                                color: z.available > 0 ? 'var(--lf-on-free)' : 'var(--lf-muted)',
                            }}>
                                {z.available > 0 ? `${z.available} из ${z.total}` : 'всё занято'}
                            </span>
                        </div>
                    )
                ))}
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
                <span className="lf-label">из кассы клуба</span>
            </div>
            {zones.map((z) => (
                <div key={z.zone} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 0', borderTop: '1px solid var(--lf-line)' }}>
                    <span style={{ flexGrow: 1, fontSize: 17 }}>{z.zone}</span>
                    <span style={{ fontSize: 17, fontWeight: 700, textAlign: 'right' }}>
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
            style={{ position: 'absolute', top: '50%', [dir > 0 ? 'right' : 'left']: 12, transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: 999, border: 0, background: 'rgba(18,20,18,0.72)', color: '#eef2ec', fontSize: 22, cursor: 'pointer' }}>
            {dir > 0 ? '›' : '‹'}
        </button>
    );
    return (
        <div role="dialog" aria-modal="true" aria-label="Фото клуба" onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(5,6,7,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <img src={images[index]} alt={`Фото клуба ${index + 1} из ${images.length}`} onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '100%', maxHeight: '86vh', borderRadius: 20, objectFit: 'contain' }} />
            {images.length > 1 && arrow(-1)}
            {images.length > 1 && arrow(1)}
            <button type="button" aria-label="Закрыть" onClick={onClose}
                style={{ position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 999, border: 0, background: 'rgba(18,20,18,0.72)', color: '#eef2ec', fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', color: '#9ea39d', fontSize: 14, fontWeight: 500 }}>{index + 1} / {images.length}</div>
        </div>
    );
};

export const GalleryBlock: React.FC<{ images: string[]; theme: PageTheme; desktop: boolean; onEvent?: Track }> = ({ images, theme, desktop, onEvent }) => {
    const [open, setOpen] = useState<number | null>(null);
    const show = (i: number) => { setOpen(i); onEvent?.('page_gallery_open', { index: i }); };
    const img = (src: string, i: number, style: React.CSSProperties) => (
        <button key={src + i} type="button" onClick={() => show(i)} aria-label={`Открыть фото ${i + 1}`}
            style={{ padding: 0, border: 0, background: 'var(--lf-raised)', borderRadius: 20, overflow: 'hidden', cursor: 'zoom-in', ...style }}>
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
                {images.map((src, i) => img(src, i, { width: 220, height: 300, borderRadius: 24 }))}
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
                            style={{ position: 'relative', padding: 0, border: 0, borderRadius: 14, overflow: 'hidden', cursor: 'zoom-in' }}>
                            <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <span style={{ position: 'absolute', inset: 0, background: 'rgba(10,11,10,0.55)', color: '#fff', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{rest}</span>
                        </button>
                    ) : img(src, i + 1, { borderRadius: 14 })
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
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#050607' }} />
            {!playing && (
                <button type="button" aria-label="Смотреть видео клуба"
                    onClick={() => { setPlaying(true); onEvent?.('page_video_play'); void ref.current?.play().catch(() => { /* браузер запретил — останутся контролы */ }); }}
                    style={{ position: 'absolute', inset: 0, border: 0, cursor: 'pointer', background: 'linear-gradient(175deg, rgba(10,11,10,0.05) 40%, rgba(10,11,10,0.85) 100%)', display: 'flex', alignItems: 'flex-end', padding: 20, gap: 14 }}>
                    <span style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--lf-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="var(--lf-on-accent)" /></svg>
                    </span>
                    <span style={{ color: '#eef2ec', fontSize: 17, fontWeight: 600, alignSelf: 'center' }}>Видео клуба</span>
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
                            lat: map.lat, lng: map.lng, light: theme === 'light', logoUrl, clubName, onError: () => setFailed(true),
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
    }, [map.lat, map.lng, theme, logoUrl, clubName]);

    const route = `https://yandex.ru/maps/?rtext=~${map.lat},${map.lng}&rtt=auto`;
    return (
        <section aria-labelledby="lf-map-h" className="lf-card" style={{ overflow: 'hidden', padding: 0 }}>
            {!failed && <div ref={boxRef} style={{ height: 260, background: theme === 'light' ? '#eef2ec' : '#050607' }} />}
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
