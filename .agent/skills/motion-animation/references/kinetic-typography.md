# Кинетическая типографика

## Glitch-эффект (RGB Split)

Смещение цветовых каналов через text-shadow + случайный transform:

```tsx
import { useCurrentFrame, interpolate } from 'remotion'

function GlitchText({ text }: { text: string }) {
  const frame = useCurrentFrame()

  // Случайное смещение каждые 3 кадра
  const glitchIntensity = frame % 3 === 0 ? 1 : 0
  const offsetX = glitchIntensity * (Math.random() * 6 - 3)

  // RGB split через text-shadow
  const textShadow = glitchIntensity
    ? `${-2 + offsetX}px 0 rgba(255,0,0,0.7), ${2 - offsetX}px 0 rgba(0,255,0,0.7), 0 ${offsetX}px rgba(0,0,255,0.7)`
    : 'none'

  return (
    <h1
      style={{
        fontSize: 90,
        fontWeight: 900,
        color: '#fff',
        textShadow,
        transform: `translateX(${offsetX}px)`,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: '-2px',
      }}
    >
      {text}
    </h1>
  )
}
```

## Impact Numbers (Spring Bounce)

Цифры влетают с мощным bounce:

```tsx
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion'

function ImpactNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({
    frame,
    fps,
    config: { damping: 6, stiffness: 250, mass: 0.4 },
  })

  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}>
      <span style={{
        fontSize: 140,
        fontWeight: 900,
        color: '#30D158',
        lineHeight: 1,
        fontFamily: "'Inter', sans-serif",
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 48,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.6)',
        marginLeft: 8,
      }}>
        {suffix}
      </span>
    </div>
  )
}
```

## Word-by-Word Reveal

Каждое слово появляется с задержкой:

```tsx
import { useCurrentFrame, interpolate } from 'remotion'

function WordReveal({ text, startFrame = 0, frameDuration = 6 }: Props) {
  const frame = useCurrentFrame()
  const words = text.split(' ')

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', justifyContent: 'center' }}>
      {words.map((word, i) => {
        const wordStart = startFrame + i * frameDuration
        const opacity = interpolate(frame, [wordStart, wordStart + 5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const y = interpolate(frame, [wordStart, wordStart + 5], [20, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              fontSize: 64,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
```

## Letter-by-Letter Reveal

Посимвольное появление (для коротких фраз):

```tsx
function LetterReveal({ text, framePerLetter = 2 }: Props) {
  const frame = useCurrentFrame()

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {text.split('').map((char, i) => {
        const charStart = i * framePerLetter
        const opacity = interpolate(frame, [charStart, charStart + 3], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const scale = interpolate(frame, [charStart, charStart + 4], [0.5, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `scale(${scale})`,
              fontSize: 80,
              fontWeight: 900,
              color: '#fff',
              display: 'inline-block',
              minWidth: char === ' ' ? '20px' : undefined,
            }}
          >
            {char}
          </span>
        )
      })}
    </div>
  )
}
```

## Animated Count-Up (для метрик в видео)

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'

function AnimatedCounter({
  from = 0,
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
}: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Eased count-up
  const progress = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out-cubic
  })

  const value = from + (to - from) * progress
  const display = `${prefix}${value.toFixed(decimals)}${suffix}`

  // Scale pop при завершении
  const doneScale = spring({
    frame: Math.max(0, frame - 45),
    fps,
    config: { damping: 8, stiffness: 300 },
  })

  return (
    <span style={{
      fontSize: 96,
      fontWeight: 900,
      color: '#30D158',
      transform: frame > 45 ? `scale(${doneScale})` : undefined,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {display}
    </span>
  )
}
```

## Scale-Up с Rotate (заголовок-удар)

```tsx
function ScaleRotateTitle({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 5, stiffness: 200, mass: 0.6 } })
  const rotate = interpolate(frame, [0, 12], [-5, 0], { extrapolateRight: 'clamp' })
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <h1 style={{
      fontSize: 100,
      fontWeight: 900,
      color: '#fff',
      opacity,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      textTransform: 'uppercase',
      letterSpacing: '4px',
    }}>
      {text}
    </h1>
  )
}
```

## Параметры для разных стилей

| Стиль | frameDuration | Эффект | Когда |
|-------|-----------|--------|-------|
| **Impact** | spring (damping: 5-8) | Bounce scale | Заголовки, цифры |
| **Reveal** | 5-8 frames/word | Word-by-word fade-up | Описания, слоганы |
| **Glitch** | 2-3 frames trigger | RGB split + offset | Техно-стиль, energy |
| **Count** | 30-60 frames total | Eased number animation | Метрики, KPI |
| **Typewriter** | 2 frames/letter | Sequential appear | Код, команды |
