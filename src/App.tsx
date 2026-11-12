import { Suspense, lazy } from 'react'
import LandingPage from './pages/LandingPage'

import './index.css'

// Страница турнира грузится отдельным чанком: стартовый бандл лид-форм не растёт (check:bundle).
const TournamentPage = lazy(() => import('./pages/TournamentPage'))
// Плашка превью ЕРП — только на /__preview, гостю в стартовый чанк не нужна.
const PreviewNote = lazy(() => import('./components/PreviewNote'))
const IS_PREVIEW = window.location.pathname.replace(/\/+$/, '') === '/__preview'

// Токен турнира — 32 hex (trn_tournaments.public_token). Маршрут сверяем ДО вычисления slug формы.
const TOURNAMENT_ROUTE = /^\/t\/([0-9a-f]{32})\/?$/
// Код короткой ссылки канала — тот же формат, что у utm_links.short_code (CHECK в БД).
const LINK_CODE = /^[a-z0-9][a-z0-9-]{0,39}$/

function App() {
  const t = TOURNAMENT_ROUTE.exec(window.location.pathname)
  if (t) {
    return (
      <Suspense fallback={<div className="min-h-screen" />}>
        <TournamentPage token={t[1]} />
      </Suspense>
    )
  }
  // Превью в ЕРП: черновик формы приходит сообщением от мастера, на сервер страница ничего не пишет.
  if (IS_PREVIEW) {
    return (
      <>
        <Suspense fallback={null}><PreviewNote /></Suspense>
        <LandingPage slug="__preview" />
      </>
    )
  }
  // Простой роутинг: /<slug формы> или /<slug формы>/<код канала> — короткая ссылка канала (04.11.2026):
  // метки берутся из сохранённой UTM-ссылки клуба с этим кодом (utm_links.short_code). Неизвестный код — та же форма без меток.
  const parts = window.location.pathname.split('/').filter(Boolean)
  const slug = parts[0] || 'demo'
  const link = parts.length === 2 && LINK_CODE.test(parts[1].toLowerCase()) ? parts[1].toLowerCase() : undefined

  return <LandingPage slug={slug} link={link} />
}

export default App
