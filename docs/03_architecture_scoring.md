# Architecture, Stack & Scoring Specification

**Last updated:** 2026-06-15

---

## 1. Architecture (the leanest viable design)

Three parts, only one of which is "live":

```
┌─────────────────────┐     writes      ┌──────────────────┐    reads     ┌──────────────────┐
│  Recompute job       │ ──────────────▶ │  JSON data files  │ ───────────▶ │  Static frontend  │
│  (scheduled, 12h)    │                 │  (in the repo)    │              │  (Hebrew, RTL)    │
│  "the brain"         │                 │  standings/players│              │  "the face"       │
└─────────────────────┘                 └──────────────────┘              └──────────────────┘
        ▲
        │ fetches results
   ┌────────────┐
   │ Results API │  (or admin-edited matches.json)
   └────────────┘
```

### Why frontend-only is enough (the concern, addressed)
- **Computation is tiny.** ~153 players × ~150 checks ≈ 23k trivial comparisons. Milliseconds, twice a day — not per request. So it lives in a scheduled job, not the browser.
- **The "DB" is small and mostly frozen.** Predictions are locked forever; only results change. A few MB of JSON in the repo is the entire datastore.
- **Scores are derived, not stored.** Each run recomputes everything from scratch and overwrites the output. No migrations, no sync bugs, no managed DB.
- **Read-only is the requirement.** A static site literally cannot be mutated by users — the architecture enforces the rule for free.

A real backend/DB would only be justified by live multi-user writes or sub-second freshness. Neither applies.

### Final stack (DECIDED 2026-06-15 — all free-tier)
- **Frontend:** **React + Vite + TypeScript + Tailwind**, configured RTL (`dir="rtl"`, Hebrew font e.g. Heebo/Assistant). React Router: standings (`/`) + player page (`/player/:id`, shareable). Builds to a static bundle.
- **Scoring engine + fetch:** **TypeScript / Node**, single language shared with the frontend (shared team/prediction types). Unit-tested with **Vitest** against a few hand-verified players.
- **Data:** JSON in the repo — `data/seed/` (frozen), `data/manual/` (admin-edited: advanced stages + special bets + score overrides), `data/public/` (computed outputs served to the FE).
- **Scheduled job:** **GitHub Actions cron** (`0 */12 * * *`) + manual `workflow_dispatch` trigger → fetch openfootball → run engine → commit `data/public/` → deploy. Zero servers, zero cost.
- **Hosting:** **GitHub Pages**, **public repo** (chosen for leanness; single repo, deploy from the same workflow). Note: player names are therefore visible in the public repo, not only in the app.
- **Admin manual entry:** edit the `data/manual/` JSON files (advanced stages + specials) via the GitHub web editor / PR; a commit auto-triggers recompute + redeploy. No server required.

### Repo structure
```
deshe-gadol-26/
├── data/{seed,manual,public}/
├── engine/              # TS scoring + openfootball fetch + Vitest tests
├── web/                 # React + Vite app (RTL)
└── .github/workflows/   # cron (0 */12 * * *) + workflow_dispatch + Pages deploy
```

---

## 2. Recompute job — detailed flow

Runs every 12h (and can be triggered manually):

1. **Load seed** (`players.json`, `predictions.json`, `team_predictions.json`, `special_predictions.json`) — immutable.
2. **Load/refresh results** (`matches.json`, `tournament_facts.json`) — from API or admin file.
3. **Score group stage:** for each finished group match, derive actual 1X2; for each player's guess on that match, award **2 pts** if the derived guess matches. (Idempotent — recomputed each run.)
4. **Score group advancement** (once group stage final): determine the 32 teams that advanced and their final group positions. For each player's group pick: **+2 pts** if that team advanced (any place) **+1 bonus** if the predicted position matches exactly.
5. **Score knockout reach:** for each knockout stage, determine which teams reached it; for each player who predicted a team for that stage, award the stage's points (see §3).
6. **Score specials:** only when `tournament_facts.resolved = true`. Apply per-bet points; numeric bets require exact match; player-ties award full points to all pickers.
7. **Rank & tie-break** (see §4). Write `standings.json`, `players/<id>.json`, `meta.json` with a fresh `synced_at`.

