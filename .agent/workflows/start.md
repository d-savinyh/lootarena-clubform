---
description: Быстрый старт — синхронизация всего окружения
---

// turbo-all

Единая команда для начала работы. Выполняет sync + toolkit-pull + mcp за один раз.

> **Каждый день `/start` не нужен.** Свежесть кода и инструкций при старте каждой сессии показывает хук
> `.claude/hooks/session-start.sh` (где он есть): отставание от GitHub, новые инструкции коллеги, незапушенное.
> `/start` — для первой настройки машины, обновления toolkit и MCP. Как работаем вдвоём — `specs/devops/team-workflow.md`.


1. **Sync — подтянуть свежий код:**
```bash
git fetch origin
git pull --rebase --autostash origin main
```

1.5. **Проверка .env** — если нет `.env`, но есть `.env.example`:
```bash
test -f .env || (test -f .env.example && cp .env.example .env && echo "⚠️ Создан .env из .env.example — заполни значения!")
```
Если `.env` создан из примера — **предупреди** пользователя: «Заполни переменные в `.env` перед запуском проекта.»

2. **Toolkit Pull — обновить скиллы и правила:**
```bash
if [ -d /tmp/agent-toolkit/.git ]; then
  git -C /tmp/agent-toolkit pull --rebase || echo "⚠️ Toolkit не обновился — продолжу с текущей локальной копией"
else
  git clone $(cat .agent/toolkit.json | grep toolkit_repo | cut -d'"' -f4) /tmp/agent-toolkit || echo "⚠️ Toolkit repo недоступен — код уже подтянут, toolkit-sync пропущен"
fi
```
Если `/tmp/agent-toolkit` недоступен после этого шага — **не откатывай код**. Продолжи только проверки проекта, а шаги копирования toolkit/MCP отметь как пропущенные.

3. **⚠️ Проверка несохранённых локальных изменений** — перед перезаписью:
```bash
bash .agent/scripts/toolkit-sync.sh detect-changes 2>/dev/null
```
   - Если скрипта нет (первый раз) — пропустить проверку, перейти к шагу 4.
   - Если `STATUS:NO_CHANGES` или `STATUS:NO_BASELINE` — безопасно продолжить.
   - Если есть `SAFE_TO_PUSH` или `NEW_FILE` — **⚠️ ПРЕДУПРЕДИТЬ пользователя**: «Обнаружены несохранённые изменения в скиллах. Если продолжить /start, они будут перезаписаны. Сначала выполните /save, или подтвердите что можно перезаписать.»
   - Если есть `CONFLICT` — **⚠️ ПРЕДУПРЕДИТЬ и ОСТАНОВИТЬСЯ**: «Обнаружены конфликты в скиллах. Необходимо сначала решить их через /save.»
   - Если пользователь подтвердил — продолжить. Если нет — прервать.

4. **Копировать универсальные скиллы/правила/workflows:**
```bash
cp -R /tmp/agent-toolkit/universal/skills/* .agent/skills/ 2>/dev/null
cp -R /tmp/agent-toolkit/universal/workflows/* .agent/workflows/ 2>/dev/null
cp -R /tmp/agent-toolkit/universal/rules/* .agent/rules/ 2>/dev/null
mkdir -p .claude/commands
cp -R /tmp/agent-toolkit/universal/commands/* .claude/commands/ 2>/dev/null
```

5. **Копировать стековые скиллы:** Прочитай `.agent/toolkit.json` → для каждого стека из `stacks`:
```bash
cp -R /tmp/agent-toolkit/<stack>/skills/* .agent/skills/ 2>/dev/null
cp -R /tmp/agent-toolkit/<stack>/rules/* .agent/rules/ 2>/dev/null
```

6. **Копировать скрипты синхронизации:**
```bash
mkdir -p .agent/scripts
cp -R /tmp/agent-toolkit/universal/scripts/* .agent/scripts/ 2>/dev/null
chmod +x .agent/scripts/*.sh 2>/dev/null
```

6.5. **Хук старта сессии** (сводка свежести в начале каждой сессии Claude Code — заменяет ежедневный `/start`):
```bash
bash .agent/scripts/install-session-hook.sh
```
Поставил или поменял `.claude/hooks/session-start.sh`, `.claude/settings.json`, `.gitignore` — закоммить их: тогда хук есть у коллеги и в облаке.

7. **Сохранить baseline-манифест** (хеши файлов после pull для отслеживания изменений):
```bash
bash .agent/scripts/toolkit-sync.sh save-baseline
```

8. **Drift-детектор — показать что обновилось:**
```bash
git diff --stat .agent/
```
Если есть изменения — покажи списком что появилось/обновилось (новые скиллы, правила, workflows).

9. **MCP — применить профиль:** Прочитай `.agent/toolkit.json` → `mcp_profile`, затем примени конфигурацию из `/tmp/agent-toolkit/mcp-profiles/<profile>.json`.

10. **Проверка безопасности** (тихая, только критические):
```bash
npm audit --audit-level=high 2>/dev/null || true
```
Если есть уязвимости high/critical — покажи предупреждение ⚠️. Не блокируй работу, просто сообщи.

11. **Итог — покажи статус:**
```bash
echo "=== Git ===" && git log --oneline -3 && echo "=== Skills ===" && ls .agent/skills/ 2>/dev/null && echo "=== Rules ===" && ls .agent/rules/ 2>/dev/null && echo "=== Workflows ===" && ls .agent/workflows/ && echo "=== Commands ===" && ls .claude/commands/ 2>/dev/null
```
