#!/usr/bin/env python3
"""Stopgap generator: builds data/public/* from the seed + live match results
so the GUI renders real content before the TS engine exists.
Results source: ESPN (primary, free, no key, near-live), openfootball (fallback).
Scores ONLY the group stage (the only thing resolvable now). Advancement,
specials and champion are stored and marked 'pending'.
"""
import json, os, datetime, urllib.request, pathlib
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED = ROOT / "data" / "seed"
PUB = ROOT / "data" / "public"
ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates="
OF_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json"

def load(p): return json.load(open(SEED / p, encoding="utf-8"))

players = load("players.json")
preds = load("predictions.json")
teampreds = load("team_predictions.json")
specials = load("special_predictions.json")
teams = load("teams.json")
mm = load("match_map.json")
champ = load("champion_odds.json")

teams = teams if isinstance(teams, list) else teams["teams"]

# ---- name -> code maps ----
code_by_en, code_by_he = {}, {}
for t in teams:
    for n in [t.get("name_en")] + (t.get("name_en_aliases") or []):
        if n: code_by_en[n.lower()] = t["code"]
    for n in [t.get("name_he")] + (t.get("aliases") or []):
        if n: code_by_he[n] = t["code"]
team_he = {t["code"]: t.get("name_he") for t in teams}
team_en = {t["code"]: t.get("name_en") for t in teams}
key_to_mid = mm["key_to_match_id"]
mid_meta = {m["match_id"]: m for m in mm["matches"]}

def outcome(a, b): return "1" if a > b else ("X" if a == b else "2")

codes = {t["code"] for t in teams}

import re
def of_kickoff_utc(date, time):
    """Parse openfootball date + 'HH:MM UTC-6' into a sortable UTC ISO string."""
    if not date: return None
    m = re.match(r"\s*(\d{1,2}):(\d{2})\s*UTC([+-]\d+)?", time or "")
    try:
        d = datetime.datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return None
    if not m:
        return d.replace(tzinfo=datetime.timezone.utc).isoformat()
    hh, mm, off = int(m.group(1)), int(m.group(2)), int(m.group(3) or 0)
    dt = d.replace(hour=hh, minute=mm, tzinfo=datetime.timezone(datetime.timedelta(hours=off)))
    return dt.astimezone(datetime.timezone.utc).isoformat()

def fetch_espn():
    """ESPN scoreboard, one UTC day at a time across the group-stage window.
    Joins on the team's 3-letter abbreviation, which equals our FIFA code.
    Returns normalized matches: {home_code, away_code, kickoff, finished, score_a, score_b}."""
    out = []
    for d in range(11, 28):  # 2026-06-11 .. 2026-06-27 covers the group stage
        ds = f"202606{d:02d}"
        try:
            with urllib.request.urlopen(ESPN_URL + ds, timeout=20) as r:
                data = json.load(r)
        except Exception as e:
            print(f"WARN: ESPN {ds} failed: {e}")
            continue
        for e in data.get("events", []):
            comp = e["competitions"][0]
            cs = comp.get("competitors", [])
            home = next((c for c in cs if c.get("homeAway") == "home"), None)
            away = next((c for c in cs if c.get("homeAway") == "away"), None)
            if not home or not away: continue
            hc = (home["team"].get("abbreviation") or "").upper()
            ac = (away["team"].get("abbreviation") or "").upper()
            if hc not in codes or ac not in codes: continue
            finished = e.get("status", {}).get("type", {}).get("state") == "post"
            sa = sb = None
            if finished:
                try: sa, sb = int(home.get("score")), int(away.get("score"))
                except (TypeError, ValueError): finished = False
            out.append({"home_code": hc, "away_code": ac, "kickoff": e.get("date"),
                        "finished": finished, "score_a": sa, "score_b": sb})
    return out

def fetch_openfootball():
    """Fallback: openfootball raw JSON (whole-tournament file)."""
    try:
        with urllib.request.urlopen(OF_URL, timeout=25) as r:
            of = json.load(r)
    except Exception as e:
        print("WARN: openfootball fetch failed:", e)
        return []
    out = []
    for m in of.get("matches", []):
        hc = code_by_en.get((m.get("team1") or "").lower())
        ac = code_by_en.get((m.get("team2") or "").lower())
        if not hc or not ac: continue
        ft = (m.get("score") or {}).get("ft")
        out.append({"home_code": hc, "away_code": ac,
                    "kickoff": of_kickoff_utc(m.get("date"), m.get("time")),
                    "finished": bool(ft), "score_a": ft[0] if ft else None,
                    "score_b": ft[1] if ft else None})
    return out

