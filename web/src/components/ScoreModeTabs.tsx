import type { ScoreMode } from '../types'
import { cn } from '../lib/cn'

const MODES: { id: ScoreMode; label: string }[] = [
  { id: 'official', label: 'ניקוד רשמי' },
  { id: 'projected', label: 'ניקוד משוער' },
]

/**
 * Segmented control switching the standings between the Official (SSOT) total
 * and the live Projected total (official + provisional superlative points).
 */
export function ScoreModeTabs({ mode, onChange }: { mode: ScoreMode; onChange: (m: ScoreMode) => void }) {
  return (
    <div className="mt-2 flex justify-center">
      <div className="inline-flex rounded-2xl bg-ink/5 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={cn(
              'rounded-xl px-4 py-1.5 text-sm transition',
              mode === m.id ? 'bg-white font-bold text-ink shadow-soft' : 'font-medium text-ink/50 hover:text-ink/70',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
