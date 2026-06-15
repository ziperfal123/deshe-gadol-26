# Data Model & "DB" Design

**Last updated:** 2026-06-15

This app has **no traditional database at runtime.** Data lives as versioned JSON files in three layers:

1. **Seed (frozen)** — the players and their predictions, locked at tournament start. Never changes.
2. **Results (mutable)** — match results & tournament facts. The only input that updates over time.
3. **Computed (derived)** — standings and per-player scoring. Regenerated from scratch each recompute. Never hand-edited.

The frontend only ever reads layer 3 (plus team/match metadata for display).

---

## 1. Source tables (from the Numbers backup)

The backup `raw_db_backup_2026-06-14` contains four sheets. Row counts and roles:

| Sheet | Rows | Role |
|---|---|---|
| `Players_Raw` | 164 | The competitors. Use **active + approved** → ~153. |
| `Predictions_Raw` | 11,076 | Group-stage 1X2 score guesses (72 matches × players). |
| `TeamPredictions_Raw` | 9,853 | Advancement guesses (group positions + each knockout round). |
| `SpecialPredictions_Raw` | 154 | One row per player: special/novelty bets. |

### 1.1 `Players_Raw`
Columns: `name`, `account_status`, `submission_status`, `submitted_at`, `correct_predictions`, `total_points`, `id`, `created_date`, `updated_date`, `created_by_id`, `is_sample`.
- Join key: `id`.
- `correct_predictions` / `total_points` are **cached values** — the recompute overwrites these; do not trust the backup's numbers as ground truth.
- Filter: keep `account_status = active` AND `submission_status = approved`.

### 1.2 `Predictions_Raw` (group stage, 1X2)
Columns: `predicted_score_a`, `predicted_score_b`, `is_correct`, `match_id`, `points`, `player_id`, `id`, dates, `is_sample`.
- 72 distinct `match_id`s = the 72 group-stage games (48 teams, 12 groups of 4).
- A guess is stored as a predicted scoreline (`score_a`/`score_b`), from which the **1X2 outcome** is derived: `a>b ⇒ 1`, `a==b ⇒ X`, `a<b ⇒ 2`. **Right-hand team = "home" = side A.**
- Scoring compares the derived 1X2 to the actual result's 1X2. Exact scoreline is **not** required.

### 1.3 `TeamPredictions_Raw` (advancement)
Columns: `player_id`, `position`, `stage`, `group_name`, `team_name`, `id`, dates, `is_sample`.
- `stage` values and meaning:

| `stage` | Meaning | `position` | Approx rows |
|---|---|---|---|
| `group_stage_qualification` | Team picked to finish 1st or 2nd in its group | 1 or 2 | 3,777 |
| `group_stage_third` | Team picked as a qualifying 3rd place | 3 | 1,246 |
| `round_of_16` | Team picked to reach the Round of 16 | null | 2,495 |
| `quarter_final` | Team picked to reach the quarter-final | null | 1,248 |
| `semi_final` | Team picked to reach the semi-final | null | 622 |
| `final` | Team picked to reach the final | null | 310 |
| `winner` | Team picked as champion | null | 155 |

- `group_name`: A–L (12 groups) for group-stage rows; null for knockout rows.
- `team_name`: Hebrew team name. **This is the join risk** — team names are free-text Hebrew and must be normalized against a canonical team list (see §3).

### 1.4 `SpecialPredictions_Raw` (one row per player)
Columns map 1:1 to bets:

| Column | Bet | Points |
|---|---|---|
| `top_scorer` | Tournament top scorer | 20 |
| `best_player` | FIFA best player | 20 |
| `top_assists` | Top assists | 15 |
| `most_goals_group_stage_team` | Most goals, group stage | 10 |
| `most_conceded_group_stage_team` | Most conceded, group stage | 10 |
| `most_goals_tournament_team` | Most goals, whole tournament | 10 |
| `most_conceded_tournament_team` | Most conceded, whole tournament | 10 |
| `most_cards_team` | Most cards (yellow+red), tournament | 10 |
| `least_cards_team` | Fewest cards, tournament | 10 |
| `total_red_cards` | Total red cards (number) | 8 |
| `total_extra_time` | Total extra-times (number) | 5 |
| `total_penalties` | Penalty-shootout matches (number) | 5 |

Numeric bets (`total_*`) are scored by **exact match**, resolved at tournament end.

---

## 2. Reference data we must ADD (not in the backup)

The backup has guesses but **no fixtures, no results, no team registry, no champion-odds table.** These must be supplied:

### 2.1 `teams.json` (canonical team registry)
```json
{ "teams": [ { "code": "ESP", "name_he": "ספרד", "aliases": ["ספרד"], "group": "?" } ] }
```
Purpose: normalize the free-text Hebrew names in predictions to stable codes, and hold each team's group. Build once, by hand, from the official draw.

