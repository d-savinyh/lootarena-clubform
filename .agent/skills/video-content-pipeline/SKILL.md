---
name: video-content-pipeline
description: Полный пайплайн создания видеоконтента с AI-озвучкой. Используй когда нужно создать промо-видео, обновление, обучающий ролик. Связывает сценарий → ElevenLabs (озвучка/SFX) → Remotion (визуал/рендер). Триггеры: "создай видео с озвучкой", "промо-ролик", "видео для Reels", "контент с voiceover".
metadata:
  author: LootArena ERP
  version: 1.0.0
  category: content-creation
---

# Video Content Pipeline — ElevenLabs + Remotion

Единый скилл для создания видеоконтента с AI-озвучкой и звуковыми эффектами.

## Когда использовать

- Создание промо-видео, обновлений, обучающих роликов
- Любой видеоконтент, где нужна **озвучка** (voiceover) или **звуковые эффекты**
- Контент для Reels/Stories (вертикальный) или YouTube (горизонтальный)

## ⚠️ Критические правила

1. **Сценарий обязателен** — никогда не начинай генерацию без `scenario.json`
2. **Remotion-проект отдельный** — код видео в `~/Documents/Antigravity/remotion-studio/`
3. **Best practices** — для анимаций загрузи нужные rules из `~/.agents/skills/remotion-best-practices/rules/`
4. **ElevenLabs MCP** — используй инструменты `text_to_speech`, `text_to_sound_effects`, `compose_music`
5. **Аудио сначала** — всегда генерируй аудио ДО создания визуала (длительность сцен зависит от аудио)

## Пайплайн

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────┐
│ 1. Сценарий │ ──▶ │ 2. Аудио     │ ──▶ │ 3. Визуал   │ ──▶ │ 4. Рендер │
│ scenario.json│     │ ElevenLabs   │     │ Remotion     │     │ MP4    │
└─────────────┘     └──────────────┘     └─────────────┘     └────────┘
```

---

## Шаг 1: Сценарий (`scenario.json`)

Создай файл `remotion-studio/public/scenarios/{id}.json`:

```json
{
  "meta": {
    "title": "Название видео",
    "format": "reels",
    "resolution": [1080, 1920],
    "fps": 30,
    "voice": {
      "name": "Eric",
      "id": "cjVigY5qzO86Huf0OWal",
      "model": "eleven_multilingual_v2",
      "language": "ru",
      "stability": 0.5,
      "similarity_boost": 0.75,
      "style": 0.3
    },
    "music": {
      "enabled": false,
      "prompt": "ambient electronic, minimal, dark",
      "volume": 0.15
    }
  },
  "scenes": [
    {
      "id": "scene-id",
      "narration": "Текст озвучки для этой сцены.",
      "sfx": [
        {
          "prompt": "futuristic whoosh transition",
          "at_sec": 0,
          "duration_sec": 1.5,
          "volume": 0.6
        }
      ],
      "visuals": {
        "type": "intro | feature | showcase | outro",
        "title": "Заголовок на экране",
        "subtitle": "Подзаголовок",
        "elements": ["logo", "cards", "chart", "mockup"],
        "transition_in": "fade | slide-left | slide-right | none",
        "transition_out": "fade | slide-left | slide-right | none",
        "notes": "Дополнительные указания для визуала"
      }
    }
  ]
}
```

### Поля сценария

| Поле | Обязательно | Описание |
|------|-------------|----------|
| `meta.title` | ✅ | Название (используется в Composition id) |
| `meta.format` | ✅ | `reels` (1080×1920), `youtube` (1920×1080), `square` (1080×1080) |
| `meta.voice` | ✅ | Настройки голоса ElevenLabs |
| `scenes[].id` | ✅ | Уникальный ID сцены (для именования аудио-файлов) |
| `scenes[].narration` | ✅ | Текст озвучки |
| `scenes[].sfx` | ❌ | Массив звуковых эффектов |
| `scenes[].visuals` | ✅ | Описание визуала для Remotion-композиции |

### Рекомендации по озвучке

- Пиши **коротко** — 10-15 слов на сцену (4-6 секунд звучания)
- Используй `<break time="0.5s" />` для пауз в тексте (ElevenLabs SSML)
- Не пиши в тексте символы вроде %, №, $ — пиши словами
- Для акцента используй CAPS: «Loot Arena — управляй клубом ПО-НОВОМУ»

---

## Шаг 2: Генерация аудио

### 2.1 Озвучка (voiceover)

Для каждой сцены вызови ElevenLabs MCP `text_to_speech`:

```
text: "{scene.narration}"
voice_id: "{meta.voice.id}"         # или voice_name
model_id: "{meta.voice.model}"
language: "{meta.voice.language}"
stability: {meta.voice.stability}
similarity_boost: {meta.voice.similarity_boost}
style: {meta.voice.style}
output_directory: "~/Documents/Antigravity/remotion-studio/public/voiceover/{scenario_id}/"
```

⚠️ **Именование файлов**: `{scene.id}.mp3` (например `intro.mp3`, `features.mp3`)

### 2.2 Звуковые эффекты (SFX)

Для каждого `sfx` в сценарии вызови `text_to_sound_effects`:

```
text: "{sfx.prompt}"
duration_seconds: {sfx.duration_sec}
output_directory: "~/Documents/Antigravity/remotion-studio/public/sfx/{scenario_id}/"
```

### 2.3 Фоновая музыка (опционально)

Если `meta.music.enabled`, вызови `compose_music`:

```
prompt: "{meta.music.prompt}"
output_directory: "~/Documents/Antigravity/remotion-studio/public/music/"
```

---

## Шаг 3: Визуал (Remotion)

### Структура файлов

```
remotion-studio/
├── src/
│   └── {CompositionName}.tsx    # Новая композиция
├── public/
│   ├── voiceover/{id}/          # Файлы озвучки
│   │   ├── intro.mp3
│   │   └── features.mp3
│   ├── sfx/{id}/                # Звуковые эффекты
│   │   └── whoosh.mp3
│   └── scenarios/{id}.json      # Сценарий
```

### Шаблон композиции

```tsx
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

