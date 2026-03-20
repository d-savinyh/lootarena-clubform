# Паттерны Skills

Пять основных паттернов из руководства Anthropic для построения эффективных skills.

---

## Паттерн 1: Sequential Workflow Orchestration

**Используй когда**: Нужен многошаговый процесс в определённом порядке.

### Структура

```markdown
## Workflow: {Название}

### Шаг 1: {Название}
Call MCP tool: `{tool_name}`
Parameters: {params}

### Шаг 2: {Название}
Call MCP tool: `{tool_name}`
Wait for: {предыдущий результат}

### Шаг 3: {Название}
Call MCP tool: `{tool_name}`
Parameters: {value_from_step_1}
```

### Ключевые техники

- Явный порядок шагов
- Зависимости между шагами
- Валидация на каждом этапе
- Инструкции по rollback при ошибках

### Пример: Онбординг клиента

```markdown
## Workflow: Онбординг нового клиента

### Шаг 1: Создание аккаунта
Call MCP: `create_customer`
Parameters: name, email, company

### Шаг 2: Настройка платежа
Call MCP: `setup_payment_method`
Wait for: верификация платёжного метода

### Шаг 3: Создание подписки
Call MCP: `create_subscription`
Parameters: plan_id, customer_id (из Шага 1)

### Шаг 4: Welcome email
Call MCP: `send_email`
Template: welcome_email_template
```

---

## Паттерн 2: Multi-MCP Coordination

**Используй когда**: Workflow охватывает несколько сервисов.

### Структура

```markdown
### Фаза 1: {Service A}
1. {Действие}
2. {Результат}

### Фаза 2: {Service B}
1. {Использовать результат Фазы 1}
2. {Действие}

### Фаза 3: {Service C}
1. {Финализация}
```

### Ключевые техники

- Чёткое разделение фаз
- Передача данных между MCP
- Валидация перед переходом к следующей фазе
- Централизованная обработка ошибок

### Пример: Design-to-Dev Handoff

```markdown
### Фаза 1: Экспорт дизайна (Figma MCP)
1. Экспорт ассетов из Figma
2. Генерация спецификаций дизайна
3. Создание манифеста ассетов

### Фаза 2: Хранение ассетов (Drive MCP)
1. Создание папки проекта в Drive
2. Загрузка всех ассетов
3. Генерация shareable ссылок

### Фаза 3: Создание задач (Linear MCP)
1. Создание задач разработки
2. Прикрепление ссылок на ассеты
3. Назначение команде

### Фаза 4: Уведомление (Slack MCP)
1. Пост в #engineering
2. Ссылки на ассеты и задачи
```

---

## Паттерн 3: Iterative Refinement

**Используй когда**: Качество улучшается с итерациями.

### Структура

```markdown
## Итерационный процесс

### Initial Draft
1. Создание первой версии
2. Сохранение во временный файл

### Quality Check
1. Запуск валидации: `scripts/check.py`
2. Определение проблем

### Refinement Loop
1. Исправление каждой проблемы
2. Регенерация затронутых частей
3. Повторная валидация
4. Повтор до достижения порога качества

### Finalization
1. Финальное форматирование
2. Генерация summary
3. Сохранение финальной версии
```

### Ключевые техники

- Явные критерии качества
- Итеративное улучшение
- Скрипты валидации
- Знать когда остановиться

---

## Паттерн 4: Context-Aware Tool Selection

**Используй когда**: Один результат, разные инструменты в зависимости от контекста.

### Структура

```markdown
## Decision Tree

1. Проверить {параметр}
2. Определить лучший инструмент:
   - {Условие A}: {Tool A}
   - {Условие B}: {Tool B}
   - {Условие C}: {Tool C}
   - Fallback: {Default Tool}

3. Выполнить с выбранным инструментом
4. Объяснить пользователю почему выбран этот инструмент
```

### Ключевые техники

- Чёткие критерии выбора
- Fallback опции
- Прозрачность решений

### Пример: Умное хранение файлов

```markdown
## Smart File Storage

### Decision Tree
1. Проверить тип и размер файла
2. Определить лучшее хранилище:
   - Большие файлы (>10MB): Cloud Storage MCP
   - Collaborative docs: Notion/Docs MCP
   - Code файлы: GitHub MCP
   - Временные: Local storage

### Execute
- Вызов соответствующего MCP
- Применение service-specific метаданных
- Генерация access link

### Explain
Объясни пользователю почему выбрано это хранилище
```

---

## Паттерн 5: Domain-Specific Intelligence

**Используй когда**: Skill добавляет специализированные знания помимо доступа к инструментам.

### Структура

```markdown
## {Domain} Processing

### Before Action (Compliance Check)
1. Получить данные через MCP
2. Применить доменные правила:
   - {Правило 1}
   - {Правило 2}
3. Документировать решение

### Processing
IF compliance passed:
  - Выполнить действие
  - Применить проверки
ELSE:
  - Пометить для ревью
  - Создать кейс

### Audit Trail
- Логирование всех проверок
- Записать решения
- Генерация audit report
```

### Ключевые техники

- Доменная экспертиза встроена в логику
- Compliance перед действием
- Полная документация
- Чёткий governance

### Пример: Платежи с compliance

```markdown
## Payment Processing with Compliance

### Before Processing
1. Fetch transaction via MCP
2. Compliance rules:
   - Check sanctions lists
   - Verify jurisdiction
   - Assess risk level
3. Document compliance decision

### Processing
IF compliance passed:
  - Call payment MCP
  - Apply fraud checks
  - Process transaction
ELSE:
  - Flag for review
  - Create compliance case

### Audit Trail
- Log all compliance checks
- Record decisions
- Generate audit report
```

---

## Выбор паттерна

| Сценарий | Паттерн |
|----------|---------|
| Чёткая последовательность шагов | Sequential Workflow |
| Интеграция нескольких сервисов | Multi-MCP Coordination |
| Требуется высокое качество результата | Iterative Refinement |
| Разные инструменты для разных случаев | Context-Aware Selection |
| Нужна доменная экспертиза | Domain-Specific Intelligence |
