import type { CrowdStat } from '../types'

/**
 * Info icon that, on hover/focus, shows the top-3 crowd choices for a bet:
 * rank, value, and "count/total (pct%)".
 */
export function StatTooltip({ stat }: { stat?: CrowdStat }) {
  if (!stat || stat.top.length === 0) return <></>
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label="פילוח בחירות"
        className="flex h-4 w-4 items-center justify-center text-ink/35 transition hover:text-leaf"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 7.5h.01" />
        </svg>
      </button>
      <div className="invisible absolute left-0 top-full z-30 mt-2 w-64 rounded-2xl border border-ink/10 bg-white p-3 text-right opacity-0 shadow-soft transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="mb-2 text-[11px] font-bold text-ink/45">הבחירות הפופולריות ({stat.total} משתתפים)</div>
        <ol className="space-y-1.5">
          {stat.top.map((choice, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span className="w-5 shrink-0 font-bold text-leaf">#{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-ink">{choice.value}</span>
              <span className="shrink-0 text-ink/50">
                {choice.count}/{stat.total} ({choice.pct}%)
              </span>
            </li>
          ))}
        </ol>
      </div>
    </span>
  )
}
