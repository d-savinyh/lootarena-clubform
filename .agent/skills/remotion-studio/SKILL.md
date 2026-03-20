---
name: remotion-studio
description: Разработка видео-композиций в Remotion Studio. Используй когда пользователь просит создать видео, анимацию, композицию, рендер, motion graphics. Триггеры: "создай видео", "remotion", "анимация", "композиция", "рендер видео", "motion graphics", "видео-контент". НЕ использовать для обычного фронтенда или UI компонентов.
metadata:
  author: LootArena ERP
  version: 1.0.0
  category: document-asset-creation
---

# Remotion Studio — Создание видео в React

Skill для разработки видео-композиций в отдельном Remotion-проекте.

## Когда использовать

- Создание новых видео-композиций (промо, контент, аналитика)
- Рендер готовых видео через CLI
- Настройка параметризации видео (Zod-схемы, динамические props)
- Работа с анимациями, переходами, шрифтами, аудио
- Интеграция данных из API в видео-композиции

## ⚠️ Критические правила

1. **Remotion-проект отдельный от ERP**: Код видео лежит в `~/Documents/Antigravity/remotion-studio/`, НЕ в erp-lootarena
2. **Глобальный скилл**: Для best practices по анимациям, видео, аудио — загрузи `remotion-best-practices` skill из `~/.agents/skills/remotion-best-practices/SKILL.md` и нужные файлы из `rules/`
3. **Версия Remotion**: 4.0.428 (React 19). Всегда проверяй совместимость API
4. **TailwindCSS v4**: Уже настроен в проекте через `@remotion/tailwind-v4`
5. **Формат вывода**: По умолчанию JPEG (настроено в `remotion.config.ts`)

## Структура проекта

```
~/Documents/Antigravity/remotion-studio/
├── src/
│   ├── index.ts          # Entry point (registerRoot)
│   ├── Root.tsx           # RemotionRoot — регистрация всех Composition
│   ├── Composition.tsx    # Шаблонная композиция
│   └── index.css          # Глобальные стили (TailwindCSS)
├── public/                # Статические ассеты (изображения, шрифты, аудио)
├── remotion.config.ts     # Конфигурация Remotion
├── package.json           # Зависимости (remotion 4.0.428)
└── tsconfig.json
```

## Workflow: Создание новой композиции

### Шаг 1: Подготовка

1. Перейти в проект: `cd ~/Documents/Antigravity/remotion-studio`
2. Если нужны best practices — загрузить нужный rule-файл из `~/.agents/skills/remotion-best-practices/rules/`:
   - `animations.md` — анимации, interpolate, spring
   - `timing.md` — easing, кривые
   - `transitions.md` — переходы между сценами
   - `text-animations.md` — текстовые эффекты
   - `fonts.md` — шрифты
   - `audio.md` — звук
   - `videos.md` — встраивание видео
   - `charts.md` — графики и визуализация данных
   - `parameters.md` — параметризация через Zod
   - `compositions.md` — регистрация композиций

### Шаг 2: Создание файла композиции

