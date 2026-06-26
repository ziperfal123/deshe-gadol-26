import type { LeadersFile } from '../types'
import { cn } from '../lib/cn'

// Short labels (the full ones live in SPECIAL_LABELS) — compact enough for the
// sticky grid without squeezing the leader value.
const FIELDS: { key: string; label: string }[] = [
  { key: 'top_scorer', label: 'מלך השערים' },
  { key: 'top_assists', label: 'מלך הבישולים' },
  { key: 'most_goals_group_stage_team', label: 'שערים (בתים)' },
  { key: 'most_conceded_group_stage_team', label: 'ספיגות (בתים)' },
  { key: 'most_goals_tournament_team', label: 'שערים (טורניר)' },
  { key: 'most_conceded_tournament_team', label: 'ספיגות (טורניר)' },
  { key: 'most_cards_team', label: 'הרבה כרטיסים' },
  { key: 'least_cards_team', label: 'מעט כרטיסים' },
]

function leaderText(field: LeadersFile['fields'][string] | undefined): string {
  if (!field) return '…'
  if (!field.live) return 'לא זמין'
  const names = field.leaders.map((l) => l.name_he ?? l.name ?? l.code).filter(Boolean)
  if (names.length === 0) return '—'
  // On a tie, list ALL leaders — everyone who picked any of them is scored.
  const joined = names.join(', ')
  const tie = names.length > 1 ? ', תיקו' : ''
  return field.value != null ? `${joined} (${field.value}${tie})` : `${joined}${tie ? ' (תיקו)' : ''}`
}

/**
 * Projected-mode call-out: keeps users aware they're viewing provisional points,
 * lists the included fields and each one's current live leader.
 * - default (mobile): a compact horizontal box that sits in the sticky header area.
 * - `vertical` (desktop sidebar): a roomy single-column box pinned beside the table.
 */
export function ProjectedBanner({ leaders, vertical = false }: { leaders?: LeadersFile; vertical?: boolean }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-clay/40 shadow-soft',
        vertical ? '' : 'mb-2 mx-auto max-w-md',
      )}
    >
      <div
        className={cn(
          'bg-gradient-to-l from-clay to-sun font-extrabold text-ink',
          vertical
            ? 'flex flex-col px-4 py-3 text-center'
            : 'flex items-center justify-center gap-1.5 px-3 py-1.5 text-center text-[12px] sm:text-[13px]',
        )}
      >
        {vertical ? (
          <>
            <span className="text-[16px]">
              <span aria-hidden>⚡</span> ניקוד משוער
            </span>
            <span className="mt-0.5 text-[11px] font-bold opacity-90">לא סופי · מתעדכן בכל סנכרון</span>
          </>
        ) : (
          <>
            <span aria-hidden>⚡</span>
            ניקוד משוער · לא סופי
            <span className="hidden sm:inline"> · מתעדכן בכל סנכרון</span>
          </>
        )}
      </div>
      <div className={cn('bg-sun/10', vertical ? 'px-4 py-4' : 'px-3 py-2')}>
        <ul className={cn('grid', vertical ? 'grid-cols-1 gap-y-3' : 'grid-cols-2 gap-x-4 gap-y-1')}>
          {FIELDS.map(({ key, label }) => {
            const f = leaders?.fields[key]
            const pending = f && !f.live
            return (
              <li
                key={key}
                className={cn(
                  'flex min-w-0 items-baseline gap-1.5 leading-tight',
                  vertical ? 'justify-between text-[13px]' : 'justify-center text-[10px] sm:text-[11px]',
                )}
              >
                <span className="shrink-0 text-ink/55">{label}:</span>
                <span className={cn('min-w-0 truncate', pending ? 'font-medium text-ink/55' : 'font-semibold text-ink')}>
                  {leaderText(f)}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
