import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'

const TABS = [
  { to: '/', label: 'טבלה', end: true },
  { to: '/stats', label: 'סטטיסטיקות', end: false },
]

/** Shared top navigation between the standings table and the statistics page. */
export function NavTabs() {
  return (
    <div className="mt-1 flex justify-center">
      <div className="inline-flex rounded-2xl bg-ink/5 p-1">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-4 py-1.5 text-sm transition',
                isActive ? 'bg-white font-bold text-ink shadow-soft' : 'font-medium text-ink/50 hover:text-ink/70',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
