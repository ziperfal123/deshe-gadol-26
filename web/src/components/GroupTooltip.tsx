import type { GroupTeam } from '../types'
import { teamFlag } from '../lib/flags'
import { cn } from '../lib/cn'

interface GroupTooltipProps {
  group: string | null
  teams?: GroupTeam[]
  label: string
  triggerClassName: string
}

/**
 * Hover/focus the group letter to see the group's teams in a 2x2 grid (the grid
 * layout makes clear it is NOT the standings order).
 */
export function GroupTooltip({ group, teams, label, triggerClassName }: GroupTooltipProps) {
  return (
    <span className="group relative inline-flex">
      <button type="button" className={cn(triggerClassName, 'cursor-help')}>
        {label}
      </button>
      {renderPanelIfNeeded(group, teams)}
    </span>
  )
}

function renderPanelIfNeeded(group: string | null, teams?: GroupTeam[]) {
  if (!group || !teams?.length) return <></>
  return (
    <div className="invisible absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-ink/10 bg-white p-3 text-right opacity-0 shadow-soft transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
      <div className="mb-2 text-[11px] font-bold text-ink/45">בית {group}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {teams.map((t) => (
          <span key={t.code} className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <span aria-hidden>{teamFlag(t.code)}</span>
            <span className="truncate">{t.name_he}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
