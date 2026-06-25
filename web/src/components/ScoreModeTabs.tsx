import type { ScoreMode } from '../types'
import { cn } from '../lib/cn'

const MODES: { id: ScoreMode; label: string; icon: string }[] = [
  { id: 'official', label: 'ניקוד רשמי', icon: '🏆' },
  { id: 'projected', label: 'ניקוד משוער', icon: '⚡' },
]

/**
 * Segmented control switching the standings between the Official (SSOT) total
 * and the live Projected total. Styled distinctly from the nav tabs: a pill with
 * icons, a clean white "official" state and a warm gradient "projected" state,
 * so the two rows aren't mistaken for one another.
 */
export function ScoreModeTabs({ mode, onChange }: { mode: ScoreMode; onChange: (m: ScoreMode) => void }) {
  return (
    <div className="mt-2 flex justify-center">
      <div className="inline-flex gap-1 rounded-full bg-ink/5 p-1 ring-1 ring-ink/10">
        {MODES.map((m) => {
          const active = mode === m.id
          const activeCls =
            m.id === 'projected'
              ? 'bg-gradient-to-l from-sun to-clay font-extrabold text-ink shadow-soft'
              : 'bg-white font-bold text-ink shadow-soft'
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm transition',
                active ? activeCls : 'font-medium text-ink/50 hover:text-ink/70',
              )}
            >
              <span aria-hidden>{m.icon}</span>
              {m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
