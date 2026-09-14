---
description: Сохранить в GitHub
---

// turbo-all

Универсальная команда сохранения: проект + toolkit (скиллы/правила/конфиги).

## 0. ШАГ 0 — РЕВИЗИЯ ВЕТОК И WORKTREE (до всего остального)

> ⚠️ **Рабочее дерево `main` — НЕ вся несохранённая работа.** Готовая фича может лежать
> закоммиченной в ветке, которую никто не пушил, или НЕЗАКОММИЧЕННОЙ внутри worktree —
> по `git log` такая ветка выглядит пустой. Так уже терялись: личный ЛанЧат
> (`vigilant-chebyshev`, 02.09), девять веток с раскатанными миграциями (собраны только
> 11.09.2026) и 12 коммитов готовой фичи (нашёл пользователь, а не сценарий) — всё в
> соседнем репозитории того же контура. Это не редкость, а норма: проверяй КАЖДЫЙ раз.

```bash
# 0.1. Ветки с коммитами, которых нет в main
for b in $(git branch --format='%(refname:short)' | grep -v '^main$'); do
  n=$(git rev-list --count main..$b 2>/dev/null)
  [ "$n" != "0" ] && printf '%-45s %s коммит(ов)\n' "$b" "$n"
done

# 0.2. Worktree с НЕЗАКОММИЧЕННЫМИ файлами (главная ловушка: по логу ветка пустая)
git worktree list --porcelain | grep '^worktree ' | sed 's/^worktree //' | while read -r wt; do
  [ "$wt" = "$PWD" ] && continue
  n=$(git -C "$wt" status --short 2>/dev/null | wc -l | tr -d ' ')
  [ "$n" != "0" ] && printf '%-45s %s файл(ов)\n' "${wt##*/}" "$n"
done

# 0.3. Что из найденного СВЕЖЕЕ — по дате правки файлов, а не по дате ветки
for w in $(git worktree list --porcelain|grep '^worktree '|sed 's/^worktree //'); do
  [ "$w" = "$PWD" ] && continue
  newest=$(git -C "$w" status --short 2>/dev/null | awk '{print $2}' | tr -d '"' \
    | while read -r f; do [ -e "$w/$f" ] && stat -f '%Sm' -t '%m-%d %H:%M' "$w/$f"; done | sort -r | head -1)
  [ -n "$newest" ] && printf '%-42s %s\n' "${w##*/}" "$newest"
done | sort -k2 -r
```

**Как читать результат.** «Ветка отличается от main» ≠ «работа не перенесена»: main ушёл
вперёд, и файл будет отличаться всегда. Проверяй по СОДЕРЖАНИЮ — ищи опознавательный
маркер работы (имя новой функции, файл миграции, строку урока) в main:

```bash
ls specs/db/migrations/ | grep '<имя миграции из ветки>'   # есть файл = перенесено
grep -c '<имя новой функции/урока>' <файл в main>          # 0 = НЕ перенесено
```

**Что делать с найденным:**
- ветка с коммитами → `git merge --no-ff <ветка>`; конфликты в `specs/lessons/*` и
  `CLAUDE.md` разрешай сохранением ОБЕИХ сторон (это разные уроки, не версии одного);
- незакоммиченное в worktree → перенести патчем
  (`git -C <worktree> diff > /tmp/p.patch && git apply --3way /tmp/p.patch`) или скопировать
  новые файлы; ничего не удалять в самом worktree;
- уже перенесённое ранее → ничего не делать, но НАЗВАТЬ это в итоге, иначе на следующем
  прогоне ту же ветку будут проверять заново.

**В итоге ОБЯЗАТЕЛЬНО напиши пользователю, что проверено и что найдено** — строкой вида
«проверено N веток и M worktree, не в main была работа K веток». Молчание здесь
неотличимо от «не смотрел»: ровно поэтому пропажу два раза находил пользователь.

## 1. Проект — аудит всех изменений

