#!/usr/bin/env python3
"""Invariant test for the PROJECTED (extended) scoring.

Independently re-derives, from the generated outputs + seed, what each player's
provisional superlative points should be, and asserts the engine agrees. Run
AFTER gen_public.py:  python3 scripts/test_projected.py
Exits non-zero on any failure.
"""
import json, pathlib, unicodedata, sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED, PUB = ROOT / "data" / "seed", ROOT / "data" / "public"
def s(p): return json.load(open(SEED / p, encoding="utf-8"))
def pub(p): return json.load(open(PUB / p, encoding="utf-8"))

def norm(x):
    if not x: return ""
    x = unicodedata.normalize("NFD", str(x))
    return "".join(c for c in x if unicodedata.category(c) != "Mn").lower().strip()

teams = s("teams.json"); teams = teams if isinstance(teams, list) else teams["teams"]
code_by_he = {t["name_he"]: t["code"] for t in teams}
for t in teams:
    for a in (t.get("aliases") or []): code_by_he.setdefault(a, t["code"])
alias = s("player_alias.json").get("players", {})
specials = {x["player_id"]: x for x in s("special_predictions.json")}

leaders = pub("leaders.json")["fields"]
proj = pub("standings_projected.json")
official = {r["player_id"]: r["total_points"] for r in pub("standings.json")["standings"]}

PLAYER_FIELDS = {"top_scorer", "top_assists"}
PTS = {"top_scorer": 20, "top_assists": 15, "most_goals_group_stage_team": 10,
       "most_conceded_group_stage_team": 10, "most_goals_tournament_team": 10,
       "most_conceded_tournament_team": 10, "most_cards_team": 10, "least_cards_team": 10}

# expected leader identity sets, derived from leaders.json
leader_norm_names = {k: {norm(l.get("name")) for l in v["leaders"]} for k, v in leaders.items() if k in PLAYER_FIELDS}
leader_codes = {k: {l.get("code") for l in v["leaders"]} for k, v in leaders.items() if k not in PLAYER_FIELDS}
live = {k: v["live"] for k, v in leaders.items()}

def expected_leader(field, pick):
    if not pick or not live.get(field):
        return False
    if field in PLAYER_FIELDS:
        lat = alias.get(str(pick).strip())
        return bool(lat) and norm(lat) in leader_norm_names.get(field, set())
    return code_by_he.get(str(pick).strip()) in leader_codes.get(field, set())

fails = []
checked_fields = 0
# 1) per-player: engine's projected breakdown matches an independent re-derivation
for r in proj["standings"]:
    pid = r["player_id"]
    pf = pub(f"players/{pid}.json")["projected"]
    sp = specials.get(pid, {})
    exp_extra = 0
    for f in pf["fields"]:
        checked_fields += 1
        exp = expected_leader(f["key"], sp.get(f["key"]))
        if f["leader"] != exp:
            fails.append(f"{pid} {f['key']}: engine leader={f['leader']} expected={exp} (pick={sp.get(f['key'])})")
        exp_pts = PTS[f["key"]] if exp else 0
        if f["points"] != exp_pts:
            fails.append(f"{pid} {f['key']}: points={f['points']} expected={exp_pts}")
        exp_extra += exp_pts
        # pending (non-live) fields must never award points
        if not live.get(f["key"]) and f["points"] != 0:
            fails.append(f"{pid} {f['key']}: pending field awarded {f['points']}")
    # 2) totals reconcile
    if pf["extra_points"] != exp_extra:
        fails.append(f"{pid}: extra_points={pf['extra_points']} expected={exp_extra}")
    if pf["projected_total"] != pf["official_total"] + exp_extra:
        fails.append(f"{pid}: projected_total != official + extra")
    if r["projected_total"] != pf["projected_total"]:
        fails.append(f"{pid}: standings vs player-file projected_total mismatch")
    # 3) official_total in projected == official standings total (SSOT consistency)
    if official.get(pid) != pf["official_total"]:
        fails.append(f"{pid}: official_total {pf['official_total']} != standings {official.get(pid)}")

# 4) ranking is non-increasing by projected_total
tot = [r["projected_total"] for r in proj["standings"]]
if tot != sorted(tot, reverse=True):
    fails.append("projected standings not sorted by projected_total desc")

# 5) tie rule sanity: every player who picked a current top_scorer leader is credited
if live.get("top_scorer"):
    credited = {r["player_id"] for r in proj["standings"]
                if any(f["key"] == "top_scorer" and f["leader"]
                       for f in pub(f"players/{r['player_id']}.json")["projected"]["fields"])}
    for pid, spx in specials.items():
        if expected_leader("top_scorer", spx.get("top_scorer")) and pid not in credited:
            fails.append(f"tie rule: {pid} picked a top-scorer leader but not credited")

print(f"checked {len(proj['standings'])} players, {checked_fields} field-assertions")
print("live fields:", {k: v for k, v in live.items()})
if fails:
    print(f"\nFAILED ({len(fails)}):")
    for f in fails[:30]: print("  -", f)
    sys.exit(1)
print("\nALL INVARIANTS PASS ✓")
