import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLocalStorage } from 'usehooks-ts'
import type {
  AdvGroupPick,
  CrowdStat,
  GroupItem,
  MatchPickStats,
  PlayerFile,
  SpecialStatsFile,
  ViewMode,
} from '../types'
import { fetchMatchStats, fetchPlayer, fetchSpecialStats } from '../lib/data'
import { cn } from '../lib/cn'
import { findNextMatchId, liveStatus } from '../lib/matchTime'
import { useFlashScroll } from '../lib/useFlashScroll'
import { VotersDialog } from '../components/VotersDialog'
import { StatTooltip } from '../components/StatTooltip'
import {
  SPECIAL_LABELS,
  STAGE_LABELS,
  formatKickoffIL,
  pickLabel,
  statusClasses,
} from '../lib/format'

/** Player page: full breakdown of one player's predictions and how each scored. */
export function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const [player, setPlayer] = useState<PlayerFile>()
  const [stats, setStats] = useState<Record<string, MatchPickStats>>()
  const [specialStats, setSpecialStats] = useState<SpecialStatsFile>()
  const [mode, setMode] = useLocalStorage<ViewMode>('player-view-mode', 'detailed')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!id) return
    Promise.all([fetchPlayer(id), fetchMatchStats(), fetchSpecialStats()])
      .then(([p, s, ss]) => {
        setPlayer(p)
        setStats(s.matches)
        setSpecialStats(ss)
      })
      .catch(() => setError('שגיאה בטעינת השחקן'))
  }, [id])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="sticky top-0 z-20 -mx-4 rounded-b-3xl border-b border-ink/10 bg-sand/95 px-4 pb-3 pt-4 shadow-header backdrop-blur">
        <Link
          to="/"
          className="inline-flex items-center gap-1 rounded-full bg-leaf/15 px-3.5 py-1.5 text-sm font-bold text-leaf shadow-soft transition hover:bg-leaf/25"
        >
          <span aria-hidden>→</span> חזרה לטבלה
        </Link>
        {renderSummaryIfNeeded(player)}
      </div>
      {renderBodyIfNeeded(player, stats, specialStats, mode, setMode, error)}
    </div>
  )
}

function renderSummaryIfNeeded(player: PlayerFile | undefined) {
  if (!player) return <></>
  return <PlayerSummary player={player} />
}

function renderBodyIfNeeded(
  player: PlayerFile | undefined,
  stats: Record<string, MatchPickStats> | undefined,
  specialStats: SpecialStatsFile | undefined,
  mode: ViewMode,
  setMode: (m: ViewMode) => void,
  error: string | undefined,
) {
  if (error) return <p className="mt-10 text-center text-clay">{error}</p>
  if (!player) return <p className="mt-10 text-center text-ink/40">טוען…</p>
  return (
    <>
      <GroupStageSection items={player.group_stage} stats={stats} mode={mode} setMode={setMode} />
      <AdvancementSection player={player} />
      <ChampionSection player={player} championStat={specialStats?.champion} />
      <SpecialsSection player={player} specialStats={specialStats?.specials} />
    </>
  )
}

