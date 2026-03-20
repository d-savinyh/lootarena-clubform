# Движение камеры (Virtual Camera)

В Remotion «камера» — это анимация CSS transform на контейнере всей сцены.

## Camera Container Wrapper

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'

interface CameraProps {
  children: React.ReactNode
  panX?: [number, number]       // [from, to] в px
  panY?: [number, number]
  zoom?: [number, number]       // [from, to] scale
  rotate?: [number, number]     // [from, to] в deg
  startFrame?: number
  endFrame?: number
}

function Camera({ children, panX, panY, zoom, rotate, startFrame = 0, endFrame = 90 }: CameraProps) {
  const frame = useCurrentFrame()

  const x = panX ? interpolate(frame, [startFrame, endFrame], panX, {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) : 0

  const y = panY ? interpolate(frame, [startFrame, endFrame], panY, {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) : 0

  const scale = zoom ? interpolate(frame, [startFrame, endFrame], zoom, {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) : 1

  const rot = rotate ? interpolate(frame, [startFrame, endFrame], rotate, {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) : 0

  return (
    <div style={{
      width: '100%', height: '100%',
      transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rot}deg)`,
      transformOrigin: 'center center',
    }}>
      {children}
    </div>
  )
}
```

## Типы движений

### Pan (горизонтальный/вертикальный сдвиг)
```tsx
// Медленный pan вправо — обзор dashboard
<Camera panX={[0, -200]} startFrame={0} endFrame={120}>
  <DashboardScreenshot />
</Camera>

// Vertical pan — скролл страницы
<Camera panY={[0, -400]} startFrame={0} endFrame={150}>
  <LandingPageScreenshot />
</Camera>
```

### Zoom In (приближение к детали)
```tsx
// Плавный zoom на конкретную зону UI
function ZoomToDetail({ children, focusPoint }: Props) {
  const frame = useCurrentFrame()
  
  const scale = interpolate(frame, [0, 30, 60], [1, 1, 2.5], {
    extrapolateRight: 'clamp',
  })
  
  return (
    <div style={{
      transform: `scale(${scale})`,
      transformOrigin: `${focusPoint.x}% ${focusPoint.y}%`,
    }}>
      {children}
    </div>
  )
}

// Использование: zoom на графики в правом верхнем углу
<ZoomToDetail focusPoint={{ x: 80, y: 20 }}>
  <DashboardScreenshot />
</ZoomToDetail>
```

### Dolly Zoom (Vertigo Effect)
```tsx
// Фон увеличивается, элемент на переднем плане — нет
function DollyZoom({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame()

  const bgScale = interpolate(frame, [0, 60], [1, 1.5], { extrapolateRight: 'clamp' })
  const fgScale = interpolate(frame, [0, 60], [1, 0.75], { extrapolateRight: 'clamp' })
  const translateZ = interpolate(frame, [0, 60], [0, 100], { extrapolateRight: 'clamp' })

  return (
    <div style={{ perspective: 1000 }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${bgScale})`,
        transformOrigin: 'center',
      }}>
        <div style={{ background: '#0a0a0f', width: '100%', height: '100%' }} />
      </div>
      {/* Foreground */}
      <div style={{
        position: 'relative',
        transform: `scale(${fgScale}) translateZ(${translateZ}px)`,
        transformOrigin: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}
```

### Orbit (вращение вокруг объекта)
```tsx
function OrbitCamera({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame()

  const rotateY = interpolate(frame, [0, 120], [-15, 15])
  const rotateX = interpolate(frame, [0, 60, 120], [5, -3, 5])

  return (
    <div style={{ perspective: 1500, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{
        transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
        transformStyle: 'preserve-3d',
      }}>
        {children}
      </div>
    </div>
  )
}
```

### Shake (тряска камеры)
```tsx
function CameraShake({ children, intensity = 5, duration = 15 }: Props) {
  const frame = useCurrentFrame()

  if (frame > duration) {
    return <div>{children}</div>
  }

  // Затухающее рандомное смещение
  const decay = 1 - frame / duration
  const x = (Math.sin(frame * 7.3) * intensity) * decay
  const y = (Math.cos(frame * 5.7) * intensity * 0.7) * decay
  const rotate = (Math.sin(frame * 9.1) * 1.5) * decay

  return (
    <div style={{ transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)` }}>
      {children}
    </div>
  )
}
```

### Ken Burns (медленный zoom + pan)
```tsx
function KenBurns({ children, variant = 'zoom-in' }: Props) {
  const frame = useCurrentFrame()

  const configs = {
    'zoom-in': { scale: [1, 1.15], x: [0, -30], y: [0, -20] },
    'zoom-out': { scale: [1.15, 1], x: [-30, 0], y: [-20, 0] },
    'pan-right': { scale: [1.05, 1.05], x: [0, -80], y: [0, 0] },
    'pan-left': { scale: [1.05, 1.05], x: [-80, 0], y: [0, 0] },
  }

  const cfg = configs[variant]
  const scale = interpolate(frame, [0, 150], cfg.scale, { extrapolateRight: 'clamp' })
  const x = interpolate(frame, [0, 150], cfg.x, { extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 150], cfg.y, { extrapolateRight: 'clamp' })

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <div style={{ transform: `scale(${scale}) translate(${x}px, ${y}px)` }}>
        {children}
      </div>
    </div>
  )
}
```

## Easing для камеры

```tsx
// Кинематографический easing — медленный старт, плавный финиш
const cinematicEase = (t: number) => {
  // ease-in-out-cubic
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Использование с interpolate
const x = interpolate(frame, [0, 90], [0, -200], {
  easing: cinematicEase,
  extrapolateRight: 'clamp',
})
```

## Motion Blur (встроенный Remotion)

```tsx
import { CameraMotionBlur } from '@remotion/motion-blur'

function SceneWithBlur() {
  return (
    <CameraMotionBlur samples={10} shutterAngle={180}>
      <Camera panX={[0, -300]} zoom={[1, 1.5]}>
        <SceneContent />
      </Camera>
    </CameraMotionBlur>
  )
}
```

## Комбинации движений по сценам

| Сцена | Движение | Зачем |
|-------|----------|-------|
| Title | Лёгкий zoom-in (1→1.05) | Втягивает зрителя |
| Problem | Shake (3-5px, 10 frames) | Дискомфорт, энергия |
| Solution | Zoom-out + pan center | Раскрытие, обзор |
| Feature demo | Pan по скриншоту + zoom | Показать UI |
| Metrics | Статичная камера | Фокус на числах |
| Pricing | Dolly zoom | Драматичность |
| CTA | Медленный zoom-in | Вовлечение |
