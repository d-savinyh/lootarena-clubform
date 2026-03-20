# Тренды моушен-дизайна 2026

## Liquid Glass (Apple-стиль)

Полупрозрачные поверхности с blur и iridescence:

```tsx
function LiquidGlassCard({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame()
  const hueShift = interpolate(frame % 120, [0, 120], [0, 360])

  return (
    <div style={{
      padding: 32, borderRadius: 24,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03), rgba(255,255,255,0.08))',
      backdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Iridescent shimmer */}
      <div style={{
        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
        background: `conic-gradient(from ${hueShift}deg, rgba(255,100,100,0.05), rgba(100,255,100,0.05), rgba(100,100,255,0.05), rgba(255,100,100,0.05))`,
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
```

## Neon-Noir (высококонтрастный)

RGB split, пульсирующее свечение, red/black:

```tsx
function NeonNoirTitle({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const glowPulse = interpolate(frame % 60, [0, 30, 60], [0.5, 1, 0.5])
  const splitOffset = interpolate(frame % 30, [0, 15, 30], [0, 2, 0])

  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      {/* Red channel */}
      <h1 style={{
        fontSize: 100, fontWeight: 900, color: 'rgba(255,0,0,0.5)',
        position: 'absolute', inset: 0, transform: `translateX(${-splitOffset}px)`,
        mixBlendMode: 'screen',
      }}>{text}</h1>
      {/* Blue channel */}
      <h1 style={{
        fontSize: 100, fontWeight: 900, color: 'rgba(0,100,255,0.5)',
        position: 'absolute', inset: 0, transform: `translateX(${splitOffset}px)`,
        mixBlendMode: 'screen',
      }}>{text}</h1>
      {/* Main */}
      <h1 style={{
        fontSize: 100, fontWeight: 900, color: '#fff', position: 'relative',
        textShadow: `0 0 ${20 * glowPulse}px rgba(255,0,50,${0.6 * glowPulse})`,
      }}>{text}</h1>
    </div>
  )
}
```

## Vibrant Gradients (animated mesh)

```tsx
function AnimatedMeshGradient() {
  const frame = useCurrentFrame()
  const x1 = interpolate(frame % 180, [0, 90, 180], [20, 80, 20])
  const y1 = interpolate(frame % 180, [0, 90, 180], [30, 70, 30])
  const x2 = interpolate(frame % 150, [0, 75, 150], [70, 20, 70])

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `
        radial-gradient(ellipse at ${x1}% ${y1}%, rgba(48,209,88,0.3), transparent 50%),
        radial-gradient(ellipse at ${x2}% 50%, rgba(94,92,230,0.3), transparent 50%),
        #0a0a0f`,
      filter: 'blur(40px)', zIndex: 0,
    }} />
  )
}
```

## Aurora Effect

```tsx
function AuroraBackground() {
  const frame = useCurrentFrame()
  const offset1 = interpolate(frame % 240, [0, 120, 240], [-20, 20, -20])
  const offset2 = interpolate(frame % 200, [0, 100, 200], [20, -20, 20])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', width: '150%', height: '50%', top: '10%', left: '-25%',
        background: 'linear-gradient(90deg, transparent, rgba(48,209,88,0.15), rgba(94,92,230,0.1), transparent)',
        transform: `translateX(${offset1}%) skewY(-5deg)`, filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', width: '150%', height: '30%', top: '30%', left: '-25%',
        background: 'linear-gradient(90deg, transparent, rgba(255,55,95,0.1), rgba(48,209,88,0.08), transparent)',
        transform: `translateX(${offset2}%) skewY(3deg)`, filter: 'blur(80px)',
      }} />
    </div>
  )
}
```

## Alive Interfaces (дышащие элементы)

```tsx
function AliveCard({ children, index = 0 }: Props) {
  const frame = useCurrentFrame()
  const breathe = interpolate((frame + index * 20) % 120, [0, 60, 120], [0, 2, 0])

  return (
    <div style={{
      transform: `translateY(${-breathe}px)`,
      boxShadow: `0 ${10 + breathe * 2}px ${30 + breathe * 5}px rgba(48,209,88,0.15)`,
      borderRadius: 16, padding: 24,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {children}
    </div>
  )
}
```

## Палитры

| Тренд | Primary | Accent | Background |
|-------|---------|--------|------------|
| **Liquid Glass** | `rgba(255,255,255,0.1)` | Iridescent conic | `blur(40px)` |
| **Neon-Noir** | `#ff0032` | `#0064ff` | `#0a0a0f` |
| **Aurora** | `#30D158` | `#5E5CE6` | `#0a0a0f` |
| **Alive** | Brand color | Shimmer | Dark |
