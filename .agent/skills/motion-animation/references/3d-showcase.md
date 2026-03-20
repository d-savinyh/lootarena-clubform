# 3D Showcase — презентация продукта

## Perspective Screenshot (3D-поворот скриншота)

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion'

function Screenshot3D({
  src,
  rotateY = 8,
  glowColor = '#30D158',
}: { src: string; rotateY?: number; glowColor?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Плавный вход
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  const scale = spring({ frame, fps, config: { damping: 18, stiffness: 140, mass: 0.8 } })
  const rotate = interpolate(frame, [0, 30], [rotateY + 5, rotateY], { extrapolateRight: 'clamp' })

  // Анимированный glow
  const glowIntensity = interpolate(frame, [20, 40, 60, 80], [0, 0.6, 0.4, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'extend',
  })

  return (
    <div style={{
      perspective: 1500,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        opacity,
        transform: `scale(${scale}) rotateY(${rotate}deg)`,
        transformStyle: 'preserve-3d',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: `0 20px 80px rgba(0,0,0,0.5), 0 0 40px ${glowColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}`,
        border: `1px solid ${glowColor}33`,
      }}>
        <Img src={staticFile(src)} style={{ width: 1100, display: 'block' }} />
      </div>
    </div>
  )
}
```

## Browser Chrome Frame (обёртка в макет браузера)

```tsx
function BrowserFrame({ children, url = 'app.lootarena.ru' }: Props) {
  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)',
      background: '#1a1a2e',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: '#0f0f1a',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28CA42' }} />
        </div>
        {/* URL bar */}
        <div style={{
          flex: 1,
          marginLeft: 16,
          padding: '4px 12px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 13,
          fontFamily: "'SF Mono', monospace",
        }}>
          🔒 {url}
        </div>
      </div>
      {/* Content */}
      {children}
    </div>
  )
}
```

## Mobile Device Frame (Telegram Mini App)

```tsx
function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 375,
      height: 812,
      borderRadius: 40,
      overflow: 'hidden',
      border: '3px solid rgba(255,255,255,0.15)',
      background: '#000',
      position: 'relative',
    }}>
      {/* Status bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 24px',
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
      }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>
      {/* Telegram header */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ color: '#0088cc', fontSize: 14 }}>← Telegram</span>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Loot Arena</span>
      </div>
      {/* App content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
```

## Annotation Pill (аннотация к скриншоту)

```tsx
function AnnotationPill({
  text,
  icon,
  delay = 0,
  position,
}: {
  text: string
  icon?: string
  delay?: number
  position: { top?: number; left?: number; right?: number; bottom?: number }
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const adjustedFrame = Math.max(0, frame - delay)
  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' })
  const scale = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.6 },
  })
  const x = interpolate(adjustedFrame, [0, 12], [20, 0], { extrapolateRight: 'clamp' })

  return (
    <div
      style={{
        position: 'absolute',
        ...position,
        opacity,
        transform: `scale(${scale}) translateX(${x}px)`,
        padding: '10px 18px',
        borderRadius: 12,
        background: 'linear-gradient(135deg, #0f0f15ee, #1a1a25ee)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(48, 209, 88, 0.3)',
        color: '#fff',
        fontSize: 16,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      {text}
    </div>
  )
}
```

## Zoom-in на деталь UI

```tsx
function ZoomDetail({ src, zoomArea, label }: {
  src: string
  zoomArea: { x: number; y: number; width: number; height: number }
  label: string
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Фазы: 0-30 = обзор, 30-60 = zoom, 60+ = показ
  const zoomProgress = interpolate(frame, [30, 55], [1, 2.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const focusX = interpolate(frame, [30, 55], [50, zoomArea.x], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const focusY = interpolate(frame, [30, 55], [50, zoomArea.y], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Лейбл появляется после zoom
  const labelOpacity = interpolate(frame, [55, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      <Img
        src={staticFile(src)}
        style={{
          width: 1100,
          transform: `scale(${zoomProgress})`,
          transformOrigin: `${focusX}% ${focusY}%`,
        }}
      />
      {/* Spotlight overlay */}
      {frame > 50 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${focusX}% ${focusY}%, transparent 15%, rgba(0,0,0,0.5) 40%)`,
        }} />
      )}
      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: labelOpacity,
        padding: '8px 24px',
        borderRadius: 8,
        background: 'rgba(48, 209, 88, 0.2)',
        border: '1px solid #30D158',
        color: '#30D158',
        fontSize: 18,
        fontWeight: 700,
      }}>
        {label}
      </div>
    </div>
  )
}
```

## Multi-Angle Rotation

```tsx
function RotatingShowcase({ src }: { src: string }) {
  const frame = useCurrentFrame()

  // Плавное вращение: -15° → 0° → +15° → 0°
  const rotateY = interpolate(
    frame % 120,
    [0, 30, 60, 90, 120],
    [-12, 0, 12, 0, -12],
  )
  const rotateX = interpolate(frame % 120, [0, 60, 120], [3, -3, 3])

  return (
    <div style={{ perspective: 2000, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
        transformStyle: 'preserve-3d',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 30px 100px rgba(0,0,0,0.4)',
      }}>
        <Img src={staticFile(src)} style={{ width: 1000, display: 'block' }} />
      </div>
    </div>
  )
}
```

## Параметры 3D

| Эффект | perspective | rotateY | rotateX | Описание |
|--------|------------|---------|---------|----------|
| Лёгкий наклон | 1500 | 3-5° | 0-2° | Деликатный 3D эффект |
| Showcase | 1500 | 8-12° | 2-4° | Стандартный показ продукта |
| Dramatic | 1000 | 15-20° | 5-8° | Максимальный эффект глубины |
| Flat hero | 2000+ | 0-3° | 0° | Почти плоский, с лёгким depth |
