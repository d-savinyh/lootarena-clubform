// Формат телефона зависит от страны клуба. Поля страны в erp_clubs нет, зато есть
// currency_code, и он однозначно её задаёт: RUB → Россия, BYN → Беларусь, UZS → Узбекистан,
// KZT → Казахстан, KGS → Кыргызстан. Список валют клуба — lib/currency.ts в ЕРП
// (CLUB_CURRENCIES), записи здесь и там должны совпадать по кодам.
// На 16.08.2026 боевые клубы: 83 RUB, 2 BYN, 1 UZS; KZT/KGS заведены на будущее.
//
// Зачем строгая проверка: маска раньше принимала любую цифру после +7, и опечатка в одну
// позицию давала «валидный» +7 (798) 185-04-15 — для системы это НОВЫЙ номер, она бронировала
// на него подарок, который гость никогда не получит (29 таких заявок за всю историю).
//
// Разбор ввода делает ОДНА функция — nationalDigits. Всё остальное (маска, проверка,
// E.164 для сервера) строится поверх неё, чтобы поле и валидация не разъезжались.

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

/** Сколько цифр в номере без кода страны. */
export const nationalLength = (f: PhoneFormat): number => f.total - f.code.length;

/**
 * Национальная часть номера (без кода страны) из ЛЮБОГО ввода: из поля с маской,
 * из вставки, из автозаполнения браузера.
 *
 * Порядок проверок важен. Разбирать «голые» цифры по длине можно только тогда, когда
 * в строке НЕТ плюса: в поле код страны стоит всегда, и у наполовину стёртого
 * «+7 (999) 123-45-6» ровно 10 цифр — столько же, сколько в номере без кода. Разбор по
 * длине читал это как «номер без кода» и дописывал ещё одну семёрку на каждый Backspace,
 * пока поле не превращалось в +7 (777) 777-77-77 (19.08.2026, регрессия из 79785ab).
 */
const parseNational = (value: string, f: PhoneFormat): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const national = nationalLength(f);

    let rest: string;
    if (value.trimStart().startsWith('+')) {
        // Плюс = код страны уже в строке. Так выглядит и содержимое поля, и E.164 из вставки.
        // Цифр меньше, чем в коде («+37» у Беларуси) — это огрызок кода, номера тут нет.
        rest = digits.startsWith(f.code) ? digits.slice(f.code.length)
            : f.code.startsWith(digits) ? ''
                : digits;
    } else if (digits.length === national) {
        // Номер без кода страны целиком. Проверка по ДЛИНЕ, а не по первой цифре: у Казахстана
        // мобильные начинаются на 7, как и сам код страны, и «7011234567» иначе читалось бы
        // как уже готовый номер — на выходе выходил мусор вида +7 (011) 234-56-7.
        rest = digits;
    } else {
        // Плюса нет, длина не совпала — так выглядит первая цифра в пустом поле. Код страны
        // спереди опознаём, только если без него номер всё равно не помещается: иначе у
        // Казахстана «7» (начало номера) читалось бы как код и первая цифра пропадала.
        rest = digits.length > national && digits.startsWith(f.code) ? digits.slice(f.code.length) : digits;
    }

    // Привычная межгородская восьмёрка: «8 (999) 123-45-67». Ни в России (мобильные 9XX),
    // ни в Казахстане (7XX) номер с восьмёрки не начинается, так что снимаем её сразу —
    // иначе гость, набравший номер с восьмёрки, упирался в отказ на последней цифре.
    if (f.code === '7' && rest.startsWith('8')) rest = rest.slice(1);

    // Номер вставили в поле, где код страны уже стоял: «+7» + «+7 999 123-45-67». Снимаем
    // лишний код, пока номер длиннее нужного, иначе хвост номера просто обрезался бы.
    while (rest.length > national && rest.startsWith(f.code)) rest = rest.slice(f.code.length);

    return rest;
};

/** Национальная часть номера, обрезанная по длине маски. */
export const nationalDigits = (value: string, f: PhoneFormat): string =>
    parseNational(value, f).slice(0, nationalLength(f));

/** Полный номер только цифрами, с кодом страны: 79991234567. Пустой ввод → ''. */
export const phoneDigits = (value: string, f: PhoneFormat): string => {
    const national = nationalDigits(value, f);
    return national ? f.code + national : '';
};

const SEPARATORS = [' (', ') ', '-', '-'];

/** Собирает «+7 (911) 123-45-67» из национальной части номера. */
export const formatNational = (national: string, f: PhoneFormat): string => {
    let out = `+${f.code}`;
    let pos = 0;
    f.groups.forEach((size, i) => {
        const part = national.slice(pos, pos + size);
        if (part) out += SEPARATORS[Math.min(i, SEPARATORS.length - 1)] + part;
        pos += size;
    });
    // Скобку закрываем, когда первая группа набрана, а следующая ещё не начата
    if (national.length === f.groups[0]) out += ')';
    return out;
};

