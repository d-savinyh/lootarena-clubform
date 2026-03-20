---
description: Откат на предыдущую версию при проблемах с деплоем
---

# Rollback — откат деплоя

> **Первый шаг**: прочитай `.agent/toolkit.json` → секцию `project` для получения имени проекта, `n8n_url`, `deploy_webhook`, `dokploy_app_id`.

// turbo-all

### 1. Покажи доступные версии

```bash
git tag -l --sort=-creatordate | head -10
```

Для каждого тега покажи дату и summary:
```bash
git log --format="%ai %s" -1 <tag>
```

### 2. Покажи что изменилось в текущей (сломанной) версии

```bash
CURRENT=$(git describe --tags --abbrev=0)
PREVIOUS=$(git tag -l --sort=-creatordate | sed -n '2p')
echo "Текущая: $CURRENT, Откат к: $PREVIOUS"
git log $PREVIOUS..$CURRENT --oneline
```

Также покажи секцию текущей версии из `CHANGELOG.md` — чтобы пользователь понял, что именно ломает.

### 3. Спроси подтверждение

Покажи:
- 🏷️ **Откатить с**: \<текущий тег\>
- 🏷️ **Откатить на**: \<предыдущий тег\>
- 📋 **Что будет потеряно**: список коммитов между тегами

⚠️ **Обязательно дождись подтверждения!**

### 4. Выполни откат

Создай новый patch-тег на коммите предыдущей версии:
```bash
ROLLBACK_VERSION=$(npm version patch --no-git-tag-version)
git checkout <предыдущий_тег> -- .
git add .
git commit -m "rollback: откат к <предыдущий_тег>"
VERSION=$(node -p "require('./package.json').version")
git tag "v$VERSION"
git push && git push --tags
```

> Dokploy автоматически подхватит новый тег и задеплоит предыдущий код.

### 5. Обнови CHANGELOG.md

Добавь запись в `## [Unreleased]`:
```markdown
### 🔧 Исправления
- **Rollback** — откат к `<предыдущий_тег>` из-за: <причина>
```

И создай запись для тега отката:
```markdown
## [X.Y.Z] — YYYY-MM-DD `vX.Y.Z` (ROLLBACK)

⚠️ Откат к `<предыдущий_тег>`. Причина: <описание проблемы>

Изменения из `<текущий_тег>` временно отменены.
```

### 6. Отправь уведомление в Telegram

```bash
curl -s -X POST "<project.n8n_url><project.deploy_webhook>" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"⚠️ <b>ROLLBACK ${project.name} v${VERSION}</b>\n\nОткат к <предыдущий_тег>\nПричина: <описание>\n\n📅 $(date '+%Y-%m-%d %H:%M')\", \"version\": \"v${VERSION}\", \"applicationId\": \"<project.dokploy_app_id>\"}"
```

### 7. Покажи итог

- ⚠️ **Rollback**: vX.Y.Z → vA.B.C
- 🏷️ **Новый тег**: vX.Y.Z (содержит код от vA.B.C)
- 📋 **Причина**: ...
- 🚀 **Dokploy**: деплой запущен автоматически
- 💬 **Telegram**: уведомление отправлено

> **Следующий шаг**: исправь проблему и задеплой нормально через `/deploy`.
