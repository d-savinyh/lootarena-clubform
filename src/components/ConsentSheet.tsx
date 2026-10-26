import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { consentSections, PRIVACY_URL, type ForeignTracker } from '../utils/consent';
import type { LandingOperator } from '../utils/api';

interface ConsentSheetProps {
    /** Клуб, в который гость оставляет заявку: он оператор данных. */
    clubName: string;
    /** Юрлицо клуба (оператор данных); нет — в тексте название клуба. */
    operator?: LandingOperator | null;
    /** Зарубежные счётчики, стоящие на форме. */
    foreign?: ForeignTracker[];
    onClose: () => void;
}

/** Текст согласия на обработку данных — отдельным окном поверх формы (на телефоне — шторкой снизу).
 *  Рисуется порталом в body: карточки формы с backdrop-filter становятся контейнером для fixed,
 *  и окно внутри них съезжает вместе с карточкой. */
const ConsentSheet: React.FC<ConsentSheetProps> = ({ clubName, operator, foreign, onClose }) => {
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="consent-title"
                className="glass w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 text-left"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 id="consent-title" className="text-lg font-semibold text-white leading-snug">
                        Согласие на обработку персональных данных
                    </h2>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                        className="shrink-0 w-9 h-9 rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-sm text-white/60 mb-5 leading-relaxed">
                    Отправляя заявку, вы соглашаетесь на обработку своих данных на условиях ниже.
                </p>

                <div className="space-y-5">
                    {consentSections(clubName, operator, foreign).map(s => (
                        <section key={s.title}>
                            <h3 className="text-sm font-semibold text-white/90 mb-2">{s.title}</h3>
                            <ul className="space-y-1.5">
                                {s.items.map(item => (
                                    <li key={item} className="text-sm text-white/60 leading-relaxed pl-4 relative">
                                        <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-white/20" aria-hidden />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>

                <p className="text-xs text-white/40 mt-6 leading-relaxed">
                    Подробнее — в{' '}
                    <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 hover:text-white/70">
                        политике конфиденциальности Loot Arena
                    </a>.
                </p>
            </div>
        </div>,
        document.body,
    );
};

export default ConsentSheet;
