// Только локальная разработка (import.meta.env.DEV): `?dev_page=night|photo|light` подставляет вид страницы
// поверх НАСТОЯЩЕГО ответа get_landing — проверить темы и блоки без правки формы в боевой БД.
// В прод-сборку не попадает: импорт стоит за `import.meta.env.DEV`.
// Данные — «Убежище 78 Легенда» 26.10.2026: свободно — из fn_app_club_load, цены — из справочника кассы.
export const pageDevFixture = (theme: string) => ({
    theme,
    accent: '#F2B118',
    blocks: ['free', 'prices', 'gallery', 'video', 'map', 'social', 'clubs'],
    // `?dev_gift=big|badge|none`, `?dev_social=accent|#RRGGBB` — настройки вида 23.11.2026.
    giftIcon: new URLSearchParams(window.location.search).get('dev_gift') || 'big',
    socialColor: new URLSearchParams(window.location.search).get('dev_social') || null,
    freeSpecs: true,
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
            { name: 'DUO', total: 8, available: 6, specs: { cpu: 'Core i7-12700', gpu: 'RTX 4070 Ti', ram: '32 ГБ', monitor: '300 Гц' } },
            { name: 'Open Space', total: 10, available: 8, specs: { cpu: 'Core i5-12400F', gpu: 'RTX 3070', ram: '32 ГБ', monitor: '165 Гц' } },
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
    // «Наши клубы» — пример «Сектора» (7 клубов, 4 города), 23.11.2026.
    clubs: [
        { name: 'Сектор Артем', city: 'Артем', address: 'Артем', lat: 43.352722, lng: 132.17245, current: false },
        { name: 'Сектор Баляева', city: 'Владивосток', address: 'Баляева 35', lat: 43.129921, lng: 131.938213, current: true },
        { name: 'Сектор БАМ', city: 'Владивосток', address: 'Металлургическая 7', lat: 43.15528, lng: 131.919572, current: false },
        { name: 'Сектор Калинина', city: 'Владивосток', address: 'Калинина 275', lat: 43.094051, lng: 131.902814, current: false },
        { name: 'Сектор Острякова', city: 'Владивосток', address: 'Острякова 5А', lat: 43.130438, lng: 131.899776, current: false },
        { name: 'Сектор Находка', city: 'Находка', address: 'Находка', lat: 42.834319, lng: 132.901111, current: false },
        { name: 'Sektor ХБК', city: 'Хабаровск', address: 'Станционная 19', lat: 48.495069, lng: 135.066645, current: false },
    ],
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
                // Абзацы и список — как вставляет клуб из заметок (23.11.2026 «Сектор»: раньше шло сплошником).
                offerDescription: 'Оставьте номер — бонусы придут в приложение Loot Arena.\nИх можно потратить на игру в клубе.\n\nЧто внутри:\n— 500 бонусов на игру\n— скидка на бар\n— приоритет при брони',
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
