---
description: Контекст проекта ClubForm — стек, архитектура, API.
---

# ClubForm — Лид-формы для компьютерных клубов

## Стек

- **Frontend**: Vite + React + TypeScript + Tailwind CSS 4
- **Backend**: n8n webhooks + PostgreSQL
- **Деплой**: Dokploy (отдельный от ERP)

## Архитектура

- Публичное SPA: `/:slug` — мини-лендинг с формой записи
- Бэкенд: n8n webhook `POST /public/clubform`
- ERP интеграция: `POST /app/clubform` (авторизованный)

## Ключевые API

### PUBLIC - ClubForm Landing (без Auth)

- `get_landing` — данные клуба + оффер по slug
- `submit_lead` — отправка заявки + промокод CF-XXXXXX
- `track_view` — трекинг просмотра

### APP - ClubForm ERP API (Header Auth)

- `list_forms` — список форм клуба с метриками
- `create_form` — создать форму
- `get_stats` — аналитика: KPI + UTM
- `list_submissions` — заявки
- `update_status` — изменить статус лида
- `toggle_form` — вкл/выкл форму

## Таблицы PostgreSQL

- `lead_forms` — формы клубов (slug, offer, brand)
- `lead_form_submissions` — заявки (лиды)
- `lead_form_views` — просмотры для аналитики

## Связь с ERP

- Управление формами: `erp-lootarena` → `ERPLeadForms.tsx`
- Родительский проект: `/Users/daniilsavinykh/Documents/Antigravity/erp-lootarena`