---

## 3. Scoring specification (from the rules PDF)

### Group stage (per match)
- Predict 1 / X / 2. Right-hand team = home (side A). **Correct = 2 pts.** Exact scoreline not required.

### Group → knockout advancement
- 32 of 48 teams advance (top 2 of each of 12 groups = 24, plus 8 best 3rd-place = 32).
- **+2 pts** for each picked team that advanced, regardless of place.
- **+1 bonus pt** if the predicted in-group position is also exactly correct.

### Knockout "reach this stage" predictions
| Prediction | Points per correct team |
|---|---|
| Reaches Round of 16 (שמינית) — 16 teams | **5** |
| Reaches quarter-final — 8 teams | **10** |
| Reaches semi-final — 4 teams | **15** |
| Reaches final — 2 teams | **20** |
| Champion (winner) | **20-60 per `champion_odds.json`** (official table: fav 20 → surprise 60) |

### Special bets
| Bet | Points | Notes |
|---|---|---|
| Top scorer | 20 | FIFA official; shootout goals excluded. Player ties → all pickers get full points. |
| Best player (FIFA) | 20 | |
| Top assists | 15 | Player ties → all pickers get full points. |
| Most goals — group stage (team) | 10 | |
| Most conceded — group stage (team) | 10 | |
| Most goals — tournament (team) | 10 | |
| Most conceded — tournament (team) | 10 | |
| Most cards team (yellow+red, tournament) | 10 | |
| Fewest cards team (tournament) | 10 | |
| Total red cards (tournament) | 8 | Exact number; incl. staff/bench per FIFA. |
| Total extra-times | 5 | Exact number. |
| Penalty-shootout matches | 5 | Exact number. |

### Tie-breakers (ranking order)
1. Champion guess correct
2. # correct finalists
3. # correct semi-finalists
4. # correct quarter-finalists
5. # correct Round-of-16 teams
6. # correct first-knockout-round (the 32 advancers)
7. # correct group-stage match results
8. (Pub visits — joke; not implemented)

---

## 3a. Results data source — API research (tested 2026-06-15)

We need a source that returns the **updated state of all results** for WC 2026. The recompute runs every 12h, so we do **not** need true real-time; final scores within a few hours are enough. Findings, ranked:

