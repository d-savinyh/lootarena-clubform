// Edge-сервер ClubForm: отдаёт SPA + подставляет динамические OG-теги для краулеров,
// кеширует get_landing в памяти (TTL) — снимает нагрузку на n8n на масштабе.
// Zero-dependency (Node 20 built-ins: http, fs, fetch).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT) || 80;
const API_BASE = process.env.VITE_API_BASE_URL || 'https://n8n.lootarena.ru/webhook';
const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://form.lootarena.ru').replace(/\/+$/, '');
const TTL = Number(process.env.LANDING_TTL_MS) || 5 * 60 * 1000;

const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webp': 'image/webp',
    '.json': 'application/json; charset=utf-8', '.map': 'application/json',
};

let templateCache = null;
const landingCache = new Map(); // slug -> { data, exp }

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function getTemplate() {
    if (!templateCache) templateCache = await readFile(path.join(DIST, 'index.html'), 'utf8');
    return templateCache;
}

async function getLanding(slug) {
    const now = Date.now();
    const cached = landingCache.get(slug);
    if (cached && cached.exp > now) return cached.data;
    try {
        const res = await fetch(`${API_BASE}/public/clubform`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_landing', slug }),
            signal: AbortSignal.timeout(5000),
        });
        const j = await res.json();
        const data = Array.isArray(j) ? j[0] : j;
        const valid = data && data.form && !data.error ? data : null;
        landingCache.set(slug, { data: valid, exp: now + TTL });
        return valid;
    } catch {
        // при сбое n8n кешируем null ненадолго, чтобы не долбить
        landingCache.set(slug, { data: null, exp: now + 30_000 });
        return null;
    }
}

function injectMeta(html, landing, slug) {
    if (!landing || !landing.form) return html;
    const club = landing.club || {};
    const form = landing.form || {};
    const gift = form.gift;
    const title = `${club.name || 'Loot Arena'} — ${form.offerTitle || 'Оффер'}`;
    let desc = form.offerDescription && form.offerDescription !== 'none' ? form.offerDescription : '';
    if (gift) {
        const g = gift.reward_text || (gift.reward_meta?.bonus_amount ? `${gift.reward_meta.bonus_amount} бонусов` : '');
        if (g) desc = `🎁 Забери подарок: ${g}. ${desc}`.trim();
    }
    if (!desc) desc = 'Забери оффер и приходи играть!';
    const image = form.coverImage || club.coverUrl || club.avatarUrl || '';
    const url = `${SITE_ORIGIN}/${slug}`;
    const tags = [
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(desc)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="Loot Arena" />`,
        `<meta property="og:title" content="${esc(title)}" />`,
        `<meta property="og:description" content="${esc(desc)}" />`,
        `<meta property="og:url" content="${esc(url)}" />`,
        image ? `<meta property="og:image" content="${esc(image)}" />` : '',
        `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
        `<meta name="twitter:title" content="${esc(title)}" />`,
        `<meta name="twitter:description" content="${esc(desc)}" />`,
        image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
    ].filter(Boolean).join('\n    ');
    // убираем статичный <title> и вставляем мета перед </head>
    return html.replace(/<title>.*?<\/title>/s, '').replace('</head>', `    ${tags}\n  </head>`);
}

const server = http.createServer(async (req, res) => {
    try {
        const u = new URL(req.url, 'http://localhost');
        const pathname = decodeURIComponent(u.pathname);

        // Статика (по расширению, кроме .html)
        const ext = path.extname(pathname);
        if (ext && ext !== '.html') {
            const filePath = path.normalize(path.join(DIST, pathname));
            if (!filePath.startsWith(DIST)) { res.writeHead(403); return res.end('Forbidden'); }
            try {
                const st = await stat(filePath);
                if (st.isFile()) {
                    res.writeHead(200, {
                        'Content-Type': MIME[ext] || 'application/octet-stream',
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    });
                    return createReadStream(filePath).pipe(res);
                }
            } catch { /* нет файла — отдадим SPA ниже */ }
        }

        // HTML-маршрут → SPA + OG по slug
        const slug = pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/')[0] || '';
        const template = await getTemplate();
        let body = template;
        if (slug && slug !== 'index.html') {
            const landing = await getLanding(slug);
            body = injectMeta(template, landing, slug);
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' });
        res.end(body);
    } catch {
        res.writeHead(500);
        res.end('Server error');
    }
});

server.listen(PORT, () => console.log(`[clubform] edge server on :${PORT} (api=${API_BASE})`));
