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
 * - `vertical` (desktop sidebar): a single-column box pinned beside the table. By
 *   default each field is stacked (label over value); when `compact` (short screens)
 *   each field collapses to one line so the box stays short and clears the header.
 */
export function ProjectedBanner({
  leaders,
  vertical = false,
  compact = false,
}: {
  leaders?: LeadersFile
  vertical?: boolean
  compact?: boolean
}) {
  const stacked = vertical && !compact // label-over-value layout (tall)
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
            ? cn('flex flex-col px-4 text-center', compact ? 'py-2' : 'py-3')
            : 'flex items-center justify-center gap-1.5 px-3 py-1.5 text-center text-[12px] sm:text-[13px]',
        )}
      >
        {vertical ? (
          <>
            <span className={compact ? 'text-[14px]' : 'text-[16px]'}>
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
      <div className={cn('bg-sun/10', vertical ? cn('px-3', compact ? 'py-2' : 'py-4') : 'px-3 py-2')}>
        <ul className={cn('grid', vertical ? (compact ? 'grid-cols-1 gap-y-1.5' : 'grid-cols-1 gap-y-4') : 'grid-cols-2 gap-x-4 gap-y-1')}>
          {FIELDS.map(({ key, label }) => {
            const f = leaders?.fields[key]
            const pending = f && !f.live
            return (
              <li
                key={key}
                className={cn(
                  'min-w-0 leading-tight',
                  stacked ? 'flex flex-col items-center gap-0.5 text-center' : 'flex items-baseline justify-center gap-1.5',
                  !vertical && 'text-[10px] sm:text-[11px]',
                  vertical && compact && 'text-[12px]',
                )}
              >
                <span className={cn('text-ink/55', stacked ? 'text-[11px]' : 'shrink-0')}>
                  {label}
                  {stacked ? '' : ':'}
                </span>
                <span
                  className={cn(
                    pending ? 'font-medium text-ink/55' : 'font-semibold text-ink',
                    stacked ? 'text-[13px] break-words' : 'min-w-0 truncate',
                  )}
                >
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
