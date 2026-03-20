# Дистрибуция Skills

Руководство по распространению skills на основе Anthropic Best Practices (январь 2026).

---

## Каналы дистрибуции

### 1. Claude.ai — Upload для индивидуальных пользователей

```
1. Скачай папку skill
2. Сожми в .zip (если нужно)
3. Открой Claude.ai → Settings → Capabilities → Skills
4. Нажми "Upload skill"
5. Выбери папку/архив skill
6. Включи skill toggle
7. Протестируй: попроси Claude выполнить задачу skill
```

### 2. Claude Code — Локальное размещение

Положи папку skill в директорию skills Claude Code. Skill подхватится автоматически.

### 3. API — Программное использование

Для приложений, агентов и автоматизированных pipeline:

- Endpoint: `/v1/skills` для управления skills
- Параметр `container.skills` в Messages API для подключения skills
- Управление версиями через Claude Console
- Работает с Claude Agent SDK

| Use Case | Лучшая платформа |
|----------|-----------------|
| Конечные пользователи | Claude.ai / Claude Code |
| Ручное тестирование | Claude.ai / Claude Code |
| Индивидуальные ad-hoc задачи | Claude.ai / Claude Code |
| Программное использование | API |
| Production deployments | API |
| Автоматизированные pipeline | API |

### 4. Организации — Admin deploy

- Админы могут деплоить skills на весь workspace
- Автоматические обновления
- Централизованное управление

---

## Хостинг на GitHub

### Структура репозитория

```
your-skill-repo/
├── README.md           # ДЛЯ ЛЮДЕЙ — инструкции по установке
├── skill-folder/       # Папка skill
│   ├── SKILL.md        # Главный файл skill (БЕЗ README.md внутри!)
│   ├── scripts/
│   └── references/
└── examples/           # Примеры использования
```

**Важно**: `README.md` на уровне репозитория (для GitHub) — это нормально. `README.md` ВНУТРИ папки skill — запрещён.

### Шаблон Install Guide

```markdown
## Установка skill [Your Service]

1. Скачай skill:
   - Клонируй репо: `git clone https://github.com/company/skills`
   - Или скачай ZIP из Releases

2. Установи в Claude:
   - Открой Claude.ai → Settings → Skills
   - Нажми "Upload skill"
   - Выбери папку skill (сжатую)

3. Включи skill:
   - Активируй toggle [Your Service] skill
   - Убедись что MCP сервер подключён (если нужен)

4. Протестируй:
   - Спроси Claude: "Настрой новый проект в [Your Service]"
```

---

## Positioning — Как описывать skill

### Фокус на результатах, не на фичах

```
# ✅ Хорошо
"Skill ProjectHub позволяет командам настроить полный workspace
за секунды — включая страницы, базы данных и шаблоны —
вместо 30-минутной ручной настройки."

# ❌ Плохо
"Skill ProjectHub — это папка с YAML frontmatter и Markdown
инструкциями, которая вызывает MCP инструменты."
```

### Связка MCP + Skills

```
"Наш MCP сервер даёт Claude доступ к вашим проектам Linear.
Наш skill учит Claude workflow спринт-планирования вашей команды.
Вместе они обеспечивают AI-powered управление проектами."
```

### Ключевые принципы

1. **Outcomes > Features** — описывай что пользователь получит, не как skill устроен
2. **MCP + Skills story** — объясни почему вместе лучше чем по отдельности
3. **Quick-start** — покажи минимальный путь от установки до результата
4. **Screenshots** — визуальные примеры работы skill в реальных задачах