> ⚠️ **ПРАВИЛО**: НИКОГДА не полагайся на память о текущей сессии. В `git add .` попадают ВСЕ незакоммиченные файлы, включая изменения из предыдущих сессий. Ты ОБЯЗАН просмотреть diff КАЖДОГО файла.

### 1.1. Получи список изменённых файлов

```bash
git diff --stat
```

### 1.2. Просмотри diff КАЖДОГО значимого файла (ОБЯЗАТЕЛЬНО!)

Для **каждого** файла из списка (кроме `package-lock.json`, `.agent/*`):

```bash
git diff -- <file> | head -100
```

**Это не опционально.** Ты ДОЛЖЕН выполнить `git diff -- <file>` для каждого `.tsx`, `.ts`, `.css`, `.json` файла. Если файл большой — используй `head -100` / `tail -100`, но **обязательно прочитай**.

### 1.3. Составь карту изменений

По итогам аудита каждого файла составь мысленную **карту изменений** — список вида:
- `Файл.tsx` — что изменилось, суть правки

Эта карта — единственный источник для коммит-сообщения и CHANGELOG. **НЕ КОММИТЬ**, пока карта не покрывает ВСЕ файлы из `git diff --stat`.

### 1.4. Ограничение индексации файлов

> ⚠️ **КРИТИЧНОЕ ПРАВИЛО**: Если в карте изменений есть файлы из директории `.agent/` (скиллы, правила, воркфлоу) — **НЕ КОММИТЬ ИХ НА ЭТОМ ЭТАПЕ В ЛОКАЛЬНЫЙ ПРОЕКТ**. Сначала выполни шаг `3. Умная синхронизация скиллов` (перенос и пуш в глобальный тулкит).

### 1.5. Сформируй коммит-сообщение и сохрани (только проект!)

Добавляй только те файлы, которые относятся непосредственно к проекту, минуя `.agent/` (если они менялись). Либо, если изменения были только про проектные, делай `git add .`.

```bash
git commit -m "<осмысленное сообщение>" && git push
```

### 1.5. Конфликты при push

Если push отклонён — `git pull --rebase && git push`.
   - Если конфликт в `CHANGELOG.md` → **принять обе версии**: объединить записи в `[Unreleased]`, убрать дубликаты, привести в порядок категории. Затем:
     ```bash
     git add CHANGELOG.md && git rebase --continue && git push
     ```
   - Если конфликт в `package-lock.json` → принять remote и переустановить:
     ```bash
     git checkout --theirs package-lock.json && npm install && git add package-lock.json && git rebase --continue && git push
     ```

## 2. Обновить CHANGELOG.md (секция Unreleased)

Если в карте изменений есть **значимые изменения кода** (не только конфиги/скиллы/мелочи) — допиши их в секцию `## [Unreleased]` в `CHANGELOG.md`:
   - Формат: `- **Фича/Исправление** — \`Компонент\`: техническое описание`
   - Группируй под существующими категориями (🆕 Новое / 🔧 Исправления / ⚙️ Инфраструктура)
   - Если секций категорий ещё нет в Unreleased — создай нужные
   - Удали строку `_Нет незадеплоенных изменений._` если она есть
   - **Сверь карту изменений с тем, что уже записано** — не допускай пропусков!
   - Закоммить `CHANGELOG.md` отдельно:
   ```bash
   git add CHANGELOG.md && git commit -m "changelog: обновлён unreleased" && git push
   ```
   - Если изменения **только** в скиллах/конфигах/.agent — пропусти этот шаг

## 3. Умная синхронизация скиллов

5. **Проверить изменения** с помощью baseline-манифеста:
```bash
bash .agent/scripts/toolkit-sync.sh detect-changes
```

