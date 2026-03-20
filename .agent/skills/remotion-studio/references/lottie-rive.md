# Lottie-анимации в Remotion

Использование `@remotion/lottie` и `@lottiefiles/dotlottie-react` для анимированных иконок и эффектов.

## @remotion/lottie — основной способ

```tsx
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { useEffect, useState } from "react";

export const LottieExample: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch(staticFile("lottie/confetti.json"))
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  if (!animationData) return null;

  return (
    <Lottie
      animationData={animationData}
      style={{ width: 400, height: 400 }}
      // Синхронизация с frame Remotion
      playbackRate={1}
      // Управление прогрессом анимации (0-1)
      // Используй для точной синхронизации:
      // direction="forward"
    />
  );
};
```

## Синхронизация Lottie с Remotion frame

```tsx
// Проигрывание Lottie строго по frame Remotion (полный контроль)
const progress = frame / durationInFrames; // 0 → 1

<Lottie
  animationData={animationData}
  // loop={false} — не зацикливать
  // Lottie синхронизируется автоматически с frame Remotion
/>
```

## Популярные Lottie-анимации для видео

Скачивай JSON с [lottiefiles.com](https://lottiefiles.com):

| Эффект | Поисковый запрос | Использование |
|--------|-----------------|---------------|
| Конфетти | `confetti celebration` | Успешное действие, CTA |
| Ракета | `rocket launch` | Growth, скорость |
| Чекмарк | `checkmark success` | Завершение шага |
| Деньги | `money coins cash` | Финансовые метрики |
| Звёзды | `stars sparkle` | Premium-контент |
| Загрузка | `loading spinner` | Ожидание |
| Огонь | `fire flame` | Hot deals, тренды |
| Трофей | `trophy award` | Достижения, миссии |
| Уведомление | `notification bell` | Push, алерты |
| График | `chart analytics` | Data-driven сцены |

## Советы

- **Формат JSON** — скачивай именно JSON, не dotLottie (.lottie) для `@remotion/lottie`
- **Размер файла** — держи < 500KB для быстрого рендера
- **Разрешение** — Lottie vector-based, масштабируется без потерь
- **Цвета** — редактируй в JSON напрямую: ищи `"c"` → `{"k": [r, g, b, 1]}` (значения 0-1)
- **Складывай в** `public/lottie/` с понятными именами: `confetti.json`, `rocket.json`
