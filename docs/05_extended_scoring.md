# 05 — Extended Scoring (Special-Bet Superlatives) + Official vs Projected views

**Status:** spec for implementation. **Decided:** auto-score the 8 stat-derivable superlative bets; show them only in a separate **Projected** view, keeping the **Official** view as the SSOT.

## 1. Why two views

The existing standings are the **Single Source of Truth (Official)**: they only reflect things that are *finally determined* — group-stage 1X2 of games already played (and, later, finalized advancement). They never move on guesses that aren't settled yet.

The superlative bets (top scorer, etc.) have a *current leader* at any moment, but the real winner is only known at tournament end. So we surface them in a **Projected (live)** view that adds provisional points based on the current leaders, clearly labeled "לא סופי — מתעדכן בכל סנכרון" (not final — updates each sync). Each view must explicitly list which fields it includes.

## 2. Fields in scope (8 — all auto-scored in Projected)

| Field (data key) | Hebrew | Points | Live source |
|---|---|---|---|
| `top_scorer` | מלך השערים | 20 | openfootball goal events (count goals; in-game penalties count, shootout goals excluded) |
| `top_assists` | מלך הבישולים | 15 | **API-Football** `players/topassists` |
| `most_goals_group_stage_team` | הכי הרבה שערים (בתים) | 10 | openfootball — sum goals-for over **group** matches |
| `most_conceded_group_stage_team` | הכי הרבה ספיגות (בתים) | 10 | openfootball — sum goals-against over **group** matches |
| `most_goals_tournament_team` | הכי הרבה שערים (טורניר) | 10 | openfootball — sum goals-for over **all** matches |
| `most_conceded_tournament_team` | הכי הרבה ספיגות (טורניר) | 10 | openfootball — sum goals-against over **all** matches |
| `most_cards_team` | הכי הרבה כרטיסים | 10 | **API-Football** — team yellow+red aggregated |
| `least_cards_team` | הכי מעט כרטיסים | 10 | **API-Football** — team yellow+red aggregated |

**Tie rule (from game rules):** if several leaders tie on the leading value, **every** player who picked **any** of the tied leaders gets the full points.

## 3. Fields explicitly OUT of auto-scoring

- **Exact-number bets** — `total_red_cards` (8), `total_extra_time` (5), `total_penalties` (5): resolved by exact match at tournament end only. Stay manual; not in the Projected view's live logic (can be shown as "pending").
- **`best_player` (השחקן המצטיין, 20):** subjective FIFA award, no live stat → **manual**, resolved at tournament end.

## 4. Data sources

- **Existing results feed** (ESPN primary / openfootball fallback — see `CLAUDE.md` §6): team goals-for/against (group & tournament) compute from the match scores we already ingest — **no extra fetch**. Top scorer needs goal-scorer events: openfootball exposes them under `goals1/goals2` (verified — every already-scored pick matches after accent-normalization); if ESPN's scoreboard exposes scoring plays, reuse those instead. Either way, normalize feed player names and match via `player_alias.json`.
- **API-Football** (api-sports.io), **free tier**: `X-Apisports-Key` header, **100 req/day, 10/min** (resets 00:00 UTC). Provides WC2026 `topassists` and card data. Key stored as GitHub secret `APIFOOTBALL_KEY`.
  - **Request budget:** at 3 syncs/day we have ~33 calls/sync. Plan: 1 call for `topassists`; for team cards either `teams/statistics` per team or aggregate `fixtures/events?type=Card` for finished fixtures **with caching** (only fetch a fixture's events once, then store). Cache aggregates in `data/public/` so we never re-pull settled fixtures. Stay well under 100/day.
  - Resolve the WC2026 `league` id + `season` once at setup.

## 5. Name / team matching

- **Players** (`top_scorer`, `top_assists`): picks are Hebrew. Use `data/seed/player_alias.json` (`Hebrew → canonical Latin`). **Accent-normalize both sides** (NFD, strip combining marks, lowercase) before comparing to feed names. Verified: every already-scored pick matches openfootball exactly after normalization. `unmatched_intentional` (e.g. the joke pick) never resolves → 0 pts, by design.
- **Teams** (goals/cards bets): picks are Hebrew team names → map via `teams.json` (`name_he` → `code`); match feed teams via `name_en` / `name_en_aliases`. Already 48/48.

## 6. Per-sync algorithm (runs inside the cron job)

1. Compute **Official** scoring as today (group 1X2 of played games; finalized advancement later).
2. Build live leader sets:
   - `top_scorer_leaders` = player(s) with max goals (openfootball).
   - `top_assists_leaders` = player(s) with max assists (API-Football).
   - team leaders for the 4 goals bets (openfootball, group vs tournament scope) and 2 card bets (API-Football). Each is a **set** (handles ties).
3. For each player, for each in-scope field: if their (normalized) pick ∈ the leader set, add that field's points.
4. **Projected total = Official total + sum of awarded superlative points.**
5. Write outputs (see §7). Recompute from scratch each run (idempotent); leaders can change between syncs — that's expected and why it's labeled provisional.

## 7. Output contract (additions to `data/public/`)

- `standings.json` stays the **Official** ranking (unchanged contract).
- Add `standings_projected.json` — same shape, with `projected_total`, `official_total`, and a `breakdown` of which superlative fields each player currently earns.
- Add `leaders.json` — current leader set + leading value per field (so the UI can show "מוביל כעת: …"), plus `synced_at`.
- `players/<id>.json` gains a `projected` section mirroring the breakdown.

## 8. UI — two tabs

- **Tab 1 — "ניקוד רשמי" (Official / SSOT).** Reads `standings.json`. Sub-label lists included fields: *"כולל: תוצאות 1/X/2 של משחקי בתים ששוחקו"* (later: + finalized advancement).
- **Tab 2 — "ניקוד משוער (חי)" (Projected).** Reads `standings_projected.json`. Banner: *"לא סופי — מתעדכן בכל סנכרון"*. Sub-label lists included fields: the 8 superlatives above + everything from Tab 1. Optionally show a "מוביל כעת" chip per field from `leaders.json`.
- Both tabs show `synced_at`. Default tab = Official.

## 9. Build checklist

1. Engine: `leaders` module (openfootball-derived scorer + team goals; API-Football assists + team cards) with caching + 100/day guard.
2. Engine: apply provisional points using `player_alias.json` + `teams.json`, write `standings_projected.json` + `leaders.json`.
3. Tests (Vitest): leader tie → all pickers get points; name normalization; group-vs-tournament scope; budget guard.
4. Cron/workflow: add `APIFOOTBALL_KEY` secret; add the leaders fetch step.
5. Web: add the two tabs with explicit field lists and the provisional banner.
