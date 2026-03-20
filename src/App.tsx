import LandingPage from './pages/LandingPage'
import './index.css'

function App() {
  // Простой роутинг: берём slug из URL path
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '')
  const slug = path || 'demo'

  return <LandingPage slug={slug} />
}

export default App
