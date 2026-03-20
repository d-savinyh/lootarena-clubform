# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

_Нет незадеплоенных изменений._

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