6. **По результатам detect-changes:**
   - `STATUS:NO_BASELINE` → скажи пользователю: «Baseline не найден. Запусти `/start` для инициализации. Скиллы не пушатся.»
   - `STATUS:NO_CHANGES` → скажи: «Скиллы не менялись, toolkit синхронизирован ✅»
   - `SAFE_TO_PUSH:<файл>` → предложи push **только этих файлов** в toolkit
   - `NEW_FILE:<файл>` → предложи добавить новый скилл в toolkit
   - `CONFLICT:<файл>` → **ИНТЕЛЛЕКТУАЛЬНОЕ СЛИЯНИЕ (Semantic Merge)**:
     1. Прочитай обе версии файла (из `.agent/...` и из `/tmp/agent-toolkit/...`).
     2. НЕ спрашивай пользователя, какую удалить. Твоя задача — **объединить опыт из обеих версий**.
     3. Напиши новую версию файла, которая сохраняет логику обновления из глобальной версии и добавляет новые инсайты/правила из локальной версии. Не теряй контекст ни с одной стороны.
     4. Сохрани объединенный файл локально и включи его в список на push.
     5. Покажи пользователю краткое саммари того, как ты объединил знания.

   ```bash
   # ⚠️ Health-check: toolkit может быть повреждён (macOS чистит /tmp/, параллельные сессии)
   bash -c 'cd /tmp/agent-toolkit && git status' 2>/dev/null 1>/dev/null
   if [ $? -ne 0 ]; then
       echo "⚠️ Toolkit повреждён — переклонирую..."
       TOOLKIT_REMOTE=$(grep -o 'https://[^ "]*' /tmp/agent-toolkit/.git/config 2>/dev/null || echo "")
       rm -rf /tmp/agent-toolkit
       if [ -n "$TOOLKIT_REMOTE" ]; then
           git clone "$TOOLKIT_REMOTE" /tmp/agent-toolkit
       else
           echo "❌ Remote не найден — запусти /start"
           exit 1
       fi
   fi
   ```

   ```bash
   git -C /tmp/agent-toolkit pull --rebase 2>/dev/null
   ```

   **Маппинг стеков** (куда копировать):
   - `brainstorming`, `debugging-wizard`, `idea-validator`, `jules-review`, `jules-task-prep` → `universal/skills/`
   - `n8n-workflow-dev`, `postgres-pro`, `sql-pro`, `database-management` → `stack-backend/skills/`
   - `react-expert`, `typescript-pro`, `motion-animation` → `stack-react/skills/`
   - Правила: `docs.md`, `mcp.md` → `stack-backend/rules/`, остальные → `universal/rules/`
   - Workflows → `universal/workflows/`

   Скопируй **только файлы с `SAFE_TO_PUSH` или `NEW_FILE`**:
   ```bash
   cp -R .agent/skills/<skill>/ /tmp/agent-toolkit/<stack>/skills/<skill>/
   cp .agent/rules/<rule>.md /tmp/agent-toolkit/<dir>/rules/<rule>.md
   cp .agent/workflows/<wf>.md /tmp/agent-toolkit/universal/workflows/<wf>.md
   ```

   **📝 Changelog скиллов** — для каждого пушимого скилла обнови `## Changelog` в конце `SKILL.md`:
   - Если секции нет — добавь `## Changelog` в конец
   - Формат: `- YYYY-MM-DD — <краткое описание>`
   - Если >50% строк изменено — `[BREAKING]`

   Закоммить и запуши:
   ```bash
   cd /tmp/agent-toolkit && git add . && git commit -m "update: <описание>" && git push
   ```

8. **После push — подтянуть свежий toolkit и обновить локальные скиллы** (чтобы получить изменения из других проектов):
```bash
git -C /tmp/agent-toolkit pull --rebase 2>/dev/null
```
Прочитай `.agent/toolkit.json` → `stacks`, затем скопируй актуальные файлы:
   ```bash
   cp -R /tmp/agent-toolkit/universal/skills/* .agent/skills/ 2>/dev/null
   cp -R /tmp/agent-toolkit/universal/rules/* .agent/rules/ 2>/dev/null
   cp -R /tmp/agent-toolkit/universal/workflows/* .agent/workflows/ 2>/dev/null
   # Для каждого стека из toolkit.json:
   cp -R /tmp/agent-toolkit/<stack>/skills/* .agent/skills/ 2>/dev/null
   cp -R /tmp/agent-toolkit/<stack>/rules/* .agent/rules/ 2>/dev/null
   ```

   **ТЕПЕРЬ МОЖНО ЗАКОММИТИТЬ ИХ В ЛОКАЛЬНЫЙ ПРОЕКТ:**
   ```bash
   git add .agent/ && git commit -m "⚙️ Инфраструктура: синхронизация локального toolkit с глобальным" && git push
   ```
