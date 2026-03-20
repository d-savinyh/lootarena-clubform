---
name: n8n-workflow-dev
description: Comprehensive guide for creating, modifying, and debugging n8n workflows. Enforces versioning, documentation, and best practices.
---

# n8n Workflow Development Skill

Use this skill whenever you need to create, modify, or debug workflows in n8n.

## When to use this skill
- Creating a new generic or webhook-based workflow.
- Modifying an existing workflow logic.
- Debugging execution errors in n8n.
- integrating n8n with Postgres or external APIs.

## ⚠️ Critical Rules (from User Rules)
1.  **Documentation First**: Always keep `/specs/n8n/workflows.md` up to date.
2.  **Node Versions (Mandatory)**: Always use the **latest** stable version for nodes.
    -   **Postgres**: Use `typeVersion: 2.6` (or higher). Never use v1.
    -   **Webhook**: Use `typeVersion: 2.1` (or higher).
    -   **Respond to Webhook**: Use `typeVersion: 1.5` (or higher).
    -   **If**: Use `typeVersion: 2.3` (or higher).
3.  **Postgres Best Practices**:
    -   **Query Parameters**: ALWAYS use Parameterized Queries (e.g., `$1`, `$2`) with `queryReplacement` / `queryParams`. NEVER concatenate strings directly into SQL queries to avoid injection risks.

> [!CAUTION]
> ### PostgreSQL `operation` при updateNode — КРИТИЧЕСКАЯ ОШИБКА
> 
> При использовании `mcp_n8n_update_partial_workflow` с `type: "updateNode"` для PostgreSQL ноды, **ОБЯЗАТЕЛЬНО** указывайте `operation: "executeQuery"` в `updates.parameters`.
> 
> **Причина**: MCP-инструмент **перезаписывает все parameters**. Если не указать operation, нода сбрасывается на дефолтную операцию `insert`, и workflow ломается.
> 
> **Правильно**:
> ```json
> {
>   "type": "updateNode",
>   "nodeName": "Get Data",
>   "updates": {
>     "parameters": {
>       "operation": "executeQuery",  // ⚠️ ОБЯЗАТЕЛЬНО!
>       "query": "SELECT * FROM table WHERE id = $1",
>       "options": { "queryReplacement": "={{ $json.body.id }}" }
>     }
>   }
> }
> ```
> 
> **Неправильно** (приведёт к insert и ошибке):
> ```json
> {
>   "type": "updateNode",
>   "nodeName": "Get Data",
>   "updates": {
>     "parameters": {
>       "query": "SELECT * FROM table WHERE id = $1"  // ❌ Без operation!
>     }
>   }
> }
> ```

4.  **Workflow Notes (Mandatory)**: Add concise **Sticky Notes** directly on the canvas.
    -   **Language**: Notes must be in **Russian**.
    -   **Format**: Use **Markdown** (bold, lists, code blocks) for better readability.
    -   **Content**: Explain *what* the workflow does, *how* it processes data, and *why* certain logic exists.
    -   **Placement**: Place notes near the Trigger (overview) and near complex logic blocks.
5.  **Safety**: Do not turn off active workflows or delete them without explicit confirmation.
6.  **Webhook Authentication (Mandatory)**: Every Webhook Trigger **must** have Authentication enabled.
    -   Set `Authentication` property to `Header Auth`.
    -   Use `erp-webhook-secret` credential.
    -   **Frontend Constraint**: The client must send `Authorization: Bearer <VITE_WEBHOOK_SECRET>` (NOT the session token).
    -   Do not accept unauthenticated webhook calls.
7.  **Error Handling**: Add explicit error handling for critical nodes. For webhook workflows, always return a clear error response (4xx/5xx).
8.  **Credentials (Mandatory)**: При создании нод через MCP **ОБЯЗАТЕЛЬНО** указывать `credentials`. Без этого нода будет создана, но **не сможет выполнить запрос** (ошибка «Credential with ID not found»).

    **Postgres** — всегда добавлять:
    ```json
    "credentials": {
      "postgres": {
        "id": "nQWrdNDv1qQRTg5Z",
        "name": "Postgres account"
      }
    }
    ```

    **Webhook (Header Auth)** — всегда добавлять:
    ```json
    "credentials": {
      "httpHeaderAuth": {
        "id": "GXOGCq9Qt9Ht3fNA",
        "name": "erp-webhook-secret"
      }
    }
    ```

    > ⚠️ n8n UI позволяет выбрать креды из списка, но через MCP они **не подставляются автоматически**. Всегда указывай явно!
