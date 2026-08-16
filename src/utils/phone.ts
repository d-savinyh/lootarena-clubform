// Формат телефона зависит от страны клуба. Поля страны в erp_clubs нет, зато есть
// currency_code, и он однозначно её задаёт: RUB → Россия, BYN → Беларусь, UZS → Узбекистан
// (на 16.08.2026 — 83 / 2 / 1 клуб соответственно). Лендинг получает его в club.currency.
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
        // Мобильные России — только 9XX. Казахстанских клубов (тоже +7) у нас нет;
        // появятся с currency_code=KZT — тогда сюда добавится отдельная запись.
        test: /^79\d{9}$/,
        hint: 'Проверьте номер: мобильные России начинаются с +7 9…',
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
    // «8 (911)…» — привычная запись для России; для остальных стран лидирующий 8 не трогаем
    const normalized = f.code === '7' && digits.length === 11 && digits.startsWith('8')
        ? '7' + digits.slice(1)
        : digits;
    return normalized.startsWith(f.code) ? normalized : f.code + normalized;
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
