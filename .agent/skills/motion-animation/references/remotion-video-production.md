# Remotion — программное видеопроизводство

## Архитектура проекта

### Изоляция entry point
Для больших проектов (ERP, лендинг) используй отдельный entry point, чтобы Remotion не тянул тяжёлые зависимости (recharts и т.д.):

```tsx
// showreel-entry.ts — лёгкий entry point
import { registerRoot } from 'remotion'
import { ShowreelRoot } from './ShowreelRoot'
registerRoot(ShowreelRoot)
```

```tsx
// ShowreelRoot.tsx — только композиции для видео
import { Composition } from 'remotion'
import { LootArenaShowreel } from './compositions/LootArenaShowreel'

export const ShowreelRoot: React.FC = () => (
  <>
    <Composition
      id="LootArenaShowreel"
      component={LootArenaShowreel}
      durationInFrames={30 * 60} // 60 секунд @ 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  </>
)
```

### Структура файлов
```
src/showreel/
├── showreel-entry.ts          # Изолированный entry point
├── ShowreelRoot.tsx            # Root с Composition
├── compositions/
│   └── LootArenaShowreel.tsx   # Мастер-композиция (все сцены)
├── scenes/
│   ├── TitleScene.tsx          # Заголовок / hook
│   ├── ProblemScene.tsx        # Боль клиента
│   ├── FeatureScene.tsx        # Демо фичи
│   ├── ScreenshotScene.tsx     # 3D showcase скриншота
│   ├── MetricsScene.tsx        # Цифры и результаты
│   ├── PricingScene.tsx        # Pricing reveal
│   └── CTAScene.tsx            # Финальный призыв
├── components/
│   ├── KineticText.tsx         # Кинетическая типографика
│   ├── ScreenshotFrame.tsx     # 3D рамка для скриншотов
│   ├── TransitionFlash.tsx     # flash-переходы
│   └── AnnotationPill.tsx      # Аннотации к скриншотам
└── assets/
    └── (backgrounds, screenshots, audio)
```

## Основные API

### useCurrentFrame + interpolate
```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'

function FadeInTitle({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Линейная интерполяция: opacity 0→1 за первые 15 кадров
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  })

  // Spring для scale — агрессивный bounce
  const scale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.5 },
  })

  // Y-позиция: въезд снизу
  const y = interpolate(frame, [0, 20], [60, 0], {
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{ opacity, transform: `scale(${scale}) translateY(${y}px)` }}>
      <h1 style={{ fontSize: 80, fontWeight: 900, color: '#fff' }}>{text}</h1>
    </div>
  )
}
```

### Sequence — порядок сцен
```tsx
import { Sequence } from 'remotion'

function Showreel() {
  return (
    <div style={{ background: '#0a0a0f', width: '100%', height: '100%' }}>
      <Sequence from={0} durationInFrames={90}>    {/* 0-3s: Title */}
        <TitleScene />
      </Sequence>
      <Sequence from={90} durationInFrames={120}>  {/* 3-7s: Problem */}
        <ProblemScene />
      </Sequence>
      <Sequence from={210} durationInFrames={150}> {/* 7-12s: Features */}
        <FeatureScene />
      </Sequence>
      <Sequence from={360} durationInFrames={120}> {/* 12-16s: Screenshots */}
        <ScreenshotScene />
      </Sequence>
      <Sequence from={480} durationInFrames={90}>  {/* 16-19s: Metrics */}
        <MetricsScene />
      </Sequence>
      <Sequence from={570} durationInFrames={90}>  {/* 19-22s: Pricing */}
        <PricingScene />
      </Sequence>
      <Sequence from={660} durationInFrames={90}>  {/* 22-25s: CTA */}
        <CTAScene />
      </Sequence>
    </div>
  )
}
```

### Audio sync
```tsx
import { Audio, staticFile, useCurrentFrame } from 'remotion'

function ShowreelWithMusic() {
  return (
    <>
      <Audio src={staticFile('music/epic-beat.mp3')} volume={0.7} />
      {/* Сцены идут поверх */}
      <Showreel />
    </>
  )
}
```

### staticFile для ассетов
```tsx
import { Img, staticFile } from 'remotion'

// Файл лежит в public/screenshots/dashboard.png
<Img src={staticFile('screenshots/dashboard.png')} />
```

## Spring конфигурации

| Характер | damping | stiffness | mass | Описание |
|----------|---------|-----------|------|----------|
| **Impact** (заголовки) | 6-8 | 200-250 | 0.4-0.5 | Агрессивный bounce, привлекает внимание |
| **Snappy** (UI элементы) | 12-15 | 180-220 | 0.6 | Быстрый, чёткий вход |
| **Smooth** (скриншоты) | 18-22 | 120-160 | 0.8 | Плавное появление |
| **Elastic** (цифры) | 5-7 | 300-400 | 0.3 | Максимальный bounce для метрик |

## Rendering

```bash
# Превью в студии
npx remotion studio showreel-entry.ts

# Рендер финального видео
npx remotion render showreel-entry.ts LootArenaShowreel out/showreel.mp4

# С параллельностью
npx remotion render showreel-entry.ts LootArenaShowreel out/showreel.mp4 --concurrency=4

# Только фрагмент (для тестирования)
npx remotion render showreel-entry.ts LootArenaShowreel out/test.mp4 --frames=0-90
```

## Overlays (сканлайны, виньетка)

```tsx
// Сканлайны — ТВ-ретро эффект
function Scanlines() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  )
}

// Виньетка — фокус на центр
function Vignette({ intensity = 0.6 }: { intensity?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${intensity}) 100%)`,
        pointerEvents: 'none',
        zIndex: 99,
      }}
    />
  )
}
```

## Checklist качества ролика

- [ ] Entry point изолирован от основного проекта?
- [ ] Все ассеты в `public/` и загружаются через `staticFile()`?
- [ ] Spring config подобран под энергетику ролика?
- [ ] Overlays (scanlines/vignette) добавляют кинематографичность?
- [ ] Аудио синхронизировано с ключевыми моментами?
- [ ] Финальный рендер проверен на артефакты?
