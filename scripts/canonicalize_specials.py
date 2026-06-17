#!/usr/bin/env python3
"""One-time data cleaning: collapse free-text spelling variations in
data/seed/special_predictions.json to a single canonical form per player/team.

ONLY the spelling of the name fields is changed. No pick is altered (the same
player/team the user meant stays the same), no numeric bet, nothing else.
Goal: uniform data so statistics can be derived cleanly.
"""
import json, pathlib

SEED = pathlib.Path(__file__).resolve().parent.parent / "data" / "seed"
PLAYER_FIELDS = ["top_scorer", "best_player", "top_assists"]
TEAM_FIELDS = [
    "most_goals_group_stage_team", "most_conceded_group_stage_team",
    "most_goals_tournament_team", "most_conceded_tournament_team",
    "most_cards_team", "least_cards_team",
]

# canonical -> [all variations that mean the same player]
PLAYER_GROUPS = {
    "ליאו מסי": ["ליאו מסי", "לאו מסי", "לאונל מסי", "ליאונל מסי", "ליונאל מסי", "ליונל מסי", "מסי", "מסי העז", "מסע"],
    "קיליאן אמבפה": ["קיליאן אמבפה", "אמבפה", "קיליאן מבאפה", "קיליין אמבפה", "קליאו אמבפה", "קליאן אמבפה", "קליאן מבאפה", "קליאן מבפה"],
    "למין ימאל": ["למין ימאל", "ימאל", "יאמין יאמל", "יאמין לאמל", "ימין לאמל", "ימין למאל", "לאמין יאמאל", "לאמין יאמל", "לאמין ימאל", "לאמין ימאכ"],
    "ארלינג האלנד": ["ארלינג האלנד", "האלאנד", "הלנד", "הולאנד", "ארלינג האלאנד", "ארלינג הלאנד", "ארלינג בראוט האלנד"],
    "ברונו פרננדש": ["ברונו פרננדש", "ברונו", "ברונו ברננדש", "ברונו פרנדדס", "ברונו פרננדד", "ברונו פרננדז", "ברונו פרננדז'", "ברונו פרננדס", "פרננדס"],
    "כריסטיאנו רונאלדו": ["כריסטיאנו רונאלדו", "כריסטאנו רונלדו", "כריסטיאנו רנאלדו", "רונאלדו", "רונלדו"],
    "ויניסיוס ג'וניור": ["ויניסיוס ג'וניור", "ויניסיוס", "ויניסיוס גוניור", "וינסיוס", "וינסיוס גוניור"],
    "עוסמאן דמבלה": ["עוסמאן דמבלה", "אוסמאן דמבלה", "אוסמן דמבלה", "עוסמאן דאמבלה", "דמבלה"],
    "חוליאן אלבארס": ["חוליאן אלבארס", "חוליאן אלבארז", "חוליאן אלברז", "חוליאן אלברס"],
    "מרטין אודגור": ["מרטין אודגור", "מרטין אודגארד", "מרטין הודגור", "אודאגרד"],
    "ג'וד בלינגהאם": ["ג'וד בלינגהאם", "ג׳וד בלינגהאם", "גוד בלינגהם"],
    "הארי קיין": ["הארי קיין", "האקי קיין", "אריק קיין"],
    "מיקל אויארסבל": ["מיקל אויארסבל", "מיקל אויארסבאל", "מיקל אוירזאבל"],
    "מייקל אוליסה": ["מייקל אוליסה", "אוליסה", "אוליסה מייקל", "אוליזה צרפת"],
    "קאי הברץ": ["קאי הברץ", "קאי האברץ", "הבארץ"],
    "קודי גקפו": ["קודי גקפו", "קודי גאקפו"],
    "ג'מאל מוסיאלה": ["ג'מאל מוסיאלה", "מוסיאלה"],
    "וירגיל ואן דייק": ["וירגיל ואן דייק", "וירג’יל ואן דייק"],
    "פדרי": ["פדרי", "פדרו גונסאלס לופס ( פדרי)"],
}
player_map = {}
for canon, variants in PLAYER_GROUPS.items():
    for v in variants:
        player_map[v] = canon

# team canonical = teams.json name_he for the resolved code
teams = json.load(open(SEED / "teams.json", encoding="utf-8"))
teams = teams if isinstance(teams, list) else teams["teams"]
he2code, name_he = {}, {}
for t in teams:
    name_he[t["code"]] = t["name_he"]
    for n in [t.get("name_he")] + (t.get("aliases") or []):
        if n:
            he2code[n] = t["code"]

path = SEED / "special_predictions.json"
data = json.load(open(path, encoding="utf-8"))

player_changes = team_changes = 0
for r in data:
    for k in PLAYER_FIELDS:
        v = r.get(k)
        if v in (None, ""):
            continue
        v = str(v).strip()
        canon = player_map.get(v, v)
        if canon != r.get(k):
            player_changes += 1
        r[k] = canon
    for k in TEAM_FIELDS:
        v = r.get(k)
        if v in (None, ""):
            continue
        v = str(v).strip()
        code = he2code.get(v)
        canon = name_he[code] if code else v
        if canon != r.get(k):
            team_changes += 1
        r[k] = canon

json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# verify: remaining distinct values
def distinct(fields):
    s = set()
    for r in data:
        for k in fields:
            v = r.get(k)
            if v not in (None, ""):
                s.add(str(v))
    return sorted(s)

players, teams_left = distinct(PLAYER_FIELDS), distinct(TEAM_FIELDS)
print(f"player field changes: {player_changes} | team field changes: {team_changes}")
print(f"distinct players now: {len(players)} | distinct teams now: {len(teams_left)}")
print("remaining distinct players:")
for p in players:
    print("  ", p)
