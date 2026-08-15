import React, { useState } from 'react';

interface LeadFormProps {
    brandColor: string;
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

const LeadForm: React.FC<LeadFormProps> = ({ brandColor, onSubmit, isLoading, isDesktop, ctaText, onEvent, submitError }) => {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const inputFired = React.useRef(false);
    // Ловушка для ботов: поле скрыто от глаз и от скринридеров, человек его не заполнит
    // ни при каких обстоятельствах, а автозаполнялки ботов бьют по всем input'ам подряд.
    const [hp, setHp] = useState('');
    // Момент показа формы. Сервер отбраковывает отправку быстрее 1.5 с — руками так не успеть.
    const mountedAt = React.useRef(Date.now());

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 0) return '';
        if (digits.length <= 1) return '+7';
        if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
        if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
        if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhone(e.target.value));
        if (error) setError('');
        if (!inputFired.current) { inputFired.current = true; onEvent?.('field_input', { field: 'phone' }); }
    };

    const handlePhoneFocus = () => { if (!phone) setPhone('+7'); onEvent?.('field_focus', { field: 'phone' }); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onEvent?.('cta_click');
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 11) { setError('Введите номер телефона'); return; }
        onEvent?.('phone_valid');
        await onSubmit({ name: '', phone: `+${phoneDigits}`, hp, formMs: Date.now() - mountedAt.current });
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
                    type="tel"
                    inputMode="tel"
                    placeholder="+7 (___) ___-__-__"
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

            {/* Дисклеймер */}
            <p className="text-[11px] text-white/15 text-center leading-relaxed px-6">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных
            </p>
        </form>
    );
};

export default LeadForm;
