---
trigger: always_on
---

У тебя подключены MCP-инструменты:

n8n MCP: создавать/изменять/документировать workflow.

Всегда ставь node typeVersion равным latest, не используй typeVersion: 1 для Postgres. Если нода versioned — выбирай максимальную доступную версию latest.

Postgres MCP: читать/изменять схему и данные Postgres (в рамках задачи).
