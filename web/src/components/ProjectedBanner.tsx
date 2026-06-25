import type { LeadersFile } from '../types'
import { SPECIAL_LABELS } from '../lib/format'
import { cn } from '../lib/cn'

// The 8 superlative fields included in the projected total, in display order.
const FIELDS = [
  'top_scorer',
  'top_assists',
  'most_goals_group_stage_team',
  'most_conceded_group_stage_team',
  'most_goals_tournament_team',
  'most_conceded_tournament_team',
  'most_cards_team',
  'least_cards_team',
]

function leaderText(field: LeadersFile['fields'][string] | undefined): string {
  if (!field) return ''
  if (!field.live) return 'ממתין לנתונים'
  const names = field.leaders.map((l) => l.name_he ?? l.name ?? l.code).filter(Boolean)
  if (names.length === 0) return '—'
  // On a tie, list ALL leaders — everyone who picked any of them is scored.
  const joined = names.join(', ')
  const tie = names.length > 1 ? ', תיקו' : ''
  // Append the exact value (goals / conceded / cards) when known.
  return field.value != null ? `${joined} (${field.value}${tie})` : `${joined}${tie ? ' (תיקו)' : ''}`
}

/**
 * Shown only in Projected mode: the "not final" disclaimer, an explicit list of
 * the fields included beyond the official score, and the current live leader of each.
 */
export function ProjectedBanner({ leaders }: { leaders?: LeadersFile }) {
  return (
    <div className="mb-3 rounded-2xl border border-sun/50 bg-sun/15 p-3">
      <div className="flex items-center gap-2 text-sm font-bold text-ink">
        <span aria-hidden>⚡</span>
        ניקוד משוער — לא סופי, מתעדכן בכל סנכרון
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink/70">
        מוסיף לניקוד הרשמי נקודות זמניות לפי המובילים הנוכחיים. כל עוד הטורניר נמשך המובילים יכולים להשתנות.
        כולל: ניקוד רשמי + מלך השערים, מלך הבישולים, הכי הרבה/מעט שערים, ספיגות וכרטיסים.
      </p>
      <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {FIELDS.map((key) => {
          const f = leaders?.fields[key]
          const pending = f && !f.live
          return (
            <li key={key} className="flex min-w-0 items-baseline gap-1.5 text-xs">
              <span className="shrink-0 text-ink/55">{SPECIAL_LABELS[key]}:</span>
              <span className={cn('min-w-0', pending ? 'text-ink/35' : 'font-semibold text-ink/80')}>
                {leaderText(f)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
