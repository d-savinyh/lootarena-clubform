# YAML Frontmatter — Справочник

## Обязательные поля

```yaml
---
name: skill-name-in-kebab-case
description: Что делает skill и когда его использовать. Включи конкретные триггеры.
---
```

## Опциональные поля

```yaml
---
name: skill-name
description: [обязательно]
license: MIT                    # Лицензия для open-source
compatibility: "Требует Python 3.9+"  # Требования к окружению (1-500 символов)
allowed-tools: "Bash(python:*) Bash(npm:*) WebFetch"  # Ограничение доступа к инструментам
metadata:                       # Произвольные метаданные
  author: Company Name
  version: 1.0.0
  mcp-server: server-name
  category: productivity
  tags: [project-management, automation]
  documentation: https://example.com/docs
  support: support@example.com
---
```

## Правила для поля `name`

| Правило | Пример ✅ | Пример ❌ |
|---------|-----------|-----------|
| Только kebab-case | `my-skill` | `my_skill`, `MySkill` |
| Без пробелов | `database-management` | `database management` |
| Без заглавных | `n8n-workflow` | `N8n-Workflow` |
| Без зарезервированных префиксов | `my-assistant` | `claude-assistant`, `anthropic-skill` |

## Правила для поля `description`

### Обязательные компоненты

1. **ЧТО делает** — краткое описание функционала
2. **КОГДА использовать** — триггеры и сценарии

### Лимиты

- Максимум **1024 символа**
- **Запрещены** символы `<` и `>` (XML)

### Примеры

```yaml
# ✅ Хорошо — есть ЧТО и КОГДА
description: Создание PPTX презентаций. Используй когда нужно создать слайды, бизнес-презентацию. Триггеры: "создай презентацию", "слайды", "PPTX".

# ❌ Плохо — нет триггеров
description: Создание презентаций.

# ❌ Плохо — слишком расплывчато
description: Помогает с проектами.
```

### Негативные триггеры

Для предотвращения ложных срабатываний:

```yaml
description: Статистический анализ CSV. НЕ использовать для простого просмотра данных (используй data-viz skill).
```

## Правила для поля `allowed-tools`

Ограничивает набор инструментов, доступных skill. Полезно для безопасности.

```yaml
# Разрешить только Python, npm и web-запросы
allowed-tools: "Bash(python:*) Bash(npm:*) WebFetch"

# Разрешить только конкретные MCP инструменты
allowed-tools: "mcp__projecthub__create_project mcp__projecthub__list_tasks"
```

## Правила для поля `compatibility`

Указывает требования к окружению (1-500 символов):

```yaml
# Указать зависимости
compatibility: "Требует Python 3.9+ и Node.js 18+. Работает в Claude Code и Claude.ai."

# Указать платформу
compatibility: "Оптимизирован для Claude Code. Требует доступ к файловой системе."
```

## Ограничения безопасности

| Разрешено | Запрещено |
|-----------|-----------|
| Стандартные YAML типы | XML теги `<` `>` |
| Произвольные metadata поля | Выполнение кода в YAML |
| Длинные description (до 1024) | Префиксы `claude-` и `anthropic-` |
| Поле `allowed-tools` | Инъекция системных промптов |

**Почему**: Frontmatter появляется в system prompt Claude. Вредоносный контент может инжектировать инструкции.
