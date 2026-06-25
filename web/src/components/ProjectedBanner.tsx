import type { LeadersFile } from '../types'
import { cn } from '../lib/cn'

// Short labels (the full ones live in SPECIAL_LABELS) — compact enough for the
// sticky 2-column grid on mobile without squeezing the leader value.
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
 * Shown only in Projected mode (sticky under the header): a warm gradient bar that
 * keeps users aware they're viewing provisional points, plus the included fields
 * and each one's current live leader. Compact + responsive for mobile.
 */
export function ProjectedBanner({ leaders }: { leaders?: LeadersFile }) {
  return (
    <div className="mb-2 mx-auto max-w-md overflow-hidden rounded-2xl border border-clay/40 shadow-soft">
      <div className="flex items-center justify-center gap-1.5 bg-gradient-to-l from-clay to-sun px-3 py-1.5 text-center text-[12px] font-extrabold text-ink sm:text-[13px]">
        <span aria-hidden>⚡</span>
        ניקוד משוער · לא סופי
        <span className="hidden sm:inline"> · מתעדכן בכל סנכרון</span>
      </div>
      <div className="bg-sun/10 px-3 py-2">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
          {FIELDS.map(({ key, label }) => {
            const f = leaders?.fields[key]
            const pending = f && !f.live
            return (
              <li key={key} className="flex min-w-0 items-baseline justify-center gap-1.5 text-[10px] leading-tight sm:text-[11px]">
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