# ---- live results: ESPN primary, openfootball fallback ----
matches = fetch_espn()
source = "espn"
if not matches:
    print("ESPN returned nothing, falling back to openfootball")
    matches, source = fetch_openfootball(), "openfootball"

results = {}    # match_id -> {score_a, score_b, pick}
match_dt = {}   # match_id -> kickoff UTC iso (all group matches, played or not)
unmapped = 0
for m in matches:
    mid = key_to_mid.get(f"{m['home_code']}-{m['away_code']}")
    if not mid:  # orientation mismatch would land here; expected 0
        unmapped += 1
        continue
    match_dt[mid] = m["kickoff"]
    if m["finished"]:
        results[mid] = {"score_a": m["score_a"], "score_b": m["score_b"],
                        "pick": outcome(m["score_a"], m["score_b"])}
print(f"source={source}: {len(matches)} matches, {len(match_dt)} mapped, "
      f"{unmapped} unmapped, {len(results)} finished")

# ---- score group stage per player ----
preds_by_player = {}
for p in preds:
    preds_by_player.setdefault(p["player_id"], []).append(p)
tp_by_player = {t["player_id"]: t for t in teampreds}
sp_by_player = {s["player_id"]: s for s in specials}

GROUP_PTS = 2
rows = []
player_files = {}

for pl in players:
    pid = pl["id"]
    total = 0
    correct = 0
    group_items = []
    for pr in preds_by_player.get(pid, []):
        mid = pr["match_id"]
        meta = mid_meta.get(mid, {})
        res = results.get(mid)
        status, pts = "pending", 0
        if res:
            ok = res["pick"] == pr["pick_1x2"]
            status = "correct" if ok else "wrong"
            pts = GROUP_PTS if ok else 0
            if ok: correct += 1; total += GROUP_PTS
        group_items.append({
            "match_id": mid, "order": meta.get("order"), "group": meta.get("group"),
            "kickoff": match_dt.get(mid),
            "home_code": meta.get("home_code"), "away_code": meta.get("away_code"),
            "home_he": meta.get("home_he"), "away_he": meta.get("away_he"),
            "pick_1x2": pr["pick_1x2"], "my_score_a": pr["score_a"], "my_score_b": pr["score_b"],
            "actual_score_a": res["score_a"] if res else None,
            "actual_score_b": res["score_b"] if res else None,
            "status": status, "points": pts,
        })
    # chronological: by kickoff, then by official order; missing dates sort last
    group_items.sort(key=lambda it: (it["kickoff"] is None, it["kickoff"] or "", it["order"] if it["order"] is not None else 999))

    tp = tp_by_player.get(pid, {})
    def he2code(n): return code_by_he.get(n)
    advancement = {
        "group_stage": [{"team_he": g["team"], "team_code": he2code(g["team"]), "group": g.get("group"),
                          "position": g.get("position"), "status": "pending", "points": 0}
                         for g in tp.get("group_stage", [])],
    }
    for stage, pts_each in [("round_of_16", 5), ("quarter_final", 10), ("semi_final", 15), ("final", 20)]:
        advancement[stage] = [{"team_he": team_he.get(he2code(n), n), "team_code": he2code(n),
                                "points_if_correct": pts_each, "status": "pending", "points": 0}
                               for n in tp.get(stage, [])]
    winner_he = (tp.get("winner") or [None])[0]
    wc = he2code(winner_he) if winner_he else None
    champion = {"team_he": winner_he, "team_code": wc,
                "points_if_correct": champ["points"].get(wc) if wc else None,
                "status": "pending", "points": 0}

    sp = sp_by_player.get(pid, {})
    SPEC_PTS = {"top_scorer":20,"best_player":20,"top_assists":15,"most_goals_group_stage_team":10,
                "most_conceded_group_stage_team":10,"most_goals_tournament_team":10,
                "most_conceded_tournament_team":10,"most_cards_team":10,"least_cards_team":10,
                "total_red_cards":8,"total_extra_time":5,"total_penalties":5}
    specials_out = [{"key": k, "value": sp.get(k), "points_if_correct": v, "status": "pending", "points": 0}
                    for k, v in SPEC_PTS.items()]

    player_files[pid] = {
        "player_id": pid, "name": pl["name"], "total_points": total, "correct_group": correct,
        "group_stage": group_items, "advancement": advancement,
        "champion": champion, "specials": specials_out,
    }
    rows.append({"player_id": pid, "name": pl["name"], "total_points": total, "correct_group": correct})

