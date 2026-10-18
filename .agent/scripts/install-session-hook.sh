#!/bin/bash
# Ставит в проект хук старта сессии Claude Code из agent-toolkit (universal/hooks/session-start.sh):
# при старте каждой сессии — отставание от GitHub, какие инструкции поменял коллега/облако, что не запушено,
# какие инструкции не закоммичены. Идемпотентен: повторный запуск ничего не ломает.
#   - хука нет → ставит; есть с пометкой «toolkit:» → обновляет; есть свой (без пометки) → не трогает;
#   - .claude/settings.json: добавляет SessionStart, если его там ещё нет (остальное не трогает);
#   - .gitignore: если .claude/ игнорируется целиком — открывает settings.json и hooks, чтобы хук был у всех.
# Запуск из корня проекта: bash .agent/scripts/install-session-hook.sh
set -uo pipefail
SRC="${TOOLKIT_LOCAL:-/tmp/agent-toolkit}/universal/hooks/session-start.sh"
[ -f "$SRC" ] || { echo "⚠️ install-session-hook: нет $SRC — сначала обнови toolkit"; exit 0; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "ℹ️ install-session-hook: не git-репозиторий — хук не нужен"; exit 0; }
cd "$(git rev-parse --show-toplevel)" || exit 0

mkdir -p .claude/hooks
DST=.claude/hooks/session-start.sh
if [ ! -f "$DST" ]; then
  cp "$SRC" "$DST" && chmod +x "$DST" && echo "✅ хук старта сессии поставлен"
elif cmp -s "$SRC" "$DST"; then
  echo "✅ хук старта сессии актуален"
elif grep -q 'toolkit: universal/hooks/session-start.sh' "$DST"; then
  cp "$SRC" "$DST" && chmod +x "$DST" && echo "✅ хук старта сессии обновлён из toolkit"
else
  echo "⚠️ в проекте свой .claude/hooks/session-start.sh (без пометки toolkit) — не трогаю; сравнить: diff $SRC $DST"
fi

python3 -I - <<'PY'
import json, os
p = '.claude/settings.json'
s = json.load(open(p, encoding='utf-8')) if os.path.exists(p) else {}
arr = s.setdefault('hooks', {}).setdefault('SessionStart', [])
if 'session-start.sh' in json.dumps(arr):
    print('✅ settings.json: SessionStart уже подключён')
else:
    arr.append({'hooks': [{'type': 'command', 'command': '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start.sh'}]})
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(s, f, ensure_ascii=False, indent=2); f.write('\n')
    print('✅ settings.json: SessionStart подключён')
PY

if git check-ignore -q .claude/settings.json || git check-ignore -q .claude/hooks/session-start.sh; then
  # «.claude/» целиком не даёт открыть вложенные файлы — переводим в «.claude/*» (остальное по-прежнему скрыто)
  if grep -qxE '\.claude/?' .gitignore 2>/dev/null; then
    sed -i '' -E 's#^\.claude/?$#.claude/*#' .gitignore
  fi
  printf '\n# Claude Code: общие хуки и настройки проекта — в git, чтобы были у всех\n!.claude/settings.json\n!.claude/hooks/\n!.claude/hooks/*.sh\n' >> .gitignore
  if git check-ignore -q .claude/settings.json || git check-ignore -q .claude/hooks/session-start.sh; then
    echo "⚠️ .gitignore всё ещё скрывает .claude/settings.json или hooks — поправь вручную (git check-ignore -v .claude/settings.json)"
  else
    echo "✅ .gitignore: .claude/settings.json и .claude/hooks открыты для git"
  fi
fi
echo "ℹ️ закоммить: .claude/hooks/session-start.sh .claude/settings.json .gitignore — тогда хук будет и у коллеги, и в облаке"
