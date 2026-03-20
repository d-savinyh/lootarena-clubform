# Параллакс-эффекты (Scroll-Linked)

## Базовый useScroll + useTransform

```tsx
import { motion, useScroll, useTransform } from 'motion/react'

function ParallaxHero() {
  const { scrollYProgress } = useScroll()

  // Фон двигается медленнее, чем текст
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -200])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <motion.div style={{ y: bgY }} className="background" />
      <motion.h1 style={{ y: textY, opacity }}>
        Заголовок
      </motion.h1>
    </div>
  )
}
```

## Scroll Progress Bar

Линия прогресса скролла вверху страницы:

```tsx
import { motion, useScroll, useSpring } from 'motion/react'

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()
  // Spring делает движение плавнее
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: '0%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: '#30D158',
        zIndex: 100,
      }}
    />
  )
}
```

## Параллакс секции (относительно контейнера)

Привязка к конкретному элементу, а не ко всей странице:

```tsx
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

function ParallaxSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'], // от входа до выхода из viewport
  })

  const y = useTransform(scrollYProgress, [0, 1], [-50, 50])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  return (
    <section ref={ref}>
      <motion.div style={{ y, scale, opacity }}>
        Контент с параллаксом
      </motion.div>
    </section>
  )
}
```

## Floating Glow (фоновое свечение)

Мягкое свечение, следующее за скроллом:

```tsx
function FloatingGlow() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, 500])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 0.6, 0.6, 0.3])

  return (
    <motion.div
      style={{
        y,
        opacity,
        position: 'fixed',
        top: '20%',
        left: '50%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(48,209,88,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        transform: 'translateX(-50%)',
        zIndex: 0,
      }}
    />
  )
}
```

## Speed Reference

| Элемент | Скорость | Input → Output |
|---------|----------|----------------|
| Фон (медленный) | 0.3x | `[0, 1] → [0, -100]` |
| Контент (нормальный) | 1x | Без transform |
| Передний план (быстрый) | 1.5x | `[0, 1] → [0, -300]` |
| Fade-out при скролле | — | `[0, 0.5] → [1, 0]` |

## Важно

- **Не злоупотребляй**: 1–2 параллакс-элемента на страницу максимум
- **`useSpring`** для сглаживания scroll-linked значений
- **offset**: `['start end', 'end start']` — полный проход элемента через viewport
- **Мобильные**: на iOS параллакс может тормозить, тестируй или отключай через `useReducedMotion`
