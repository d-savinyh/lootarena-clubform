# Микроанимации

## Animated Checkmark (галочка с bounce)

```tsx
import { motion, AnimatePresence } from 'motion/react'

function AnimatedCheck({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 15,
          }}
        >
          <Check size={16} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

## Пульсирующая рамка

```css
/* Пульсирующая dashed-рамка */
@keyframes pulse-border {
  0%, 100% {
    border-color: rgba(113, 113, 122, 0.5);
  }
  50% {
    border-color: rgba(48, 209, 88, 0.6);
  }
}

.animate-pulse-border {
  animation: pulse-border 3s ease-in-out infinite;
}
```

## Animated Gradient Flow

```css
/* Градиент плавно перетекает */
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animated-gradient {
  background-size: 200% 200%;
  animation: gradient-flow 4s ease-in-out infinite;
}
```

```tsx
// Использование в React
<div
  className="animated-gradient rounded-2xl p-6"
  style={{
    background: 'linear-gradient(135deg, #30D158, #5E5CE6, #0A84FF, #30D158)',
    backgroundSize: '200% 200%',
  }}
>
  Gradient Border
</div>
```

## Shimmer / Skeleton Loading

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}
```

## Count-Up (анимированный счётчик)

```tsx
import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import { useEffect } from 'react'

function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(count, target, { duration })
    return controls.stop
  }, [target])

  return <motion.span>{rounded}</motion.span>
}
```

## Typing Effect (набор текста)

```tsx
function TypingText({ text, delay = 0.03 }: { text: string; delay?: number }) {
  return (
    <motion.span>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * delay }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}
```

## Badge Pulse (индикатор активности)

```tsx
<motion.div
  className="w-2 h-2 rounded-full bg-green-500"
  animate={{
    scale: [1, 1.4, 1],
    opacity: [1, 0.5, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
/>
```

## Когда использовать

| Микроанимация | Цель | Длительность |
|---------------|------|-------------|
| Checkmark bounce | Подтверждение действия | 0.3s |
| Pulse border | Привлечь внимание | 3s (infinite) |
| Gradient flow | Визуальный интерес | 4s (infinite) |
| Shimmer | Загрузка / placeholder | 2s (infinite) |
| Count-up | Показать числа | 1–2s |
| Typing | Динамический текст | char × 0.03s |
| Badge pulse | Статус «онлайн» | 2s (infinite) |
