import { Suspense, lazy } from 'react'
import LandingPage from './pages/LandingPage'
import './index.css'

// Страница турнира грузится отдельным чанком: стартовый бандл лид-форм не растёт (check:bundle).
const TournamentPage = lazy(() => import('./pages/TournamentPage'))

// Токен турнира — 32 hex (trn_tournaments.public_token). Маршрут сверяем ДО вычисления slug формы.
const TOURNAMENT_ROUTE = /^\/t\/([0-9a-f]{32})\/?$/

function App() {
  const t = TOURNAMENT_ROUTE.exec(window.location.pathname)
  if (t) {
    return (
      <Suspense fallback={<div className="min-h-screen" />}>
        <TournamentPage token={t[1]} />
      </Suspense>
    )
  }
  // Простой роутинг: берём slug из URL path
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
  const slug = path || 'demo'

  return <LandingPage slug={slug} />
}

export default App
