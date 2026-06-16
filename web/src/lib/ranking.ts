import type { StandingsRow } from '../types'

/**
 * Dense-rank a subset of standings (equal scores share a position, ranks ascend
 * 1,2,3 with no gaps). Sorted by points desc, correct_group desc, name asc.
 * Returns new rows with recomputed `rank`/`tied` (used for custom group views).
 */
export function rankStandings(rows: StandingsRow[]): StandingsRow[] {
  const sorted = [...rows].sort(
    (a, b) =>
      b.total_points - a.total_points ||
      b.correct_group - a.correct_group ||
      a.name.localeCompare(b.name, 'he'),
  )
  const scoreKey = (r: StandingsRow) => `${r.total_points}|${r.correct_group}`
  const counts = new Map<string, number>()
  for (const r of sorted) counts.set(scoreKey(r), (counts.get(scoreKey(r)) ?? 0) + 1)

  let rank = 0
  let prevKey: string | undefined
  return sorted.map((r) => {
    const key = scoreKey(r)
    if (key !== prevKey) {
      rank += 1
      prevKey = key
    }
    return { ...r, rank, tied: (counts.get(key) ?? 0) > 1 }
  })
}
