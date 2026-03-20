# Performance

## LazyMotion (tree-shaking)

Загружай только нужные features, не весь бандл Motion:

```tsx
import { LazyMotion, domAnimation, m } from 'motion/react'

// domAnimation (~15kb) — основные анимации
// domMax (~27kb) — layout, drag, AnimatePresence

function App() {
  return (
    <LazyMotion features={domAnimation}>
      {/* Используй <m.div> вместо <motion.div> */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
    </LazyMotion>
  )
}
```

> **Когда полный `motion` ок**: если используешь на 1 странице и бандл не критичен.
> Для лендинга обычно `motion` с tree-shaking достаточно.

## GPU-ускоренные свойства

### ✅ Анимируй (GPU-ускоренные, composited)
- `transform`: `x`, `y`, `scale`, `rotate`, `scaleX`, `scaleY`
- `opacity`
- `filter` (с осторожностью, только на мелких элементах)

### ❌ Не анимируй (causes layout/paint)
- `width`, `height` → используй `scaleX`, `scaleY`
- `top`, `left`, `right`, `bottom` → используй `x`, `y`
- `margin`, `padding` → перестрой layout
- `border-width` → используй `box-shadow` или pseudo-element
- `font-size` → используй `scale`
- `background-color` → ок для CSS transitions, но не идеально для 60fps

## willChange

Подсказка браузеру о будущих анимациях:

```tsx
// Для элементов, которые БУДУТ анимироваться (не на всех!)
<motion.div
  style={{ willChange: 'transform, opacity' }}
  whileInView={{ opacity: 1, y: 0 }}
>
```

> **Не злоупотребляй**: `willChange` на каждом элементе УХУДШАЕТ производительность.
> Используй только на ключевых анимируемых элементах.

## viewport={{ once: true }}

Не перепроигрывай reveal-анимации — это главный источник jank при скролле:

```tsx
// ✅ Правильно
<motion.div
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
/>

// ❌ Без once — анимация при каждом скролле
<motion.div
  whileInView={{ opacity: 1 }}
/>
```

## Количество анимируемых элементов

| Количество | Рекомендация |
|------------|-------------|
| 1–5 | Свободно анимируй |
| 5–15 | Используй stagger, не все одновременно |
| 15–50 | Только простые opacity/y, stagger обязателен |
| 50+ | CSS-only анимации или виртуализация |

## Debounce для scroll-событий

```tsx
import { useScroll, useTransform, useSpring } from 'motion/react'

function SmoothScroll() {
  const { scrollYProgress } = useScroll()
  // useSpring сглаживает значения, уменьшая кол-во перерисовок
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return <motion.div style={{ scaleX: smoothProgress }} />
}
```

## Checklist по performance

- [ ] Анимируются только `transform` и `opacity`?
- [ ] `viewport={{ once: true }}` на reveal-анимациях?
- [ ] Stagger для групп из 5+ элементов?
- [ ] `willChange` только на ключевых элементах?
- [ ] Нет бесконечных анимаций на невидимых элементах?
- [ ] Тестировал на мобильном / throttled CPU? (Chrome DevTools → Performance)
- [ ] `useReducedMotion` для a11y?
