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

> ⚠️ **Тег откатывает только то, что едет в контейнере (фронт).** Функции БД, workflow n8n, модули ПК-агента
> и всё, что применялось через MCP, остаются новыми. Открой changelog откатываемой версии: у пунктов Высокого
> уровня есть строка «Как откатить» (`specs/db/migrations/_rollback/…`, `before.json` патча n8n). Фронт старой
> версии против новой БД бывает хуже, чем новый фронт, — сначала реши, что откатывать вместе, и скажи пользователю.

Создай новый patch-тег с кодом предыдущей версии:
```bash
PREV=<предыдущий_тег>
CUR=$(git show HEAD:package.json | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).version')
NEXT=$(node -p "const [a,b,c]='$CUR'.split('.').map(Number); [a,b,c+1].join('.')")
# --no-overlay: файлы, появившиеся после $PREV, удаляются. Без него они остаются в сборке — смесь двух версий.
git checkout --no-overlay "$PREV" -- .
# В сборку не едут, а откатывать их нельзя: журнал, инструкции, уроки, реестр сторожа веток
for p in CHANGELOG.md CLAUDE.md REVIEW.md specs .claude .agent scripts/check-branches.archive; do
  git cat-file -e "HEAD:$p" 2>/dev/null && git checkout --no-overlay HEAD -- "$p"
done
# Зависимости — как в $PREV, версия — выше текущей (иначе тег «уже есть»).
# --ignore-scripts: preversion (сторож веток) в аварийном откате не нужен — старый код уже выпускался.
npm version "$NEXT" --no-git-tag-version --ignore-scripts
git add -A
git commit -m "rollback: откат к $PREV"
git tag "v$NEXT"
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
