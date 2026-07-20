/** A single podium finisher in a past tournament. */
export interface HistoryFinisher {
  place: 1 | 2 | 3
  name: string
  /** Prize money in NIS, when the data is available. */
  prize?: number
}

/** One tournament and its top-3 podium. */
export interface HistoryTournament {
  id: string
  title: string
  /** Host / location line shown under the title. */
  host: string
  emoji: string
  podium: HistoryFinisher[]
  /** The in-progress tournament: podium is not decided yet (shown as question marks). */
  pending?: boolean
}

/**
 * Tournament podiums, newest first. The first entry is the current, still-running
 * edition (undecided). Read-only reference data; unrelated to the live 2026 scoring.
 */
export const HISTORY_TOURNAMENTS: HistoryTournament[] = [
  {
    id: 'mondial-2026',
    title: 'מונדיאל 2026',
    host: 'קנדה · מקסיקו · ארה״ב',
    emoji: '⚽',
    podium: [
      { place: 1, name: 'שיי גרינברג', prize: 2920 },
      { place: 2, name: 'שקד טבצ׳ניק', prize: 1825 },
      { place: 3, name: 'יניב סיפרפאל', prize: 1460 },
    ],
  },
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
    emoji: '💰',
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
      { place: 2, name: 'נועם דוכס', prize: 937 },
      { place: 3, name: 'ניר גרוס', prize: 562 },
    ],
  },
]
