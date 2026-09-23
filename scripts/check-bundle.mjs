#!/usr/bin/env node
/**
 * Сторож СТАРТОВОГО бандла (шаблон agent-toolkit: configs/react/scripts/check-bundle.mjs).
 * Ловит то, из-за чего приложение не открывается ВООБЩЕ, — а этого не видят ни tsc, ни
 * `vite build`, ни телеметрия (она живёт в том же бандле, который не исполнился).
 *
 * Повод (18–22.09.2026, ERP LootArena). `pdfjs-dist` читался динамическим `await import()` в одном
 * месте, но `manualChunks` отправлял любой пакет из node_modules в чанк 'vendor', а именованный
 * вендор-чанк Vite кладёт в modulepreload входной страницы — он исполняется у каждого, кто открыл
 * приложение. На верхнем уровне pdf.js трогает `Iterator.prototype`, которого до Safari 18.2 нет:
 * стартовый чанк умирал целиком, и на iOS 18.0/18.1 ЕРП не открывался четыре дня (6 устройств из 6).
 * В логах сервера при этом сплошные 200 — доставка-то исправна.
 *
 * Проверяет по СОБРАННОМУ dist (не по исходникам) три вещи:
 *   1) в стартовых чанках нет API, которых нет в минимальном поддерживаемом Safari;
 *   2) стартовые чанки парсятся под этот Safari (синтаксис, через esbuild);
 *   3) стартовый бандл не растолстел — это и есть признак «пакет уехал в старт».
 * Стартовые = перечисленные в dist/index.html плюс всё, что они импортируют СТАТИЧЕСКИ
 * (динамический import() на входной странице не исполняется).
 *
 * Запуск:  npm run build && npm run check:bundle
 * Линия:   npm run check:bundle -- --update-baseline   (после осознанного роста)
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { execFileSync } from 'node:child_process';

const DIST = process.env.BUNDLE_DIST || 'dist';
const BASELINE_FILE = 'scripts/bundle-baseline.json';

/** Минимальный Safari, который обязан открывать приложение. Ниже — синтаксис проверяется esbuild'ом. */
const MIN_SAFARI = '16.4';

/**
 * API, появившиеся ПОЗЖЕ MIN_SAFARI. В стартовых чанках их быть не должно ВООБЩЕ — даже внутри
 * feature-detect: `typeof X.y` не защищает от ReferenceError на самом X, а именно так и был
 * написан убийственный код pdf.js.
 */
const FORBIDDEN = [
  { re: /\bIterator\.(prototype|from)\b/g, api: 'Iterator', since: 'Safari 18.2' },
  { re: /\bPromise\.try\s*\(/g, api: 'Promise.try', since: 'Safari 18.2' },
  { re: /\bArray\.fromAsync\b/g, api: 'Array.fromAsync', since: 'Safari 18.2' },
  { re: /\bRegExp\.escape\b/g, api: 'RegExp.escape', since: 'Safari 18.2' },
  { re: /\bFloat16Array\b/g, api: 'Float16Array', since: 'Safari 18.2' },
  { re: /\bMath\.(sumPrecise|f16round)\b/g, api: 'Math.sumPrecise/f16round', since: 'Safari 18.4' },
  { re: /\bPromise\.withResolvers\b/g, api: 'Promise.withResolvers', since: 'Safari 17.4' },
  { re: /\b(Object|Map)\.groupBy\b/g, api: 'Object.groupBy/Map.groupBy', since: 'Safari 17.4' },
  { re: /\bSymbol\.dispose\b/g, api: 'Symbol.dispose', since: 'Safari 26' },
];

/** Рост стартового бандла, после которого проверка падает (в процентах к базовой линии). */
const GROWTH_LIMIT_PCT = 12;

const fail = [];
const warn = [];
const kb = (n) => (n / 1024).toFixed(0) + ' КБ';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`[check:bundle] нет ${DIST}/index.html — сначала \`npm run build\``);
  process.exit(2);
}