/** Маска для произвольного ввода. Пустой ввод (ни одной цифры) очищает поле. */
export const formatPhone = (value: string, f: PhoneFormat): string =>
    value.replace(/\D/g, '') ? formatNational(nationalDigits(value, f), f) : '';

/** Позиция в отформатированной строке сразу после n-й цифры национального номера. */
const caretAfterDigit = (formatted: string, n: number, f: PhoneFormat, skipSeparators: boolean): number => {
    const target = f.code.length + n;
    let seen = 0;
    let i = 0;
    while (i < formatted.length && seen < target) {
        if (/\d/.test(formatted[i])) seen++;
        i++;
    }
    // При вводе перешагиваем разделители, чтобы курсор стоял перед следующей цифрой
    if (skipSeparators) while (i < formatted.length && !/\d/.test(formatted[i])) i++;
    return i;
};

/**
 * Один шаг редактирования поля: что показать и куда вернуть курсор.
 * `raw` — что оказалось в input после нажатия, `caret` — позиция курсора в нём,
 * `prev` — что было в поле до нажатия.
 *
 * Курсор считаем по ЦИФРАМ, а не по символам: маска переписывает строку целиком, и без
 * пересчёта курсор улетает в конец — исправить цифру в середине номера становится нельзя.
 */
export const applyMask = (raw: string, caret: number, prev: string, f: PhoneFormat): { value: string; caret: number } => {
    const before = nationalDigits(prev, f);
    const prefix = `+${f.code}`;
    // Ровно один удалённый символ = нажатие Backspace/Delete. Стирание выделения и вставка
    // поверх выделения тоже укорачивают строку, но обрабатывать их надо как обычный ввод.
    const keyDelete = prev.length - raw.length === 1;

    // Backspace внутри кода страны, когда номер уже набран: код маска всё равно вернёт, а
    // номер бы «съехал» на его место («+375 (29) 123-45-67» → «+375 (35) 291-23-45»).
    // Такую правку игнорируем и ставим курсор в начало номера. Пустой номер не трогаем —
    // иначе поле нельзя было бы дочистить с клавиатуры.
    if (keyDelete && before && caret < prefix.length) return { value: prev, caret: prefix.length };

    // Ввод ВНУТРИ кода страны. Текст в поле центрированный, поэтому тап по пустому полю
    // ставит курсор в середину только что подставленного «+375», и первая же цифра попадала
    // в код: «+3275» → +375 (32) 75. Код неприкосновенен — набранное дописываем в начало
    // номера. Если не помещается, это вставка целого номера: её разберёт parseNational.
    const added = raw.length - prev.length;
    const at = caret - added;
    if (added > 0 && prev.startsWith(prefix) && at < prefix.length) {
        const add = raw.slice(at, caret).replace(/\D/g, '');
        if (add && add.length + before.length <= nationalLength(f)) {
            const value = formatNational(add + before, f);
            return { value, caret: caretAfterDigit(value, add.length, f, true) };
        }
    }

    const parsed = parseNational(raw, f);
    let national = parsed.slice(0, nationalLength(f));
    // Сколько цифр НОМЕРА осталось левее курсора. Цифры кода страны не в счёт, а сколько их
    // в строке — знает только разбор: в поле код есть, в первой набранной цифре («9») нет,
    // а во вставке поверх кода их два комплекта.
    const codeDigits = raw.replace(/\D/g, '').length - parsed.length;
    let left = Math.max(0, raw.slice(0, caret).replace(/\D/g, '').length - codeDigits);

    // Backspace попал на разделитель — «)», «-» или пробел. Цифр не убавилось, маска вернёт
    // символ на место, и удаление залипнет намертво (стереть цифру перед «)» было нельзя).
    // Стираем цифру слева от курсора сами.
    if (keyDelete && national === before && left > 0) {
        national = national.slice(0, left - 1) + national.slice(left);
        left--;
    }

    // Поле очищается, когда цифр не осталось совсем или когда гость дожал Backspace до самого
    // кода страны: «+375» → «+37» — это уже не номер, а огрызок кода.
    const digits = raw.replace(/\D/g, '');
    const stub = !national && digits !== f.code && f.code.startsWith(digits);
    const value = digits && !stub ? formatNational(national, f) : '';
    return { value, caret: caretAfterDigit(value, Math.min(left, national.length), f, !keyDelete) };
};

export const isValidPhone = (value: string, f: PhoneFormat): boolean =>
    f.test.test(phoneDigits(value, f));