Создай файл `src/{CompositionName}.tsx`:

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <div style={{ opacity }}>
        {/* Контент */}
      </div>
    </AbsoluteFill>
  );
};
```

### Шаг 3: Регистрация в Root.tsx

Добавь `<Composition>` в `src/Root.tsx`:

```tsx
import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={150}  // 5 секунд при 30fps
        fps={30}
        width={1080}           // Instagram: 1080x1920
        height={1920}          // YouTube: 1920x1080
      />
    </>
  );
};
```

### Шаг 4: Превью

```bash
cd ~/Documents/Antigravity/remotion-studio && npm run dev
```

Remotion Studio откроется — можно проверить анимации в реальном времени.

### Шаг 5: Рендер

```bash
cd ~/Documents/Antigravity/remotion-studio && npx remotion render {CompositionId} out/{filename}.mp4
```

## Стандартные разрешения

| Формат | Ширина | Высота | Использование |
|--------|--------|--------|---------------|
| Instagram Story/Reels | 1080 | 1920 | Вертикальные видео |
| YouTube | 1920 | 1080 | Горизонтальные видео |
| Квадрат | 1080 | 1080 | Посты в соцсетях |
| Telegram | 1280 | 720 | Превью, посты в каналы |

## Параметризация видео (Zod)

Для динамических видео (разные данные — одна композиция) используй Zod-схемы. Подробности — в `~/.agents/skills/remotion-best-practices/rules/parameters.md`.

## Troubleshooting

### Видео не рендерится

1. Убедись что `CompositionId` совпадает с `id` в `<Composition>`
2. Проверь нет ли ошибок в консоли Remotion Studio
3. Попробуй рендер с `--log=verbose`

### Ошибки с шрифтами

Используй `@remotion/google-fonts` или локальные шрифты через `staticFile()`. See `~/.agents/skills/remotion-best-practices/rules/fonts.md`.

### Медленный рендер

1. Уменьши разрешение для тестов
2. Используй `--concurrency=4` для параллельного рендера
3. Оптимизируй сложные анимации

## ⚠️ Аудио: предотвращение наложений и обрезки

**КРИТИЧЕСКОЕ ПРАВИЛО №1**: Длительность сцены ОБЯЗАНА быть >= длительности аудиофайла + 6 кадров буфера.

**КРИТИЧЕСКОЕ ПРАВИЛО №2**: Каждый `<Sequence>` с аудио **ОБЯЗАН** иметь `durationInFrames` = длительность сцены.

### Алгоритм

1. **Измерь реальную длительность каждого аудиофайла** (в кадрах = секунды × FPS)
2. **Установи длительность сцены** = длительность аудио + 6-8 кадров буфера
3. **Вычисли `from`** каждого аудио: `scene_start - transition_overlap`
4. **Установи `durationInFrames`** на Sequence = длительность сцены

```tsx
// Шаг 1: Измерить аудио (python3 или ffprobe)
// hook.mp3 ≈ 3.82s = 114f → сцена 120f
// problem.mp3 ≈ 6.38s = 191f → сцена 198f

// Шаг 2: Установить сцены
const SCENE = {
    hook: 120,     // 114f аудио + 6f буфер
    problem: 198,  // 191f аудио + 7f буфер
};

// Шаг 3-4: Таймлайн
const AUDIO_TIMELINE = {
    hook:    { from: 0, dur: SCENE.hook },
    problem: { from: SCENE.hook - TRANSITION, dur: SCENE.problem },
};

<Sequence from={AUDIO_TIMELINE.hook.from} durationInFrames={AUDIO_TIMELINE.hook.dur}>
    <Audio src={staticFile("voiceover/hook.mp3")} />
</Sequence>
```

**НЕ ДЕЛАЙ так:**
```tsx
// ❌ Фиксированные тайминги без замера аудио — ОБРЕЖЕТ на полуслове!
const SCENE = { hook: 90, problem: 90 }; // НЕПРАВИЛЬНО если аудио длиннее

// ❌ БЕЗ durationInFrames — аудио наложится на следующую сцену!
<Sequence from={0}>
    <Audio src={staticFile("voiceover/scene1.mp3")} />
</Sequence>
```

### Как измерить длительность аудио

```bash
# Приблизительно через размер файла (128kbps MP3: 1 сек ≈ 16000 байт)
python3 -c "
import os
for f in sorted(os.listdir('public/voiceover/promo')):
    if f.endswith('.mp3'):
        dur = round(os.path.getsize(f'public/voiceover/promo/{f}') / 16000, 2)
        print(f'{f}: ~{dur}s = {int(dur * 30)} frames')
