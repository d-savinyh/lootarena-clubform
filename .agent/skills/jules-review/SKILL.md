---
name: jules-review
description: Use when reviewing Pull Requests created by Jules (Google AI agent), before merging code generated overnight. Invoke for Jules PR review, code validation, n8n JSON import, SQL migration review.
---

# Ревью результатов Jules

## Обзор
Скилл для проверки и интеграции PR, созданных Jules ночью. Включает валидацию кода, n8n JSON, SQL миграций и безопасную интеграцию в проект.

## Когда использовать
- Утром, когда Jules создал PR за ночь
- Пользователь говорит: «проверь что Jules сделал», «ревью PR от Jules»

## Чеклист ревью

### 1. Общая проверка
- [ ] PR содержит только заявленные изменения (нет случайных файлов)
- [ ] Нет конфликтов с `main`
- [ ] Naming соответствует конвенциям проекта
- [ ] Нет TODO/FIXME/хардкода

### 2. Фронтенд-код
- [ ] Типы соответствуют `types.ts`
- [ ] Используются brand-цвета из дизайн-системы
- [ ] Тексты на русском языке
- [ ] Нет прямых мутаций state
- [ ] API вызовы через `apiService.ts`
- [ ] Нет import из пакетов, которых нет в проекте

### 3. SQL миграции
- [ ] Миграция идемпотентная (IF NOT EXISTS / IF EXISTS)
- [ ] Не удаляет данные без подтверждения пользователя
- [ ] FK constraints корректны
- [ ] Индексы добавлены при необходимости
- [ ] **Проверить через `EXPLAIN`** перед выполнением
- [ ] **Обернуть в `BEGIN/ROLLBACK`** для тестирования

### 4. n8n workflow JSON
- [ ] Валидная структура (nodes[], connections{})
- [ ] Правильные typeVersion для нод
- [ ] Credentials references корректны
- [ ] Webhook path convention соблюдена
- [ ] Expressions используют правильный синтаксис (`={{ }}`)
- [ ] Auth-цепочка присутствует (executeWorkflow → IF)
- [ ] **Валидировать через MCP** `validate_workflow`

## Процесс ревью

### Шаг 1: Посмотри diff
```
git diff main..jules/branch-name
```

### Шаг 2: Проверь по чеклисту
Пройди соответствующий раздел чеклиста (фронт/SQL/n8n).

### Шаг 3: Интеграция

**Для фронт-кода:**
1. Merge PR
2. Проверь сборку — нет ошибок компиляции
3. Визуальная проверка (если UI-изменения)

**Для SQL:**
1. Просмотр миграции
2. `EXPLAIN` на SELECT-запросы
3. `BEGIN` → выполнить → проверить → `COMMIT` или `ROLLBACK`
4. Обновить `docs/jules/db-schema.md` если структура изменилась

**Для n8n JSON:**
1. Валидация через `validate_workflow` (MCP)
2. Создать workflow через `n8n_create_workflow` (MCP)
3. Autofix через `n8n_autofix_workflow` (MCP)
4. Тест через `n8n_test_workflow` (MCP)
5. Обновить `docs/jules/n8n-reference.md` если новые endpoints

### Шаг 4: Обновить docs/jules/
Если структура БД или API изменилась — обновить reference-доки для будущих задач Jules.

## Типичные проблемы Jules

| Проблема | Как фиксить |
|----------|-------------|
| Импорт несуществующего пакета | Удалить import, найти аналог в проекте |
| Несуществующий тип | Проверить types, добавить если нужно |
| n8n выражения без `=` | Autofix через MCP (`expression-format`) |
| Старый typeVersion | Autofix через MCP (`typeversion-upgrade`) |
| SQL без WHERE user_id | Добавить фильтр по user_id (multi-tenant!) |
| Хардкод credentials | Заменить на проектные или настроить в UI |
| Английские тексты в UI | Перевести на русский |

## Красные флаги (ОТКЛОНИТЬ PR)

- 🚫 Удаление данных без подтверждения
- 🚫 DROP TABLE / TRUNCATE
- 🚫 Изменение auth-логики
- 🚫 Новые внешние зависимости без согласования
- 🚫 Изменение API контрактов (breaking changes)
