import type { CustomGroup } from '../types'
import { cn } from '../lib/cn'

interface GroupViewBarProps {
  groups: CustomGroup[]
  activeView: string
  onSelect: (view: string) => void
  onCreate: () => void
}

/** Horizontally-scrollable pills to switch between "all" and custom group views. */
export function GroupViewBar({ groups, activeView, onSelect, onCreate }: GroupViewBarProps) {
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      <Pill label="כל המשתתפים" active={activeView === 'all'} onClick={() => onSelect('all')} />
      {groups.map((g) => (
        <Pill key={g.id} label={g.name} active={activeView === g.id} onClick={() => onSelect(g.id)} />
      ))}
      <button
        onClick={onCreate}
        className="shrink-0 whitespace-nowrap rounded-full border border-dashed border-ink/25 px-3.5 py-1.5 text-sm font-bold text-ink/55 transition hover:border-leaf hover:text-leaf"
      >
        ➕ קבוצה
      </button>
    </div>
  )
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition',
        active ? 'bg-leaf font-bold text-white shadow-soft' : 'bg-ink/5 font-medium text-ink/60 hover:bg-ink/10',
      )}
    >
      {label}
    </button>
  )
}
