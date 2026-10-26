import React, { useLayoutEffect, useRef } from 'react';
import { HEALTH_WARNING_TEXT } from '../utils/ageGate';

/**
 * Надпись о вреде энергетиков (38-ФЗ ст. 25.1 ч. 2): «в каждом случае» и не меньше 7% площади рекламы.
 * Шрифт и фон закон не задаёт, а нечитаемое предупреждение считается отсутствующим (Пленум ВАС № 58, п. 28),
 * поэтому без плашки и капса, обычным начертанием, светлым текстом на всю ширину, с переносами по слогам.
 * Площадь считается по самому тексту (письмо ФАС № ДФ/52241/20): кегль подбираем по ЗАМЕРУ так, чтобы
 * текст занял 7,5% рекламы — как в приложении, на ТВ и на карте клубов lootarena.ru.
 *
 * Реклама на странице формы — все блоки с `data-ad-area`: карточка предложения и карточка подарка.
 * `fitKey` — пересчитать, когда меняется их содержимое (выбрали филиал — сменился подарок).
 */

/** Доля площади рекламы, которую занимает текст надписи (норма — 7%). */
export const HEALTH_WARNING_SHARE = 0.075;
const MIN_PX = 11;
const MAX_PX = 40;

const adArea = (): number =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-ad-area]')).reduce((sum, el) => {
        const r = el.getBoundingClientRect();
        return sum + r.width * r.height;
    }, 0);

const textArea = (el: HTMLElement): number => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Array.from(range.getClientRects()).reduce((sum, r) => sum + r.width * r.height, 0);
};

const HealthWarning: React.FC<{ fitKey?: string }> = ({ fitKey }) => {
    const ref = useRef<HTMLParagraphElement>(null);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        let frame = 0;
        const fit = () => {
            let px = parseFloat(el.style.fontSize) || 14;
            for (let i = 0; i < 5; i += 1) {
                el.style.fontSize = `${px.toFixed(1)}px`;
                const text = textArea(el);
                const box = adArea();
                if (!(text > 0 && box > 0)) return;
                const next = Math.min(MAX_PX, Math.max(MIN_PX, px * Math.sqrt((HEALTH_WARNING_SHARE * box) / text)));
                if (Math.abs(next - px) < 0.2) break;
                px = next;
            }
            el.style.fontSize = `${px.toFixed(1)}px`;
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(fit);
        };
        fit();
        // Подгоняем заново только при смене ШИРИНЫ блоков (поворот экрана, ресайз окна): высоту меняет сама
        // подгонка кегля, и реакция на неё зациклила бы наблюдатель.
        const widths = new WeakMap<Element, number>();
        const ro = typeof ResizeObserver === 'function'
            ? new ResizeObserver((entries) => {
                let changed = false;
                entries.forEach((e) => {
                    const w = Math.round(e.contentRect.width);
                    if (widths.get(e.target) !== w) { widths.set(e.target, w); changed = true; }
                });
                if (changed) schedule();
            })
            : null;
        document.querySelectorAll('[data-ad-area]').forEach((n) => ro?.observe(n));
        // Шрифт Geologica догружается после первой отрисовки — метрики текста меняются.
        document.fonts?.ready.then(schedule).catch(() => { /* без шрифтов — оставляем замер по фолбэку */ });
        window.addEventListener('resize', schedule);
        return () => {
            cancelAnimationFrame(frame);
            ro?.disconnect();
            window.removeEventListener('resize', schedule);
        };
    }, [fitKey]);

    return (
        <p
            ref={ref}
            lang="ru"
            data-health-warning
            className="mt-5 pt-4 border-t border-white/10 text-left font-normal leading-[1.3] text-white/65"
            style={{ hyphens: 'auto', WebkitHyphens: 'auto', fontSize: 14 }}
        >
            {HEALTH_WARNING_TEXT}
        </p>
    );
};

export default HealthWarning;
