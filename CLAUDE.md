# CLAUDE.md — Mondial 2026 Guessing Competition ("הדשא הגדול")

Build brief + working context for this repo. Read this first. Full specs live in `docs/`; the verified data layer lives in `data/seed/`.

## 1. What this is

A **read-only**, **Hebrew-only (RTL)**, mobile + desktop web app showing a friends' World Cup 2026 guessing competition: a standings table of ~153 players and a per-player page with all their predictions. Players cannot perform any actions. Data is recomputed by a scheduled job every 12h; the UI shows "עודכן לאחרונה: …" (last sync).

This is **not** a live service. A batch job computes scores from frozen predictions + match results and writes JSON; a static site reads that JSON.

## 2. Stack (DECIDED — do not relitigate)

- **Frontend:** React + Vite + TypeScript + Tailwind. RTL (`dir="rtl"`, Hebrew font e.g. Heebo/Assistant). React Router: standings `/` + player page `/player/:id`. Static build.
- **Engine + fetch:** TypeScript / Node (shared types with frontend). Unit-tested with **Vitest**.
- **Data:** JSON in repo — `data/seed/` (frozen), `data/manual/` (admin-entered), `data/public/` (computed outputs the FE reads).
- **Automation:** GitHub Actions cron `0 */12 * * *` + manual `workflow_dispatch`.
- **Hosting:** GitHub Pages, **public repo**.
- **No backend, no DB.** Admin input = editing files in `data/manual/` (commit triggers rebuild).

## 3. Repo structure (target)

```
deshe-gadol-26/
├── CLAUDE.md            # this file
├── docs/                # 01_requirements, 02_data_model, 03_architecture_scoring
├── data/
│   ├── seed/            # frozen, verified (see §4)
│   ├── manual/          # admin-entered: knockout advancement, special-bet answers, score overrides
│   └── public/          # computed: standings.json, players/<id>.json, meta.json
├── engine/              # TS scoring + openfootball fetch + Vitest tests
├── web/                 # React + Vite app (RTL)
└── .github/workflows/   # cron + workflow_dispatch + Pages deploy
```

## 4. Data layer contract (`data/seed/` — already generated & verified)

- **players.json** — `[{ id, name, submitted_at }]`, 153 players (already filtered to `account_status=active` AND `submission_status=approved`).
- **predictions.json** — `[{ player_id, match_id, score_a, score_b, pick_1x2 }]`, group-stage 1X2 guesses. `pick_1x2` derived: `score_a>score_b→"1"`, `==→"X"`, `<→"2"`. **side A = home = `score_a`.**
  - ✅ **Deduped (done).** Was 11,075 rows with 60 repeated `(player_id, match_id)` pairs (20 identical resubmits, 40 conflicting re-guesses); cleaned to **11,015 rows, 0 duplicates** (latest-wins, resolved against source). `updated_date` was intentionally not retained in the seed, so the resolution is trusted, not reproducible from this file. Result: 152 players with all 72 group matches, 1 player (`6a29110727106df835d89d4a`) legitimately missing match `69d75963fc9731931f39c2e5` (no-pick, not a dedup artifact). Engine can still keep a defensive dedup at load.
