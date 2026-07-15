import { Header } from '../components/Header'
import { NavTabs } from '../components/NavTabs'
import { getInitials, avatarColor } from '../lib/avatar'
import { cn } from '../lib/cn'
import { HISTORY_TOURNAMENTS, type HistoryFinisher, type HistoryTournament } from '../consts/history'

/** Read-only hall of fame: podiums of past tournaments (World Cups, Euros). */
export function HistoryPage() {
  return (
    <div>
      <div className="sticky top-0 z-20 w-full border-b border-ink/10 bg-sand/95 shadow-header backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <Header />
          <NavTabs />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-3">
        <p className="mt-6 text-center text-sm font-medium text-ink/55">על כתפי ענקים · החברים שהזיעו, ניחשו, וזכו</p>
        <div className="mt-10 space-y-20">
          {HISTORY_TOURNAMENTS.map((t) => (
            <TournamentPodium key={t.id} tournament={t} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TournamentPodium({ tournament }: { tournament: HistoryTournament }) {
  const byPlace = (place: number) => tournament.podium.find((p) => p.place === place)
  const first = byPlace(1)
  const second = byPlace(2)
  const third = byPlace(3)

  return (
    <section>
      <div className="mb-2 text-center">
        <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
          <span aria-hidden className="ml-1.5">{tournament.emoji}</span>
          {tournament.title}
        </h2>
        <p className="text-sm font-medium text-leaf">{tournament.host}</p>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-4 pt-2 shadow-soft sm:p-6">
        {/* Visual order: 2nd · 1st · 3rd, aligned at the base. */}
        <div className="flex items-end justify-center gap-2 sm:gap-4">
          <PodiumColumn finisher={second} pending={tournament.pending} />
          <PodiumColumn finisher={first} pending={tournament.pending} />
          <PodiumColumn finisher={third} pending={tournament.pending} />
        </div>
      </div>
    </section>
  )
}

/** Per-place styling: block height, medal color, and the place emoji. */
const PLACE_STYLE: Record<number, { block: string; badge: string; medal: string; height: string }> = {
  1: { block: 'bg-gradient-to-b from-sun to-[#E6B15E]', badge: 'bg-[#E6B15E] text-ink', medal: '🥇', height: 'h-28 sm:h-32' },
  2: { block: 'bg-gradient-to-b from-[#D7DBE2] to-[#B9C0CC]', badge: 'bg-[#B9C0CC] text-ink', medal: '🥈', height: 'h-20 sm:h-24' },
  3: { block: 'bg-gradient-to-b from-[#E7A986] to-clay', badge: 'bg-clay text-white', medal: '🥉', height: 'h-16 sm:h-20' },
}

function PodiumColumn({ finisher, pending }: { finisher?: HistoryFinisher; pending?: boolean }) {
  if (!finisher) return <></>
  const style = PLACE_STYLE[finisher.place]
  const isWinner = finisher.place === 1

  return (
    <div className="flex flex-1 flex-col items-center">
      <PodiumAvatar name={finisher.name} winner={isWinner} pending={pending} />
      <div className="mt-2 min-h-[2.5rem] px-0.5 text-center">
        {renderNameIfNeeded(finisher.name, pending)}
        {renderPrizeIfNeeded(finisher.prize)}
      </div>
      <div
        className={cn(
          'mt-1.5 flex w-full items-start justify-center rounded-t-xl pt-2 shadow-soft',
          style.block,
          style.height,
        )}
      >
        <span aria-hidden className="text-4xl drop-shadow-sm sm:text-5xl">{style.medal}</span>
      </div>
    </div>
  )
}

function PodiumAvatar({ name, winner, pending }: { name: string; winner: boolean; pending?: boolean }) {
  const initials = pending ? '?' : getInitials(name)
  const { bg, fg } = pending ? { bg: '#EDE6D4', fg: '#9A9482' } : avatarColor(initials)
  const size = winner ? 'h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl' : 'h-12 w-12 text-lg sm:h-14 sm:w-14 sm:text-xl'
  return (
    <div className="relative">
      {renderCrownIfNeeded(winner)}
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-extrabold ring-2 ring-white',
          size,
          pending && 'border-2 border-dashed border-ink/20',
        )}
        style={{ backgroundColor: bg, color: fg }}
      >
        {initials}
      </div>
    </div>
  )
}

function renderCrownIfNeeded(winner: boolean) {
  if (!winner) return <></>
  return (
    <span aria-hidden className="absolute -right-4 -top-3 rotate-12 text-4xl drop-shadow-sm sm:text-5xl">
      👑
    </span>
  )
}

function renderNameIfNeeded(name: string, pending?: boolean) {
  if (pending) return <div className="text-lg font-extrabold leading-tight text-ink/30">?</div>
  return <div className="text-[13px] font-bold leading-tight text-ink sm:text-sm">{name}</div>
}

function renderPrizeIfNeeded(prize?: number) {
  if (prize === undefined) return <></>
  return (
    <div className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-bold text-leaf">
      {prize.toLocaleString('he-IL')} ₪
    </div>
  )
}
