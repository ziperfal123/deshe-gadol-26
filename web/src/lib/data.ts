import type { ChampionPointsFile, GroupsFile, LeadersFile, MatchStatsFile, MatchVoters, PlayerFile, ProjectedStandings, SpecialStatsFile, Standings, StatsFile } from '../types'

const base = import.meta.env.BASE_URL

// In-memory cache so navigating back to a page doesn't refetch and re-flash the
// loading state. `peek` lets a page initialise its state synchronously from the
// cache (no "loading" flicker on revisit).
const cache = new Map<string, unknown>()

async function getJson<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T
  const res = await fetch(`${base}${path}`)
  if (!res.ok) throw new Error(`failed to load ${path}`)
  const data = (await res.json()) as T
  cache.set(path, data)
  return data
}

function peek<T>(path: string): T | undefined {
  return cache.get(path) as T | undefined
}

/** Fetch the computed standings written by the recompute job. */
export const fetchStandings = () => getJson<Standings>('data/standings.json')
export const peekStandings = () => peek<Standings>('data/standings.json')

/** Fetch the PROJECTED standings (official + provisional superlative points). */
export const fetchProjectedStandings = () => getJson<ProjectedStandings>('data/standings_projected.json')
export const peekProjectedStandings = () => peek<ProjectedStandings>('data/standings_projected.json')

/** Fetch the current live leaders per superlative field (for "מוביל כעת"). */
export const fetchLeaders = () => getJson<LeadersFile>('data/leaders.json')
export const peekLeaders = () => peek<LeadersFile>('data/leaders.json')

/** Fetch a single player's full prediction breakdown. */
export const fetchPlayer = (id: string) => getJson<PlayerFile>(`data/players/${id}.json`)

/** Fetch the global crowd split (how all players guessed each match). */
export const fetchMatchStats = () => getJson<MatchStatsFile>('data/match_stats.json')

/** Fetch the per-match voter lists (who picked each outcome). Loaded on demand. */
export const fetchMatchVoters = (matchId: string) => getJson<MatchVoters>(`data/match_voters/${matchId}.json`)

/** Fetch the crowd split for special bets + champion (top choices each). */
export const fetchSpecialStats = () => getJson<SpecialStatsFile>('data/special_stats.json')

/** Fetch the group rosters (4 teams per group). */
export const fetchGroups = () => getJson<GroupsFile>('data/groups.json')

/** Fetch the full aggregate statistics across all guesses. */
export const fetchStats = () => getJson<StatsFile>('data/stats.json')
export const peekStats = () => peek<StatsFile>('data/stats.json')

/** Fetch the champion scoring table (team → points). */
export const fetchChampionPoints = () => getJson<ChampionPointsFile>('data/champion_points.json')
export const peekChampionPoints = () => peek<ChampionPointsFile>('data/champion_points.json')