9.  **Multiline Content / Newlines**:
    -   ⚠️ **Known Issue**: Using the `\n` escape sequence in tool parameters (like Sticky Note `content` or Postgres `query`) often results in literal `\n` text appearing in n8n (e.g., "Line1\nLine2").
    -   **Requirement**: Avoid using `\n` for formatting if possible, or verify manually that it renders correctly. When writing SQL or Code, try to use **actual line breaks** in the tool input string if supported, rather than `\n`.
10. **Test SQL Before Deploy (Mandatory)**:
    -   ⚠️ **ВСЕГДА** сначала проверяй SQL-запросы через `mcp_postgres_execute_sql` на реальных данных, прежде чем деплоить в n8n workflow.
    -   **Причина**: Колонки могут быть переименованы, отсутствовать, или иметь другие типы. Запрос может быть синтаксически валиден, но падать на реальных данных.
    -   **Паттерн**:
        1. Проверить схему таблицы через `get_object_details`
        2. Подставить реальный параметр (например, `promotion_id`) и выполнить запрос
        3. Убедиться что результат содержит ожидаемые данные
        4. Только после этого обновлять ноду в workflow
    -   **Частая ошибка**: Использование предполагаемых имён колонок (например, `price_with_discount` вместо реального `price_sale`, `cnt` вместо `quantity`). Всегда проверяй через `get_object_details`!

## 🔐 Multi-Tenant Guest Isolation (CRITICAL)

При работе с данными гостей (`langame_guests`) **ОБЯЗАТЕЛЬНО** учитывать привязку к клубу через `main_lg_id`.

### Проблема
Один `guest_id` может существовать в нескольких клубах. Без фильтра `main_lg_id` в JOIN можно получить данные гостя из **другого клуба**.

### Решение — Паттерн SQL

```sql
-- 1. Получаем langame_id клуба из erp_club_id
club_info AS (
    SELECT langame_id FROM erp_clubs WHERE id = (SELECT erp_club_id FROM params)
),

-- 2. JOIN с langame_guests ОБЯЗАТЕЛЬНО с main_lg_id
stats_with_guest AS (
    SELECT sb.*, lg.fio, lg.phone
    FROM base_stats sb
    INNER JOIN langame_guests lg ON sb.guest_id = lg.guest_id 
        AND lg.main_lg_id = (SELECT langame_id FROM club_info)  -- ⚠️ ОБЯЗАТЕЛЬНО!
)
```

### Где применять
- **Всегда** при JOIN с `langame_guests` в контексте конкретного клуба
- Особенно в аналитических workflows (segments, CRM, profiles)
- В details-запросах с детализацией по пользователям

### ⚠️ Trap: `LEFT JOIN` vs `INNER JOIN`
- `INNER JOIN` — гости без записи в `langame_guests` будут исключены
- `LEFT JOIN` — гости могут иметь `NULL` в fio/phone
- Выбор зависит от требований: для лидербордов лучше `INNER JOIN`


## ⚠️ Trap: Webhook Node ID — только UUID!

При создании workflow через API (`n8n_create_workflow`), **нельзя** использовать произвольные короткие `id` для Webhook нод (например, `"id": "wh-text"`).

**Проблема**: n8n сохраняет ноду, но **не регистрирует webhook** в роутере. Даже после активации workflow — 404 на production URL.

