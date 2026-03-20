# Variants и паттерны оркестрации

## Variants — основа сложных анимаций

Variants позволяют определить именованные состояния и автоматически пробрасывать их в дочерние элементы:

```tsx
import { motion } from 'motion/react'

// Определяем variants
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

// Использование — дочерние элементы наследуют initial/animate
<motion.ul variants={container} initial="hidden" animate="visible">
  <motion.li variants={item}>Элемент 1</motion.li>
  <motion.li variants={item}>Элемент 2</motion.li>
  <motion.li variants={item}>Элемент 3</motion.li>
</motion.ul>
```

## Stagger Patterns

### Линейный stagger
```tsx
const container = {
  visible: {
    transition: {
      staggerChildren: 0.08,  // каждый следующий +80ms
    },
  },
}
```

### Grid stagger (сетка)
```tsx
// Для grid-элементов — рассчитай задержку по позиции
function getGridDelay(index: number, columns: number) {
  const row = Math.floor(index / columns)
  const col = index % columns
  return (row + col) * 0.05  // диагональный каскад
}

const gridItem = (index: number, columns: number) => ({
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: getGridDelay(index, columns),
      duration: 0.4,
    },
  },
})
```

### Reverse stagger
```tsx
const container = {
  visible: {
    transition: {
      staggerChildren: 0.08,
      staggerDirection: -1,  // от последнего к первому
    },
  },
}
```

## AnimatePresence (mount/unmount)

Анимация появления и исчезновения элементов:

```tsx
import { AnimatePresence, motion } from 'motion/react'

function Notification({ message, visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="notification"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

## Reusable Variant Presets

Готовые variants для переиспользования в проекте:

```tsx
// variants/presets.ts
export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
  },
}

export const fadeUpBlur = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
  },
}

export const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
  },
}

export const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
  },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
  },
}

export const springPop = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
}

// Stagger container
export const staggerContainer = (stagger = 0.1, delay = 0) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
})
```

## Использование пресетов

```tsx
import { fadeUp, staggerContainer } from '@/variants/presets'

<motion.section
  variants={staggerContainer(0.1)}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  <motion.h2 variants={fadeUp}>Заголовок</motion.h2>
  <motion.p variants={fadeUp}>Описание</motion.p>
</motion.section>
```

## Transition Types

| Тип | Синтаксис | Когда |
|-----|-----------|-------|
| Tween (ease) | `{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }` | Reveal, fade |
| Spring | `{ type: 'spring', stiffness: 300, damping: 20 }` | Hover, tap, pop |
| Inertia | `{ type: 'inertia', velocity: 50 }` | Drag release |
