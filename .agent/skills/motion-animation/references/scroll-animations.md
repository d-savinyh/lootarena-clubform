# Scroll-анимации (Reveal on Scroll)

## Базовый whileInView

Самый простой способ — элемент появляется при входе во viewport:

```tsx
import { motion } from 'motion/react'

// Fade-up при появлении
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
>
  Контент секции
</motion.div>
```

**Параметры viewport:**
- `once: true` — анимация срабатывает один раз (не при каждом скролле)
- `amount: 0.3` — триггерится когда 30% элемента видно (0–1)
- `margin: "-100px"` — сместить зону триггера

## Staggered Children (каскад)

Дочерние элементы появляются с задержкой друг за другом:

```tsx
// Variants для контейнера и дочерних
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,    // задержка между детьми
      delayChildren: 0.2,      // задержка перед первым
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
  },
}

// Использование
<motion.div
  variants={containerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
>
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

## Slide-in (въезд сбоку)

```tsx
// Слева
const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
  },
}

// Справа
const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
  },
}
```

## Scale-in (появление с масштабированием)

```tsx
const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}
```

## Fade-up с blur

```tsx
const fadeUpBlur = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
  },
}
```

> **Примечание**: `filter: blur()` не GPU-ускоренное свойство, используй осторожно
> и только на небольших элементах. Для массовых reveal лучше простой fade-up.

## useInView (программный контроль)

Когда нужно больше контроля (например, запуск счётчика при появлении):

```tsx
import { useInView, useAnimate } from 'motion/react'

function AnimatedCounter({ target }: { target: number }) {
  const [scope, animate] = useAnimate()
  const isInView = useInView(scope, { once: true, amount: 0.5 })

  useEffect(() => {
    if (isInView) {
      animate(scope.current, { opacity: 1, y: 0 }, { duration: 0.5 })
    }
  }, [isInView])

  return (
    <div ref={scope} style={{ opacity: 0, y: 20 }}>
      {target}
    </div>
  )
}
```

## Рекомендуемые параметры

| Параметр | Значение | Зачем |
|----------|----------|-------|
| `duration` | 0.4–0.6s | Достаточно для восприятия, не тормозит |
| `ease` | `[0.2, 0.8, 0.2, 1]` | Smooth deceleration (custom ease-out) |
| `staggerChildren` | 0.08–0.15s | Заметный каскад без долгого ожидания |
| `viewport.amount` | 0.2–0.3 | Триггер когда 20–30% видно |
| `viewport.once` | `true` | Элемент не прячется при скролле обратно |
| `y` offset | 20–40px | Заметное смещение без прыжков |
