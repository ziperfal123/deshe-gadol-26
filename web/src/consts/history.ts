/** A single podium finisher in a past tournament. */
export interface HistoryFinisher {
  place: 1 | 2 | 3
  name: string
  /** Prize money in NIS, when the data is available. */
  prize?: number
}

/** One past tournament and its top-3 podium. */
export interface HistoryTournament {
  id: string
  title: string
  /** Host / location line shown under the title. */
  host: string
  emoji: string
  podium: HistoryFinisher[]
}

/**
 * Historic winners of previous editions, newest first.
 * Read-only reference data; unrelated to the live 2026 scoring.
 */
export const HISTORY_TOURNAMENTS: HistoryTournament[] = [
  {
    id: 'euro-2024',
    title: 'יורו 2024',
    host: 'גרמניה',
    emoji: '🇩🇪',
    podium: [
      { place: 1, name: 'רז אורן' },
      { place: 2, name: 'רז קנר' },
      { place: 3, name: 'תום דרזיה' },
    ],
  },
  {
    id: 'mondial-2022',
    title: 'מונדיאל 2022',
    host: 'קטאר',
    emoji: '🏜️',
    podium: [
      { place: 1, name: 'רועי לובל', prize: 2385 },
      { place: 2, name: 'שקד טבצ׳ניק', prize: 1325 },
      { place: 3, name: 'חן לב', prize: 795 },
    ],
  },
  {
    id: 'euro-2021',
    title: 'יורו 2021',
    host: 'אירופה',
    emoji: '🏆',
    podium: [
      { place: 1, name: 'עומר כהן', prize: 1500 },
      { place: 2, name: 'נועם דוכם', prize: 937 },
      { place: 3, name: 'ניר גרוס', prize: 562 },
    ],
  },
]
