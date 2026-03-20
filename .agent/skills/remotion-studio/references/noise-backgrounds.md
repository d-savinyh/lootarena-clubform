# Noise-фоны в Remotion

Генеративные organic-фоны через `@remotion/noise` — Perlin и Simplex noise.

## Импорт

```tsx
import { noise2D, noise3D, noise4D } from "@remotion/noise";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
```

## Анимированный noise-фон

```tsx
export const NoiseBackground: React.FC<{
  speed?: number;
  scale?: number;
  color1?: string;
  color2?: string;
}> = ({
  speed = 0.02,
  scale = 0.005,
  color1 = "#0a0a1a",
  color2 = "#00ff88",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Canvas-based noise rendering
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(width, height);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // noise3D: x, y — координаты, frame*speed — время
        const value = noise3D("my-seed", x * scale, y * scale, frame * speed);
        const normalized = (value + 1) / 2; // -1..1 → 0..1

        const idx = (y * width + x) * 4;
        // Интерполяция между двумя цветами
        imageData.data[idx] = Math.round(normalized * 255);     // R
        imageData.data[idx + 1] = Math.round(normalized * 100); // G
        imageData.data[idx + 2] = Math.round(normalized * 50);  // B
        imageData.data[idx + 3] = 255; // Alpha
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [frame, width, height, speed, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    />
  );
};
```

## Noise-волны (SVG)

```tsx
export const NoiseWaves: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Генерируем SVG path через noise
  const points = Array.from({ length: 100 }, (_, i) => {
    const x = (i / 99) * width;
    const y = height / 2 + noise2D("wave", i * 0.05, frame * 0.02) * 100;
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ position: "absolute" }}>
      <path
        d={`${points} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#waveGradient)"
        opacity={0.3}
      />
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00ff88" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
};
```

## Noise как overlay-текстура (лёгкий)

```tsx
// Лёгкий CSS-based noise — для зернистости плёнки
export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        background: `url("data:image/svg+xml,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
            <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' seed='${frame}'/></filter>
            <rect width='200' height='200' filter='url(%23n)' opacity='1'/></svg>`
        )}")`,
        mixBlendMode: "overlay",
      }}
    />
  );
};
```

## Типы noise

| Функция | Размерность | Использование |
|---------|-------------|---------------|
| `noise2D(seed, x, y)` | 2D | Статические текстуры, ландшафты |
| `noise3D(seed, x, y, z)` | 3D | Анимированные фоны (z = время) |
| `noise4D(seed, x, y, z, w)` | 4D | Сложные морфинг-анимации |

## Советы

- **seed** — строка, одинаковый seed = одинаковый результат (детерминизм!)
- **scale** — 0.001-0.01 для плавных облаков, 0.05-0.1 для мелкой текстуры
- **speed** — 0.01-0.05 для медленной органики, 0.1+ для энергичного движения
- **Canvas для тяжёлых** фонов может быть медленным — используй пониженное разрешение + CSS scale
