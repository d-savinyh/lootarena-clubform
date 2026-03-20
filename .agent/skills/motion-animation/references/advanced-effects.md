# Продвинутые визуальные эффекты

## Particle System (CSS-only)

```tsx
import { useCurrentFrame, interpolate } from 'remotion'

function Particles({ count = 30, color = '#30D158' }: Props) {
  const frame = useCurrentFrame()

  // Генерируем стабильные частицы по seed
  const particles = Array.from({ length: count }, (_, i) => ({
    x: ((i * 137.508) % 100),  // Golden angle distribution
    y: ((i * 89.123) % 100),
    size: 2 + (i % 5),
    speed: 0.3 + (i % 7) * 0.15,
    delay: i * 3,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map((p, i) => {
        const adjustedFrame = Math.max(0, frame - p.delay)
        const y = p.y - adjustedFrame * p.speed
        const opacity = interpolate(adjustedFrame, [0, 10, 60, 80], [0, 0.6, 0.6, 0], {
          extrapolateRight: 'clamp',
        })
        const wobble = Math.sin(adjustedFrame * 0.1 + i) * 5

        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x + wobble}%`,
            top: `${y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: color,
            opacity,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
          }} />
        )
      })}
    </div>
  )
}
```

## Confetti Burst

```tsx
function Confetti({ triggerFrame = 0, count = 40 }: Props) {
  const frame = useCurrentFrame()
  const adjustedFrame = frame - triggerFrame
  if (adjustedFrame < 0) return null

  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    const velocity = 8 + (i % 5) * 3
    const colors = ['#30D158', '#5E5CE6', '#0A84FF', '#FF375F', '#FFD60A']

    return {
      x: Math.cos(angle) * velocity * adjustedFrame * 0.5,
      y: Math.sin(angle) * velocity * adjustedFrame * 0.3 + adjustedFrame * adjustedFrame * 0.05, // gravity
      rotation: adjustedFrame * (5 + i % 10),
      color: colors[i % colors.length],
      size: 6 + (i % 4) * 2,
    }
  })

  const opacity = interpolate(adjustedFrame, [0, 5, 40, 60], [0, 1, 1, 0], { extrapolateRight: 'clamp' })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity, pointerEvents: 'none' }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: p.size, height: p.size * 0.6,
          background: p.color,
          borderRadius: 1,
          transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`,
        }} />
      ))}
    </div>
  )
}
```

## Mask Reveal (clip-path)

```tsx
// Круговой reveal из центра
function CircleReveal({ children, startFrame = 0, duration = 25 }: Props) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame - startFrame, [0, duration], [0, 100], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <div style={{ clipPath: `circle(${progress}% at 50% 50%)` }}>
      {children}
    </div>
  )
}

// Diagonal wipe reveal
function DiagonalReveal({ children, startFrame = 0, duration = 20 }: Props) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame - startFrame, [0, duration], [-10, 110], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <div style={{
      clipPath: `polygon(0 0, ${progress}% 0, ${progress - 20}% 100%, 0 100%)`,
    }}>
      {children}
    </div>
  )
}

// Iris reveal (от центра к краям)
function IrisReveal({ children, startFrame = 0, duration = 20 }: Props) {
  const frame = useCurrentFrame()
  const p = interpolate(frame - startFrame, [0, duration], [0, 55], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <div style={{
      clipPath: `inset(${50 - p}% ${50 - p}% ${50 - p}% ${50 - p}%)`,
    }}>
      {children}
    </div>
  )
}
```

## Spotlight / Focus Effect

```tsx
function Spotlight({ x = 50, y = 50, radius = 200, frame }: Props) {
  const currentFrame = useCurrentFrame()
  const f = frame ?? currentFrame

  const opacity = interpolate(f, [0, 15], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <div style={{
      position: 'absolute', inset: 0, opacity, pointerEvents: 'none', zIndex: 50,
      background: `radial-gradient(circle ${radius}px at ${x}% ${y}%, transparent 0%, rgba(0,0,0,0.7) 100%)`,
    }} />
  )
}
```

## Energy Lines (speed lines)

```tsx
function SpeedLines({ direction = 'horizontal', count = 8 }: Props) {
  const frame = useCurrentFrame()

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const pos = ((i * 137.508 + frame * 3) % 120) - 10 // движущиеся линии
        const thickness = 1 + (i % 3)
        const opacity = interpolate(pos, [0, 50, 100], [0, 0.3, 0])

        return direction === 'horizontal' ? (
          <div key={i} style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${pos}%`,
            height: thickness,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,${opacity}), transparent)`,
          }} />
        ) : (
          <div key={i} style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${pos}%`,
            width: thickness,
            background: `linear-gradient(180deg, transparent, rgba(255,255,255,${opacity}), transparent)`,
          }} />
        )
      })}
    </div>
  )
}
```

## Color Shift / Hue Rotate

```tsx
function ColorShift({ children, speed = 3 }: Props) {
  const frame = useCurrentFrame()
  const hue = (frame * speed) % 360

  return (
    <div style={{ filter: `hue-rotate(${hue}deg)` }}>
      {children}
    </div>
  )
}
```

## Split Screen

```tsx
function SplitScreen({ left, right, splitPosition = 50, angle = 0 }: Props) {
  const frame = useCurrentFrame()

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition - angle}% 100%, 0 100%)`,
      }}>
        {left}
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition - angle}% 100%)`,
      }}>
        {right}
      </div>
      {/* Divider */}
      <div style={{
        position: 'absolute',
        left: `${splitPosition}%`, top: 0, bottom: 0,
        width: 3, background: '#30D158',
        transform: `rotate(${angle}deg)`,
        boxShadow: '0 0 20px rgba(48,209,88,0.5)',
      }} />
    </div>
  )
}
```

## Когда использовать

| Эффект | Сцена | Энергия |
|--------|-------|---------|
| **Particles** | Фон title/CTA | Средняя |
| **Confetti** | После pricing, достижения | Высокая |
| **Circle Reveal** | Переход к solution | Средняя |
| **Diagonal Reveal** | Feature переключение | Средняя |
| **Spotlight** | Zoom на деталь UI | Низкая |
| **Speed Lines** | Quick-cut, энергия | Высокая |
| **Color Shift** | Психоделический акцент | Высокая |
| **Split Screen** | Before/After, сравнение | Средняя |
