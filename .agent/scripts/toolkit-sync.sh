#!/usr/bin/env bash
# toolkit-sync.sh — Умная синхронизация скиллов между проектами
# Использует baseline-манифест для 3-way merge detection
#
# Команды:
#   save-baseline  — сохранить хеши текущих файлов .agent/ в манифест
#   detect-changes — найти реально изменённые файлы и определить действие

set -euo pipefail

BASELINE_FILE=".agent/.toolkit-baseline.json"
TOOLKIT_LOCAL="${TOOLKIT_LOCAL:-/tmp/agent-toolkit}"
BASELINE_VERSION="1"

# ─── Утилиты ──────────────────────────────────────────────────────────────────

md5_file() {
  md5 -q "$1" 2>/dev/null || md5sum "$1" 2>/dev/null | cut -d' ' -f1
}

# Собрать хеши всех файлов в .agent/skills, .agent/rules, .agent/workflows
collect_hashes() {
  local dir="$1"
  find "$dir/skills" "$dir/rules" "$dir/workflows" \
    -type f \( -name "*.md" -o -name "*.sh" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.txt" \) \
    2>/dev/null | sort | while read -r file; do
    local rel="${file#$dir/}"
    local hash
    hash=$(md5_file "$file")
    echo "    \"$rel\": \"$hash\""
  done
}

# ─── save-baseline ────────────────────────────────────────────────────────────

cmd_save_baseline() {
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  echo "{"
  echo "  \"version\": \"$BASELINE_VERSION\","
  echo "  \"generated_at\": \"$timestamp\","
  echo "  \"files\": {"

  local hashes
  hashes=$(collect_hashes ".agent")

  # Убрать запятую из последней строки
  if [ -n "$hashes" ]; then
    echo "$hashes" | sed '$ s/$//' | sed '$! s/$/, /'
  fi

  echo "  }"
  echo "}"
}

# ─── detect-changes ───────────────────────────────────────────────────────────

cmd_detect_changes() {
  # Проверка: baseline существует?
  if [ ! -f "$BASELINE_FILE" ]; then
    echo "STATUS:NO_BASELINE"
    echo "MESSAGE:Baseline не найден. Запустите /start для инициализации."
    return 0
  fi

  # Проверка: toolkit доступен?
  if [ ! -d "$TOOLKIT_LOCAL/.git" ]; then
    echo "STATUS:NO_TOOLKIT"
    echo "MESSAGE:Toolkit не клонирован. Запустите /start."
    return 0
  fi

  # Обновить toolkit
  git -C "$TOOLKIT_LOCAL" pull --rebase --quiet 2>/dev/null || true

  # Собрать список файлов (без pipe, чтобы переменные работали)
  local tmpfile
  tmpfile=$(mktemp)
  find .agent/skills .agent/rules .agent/workflows \
    -type f \( -name "*.md" -o -name "*.sh" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.txt" \) \
    2>/dev/null | sort > "$tmpfile"

  local has_output=false

  while read -r file; do
    local rel="${file#.agent/}"

    # Проверить .toolkit-ignore
    if is_ignored "$rel"; then
      continue
    fi

    local local_hash
    local_hash=$(md5_file "$file")

    # Получить baseline хеш (из JSON, простой grep)
    local baseline_hash
    baseline_hash=$(grep "\"$rel\"" "$BASELINE_FILE" 2>/dev/null | sed 's/.*: "//;s/".*//' || echo "")

    # Если файла нет в baseline — это НОВЫЙ файл
    if [ -z "$baseline_hash" ]; then
      echo "NEW_FILE:$rel"
      has_output=true
      continue
    fi

    # Если хеш совпадает с baseline — файл не менялся
    if [ "$local_hash" = "$baseline_hash" ]; then
      continue
    fi

    # Файл изменён локально. Проверяем toolkit (3-way).
    # Найти файл в toolkit (может быть в universal/, stack-*/...)
    local toolkit_hash=""
    for search_dir in "$TOOLKIT_LOCAL"/universal "$TOOLKIT_LOCAL"/stack-*; do
      local toolkit_file="$search_dir/$rel"
      if [ -f "$toolkit_file" ]; then
        toolkit_hash=$(md5_file "$toolkit_file")
        break
      fi
    done

    if [ -z "$toolkit_hash" ]; then
      # Файл есть локально, менялся, но нет в toolkit — безопасно пушить
      echo "SAFE_TO_PUSH:$rel"
      has_output=true
    elif [ "$toolkit_hash" = "$baseline_hash" ]; then
      # Toolkit не менялся с последнего pull — безопасно пушить
      echo "SAFE_TO_PUSH:$rel"
      has_output=true
    else
      # Toolkit тоже изменился — КОНФЛИКТ
      echo "CONFLICT:$rel"
      has_output=true
    fi
  done < "$tmpfile"

  rm -f "$tmpfile"

  if [ "$has_output" = false ]; then
    echo "STATUS:NO_CHANGES"
    echo "MESSAGE:Скиллы/правила/workflows не менялись."
  fi
}

# ─── Проверка .toolkit-ignore ─────────────────────────────────────────────────

is_ignored() {
  local file="$1"
  if [ -f ".agent/.toolkit-ignore" ]; then
    while IFS= read -r pattern; do
      # Пропуск пустых строк и комментариев
      [[ -z "$pattern" || "$pattern" == \#* ]] && continue
      if [[ "$file" == $pattern* ]]; then
        return 0
      fi
    done < ".agent/.toolkit-ignore"
  fi
  return 1
}

# ─── Главная точка входа ──────────────────────────────────────────────────────

case "${1:-help}" in
  save-baseline)
    cmd_save_baseline > "$BASELINE_FILE"
    echo "✅ Baseline сохранён: $(grep -c '\"' "$BASELINE_FILE" | head -1) записей"
    ;;
  detect-changes)
    cmd_detect_changes
    ;;
  *)
    echo "Использование: toolkit-sync.sh {save-baseline|detect-changes}"
    echo ""
    echo "  save-baseline   — сохранить хеши файлов .agent/ после pull"
    echo "  detect-changes  — найти изменённые файлы для push"
    exit 1
    ;;
esac