function PlayerSummary({ player }: { player: PlayerFile }) {
  return (
    <div className="mt-3 rounded-3xl bg-gradient-to-bl from-leaf to-sage p-5 text-white shadow-soft">
      <h1 className="text-2xl font-extrabold">{player.name}</h1>
      <div className="mt-3 flex gap-3">
        <Stat label="נקודות" value={player.total_points} />
        <Stat label="פגיעות בבתים" value={player.correct_group} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/15 px-4 py-2.5 text-center">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  )
}

function Section({
  title,
  action,
  bare,
  children,
}: {
  title: string
  action?: React.ReactNode
  bare?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="text-base font-bold text-ink/80">{title}</h2>
        {action}
      </div>
      {bare ? children : (
        <div className="rounded-3xl border border-ink/5 bg-white p-2 shadow-soft">{children}</div>
      )}
    </section>
  )
}

/** Clean "VS" separator between two team names. */
function Versus({ big }: { big?: boolean }) {
  return (
    <span
      aria-label="נגד"
      className={cn('shrink-0 font-bold tracking-wide text-ink/55', big ? 'text-xs' : 'text-[11px]')}
    >
      VS
    </span>
  )
}

/**
 * Two team names with a versus badge. `spread` pushes them to opposite edges
 * (detailed card header); without it they cluster tight on the right.
 */
function MatchTeams({
  home,
  away,
  strong,
  spread,
}: {
  home: string | null
  away: string | null
  strong?: boolean
  spread?: boolean
}) {
  const nameCls = cn('truncate text-ink', strong ? 'text-sm font-bold' : 'text-sm font-medium', spread && 'flex-1')
  return (
    <div className="flex flex-1 items-center gap-2">
      <span className={nameCls}>{home}</span>
      <Versus big={strong} />
      <span className={cn(nameCls, spread && 'text-left')}>{away}</span>
    </div>
  )
}

interface GroupSectionProps {
  items: GroupItem[]
  stats?: Record<string, MatchPickStats>
  mode: ViewMode
  setMode: (m: ViewMode) => void
}

function GroupStageSection({ items, stats, mode, setMode }: GroupSectionProps) {
  const detailed = mode === 'detailed'
  const now = new Date()
  const nextId = findNextMatchId(items, now)
  const target = items.find((it) => it.match_id === nextId)
  const nextIsLive = target ? liveStatus(target.kickoff, now) === 'live' : false
  const { flashScrollTo } = useFlashScroll('match')
  return (
    <Section title="שלב הבתים · ניחושי 1X2" action={<ViewToggle mode={mode} setMode={setMode} />} bare={detailed}>
      {renderNextGameButtonIfNeeded(nextId, nextIsLive, () => flashScrollTo(nextId))}
      {detailed ? (
        <div className="space-y-3">
          {items.map((it) => (
            <DetailedGroupCard key={it.match_id} item={it} stats={stats?.[it.match_id]} />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-ink/5">
          {items.map((it) => (
            <GroupRow key={it.match_id} item={it} />
          ))}
        </ul>
      )}
    </Section>
  )
}

function renderNextGameButtonIfNeeded(nextId: string | undefined, live: boolean, onClick: () => void) {
  if (!nextId) return <></>
  return (
    <div className="mb-3 flex justify-center">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full bg-leaf/10 px-4 py-1.5 text-xs font-bold text-leaf transition hover:bg-leaf/20"
      >
        {live ? <LiveDot /> : <span aria-hidden>⬇</span>}
        {live ? 'למשחק החי' : 'למשחק הבא'}
      </button>
    </div>
  )
}

/** Blinking green dot indicating a live match. */
function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-leaf" />
    </span>
  )
}

const VIEW_OPTIONS: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'standard', label: 'סטנדרטי', icon: '☰' },
  { mode: 'detailed', label: 'מפורט', icon: '📊' },
]

