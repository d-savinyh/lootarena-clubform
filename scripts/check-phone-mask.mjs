// Проверка маски телефона: `npm run check:phone` (нужен Node 22+, типы снимает сам Node).
//
// Зачем отдельный скрипт: 16.08.2026 нормализацию номера чинили на «готовых» строках —
// phoneDigits('79991234567') и т.п. — и все проверки прошли. А в поле номер набирают ПО ОДНОЙ
// ЦИФРЕ, и на девятой маска начинала дописывать лишний код страны: каждый Backspace добавлял
// ещё одну семёрку, поле превращалось в +7 (777) 777-77-77, заявку отправить было нельзя.
// Поэтому тут эмулируется именно поле: нажатия, Backspace, вставка, правка в середине.

import { getPhoneFormat, applyMask, phoneDigits, isValidPhone } from '../src/utils/phone.ts';

/** Эмулятор input с маской: ровно то, что делает LeadForm на onChange. */
const field = (currency) => {
    const fmt = getPhoneFormat(currency);
    let value = '';
    let caret = 0;
    const edit = (raw, pos) => {
        const next = applyMask(raw, pos, value, fmt);
        value = next.value;
        caret = next.caret;
    };
    return {
        fmt,
        get value() { return value; },
        get caret() { return caret; },
        /** Фокус на пустом поле подставляет код страны — так же, как в LeadForm. */
        focus() { if (!value) { value = `+${fmt.code}`; caret = value.length; } return this; },
        moveTo(pos) { caret = pos; return this; },
        type(text) {
            for (const ch of text) edit(value.slice(0, caret) + ch + value.slice(caret), caret + 1);
            return this;
        },
        paste(text) { edit(value.slice(0, caret) + text + value.slice(caret), caret + text.length); return this; },
        /** Выделить всё и напечатать/вставить поверх — строка меняется целиком. */
        selectAllType(text) { edit(text, text.length); return this; },
        /** Выделить всё и нажать Delete. */
        clear() { edit('', 0); return this; },
        backspace(times = 1) {
            for (let i = 0; i < times; i++) {
                if (caret > 0) edit(value.slice(0, caret - 1) + value.slice(caret), caret - 1);
            }
            return this;
        },
    };
};

