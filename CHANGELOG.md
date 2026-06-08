# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

_Нет незадеплоенных изменений._

---

## [0.2.0] — 2026-06-08 `v0.2.0`

### 🆕 Новое

- **Подарок → инвентарь приложения.** На лендинге — карточка подарка («Подарок за регистрацию»), на экране успеха вместо промокода кнопка **«Забрать в приложении»** → deep-link `app.lootarena.ru` с префиллом телефона + `ref=clubform` + UTM. Подарок прицепляется к гостю по телефону при регистрации (бэкенд).
- **Форма упрощена до одного телефона** — `LeadForm`: убраны поля Имя и Telegram. Только номер (по центру, автофокус) → «Забрать оффер» → регистрация в приложении. Минимум трения.
- **A/B-тест офферов** — `LandingPage`: вариант выбирается сервером 50/50, фронт читает `variant`, хранит в `localStorage` (консистентность при перезагрузке) и эхо-передаёт в `submit_lead`/`track_view`.
- **Захват click id** — `yclid/ymclid/gclid/fbclid/_openstat/vk_click_id/erid` из URL шлются в `submit_lead` (для offline-конверсий VK/Яндекс).
- **Кастомное фото лендинга** — `form.coverImage` из `offer_config.cover_image` имеет приоритет над обложкой клуба (и используется в OG-превью).
- **Edge-сервер `server.js`** (Node, zero-dependency) вместо nginx: динамические **OG-теги** (`og:title/description/image`, twitter cards) из `get_landing` для красивых превью ссылок в VK/TG + in-memory кеш landing (TTL 5 мин, разгрузка n8n).

### 🔧 Инфраструктура

- `Dockerfile`: продакшн-стадия nginx → `node server.js` (порт 80). Откат — revert этого коммита.

### Затронутые файлы

- `server.js` (новый), `Dockerfile`, `src/components/LeadForm.tsx`, `src/components/SuccessScreen.tsx`, `src/pages/LandingPage.tsx`, `src/utils/api.ts`

---

## [0.1.0] — 2026-03-20 `v0.1.0`

### 🆕 Новое

- **Адаптивный десктопный layout** — `LandingPage`: двухколоночный grid на экранах ≥1024px (hero-обложка слева sticky, форма справа по центру). Хук `useIsDesktop` через `matchMedia`.
- **Hero-режим обложки** — `ClubHeader`: полноэкранная обложка с gradient overlay, крупная типографика (text-4xl), декоративный glow на десктопе.
- **Apple-стиль инпутов** — `LeadForm`: класс `input-apple` с hover/focus transitions, мягкий ring, увеличенные размеры на ПК (py-4, text-base).
- **Pill-кнопка CTA** — `LeadForm`: класс `btn-apple` с hover scale, внутренний highlight gradient, динамический glow через `boxShadow`.
- **Scale-in анимация** — `SuccessScreen`: `animate-scale-in` вместо slide-up, фоновый glow, glass-light кнопки.
- **Улучшенный glassmorphism** — `index.css`: `blur(40px) saturate(180%)`, утончённые borders `white/8`.
- **Spring-like easing** — все анимации: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Динамический title** — `LandingPage`: `document.title` обновляется из данных клуба.
- **Apple мета-теги** — `index.html`: theme-color, apple-mobile-web-app-capable, lang=ru.

### Затронутые файлы

`index.html`, `src/index.css`, `src/pages/LandingPage.tsx`, `src/components/ClubHeader.tsx`, `src/components/OfferCard.tsx`, `src/components/LeadForm.tsx`, `src/components/SuccessScreen.tsx`
