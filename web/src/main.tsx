import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { StandingsPage } from './pages/StandingsPage'
import { PlayerPage } from './pages/PlayerPage'
import { StatsPage } from './pages/StatsPage'
import { RulesPage } from './pages/RulesPage'
import { HistoryPage } from './pages/HistoryPage'
// AnnouncementDialog is intentionally not rendered for now (kept for future use).
// import { AnnouncementDialog } from './components/AnnouncementDialog'
import { ScrollToTopButton } from './components/ScrollToTopButton'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<StandingsPage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
      <ScrollToTopButton />
    </HashRouter>
  </StrictMode>,
)
