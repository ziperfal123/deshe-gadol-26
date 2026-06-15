# Mondial 2026 — Guessing Competition App · Requirements

**Project:** "הדשא הגדול / מונדיאל 2026" — a read-only web app showing a friends' World Cup 2026 guessing competition.
**Status:** Draft v0.1 — based on the data backup (`raw_db_backup_2026-06-14`) and rules PDF (`חוקי המשחק`).
**Last updated:** 2026-06-15

---

## 1. Goal

Give the ~153 participating players a fast, always-fresh place to see:
- The overall standings (who's winning).
- Their own (and everyone else's) full set of predictions.

The app **does not** accept user input. All guesses were locked when the tournament opened (11/6/26, 22:00 Israel time). The app only **displays** data that a background job computes twice a day.

---

## 2. Scope

### In scope
- Public, read-only standings table of all **active + approved** players.
- Per-player page showing all of that player's predictions and how each scored.
- "Last sync at: …" freshness indicator above the table.
- A background recompute that runs **every 12h**: fetch results → score every player → publish updated data.
- Hebrew-only, right-to-left (RTL) UI.
- Responsive: works on phone, tablet, and laptop.

### Out of scope (for v1)
- User login / authentication for regular players (app is fully public read-only).
- Editing predictions (they are frozen).
- Prize-money accounting / payments (informational only, if shown at all).
- Multi-language UI. **Hebrew only.**

---

## 3. Audience & language

- Users are friends/kibbutz members; non-technical. UI must be simple and obvious.
- **All GUI text is in Hebrew, RTL.** No language switcher, no English labels in the interface. (Code, file names, and these docs are in English; only the rendered UI is Hebrew.)

---

## 4. Functional requirements

### FR-1 — Standings table (home screen)
- Rows = players (active + approved only; ~153). Excluded: `account_status = deleted` and `submission_status = draft`.
- Columns (minimum): rank, player name, total points, correct group-stage predictions. Optional secondary columns for tie-break visibility.
- Sorted by total points desc, then by the official tie-breaker order (see scoring doc).
- Each row is clickable → opens that player's page.
- Above the table: **"עודכן לאחרונה: <date time>"** (Last sync at …), driven by the recompute timestamp.

### FR-2 — Player page
- Opened by clicking a player in the table.
- Shows the player's name, rank, total points, and a breakdown of all predictions:
  - **Group-stage 1X2 guesses** (per match): the pick (1/X/2), whether correct, points earned.
  - **Advancement guesses**: which teams they picked to advance from groups (with predicted position), and to reach Round of 16 / quarter / semi / final / champion — each with correct/incorrect and points.
  - **Special guesses**: top scorer, best player, assists, team stats, totals (red cards, extra-times, penalty shootouts), each with points.
- Clear visual state for: not-yet-resolved vs. correct vs. incorrect.
- Easy navigation back to the standings.

### FR-3 — Read-only guarantee
- No write actions exposed in the public UI. No forms, no buttons that mutate data.

### FR-4 — Freshness indicator
- The displayed sync time is the timestamp of the last successful recompute, not the page-load time.

### FR-5 — Recompute job (every 12h)
High-level algorithm (full detail in `03_architecture_scoring.md`):
1. Fetch the latest match results (from an API, or from an admin-maintained results file).
2. For each player, for each newly-finished, not-yet-scored group match: check the 1X2 guess and add points per the rules.
3. After the group stage: for each team that advanced, award advancement points to players who picked it (plus position bonus).
4. For each knockout round, as teams progress: award the round's points to players who predicted that team would reach that round.
5. Recompute special-bet points where the underlying result is final.
6. Write updated standings + per-player files + a new sync timestamp.

### FR-6 — Knockout / elimination scoring (different from group stage)
- After the group stage, scoring is **advancement-based**, not score-based: when a team reaches a given stage, every player who predicted that team for that stage gets the stage's points. See scoring doc for exact values.

---

## 4a. Results resolution: automatic vs. manual (decision)

Results enter the system through two paths, by design:

- **Group-stage match results → automatic.** The recompute job pulls the 72 group-game scores from the results API (ESPN unofficial JSON, keyless & near-live, primary; openfootball then football-data.org as fallbacks, see architecture doc §3a). These drive the 1X2 scoring with no human action.
- **Advanced / knockout stages → manual (admin).** Which teams *advanced* (the 32 group qualifiers and their positions, and who reaches Round of 16 / quarter / semi / final / champion) is **entered by an admin**, not parsed from the API. Rationale: advancement involves tie-break rules, best-third-place selection, and bracket placeholders that are noisy to derive from a feed; a few manual clicks per stage are simpler and less error-prone for a friends' game. Special-bet answers (top scorer, cards totals, etc.) are likewise entered manually at the relevant time.

This keeps the automated path trivial (just scores) while the human handles the handful of judgment points.

## 4b. Admin features (to implement)

The admin surface is **separate from the public read-only app** and protected (simple password / token; it is not exposed to players). Planned capabilities:

1. **Manual result entry / override** for any match — set/correct a group-game score when the API is late or wrong; this override always wins over the feed.
2. **Mark group standings final** and record which teams advanced and their final group position (feeds the +2 / +1-bonus advancement scoring).
3. **Set knockout progression per stage** — tick which teams reached Round of 16, quarter, semi, final, and the champion (drives the 5/10/15/20-point scoring).
4. **Enter special-bet outcomes** — top scorer (supports ties → multiple names), best player, top assists, the team stats, and the numeric totals (red cards, extra-times, penalty shootouts), with a "resolved" flag so specials only score once final.
5. **Trigger a recompute on demand** (in addition to the automatic 12h run) and see the resulting `synced_at`.
6. **Edit visibility** — optionally exclude a player (e.g. unpaid/late) from the public standings.

Implementation note (lean): the simplest admin path is editing the JSON files (`matches.json`, `tournament_facts.json`, knockout selections) via the repo / a small protected page that commits them; no always-on backend required. A richer in-GUI admin form can come later if wanted.

## 5. Non-functional requirements

- **Leanness first.** Cheapest viable hosting; no always-on server if avoidable.
- **Performance:** standings page should load fast on mobile data; per-player data can lazy-load on click.
- **Reliability:** scores are recomputed from scratch each run (idempotent) — no fragile incremental state.
- **Transparency:** the sync timestamp makes data freshness obvious.
- **Maintainability:** a single non-developer-friendly path to enter results manually if the API is unavailable.

---

## 6. Key decisions captured so far

| Topic | Decision |
|---|---|
| Group-stage scoring | "Correct result" 1X2 (1/X/2), right-hand team = home. 2 pts per correct. |
| Players shown | Active **and** approved only. |
| Results source | Group scores: API (ESPN keyless near-live, primary; openfootball + football-data.org fallbacks). Knockout advancement + specials: manual admin entry. |
| Numeric special bets | Scored by **exact match**, resolved at tournament end. |
| Architecture | Static frontend reading pre-built JSON + a scheduled recompute job (no always-on backend). |
| Language | Hebrew only, RTL. |
| Recompute cadence | Every 12 hours. |

---

## 7. Open items (need input)

1. **Champion ("winner") scoring table** — *deferred by decision.* The rules reference an odds/tier table that rewards surprising champion picks; it isn't in the supplied files. Champion scoring is parked for now and will be added later when the table is available. (Champion guesses are still stored in the seed.)
2. **Results API choice** — ✅ resolved: openfootball (primary, keyless) + football-data.org free key (fallback); knockout/specials manual. (See architecture doc §3a.)
3. **Standings columns** — confirm exactly which columns to show and whether tie-break sub-values are visible.
4. **Prize info display** — show the prize-split rules in the app, or omit.
