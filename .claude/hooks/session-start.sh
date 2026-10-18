#!/bin/bash
# toolkit: universal/hooks/session-start.sh — общая версия из agent-toolkit; правишь под проект — убери эту строку,
# иначе следующая синхронизация toolkit её перезапишет.
# Старт сессии Claude Code. Вывод попадает в контекст сессии.
#
# ОБЛАКО: догрузить полную историю и теги. Облако клонирует репозиторий неполным (без тегов) — без этого не
# работают `git describe --tags`, diff «с последнего тега» в /deploy и `npm run check:branches` (на неполном
# клоне он ложно краснеет «несвязанной историей»). В скрипте настройки окружения git ещё без доступа к GitHub.
#
# MAC: сводка свежести. Инструкции (CLAUDE.md, скиллы, уроки, /save, /deploy) между людьми и облаком ездят
# через git, а pull до 18.10.2026 случался только в /deploy — 18.10 локальный main отстал на 116 коммитов
# (10 релизов) и сессии работали по старым урокам. Хук говорит: насколько отстаём, какие ИНСТРУКЦИИ поменялись
# на GitHub, что не запушено и что из инструкций не закоммичено (значит, коллега и облако их не видят).
# Ничего не подтягивает и не меняет: дерево бывает грязным, в нём работают параллельные сессии.
#
# Любая ошибка — молча дальше, старт сессии не блокируется.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  if [ "$(git rev-parse --is-shallow-repository 2>/dev/null)" = "true" ]; then
    git fetch -q --unshallow --tags origin || echo "⚠️ session-start: не удалось догрузить историю и теги"
  else
    git fetch -q --tags origin || echo "⚠️ session-start: не удалось догрузить теги"
  fi
  # Подстраховка, если скрипт настройки окружения не поставил зависимости
  if [ -f package.json ] && [ ! -d node_modules ]; then
    npm install --no-audit --no-fund || echo "⚠️ session-start: npm install не прошёл"
  fi
  echo "session-start: последний тег $(git describe --tags --abbrev=0 2>/dev/null || echo 'не найден')"
  exit 0
fi

# ---------- Mac ----------
base=$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main)
default=${base#origin/}
# Потолок 8 с: без сети сверяем со старым снимком origin и честно об этом говорим. Таймаут — SIGTERM: на нём git
# убирает свои lock-файлы (на SIGALRM — нет, и остался бы packed-refs.lock).
git fetch -q --tags origin 2>/dev/null & fpid=$!
( sleep 8; kill -TERM "$fpid" 2>/dev/null ) & kpid=$!
if wait "$fpid" 2>/dev/null; then stale=""; else stale=" (GitHub недоступен — сверка со старым снимком)"; fi
kill "$kpid" 2>/dev/null; wait "$kpid" 2>/dev/null
git rev-parse -q --verify "$base" >/dev/null 2>&1 || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')
tag=$(git describe --tags --abbrev=0 "$base" 2>/dev/null || echo '—')
behind=$(git rev-list --count "HEAD..$base" 2>/dev/null || echo 0)
warn=0

# Пути, где живут правила для людей и агентов
RULES=(CLAUDE.md REVIEW.md .claude/commands .claude/skills .claude/agents .claude/hooks .claude/settings.json .agent/workflows specs/lessons specs/devops)

if [ "$behind" -gt 0 ]; then
  warn=1
  if [ "$branch" = "$default" ]; then
    if [ -z "$(git --no-optional-locks status --porcelain 2>/dev/null)" ]; then
      echo "⚠️ session-start: $default отстаёт от GitHub на $behind комм. (там $tag)$stale — предложи git pull --ff-only origin $default"
    else
      echo "⚠️ session-start: $default отстаёт от GitHub на $behind комм. (там $tag)$stale; дерево грязное — сначала закоммить своё, а pull --autostash только если в этой папке нет других активных сессий (он прячет их правки на время rebase)"
    fi
  else
    echo "⚠️ session-start: ветка $branch отстаёт от $base на $behind комм. (там $tag)$stale — перед работой подтяни $default в ветку"
  fi
  changed=$(git diff --name-only "HEAD...$base" -- "${RULES[@]}" 2>/dev/null)
  if [ -n "$changed" ]; then
    n=$(printf '%s\n' "$changed" | wc -l | tr -d ' ')
    list=$(printf '%s\n' "$changed" | head -8 | paste -sd ',' - | sed 's/,/, /g')
    [ "$n" -gt 8 ] && list="$list (+$((n - 8)))"
    echo "⚠️ session-start: на GitHub новые инструкции/уроки (коллега или облако): $list — после pull читай их, а не память"
  fi
fi

# Незапушенное: основная ветка — относительно origin; другая — относительно своей пары на origin (или её нет вовсе)
if [ "$branch" = "$default" ]; then
  ahead=$(git rev-list --count "$base..HEAD" 2>/dev/null || echo 0)
  [ "$ahead" -gt 0 ] && { warn=1; echo "⚠️ session-start: $ahead комм. в $default не запушены — существуют только на этом Mac"; }
elif [ "$branch" != "HEAD" ]; then
  if git rev-parse -q --verify "origin/$branch" >/dev/null 2>&1; then
    ahead=$(git rev-list --count "origin/$branch..HEAD" 2>/dev/null || echo 0)
  else
    ahead=$(git rev-list --count "$base..HEAD" 2>/dev/null || echo 0)
  fi
  [ "$ahead" -gt 0 ] && echo "session-start: в ветке $branch $ahead комм. не на GitHub (перед уходом — push или влить в $default)"
fi

# Незакоммиченное. Инструкции отдельно: пока не в git, их нет ни у коллеги, ни в облаке
dirty=$(git --no-optional-locks status --porcelain 2>/dev/null)
if [ -n "$dirty" ]; then
  n=$(printf '%s\n' "$dirty" | wc -l | tr -d ' ')
  oldest=$(printf '%s\n' "$dirty" | cut -c4- | tr -d '"' | while read -r f; do [ -e "$f" ] && stat -f '%m' "$f" 2>/dev/null; done | sort -n | head -1)
  age=""
  [ -n "$oldest" ] && age=", самому старому $(( ($(date +%s) - oldest) / 86400 )) дн."
  echo "session-start: незакоммиченных файлов $n$age"
  rules_dirty=$(git --no-optional-locks status --porcelain -- "${RULES[@]}" 2>/dev/null | cut -c4- | tr -d '"' | sed -E 's#^(\.claude/skills/[^/]+)/.*#\1#' | sort -u | head -6 | paste -sd ',' - | sed 's/,/, /g')
  [ -n "$rules_dirty" ] && { warn=1; echo "⚠️ session-start: не закоммичены инструкции: $rules_dirty — у коллеги и в облаке их нет"; }
fi

[ "$warn" = 0 ] && echo "session-start: $branch = GitHub ($tag), инструкции свежие"
exit 0
