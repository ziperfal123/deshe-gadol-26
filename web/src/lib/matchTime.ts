import type { GroupItem } from '../types'

export type LiveStatus = 'upcoming' | 'live' | 'awaiting'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

/**
 * Infer a not-yet-scored match's state from its kickoff time vs now:
 * - 'upcoming'  before kickoff
 * - 'live'      from kickoff until 2h after (assumed match window)
 * - 'awaiting'  2h+ after kickoff but the result hasn't synced yet
 */
export function liveStatus(kickoff: string | null | undefined, now: Date = new Date()): LiveStatus {
  if (!kickoff) return 'upcoming'
  const k = new Date(kickoff).getTime()
  const t = now.getTime()
  if (Number.isNaN(k) || t < k) return 'upcoming'
  if (t < k + TWO_HOURS_MS) return 'live'
  return 'awaiting'
}

/**
 * The match id to jump to: a currently-live game if any, otherwise the next
 * upcoming one. Assumes items are in chronological order.
 */
export function findNextMatchId(items: GroupItem[], now: Date = new Date()): string | undefined {
  const unplayed = items.filter((it) => it.actual_score_a === null || it.actual_score_b === null)
  const live = unplayed.find((it) => liveStatus(it.kickoff, now) === 'live')
  if (live) return live.match_id
  return unplayed.find((it) => liveStatus(it.kickoff, now) === 'upcoming')?.match_id
}
