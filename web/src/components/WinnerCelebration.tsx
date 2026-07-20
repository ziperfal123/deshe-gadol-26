import { useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import type { StandingsRow } from '../types'
import { getInitials, avatarColor } from '../lib/avatar'
import { cn } from '../lib/cn'
import { CELEBRATION_MAX_VIEWS, LAST_PLACE_PRIZE, PRIZES_BY_RANK } from '../consts/prizes'

/** A single confetti piece, positioned + colored + timed via inline style. */
interface ConfettiPiece {
  left: number
  delay: number
  duration: number
  color: string
  size: number
}

const CONFETTI_COLORS = ['#F2CC8F', '#E07A5F', '#81B29A', '#6FB3D9', '#3D8361', '#E6B15E']

/** Build a fixed set of confetti pieces spread across the width (index-seeded, no RNG). */
function buildConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: (i * 97) % 100,
    delay: (i % 10) * 0.22,
    duration: 2.6 + ((i * 7) % 20) / 10,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 7 + ((i * 3) % 6),
  }))
}

const CONFETTI = buildConfetti(70)

/**
 * End-of-tournament celebration overlay: reads the final standings and reveals the
 * top-5 prize winners (podium for the top 3, rows for 4-5) plus a special last-place
 * consolation. Auto-opens on the first few visits, then stops nagging.
 */
