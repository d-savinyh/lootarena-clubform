import React, { useEffect, useRef } from 'react';
import { adultGoodsLabel, fromYearsWord, yearsWord, type LeadAgeGate } from '../utils/ageGate';

interface AgeGateScreenProps {
    clubName: string;
    clubLogo?: string;
    gate: LeadAgeGate;
    brandColor: string;
    /** Гость ответил «Нет»: акции не показываем, формы нет. */
    declined: boolean;
    onConfirm: () => void;
    onDecline: () => void;
}

/**
 * Экран вместо лендинга, пока гость не подтвердил возраст. Предложение, подарок и форма до ответа
 * «Да» не рендерятся вовсе (а не прячутся стилем): ни текст акции, ни название энергетика не должны
 * попасть на экран раньше вопроса. Правило и обоснование — src/utils/ageGate.ts.
 */
const AgeGateScreen: React.FC<AgeGateScreenProps> = ({ clubName, clubLogo, gate, brandColor, declined, onConfirm, onDecline }) => {
    const age = gate.minAge;
    const yesRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!declined) yesRef.current?.focus();
    }, [declined]);

    return (
        <>
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.05]"
                    style={{ backgroundColor: brandColor }}
                />
            </div>
            <main className="relative min-h-screen flex items-center justify-center px-5 py-10">
                <section
                    className="w-full max-w-md animate-scale-in"
                    aria-labelledby="age-gate-title"
                    aria-describedby="age-gate-text"
                    data-age-gate={declined ? 'declined' : 'ask'}
                >
                    {/* Клуб — чтобы было понятно, чья это страница. Сама акция — только после ответа. */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        {clubLogo && (
                            <img src={clubLogo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        )}
                        <span className="text-base font-bold text-white/80">{clubName}</span>
                    </div>

                    <div className="glass rounded-[28px] p-6 sm:p-7 text-center">
                        <div
                            className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                            style={{ backgroundColor: `${brandColor}18`, boxShadow: `inset 0 0 0 1px ${brandColor}55` }}
                            aria-hidden="true"
                        >
                            {age}+
                        </div>

                        {declined ? (
                            <>
                                <h1 id="age-gate-title" className="text-2xl font-black text-white leading-tight mb-3">
                                    Акция только для гостей от {age} {fromYearsWord(age)}
                                </h1>
                                <p id="age-gate-text" className="text-base text-white/50 leading-relaxed">
                                    В ней есть {adultGoodsLabel(gate)}, поэтому показать её мы не можем.
                                    Ждём вас в <span className="text-white font-bold">{clubName}</span>!
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 id="age-gate-title" className="text-2xl font-black text-white leading-tight mb-3">
                                    Вам уже есть {age} {yearsWord(age)}?
                                </h1>
                                <p id="age-gate-text" className="text-base text-white/50 leading-relaxed mb-6">
                                    В этой акции есть {adultGoodsLabel(gate)}. Её можно показывать только гостям
                                    от {age} {fromYearsWord(age)}.
                                </p>
                                {/* На узком экране — столбиком: «Да, мне есть 18» в половине ширины рвётся на две строки. */}
                                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                                    <button
                                        ref={yesRef}
                                        type="button"
                                        onClick={onConfirm}
                                        className="py-4 rounded-2xl text-black font-black text-base transition-transform hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                        style={{ backgroundColor: brandColor }}
                                    >
                                        Да, мне есть{'\u00a0'}{age}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDecline}
                                        className="py-4 rounded-2xl font-bold text-base text-white/80 bg-white/5 border border-white/15 transition-colors hover:bg-white/10 active:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    >
                                        Нет
                                    </button>
                                </div>
                                <p className="text-xs text-white/35 mt-5">Ответ запомним только до закрытия вкладки.</p>
                            </>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
};

export default AgeGateScreen;
