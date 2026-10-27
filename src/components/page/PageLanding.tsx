import React from 'react';
import type { ClubLanding } from '../../utils/api';
import type { LandingPageDesign, PageBlockType } from '../../utils/page';
import { FreeNowBlock, GalleryBlock, MapBlock, PricesBlock, SocialBlock, VideoBlock } from './PageBlocks';

// Лид-формы 2.0: страница клуба по теме и блокам из настроек формы (offer_config.page).
// Логика заявки, возраста, сетевой формы и экрана успеха остаётся в LandingPage — сюда приходят готовые
// элементы (оффер, выбор филиала, подарок, форма), а эта раскладка только расставляет их и блоки.

type Track = (type: string, meta?: Record<string, unknown>) => void;

interface Props {
    page: LandingPageDesign;
    club: ClubLanding['club'];
    accent: string;
    coverUrl?: string | null;
    isDesktop: boolean;
    offer: React.ReactNode;
    clubPicker: React.ReactNode;
    giftCard: React.ReactNode;
    form: React.ReactNode;
    error: React.ReactNode;
    /** Сетевая форма до выбора филиала: адреса и соцсетей ещё нет. */
    hideClubDetails: boolean;
    onEvent: Track;
}

const hoursText = (wh: unknown): string | null => {
    if (!wh) return null;
    if (typeof wh === 'string') return wh;
    const w = wh as { is24_7?: boolean; days?: Record<string, { open?: string; close?: string }> };
    if (w.is24_7) return 'Открыто круглосуточно';
    const first = w.days ? Object.values(w.days)[0] : undefined;
    return first?.open && first?.close ? `${first.open} — ${first.close}` : null;
};

/** Тёмный текст на светлом акценте, белый — на тёмном (кнопка и наклейки читаются при любом цвете клуба). */
const onAccent = (hex: string) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) return '#06110a';
    const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? '#06110a' : '#ffffff';
};

const socialLinks = (s: ClubLanding['club']['socialLinks']) => {
    if (!s) return [];
    return ([
        s.vk ? { label: 'ВКонтакте', url: s.vk } : null,
        s.telegram ? { label: 'Telegram', url: s.telegram.startsWith('http') ? s.telegram : `https://t.me/${s.telegram.replace(/^@/, '')}` } : null,
        s.instagram ? { label: 'Instagram', url: s.instagram } : null,
    ].filter(Boolean)) as { label: string; url: string }[];
};