// Длительности сцен (подстраиваются под аудио)
const SCENE_DURATIONS = {
  intro: 5 * 30,      // 150 frames (подставь реальную длительность аудио)
  features: 6 * 30,
  tools: 5 * 30,
  outro: 4 * 30,
};
const TRANSITION_FRAMES = 15;

export const MyVideo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.intro}>
        <IntroScene />
        <Audio src={staticFile("voiceover/my-id/intro.mp3")} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      {/* ...остальные сцены */}
    </TransitionSeries>
  );
};
```

### Обязательные пакеты

```bash
cd ~/Documents/Antigravity/remotion-studio
npx remotion add @remotion/media         # для <Audio>
# @remotion/transitions уже установлен
```

### Регистрация в Root.tsx

```tsx
<Composition
  id="{CompositionId}"
  component={MyVideo}
  durationInFrames={totalFrames}
  fps={30}
  width={1080}
  height={1920}
/>
```

---

## Шаг 4: Рендер

```bash
cd ~/Documents/Antigravity/remotion-studio

# Превью
npm run dev

# Рендер MP4
npx remotion render {CompositionId} out/{filename}.mp4
```

---

## Голоса для русского языка

Модель `eleven_multilingual_v2` поддерживает 32+ языков. Рекомендованные:

| Голос | ID | Характер | Подходит для |
|-------|----|----------|-------------|
| **Eric** | `cjVigY5qzO86Huf0OWal` | Гладкий, доверительный | Промо, презентации |
| **Brian** | `nPczCjzI2devNBz1zQrb` | Глубокий, спокойный | Обзоры, туториалы |
| **George** | `JBFqnCBsd6RMkjVDRZzb` | Тёплый рассказчик | Сторителлинг |
| **Daniel** | `onwK4e9ZLuTAKqWW03F9` | Стабильный ведущий | Новости, отчёты |

## Troubleshooting

### Аудио не синхронизируется с визуалом
- Используй `getAudioDurationInSeconds` из `@remotion/media` для точной длительности
- Подставляй реальную длительность в `SCENE_DURATIONS` вместо оценочной

### Голос звучит неестественно на русском
- Попробуй другой голос из таблицы
- Увеличь `stability` до 0.6-0.7
- Уменьши `style` до 0.1-0.2
