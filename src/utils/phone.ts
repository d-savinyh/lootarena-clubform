// Формат телефона зависит от страны клуба. Поля страны в erp_clubs нет, зато есть
// currency_code, и он однозначно её задаёт: RUB → Россия, BYN → Беларусь, UZS → Узбекистан,
// KZT → Казахстан, KGS → Кыргызстан. Список валют клуба — lib/currency.ts в ЕРП
// (CLUB_CURRENCIES), записи здесь и там должны совпадать по кодам.
// На 16.08.2026 боевые клубы: 83 RUB, 2 BYN, 1 UZS; KZT/KGS заведены на будущее.
//
// Зачем строгая проверка: маска раньше принимала любую цифру после +7, и опечатка в одну
// позицию давала «валидный» +7 (798) 185-04-15 — для системы это НОВЫЙ номер, она бронировала
// на него подарок, который гость никогда не получит (29 таких заявок за всю историю).

export interface PhoneFormat {
    /** Код страны без плюса. */
    code: string;
    /** Размер групп после кода — по ним строится маска. */
    groups: number[];
    /** Всего цифр в номере вместе с кодом страны. */
    total: number;
    placeholder: string;
    /** Проверка ПОЛНОГО номера (только цифры, с кодом страны). */
    test: RegExp;
    /** Что показать, когда номер не прошёл проверку. */
    hint: string;
}

const FORMATS: Record<string, PhoneFormat> = {
    RUB: {
        code: '7', groups: [3, 3, 2, 2], total: 11,
        placeholder: '+7 (___) ___-__-__',
        // Мобильные России — только 9XX. Казахстан сидит на том же коде +7, но с
        // мобильными на 7XX — он отдельной записью ниже, по currency_code=KZT.
        test: /^79\d{9}$/,
        hint: 'Проверьте номер: мобильные России начинаются с +7 9…',
    },
    KZT: {
        code: '7', groups: [3, 3, 2, 2], total: 11,
        placeholder: '+7 (7__) ___-__-__',
        // Казахстан делит код +7 с Россией, но все его мобильные коды начинаются с 7
        // (700–708, 747, 750–751, 760–764, 771–778) — этим и различаем страны.
        test: /^77\d{9}$/,
        hint: 'Проверьте номер: мобильные Казахстана начинаются с +7 7…',
    },
    KGS: {
        code: '996', groups: [3, 2, 2, 2], total: 12,
        placeholder: '+996 (___) __-__-__',
        // Мобильные Кыргызстана: 2XX, 5XX, 7XX, 9XX (Beeline, MegaCom, O!)
        test: /^996[2579]\d{8}$/,
        hint: 'Проверьте номер: мобильные Кыргызстана — +996 2XX, 5XX, 7XX или 9XX…',
    },
    BYN: {
        code: '375', groups: [2, 3, 2, 2], total: 12,
        placeholder: '+375 (__) ___-__-__',
        // Мобильные Беларуси: 25 (life:), 29 (A1/МТС), 33 (МТС), 44 (A1)
        test: /^375(25|29|33|44)\d{7}$/,
        hint: 'Проверьте номер: мобильные Беларуси — +375 25, 29, 33 или 44…',
    },
    UZS: {
        code: '998', groups: [2, 3, 2, 2], total: 12,
        placeholder: '+998 (__) ___-__-__',
        test: /^998\d{9}$/,
        hint: 'Проверьте номер: мобильные Узбекистана — +998 XX XXX-XX-XX',
    },
};

export const getPhoneFormat = (currency?: string): PhoneFormat =>
    FORMATS[(currency || '').toUpperCase()] || FORMATS.RUB;

/** Оставляет только цифры и гарантирует код страны в начале. */
export const phoneDigits = (value: string, f: PhoneFormat): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const national = f.total - f.code.length;   // длина номера без кода страны

    // Готовый номер с кодом страны
    if (digits.length === f.total && digits.startsWith(f.code)) return digits;

    // Номер без кода страны целиком. Проверка по ДЛИНЕ, а не по первой цифре: у Казахстана
    // мобильные начинаются на 7, как и сам код страны, и «7011234567» иначе читалось бы
    // как уже готовый номер — на выходе выходил мусор вида +7 (011) 234-56-7.
    if (digits.length === national) return f.code + digits;

    // Привычная запись через восьмёрку: 8 (911) … — только для стран на коде +7
    if (f.code === '7' && digits.length === national + 1 && digits.startsWith('8')) {
        return f.code + digits.slice(1);
    }

    // Частичный ввод (гость ещё печатает): код страны в поле уже стоит
    return digits.startsWith(f.code) ? digits : f.code + digits;
};

/** Собирает «+7 (911) 123-45-67» из произвольного ввода по формату страны. */
const SEPARATORS = [' (', ') ', '-', '-'];

export const formatPhone = (value: string, f: PhoneFormat): string => {
    if (!value.replace(/\D/g, '')) return '';
    const rest = phoneDigits(value, f).slice(f.code.length, f.total);
    let out = `+${f.code}`;
    let pos = 0;
    f.groups.forEach((size, i) => {
        const part = rest.slice(pos, pos + size);
        if (part) out += SEPARATORS[Math.min(i, SEPARATORS.length - 1)] + part;
        pos += size;
    });
    // Скобку закрываем, когда первая группа набрана, а следующая ещё не начата
    if (rest.length === f.groups[0]) out += ')';
    return out;
};

export const isValidPhone = (value: string, f: PhoneFormat): boolean =>
    f.test.test(phoneDigits(value, f));
