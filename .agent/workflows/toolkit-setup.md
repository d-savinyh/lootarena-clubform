---
description: Полная настройка проекта — скиллы, git, конфиги, MCP за один раз
---

// turbo-all

Единая точка входа для полной настройки проекта. Работает и для нового, и для существующего проекта.

1. **Клонируй/обнови agent-toolkit:**
```bash
if [ -d "/tmp/agent-toolkit/.git" ]; then git -C /tmp/agent-toolkit pull; else git clone https://github.com/d-savinyh/agent-toolkit.git /tmp/agent-toolkit; fi
```

2. **Прочитай `.agent/toolkit.json`** (если есть) — оттуда возьми стеки. Если файла нет — создай `toolkit.json` с помощью интерактивного опроса:

   **Спроси у пользователя:**
   - Имя проекта? (для changelog и уведомлений)
   - Какие стеки нужны? (`stack-react`, `stack-backend`, `stack-niche`, `stack-mobile`)
   - Есть ли n8n? Если да — URL (например `https://n8n.weekseed.ru`)
   - Webhook для деплой-уведомлений? (по умолчанию `/webhook/devops/deploy-notification`)
   - Какой MCP-профиль? (доступные: посмотри `ls /tmp/agent-toolkit/mcp-profiles/`)
   - Подпроекты для исключения из .dockerignore?

   **Создай `toolkit.json`:**
   ```json
   {
       "stacks": ["universal", "<выбранные стеки>"],
       "mcp_profile": "<профиль>",
       "toolkit_repo": "https://github.com/d-savinyh/agent-toolkit.git",
       "toolkit_local": "/tmp/agent-toolkit",
       "project": {
           "name": "<имя проекта>",
           "n8n_url": "<URL n8n или пусто>",
           "deploy_webhook": "<webhook путь>",
           "dockerignore_exclude": ["<подпроекты>"]
       }
   }
   ```

3. **Скопируй скиллы, правила, workflows** по стекам:
```bash
# Universal (всегда)
cp -R /tmp/agent-toolkit/universal/skills/* .agent/skills/
cp -R /tmp/agent-toolkit/universal/workflows/* .agent/workflows/
cp -R /tmp/agent-toolkit/universal/rules/* .agent/rules/

# По стекам из toolkit.json
# stack-backend → skills/ + rules/
# stack-react → skills/
# stack-niche → skills/
# stack-mobile → skills/
```

4. **Конфиги** — копируй если не существуют, если существуют — покажи diff:
```bash
# Пример для React-стека:
diff /tmp/agent-toolkit/configs/react/.prettierrc .prettierrc 2>/dev/null || echo "Новый конфиг"
```

5. **Проверь и настрой git:**
```bash
git status
```
- Если git не инициализирован → `git init`.
- Если нет коммитов → `git add . && git commit -m "🎉 Инициализация проекта"`.
- Если нет remote:
```bash
gh repo create <имя-проекта> --private --source . --push
```
- Если remote есть, но не синхронизирован → `git push`.

6. **Обнови реестр проектов в toolkit:**

Прочитай `/tmp/agent-toolkit/projects.json` и добавь текущий проект если его нет:
```json
{
    "name": "<имя>",
    "repo": "<github URL>",
    "mcp_profile": "<профиль>",
    "stacks": ["<стеки>"],
    "n8n_url": "<URL>"
}
```
Закоммить и запуши toolkit.

7. **Проверь devDependencies** в `package.json`:
```bash
cat package.json | grep -E '"eslint"|"prettier"|"typescript"' || echo "Не хватает зависимостей"
```
Если чего-то не хватает — предложи установить: `npm install --save-dev eslint prettier typescript`.

8. **Проверь npm-скрипты:**
   - React/Vite: `dev`, `build`, `zip`
   - React Native: `start`, `android`, `ios`, `build`

9. **MCP-профиль** — если в `toolkit.json` указан `mcp_profile`:
```bash
cp /tmp/agent-toolkit/mcp-profiles/<профиль>.json ~/.gemini/antigravity/mcp_config.json
```
Подсказка: после смены MCP нужно перезагрузить Antigravity (Cmd+Shift+P → Reload).

10. **Итоговый отчёт** — покажи что в порядке (✅) и что требует внимания (⚠️).
