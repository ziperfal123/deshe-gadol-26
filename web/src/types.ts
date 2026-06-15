export type PredStatus = 'correct' | 'wrong' | 'pending'

export interface StandingsRow {
  rank: number
  player_id: string
  name: string
  total_points: number
  correct_group: number
}

export interface Standings {
  synced_at: string
  players_played: number
  standings: StandingsRow[]
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
}

export interface SpecialPick {
  key: string
  value: string | number | undefined
  points_if_correct: number
  status: PredStatus
  points: number
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
}
