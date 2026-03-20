# Hover и жесты

## Базовый whileHover

```tsx
import { motion } from 'motion/react'

// Простой hover-scale
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Нажми
</motion.button>
```

## 3D Tilt при наведении

Карточка наклоняется за курсором:

```tsx
import { motion, useMotionValue, useTransform } from 'motion/react'

function TiltCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [8, -8])
  const rotateY = useTransform(x, [-100, 100], [-8, 8])

  function handleMouse(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}
```

## Hover Glow (свечение при наведении)

```tsx
function GlowCard({ children, glowColor = '#30D158' }: Props) {
  return (
    <motion.div
      className="relative rounded-2xl border border-zinc-800 p-6 overflow-hidden"
      whileHover="hovered"
      initial="idle"
    >
      {/* Фоновое свечение */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glowColor}15, transparent 70%)`,
        }}
        variants={{
          idle: { opacity: 0 },
          hovered: { opacity: 1 },
        }}
        transition={{ duration: 0.3 }}
      />
      {/* Контент поверх */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
```

## Spring Scale с границей

```tsx
// Пружинистое увеличение с мягким возвратом
<motion.a
  whileHover={{ scale: 1.04, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{
    type: 'spring',
    stiffness: 400,
    damping: 17,
  }}
>
  Скачать
</motion.a>
```

## Hover на группе (parent → children)

```tsx
// Родитель меняет состояние, дети реагируют
<motion.div whileHover="hover" initial="rest">
  <motion.span
    variants={{
      rest: { x: 0 },
      hover: { x: 5 },
    }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    →
  </motion.span>
  <span>Подробнее</span>
</motion.div>
```

## Border Gradient Hover

```tsx
<motion.div
  className="relative rounded-xl p-[1px] overflow-hidden"
  whileHover="hover"
  initial="rest"
>
  {/* Анимированный градиент-бордер */}
  <motion.div
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(135deg, #30D158, #5E5CE6, #0A84FF, #30D158)',
      backgroundSize: '300% 300%',
    }}
    variants={{
      rest: { backgroundPosition: '0% 50%' },
      hover: { backgroundPosition: '100% 50%' },
    }}
    transition={{ duration: 1.5, ease: 'linear' }}
  />
  <div className="relative bg-zinc-950 rounded-xl p-6">
    Контент
  </div>
</motion.div>
```

## Параметры Spring

| Характер | stiffness | damping | Описание |
|----------|-----------|---------|----------|
| Быстрый (кнопки) | 400 | 17 | Чёткий, отзывчивый |
| Средний (карточки) | 300 | 20 | Плавный, приятный |
| Мягкий (модалки) | 200 | 25 | Расслабленный, elegant |
| Bouncy (внимание) | 500 | 10 | Заметный bounce |

## Важно

- **`whileTap`** всегда вместе с `whileHover` — обратная связь для тач-устройств
- **`transition: spring`** — естественнее чем ease-out для hover
- **Не анимируй всё**: hover нужен только на интерактивных элементах (кнопки, ссылки, карточки)
- **3D tilt** расходует ресурсы — используй на 1–3 карточках, не на десятках
