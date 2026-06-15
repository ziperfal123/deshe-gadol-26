import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { GroupItem, PlayerFile } from '../types'
import { fetchPlayer } from '../lib/data'
import {
  SPECIAL_LABELS,
  STAGE_LABELS,
  pickLabel,
  statusClasses,
} from '../lib/format'

/** Player page: full breakdown of one player's predictions and how each scored. */
export function PlayerPage() {
  const { id } = useParams<{ id: string }>()
  const [player, setPlayer] = useState<PlayerFile>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!id) return
    fetchPlayer(id)
      .then(setPlayer)
      .catch(() => setError('שגיאה בטעינת השחקן'))
  }, [id])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/" className="text-sm font-medium text-leaf hover:underline">
          → חזרה לטבלה
        </Link>
      </div>
      {renderBodyIfNeeded(player, error)}
    </div>
  )
}

function renderBodyIfNeeded(player: PlayerFile | undefined, error: string | undefined) {
  if (error) return <p className="mt-10 text-center text-clay">{error}</p>
  if (!player) return <p className="mt-10 text-center text-ink/40">טוען…</p>
  return (
    <>
      <PlayerSummary player={player} />
      <GroupStageSection items={player.group_stage} />
      <AdvancementSection player={player} />
      <ChampionSection player={player} />
      <SpecialsSection player={player} />
    </>
  )
}

function PlayerSummary({ player }: { player: PlayerFile }) {
  return (
    <div className="mt-4 rounded-3xl bg-gradient-to-bl from-leaf to-sage p-6 text-white shadow-soft">
      <h1 className="text-2xl font-extrabold">{player.name}</h1>
      <div className="mt-4 flex gap-3">
        <Stat label="נקודות" value={player.total_points} />
        <Stat label="פגיעות בבתים" value={player.correct_group} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/15 px-4 py-3 text-center">
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-base font-bold text-ink/80">{title}</h2>
      <div className="rounded-3xl border border-ink/5 bg-white p-2 shadow-soft">{children}</div>
    </section>
  )
}

function GroupStageSection({ items }: { items: GroupItem[] }) {
  return (
    <Section title="שלב הבתים · ניחושי 1X2">
      <ul className="divide-y divide-ink/5">
        {items.map((it) => (
          <GroupRow key={it.match_id} item={it} />
        ))}
      </ul>
    </Section>
  )
}

function GroupRow({ item }: { item: GroupItem }) {
  const played = item.actual_score_a !== null && item.actual_score_b !== null
  return (
    <li className="flex items-center gap-2 px-2 py-2.5">
      <span className="w-5 text-center text-xs font-bold text-ink/30">{item.group}</span>
      <span className="flex-1 text-sm font-medium text-ink">
        {item.home_he} <span className="text-ink/30">נגד</span> {item.away_he}
      </span>
      <PickBadge pick={item.pick_1x2} />
      {renderResultIfNeeded(played, item)}
      <PointsTag status={item.status} points={item.points} />
    </li>
  )
}

function renderResultIfNeeded(played: boolean, item: GroupItem) {
  if (!played) return <span className="w-12 text-center text-xs text-ink/30">טרם</span>
  // Flex items follow RTL flow, so the home score (first child) sits on the
  // right, aligned under the home team name.
  return (
    <span className="flex w-12 justify-center gap-0.5 text-xs font-semibold text-ink/60">
      <span>{item.actual_score_a}</span>
      <span>:</span>
      <span>{item.actual_score_b}</span>
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
  const cls = statusClasses(status)
  const text = status === 'pending' ? '—' : `+${points}`
  return (
    <span className={`min-w-[2.5rem] rounded-lg border px-2 py-0.5 text-center text-xs font-bold ${cls}`}>
      {text}
    </span>
  )
}

function AdvancementSection({ player }: { player: PlayerFile }) {
  const adv = player.advancement
  const stages = ['round_of_16', 'quarter_final', 'semi_final', 'final'] as const
  return (
    <Section title="העפלה ושלבי הנוקאאוט">
      <div className="px-2 py-2">
        <SubTitle>ניחושי דירוג בבתים</SubTitle>
        <div className="flex flex-wrap gap-1.5">
          {adv.group_stage.map((g, i) => (
            <Chip key={i} label={`${g.team_he} (${g.position})`} status={g.status} />
          ))}
        </div>
      </div>
      {stages.map((s) => (
        <div key={s} className="border-t border-ink/5 px-2 py-2">
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

function ChampionSection({ player }: { player: PlayerFile }) {
  const c = player.champion
  return (
    <Section title="אלופת העולם">
      <div className="flex items-center gap-2 px-2 py-2">
        <span aria-hidden className="text-xl">🏆</span>
        <span className="flex-1 font-semibold text-ink">{c.team_he ?? '—'}</span>
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

function SpecialsSection({ player }: { player: PlayerFile }) {
  return (
    <Section title="הימורים מיוחדים">
      <ul className="divide-y divide-ink/5">
        {player.specials.map((s) => (
          <li key={s.key} className="flex items-center gap-2 px-2 py-2.5">
            <span className="flex-1 text-sm text-ink/70">{SPECIAL_LABELS[s.key] ?? s.key}</span>
            <span className="text-sm font-semibold text-ink">{String(s.value ?? '—')}</span>
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
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}>
      {label}
    </span>
  )
}
