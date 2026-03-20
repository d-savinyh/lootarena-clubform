# Кинематографические эффекты в Remotion

Продвинутые визуальные эффекты для промо-видео: glitch, scanlines, RGB split, vignette, частицы, lens flare.

## Glitch-эффект

```tsx
export const GlitchText: React.FC<{
  text: string;
  fontSize?: number;
  intensity?: number;
}> = ({ text, fontSize = 72, intensity = 1 }) => {
  const frame = useCurrentFrame();

  // Случайное смещение для «дрожания»
  const glitchX = (Math.random() - 0.5) * 4 * intensity;
  const glitchActive = frame % 15 < 3; // Glitch каждые 15 кадров на 3 кадра

  return (
    <div style={{ position: "relative" }}>
      {/* RGB Split — красный слой */}
      {glitchActive && (
        <div
          style={{
            position: "absolute",
            fontSize,
            fontWeight: 900,
            color: "transparent",
            textShadow: `${-3 * intensity}px 0 #ff0044`,
            WebkitTextStroke: "0",
            opacity: 0.7,
            transform: `translateX(${glitchX}px)`,
          }}
        >
          {text}
        </div>
      )}

      {/* RGB Split — синий слой */}
      {glitchActive && (
        <div
          style={{
            position: "absolute",
            fontSize,
            fontWeight: 900,
            color: "transparent",
            textShadow: `${3 * intensity}px 0 #0088ff`,
            opacity: 0.7,
            transform: `translateX(${-glitchX}px)`,
          }}
        >
          {text}
        </div>
      )}

      {/* Основной текст */}
      <div style={{ fontSize, fontWeight: 900, color: "#fff", position: "relative" }}>
        {text}
      </div>
    </div>
  );
};
```

## Scanlines (полосы CRT-монитора)

```tsx
export const Scanlines: React.FC<{ opacity?: number; speed?: number }> = ({
  opacity = 0.08,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const offset = (frame * speed * 2) % 4;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.3) 2px,
          rgba(0, 0, 0, 0.3) 4px
        )`,
        backgroundPosition: `0 ${offset}px`,
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
};
```

## Vignette (затемнение по краям)

```tsx
export const Vignette: React.FC<{ intensity?: number; color?: string }> = ({
  intensity = 0.6,
  color = "0, 0, 0",
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(
        ellipse at center,
        transparent 40%,
        rgba(${color}, ${intensity * 0.3}) 70%,
        rgba(${color}, ${intensity}) 100%
      )`,
      pointerEvents: "none",
      zIndex: 90,
    }}
  />
);
```

## Flash-переход (белая вспышка)

```tsx
export const FlashTransition: React.FC<{
  triggerFrame: number;
  duration?: number;
  color?: string;
}> = ({ triggerFrame, duration = 8, color = "255, 255, 255" }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [triggerFrame, triggerFrame + 2, triggerFrame + duration],
    [0, 0.8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: `rgba(${color}, ${opacity})`,
        pointerEvents: "none",
        zIndex: 200,
      }}
    />
  );
};
```

## Particle System (простые частицы)

```tsx
export const Particles: React.FC<{
  count?: number;
  color?: string;
  speed?: number;
}> = ({ count = 50, color = "#00ff88", speed = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Создаём частицы один раз (детерминистично через seed)
  const particles = React.useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.sin(i * 137.508) * 0.5 + 0.5) * width,  // golden angle distribution
      y: (Math.cos(i * 137.508 * 2) * 0.5 + 0.5) * height,
      size: 1 + (i % 4),
      speedX: (Math.sin(i * 42) - 0.5) * 0.5 * speed,
      speedY: -0.3 - Math.random() * 0.7 * speed,
      opacity: 0.2 + (i % 5) * 0.15,
    })),
    [count, width, height, speed]
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const x = (p.x + p.speedX * frame) % width;
        const y = ((p.y + p.speedY * frame) % height + height) % height;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
};
```

## Lens Flare (блик)

```tsx
export const LensFlare: React.FC<{
  x: number;
  y: number;
  size?: number;
  color?: string;
  opacity?: number;
}> = ({ x, y, size = 200, color = "#00ff88", opacity = 0.4 }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16)} 0%, transparent 70%)`,
      filter: "blur(20px)",
      pointerEvents: "none",
      zIndex: 80,
    }}
  />
);
```

## Quick Cuts (быстрая нарезка)

```tsx
// Для энергичных сцен: 2-4 кадра на вырезку
export const QuickCuts: React.FC<{
  images: string[];
  framesPerCut?: number;
  startFrame?: number;
}> = ({ images, framesPerCut = 3, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const relFrame = frame - startFrame;
  if (relFrame < 0) return null;

  const imageIndex = Math.floor(relFrame / framesPerCut) % images.length;

  return (
    <img
      src={staticFile(images[imageIndex])}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};
```

## Комбинирование эффектов (Layer Stack)

```tsx
// Типичный стек для кинематографического эффекта:
<AbsoluteFill>
  {/* 1. Фон */}
  <NoiseBackground speed={0.01} />

  {/* 2. Контент */}
  <MainContent />

  {/* 3. Частицы */}
  <Particles count={30} color="#00ff88" />

  {/* 4. Scanlines */}
  <Scanlines opacity={0.05} />

  {/* 5. Vignette */}
  <Vignette intensity={0.5} />

  {/* 6. Film Grain */}
  <FilmGrain opacity={0.03} />

  {/* 7. Flash на переходах */}
  <FlashTransition triggerFrame={120} />
</AbsoluteFill>
```

## Spring-конфигурации для разных настроений

| Настроение | damping | stiffness | mass | Примечание |
|------------|---------|-----------|------|------------|
| Энергичный | 6-10 | 180-250 | 0.4-0.6 | Snappy bounce, high-energy |
| Плавный | 20-30 | 80-120 | 0.8-1.0 | Elegant, smooth reveal |
| Drama | 15 | 150 | 0.3 | Quick start, smooth stop |
| Bounce | 8 | 300 | 0.5 | Выраженный отскок |
| Subtle | 25 | 60 | 1.2 | Почти линейное, нежное |