```bash
# Обновить baseline после pull
bash .agent/scripts/toolkit-sync.sh save-baseline
```

## 4. Итог

Покажи сводку:
- 📦 **Проект**: что закоммичено (кратко)
- 📋 **CHANGELOG.md**: что добавлено в Unreleased (или «без изменений»)
- 🧰 **Toolkit**: что запушено или «без изменений»

### ГИГИЕНА: подтвердил перенос — УБЕРИ (иначе платишь за тот же разбор каждый релиз)

Ревизия веток сама по себе дёшева: три команды и несколько десятков строк. Дорого обходится
то, что идёт следом, — разбор «а перенесено ли» по маркерам содержимого. Он растёт линейно
с числом накопленных веток, и без уборки каждый релиз заново доказывает уже доказанное.

Замер в соседнем репозитории проекта (14.09.2026): 34 локальных ветки и 28 worktree заняли
**8.7 ГБ**, а разбор съедал порядка 15–20k токенов за релиз. После уборки — одна ветка,
один worktree, 20 КБ, ревизия отдаёт одну строку за 0.03 с.

**Порядок нерушим: архив → сверка → удаление. Наоборот нельзя.**

```bash
# 1. АРХИВ: незакоммиченное в worktree — в коммит его же ветки
git worktree list --porcelain | awk '/^worktree /{wt=$2} /^branch /{print wt"\t"$2}' \
| while IFS=$'\t' read -r wt br; do
  [ "$wt" = "$PWD" ] && continue
  [ "$(git -C "$wt" status --short | wc -l)" = "0" ] && continue
  git -C "$wt" add -A && git -C "$wt" commit -q -m "archive: работа worktree ${wt##*/} перед уборкой"
done

# 2. АРХИВ: каждая ветка с работой — на origin
for b in $(git branch --format='%(refname:short)' | grep -v '^main$'); do
  [ "$(git rev-list --count main..$b)" != "0" ] && git push -q origin "$b"
done

# 3. СВЕРКА — без неё не удалять. Локальный SHA обязан совпасть с origin
for b in $(git branch --format='%(refname:short)' | grep -v '^main$'); do
  [ "$(git rev-list --count main..$b)" = "0" ] && continue
  [ "$(git rev-parse $b)" = "$(git ls-remote --heads origin $b | cut -f1)" ] \
    || echo "❌ НЕ в архиве: $b — УДАЛЯТЬ НЕЛЬЗЯ"
done

# 4. УДАЛЕНИЕ (только если сверка чистая)
for wt in $(git worktree list --porcelain | grep '^worktree ' | sed 's/^worktree //'); do
  [ "$wt" = "$PWD" ] || git worktree remove "$wt" --force
done
git worktree prune
for b in $(git branch --format='%(refname:short)' | grep -v '^main$'); do git branch -D "$b"; done
```

**Почему порядок именно такой:**

- **Ветки, которой нет на `origin`, не существует нигде, кроме этого диска.** `git branch -D`
  уничтожит её работу без следа — reflog не вечен. Push стоит секунды и делает удаление
  обратимым.
- **`git worktree remove --force` удаляет незакоммиченные файлы** — ровно те, ради которых
  ревизия веток и появилась. Сначала коммит, потом push, только потом remove.
- **Сверка по SHA — не формальность.** Push мог уйти в отказ (protected branch, нет прав,
  сеть), а цикл продолжился бы дальше. Совпадение локального и удалённого SHA — единственное
  доказательство, что архив существует.
- **Не удаляй ветку, работу которой ещё не подтвердил маркером.** Гигиена — это уборка ПОСЛЕ
  проверки, а не вместо неё.

**Когда:** после успешного релиза, когда перенос подтверждён и тег запушен. Не в середине
разбора.
