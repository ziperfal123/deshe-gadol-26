import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { StandingsPage } from './pages/StandingsPage'
import { PlayerPage } from './pages/PlayerPage'
import { AnnouncementDialog } from './components/AnnouncementDialog'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AnnouncementDialog />
      <Routes>
        <Route path="/" element={<StandingsPage />} />
        <Route path="/player/:id" element={<PlayerPage />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
