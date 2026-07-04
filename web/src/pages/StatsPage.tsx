import { useEffect, useMemo, useState } from 'react'
import type { Distribution, GroupHighlight, StatChoice, StatsFile } from '../types'
import { fetchStats, peekStats } from '../lib/data'
import { teamFlag } from '../lib/flags'
import { SPECIAL_LABELS, STAGE_LABELS, pickLabel } from '../lib/format'
import { Header } from '../components/Header'
import { NavTabs } from '../components/NavTabs'
import { TeamVotersDialog } from '../components/TeamVotersDialog'

const KNOCKOUT_STAGES = ['round_of_16', 'quarter_final', 'semi_final', 'final'] as const

/** Aggregate statistics across every player's guesses. */
export function StatsPage() {
  console.log('deploy trigger')
  const [stats, setStats] = useState<StatsFile | undefined>(peekStats)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setError(true))
  }, [])

  return (
    <div>
      <div className="sticky top-0 z-20 w-full border-b border-ink/10 bg-sand/95 shadow-header backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <Header syncedAt={stats?.synced_at} />
          <NavTabs />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-3">{renderBodyIfNeeded(stats, error)}</div>
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
      <TeamLookupCard advancement={stats.advancement} champion={stats.champion} totalPlayers={stats.total_players} />
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

const TEAM_STAGE_LABELS: [string, string][] = [
  ['round_of_16', 'שמינית'],
  ['quarter_final', 'רבע'],
  ['semi_final', 'חצי'],
  ['final', 'גמר'],
  ['winner', 'אלוף'],
]

function TeamLookupCard({
  advancement,
  champion,
  totalPlayers,
}: {
  advancement: Record<string, Distribution>
  champion: Distribution
  totalPlayers: number
}) {
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [dialog, setDialog] = useState<{ stage: string; teamCode: string; teamHe: string } | undefined>(undefined)

  const allTeams = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>()
    const allDists = [
      ...Object.values(advancement).flatMap((d) => d.dist),
      ...champion.dist,
    ]
    for (const item of allDists) {
      if (item.code && !map.has(item.code)) map.set(item.code, { code: item.code, name: item.value })
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [advancement, champion])

  const stageMap = useMemo(() => {
    const result: Record<string, Record<string, { count: number; pct: number }>> = {}
    for (const [stage, dist] of Object.entries(advancement)) {
      for (const item of dist.dist) {
        if (!item.code) continue
        if (!result[item.code]) result[item.code] = {}
        result[item.code][stage] = { count: item.count, pct: item.pct }
      }
    }
    for (const item of champion.dist) {
      if (!item.code) continue
      if (!result[item.code]) result[item.code] = {}
      result[item.code]['winner'] = { count: item.count, pct: item.pct }
    }
    return result
  }, [advancement, champion])

  const teamData = selected ? stageMap[selected] : undefined

  return (
    <Card title="פילוח לפי נבחרת" emoji="🔍">
      <p className="mb-3 text-xs text-ink/40">בחר נבחרת כדי לראות כמה משתתפים בחרו אותה לכל שלב</p>
      <div className="flex flex-wrap gap-2">
        {allTeams.map((t) => (
          <button
            key={t.code}
            onClick={() => setSelected(selected === t.code ? undefined : t.code)}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              selected === t.code
                ? 'border-sage bg-sage text-white'
                : 'border-ink/10 bg-sand/60 text-ink hover:border-sage/50'
            }`}
          >
            <span>{teamFlag(t.code)}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {selected && teamData && (
        <div className="mt-4 rounded-2xl border border-ink/5 bg-sand/50 p-3">
          <div className="mb-2 text-sm font-bold text-ink">
            {teamFlag(selected)} {allTeams.find((t) => t.code === selected)?.name}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TEAM_STAGE_LABELS.map(([stage, label]) => {
              const data = teamData[stage]
              const count = data?.count ?? 0
              const pct = data?.pct ?? 0
              const teamHe = allTeams.find((t) => t.code === selected)?.name ?? ''
              return (
                <button
                  key={stage}
                  onClick={() => count > 0 && selected && setDialog({ stage, teamCode: selected, teamHe })}
                  className={`flex flex-col items-center gap-1 rounded-xl bg-white p-2 text-center shadow-soft transition-opacity ${count > 0 ? 'cursor-pointer hover:opacity-75' : 'cursor-default'}`}
                >
                  <span className="text-xs text-ink/40">{label}</span>
                  <span className="text-base font-bold text-ink">{count}</span>
                  <span className="text-xs font-semibold text-sage">{pct}%</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-center text-xs text-ink/30">מתוך {totalPlayers} משתתפים</p>
        </div>
      )}
      {dialog && (
        <TeamVotersDialog
          stage={dialog.stage}
          teamCode={dialog.teamCode}
          teamHe={dialog.teamHe}
          onClose={() => setDialog(undefined)}
        />
      )}
    </Card>
  )
}

function HighlightList({ rows }: { rows: GroupHighlight[] }) {
  if (!rows.length) return <p className="py-3 text-center text-sm text-ink/40">אין נתונים</p>
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-2 rounded-xl bg-sand/60 px-3 py-2 text-sm">
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-ink">
            <span className="truncate">{r.home_he}</span>
            <span aria-hidden className="shrink-0">{teamFlag(r.home_code)}</span>
            <span className="shrink-0 text-ink/30">vs</span>
            <span aria-hidden className="shrink-0">{teamFlag(r.away_code)}</span>
            <span className="truncate">{r.away_he}</span>
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
