import React, { useState } from 'react';

interface LeadFormProps {
    brandColor: string;
    clubAddress?: string;
    onSubmit: (data: { name: string; phone: string; telegram?: string }) => Promise<void>;
    isLoading?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({ brandColor, clubAddress, onSubmit, isLoading }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [telegram, setTelegram] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const formatPhone = (value: string) => {
        // Только цифры
        const digits = value.replace(/\D/g, '');

        // Форматирование +7 (XXX) XXX-XX-XX
        if (digits.length === 0) return '';
        if (digits.length <= 1) return '+7';
        if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
        if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
        if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
    };

    const handlePhoneFocus = () => {
        if (!phone) setPhone('+7');
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = 'Введите имя';
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 11) newErrors.phone = 'Введите номер телефона';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const phoneDigits = phone.replace(/\D/g, '');
        await onSubmit({
            name: name.trim(),
            phone: `+${phoneDigits}`,
            telegram: telegram.trim() || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up-delay-2">
            <div className="glass rounded-3xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-1">Записаться</h3>
                <p className="text-sm text-white/40 -mt-3 mb-4">Оставьте контакты — мы свяжемся с вами</p>
                {clubAddress && (
                    <div className="flex items-center gap-2 -mt-2 mb-4 px-3 py-2 rounded-xl bg-white/3">
                        <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-white/30">{clubAddress}</span>
                    </div>
                )}

                {/* Имя */}
                <div>
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Имя <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ваше имя"
                        required
                        value={name}
                        onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
                        className={`w-full px-4 py-3.5 rounded-xl bg-white/5 border text-white placeholder:text-white/25 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/8 focus:ring-white/10 focus:border-white/15'
                            }`}
                    />
                    {errors.name && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.name}</p>}
                </div>

                {/* Телефон */}
                <div>
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        Телефон <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        required
                        value={phone}
                        onChange={handlePhoneChange}
                        onFocus={handlePhoneFocus}
                        className={`w-full px-4 py-3.5 rounded-xl bg-white/5 border text-white placeholder:text-white/25 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/8 focus:ring-white/10 focus:border-white/15'
                            }`}
                    />
                    {errors.phone && <p className="text-xs text-red-400 mt-1.5 ml-1">{errors.phone}</p>}
                </div>

                {/* Telegram */}
                <div>
                    <input
                        type="text"
                        placeholder="@telegram (необязательно)"
                        value={telegram}
                        onChange={e => setTelegram(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-white/25 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/15"
                    />
                </div>
            </div>

            {/* Кнопка отправки */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl text-base font-black text-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed glow-brand-strong"
                style={{ backgroundColor: brandColor }}
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
                    'Забрать оффер'
                )}
            </button>

            {/* Дисклеймер */}
            <p className="text-[10px] text-white/20 text-center leading-relaxed px-4">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных
            </p>
        </form>
    );
};

export default LeadForm;