"
```

## Визуальные правила контента

### Генерированные изображения
- **НЕ затемнять** изображения полным оверлеем (opacity 0.35-0.5 = плохо)
- Использовать **лёгкий градиент только снизу**: `linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.6) 80%)`
- Opacity изображений: **0.8-0.9** (яркие, видимые)
- **Формат 9:16** для вертикальных видео (Stories/Reels). Если картинка квадратная → `objectFit: "cover"` на `width: 100%, height: 100%`, чтобы заполнить экран без полей.

### Текст поверх изображений  
- Текст ставить на **плашку** (backdrop-blur card), а не на затемнённый фон
- Плашка: `background: rgba(0,0,0,0.65)`, `backdropFilter: blur(16px)`, `borderRadius: 24`

### Брендирование (логотип)
- Использовать **настоящий SVG-логотип** из `public/images/lootarena-logo.svg`, а не генерировать
- **LogoBadge** на каждой сцене: `width: 240px`, `top: 50, left: 40`, `zIndex: 20`
- На CTA-сцене: крупный логотип `width: 560px` по центру
- **НЕ генерировать** лого через SVG-path вручную

## Performance Notes

- Загружай правила из `remotion-best-practices` только те, что нужны для конкретной задачи
- Не загружай все 39 rule-файлов одновременно
- Для сложных композиций используй `<Sequence>` для разбиения на части

## ⚠️ ElevenLabs TTS: модель и голос

**КРИТИЧЕСКОЕ ПРАВИЛО**: Всегда используй модель **`eleven_v3`** (Eleven v3) — это **самая новая** и качественная модель.

```tsx
// ✅ ПРАВИЛЬНО — явно указываем model_id
mcp_elevenlabs_text_to_speech({
    text: "Текст озвучки",
    model_id: "eleven_v3",   // ← ОБЯЗАТЕЛЬНО!
    voice_id: "Xb7hH8MSUJpSbSDYk0k2",
    language: "ru",
})

// ❌ НЕПРАВИЛЬНО — без model_id используется старая multilingual_v2
mcp_elevenlabs_text_to_speech({
    text: "Текст озвучки",
    voice_id: "...",
})
```

### Периодическая проверка моделей

При каждом новом проекте с озвучкой — вызови `mcp_elevenlabs_list_models()` и проверь, нет ли модели новее `eleven_v3`. Если есть — используй её.

## ⚠️ Генерация аудиофайлов: КРИТИЧЕСКИЕ ПРАВИЛА

### ПРАВИЛО №1: Генерируй каждый файл ОТДЕЛЬНО с нужным именем

**НИКОГДА** не генерируй все файлы пакетом, а потом переименовывай через `sorted()` или другую batch-операцию. `sorted()` сортирует **алфавитно по содержимому текста**, а не по порядку сцен — порядок БУДЕТ перепутан.

```bash
# ❌ НЕПРАВИЛЬНО — batch-генерация + sorted rename
for text in texts:
    tts(text, output_dir="/tmp/batch/")
# потом sorted(os.listdir(...)) → rename → СЛОМАН ПОРЯДОК!

# ✅ ПРАВИЛЬНО — каждый файл отдельно с правильным именем
tts(text="Покажу, как создать миссию...", output_directory="/tmp/vo_gen")
mv /tmp/vo_gen/tts_*.mp3 → mission-tutorial/hook.mp3

