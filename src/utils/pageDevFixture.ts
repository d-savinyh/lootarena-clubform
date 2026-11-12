// Только локальная разработка (import.meta.env.DEV): `?dev_page=night|photo|light` подставляет вид страницы
// поверх НАСТОЯЩЕГО ответа get_landing — проверить темы и блоки без правки формы в боевой БД.
// В прод-сборку не попадает: импорт стоит за `import.meta.env.DEV`.
// Данные — «Убежище 78 Легенда» 26.10.2026: свободно — из fn_app_club_load, цены — из справочника кассы.
export const pageDevFixture = (theme: string) => ({
    theme,
    accent: '#F2B118',
    blocks: ['free', 'prices', 'gallery', 'video', 'map', 'social'],
    gallery: [
        'https://s3.lootarena.ru/uploads/images/2026/06/1782469908456_c41nkc_full.webp',
        'https://s3.lootarena.ru/uploads/images/2026/07/1785434311054_3l7lcg_full.webp',
        'https://s3.lootarena.ru/uploads/images/2026/06/1782471892952_fmffgb_full.webp',
        'https://s3.lootarena.ru/uploads/images/2026/06/1782471782669_vj1dwb_full.webp',
        'https://s3.lootarena.ru/uploads/images/2026/06/1782680718507_639jlz_full.webp',
    ],
    // Видео — только постер (файл не грузится до нажатия: preload=none), чтобы блок был виден в проверке вида.
    video: { url: 'https://s3.lootarena.ru/uploads/videos/dev-fixture-club.mp4', poster: 'https://s3.lootarena.ru/uploads/images/2026/06/1782471892952_fmffgb_full.webp' },
    free: {
        updatedAt: new Date(Date.now() - 3 * 60000).toISOString(),
        zones: [
            { name: 'DUO', total: 8, available: 6 },
            { name: 'Open Space', total: 10, available: 8 },
            { name: 'SOLO', total: 2, available: 1 },
            { name: 'SOLO STREAM', total: 1, available: 0 },
            { name: 'VIP', total: 10, available: 8 },
        ],
    },
    prices: [
        { zone: 'Open Space', title: 'Базовый тариф', price: 190, schedule: 'Пн–Чт · весь день', minutes: null, currency: 'RUB' },
        { zone: 'Open Space', title: 'Пакет 3 часа', price: 520, schedule: 'Пн–Чт', minutes: 180, currency: 'RUB' },
        { zone: 'Open Space', title: 'Пакет Ночь', price: 990, schedule: '22:00–8:00', minutes: 600, currency: 'RUB' },
        { zone: 'VIP', title: 'Базовый тариф', price: 240, schedule: 'Пн–Чт · весь день', minutes: null, currency: 'RUB' },
        { zone: 'VIP', title: 'Пакет 3 часа', price: 630, schedule: 'Пн–Чт', minutes: 180, currency: 'RUB' },
        { zone: 'DUO', title: 'Базовый тариф', price: 320, schedule: 'Каждый день', minutes: null, currency: 'RUB' },
        { zone: 'SOLO', title: 'Базовый тариф', price: 410, schedule: 'Каждый день', minutes: null, currency: 'RUB' },
    ],
    map: { lat: 59.913636, lng: 30.438143 },
});

// `?dev_offline` — страница целиком без сети: ответ get_landing и «заявка принята» берутся отсюда,
// просмотры и события не уходят (иначе локальная проверка вида накручивает просмотры настоящей формы клуба).
// Комбинируется с `?dev_page=night|photo|light`; без него — прежний вид страницы.
export const devOfflineAnswer = (action: string): unknown => {
    if (action === 'get_landing') {
        return {
            club: {
                name: 'Убежище 78 Легенда',
                address: 'Санкт-Петербург, Октябрьская наб., 10',
                workingHours: 'Круглосуточно',
                avatarUrl: 'https://s3.lootarena.ru/1776148712030_Logo 2_thumb.png',
                coverUrl: null,
                socialLinks: { vk: 'https://vk.com/', telegram: 'https://t.me/' },
                currency: 'RUB',
                operator: { name: 'ООО «Пример»', taxLabel: 'ИНН', taxId: '7800000000', address: null },
            },
            form: {
                id: '00000000-0000-4000-8000-000000000001',
                slug: 'dev-offline',
                offerType: 'custom',
                offerTitle: '500 бонусов на первую игру',
                offerDescription: 'Оставьте номер — бонусы придут в приложение Loot Arena, их можно потратить на игру в клубе.',
                offerTerms: 'Один подарок на номер. Бонусы сгорают через 14 дней.',
                offerBadge: 'До конца недели',
                brandColor: '#F2B118',
                gift: { reward_type: 'BONUSES', reward_text: '500 бонусов', reward_meta: { bonus_amount: 500 }, expires_in_days: '14' },
                variant: 'A',
                coverImage: null,
                ctaText: null,
                tracking: null,
                isNetwork: false,
                clubs: null,
                ageGate: null,
                page: null,
                linkUtm: null,
            },
        };
    }
    if (action === 'submit_lead') return { ok: true, giftStatus: 'inventory', clubPromoCount: 3 };
    return { ok: true };
};