### ✅ Recommended: openfootball/worldcup.json (keyless, public domain)
- **URL:** `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`
- **Auth:** none. **Cost:** free. **License:** CC0 (public domain).
- **Curl test (2026-06-15):** `HTTP 200`, 22 KB, 0.26s. Returns all **104 matches**, 12 groups (A–L), **13 matches already had final scores**. ✔
- **Shape:** `{ name, matches: [ { round, num, date, time, team1, team2, group, ground, score: { ft:[a,b], ht:[a,b], et, p } , goals1, goals2 } ] }`. Team names in English; finished matches carry `score.ft`; knockout matches use placeholders (`2A`, `W73`…) until drawn.
- **Freshness:** wiki-style, updated by hand ~once/day (maintainer in CEST). Acceptable for a 12h recompute. **Faster mirror** available as a fallback: `upbound-web/worldcup-live.json`.
- **Join to our data:** English names map to our team codes via `teams.json → name_en_aliases`. **Verified 48/48** group teams match (5 needed spelling aliases: USA, Türkiye, Czechia, Côte d'Ivoire, Bosnia & Herzegovina — now added).
- **Why first choice:** zero auth, trivial to fetch in the cron job, exact group alignment with our seed, public domain. Leanest possible.

### ◑ Alternative: football-data.org (free tier, API key)
- **URL:** `https://api.football-data.org/v4/competitions/WC/matches` with header `X-Auth-Token: <key>`.
- **Auth:** free key (email registration). **Curl test (no key):** `HTTP 403` "restricted… check your subscription" — confirms the endpoint exists and is key-gated. ✔
- **Free tier:** WC is one of 12 free competitions; **10 requests/min**; scores are **delayed** on free (no true live), and lineups/cards/squads need paid. Fine for our needs (we only read final scores twice a day).
- **Why second:** more "official" structured data and a stable schema, but requires a key/account — slightly less lean than a keyless raw file. Good **fallback** if openfootball lags.

### ✗ Considered, not chosen
- **rezarahiminia/worldcup2026** — full REST API (live scores, standings) but **self-host** (Node + MongoDB) and **JWT-gated**; its public demo (`worldcup26.ir`) is unofficial/unstable. Too heavy for a lean static app.
- **SportMonks / TheStatsAPI / Statorium / live-score-api** — paid (from ~$50/mo) with trials. Overkill and not free.

### ✅✅ New primary (decided 2026-06-16): ESPN unofficial JSON
- **URL:** `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD` (one UTC day per call; iterate the date window to cover all 104 matches).
- **Auth:** none. **Cost:** free. **Freshness:** near-live (`status.type.state` = `pre`/`in`/`post`) — beats openfootball's ~1×/day hand updates.
- **Join (cleaner than name-mapping):** each `competitor.team.abbreviation` equals our FIFA `code` for **all 48 teams** — join on the code directly, no `teams.json` name lookup. `homeAway:"home"` = our home = side A; built `home-away` keys resolved **72/72, 0 unmapped** against `match_map.json` (orientation confirmed). `state=="post"` ⇒ finished; read `competitor.score`.
- **Caveat:** unofficial/undocumented (could change without notice); scoreboard is per-day so the job iterates dates.

### Decision (updated)
Primary = **ESPN** (keyless, near-live, code-join). Fallbacks = **openfootball raw JSON** (keyless, whole-tournament file, name-join) → **football-data.org free key**. The job reads ESPN, writes our `matches.json`; if a result is missing/late, the **admin manual override** (see requirements doc) fills the gap.

---

## 4. Data freshness & "Last sync"
- `meta.synced_at` is written at the end of each successful recompute and rendered as **"עודכן לאחרונה: …"** above the standings.
- If a run fails, the previous JSON stays live (last-known-good), and the timestamp reflects the last good run.

---

## 5. Build order (suggested)
1. Build `teams.json` from the official draw; normalize prediction team names.
2. Extract seed JSON from the `.numbers` backup (see data-model §3).
3. Write the scoring engine + a test using a few hand-checked players.
4. Wire GitHub Actions cron + commit/deploy.
5. Build the RTL frontend: standings table → player page.
6. Add a results source (API adapter or admin-edit flow).

---

## 6. Open items / decisions needed
1. **Champion-odds scoring table** — ✅ resolved. `data/seed/champion_odds.json` holds the **official organizer table** (provided 2026-06-16): favorite (France) = 20 pts, biggest surprise = 60 pts, across all 48 teams. Engine scores `winner` picks from `points[code]`; still 0 / "pending" until the final is played.
2. **Results API** — ✅ resolved (see §3a): **ESPN** unofficial JSON (primary, keyless, near-live, code-join) → openfootball raw JSON → football-data.org free key (fallbacks). Knockout-stage results resolved manually by admin (see requirements doc).
3. **`match_id` → fixtures mapping** — ✅ resolved: reconstructed deterministically (insertion-order = group-major FIFA order) and validated (4/4 derivable outcomes, 70/72 strength consistency, 0 contradictions). Frozen to `data/seed/match_map.json`. (See data-model doc §2.3b.)
4. **Frontend framework / hosting** — ✅ resolved: React+Vite+TS+Tailwind, TS engine, GitHub Pages (public repo). See "Final stack" above.