### 2.2 `matches.json` (fixtures + results — the mutable layer)
```json
{
  "matches": [
    {
      "match_id": "69d75963fc9731931f39c30a",
      "stage": "group",
      "group": "A",
      "team_a": "MEX",          // right-hand / "home" side
      "team_b": "???",
      "kickoff": "2026-06-11T22:00:00+03:00",
      "status": "finished",     // scheduled | finished
      "score_a": 2,
      "score_b": 1
    }
  ]
}
```
- `match_id` must match the IDs already in `Predictions_Raw` for the 72 group games.
- Knockout matches get added as the draw resolves.
- This is the file the **admin edits** (or the API populates).

### 2.3 `tournament_facts.json` (resolved special-bet answers)
```json
{
  "top_scorer": ["מסי"],            // array → handles ties (all pickers get full points)
  "best_player": "...",
  "top_assists": ["..."],
  "most_goals_group_stage_team": "...",
  "total_red_cards": 12,
  "total_extra_time": 8,
  "total_penalties": 5,
  "resolved": false                  // specials only score when true (tournament end)
}
```

### 2.3b `match_map.json` — ✅ AUTHORITATIVE (confirmed from `map.xlsx`)
The backup had no Matches table, so the 72 group `match_id`s had no teams attached. The user later provided an authoritative `map.xlsx` (`match_id, "home נגד away", group`), and `match_map.json` is now built directly from it. Each entry also carries a stable `match_key = HOME-AWAY` (FIFA codes, unique across all 72, equals openfootball `team1-team2` for a clean API join), plus `key_to_match_id` / `match_id_to_key` lookups.

Re-validated after rebuild: orientation matches openfootball **72/72**, all 13 played games resolve via key, and the full `is_correct` reproduction is **614/614, 0 mismatches**.

Historical note — our earlier inference (before the file arrived) was 62/72 exact with correct orientation/pairings on all 72; the 10 misses were 5 within-matchday pairs in swapped order, all unplayed games. The authoritative file removed that residual guesswork:

- **Insertion order:** all 72 `match_id`s share one ObjectId prefix and differ only by a sequential counter → sorting them recovers the exact order they were inserted into the original DB.
- **Order scheme:** that insertion order is **group-major** — Group A's 6 games (indices 0–5), then B (6–11) … L, each group's 6 games in official FIFA matchday order (fixtures taken from openfootball's `cup.txt`).
- **Within-matchday disambiguation:** the two games of a matchday can be listed in either order; each pair was resolved using crowd-favorite vs. team-strength + actual played results (3 pairs needed swapping).
- **Orientation:** prediction side A (`score_a`) = the home team as listed officially.

**Validation:** 4/4 backup-derivable outcomes correct (0 conflicts); 13/13 played matches found in the feed; crowd-favorite agrees with an independent team-strength signal (built from the advancement predictions) on **70/72** fixtures, **0 contradictions** (2 are genuine even matchups). Confidence is very high. Residual safety net: the recompute re-checks each newly-played result, and the frozen `match_map.json` can be eyeballed once by the admin.

File shape: `{ matches: [ { order, match_id, group, home_code, away_code, home_he, away_he } ] }`.

### 2.4 `champion_odds.json` — ✅ GENERATED (lives in `data/seed/`)
The rules score the champion guess on a sliding scale that rewards surprising picks: **favorite = 20 pts, biggest surprise = 40 pts**. No table was supplied, so it was generated from one bookmaker's outright market (**BetMGM**, captured 2026-06-16) and frozen. Points are log-interpolated across decimal odds (favorite → 20, longest shot → 40), covering all 48 teams.
```json
{
  "_meta": { "rule": "fav=20, surprise=40, log-scaled", "source": "BetMGM", "range": [20,40] },
  "odds_decimal": { "ESP": 5.5, "...": 2501.0 },
  "points": { "ESP": 20, "FRA": 20, "HAI": 40, "CUW": 40 }   // team code → points if that team wins
}
```
Re-generate from the same formula if odds are refreshed before predictions lock.

---

## 3. Seed extraction plan

From the `.numbers` backup we will generate clean seed JSON:
- `players.json` — filtered to active+approved, only display fields (`id`, `name`).
- `predictions.json` — group 1X2 guesses keyed by `player_id` + `match_id` (store derived 1X2, drop stale `is_correct`/`points`).
- `team_predictions.json` — advancement guesses grouped by `player_id` → `stage` → list of `{team, position}`.
- `special_predictions.json` — one object per `player_id`.

Team names will be passed through the `teams.json` normalizer; any name that fails to resolve gets logged for manual fixing.

---

## 4. Computed outputs (written by the recompute job)

- `standings.json` — ranked list: `{ player_id, name, total_points, correct_group, tiebreak: {...}, rank }`, plus `synced_at` timestamp.
- `players/<player_id>.json` — full per-player breakdown for the player page (every guess with its resolved state and points).
- `meta.json` — `{ synced_at, tournament_stage, scoring_version }`.

These are the only files the frontend fetches at runtime. They are regenerated wholesale every run, so there is no stored scoring state to corrupt or migrate.

---

## 5. Data volume sanity check

Raw guesses ≈ 21k rows total; as compact JSON a few MB. The frontend's initial load only needs `standings.json` (~153 small rows) and lazy-loads one `players/<id>.json` per click. Easily within free static-hosting limits.
