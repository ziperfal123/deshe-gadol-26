import { useEffect, useState } from 'react'
import type { Distribution, GroupHighlight, StatChoice, StatsFile } from '../types'
import { fetchStats } from '../lib/data'
import { teamFlag } from '../lib/flags'
import { SPECIAL_LABELS, STAGE_LABELS, pickLabel } from '../lib/format'
import { Header } from '../components/Header'
import { NavTabs } from '../components/NavTabs'

const KNOCKOUT_STAGES = ['round_of_16', 'quarter_final', 'semi_final', 'final'] as const

/** Aggregate statistics across every player's guesses. */
export function StatsPage() {
  const [stats, setStats] = useState<StatsFile>()
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setError(true))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Header syncedAt={stats?.synced_at} />
      <NavTabs />
      {renderBodyIfNeeded(stats, error)}
    </div>
  )
}

function renderBodyIfNeeded(stats: StatsFile | undefined, error: boolean) {
  if (error) return <p className="mt-10 text-center text-clay">שגיאה בטעינת הסטטיסטיקות</p>
  if (!stats) return <p className="mt-10 text-center text-ink/40">טוען…</p>
  return (
    <>
      <p className="mt-4 text-center text-xs text-ink/45">פילוח כל הניחושים · {stats.total_players} משתתפים</p>
      <ChampionCard champion={stats.champion} />
      <KnockoutCard advancement={stats.advancement} />
      <SpecialsCard specials={stats.specials} />
      <GroupCard group={stats.group} />
    </>
  )
}

function Card({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-base font-bold text-ink/80">
        <span aria-hidden className="ml-1">{emoji}</span>
        {title}
      </h2>
      <div className="rounded-3xl border border-ink/5 bg-white p-4 shadow-soft">{children}</div>
    </section>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-xs font-bold text-ink/40">{children}</div>
}

/** Horizontal bar list for a distribution (value + count/% + bar). */
function DistBars({ dist, limit }: { dist: StatChoice[]; limit?: number }) {
  const rows = limit ? dist.slice(0, limit) : dist
  if (!rows.length) return <p className="py-3 text-center text-sm text-ink/40">אין נתונים עדיין</p>
  return (
    <ul className="space-y-2.5">
      {rows.map((c, i) => (
        <li key={i}>
          <div className="mb-1 flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium text-ink">
              {c.code ? `${teamFlag(c.code)} ` : ''}
              {c.value}
            </span>
            <span className="shrink-0 text-xs font-semibold text-ink/55">
              {c.count} · {c.pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-sage" style={{ width: `${c.pct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ChampionCard({ champion }: { champion: Distribution }) {
  return (
    <Card title="אלופת העולם" emoji="🏆">
      <DistBars dist={champion.dist} limit={10} />
    </Card>
  )
}

function KnockoutCard({ advancement }: { advancement: Record<string, Distribution> }) {
  return (
    <Card title="מי יגיע לשלבי הנוקאאוט?" emoji="🧗">
      <div className="space-y-5">
        {KNOCKOUT_STAGES.map((stage) => (
          <div key={stage}>
            <SubTitle>{STAGE_LABELS[stage]}</SubTitle>
            <DistBars dist={advancement[stage]?.dist ?? []} limit={6} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function SpecialsCard({ specials }: { specials: Record<string, Distribution> }) {
  const keys = Object.keys(SPECIAL_LABELS)
  return (
    <Card title="הימורים מיוחדים" emoji="⭐">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {keys.map((key) => (
          <div key={key} className="rounded-2xl bg-sand/50 p-3">
            <SubTitle>{SPECIAL_LABELS[key]}</SubTitle>
            <DistBars dist={specials[key]?.dist ?? []} limit={4} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function GroupCard({ group }: { group: StatsFile['group'] }) {
  return (
    <Card title="שלב הבתים · עובדות" emoji="📊">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <SubTitle>הכי בקונצנזוס</SubTitle>
          <HighlightList rows={group.most_consensus} />
        </div>
        <div>
          <SubTitle>הכי שנויים במחלוקת</SubTitle>
          <HighlightList rows={group.most_split} />
        </div>
      </div>
    </Card>
  )
}

function HighlightList({ rows }: { rows: GroupHighlight[] }) {
  if (!rows.length) return <p className="py-3 text-center text-sm text-ink/40">אין נתונים</p>
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-2 rounded-xl bg-sand/60 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate text-ink">
            {teamFlag(r.home_code)} {r.home_he} <span className="text-ink/30">vs</span> {teamFlag(r.away_code)} {r.away_he}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-ink/60">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-sky/20">{r.dominant_pick ? pickLabel(r.dominant_pick) : '—'}</span>
            {r.dominant_pct}%
          </span>
        </li>
      ))}
    </ul>
  )
}