export function WinnerCelebration({ standings }: { standings: StandingsRow[] }) {
  const [views, setViews] = useLocalStorage('celebration-views', 0)
  const [open, setOpen] = useState(views < CELEBRATION_MAX_VIEWS)

  // Count this auto-open once (on mount) so it stops after CELEBRATION_MAX_VIEWS visits.
  useEffect(() => {
    if (open) setViews((v) => v + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!open || standings.length === 0) return <></>

  const byRank = [...standings].sort((a, b) => a.rank - b.rank)
  const first = byRank.find((r) => r.rank === 1)
  const second = byRank.find((r) => r.rank === 2)
  const third = byRank.find((r) => r.rank === 3)
  const runnersUp = byRank.filter((r) => r.rank === 4 || r.rank === 5)
  const last = byRank[byRank.length - 1]

  const onClose = () => setOpen(false)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <Confetti />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        className="relative z-10 my-auto w-full max-w-lg animate-pop-in rounded-3xl border border-sun/50 bg-sand p-5 text-center shadow-soft sm:p-7"
      >
        <button
          onClick={onClose}
          aria-label="סגור"
          className="absolute left-4 top-4 rounded-full p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
        >
          ✕
        </button>

        <p className="text-sm font-bold text-clay">מונדיאל 2026 · הסתיים</p>
        <h2 id="celebration-title" className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
          🏆 אלופי הדשא הגדול
        </h2>
        <p className="mt-1 text-sm font-medium text-ink/55">טובי המוחות של הדשא הגדול · אלה שראו את העתיד</p>

        {/* Podium: 2nd · 1st · 3rd */}
        <div className="mt-6 flex items-end justify-center gap-2 sm:gap-4">
          <PodiumColumn finisher={second} place={2} />
          <PodiumColumn finisher={first} place={1} />
          <PodiumColumn finisher={third} place={3} />
        </div>

        {/* Places 4-5 */}
        {runnersUp.length > 0 && (
          <ul className="mt-5 space-y-2">
            {runnersUp.map((r) => (
              <RunnerUpRow key={r.player_id} row={r} />
            ))}
          </ul>
        )}

        {/* Special last-place consolation */}
        {last && <LastPlaceCallout row={last} />}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-sun py-3 font-bold text-ink shadow-soft transition hover:brightness-95"
        >
          לטבלה המלאה
        </button>
      </div>
    </div>
  )
}

const PLACE_STYLE: Record<number, { block: string; medal: string; height: string }> = {
  1: { block: 'bg-gradient-to-b from-sun to-[#E6B15E]', medal: '🥇', height: 'h-24 sm:h-28' },
  2: { block: 'bg-gradient-to-b from-[#D7DBE2] to-[#B9C0CC]', medal: '🥈', height: 'h-16 sm:h-20' },
  3: { block: 'bg-gradient-to-b from-[#E7A986] to-clay', medal: '🥉', height: 'h-12 sm:h-16' },
}

function PodiumColumn({ finisher, place }: { finisher?: StandingsRow; place: number }) {
  if (!finisher) return <></>
  const style = PLACE_STYLE[place]
  const isWinner = place === 1
  return (
    <div className="flex flex-1 flex-col items-center">
      <PodiumAvatar name={finisher.name} winner={isWinner} />
      <div className="mt-2 min-h-[2.75rem] px-0.5 text-center">
        <div className={cn('leading-tight text-ink', isWinner ? 'text-sm font-extrabold sm:text-base' : 'text-[13px] font-bold')}>
          {finisher.name}
        </div>
        <PrizeChip amount={PRIZES_BY_RANK[place]} />
      </div>
      <div className={cn('mt-1.5 flex w-full items-start justify-center rounded-t-xl pt-2 shadow-soft', style.block, style.height)}>
        <span aria-hidden className="text-3xl drop-shadow-sm sm:text-4xl">{style.medal}</span>
      </div>
    </div>
  )
}

function PodiumAvatar({ name, winner }: { name: string; winner: boolean }) {
  const initials = getInitials(name)
  const { bg, fg } = avatarColor(initials)
  const size = winner ? 'h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl' : 'h-12 w-12 text-lg sm:h-14 sm:w-14 sm:text-xl'
  return (
    <div className="relative">
      {winner && (
        <span aria-hidden className="absolute -right-4 -top-3 rotate-12 text-4xl drop-shadow-sm sm:text-5xl">
          👑
        </span>
      )}
      <div
        className={cn('flex items-center justify-center rounded-full font-extrabold ring-2 ring-white', size)}
        style={{ backgroundColor: bg, color: fg }}
      >
        {initials}
      </div>
    </div>
  )
}

function RunnerUpRow({ row }: { row: StandingsRow }) {
  const initials = getInitials(row.name)
  const { bg, fg } = avatarColor(initials)
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white px-3 py-2 shadow-soft">
      <span className="w-6 text-center text-sm font-bold text-ink/50">{row.rank}</span>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-2 ring-white"
        style={{ backgroundColor: bg, color: fg }}
      >
        {initials}
      </span>
      <span className="flex-1 truncate text-right font-semibold text-ink">{row.name}</span>
      <PrizeChip amount={PRIZES_BY_RANK[row.rank]} />
    </li>
  )
}

function LastPlaceCallout({ row }: { row: StandingsRow }) {
  const initials = getInitials(row.name)
  const { bg, fg } = avatarColor(initials)
  return (
    <div className="mt-5 rounded-2xl border border-clay/30 bg-gradient-to-l from-clay/10 to-sand px-4 py-3">
      <p className="text-xs font-bold text-clay">🍩 פרס ע״ש מוג׳תבא חמינאי · המקום האחרון</p>
      <div className="mt-2 flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ring-2 ring-white"
          style={{ backgroundColor: bg, color: fg }}
        >
          {initials}
        </span>
        <span className="flex-1 truncate text-right font-semibold text-ink">{row.name}</span>
        <PrizeChip amount={LAST_PLACE_PRIZE} />
      </div>
    </div>
  )
}

function PrizeChip({ amount }: { amount?: number }) {
  if (amount === undefined) return <></>
  return (
    <div className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-leaf/10 px-2.5 py-0.5 text-xs font-bold text-leaf">
      {amount.toLocaleString('he-IL')} ₪
    </div>
  )
}

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti-fall rounded-sm"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size * 1.6,
            backgroundColor: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
