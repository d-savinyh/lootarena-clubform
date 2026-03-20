# SaaS Промо-ролик — паттерны

## Структура ролика (7-Act Framework)

| Act | Сцена | Frames @30fps | Цель |
|-----|-------|-----------|------|
| 1 | **Hook** | 0-90 (3s) | Внимание: боль или wow-статистика |
| 2 | **Problem** | 90-210 (4s) | Описание боли целевой аудитории |
| 3 | **Solution** | 210-360 (5s) | Первое знакомство с продуктом |
| 4 | **Features** | 360-600 (8s) | 3-4 ключевые фичи с UI |
| 5 | **Social Proof** | 600-720 (4s) | Метрики, клиенты, результаты |
| 6 | **Pricing** | 720-840 (4s) | Ценовое предложение + гарантия |
| 7 | **CTA** | 840-930 (3s) | Призыв к действию |

**Итого: ~31 секунда** (идеально для рекламы и соцсетей)

## Act 1: Hook Scene

```tsx
function HookScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Провокационный вопрос или метрика
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%', background: '#0a0a0f',
    }}>
      <WordReveal text="Вы теряете до 500 000 ₽" startFrame={0} frameDuration={5} />
      <WordReveal text="каждый месяц" startFrame={40} frameDuration={5} />
      {/* Impact number */}
      {frame > 60 && (
        <ImpactNumber value="500K" suffix="₽/мес" />
      )}
    </div>
  )
}
```

## Act 2: Problem Scene

```tsx
function ProblemScene() {
  const frame = useCurrentFrame()

  // Список болей с stagger-появлением
  const pains = [
    { icon: '😤', text: 'Гости приходят один раз и забывают' },
    { icon: '📉', text: 'Нет контроля над повторными визитами' },
    { icon: '💸', text: 'Персонал ворует — вы не знаете' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 24,
      justifyContent: 'center', padding: '0 200px',
      width: '100%', height: '100%', background: '#0a0a0f',
    }}>
      {pains.map((pain, i) => {
        const itemStart = i * 25
        const opacity = interpolate(frame, [itemStart, itemStart + 12], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        })
        const x = interpolate(frame, [itemStart, itemStart + 12], [-40, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        })
        return (
          <div key={i} style={{
            opacity, transform: `translateX(${x}px)`,
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 24px', borderRadius: 12,
            background: 'rgba(255,0,50,0.08)', border: '1px solid rgba(255,0,50,0.2)',
          }}>
            <span style={{ fontSize: 32 }}>{pain.icon}</span>
            <span style={{ fontSize: 24, color: '#fff', fontWeight: 600 }}>{pain.text}</span>
          </div>
        )
      })}
    </div>
  )
}
```

## Act 3: Solution Reveal

```tsx
function SolutionScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Flash → Logo reveal
  const flashOpacity = interpolate(frame, [0, 3, 12], [0, 0.8, 0], {
    extrapolateRight: 'clamp',
  })
  const logoScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.5 },
  })
  const logoOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%', background: '#0a0a0f',
    }}>
      {/* Flash */}
      <div style={{
        position: 'absolute', inset: 0, background: '#30D158',
        opacity: flashOpacity, zIndex: 10,
      }} />
      {/* Logo + tagline */}
      <div style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}>
        <Img src={staticFile('logo.png')} style={{ width: 200, marginBottom: 24 }} />
      </div>
      {frame > 30 && (
        <WordReveal text="Превращаем гостей в постоянных клиентов" startFrame={30} frameDuration={4} />
      )}
    </div>
  )
}
```

## Act 4: Feature Showcase (комбинация паттернов)

Используй Screenshot3D + AnnotationPill из `3d-showcase.md`:

```tsx
function FeatureScene({ features }: { features: Feature[] }) {
  const frame = useCurrentFrame()

  // Каждая фича — отдельный блок по ~60 frames
  const currentFeatureIndex = Math.min(
    Math.floor(frame / 60),
    features.length - 1
  )
  const featureFrame = frame - currentFeatureIndex * 60

  const feature = features[currentFeatureIndex]

  return (
    <div style={{
      display: 'flex', gap: 60, alignItems: 'center',
      justifyContent: 'center', padding: '0 80px',
      width: '100%', height: '100%', background: '#0a0a0f',
    }}>
      {/* Скриншот */}
      <Screenshot3D src={feature.screenshot} rotateY={8} />

      {/* Аннотации */}
      {feature.annotations.map((ann, i) => (
        <AnnotationPill
          key={i}
          text={ann.text}
          icon={ann.icon}
          delay={15 + i * 10}
          position={ann.position}
        />
      ))}
    </div>
  )
}
```

## Act 5: Metrics / Social Proof

```tsx
function MetricsScene() {
  const frame = useCurrentFrame()

  const metrics = [
    { value: '47+', label: 'клубов подключено', icon: '🏆' },
    { value: '12К+', label: 'выполненных миссий', icon: '🎯' },
    { value: '+35%', label: 'рост retention', icon: '📈' },
  ]

  return (
    <div style={{
      display: 'flex', gap: 60, justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%', background: '#0a0a0f',
    }}>
      {metrics.map((m, i) => {
        const itemStart = i * 20
        const scale = spring({
          frame: Math.max(0, frame - itemStart),
          fps: 30,
          config: { damping: 8, stiffness: 200 },
        })
        const opacity = interpolate(frame, [itemStart, itemStart + 10], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        })
        return (
          <div key={i} style={{
            opacity, transform: `scale(${scale})`,
            textAlign: 'center', padding: 32,
            borderRadius: 16, background: 'rgba(48,209,88,0.06)',
            border: '1px solid rgba(48,209,88,0.2)',
          }}>
            <div style={{ fontSize: 40 }}>{m.icon}</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: '#30D158' }}>{m.value}</div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{m.label}</div>
          </div>
        )
      })}
    </div>
  )
}
```

## Act 6: Pricing Reveal

```tsx
function PricingScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Цена влетает с impact
  const priceScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 6, stiffness: 250, mass: 0.4 },
  })

  // Гарантия появляется после цены
  const guaranteeOpacity = interpolate(frame, [50, 60], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%', background: '#0a0a0f',
    }}>
      <div style={{ transform: `scale(${priceScale})`, textAlign: 'center' }}>
        <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>от</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: '#30D158' }}>9 900 ₽</div>
        <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)' }}>/ месяц</div>
      </div>

      {/* Гарантия */}
      <div style={{
        opacity: guaranteeOpacity, marginTop: 40,
        padding: '12px 32px', borderRadius: 12,
        background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.3)',
        color: '#30D158', fontSize: 20, fontWeight: 600,
      }}>
        🛡️ Полный возврат в течение 7 дней
      </div>
    </div>
  )
}
```

## Act 7: CTA

```tsx
function CTAScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 180 } })
  const buttonPulse = interpolate(frame % 30, [0, 15, 30], [1, 1.05, 1])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%', background: '#0a0a0f',
    }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <h1 style={{ fontSize: 64, fontWeight: 900, color: '#fff', marginBottom: 32 }}>
          Начните сегодня
        </h1>
        <div style={{
          transform: `scale(${buttonPulse})`,
          padding: '20px 60px', borderRadius: 16,
          background: 'linear-gradient(135deg, #30D158, #28a745)',
          color: '#fff', fontSize: 24, fontWeight: 700,
          boxShadow: '0 8px 40px rgba(48,209,88,0.4)',
        }}>
          lootarena.ru →
        </div>
      </div>
    </div>
  )
}
```

## Чеклист промо-ролика

- [ ] Hook захватывает внимание за 2-3 секунды?
- [ ] Problem вызывает узнавание у целевой аудитории?
- [ ] Переход Problem → Solution через flash/energy transition?
- [ ] Features показаны через реальный UI (не абстракции)?
- [ ] Metrics конкретные и впечатляющие (не «много клиентов»)?
- [ ] Pricing reveal драматичный, с spring bounce?
- [ ] CTA содержит один чёткий URL/действие?
- [ ] Фоновая музыка синхронизирована с ключевыми beat?