function ViewToggle({ mode, setMode }: { mode: ViewMode; setMode: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-2xl bg-ink/5 p-1">
      {VIEW_OPTIONS.map((opt) => {
        const active = mode === opt.mode
        const className = cn(
          'rounded-xl px-3 py-1 text-xs',
          active ? 'bg-white font-bold text-ink shadow-soft' : 'font-medium text-ink/50',
        )
        return (
          <button key={opt.mode} onClick={() => setMode(opt.mode)} className={className}>
            <span aria-hidden className="ml-1">{opt.icon}</span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Compact row (standard view). Teams use equal flexible columns so they align
 * across rows and only truncate when there is genuinely no room. The result /
 * pick / points cluster on the left, separated by a divider for breathing room.
 */
function GroupRow({ item }: { item: GroupItem }) {
  const played = item.actual_score_a !== null && item.actual_score_b !== null
  return (
    <li id={`match-${item.match_id}`} className="flex scroll-mt-44 items-center gap-2 rounded-xl px-2 py-3">
      <span className="w-4 shrink-0 text-center text-xs font-bold text-ink/30">{item.group}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate text-sm font-medium text-ink" title={item.home_he ?? ''}>
          {item.home_he}
        </span>
        <Versus />
        <span className="min-w-0 truncate text-sm font-medium text-ink" title={item.away_he ?? ''}>
          {item.away_he}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3 ps-1">
        <PickBadge pick={item.pick_1x2} />
        <span className="h-4 w-px bg-ink/15" />
        {renderResultIfNeeded(played, item)}
        <PointsTag status={item.status} points={item.points} />
      </div>
    </li>
  )
}

function renderResultIfNeeded(played: boolean, item: GroupItem) {
  if (!played) {
    const status = liveStatus(item.kickoff)
    if (status === 'live') return <span className="flex w-10 shrink-0 justify-center"><LiveDot /></span>
    if (status === 'awaiting') return <span className="w-10 shrink-0 text-center text-xs text-ink/30" title="הסתיים, ממתין לעדכון">⏳</span>
    return <span className="w-10 shrink-0 text-center text-xs text-ink/30">טרם</span>
  }
  return <Score a={item.actual_score_a} b={item.actual_score_b} className="w-10 shrink-0 justify-center text-xs font-semibold text-ink/60" />
}

/** Score with the home value (first child) on the right, matching RTL team order. */
function Score({ a, b, className }: { a: number | null; b: number | null; className?: string }) {
  return (
    <span className={cn('flex gap-0.5', className)}>
      <span>{a}</span>
      <span>:</span>
      <span>{b}</span>
    </span>
  )
}

function PickBadge({ pick }: { pick: '1' | 'X' | '2' }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky/20 text-xs font-bold text-ink">
      {pickLabel(pick)}
    </span>
  )
}

function PointsTag({ status, points }: { status: GroupItem['status']; points: number }) {
  const text = status === 'pending' ? '—' : status === 'correct' ? `+${points}` : '0'
  return (
    <span className={cn('min-w-[2.5rem] rounded-lg border px-2 py-0.5 text-center text-xs font-bold', statusClasses(status))}>
      <span dir="ltr">{text}</span>
    </span>
  )
}

/** Wide card (detailed view): crowd split + the player's pick highlighted. */
function DetailedGroupCard({ item, stats }: { item: GroupItem; stats?: MatchPickStats }) {
  const played = item.actual_score_a !== null && item.actual_score_b !== null
  const [openPick, setOpenPick] = useState<'1' | 'X' | '2'>()
  // option order [1, X, 2] → in RTL the home win (1) sits on the right.
  const options: ('1' | 'X' | '2')[] = ['1', 'X', '2']
  return (
    <div id={`match-${item.match_id}`} className="scroll-mt-44 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/40">
          בית {item.group}
        </span>
        <MatchTeams home={item.home_he} away={item.away_he} strong spread />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {options.map((key) => (
          <SplitBox
            key={key}
            pick={key}
            pct={stats?.pct[key] ?? 0}
            selected={item.pick_1x2 === key}
            onClick={() => setOpenPick(key)}
          />
        ))}
      </div>
      <CrowdLine item={item} stats={stats} />
      {renderDetailedResultIfNeeded(played, item)}
      {renderVotersDialogIfNeeded(openPick, item, () => setOpenPick(undefined))}
    </div>
  )
}

function renderVotersDialogIfNeeded(
  pick: '1' | 'X' | '2' | undefined,
  item: GroupItem,
  onClose: () => void,
) {
  if (!pick) return <></>
  return (
    <VotersDialog
      matchId={item.match_id}
      pick={pick}
      homeHe={item.home_he}
      awayHe={item.away_he}
      onClose={onClose}
    />
  )
}

function SplitBox({
  pick,
  pct,
  selected,
  onClick,
}: {
  pick: '1' | 'X' | '2'
  pct: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl p-2 text-center transition hover:brightness-95 active:scale-[0.98]',
        selected ? 'border-2 border-sky bg-sky/20' : 'border border-ink/10 bg-sand',
      )}
    >
      <div className={cn('text-lg font-extrabold', selected ? 'text-ink' : 'text-ink/70')}>{pickLabel(pick)}</div>
      <div className={cn('text-xs font-semibold', selected ? 'text-ink/70' : 'text-ink/45')}>{pct}%</div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/15">
        <div className={cn('h-full rounded-full', selected ? 'bg-sky' : 'bg-ink/40')} style={{ width: `${pct}%` }} />
      </div>
    </button>
  )
}

function CrowdLine({ item, stats }: { item: GroupItem; stats?: MatchPickStats }) {
  if (!stats) return <></>
  const same = stats.counts[item.pick_1x2]
  const others = Math.max(0, same - 1)
  const label = item.pick_1x2 === '1' ? item.home_he : item.pick_1x2 === '2' ? item.away_he : 'תיקו'
  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-leaf">
      <span aria-hidden>👥</span>
      {crowdText(others, label)}
    </p>
  )
}

function crowdText(others: number, label: string | null): string {
  const target = label ?? 'אותה תוצאה'
  if (others <= 0) return `אתה היחיד שבחר ב${target}`
  if (others === 1) return `עוד משתתף אחד בחר ב${target}`
  return `עוד ${others} משתתפים בחרו ב${target}`
}

function renderKickoffIfNeeded(kickoff: string) {
  if (!kickoff) return <></>
  return <span className="text-leaf"> · 🕒 {kickoff}</span>
}

function renderDetailedResultIfNeeded(played: boolean, item: GroupItem) {
  if (!played) {
    const status = liveStatus(item.kickoff)
    if (status === 'live') {
      return (
        <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-leaf">
          <LiveDot />
          משחק חי
        </div>
      )
    }
    if (status === 'awaiting') {
      return (
        <p className="mt-3 text-[11px] font-medium text-ink/60">
          הסתיים. התוצאה תתעדכן בעדכון הבא ⏳
        </p>
      )
    }
    const kickoff = formatKickoffIL(item.kickoff)
    return (
      <p className="mt-3 text-[11px] font-medium text-ink/60">
        המשחק טרם שוחק{renderKickoffIfNeeded(kickoff)}
      </p>
    )
  }
  const text = item.status === 'correct' ? `+${item.points}` : '0'
  return (
    <div className="mt-3 flex items-center gap-2 border-t border-ink/5 pt-2 text-xs">
      <span className="text-ink/50">תוצאה:</span>
      <Score a={item.actual_score_a} b={item.actual_score_b} className="font-semibold text-ink/70" />
      <span className={cn('rounded-lg border px-2 py-0.5 font-bold', statusClasses(item.status))}>
        <span dir="ltr">{text}</span>
      </span>
    </div>
  )
}

function AdvancementSection({ player }: { player: PlayerFile }) {
  const adv = player.advancement
  const stages = ['round_of_16', 'quarter_final', 'semi_final', 'final'] as const
  return (
    <Section title="העפלה ושלבי הנוקאאוט">
      <div className="px-2 py-2">
        <SubTitle>ניחושי דירוג בבתים</SubTitle>
        <GroupStandingPicks items={adv.group_stage} />
      </div>
      {stages.map((s) => (
        <div key={s} className="border-t border-ink/10 px-2 py-3">
          <SubTitle>{STAGE_LABELS[s]}</SubTitle>
          <div className="flex flex-wrap gap-1.5">
            {adv[s].map((p, i) => (
              <Chip key={i} label={p.team_he} status={p.status} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  )
}

const POSITION_LABELS: Record<number, string> = { 1: 'מקום 1', 2: 'מקום 2', 3: 'מקום 3' }

/** Group-stage advancement picks, split into labeled sub-groups by predicted position. */
function GroupStandingPicks({ items }: { items: AdvGroupPick[] }) {
  const positions = [1, 2, 3].filter((pos) => items.some((g) => g.position === pos))
  return (
    <div className="divide-y divide-ink/10">
      {positions.map((pos) => (
        <div key={pos} className="py-3 first:pt-0 last:pb-0">
          <div className="mb-1.5 text-[11px] font-bold text-ink/40">{POSITION_LABELS[pos]}</div>
          <div className="flex flex-wrap gap-2">
            {items
              .filter((g) => g.position === pos)
              .map((g, i) => (
                <Chip key={i} label={g.team_he} status={g.status} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChampionSection({ player, championStat }: { player: PlayerFile; championStat?: CrowdStat }) {
  const c = player.champion
  return (
    <Section title="אלופת העולם">
      <div className="flex items-center gap-2 px-2 py-2">
        <span aria-hidden className="text-xl">🏆</span>
        <span className="flex-1 font-semibold text-ink">{c.team_he ?? '—'}</span>
        <StatTooltip stat={championStat} />
        {renderChampionPotentialIfNeeded(c.points_if_correct)}
        <Chip label={c.status === 'pending' ? 'ממתין' : `+${c.points}`} status={c.status} />
      </div>
    </Section>
  )
}

function renderChampionPotentialIfNeeded(pts?: number) {
  if (pts === undefined) return <></>
  return <span className="text-xs text-ink/40">שווי: {pts} נק׳</span>
}

function SpecialsSection({ player, specialStats }: { player: PlayerFile; specialStats?: Record<string, CrowdStat> }) {
  return (
    <Section title="הימורים מיוחדים">
      <ul className="divide-y divide-ink/5">
        {player.specials.map((s) => (
          <li key={s.key} className="flex items-center gap-2 px-2 py-2.5">
            <span className="flex-1 text-sm text-ink/70">{SPECIAL_LABELS[s.key] ?? s.key}</span>
            <span className="text-sm font-semibold text-ink">{String(s.value ?? '—')}</span>
            <StatTooltip stat={specialStats?.[s.key]} />
            <Chip label="ממתין" status={s.status} />
          </li>
        ))}
      </ul>
    </Section>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-xs font-bold text-ink/40">{children}</div>
}

function Chip({ label, status }: { label: string; status: GroupItem['status'] }) {
  return (
    <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', statusClasses(status))}>{label}</span>
  )
}
