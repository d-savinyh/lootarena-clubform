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
    video: null,
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
