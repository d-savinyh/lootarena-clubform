# Визуализация данных в Remotion

Анимированные графики, KPI-карточки и count-up числа для data-driven видео.

## Recharts в Remotion

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useCurrentFrame, interpolate, spring } from "remotion";

export const AnimatedChart: React.FC<{ data: Array<{ name: string; value: number }> }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Постепенное появление данных
  const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
  const visibleCount = Math.ceil(data.length * progress);
  const visibleData = data.slice(0, visibleCount);

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ opacity, width: 800, height: 400 }}>
      <ResponsiveContainer>
        <AreaChart data={visibleData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00ff88"
            strokeWidth={3}
            fill="url(#colorValue)"
            dot={false}
            animationDuration={0} // Управляем анимацией через Remotion
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

## Count-up числа

```tsx
export const CountUp: React.FC<{
  from?: number;
  to: number;
  startFrame?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
}> = ({
  from = 0,
  to,
  startFrame = 0,
  duration = 60,
  prefix = "",
  suffix = "",
  format = (n) => n.toLocaleString("ru-RU"),
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const value = spring({
    frame: frame - startFrame,
    fps,
    from,
    to,
    config: { damping: 30, stiffness: 100, mass: 0.5 },
  });

  return (
    <span>
      {prefix}{format(Math.round(value))}{suffix}
    </span>
  );
};

// Примеры использования:
// <CountUp to={95} suffix="%" />
// <CountUp to={12500} prefix="₽" format={(n) => n.toLocaleString("ru-RU")} />
// <CountUp to={847} suffix=" игроков" startFrame={30} />
```

## KPI-карточка

```tsx
export const KPICard: React.FC<{
  title: string;
  value: number;
  suffix: string;
  trend: number; // % изменения
  delay?: number; // stagger delay в кадрах
  color?: string;
}> = ({ title, value, suffix, trend, delay = 0, color = "#00ff88" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${Math.max(0, scale)})`,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        borderRadius: 20,
        padding: "24px 32px",
        border: "1px solid rgba(255,255,255,0.1)",
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color }}>
        <CountUp to={value} suffix={suffix} startFrame={delay + 10} />
      </div>
      <div
        style={{
          fontSize: 14,
          color: trend > 0 ? "#00ff88" : "#ff4466",
          marginTop: 8,
        }}
      >
        {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
      </div>
    </div>
  );
};
```

## Stagger-анимация группы KPI

```tsx
export const KPIDashboard: React.FC = () => {
  const metrics = [
    { title: "Выручка", value: 547000, suffix: " ₽", trend: 12, color: "#00ff88" },
    { title: "Игроков", value: 1247, suffix: "", trend: 8, color: "#6366f1" },
    { title: "Загрузка", value: 87, suffix: "%", trend: 5, color: "#f59e0b" },
    { title: "NPS", value: 72, suffix: "", trend: -3, color: "#ef4444" },
  ];

  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
      {metrics.map((m, i) => (
        <KPICard
          key={m.title}
          {...m}
          delay={i * 8} // 8 кадров между карточками = stagger
        />
      ))}
    </div>
  );
};
```

## Прогресс-бар

```tsx
export const AnimatedProgressBar: React.FC<{
  value: number; // 0-100
  label: string;
  delay?: number;
  color?: string;
}> = ({ value, label, delay = 0, color = "#00ff88" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const width = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: value,
    config: { damping: 25, stiffness: 100 },
  });

  return (
    <div style={{ width: 400, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{label}</span>
        <span style={{ color, fontSize: 14, fontWeight: 700 }}>{Math.round(Math.max(0, width))}%</span>
      </div>
      <div style={{ height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4 }}>
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, width))}%`,
            backgroundColor: color,
            borderRadius: 4,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
      </div>
    </div>
  );
};
```
