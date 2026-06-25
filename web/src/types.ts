export type PredStatus = 'correct' | 'wrong' | 'pending'

export interface StandingsRow {
  rank: number
  player_id: string
  name: string
  total_points: number
  correct_group: number
  /** true when this row shares its score with others (tie-break is a placeholder for now). */
  tied?: boolean
  /** projected mode only: provisional superlative points and the SSOT total. */
  extra_points?: number
  official_total?: number
}

export interface Standings {
  synced_at: string
  players_played: number
  standings: StandingsRow[]
}

export type ScoreMode = 'official' | 'projected'

export interface ProjectedRow {
  rank: number
  player_id: string
  name: string
  official_total: number
  projected_total: number
  correct_group: number
  extra_points: number
  tied?: boolean
}

export interface ProjectedStandings {
  synced_at: string
  players_played: number
  included_fields: string[]
  api_state: string
  standings: ProjectedRow[]
}

export interface LeaderEntry {
  name?: string
  code?: string
  name_he?: string
}

export interface LeaderField {
  kind: 'player' | 'team'
  points: number
  live: boolean
  value: number | null
  leaders: LeaderEntry[]
  state?: string
}

export interface LeadersFile {
  synced_at: string
  fields: Record<string, LeaderField>
}

export interface ProjectedField {
  key: string
  value: string | number | undefined
  points_if_correct: number
  leader: boolean
  points: number
  status: 'leading' | 'trailing' | 'pending'
}

export interface ProjectedBreakdown {
  official_total: number
  projected_total: number
  extra_points: number
  fields: ProjectedField[]
}

/** A user-defined view: a named subset of players, stored in localStorage. */
export interface CustomGroup {
  id: string
  name: string
  playerIds: string[]
}

export interface GroupItem {
  match_id: string
  order: number | null
  group: string | null
  kickoff: string | null
  home_code: string | null
  away_code: string | null
  home_he: string | null
  away_he: string | null
  pick_1x2: '1' | 'X' | '2'
  my_score_a: number
  my_score_b: number
  actual_score_a: number | null
  actual_score_b: number | null
  status: PredStatus
  points: number
}

export interface AdvGroupPick {
  team_he: string
  team_code?: string
  group?: string
  position?: number
  status: PredStatus
  points: number
}

export interface AdvStagePick {
  team_he: string
  team_code?: string
  points_if_correct: number
  status: PredStatus
  points: number
}

export interface Advancement {
  group_stage: AdvGroupPick[]
  round_of_16: AdvStagePick[]
  quarter_final: AdvStagePick[]
  semi_final: AdvStagePick[]
  final: AdvStagePick[]
}

export interface ChampionPick {
  team_he?: string
  team_code?: string
  points_if_correct?: number
  status: PredStatus
  points: number
  crowd?: { count: number; total: number; pct: number }
}

export interface SpecialPick {
  key: string
  value: string | number | undefined
  points_if_correct: number
  status: PredStatus
  points: number
}

export interface MatchPickStats {
  counts: { '1': number; X: number; '2': number }
  pct: { '1': number; X: number; '2': number }
  total: number
}

export interface MatchStatsFile {
  synced_at: string
  matches: Record<string, MatchPickStats>
}

export type ViewMode = 'standard' | 'detailed'

export interface GroupTeam {
  code: string
  name_he: string
}

export interface GroupsFile {
  groups: Record<string, GroupTeam[]>
}

/** One of the top choices for a bet, with how many picked it. */
export interface StatChoice {
  value: string
  count: number
  pct: number
  code?: string
}

export interface Distribution {
  total: number
  dist: StatChoice[]
}

export interface GroupHighlight {
  home_he: string | null
  away_he: string | null
  home_code: string | null
  away_code: string | null
  group: string | null
  dominant_pct: number
  dominant_pick: '1' | 'X' | '2' | null
}

export interface ChampionPointsFile {
  range: [number, number]
  teams: { code: string; name_he: string; points: number }[]
}

export interface StatsFile {
  synced_at: string
  total_players: number
  champion: Distribution
  specials: Record<string, Distribution>
  advancement: Record<string, Distribution>
  group: { most_consensus: GroupHighlight[]; most_split: GroupHighlight[] }
}

/** Crowd split for a single bet: total respondents + the top choices. */
export interface CrowdStat {
  total: number
  top: StatChoice[]
}

export interface SpecialStatsFile {
  synced_at: string
  total_players: number
  specials: Record<string, CrowdStat>
  champion: CrowdStat
}

/** Per-match lists of player names who picked each outcome. */
export interface MatchVoters {
  '1': string[]
  X: string[]
  '2': string[]
}

export interface PlayerFile {
  player_id: string
  name: string
  total_points: number
  correct_group: number
  synced_at: string
  group_stage: GroupItem[]
  advancement: Advancement
  champion: ChampionPick
  specials: SpecialPick[]
  projected?: ProjectedBreakdown
}