# rank: DENSE ranking — equal scores share a position, ranks ascend 1,2,3 with
# NO gaps (so 4-way tie for 1st is 1,1,1,1 then 2, not 1,1,1,1,5). Sort by
# points desc, correct_group desc, name asc (stable). `tied` flags shared scores.
rows.sort(key=lambda r: (-r["total_points"], -r["correct_group"], r["name"]))
score_counts = Counter((r["total_points"], r["correct_group"]) for r in rows)
rank, prev = 0, None
for r in rows:
    key = (r["total_points"], r["correct_group"])
    if key != prev:
        rank += 1
        prev = key
    r["rank"] = rank
    r["tied"] = score_counts[key] > 1

# ---- crowd split per match: how all players guessed each game (1/X/2) ----
match_picks = {}
for p in preds:
    match_picks.setdefault(p["match_id"], Counter())[p["pick_1x2"]] += 1
match_stats = {}
for mid, cnt in match_picks.items():
    total = sum(cnt.values())
    def pct(k): return round(100 * cnt.get(k, 0) / total) if total else 0
    match_stats[mid] = {
        "counts": {"1": cnt.get("1", 0), "X": cnt.get("X", 0), "2": cnt.get("2", 0)},
        "pct": {"1": pct("1"), "X": pct("X"), "2": pct("2")},
        "total": total,
    }

# ---- per-match voter lists (who picked 1/X/2), one file per match, lazy-loaded by the crowd dialog ----
players_by_id = {p["id"]: p["name"] for p in players}
match_voters = {}
for p in preds:
    mv = match_voters.setdefault(p["match_id"], {"1": [], "X": [], "2": []})
    nm = players_by_id.get(p["player_id"])
    if nm:
        mv[p["pick_1x2"]].append(nm)
for mv in match_voters.values():
    for k in mv:
        mv[k].sort()

# ---- crowd split for special bets + champion (top 3 answers each) ----
def top3(counter, total):
    return [{"value": v, "count": c, "pct": round(100 * c / total) if total else 0}
            for v, c in counter.most_common(3)]

SPECIAL_KEYS = ["top_scorer", "best_player", "top_assists", "most_goals_group_stage_team",
                "most_conceded_group_stage_team", "most_goals_tournament_team",
                "most_conceded_tournament_team", "most_cards_team", "least_cards_team",
                "total_red_cards", "total_extra_time", "total_penalties"]
specials_stats = {}
for key in SPECIAL_KEYS:
    cnt = Counter()
    for s in specials:
        v = s.get(key)
        if v is None or v == "":
            continue
        cnt[str(v)] += 1
    tot = sum(cnt.values())
    specials_stats[key] = {"total": tot, "top": top3(cnt, tot)}

champ_cnt = Counter()
for t in teampreds:
    w = (t.get("winner") or [None])[0]
    if w:
        champ_cnt[w] += 1
champ_tot = sum(champ_cnt.values())
champion_stats = {"total": champ_tot, "top": top3(champ_cnt, champ_tot)}

synced = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
PUB.mkdir(parents=True, exist_ok=True)
(PUB / "players").mkdir(exist_ok=True)
json.dump({"synced_at": synced, "players_played": len(results), "standings": rows},
          open(PUB / "standings.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
for pid, pf in player_files.items():
    pf["synced_at"] = synced
    json.dump(pf, open(PUB / "players" / f"{pid}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump({"synced_at": synced, "matches": match_stats},
          open(PUB / "match_stats.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
(PUB / "match_voters").mkdir(exist_ok=True)
for mid, mv in match_voters.items():
    json.dump(mv, open(PUB / "match_voters" / f"{mid}.json", "w", encoding="utf-8"), ensure_ascii=False)
json.dump({"synced_at": synced, "total_players": len(players), "specials": specials_stats, "champion": champion_stats},
          open(PUB / "special_stats.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
json.dump({"synced_at": synced, "tournament_stage": "group", "scoring_version": "stopgap-1",
           "matches_resolved": len(results)},
          open(PUB / "meta.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print("wrote standings + %d player files. top 5:" % len(player_files))
for r in rows[:5]: print(f"  #{r['rank']} {r['name']} — {r['total_points']}pt ({r['correct_group']} correct)")
