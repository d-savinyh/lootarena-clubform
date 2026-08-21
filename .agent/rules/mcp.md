---
trigger: always_on
---

У тебя подключены MCP-инструменты:

n8n MCP: создавать/изменять/документировать workflow.

Всегда ставь node typeVersion равным latest, не используй typeVersion: 1 для Postgres. Если нода versioned — выбирай максимальную доступную версию latest.

Postgres MCP: читать/изменять схему и данные Postgres (в рамках задачи).

## Запись в n8n падает `settings must NOT have additional properties`

Это **не** претензия к твоим операциям и не проблема доступа: `n8n_update_partial_workflow` шлёт в
public API весь workflow целиком вместе с его `settings`, а UI пишет туда ключи, которых нет в схеме
API (`availableInMCP`, `binaryMode`, `timeSavedMode`). Диф отбивается ещё до применения
(`rollbackPerformed: false` — в БД не меняется ничего). `updateSettings` не спасает: MCP их мержит,
`null` не удаляет, и после успешной записи через API n8n возвращает ключи обратно — то есть **любая**
следующая правка такого WF тоже пойдёт мимо MCP.

Обход и обязательный порядок сверки — [`specs/lessons/n8n.md`](../../../erp-lootarena/specs/lessons/n8n.md)
в репозитории ЕРП (раздел от 20.08.2026): `GET` → бэкап JSON в scratchpad → патч нод в питоне → `PUT`
телом `{name, nodes, connections, settings}` с `settings`, отфильтрованным до whitelist
(`executionOrder`, `save*`, `executionTimeout`, `errorWorkflow`, `timezone`, `callerPolicy`) → повторный
`GET` и **побайтовое сравнение каждой ноды с бэкапом** (`json.dumps(sort_keys=True)`). Проверено
21.08.2026 на активном `MOBILE - phone-register`: `active` сохраняется, `connections` не страдают,
`activeVersionId` обновляется сам — отдельный Publish не нужен. Ключ — в `~/.claude.json` →
`mcpServers['n8n-lootarena'].env.N8N_API_KEY`; читает его скрипт, в вывод он не попадает.

Читай урок ЕРП ДО того, как начнёшь чинить свой диф: сообщение звучит так, будто виноват payload.

