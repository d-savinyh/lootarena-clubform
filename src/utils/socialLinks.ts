import type { ClubLanding } from './api';

/** Соцсети и сайт клуба для страницы формы — одно правило для «Вида страницы» и подвала. */

/** Ссылка клуба без схемы («sektor.ru») — https; чужие схемы (javascript:, data:) не пропускаем. */
const webUrl = (raw: string): string | null => {
    const v = raw.trim();
    if (!v) return null;
    const url = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
    return /^https?:\/\//i.test(url) ? url : null;
};

export type SocialKind = 'vk' | 'telegram' | 'instagram' | 'website';
export interface SocialLink { kind: SocialKind; label: string; url: string }

export const clubSocialLinks = (s: ClubLanding['club']['socialLinks']): SocialLink[] => {
    if (!s) return [];
    const vk = s.vk ? webUrl(s.vk) : null;
    const instagram = s.instagram ? webUrl(s.instagram) : null;
    // 17.11.2026 «Сектор Баляева»: сайт клуба сервер отдавал, а страница его пропускала.
    const website = s.website ? webUrl(s.website) : null;
    return ([
        vk ? { kind: 'vk', label: 'ВКонтакте', url: vk } : null,
        s.telegram ? { kind: 'telegram', label: 'Telegram', url: s.telegram.startsWith('http') ? s.telegram : `https://t.me/${s.telegram.replace(/^@/, '')}` } : null,
        instagram ? { kind: 'instagram', label: 'Instagram', url: instagram } : null,
        website ? { kind: 'website', label: 'Сайт', url: website } : null,
    ].filter(Boolean)) as SocialLink[];
};
