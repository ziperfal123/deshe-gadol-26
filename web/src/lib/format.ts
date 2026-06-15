import type { PredStatus } from '../types'

/** Hebrew labels for the 12 special bets, keyed by their seed field name. */
export const SPECIAL_LABELS: Record<string, string> = {
  top_scorer: 'מלך השערים',
  best_player: 'השחקן הטוב ביותר',
  top_assists: 'מלך הבישולים',
  most_goals_group_stage_team: 'הכי הרבה שערים (בתים)',
  most_conceded_group_stage_team: 'הכי הרבה ספיגות (בתים)',
  most_goals_tournament_team: 'הכי הרבה שערים (טורניר)',
  most_conceded_tournament_team: 'הכי הרבה ספיגות (טורניר)',
  most_cards_team: 'הכי הרבה כרטיסים',
  least_cards_team: 'הכי מעט כרטיסים',
  total_red_cards: 'סה״כ כרטיסים אדומים',
  total_extra_time: 'סה״כ הארכות',
  total_penalties: 'סה״כ הכרעות פנדלים',
}

/** Hebrew titles for the knockout reach-stages. */
export const STAGE_LABELS: Record<string, string> = {
  round_of_16: 'שמינית גמר',
  quarter_final: 'רבע גמר',
  semi_final: 'חצי גמר',
  final: 'גמר',
}

/** Render a 1/X/2 pick as a short Hebrew-friendly token. */
export function pickLabel(pick: '1' | 'X' | '2'): string {
  if (pick === '1') return '1'
  if (pick === '2') return '2'
  return 'X'
}

/** Format the sync timestamp as a readable Hebrew date-time. */
export function formatSync(iso: string): string {
  try {
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** Tailwind classes per prediction status (correct / wrong / pending). */
export function statusClasses(status: PredStatus): string {
  if (status === 'correct') return 'bg-leaf/15 text-leaf border-leaf/30'
  if (status === 'wrong') return 'bg-clay/15 text-clay border-clay/30'
  return 'bg-ink/5 text-ink/50 border-ink/10'
}
