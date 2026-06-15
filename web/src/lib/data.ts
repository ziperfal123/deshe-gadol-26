import type { MatchStatsFile, PlayerFile, Standings } from '../types'

const base = import.meta.env.BASE_URL

/** Fetch the computed standings written by the recompute job. */
export async function fetchStandings(): Promise<Standings> {
  const res = await fetch(`${base}data/standings.json`)
  if (!res.ok) throw new Error('failed to load standings')
  return res.json()
}

/** Fetch a single player's full prediction breakdown. */
export async function fetchPlayer(id: string): Promise<PlayerFile> {
  const res = await fetch(`${base}data/players/${id}.json`)
  if (!res.ok) throw new Error('failed to load player')
  return res.json()
}

/** Fetch the global crowd split (how all players guessed each match). */
export async function fetchMatchStats(): Promise<MatchStatsFile> {
  const res = await fetch(`${base}data/match_stats.json`)
  if (!res.ok) throw new Error('failed to load match stats')
  return res.json()
}
