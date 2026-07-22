# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### ⚙️ Инфраструктура

- **Расширенные UTM-метки в аналитике лидов** — `LandingPage`/`api.ts`: добавлены `utm_content` (в VK Рекламе — ID объявления/`banner_id`) и `utm_term` к стандартным `utm_source/medium/campaign`. `utm_source` нормализуется к нижнему регистру (`2gis`/`2GIS` больше не двоятся в отчётах). Дополнительно собираются **сырые метки** `raw_utm` — все query-параметры страницы (ключ ≤64, значение ≤512 символов), чтобы не терять VK/Яндекс-специфичную детализацию, не попадающую в стандартные `utm_*`. Новые поля проброшены в `trackView`, `trackEvent`/`EvtCtx`, `LeadSubmission` (`submitLead`).

---

## [0.3.2] — 2026-07-16 `v0.3.2`

### 🔧 Исправления

- **Кнопка «Открыть приложение» не работала во встроенном браузере клуба** — `SuccessScreen`: клуб открывает лендинг во встроенном **WebView2** (UA `Chrome/119.0.0.0 ... Edg/119.0.0.0` — обнулённые минорные версии выдают embedded-рантайм; 319 сессий в `lead_form_events`). Голый `<a target="_blank">` там мёртв: клик не исполняет ни строки JS, default action уходит хосту запросом нового окна (`NewWindowRequested`), хост молча отклоняет — ни перехода, ни ошибки, ни записи в консоль. При этом обычные `onClick` на тех же машинах живы (294 `cta_click` / 226 `submit_success`), поэтому «шелл ест клики» исключено. Добавлен хелпер `openExternal`: открываем окно из JS (результат различим — `null` = хост отказал) и **только** при явном отказе уходим в текущую вкладку через `location.assign`. Безусловный same-tab не делаем: если шелл режет и навигацию, это снесёт экран успеха (`showSuccess` — state, не роут) при уже выданном подарке. Затронуты обе ссылки — «Открыть приложение» и «Построить маршрут».

### ⚙️ Инфраструктура

- **Инструментация редиректов** — `SuccessScreen`/`LandingPage`: проп `onEvent` (по образцу `LeadForm`), событие `app_redirect_click` с `where: success_app|success_maps`. Раньше клик по этим кнопкам не логировался вообще — теперь гипотеза о блокировке новых окон проверяется удалённо по БД, без выезда в клуб.
- **`active:`-стили** — `SuccessScreen`: на кнопках был только `hover:`, из-за чего гость не видел отклика на нажатие и жал повторно.

### Затронутые файлы

- `src/components/SuccessScreen.tsx`, `src/pages/LandingPage.tsx`

---

## [0.3.1] — 2026-07-11 `v0.3.1`

### 🔧 Исправления

- **Кликабельность кнопок на экране успеха** — `SuccessScreen`: оверлей был `fixed` с центрированием `flex items-center justify-center` и без прокрутки. На вьюпорте ниже высоты контента (версия с подарком ≈600px) нижние кнопки «Построить маршрут»/«Вернуться» уезжали за нижний край и становились недоступны (проявлялось при зуме браузера / масштабе ОС / невысоком окне — «на ноуте ок, на ПК нет»). Оверлей стал `overflow-y-auto` + внутренняя обёртка `min-h-full flex items-center justify-center`: короткий контент центрируется, высокий — скроллится. Дополнительно рендер через `createPortal` в `document.body` (fixed всегда привязан к вьюпорту, не запирается трансформированным родителем) и декоративный glow помечен `pointer-events-none`.

### Затронутые файлы

- `src/components/SuccessScreen.tsx`

---

## [0.3.0] — 2026-07-10 `v0.3.0`

### 🆕 Новое

- **Инструментация лендинга (lead-forms v2)** — сквозная аналитика и пиксели:
  - `api.ts`: `session_id` + `trackEvent` (через `sendBeacon` для `abandon`), `injectPixels` (Метрика / VK / top.mail / Meta / Google по ID, а не сырым скриптом), `fireLeadConversion` (цель `lead` во все подключённые пиксели).
  - `LandingPage`: инжект пикселей + `page_view` на загрузке, события `scroll_depth` (25/50/75/100) и `abandon`, конверсия и события на сабмите, рендер соцссылок (раньше приходили, но не отрисовывались), проброс `ctaText`/`onEvent`.
  - `LeadForm`: события `field_focus`/`field_input`/`cta_click`/`phone_valid` + кастомный текст кнопки.
  - `SuccessScreen`: показ подарка по `giftStatus` (`inventory`/`reserved`/`none`) вместо промокода.

### Затронутые файлы

- `src/utils/api.ts`, `src/pages/LandingPage.tsx`, `src/components/LeadForm.tsx`, `src/components/SuccessScreen.tsx`

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
