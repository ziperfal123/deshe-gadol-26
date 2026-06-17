import type { CustomGroup } from '../types'
import { cn } from '../lib/cn'

interface GroupViewBarProps {
  groups: CustomGroup[]
  activeView: string
  onSelect: (view: string) => void
  onCreate: () => void
}

/** Switch between "all" and custom group views. The create button sits at the
 * start (next to "all") and outside the scrollable pills, so its tooltip is
 * not clipped by the horizontal scroll. */
export function GroupViewBar({ groups, activeView, onSelect, onCreate }: GroupViewBarProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Pill label="כל המשתתפים" active={activeView === 'all'} onClick={() => onSelect('all')} />
      {groups.map((g) => (
        <Pill key={g.id} label={g.name} active={activeView === g.id} onClick={() => onSelect(g.id)} />
      ))}
      <div className="group relative shrink-0">
        <button
          onClick={onCreate}
          className="whitespace-nowrap rounded-full border border-dashed border-ink/25 px-3.5 py-1.5 text-sm font-bold text-ink/55 transition hover:border-leaf hover:text-leaf"
        >
          ➕ קבוצה
        </button>
        <div className="invisible absolute bottom-full left-0 z-30 mb-2 w-56 rounded-2xl border border-ink/10 bg-white p-3 text-right text-xs leading-relaxed text-ink/70 opacity-0 shadow-soft transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
          טבלה משלכם, רק עם החברים שתבחרו. נשמרת אצלכם בלבד. 👀
        </div>
      </div>
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
