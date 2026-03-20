# Кинематографические переходы

## Flash / White Burst

Яркая вспышка между сценами — создаёт ощущение удара:

```tsx
import { useCurrentFrame, interpolate } from 'remotion'

function FlashTransition({ triggerFrame = 0 }: { triggerFrame?: number }) {
  const frame = useCurrentFrame()
  const adjustedFrame = frame - triggerFrame

  // Быстро появляется (2 кадра), медленно исчезает (8 кадров)
  const opacity = adjustedFrame >= 0
    ? interpolate(adjustedFrame, [0, 2, 10], [0, 0.8, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#fff',
        opacity,
        pointerEvents: 'none',
        zIndex: 200,
      }}
    />
  )
}
```

## Quick-Cut Montage (быстрый монтаж)

Серия скриншотов по 2-4 кадра каждый — хайзнерги:

```tsx
import { useCurrentFrame, Img, staticFile } from 'remotion'

function QuickCutMontage({ images, framesPerImage = 3 }: {
  images: string[]
  framesPerImage?: number
}) {
  const frame = useCurrentFrame()
  const currentIndex = Math.floor(frame / framesPerImage) % images.length

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Img
        key={currentIndex}
        src={staticFile(images[currentIndex])}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {/* Flash на каждую смену */}
      {frame % framesPerImage === 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#fff',
          opacity: 0.15,
        }} />
      )}
    </div>
  )
}
```

## Zoom-Through Transition

Камера «пролетает сквозь» текущую сцену в следующую:

```tsx
function ZoomThrough({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame()

  // 0-15: нормально, 15-30: zoom + fade
  const scale = interpolate(frame, [15, 30], [1, 3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = interpolate(frame, [15, 25], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const blur = interpolate(frame, [15, 30], [0, 20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{
      transform: `scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
    }}>
      {children}
    </div>
  )
}
```

## Wipe Transition (горизонтальное стирание)

```tsx
function WipeTransition({
  direction = 'left',
  triggerFrame = 0,
  duration = 15,
  color = '#30D158',
}: Props) {
  const frame = useCurrentFrame()
  const adjustedFrame = frame - triggerFrame

  const progress = interpolate(adjustedFrame, [0, duration], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const gradientDir = direction === 'left' ? 'to right' : 'to left'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(${gradientDir}, ${color} ${progress - 5}%, transparent ${progress + 5}%)`,
        pointerEvents: 'none',
        zIndex: 200,
      }}
    />
  )
}
```

## Cross-Dissolve с Blur

Плавный переход через размытие:

```tsx
function CrossDissolve({
  children,
  nextContent,
  transitionStart = 60,
  transitionLength = 20,
}: Props) {
  const frame = useCurrentFrame()

  const currentOpacity = interpolate(frame, [transitionStart, transitionStart + transitionLength], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const nextOpacity = interpolate(frame, [transitionStart, transitionStart + transitionLength], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const blur = interpolate(
    frame,
    [transitionStart, transitionStart + transitionLength / 2, transitionStart + transitionLength],
    [0, 8, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: currentOpacity, filter: `blur(${blur}px)` }}>
        {children}
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: nextOpacity, filter: `blur(${blur}px)` }}>
        {nextContent}
      </div>
    </div>
  )
}
```

## Slide Reveal (слайд с перекрытием)

```tsx
function SlideReveal({ children, direction = 'right', triggerFrame = 0, duration = 20 }: Props) {
  const frame = useCurrentFrame()
  const adjustedFrame = frame - triggerFrame

  // Маска двигается, открывая контент
  const clipProgress = interpolate(adjustedFrame, [0, duration], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const clipPath = direction === 'right'
    ? `inset(0 ${100 - clipProgress}% 0 0)`
    : `inset(0 0 0 ${100 - clipProgress}%)`

  return (
    <div style={{ clipPath }}>
      {children}
    </div>
  )
}
```

## Glitch Transition

```tsx
function GlitchTransition({ triggerFrame = 0, duration = 10 }: Props) {
  const frame = useCurrentFrame()
  const adjustedFrame = frame - triggerFrame

  if (adjustedFrame < 0 || adjustedFrame > duration) return null

  const intensity = interpolate(adjustedFrame, [0, duration / 2, duration], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Несколько полос с разным смещением
  const strips = Array.from({ length: 8 }, (_, i) => ({
    top: `${i * 12.5}%`,
    height: '12.5%',
    transform: `translateX(${(Math.random() * 40 - 20) * intensity}px)`,
    opacity: Math.random() > 0.3 * intensity ? 1 : 0.5,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, overflow: 'hidden' }}>
      {strips.map((strip, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...strip,
            background: `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,255,0'}, ${0.1 * intensity})`,
          }}
        />
      ))}
    </div>
  )
}
```

## Scanlines Overlay (постоянный)

```tsx
function Scanlines({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, ${opacity}) 2px,
        rgba(0, 0, 0, ${opacity}) 4px
      )`,
      pointerEvents: 'none',
      zIndex: 100,
    }} />
  )
}
```

## Vignette Overlay

```tsx
function Vignette({ intensity = 0.6 }: { intensity?: number }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${intensity}) 100%)`,
      pointerEvents: 'none',
      zIndex: 99,
    }} />
  )
}
```

## Рекомендации по переходам

| Переход | Длительность (frames @30fps) | Энергия | Когда использовать |
|---------|-----|---------|-------------------|
| Flash | 8-12 | 🔥🔥🔥 | Между ударными сценами, sync с битом |
| Quick-Cut | 2-4/image | 🔥🔥🔥🔥 | Монтаж фич, энергичные секции |
| Zoom-Through | 15-20 | 🔥🔥 | Переход в новый раздел |
| Wipe | 12-20 | 🔥 | Структурный переход |
| Cross-Dissolve | 15-25 | ☁️ | Мягкий переход, рефлексия |
| Slide Reveal | 15-20 | 🔥🔥 | Раскрытие нового контента |
| Glitch | 6-12 | 🔥🔥🔥 | Техно-стиль, проблемные моменты |
