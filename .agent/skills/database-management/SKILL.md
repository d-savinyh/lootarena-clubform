---
name: database-management
description: Safe procedures for Postgres schema changes, data migration, and querying.
---

# Database Management Skill

Use this skill for all interactions with the PostgreSQL database, including schema updates, complex queries, and data debugging.

## When to use this skill
- Adding columns or tables.
- Modifying existing relationships.
- Writing complex SQL for reports.
- Debugging data inconsistencies.

## ⚠️ Critical Rules (from User Rules)
1.  **Documentation First**: Always keep `/specs/db/schema.md` up to date.
2.  **Safety First**: No `DROP`, `TRUNCATE`, or mass `DELETE` without explicit user confirmation.
3.  **Inspect First**: Always check the current state (`inspect_db_schema` or `list_tables`) before assuming schema structure.

## 🔐 Multi-Tenant Guest Isolation (CRITICAL)

Проект использует multi-tenant архитектуру. Один `guest_id` может существовать в разных клубах.

### Ключевые связи

| Источник | Поле | Связь с |
|----------|------|---------|
| `erp_clubs` | `id` (UUID) | Первичный ключ ERP-клуба |
| `erp_clubs` | `langame_id` | ID в системе Langame |
| `langame_guests` | `main_lg_id` | Привязка гостя к Langame-клубу |
| `lg_fact_*` | `erp_club_id` | Привязка транзакций к ERP-клубу |

### Паттерн: Получение гостей для клуба

```sql
-- ПРАВИЛЬНО: с фильтром main_lg_id
SELECT lg.* FROM langame_guests lg
WHERE lg.main_lg_id = (
    SELECT langame_id FROM erp_clubs WHERE id = $erp_club_id
);

-- НЕПРАВИЛЬНО: без фильтра — вернёт дубли из других клубов!
SELECT lg.* FROM langame_guests lg WHERE lg.guest_id = $guest_id;
```

### Паттерн: JOIN в аналитических запросах

```sql
club_info AS (
    SELECT langame_id FROM erp_clubs WHERE id = (SELECT erp_club_id FROM params)
),
stats_with_guest AS (
    SELECT sb.*, lg.fio, lg.phone
    FROM base_stats sb
    INNER JOIN langame_guests lg 
        ON sb.guest_id = lg.guest_id 
        AND lg.main_lg_id = (SELECT langame_id FROM club_info)  -- ⚠️ ОБЯЗАТЕЛЬНО
)
```

### Где применять
- Все аналитические запросы с детализацией по гостям
- CRM-запросы, профили пользователей
- Любой JOIN с `langame_guests` в контексте конкретного клуба


## Workflow Process


### 1. Preparation
1.  **Read the Specs**:
    -   `specs/system.md`.
    -   `specs/db/schema.md`.
2.  **Inspect Current State**:
    -   Use `mcp_postgres_list_objects` or `mcp_postgres_get_object_details` to verify the table structure, column types, and constraints.
    -   *Do not blindly run ALTER TABLE without verifying the column doesn't exist.*

### 2. Implementation
1.  **Safe Changes**:
    -   For data modification, prefer transactions.
    -   For schema changes, use standard SQL DDL.
    -   **⚠️ При командной работе**: перед миграцией сделай `git pull --rebase` и проверь `specs/db/schema.md` на свежие изменения — коллега мог изменить схему параллельно.
2.  **Complex Queries**:
    -   Use `mcp_postgres_explain_query` if performance is a concern.
    -   Ensure standard SQL syntax compatible with Postgres.

### 3. Documentation Update (Mandatory)
After applying changes:
1.  Open `/specs/db/schema.md`.
2.  Update formatting to reflect the new state:
    -   New tables/columns.
    -   Changed data types.
    -   New foreign key relationships.