**Решение**: Всегда использовать **UUID-формат** для `id` всех нод:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // ✅ UUID
  "id": "wh-text"  // ❌ Не сработает для webhook!
}
```

**Генерация**: Можно использовать любой валидный UUID-v4, например через `crypto.randomUUID()`.

> [!CAUTION]
> Это касается **всех нод** в workflow, но **особенно критично для Webhook** — без UUID webhook просто не зарегистрируется.

## ⚠️ Trap: Webhook через MCP create — нода не регистрируется (500 Error)

При создании workflow через `n8n_create_workflow`, Webhook-нода может быть создана корректно (UUID, правильный path, credentials), но при первом HTTP-запросе возвращать **500 Internal Server Error** (HTML "Internal Server Error").

**Причина**: n8n при создании workflow через API иногда **не полностью инициализирует** внутреннее состояние Webhook-ноды в роутере. Нода «существует», но роутер не может её обработать.

**Симптомы**:
- Workflow активен, webhook виден в UI
- POST на webhook URL → 500 (не 404)
- Ответ — HTML-страница `<pre>Internal Server Error</pre>`

**Решение** (подтверждено на практике):
1. Откройте workflow в UI n8n
2. **Удалите** Webhook-ноду
3. **Добавьте новую** Webhook-ноду (можно скопировать/вставить оригинал)
4. **Сохраните** workflow
5. При необходимости — деактивируйте и активируйте заново

**Профилактика**: После создания workflow через MCP, **всегда** рекомендуйте пользователю:
1. Активировать workflow вручную
2. Сделать тестовый запрос
3. Если 500 — пересоздать webhook-ноду в UI

> [!CAUTION]
> Эта проблема воспроизводится ~30-50% случаев. Всегда предупреждайте пользователя о необходимости проверки webhook после создания через MCP.

## ⚠️ Trap: Webhook через MCP — нет регистрации в роутере

При добавлении Webhook-ноды через MCP (`n8n_create_workflow` / `n8n_update_partial_workflow`) к **уже активному** workflow:

**Проблема**: n8n регистрирует вебхуки в своём внутреннем роутере **только в момент активации** workflow. Если workflow уже активен и мы добавляем ноду через API — вебхук **не зарегистрируется**, запросы будут возвращать 404.

**Решение**: После добавления/изменения Webhook-ноды через MCP:
1. **Деактивировать** workflow
2. **Активировать** заново
3. Только после этого новый вебхук начнёт принимать запросы

> [!CAUTION]
> Если workflow создаётся с нуля через `n8n_create_workflow` — он создаётся как **inactive**. Активация через UI обязательна (см. следующий trap).

## ⚠️ Trap: Активация workflow — только вручную через UI

**Проблема**: Активация workflow через MCP API **ненадёжна** (~90% случаев завершается ошибкой или молча не регистрирует вебхуки). Причины: credentials не привязаны, вебхуки не зарегистрированы, внутреннее состояние n8n не обновлено.

**Правило**: **НИКОГДА** не пытаться активировать workflow автоматически через MCP. Вместо этого:
1. Создать/обновить workflow через MCP (он будет inactive)
2. **Попросить пользователя** активировать workflow вручную в UI n8n
3. Сообщить ссылку или ID workflow для удобства

> [!IMPORTANT]
> После создания workflow через MCP всегда пиши пользователю:
> «Workflow создан (ID: XXX). Пожалуйста, активируйте его вручную в UI n8n.»

## Workflow Process


### 1. Preparation & Context
Before making any changes:
1.  **Read the Specs**:
    -   `specs/system.md` (High-level architecture)
    -   `specs/n8n/workflows.md` (Current workflow registry)
2.  **Inspect Existing**:
    -   If modifying, use `mcp_n8n_get_workflow` (mode='full') to get the current JSON.
    -   Understanding the inputs and outputs.
3. **Review Similar Workflows First**:
    - Find 1–3 workflows with a similar trigger/purpose (same type of webhook, same integration).
    - Study their node structure, naming, error handling, retries, and credential usage.
    - Reuse the proven pattern unless you have a clear reason to deviate.

### 2. Implementation
1.  **Use MCP Tools**:
    -   `mcp_n8n_create_workflow` / `mcp_n8n_update_full_workflow`.
    -   Ensure `typeVersion` is maximizing the latest available version in your node definitions.
2.  **Naming Convention**:
    -   Use clear, descriptive names for nodes (e.g., `Get User Data` instead of `Postgres1`).
    -   Workflow names should be categorized if possible (e.g., `APP - ...`, `CRON - ...`).

### 3. Verification & Testing
1.  **Test Execution**:
    -   Use `mcp_n8n_test_workflow` (if applicable) or trigger it manually.
    -   Verify execution scope and data flow.
2.  **Fix Validation Errors**:
    -   Use `mcp_n8n_validate_workflow` to catch structure issues.
    -   Use `mcp_n8n_autofix_workflow` for common format fixes.

### 4. Documentation Update (Mandatory)
After the workflow is working:
1.  Open `/specs/n8n/workflows.md`.
2.  Add or update the entry for the workflow.
    -   **ID**: The workflow ID from n8n.
    -   **Name**: The displayed name.
    -   **Trigger**: Webhook URL, Cron schedule, or other trigger.
    -   **Description**: Brief summary of what it does.
    -   **Used By**: Frontend component or other service calling it.
