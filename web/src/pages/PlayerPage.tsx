import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLocalStorage } from 'usehooks-ts'
import type {
  AdvGroupPick,
  CrowdStat,
  GroupItem,
  GroupTeam,
  MatchPickStats,
  PlayerFile,
  SpecialStatsFile,
  ViewMode,
} from '../types'
import { fetchGroups, fetchMatchStats, fetchPlayer, fetchSpecialStats } from '../lib/data'
import { cn } from '../lib/cn'
import { teamFlag, withFlag } from '../lib/flags'
import { findNextMatchId, liveStatus } from '../lib/matchTime'
import { useFlashScroll } from '../lib/useFlashScroll'
import { VotersDialog } from '../components/VotersDialog'
import { TeamVotersDialog } from '../components/TeamVotersDialog'
import { StatTooltip } from '../components/StatTooltip'
import { GroupTooltip } from '../components/GroupTooltip'
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
  const [groups, setGroups] = useState<Record<string, GroupTeam[]>>()
  const [mode, setMode] = useLocalStorage<ViewMode>('player-view-mode', 'detailed')
  const [error, setError] = useState<string>()
  const { flashScrollTo } = useFlashScroll('match')

  useEffect(() => {
    if (!id) return
    Promise.all([fetchPlayer(id), fetchMatchStats(), fetchSpecialStats(), fetchGroups()])
      .then(([p, s, ss, g]) => {
        setPlayer(p)
        setStats(s.matches)
        setSpecialStats(ss)
        setGroups(g.groups)
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
        {renderJumpButtonsIfNeeded(player, flashScrollTo)}
      </div>
      {renderBodyIfNeeded(player, stats, specialStats, groups, mode, setMode, error)}
    </div>
  )
}

function renderSummaryIfNeeded(player: PlayerFile | undefined) {
  if (!player) return <></>
  return <PlayerSummary player={player} />
}

/** Jump buttons (next/live game, advancement) , sticky under the player name. */
function renderJumpButtonsIfNeeded(player: PlayerFile | undefined, flashScrollTo: (id: string | undefined) => void) {
  if (!player) return <></>
  const now = new Date()
  const nextId = findNextMatchId(player.group_stage, now)
  const target = player.group_stage.find((it) => it.match_id === nextId)
  const nextIsLive = target ? liveStatus(target.kickoff, now) === 'live' : false
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      {renderNextGameButtonIfNeeded(nextId, nextIsLive, () => flashScrollTo(nextId))}
      <button
        onClick={() => document.getElementById('group-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        className="inline-flex items-center gap-1.5 rounded-full bg-sun/60 px-4 py-1.5 text-xs font-bold text-ink transition hover:bg-sun/80"
      >
        <StepsIcon /> להימורי שלב הבתים
      </button>
    </div>
  )
}

function renderBodyIfNeeded(
  player: PlayerFile | undefined,
  stats: Record<string, MatchPickStats> | undefined,
  specialStats: SpecialStatsFile | undefined,
  groups: Record<string, GroupTeam[]> | undefined,
  mode: ViewMode,
  setMode: (m: ViewMode) => void,
  error: string | undefined,
) {
  if (error) return <p className="mt-10 text-center text-clay">{error}</p>
  if (!player) return <p className="mt-10 text-center text-ink/40">טוען…</p>
  return (
    <>
      <AdvancementSection player={player} />
      <ChampionSection player={player} championStat={specialStats?.champion} />
      <SpecialsSection player={player} specialStats={specialStats?.specials} />
      <GroupStageSection items={player.group_stage} stats={stats} groups={groups} mode={mode} setMode={setMode} />
    </>
  )
}

function PlayerSummary({ player }: { player: PlayerFile }) {
  const proj = player.projected
  const showProjected = proj && proj.extra_points > 0
  return (
    <div className="mt-3 rounded-3xl bg-gradient-to-bl from-leaf to-sage p-5 text-white shadow-soft">
      <h1 className="text-2xl font-extrabold">{player.name}</h1>
      <div className="mt-3 flex gap-3">
        <Stat label="נקודות" value={player.total_points} />
        {showProjected ? (
          <Stat label="ניקוד משוער" value={proj.projected_total} />
        ) : (
          <Stat label="פגיעות בבתים" value={player.correct_group} />
        )}
      </div>
      {showProjected && (
        <p className="mt-2 text-center text-[11px] font-medium text-white/80">
          ניקוד משוער כולל ‎+{proj.extra_points} מהימורים מיוחדים (לא סופי)
        </p>
      )}
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
  id,
  children,
}: {
  title: string
  action?: React.ReactNode
  bare?: boolean
  id?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={cn('mt-6', id && 'scroll-mt-64')}>
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

/** Neutral "jump to" (locate) icon , the target may be above or below the sticky button. */
function JumpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  )
}

/** Ascending bars , "advancing through the stages". */
function StepsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="5" y1="20" x2="5" y2="15" />
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="19" y1="20" x2="19" y2="5" />
    </svg>
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

/** A team's flag emoji + name. */
function TeamLabel({ name, code, className }: { name: string | null; code: string | null; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-1', className)} title={name ?? ''}>
      <span aria-hidden className="shrink-0">{teamFlag(code)}</span>
      <span className="truncate">{name}</span>
    </span>
  )
}

/**
 * Two team names (with flags) and a versus badge. `spread` pushes them to
 * opposite edges (detailed card header); without it they cluster tight.
 */
function MatchTeams({
  home,
  away,
  homeCode,
  awayCode,
  strong,
  spread,
}: {
  home: string | null
  away: string | null
  homeCode: string | null
  awayCode: string | null
  strong?: boolean
  spread?: boolean
}) {
  const nameCls = cn('text-ink', strong ? 'text-sm font-bold' : 'text-sm font-medium', spread && 'flex-1')
  return (
    <div className="flex flex-1 items-center gap-2">
      <TeamLabel name={home} code={homeCode} className={nameCls} />
      <Versus big={strong} />
      <TeamLabel name={away} code={awayCode} className={cn(nameCls, spread && 'justify-end')} />
    </div>
  )
}

interface GroupSectionProps {
  items: GroupItem[]
  stats?: Record<string, MatchPickStats>
  groups?: Record<string, GroupTeam[]>
  mode: ViewMode
  setMode: (m: ViewMode) => void
}

function GroupStageSection({ items, stats, groups, mode, setMode }: GroupSectionProps) {
  const detailed = mode === 'detailed'
  return (
    <Section title="שלב הבתים · ניחושי 1X2" id="group-stage" action={<ViewToggle mode={mode} setMode={setMode} />} bare={detailed}>
      {detailed ? (
        <div className="space-y-3">
          {items.map((it) => (
            <DetailedGroupCard key={it.match_id} item={it} stats={stats?.[it.match_id]} groupTeams={it.group ? groups?.[it.group] : undefined} />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-ink/5">
          {items.map((it) => (
            <GroupRow key={it.match_id} item={it} groupTeams={it.group ? groups?.[it.group] : undefined} />
          ))}
        </ul>
      )}
    </Section>
  )
}

function renderNextGameButtonIfNeeded(nextId: string | undefined, live: boolean, onClick: () => void) {
  if (!nextId) return <></>
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-sky/25 px-4 py-1.5 text-xs font-bold text-ink transition hover:bg-sky/40"
    >
      {live ? <LiveDot /> : <JumpIcon />}
      {live ? 'למשחק החי' : 'למשחק הבא'}
    </button>
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
function GroupRow({ item, groupTeams }: { item: GroupItem; groupTeams?: GroupTeam[] }) {
  const played = item.actual_score_a !== null && item.actual_score_b !== null
  return (
    <li id={`match-${item.match_id}`} className="flex scroll-mt-64 items-center gap-1.5 rounded-xl px-2 py-3 sm:gap-2">
      <GroupTooltip
        group={item.group}
        teams={groupTeams}
        label={item.group ?? ''}
        triggerClassName="w-4 shrink-0 text-center text-xs font-bold text-ink/30"
      />
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <TeamLabel name={item.home_he} code={item.home_code} className="text-[13px] font-medium text-ink sm:text-sm" />
        <Versus />
        <TeamLabel name={item.away_he} code={item.away_code} className="text-[13px] font-medium text-ink sm:text-sm" />
      </div>
      <div className="flex shrink-0 items-center gap-1.5 ps-0.5 sm:gap-3 sm:ps-1">
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
    if (status === 'live') return <span className="flex w-8 shrink-0 justify-center sm:w-10"><LiveDot /></span>
    if (status === 'awaiting') return <span className="w-8 shrink-0 text-center text-xs text-ink/30 sm:w-10" title="הסתיים, ממתין לעדכון">⏳</span>
    return <span className="w-8 shrink-0 text-center text-[11px] text-ink/30 sm:w-10 sm:text-xs">טרם</span>
  }
  return <Score a={item.actual_score_a} b={item.actual_score_b} className="w-8 shrink-0 justify-center text-[11px] font-semibold text-ink/60 sm:w-10 sm:text-xs" />
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
    <span className={cn('min-w-[1.75rem] rounded-lg border px-1.5 py-0.5 text-center text-xs font-bold sm:min-w-[2.5rem] sm:px-2', statusClasses(status))}>
      <span dir="ltr">{text}</span>
    </span>
  )
}

/** Wide card (detailed view): crowd split + the player's pick highlighted. */
function DetailedGroupCard({ item, stats, groupTeams }: { item: GroupItem; stats?: MatchPickStats; groupTeams?: GroupTeam[] }) {
  const played = item.actual_score_a !== null && item.actual_score_b !== null
  const [openPick, setOpenPick] = useState<'1' | 'X' | '2'>()
  // option order [1, X, 2] → in RTL the home win (1) sits on the right.
  const options: ('1' | 'X' | '2')[] = ['1', 'X', '2']
  return (
    <div id={`match-${item.match_id}`} className="scroll-mt-64 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <GroupTooltip
          group={item.group}
          teams={groupTeams}
          label={`בית ${item.group}`}
          triggerClassName="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/40"
        />
        <MatchTeams home={item.home_he} away={item.away_he} homeCode={item.home_code} awayCode={item.away_code} strong spread />
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
  const [dialog, setDialog] = useState<{ stage: string; teamCode: string; teamHe: string } | undefined>(undefined)

  return (
    <Section title="העפלה ושלבי הנוקאאוט" id="advancement">
      <div className="px-2 py-2">
        <SubTitle>ניחושי דירוג בבתים</SubTitle>
        <QualificationSummaryBar q={player.qualification} />
        <GroupStandingPicks items={adv.group_stage} />
      </div>
      {stages.map((s) => {
        const items = adv[s]
        const stagePoints = items.reduce((acc, t) => acc + t.points, 0)
        const hasResolved = items.some((t) => t.status !== 'pending')
        return (
          <div key={s} className="border-t border-ink/10 px-2 py-3">
            <div className="mb-2 flex items-center gap-2">
              <SubTitle>{STAGE_LABELS[s]}</SubTitle>
              {hasResolved && stagePoints > 0 && (
                <span className="mb-2 rounded-full bg-leaf/15 px-2 py-0.5 text-[11px] font-bold text-leaf">
                  +{stagePoints} נק׳
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((t, i) => (
                <KnockoutChip
                  key={i}
                  team_code={t.team_code}
                  team_he={t.team_he}
                  status={t.status}
                  points={t.points}
                  onClick={() => setDialog({ stage: s, teamCode: t.team_code ?? '', teamHe: t.team_he })}
                />
              ))}
            </div>
          </div>
        )
      })}
      {dialog && (
        <TeamVotersDialog
          stage={dialog.stage}
          teamCode={dialog.teamCode}
          teamHe={dialog.teamHe}
          onClose={() => setDialog(undefined)}
        />
      )}
    </Section>
  )
}

const POSITION_LABELS: Record<number, string> = { 1: 'מקום 1', 2: 'מקום 2', 3: 'מקום 3' }

/** Lean breakdown of qualification points: teams advanced (+2 each) and exact-position bonuses (+1). */
function QualificationSummaryBar({ q }: { q?: PlayerFile['qualification'] }) {
  if (!q || !q.resolved) return <></>
  return (
    <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-leaf/5 px-2.5 py-1.5 text-[11px] text-ink/60">
      <span>
        <b className="text-leaf">{q.qualified_correct}</b> עלו (+2)
      </span>
      <span>
        <b className="text-leaf">{q.bonus_correct}</b> בונוס מיקום (+1)
      </span>
      <span className="font-bold text-ink">סה״כ {q.points} נק׳</span>
    </div>
  )
}

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
                <QualChip key={i} pick={g} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * A group-stage qualification pick: green when the team qualified, red when it didn't,
 * with a floating "+1" badge when the predicted position was also exactly right (the bonus).
 */
function QualChip({ pick }: { pick: AdvGroupPick }) {
  return (
    <span className="relative inline-flex">
      <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', statusClasses(pick.status))}>
        {withFlag(pick.team_code, pick.team_he)}
      </span>
      {pick.bonus && (
        <span className="absolute -top-2 -end-1.5 rounded-full bg-leaf px-1 text-[9px] font-extrabold leading-tight text-white shadow-soft">
          +1
        </span>
      )}
    </span>
  )
}

function ChampionSection({ player, championStat }: { player: PlayerFile; championStat?: CrowdStat }) {
  const c = player.champion
  return (
    <Section title="אלופת העולם">
      <div className="flex items-center gap-2 px-2 py-2">
        <span aria-hidden className="text-xl">🏆</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink">{c.team_he ? withFlag(c.team_code, c.team_he) : '—'}</div>
          {renderChampionCrowdIfNeeded(c)}
        </div>
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

function renderChampionCrowdIfNeeded(c: PlayerFile['champion']) {
  if (!c.crowd || !c.team_he) return <></>
  return (
    <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-leaf">
      <span aria-hidden>👥</span>
      {c.crowd.count}/{c.crowd.total} בחרו ב{c.team_he} ({c.crowd.pct}%)
    </div>
  )
}

function SpecialsSection({ player, specialStats }: { player: PlayerFile; specialStats?: Record<string, CrowdStat> }) {
  // Projected status per field (leading now / not leading / pending), for the live superlative bets.
  const projByKey = Object.fromEntries((player.projected?.fields ?? []).map((f) => [f.key, f]))
  return (
    <Section title="הימורים מיוחדים">
      <ul className="divide-y divide-ink/5">
        {player.specials.map((s) => {
          const pf = projByKey[s.key]
          let label = 'ממתין'
          let status: GroupItem['status'] = 'pending'
          if (s.status === 'correct') {
            label = `נכון · +${s.points}`
            status = 'correct'
          } else if (s.status === 'wrong') {
            label = 'לא נכון'
            status = 'wrong'
          } else if (pf?.leader) {
            label = `מוביל · +${pf.points}`
            status = 'correct'
          } else if (pf && pf.status === 'trailing') {
            label = 'לא מוביל כרגע'
          }
          return (
            <li key={s.key} className="flex items-center gap-2 px-2 py-2.5">
              <span className="flex-1 text-sm text-ink/70">{SPECIAL_LABELS[s.key] ?? s.key}</span>
              <span className="text-sm font-semibold text-ink">{String(s.value ?? '—')}</span>
              <StatTooltip stat={specialStats?.[s.key]} />
              <Chip label={label} status={status} />
            </li>
          )
        })}
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

function KnockoutChip({
  team_code,
  team_he,
  status,
  points,
  onClick,
}: {
  team_code: string | undefined
  team_he: string
  status: GroupItem['status']
  points: number
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="relative inline-flex cursor-pointer">
      <span className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-75', statusClasses(status))}>
        {withFlag(team_code, team_he)}
      </span>
      {status === 'correct' && (
        <span className="absolute -top-2 -end-1.5 rounded-full bg-leaf px-1 text-[9px] font-extrabold leading-tight text-white shadow-soft">
          +{points}
        </span>
      )}
    </button>
  )
}
