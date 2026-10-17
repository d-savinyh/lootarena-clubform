// Вопрос о возрасте для форм с энергетиком или безалкогольным пивом (решение владельца 17.10.2026).
//
// Такие акции законно показывать только совершеннолетним (304-ФЗ, 38-ФЗ ст. 25.1), поэтому до ответа
// «Да» страница не показывает ни предложение, ни подарок, ни форму. Ответ живёт до закрытия вкладки
// (sessionStorage), а не навсегда: следующий человек за тем же устройством увидит вопрос снова.
// Возраст — по стране клуба (ageGate.minAge: 18, в Казахстане энергетики — 21). Запоминаем, какой
// возраст подтвердил посетитель, и спрашиваем заново, только если форма требует больше.
// Тот же подход — на карте клубов lootarena.ru (lootarena-landing, components/gamers/AgeGate.tsx).

export interface LeadAgeGate {
    /** Возраст по стране клуба: 18, в Казахстане энергетики — 21. */
    minAge: number;
    /** Есть энергетик — нужна надпись «Чрезмерное потребление тонизирующих напитков вредит здоровью». */
    healthWarning: boolean;
    /** Есть безалкогольное пиво. Пометку «0%» не рисуем (решение 15.10.2026) — флаг нужен только для текста вопроса. */
    nonalcMark: boolean;
}

const STORAGE_KEY = 'la_age18_confirmed';

/** Ответ сервера → проверенный объект. Мусор и пустое значение — «вопроса нет». */
export const normalizeAgeGate = (raw: unknown): LeadAgeGate | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const age = Number(r.minAge);
    return {
        minAge: Number.isInteger(age) && age >= 18 && age <= 25 ? age : 18,
        healthWarning: r.healthWarning === true,
        nonalcMark: r.nonalcMark === true,
    };
};

/** Какой возраст посетитель подтвердил в этой вкладке: 0 — никакой. */
export const readConfirmedAge = (): number => {
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (raw === '1') return 18;
        const age = Number(raw);
        return Number.isInteger(age) && age >= 18 && age <= 25 ? age : 0;
    } catch {
        return 0;
    }
};

export const writeConfirmedAge = (age: number): void => {
    try {
        const prev = readConfirmedAge();
        window.sessionStorage.setItem(STORAGE_KEY, String(Math.max(prev, age)));
    } catch {
        // приватный режим / запрет хранилища — подтверждение проживёт до перезагрузки
    }
};

/** «18 лет», «21 год», «22 года» — после «Вам уже есть N». */
export const yearsWord = (n: number): string => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'год';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года';
    return 'лет';
};

/** «от 18 лет», «от 21 года» — родительный падеж после «от». */
export const fromYearsWord = (n: number): string => (n % 10 === 1 && n % 100 !== 11 ? 'года' : 'лет');

/** Что в акции 18+, словами для вопроса: по флагам сервера, без названий товаров. */
export const adultGoodsLabel = (gate: LeadAgeGate): string => {
    if (gate.healthWarning && gate.nonalcMark) return 'энергетики и безалкогольное пиво';
    if (gate.healthWarning) return 'энергетики';
    if (gate.nonalcMark) return 'безалкогольное пиво';
    return 'товары 18+';
};

/** Надпись о вреде энергетиков: одна, на русском, во всех странах (решение владельца 17.10.2026). */
export const HEALTH_WARNING_TEXT = 'Чрезмерное потребление тонизирующих напитков вредит здоровью';
