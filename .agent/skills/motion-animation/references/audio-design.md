# Аудио-дизайн для видеороликов

## Базовый Audio в Remotion

```tsx
import { Audio, staticFile, Sequence, useCurrentFrame, interpolate } from 'remotion'

function ShowreelWithAudio() {
  return (
    <>
      {/* Фоновая музыка */}
      <Audio src={staticFile('audio/background-beat.mp3')} volume={0.5} />

      {/* SFX на конкретных моментах */}
      <Sequence from={0} durationInFrames={30}>
        <Audio src={staticFile('audio/sfx/whoosh.mp3')} volume={0.8} />
      </Sequence>

      <Sequence from={90} durationInFrames={15}>
        <Audio src={staticFile('audio/sfx/impact.mp3')} volume={1} />
      </Sequence>

      <Sequence from={210} durationInFrames={20}>
        <Audio src={staticFile('audio/sfx/reveal.mp3')} volume={0.7} />
      </Sequence>
    </>
  )
}
```

## Динамическое управление громкостью

```tsx
// Volume как функция от frame
<Audio
  src={staticFile('audio/music.mp3')}
  volume={(f) => {
    // Fade in: 0-30 frames
    if (f < 30) return interpolate(f, [0, 30], [0, 0.6])
    // Нормальная громкость
    if (f < 500) return 0.6
    // Duck (приглушить) для voiceover: 200-400
    if (f >= 200 && f <= 400) return 0.2
    // Fade out: последние 60 frames
    if (f > 500) return interpolate(f, [500, 560], [0.6, 0], { extrapolateRight: 'clamp' })
    return 0.6
  }}
/>
```

## Beat-Sync паттерн

Привязка визуальных событий к ударам в музыке:

```tsx
// Определяем BPM и beat-карту вручную
// 120 BPM = 1 beat каждые 0.5s = 15 frames @30fps
const BPM = 120
const BEAT_INTERVAL = (60 / BPM) * 30 // frames per beat

function useBeatSync(bpm: number) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const beatInterval = (60 / bpm) * fps

  const currentBeat = Math.floor(frame / beatInterval)
  const beatProgress = (frame % beatInterval) / beatInterval // 0→1 в пределах бита
  const isOnBeat = frame % Math.round(beatInterval) < 3 // 3 кадра = window

  return { currentBeat, beatProgress, isOnBeat, beatInterval }
}

// Использование: элемент пульсирует на каждый бит
function BeatPulse({ children }: { children: React.ReactNode }) {
  const { beatProgress } = useBeatSync(120)

  // Быстрый scale-up на удар, затем плавный возврат
  const scale = interpolate(beatProgress, [0, 0.1, 1], [1.08, 1.05, 1])
  const brightness = interpolate(beatProgress, [0, 0.1, 1], [1.3, 1.1, 1])

  return (
    <div style={{
      transform: `scale(${scale})`,
      filter: `brightness(${brightness})`,
    }}>
      {children}
    </div>
  )
}
```

## Beat Map — точная привязка к ударам

```tsx
// Для точной синхронизации — задай карту ударов вручную
// (послушай трек, отметь фреймы сильных ударов)
const BEAT_MAP = [
  { frame: 0, type: 'kick' },
  { frame: 15, type: 'snare' },
  { frame: 30, type: 'kick' },
  { frame: 45, type: 'snare' },
  { frame: 60, type: 'kick', accent: true }, // Сильный удар
  // ...
]

function useNearestBeat(beatMap: typeof BEAT_MAP) {
  const frame = useCurrentFrame()
  const nearest = beatMap.reduce((prev, curr) =>
    Math.abs(curr.frame - frame) < Math.abs(prev.frame - frame) ? curr : prev
  )
  const distanceToBeat = Math.abs(frame - nearest.frame)
  return { nearest, distanceToBeat, isNear: distanceToBeat < 3 }
}
```

## SFX Library — какие звуки когда

| Визуальное событие | Тип SFX | Длительность | Когда |
|-------------------|---------|-------------|-------|
| Title appear | `whoosh` или `riser` | 0.3-0.5s | Начало сцены |
| Flash transition | `impact` / `hit` | 0.1-0.2s | На flash |
| Screenshot 3D вход | `swoosh` | 0.3s | При появлении |
| Number count-up | `tick` (повторяющийся) | Per-tick | Во время count-up |
| Number final | `ding` / `success` | 0.2s | Count-up завершён |
| Glitch | `digital-glitch` | 0.1-0.3s | С glitch визуалом |
| Logo reveal | `logo-sting` | 0.5-1s | Brand moment |
| Price reveal | `dramatic-reveal` / `riser+hit` | 0.3-0.5s | На impact number |
| CTA button | `click` + `confirm` | 0.2s | Финал |
| Quick-cut montage | Без отдельных SFX | — | Музыка покрывает |
| Wipe transition | `sweep` | 0.3s | При wipe |

## Audio Ducking (приглушение музыки)

```tsx
// Музыка приглушается когда играет SFX или voiceover
function DuckedMusic({ src, duckRanges }: {
  src: string
  duckRanges: { from: number; to: number }[]
}) {
  return (
    <Audio
      src={staticFile(src)}
      volume={(f) => {
        const isDucked = duckRanges.some(r => f >= r.from && f <= r.to)
        if (isDucked) return 0.15
        // Плавный переход
        const nearDuck = duckRanges.find(r => f >= r.from - 10 && f < r.from)
        if (nearDuck) return interpolate(f, [nearDuck.from - 10, nearDuck.from], [0.6, 0.15])
        const nearUnduck = duckRanges.find(r => f > r.to && f <= r.to + 10)
        if (nearUnduck) return interpolate(f, [nearUnduck.to, nearUnduck.to + 10], [0.15, 0.6])
        return 0.6
      }}
    />
  )
}
```

## Структура папки audio/

```
public/audio/
├── music/
│   ├── epic-beat-120bpm.mp3    # Энергичный бит
│   ├── ambient-tech.mp3        # Фоновый ambient
│   └── corporate-upbeat.mp3    # B2B стиль
├── sfx/
│   ├── whoosh.mp3              # Появление элемента
│   ├── impact.mp3              # Удар/вспышка
│   ├── swoosh.mp3              # Движение/скольжение  
│   ├── reveal.mp3              # Раскрытие
│   ├── click.mp3               # Клик
│   ├── ding.mp3                # Успех/завершение
│   ├── glitch.mp3              # Цифровой глитч
│   ├── sweep.mp3               # Wipe-переход
│   ├── riser.mp3               # Нарастание напряжения
│   └── logo-sting.mp3          # Звук бренда
└── vo/                         # Voiceover (если есть)
    └── narration-ru.mp3
```

## Источники бесплатных SFX

- **Freesound.org** — огромная библиотека CC-лицензированных звуков
- **Pixabay Audio** — бесплатные SFX и музыка
- **Mixkit** — бесплатные звуковые эффекты
- **YouTube Audio Library** — для YouTube-контента

## Checklist аудио

- [ ] Фоновая музыка с правильным fade-in/out?
- [ ] SFX синхронизированы с визуальными событиями?
- [ ] Музыка duck'ается при voiceover/SFX?
- [ ] BPM музыки совпадает с ритмом монтажа?
- [ ] Нет пустых тишин и обрывов?
- [ ] Громкости сбалансированы (музыка тише SFX)?
