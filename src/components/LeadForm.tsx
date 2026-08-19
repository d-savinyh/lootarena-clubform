import React, { useState } from 'react';
import { getPhoneFormat, applyMask, phoneDigits, isValidPhone } from '../utils/phone';

interface LeadFormProps {
    brandColor: string;
    /** Валюта клуба — задаёт формат телефона: RUB → +7, BYN → +375, UZS → +998. */
    currency?: string;
    clubAddress?: string;
    onSubmit: (data: { name: string; phone: string; telegram?: string; hp?: string; formMs?: number }) => Promise<void>;
    isLoading?: boolean;
    /** Текст CTA-кнопки (из настроек формы) */
    ctaText?: string;
    /** Поведенческие события «кто что тыкает» */
    onEvent?: (type: string, meta?: Record<string, any>) => void;
    /** Десктопный стиль — крупнее */
    isDesktop?: boolean;
    /** Внешняя ошибка отправки (лимит запросов, отказ капчи) — показывается под полем */
    submitError?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ brandColor, currency, onSubmit, isLoading, isDesktop, ctaText, onEvent, submitError }) => {
    const fmt = getPhoneFormat(currency);
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const inputFired = React.useRef(false);
    // Ловушка для ботов: поле скрыто от глаз и от скринридеров, человек его не заполнит
    // ни при каких обстоятельствах, а автозаполнялки ботов бьют по всем input'ам подряд.
    const [hp, setHp] = useState('');
    // Момент показа формы. Сервер отбраковывает отправку быстрее 1.5 с — руками так не успеть.
    const mountedAt = React.useRef(Date.now());

    const inputRef = React.useRef<HTMLInputElement>(null);
    // Куда вернуть курсор после того, как маска перепишет значение. Без этого он прыгает
    // в конец, и исправить цифру в середине номера невозможно — а одна лишняя цифра
    // бронирует подарок на чужой телефон.
    const caretRef = React.useRef<number | null>(null);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const el = e.target;
        const next = applyMask(el.value, el.selectionStart ?? el.value.length, phone, fmt);

        if (next.value === phone) {
            // Значение не изменилось (лишняя цифра сверх маски, правка внутри кода страны) —
            // перерисовки не будет, поэтому возвращаем поле в исходный вид сами.
            el.value = next.value;
            el.setSelectionRange(next.caret, next.caret);
        } else {
            caretRef.current = next.caret;
            setPhone(next.value);
        }

        if (error) setError('');
        if (!inputFired.current) { inputFired.current = true; onEvent?.('field_input', { field: 'phone' }); }
    };

    React.useLayoutEffect(() => {
        if (caretRef.current === null) return;
        inputRef.current?.setSelectionRange(caretRef.current, caretRef.current);
        caretRef.current = null;
    }, [phone]);

    const handlePhoneFocus = () => {
        // Клик по пустому полю ставит курсор в позицию 0, и подставленный код страны
        // оказывается ПРАВЕЕ курсора: первая цифра уезжала перед «+7» и номер перемешивался.
        if (!phone) { setPhone(`+${fmt.code}`); caretRef.current = fmt.code.length + 1; }
        onEvent?.('field_focus', { field: 'phone' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onEvent?.('cta_click');
        const digits = phoneDigits(phone, fmt);
        if (digits.length < fmt.total) { setError('Введите номер телефона'); return; }
        // Маска принимала любую цифру после кода страны, поэтому опечатка в одну позицию
        // давала «валидный» +7 (798) 185-04-15 — система считала его НОВЫМ номером и
        // бронировала подарок на телефон, которым гость не владеет (29 таких заявок).
        if (!isValidPhone(phone, fmt)) {
            setError(fmt.hint);
            onEvent?.('submit_error', { error: 'phone_not_mobile' });
            return;
        }
        onEvent?.('phone_valid');
        await onSubmit({ name: '', phone: `+${digits}`, hp, formMs: Date.now() - mountedAt.current });
    };

    const inputClass = (hasError: boolean) =>
        `w-full rounded-2xl text-white placeholder:text-white/20 font-medium transition-all input-apple text-center tracking-wide ${isDesktop ? 'px-5 py-5 text-lg' : 'px-4 py-4 text-base'
        } ${hasError ? 'input-error' : ''}`;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up-delay-2">
            <div className={`glass rounded-[28px] ${isDesktop ? 'p-8' : 'p-6'}`}>
                <h3 className={`font-black text-white mb-1 ${isDesktop ? 'text-2xl' : 'text-xl'}`}>
                    Забери подарок
                </h3>
                <p className="text-sm text-white/35 mb-5">
                    Введите номер — подарок придёт в приложение после регистрации
                </p>

                <input
                    ref={inputRef}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={fmt.placeholder}
                    required
                    autoFocus
                    value={phone}
                    onChange={handlePhoneChange}
                    onFocus={handlePhoneFocus}
                    className={inputClass(!!error)}
                />
                {(error || submitError) && <p className="text-xs text-red-400 mt-2 text-center">{error || submitError}</p>}

                {/* Honeypot. Не `display:none` — часть ботов такие поля пропускает; уводим за
                    пределы экрана, закрываем от табуляции, автозаполнения и скринридеров. */}
                <div aria-hidden="true" className="absolute w-px h-px -left-[9999px] overflow-hidden">
                    <label htmlFor="cf-company">Не заполняйте это поле</label>
                    <input
                        id="cf-company"
                        name="company"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={hp}
                        onChange={(e) => setHp(e.target.value)}
                    />
                </div>
            </div>

            {/* CTA-кнопка */}
            <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-2xl font-bold text-black btn-apple disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${isDesktop ? 'py-[18px] text-[17px]' : 'py-4 text-base'
                    }`}
                style={{
                    backgroundColor: brandColor,
                    boxShadow: `0 0 24px ${brandColor}30, 0 0 60px ${brandColor}10`,
                }}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Отправляем...
                    </span>
                ) : (
                    ctaText || 'Забрать оффер'
                )}
            </button>

            {/* Дисклеймер. Упоминание SmartCaptcha обязательно: значок капчи мы прячем
                (hideShield), а условия сервиса требуют уведомить о её использовании. */}
            <p className="text-[11px] text-white/15 text-center leading-relaxed px-6">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных.<br />
                Форма защищена{' '}
                <a href="https://yandex.ru/legal/smartcaptcha_termsofuse/" target="_blank" rel="noopener noreferrer"
                    className="underline decoration-white/10 hover:text-white/30 transition-colors">Yandex SmartCaptcha</a>
            </p>
        </form>
    );
};

export default LeadForm;