let failed = 0;
const check = (name, actual, expected) => {
    const ok = actual === expected;
    if (!ok) failed++;
    console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${ok ? '' : `\n         получили: ${JSON.stringify(actual)}\n         ожидали:  ${JSON.stringify(expected)}`}`);
};

const COUNTRIES = [
    { cur: 'RUB', national: '9991234567', masked: '+7 (999) 123-45-67' },
    { cur: 'KZT', national: '7011234567', masked: '+7 (701) 123-45-67' },
    { cur: 'BYN', national: '291234567', masked: '+375 (29) 123-45-67' },
    { cur: 'UZS', national: '901234567', masked: '+998 (90) 123-45-67' },
    { cur: 'KGS', national: '555123456', masked: '+996 (555) 12-34-56' },
];

console.log('\n— набор по одной цифре —');
for (const { cur, national, masked } of COUNTRIES) {
    const f = field(cur).focus().type(national);
    check(`${cur}: ${national}`, f.value, masked);
    check(`${cur}: номер проходит проверку`, isValidPhone(f.value, f.fmt), true);
    // Каждая цифра должна появляться в поле сразу: после k нажатий — k цифр номера
    const step = field(cur).focus();
    let broke = '';
    for (let i = 0; i < national.length; i++) {
        step.type(national[i]);
        const got = phoneDigits(step.value, step.fmt).slice(step.fmt.code.length);
        if (!broke && got !== national.slice(0, i + 1)) broke = `на ${i + 1}-й цифре: ${step.value}`;
    }
    check(`${cur}: промежуточные состояния без сюрпризов`, broke, '');
}

console.log('\n— Backspace убирает по одной цифре и не плодит код страны —');
for (const { cur, national } of COUNTRIES) {
    const f = field(cur).focus().type(national);
    let broke = '';
    for (let i = national.length - 1; i >= 0; i--) {
        f.backspace();
        const got = phoneDigits(f.value, f.fmt).slice(f.fmt.code.length);
        if (!broke && got !== national.slice(0, i)) broke = `осталось ${i} цифр, а в поле: ${f.value}`;
    }
    check(`${cur}: стирание до кода страны`, broke, '');
    check(`${cur}: в поле остался только код`, f.value, `+${f.fmt.code}`);
    f.backspace();
    check(`${cur}: следующий Backspace очищает поле`, f.value, '');
}

console.log('\n— набор в пустое поле без кода страны (поле очистили и набирают заново) —');
for (const { cur, national, masked } of COUNTRIES) {
    // Гость выделил номер и стёр его: поле пустое, фокус никуда не уходил, код страны
    // не подставился. Первая цифра не должна быть съедена — у Казахстана это цифра «7»,
    // совпадающая с кодом страны.
    const f = field(cur);
    let broke = '';
    for (let i = 0; i < national.length; i++) {
        f.type(national[i]);
        const got = phoneDigits(f.value, f.fmt).slice(f.fmt.code.length);
        if (!broke && got !== national.slice(0, i + 1)) broke = `на ${i + 1}-й цифре: ${f.value}`;
    }
    check(`${cur}: набор без префикса`, f.value, masked);
    check(`${cur}: ни одна цифра не потерялась`, broke, '');
}

console.log('\n— курсор попал внутрь кода страны (тап по центрированному полю) —');
for (const { cur, national, masked } of COUNTRIES) {
    // Текст в поле выровнен по центру: тап по пустому полю ставит курсор в середину
    // подставленного «+375», и цифры начинали сыпаться внутрь кода страны.
    const f = field(cur).focus().moveTo(2).type(national);
    check(`${cur}: набор с курсором в коде страны`, f.value, masked);
    // То же самое, но номер уже набран: цифра внутри кода уходит в начало номера
    const g = field(cur).focus().type(national.slice(1)).moveTo(2).type(national[0]);
    check(`${cur}: цифра внутри кода уходит в начало номера`, g.value, masked);
}

console.log('\n— удаление на разделителе не залипает —');
{
    const f = field('RUB').focus().type('999');
    check('после трёх цифр скобка закрыта', f.value, '+7 (999)');
    f.backspace();   // стирается «)» — цифр не убавилось
    check('Backspace на «)» убирает цифру', f.value, '+7 (99');
    const g = field('RUB').focus().type('9991234');
    check('дефис на месте', g.value, '+7 (999) 123-4');
    g.backspace(2);
    check('Backspace сквозь дефис', g.value, '+7 (999) 12');
}

console.log('\n— правка в середине номера —');
{
    // Гость заметил опечатку в коде оператора: 998 вместо 999
    const f = field('RUB').focus().type('9981234567');
    check('номер с опечаткой', f.value, '+7 (998) 123-45-67');
    f.moveTo(7).backspace().type('9');   // курсор после «998», стираем 8, вводим 9
    check('опечатка исправлена', f.value, '+7 (999) 123-45-67');
    check('курсор остался в середине, перед следующей цифрой', f.value.slice(f.caret), '123-45-67');
    check('номер проходит проверку', isValidPhone(f.value, f.fmt), true);
    // Backspace внутри кода страны не должен утаскивать номер на место кода
    const g = field('BYN').focus().type('291234567').moveTo(3);
    g.backspace();
    check('BYN: Backspace по коду страны ничего не ломает', g.value, '+375 (29) 123-45-67');
    check('BYN: курсор встал в начало номера', g.caret, 4);
}

console.log('\n— вставка и автозаполнение —');
{
    check('E.164 в пустое поле', field('RUB').selectAllType('+79991234567').value, '+7 (999) 123-45-67');
    check('номер с пробелами', field('RUB').selectAllType('+7 999 123 45 67').value, '+7 (999) 123-45-67');
    check('через восьмёрку', field('RUB').selectAllType('8 (999) 123-45-67').value, '+7 (999) 123-45-67');
    check('без кода страны', field('RUB').selectAllType('9991234567').value, '+7 (999) 123-45-67');
    check('казахстанский без кода', field('KZT').selectAllType('7011234567').value, '+7 (701) 123-45-67');
    check('казахстанский с кодом', field('KZT').selectAllType('+77011234567').value, '+7 (701) 123-45-67');
    check('белорусский без кода', field('BYN').selectAllType('291234567').value, '+375 (29) 123-45-67');
    // Поле уже показывает «+7», гость вставляет номер целиком — второй код страны лишний
    check('вставка поверх кода в поле', field('RUB').focus().paste('+79991234567').value, '+7 (999) 123-45-67');
    check('вставка восьмёрки поверх кода', field('RUB').focus().paste('89991234567').value, '+7 (999) 123-45-67');
    check('вставка поверх кода, KZT', field('KZT').focus().paste('+77011234567').value, '+7 (701) 123-45-67');
    // Вставка поверх набранного номера. Строка укорачивается, как при Backspace, но цифру
    // отсюда терять нельзя: вставили тот же номер восьмёркой — должен остаться целым.
    const filled = () => field('RUB').focus().type('9991234567');
    check('вставка поверх номера', filled().selectAllType('89991234567').value, '+7 (999) 123-45-67');
    check('вставка другого номера поверх', filled().selectAllType('+79161112233').value, '+7 (916) 111-22-33');
}

console.log('\n— очистка поля —');
{
    const f = field('RUB').focus().type('9991234567');
    check('выделить всё и стереть', f.clear().value, '');
    check('после очистки номер набирается заново', f.type('9161112233').value, '+7 (916) 111-22-33');
}

console.log('\n— мусор и перебор цифр —');
{
    check('лишняя цифра игнорируется', field('RUB').focus().type('99912345678').value, '+7 (999) 123-45-67');
    check('буквы и знаки отбрасываются', field('RUB').focus().type('9a9b9*1234567').value, '+7 (999) 123-45-67');
    check('восьмёрка первой цифрой не занимает место', field('RUB').focus().type('89991234567').value, '+7 (999) 123-45-67');
    check('пустой ввод не даёт код страны', field('RUB').selectAllType('').value, '');
}

console.log('\n— проверка номера перед отправкой —');
{
    const ru = getPhoneFormat('RUB');
    const kz = getPhoneFormat('KZT');
    check('опечатка 798… отбивается', isValidPhone('+7 (798) 185-04-15', ru), false);
    check('городской 495 отбивается', isValidPhone('+7 (495) 123-45-67', ru), false);
    check('российский номер в казахстанском клубе', isValidPhone('+7 (999) 123-45-67', kz), false);
    check('казахстанский номер в российском клубе', isValidPhone('+7 (701) 123-45-67', ru), false);
    check('несуществующий код РБ', isValidPhone('+375 (11) 123-45-67', getPhoneFormat('BYN')), false);
    check('несуществующий код КР', isValidPhone('+996 (111) 23-45-67', getPhoneFormat('KGS')), false);
    check('неполный номер', isValidPhone('+7 (999) 123-45', ru), false);
    check('E.164 для сервера', phoneDigits('+7 (999) 123-45-67', ru), '79991234567');
}

console.log(failed ? `\n❌ провалено проверок: ${failed}\n` : '\n✅ маска в порядке\n');
process.exit(failed ? 1 : 0);
