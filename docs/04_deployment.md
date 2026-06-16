# 04 — Deployment (GitHub Pages)

The site is built and published by a single GitHub Actions workflow:
`.github/workflows/deploy.yml`. Hosting is GitHub Pages (public repo, static build).

## What the workflow does

1. **Checkout** the repo.
2. **Set up Python 3.12** and run `python3 scripts/gen_public.py` to refresh
   computed data from live results (ESPN). The generator uses only the Python
   standard library, so there is no `pip install` step.
   - This step is **failure-tolerant** (`continue-on-error: true`). If ESPN is
     unreachable in CI, the build proceeds using whatever `data/public` is
     committed in the repo, so a fetch failure never blocks a deploy.
3. **Set up Node 22** (with npm cache keyed on `web/package-lock.json`).
4. **`npm ci`** in `web/` to install dependencies.
5. **`npm run build`** in `web/`. This runs `sync:data` (copies
   `data/public` → `web/public/data`) then `tsc -b && vite build`, producing the
   static site in `web/dist`.
6. **Upload** `web/dist` as the Pages artifact.
7. A separate **`deploy`** job (depends on `build`) publishes the artifact via
   `actions/deploy-pages` using the `github-pages` environment.

The Vite `base` is `'./'` (relative) and the app uses `HashRouter`, so it works
correctly under the GitHub Pages project subpath.

## Data is regenerated at build time, not committed

The workflow recomputes `data/public` on every run and feeds the fresh output
straight into the build. It does **not** commit the regenerated data. Each
deploy is built from scratch; `data/public` in the repo is just the fallback.

## Triggers

- **`workflow_dispatch`** — manual run from the Actions tab.
- **`push` to `main`** — rebuild + deploy on every push.
- **`schedule`** — twice daily refresh of live results.

### Cron schedule and the IDT/UTC caveat

GitHub cron runs in **UTC** and does **not** observe daylight saving time.
The World Cup 2026 (June-July 2026) falls entirely within Israel Daylight Time
(IDT = UTC+3), so the schedule hard-codes a +3 offset:

| Israel time (IDT) | UTC | cron |
| --- | --- | --- |
| ~06:07 | 03:07 | `7 3 * * *` |
| ~11:07 | 08:07 | `7 8 * * *` |
| ~22:37 | 19:37 | `37 19 * * *` |

The morning run is set an hour early (06:07 rather than ~07:00) to absorb
GitHub's scheduler lag, so the fresh data is live well before the morning.

Minutes are intentionally off the round `:00`/`:30` marks: GitHub's scheduled
runs are best-effort and get delayed or dropped under load, worst at the top of
the hour. Odd minutes reduce the chance of a missed run.

**Caveat:** outside IDT (i.e. during Israel Standard Time, UTC+2) these runs
would drift by one hour, firing at 06:00 and 21:30 local time instead. Since the
tournament is entirely within IDT, this is acceptable and intentional.

## One-time setup: enable Pages

Pages must be enabled once for this repo before the first deploy succeeds:

> **Settings → Pages → Build and deployment → Source = "GitHub Actions"**

No branch or folder selection is needed when the source is "GitHub Actions".

## Triggering a manual run

In the GitHub UI: **Actions → "Deploy to GitHub Pages" → "Run workflow"**
(select the `main` branch). The deploy URL appears on the `deploy` job once it
completes.
