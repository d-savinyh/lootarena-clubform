# Shapes и Paths в Remotion

SVG-морфинг, геометрические фигуры и анимация обводок через `@remotion/shapes` + `@remotion/paths`.

## @remotion/shapes — геометрические фигуры

```tsx
import { Triangle, Star, Pie, Circle, Rect, Ellipse } from "@remotion/shapes";
```

### Примеры фигур

```tsx
// Звезда
<Star
  points={5}
  innerRadius={30}
  outerRadius={60}
  fill="#00ff88"
  stroke="#ffffff"
  strokeWidth={2}
/>

// Треугольник
<Triangle
  length={100}
  direction="up" // up, down, left, right
  fill="rgba(0, 255, 136, 0.2)"
  stroke="#00ff88"
  strokeWidth={1}
  cornerRadius={5}
/>

// Круговая диаграмма
<Pie
  radius={80}
  progress={0.75} // 0-1
  fill="#00ff88"
  stroke="none"
  closePath={true}
  counterClockwise={false}
/>

// Прямоугольник со скруглениями
<Rect
  width={200}
  height={100}
  cornerRadius={16}
  fill="rgba(255,255,255,0.1)"
  stroke="#00ff88"
/>
```

## @remotion/paths — SVG path анимации

```tsx
import {
  getLength,
  getPointAtLength,
  getSubpaths,
  getTangentAtLength,
  parsePath,
  interpolatePath, // морфинг между путями!
  evolvePath,
  scalePath,
  translatePath,
  reversePath,
} from "@remotion/paths";
```

### Анимация обводки (stroke-dasharray)

```tsx
export const AnimatedPath: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const path = "M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80";

  const progress = spring({ frame, fps, config: { damping: 20 } });
  const length = getLength(path);

  return (
    <svg width={200} height={200}>
      <path
        d={path}
        fill="none"
        stroke="#00ff88"
        strokeWidth={3}
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
        strokeLinecap="round"
      />
    </svg>
  );
};
```

### evolvePath — плавное рисование

```tsx
import { evolvePath } from "@remotion/paths";

const path = "M 0 50 Q 100 0 200 50 T 400 50";
const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });

const { strokeDasharray, strokeDashoffset } = evolvePath(progress, path);

<path
  d={path}
  fill="none"
  stroke="#00ff88"
  strokeWidth={2}
  strokeDasharray={strokeDasharray}
  strokeDashoffset={strokeDashoffset}
/>
```

### Морфинг между фигурами

```tsx
import { interpolatePath } from "@remotion/paths";
import { makeCircle, makeStar, makeRect } from "@remotion/shapes";

const circlePath = makeCircle({ radius: 50 }).path;
const starPath = makeStar({ points: 5, innerRadius: 20, outerRadius: 50 }).path;

const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
const morphedPath = interpolatePath(progress, circlePath, starPath);

<svg>
  <path d={morphedPath} fill="#00ff88" />
</svg>
```

### Получение точки на пути (для частиц, маркеров)

```tsx
import { getLength, getPointAtLength } from "@remotion/paths";

const path = "M 0 100 Q 200 0 400 100";
const length = getLength(path);
const progress = interpolate(frame, [0, 90], [0, 1], { extrapolateRight: "clamp" });
const point = getPointAtLength(path, progress * length);

// point.x, point.y — координаты анимированной точки
<circle cx={point.x} cy={point.y} r={5} fill="#ff0066" />
```

## Комбинации Shapes + Paths

```tsx
// Анимированная звезда с обводкой
const { path } = makeStar({ points: 5, innerRadius: 30, outerRadius: 60 });
const { strokeDasharray, strokeDashoffset } = evolvePath(progress, path);

<svg>
  <path
    d={path}
    fill="none"
    stroke="#00ff88"
    strokeWidth={2}
    strokeDasharray={strokeDasharray}
    strokeDashoffset={strokeDashoffset}
  />
</svg>
```

## Советы

- `interpolatePath` требует одинаковое количество точек — shapes из `@remotion/shapes` совместимы
- `evolvePath` идеален для «рисования пером» эффекта
- Используй `scalePath` и `translatePath` для позиционирования
- Для сложных SVG — вытащи path из Figma/Illustrator
