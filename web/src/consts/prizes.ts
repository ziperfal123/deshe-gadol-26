/** Prize pot payouts by final rank (₪). Places 1-5 share the pot; last place has a special consolation. */
export const PRIZES_BY_RANK: Record<number, number> = {
  1: 2920,
  2: 1825,
  3: 1460,
  4: 730,
  5: 365,
}

/** Special consolation prize for the very last player (₪). */
export const LAST_PLACE_PRIZE = 50

/** How many prize-winning places there are at the top. */
export const PRIZE_PLACES = 5

/** Number of times the winner celebration auto-opens before it stops nagging. */
export const CELEBRATION_MAX_VIEWS = 3