- **team_predictions.json** — one object per player: `{ player_id, group_stage:[{team,group,position}], round_of_16:[team…], quarter_final:[…], semi_final:[…], final:[…], winner:[team] }`. Team names are **Hebrew** → normalize to codes via `teams.json` (`name_he`).
- **special_predictions.json** — 153 objects, one per player, already deduped. Fields: `top_scorer, best_player, top_assists, most_goals_group_stage_team, most_conceded_group_stage_team, most_goals_tournament_team, most_conceded_tournament_team, most_cards_team, least_cards_team, total_red_cards, total_extra_time, total_penalties`.
- **teams.json** — 48 teams: `{ code, name_he, name_en, group, aliases, name_en_aliases }`. `group` is data-derived and consistent. `name_en_aliases` includes openfootball spellings (USA, Türkiye, Czechia, Côte d'Ivoire, Bosnia & Herzegovina).
- **match_map.json** — **AUTHORITATIVE** (from user's `map.xlsx`). `{ matches:[{order, match_id, match_key, group, home_code, away_code, home_he, away_he}], key_to_match_id, match_id_to_key }`. `match_key = HOME-AWAY` FIFA codes, **unique across all 72**, and equals openfootball `team1-team2` codes.

### The join (live results → scoring)
`openfootball match → codes(team1)-codes(team2) = match_key → match_id → predictions`. Orientation verified 72/72 (openfootball team1 = our home = side A).

## 5. Scoring rules (full — from `docs/03`)

- **Group match (1X2):** correct result = **2 pts**. side A = home.
- **Group→knockout advancement** (32 of 48 advance): **+2** per picked team that advanced (any place) **+1** bonus if exact in-group position correct.
- **Reach-stage picks:** Round of 16 = **5** each, quarter = **10**, semi = **15**, final = **20**.
- **Champion (`winner`):** scored from `data/seed/champion_odds.json` (`points[code]`, range **20-60**, the **official organizer table**). Favorite (France) = 20, biggest surprise = 60. Award the team's points to each player whose `winner` pick wins. Until the final is decided, score as 0 / "pending".
- **Specials:** top scorer 20, best player 20, top assists 15; most/most-conceded team group-stage 10 each; most/most-conceded team tournament 10 each; most-cards & fewest-cards team 10 each; total red cards 8; total extra-times 5; penalty-shootout matches 5. Player-name ties (scorer/assists) → all pickers get full points. Numeric bets scored by **exact match**, resolved at tournament end.
- **Tie-breakers (rank order):** champion → correct finalists → semis → quarters → R16 → first-knockout-round (32 advancers) → group-stage results.

## 6. Results & manual data

- **Group scores → automatic.** Primary: **ESPN** unofficial JSON (keyless, near-live): `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD` (one UTC day per call; iterate the date window). **Join on `competitor.team.abbreviation`, which equals our FIFA `code` for all 48 teams** (no name mapping needed); `homeAway:"home"` = our home = side A (verified 72/72 direct key match); `status.type.state == "post"` = finished. Fallbacks: **openfootball** raw JSON (`https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`, keyless, hand-updated ~1×/day, join via `teams.json` name_en aliases) then **football-data.org** free key (`X-Auth-Token`, 10 req/min, WC = comp `WC`).
- **Knockout advancement + special-bet answers → manual**, hand-entered into `data/manual/` (a static JSON we fill in together as the tournament progresses). `map.xlsx` also has empty result columns if manual score entry is ever preferred over the API.

## 7. Recompute flow (the job)

1. Load seed (immutable) + `data/manual/` + fetch openfootball results.
2. Dedup predictions (one per player/match). Group-score each finished match via the join.
3. After group stage: award advancement points (+2 / +1 bonus) from manual advancement data.
4. Per knockout stage: award 5/10/15/20 from manual stage data.
5. Specials when resolved (exact match; ties → all pickers).
6. Rank with tie-breakers. Write `data/public/standings.json`, `players/<id>.json`, `meta.json` (with `synced_at`). Recompute from scratch each run (idempotent).

## 8. Verification facts (already established — use as engine tests)

- Recomputing group points/correct-counts reproduces the backup's cached `total_points` and `correct_predictions` for **153/153 players, 0 mismatches**.
- Full `match_id→home/away→1X2→result` chain reproduces the backup's stored `is_correct` for **614/614** predictions across the backup-scored matches, **0 mismatches**.
- `match_map.json` is authoritative (from `map.xlsx`); orientation matches openfootball **72/72**; all played games resolve via `match_key`.
- **Build a Vitest test that re-asserts the 614/614 and the 153/153 totals** against the seed — this is the engine's correctness anchor.

## 9. Build order (suggested)

1. ~~Fix seed: dedup `predictions.json`.~~ ✅ Done (see §4). Engine may still keep a defensive load-time dedup.
2. `engine/`: types + scoring functions + the openfootball fetch/normalize. Vitest tests (§8).
3. Wire GitHub Actions (cron + workflow_dispatch) → fetch → compute → commit `data/public/` → Pages deploy.
4. `web/`: RTL shell, standings table (sort by points, tie-break visible), player page. Show `synced_at`.
5. `data/manual/` schema + a documented admin edit flow.

## 10. Gotchas

- **side A = home = `score_a`**; openfootball `team1` = home. Never flip this.
- **Dedup** predictions and specials (latest `updated_date` wins).
- Players already filtered to active+approved in the seed — don't re-add deleted/draft.
- **Hebrew-only, RTL** UI. No language switcher, no English in the GUI.
- Champion scoring now resolved via `champion_odds.json` (was deferred). Still scores 0/"pending" until the final is played.
- Recompute is **from scratch** each run; `data/public/` is derived output, never hand-edited.