/* ---------- 1. Какие файлы исполняются НА СТАРТЕ ---------- */
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
// Внешние скрипты (аналитика с CDN) — не наш бандл: их пропускаем, иначе проверка падала бы на них.
const queue = [...new Set([...html.matchAll(/(?:src|href)="([^"?#]+\.js)"/g)]
  .map((m) => m[1])
  .filter((u) => !/^(https?:)?\/\//.test(u))
  .map((u) => normalize(u.replace(/^\//, ''))))];
if (!queue.length) {
  console.error(`[check:bundle] в ${DIST}/index.html не нашлось ни одного .js — проверь сборку`);
  process.exit(2);
}
const startup = new Map(); // путь относительно dist → код
while (queue.length) {
  const rel = queue.shift();
  if (startup.has(rel)) continue;
  const path = join(DIST, rel);
  if (!existsSync(path)) { fail.push(`${rel} есть в стартовом списке, но не в ${DIST}`); continue; }
  const code = readFileSync(path, 'utf8');
  startup.set(rel, code);
  // Статические импорты исполняются на старте вместе с импортёром; `import("...")` — нет.
  for (const m of code.matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.{1,2}\/[^"']+\.js)["']/g)) {
    queue.push(normalize(join(dirname(rel), m[1])));
  }
}

/* ---------- 2. Запрещённые API ---------- */
let totalBytes = 0;
for (const [rel, code] of startup) {
  totalBytes += Buffer.byteLength(code);
  for (const { re, api, since } of FORBIDDEN) {
    const hits = code.match(re);
    if (hits) fail.push(`${rel}: ${api} (${since}) — ${hits.length} шт.`);
  }
}

/* ---------- 3. Синтаксис под минимальный Safari ---------- */
// Берём esbuild из зависимостей проекта (его приносит Vite). Молча качать его через `npx` нельзя:
// проверка перед деплоем не должна зависеть от сети, а Vite 8 собирается rolldown'ом и esbuild
// может не принести вовсе — тогда честно говорим, что синтаксис не проверен.
const ESBUILD = join('node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
const syntaxChecked = existsSync(ESBUILD);
if (!syntaxChecked) {
  warn.push(`esbuild не найден в node_modules — синтаксис под Safari ${MIN_SAFARI} не проверен (API проверены)`);
} else {
  for (const rel of startup.keys()) {
    try {
      execFileSync(ESBUILD, [join(DIST, rel), `--target=safari${MIN_SAFARI}`, '--outfile=/dev/null', '--log-level=error'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    } catch (e) {
      const out = String(e.stderr || e.stdout || e.message).split('\n').slice(0, 6).join('\n');
      fail.push(`${rel}: синтаксис не поддерживается Safari ${MIN_SAFARI}\n${out}`);
    }
  }
}

/* ---------- 4. Вес стартового бандла ---------- */
if (process.argv.includes('--update-baseline')) {
  writeFileSync(BASELINE_FILE, JSON.stringify({
    startupBytes: totalBytes, chunks: startup.size, updated: new Date().toISOString().slice(0, 10),
  }, null, 2) + '\n');
  console.log(`[check:bundle] базовая линия обновлена: ${kb(totalBytes)} в ${startup.size} файлах`);
  process.exit(0);
}
const baseline = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : null;
if (baseline) {
  const growth = ((totalBytes - baseline.startupBytes) / baseline.startupBytes) * 100;
  if (growth > GROWTH_LIMIT_PCT) {
    fail.push(
      `стартовый бандл вырос на ${growth.toFixed(1)}% (${kb(baseline.startupBytes)} → ${kb(totalBytes)}).\n` +
      `    Обычная причина — пакет уехал в стартовый чанк и теперь исполняется у ВСЕХ.\n` +
      `    Нужен на старте — обнови линию: npm run check:bundle -- --update-baseline`,
    );
  } else if (growth < -5) {
    warn.push(`стартовый бандл похудел на ${(-growth).toFixed(1)}% — обнови линию, если это ожидаемо`);
  }
} else {
  warn.push(`нет ${BASELINE_FILE} — создай: npm run check:bundle -- --update-baseline`);
}

/* ---------- Итог ---------- */
console.log(`[check:bundle] стартовых файлов: ${startup.size}, вес: ${kb(totalBytes)}`);
for (const w of warn) console.log(`  ⚠️  ${w}`);
if (fail.length) {
  console.error('\n[check:bundle] НАЙДЕНЫ ПРОБЛЕМЫ — приложение может не открыться на старых устройствах:\n');
  for (const f of fail) console.error(`  ❌ ${f}`);
  console.error(
    '\n  Пакет, нужный в одном разделе, не должен лежать в стартовом чанке. Два пути туда:\n' +
    '   • manualChunks в vite.config отдаёт его в именованный чанк → верни для него undefined,\n' +
    '     тогда Rollup положит пакет в async-чанк динамического import();\n' +
    '   • статический import в коде, который грузится на старте → замени на await import().\n' +
    '  Страховка на случай, когда пакет всё же нужен на старте, — гард `Iterator` в index.html\n' +
    '  (configs/react/index-html-snippets.html в agent-toolkit).\n',
  );
  process.exit(1);
}
// Итог не имеет права утверждать то, чего сторож не проверял: без esbuild синтаксис не смотрели.
console.log(`[check:bundle] стартовый бандл чист: запрещённых API нет, синтаксис ${syntaxChecked ? `по Safari ${MIN_SAFARI}` : 'НЕ проверен (нет esbuild)'}, вес в норме`);