const PageLanding: React.FC<Props> = ({ page, club, accent, coverUrl, isDesktop, offer, clubPicker, giftCard, form, error, hideClubDetails, onEvent }) => {
    const theme = page.theme;
    const hours = hideClubDetails ? null : hoursText(club.workingHours);
    const address = hideClubDetails ? null : club.address;
    const social = hideClubDetails ? [] : socialLinks(club.socialLinks);
    const cover = coverUrl || page.gallery[0] || null;

    const block = (type: PageBlockType): React.ReactNode => {
        switch (type) {
            case 'free': return page.free ? <FreeNowBlock key={type} free={page.free} compact={theme === 'photo' || isDesktop} /> : null;
            case 'prices': return page.prices ? <PricesBlock key={type} prices={page.prices} currency={club.currency} onEvent={onEvent} /> : null;
            case 'gallery': return page.gallery.length ? <GalleryBlock key={type} images={page.gallery} theme={theme} desktop={isDesktop} onEvent={onEvent} /> : null;
            case 'video': return page.video ? <VideoBlock key={type} video={page.video} fallbackPoster={page.gallery[0] || cover || undefined} onEvent={onEvent} /> : null;
            case 'map': return page.map && !hideClubDetails
                ? <MapBlock key={type} map={page.map} theme={theme} address={address} hours={hours} clubName={club.name} logoUrl={club.avatarUrl} onEvent={onEvent} />
                : null;
            case 'social': return social.length ? <SocialBlock key={type} links={social} onEvent={onEvent} /> : null;
            default: return null;
        }
    };
    const blocks = page.blocks.map(block).filter(Boolean);

    const logo = (size: number) => club.avatarUrl ? (
        <img src={club.avatarUrl} alt={`Логотип ${club.name}`} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, borderRadius: size > 48 ? 16 : 12 }} />
    ) : null;

    const nameBlock = (light = false) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.2 }}>{club.name}</div>
            {(address || hours) && (
                <div style={{ fontSize: 14, fontWeight: 500, color: light ? 'var(--lf-muted)' : '#c9cec7' }}>
                    {[address, hours].filter(Boolean).join(' · ')}
                </div>
            )}
        </div>
    );

    // Шапка темы «Ночь»: фото карточкой, логотип и имя на затемнении.
    const nightHeader = (
        <div style={{ position: 'relative', height: isDesktop ? 280 : 236, borderRadius: 28, overflow: 'hidden', background: 'var(--lf-surface)' }}>
            {cover && <img src={cover} alt={`Зал клуба ${club.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(175deg, rgba(10,11,10,0) 35%, rgba(10,11,10,0.94) 92%)' }} />
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', alignItems: 'center', gap: 12, color: '#eef2ec' }}>
                {logo(52)}
                {nameBlock()}
            </div>
        </div>
    );

    // Шапка «Светлой»: логотип на тёмной плитке + имя, обложка — отдельной карточкой ниже.
    const lightHeader = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 4px' }}>
                {club.avatarUrl && (
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: '#0a0b0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {logo(46)}
                    </div>
                )}
                {nameBlock(true)}
            </div>
            {cover && <img src={cover} alt={`Зал клуба ${club.name}`} style={{ width: '100%', height: isDesktop ? 260 : 200, objectFit: 'cover', borderRadius: 28, display: 'block' }} />}
        </div>
    );

    // «Фото на весь экран»: первый экран — фото клуба, оффер и форма начинаются поверх затемнения.
    const photoHero = (
        <div style={{ position: 'relative', height: isDesktop ? 460 : '58vh', minHeight: isDesktop ? undefined : 340, overflow: 'hidden', background: 'var(--lf-surface)' }}>
            {cover && <img src={cover} alt={`Зал клуба ${club.name}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '30% center' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(175deg, rgba(10,11,10,0.55) 0%, rgba(10,11,10,0.05) 24%, rgba(10,11,10,0.25) 45%, rgba(10,11,10,1) 100%)' }} />
            <div style={{ position: 'absolute', top: 20, left: 16, right: 16, maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, color: '#eef2ec' }}>
                {logo(40)}
                <div style={{ flexGrow: 1, fontSize: 15, fontWeight: 700 }}>{club.name}</div>
                {hours && <span style={{ height: 28, padding: '0 12px', borderRadius: 999, background: 'rgba(18,20,18,0.72)', display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{hours === 'Открыто круглосуточно' ? '24/7' : hours}</span>}
            </div>
        </div>
    );

    const main = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {offer}
            {clubPicker}
            {giftCard}
            {form}
            {error}
        </div>
    );
    const footer = (
        <footer style={{ padding: '24px 0 8px', textAlign: 'center' }} className="lf-label">Страница клуба на Loot Arena</footer>
    );

    const style = {
        '--lf-accent': accent,
        '--lf-on-accent': onAccent(accent),
    } as React.CSSProperties;

    // ── Компьютер: слева — шапка, оффер и выбор филиала; справа сразу подарок и номер телефона
    // (заявка — на первом экране), ниже — блоки страницы. Без липких колонок: высота оффера у клубов
    // разная, и липкая колонка выше экрана прятала бы свой низ. ──
    if (isDesktop) {
        return (
            <div className="lf-page" data-theme={theme} style={style}>
                {theme === 'photo' && photoHero}
                <div style={{
                    maxWidth: 1200, margin: theme === 'photo' ? '-200px auto 0' : '0 auto', padding: '32px 32px 40px', position: 'relative',
                    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 32, alignItems: 'start',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {theme === 'night' && nightHeader}
                        {theme === 'light' && lightHeader}
                        {offer}
                        {clubPicker}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {giftCard}
                        {form}
                        {error}
                        {blocks}
                        {footer}
                    </div>
                </div>
            </div>
        );
    }

    // ── Телефон: одна колонка, первым экраном — шапка, оффер и номер телефона. ──
    return (
        <div className="lf-page" data-theme={theme} style={style}>
            {theme === 'photo' && photoHero}
            <div style={{ maxWidth: 480, margin: theme === 'photo' ? '-140px auto 0' : '0 auto', padding: '16px 16px 32px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {theme === 'night' && nightHeader}
                {theme === 'light' && lightHeader}
                {main}
                {blocks.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>{blocks}</div>}
                {footer}
            </div>
        </div>
    );
};

export default PageLanding;