tts(text="Шаг первый — выбираем...", output_directory="/tmp/vo_gen")
mv /tmp/vo_gen/tts_*.mp3 → mission-tutorial/step1.mp3
# ... и так далее для каждого
```

### ПРАВИЛО №2: Сначала ресурсы, потом код

**НЕ ссылайся** на файлы, которых ещё нет. Если в коде стоит `staticFile("voiceover/bg-lofi.mp3")`, то файл `bg-lofi.mp3` **ОБЯЗАН** существовать **ДО** того, как код будет запущен.

**Алгоритм:**
1. Сгенерируй/создай все аудиофайлы и ресурсы
2. Проверь что все файлы на месте: `ls -la public/voiceover/dir/*.mp3`
3. Только потом пиши/обновляй компоненты, ссылающиеся на эти файлы

### ПРАВИЛО №3: SCENE-объект ОБЯЗАН совпадать с комментариями

При обновлении таймингов **ВСЕГДА обновляй и комментарии, и SCENE-объект одновременно**. Никогда не обновляй одно без другого.

```tsx
// ❌ НЕПРАВИЛЬНО — комментарий обновлён, SCENE — нет
// hook.mp3: ~112f → сцена 120f   ← обновлено
const SCENE = { hook: 188 };       // ← ЗАБЫЛИ обновить = РАССИНХРОН!

// ✅ ПРАВИЛЬНО — обоё обновлено в одном атомарном изменении
// hook.mp3: ~112f → сцена 120f
const SCENE = { hook: 120 };       // ← совпадает с комментарием
```

### ПРАВИЛО №4: Фоновая музыка

Каждое обучающее/промо видео **ОБЯЗАНО** иметь фоновую музыку:
1. Сгенерируй через `mcp_elevenlabs_compose_music()` с параметром `music_length_ms >= durationInFrames / 30 * 1000`
2. Сохрани в `public/voiceover/bg-lofi.mp3` (или аналогичное имя)
3. Подключи: `<Audio src={staticFile("voiceover/bg-lofi.mp3")} volume={0.08} />`
4. `volume={0.08}` — фоновая музыка тихая, не перебивает голос

## ⚠️ Обучающие видео: ТОЛЬКО реальный UI ERP

**КРИТИЧЕСКОЕ ПРАВИЛО**: Обучающие (tutorial) видео **НИКОГДА** не должны содержать выдуманных mockup-ов. Каждый элемент интерфейса должен точно соответствовать реальному компоненту ERP.

### Обязательный алгоритм

1. **Перед созданием** — изучи реальные компоненты в `~/Documents/Antigravity/erp-lootarena/components/`
2. **Поля, названия, классы** — копируй из реального кода (TextInput labels, Button texts, Section titles)
3. **Цвета** — используй реальную палитру ERP: `appGreen`, `appPurple`, `appRed`, `appBlue`, `bg-black/20`, `border-white/5`
4. **Шаги и логика** — повторяй реальный flow приложения (например, MissionCreator: Цель → Механика → Награда → Оформление → Запуск)
5. **Данные** — используй реалистичные значения из ERP (ZoneLoad, ActivePlayer, PulseMetrics)

### Ключевые компоненты ERP для обучающих видео

| Тема | Компоненты |
|------|-----------|
| Миссии | `components/missions/MissionCreator/` (StepGoal, StepMechanics, StepReward, StepDesign, StepLaunch) |
| Дашборд | `components/analytics/DashboardPulse.tsx` (ZoneLoad, ActivePlayer, PulseMetrics) |
| Финансы | `components/analytics/AnalyticsFinance.tsx` |
| Настройки | `components/erp/ERPArenaSettings.tsx`, `ERPZonesHardware.tsx` |
| CRM | `components/erp/DashboardHome.tsx` |
| Лояльность | `components/erp/ERPLoyalty.tsx` |

```tsx
// ❌ НЕПРАВИЛЬНО — выдуманные поля
const fields = [
    { label: "Название миссии", value: "Марафон 5 часов" },  // не существует в ERP
    { label: "Период", value: "7 дней" },  // нет такого поля
];

// ✅ ПРАВИЛЬНО — реальные шаги ERP
// StepGoal: MissionGoalSelect → MissionTemplateSlider
// StepMechanics: Тип действия (Чекин/Покупка/Задание), Расписание, Срок действия
// StepReward: Тип награды (Кастом/Товар/Бонусы), Лимиты
// StepLaunch: Прогноз эффективности + Push
```

