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
        <p className="text-center text-xs text-ink/45">היכל התהילה · אלופי העבר של הדשא הגדול</p>
        <div className="mt-6 space-y-8">
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
      <div className="mb-1 text-center">
        <h2 className="text-lg font-extrabold text-ink">
          <span aria-hidden className="ml-1.5">{tournament.emoji}</span>
          {tournament.title}
        </h2>
        <p className="text-xs font-medium text-leaf">{tournament.host}</p>
      </div>

      <div className="rounded-3xl border border-ink/5 bg-white p-4 pt-2 shadow-soft sm:p-6">
        {/* Visual order: 2nd · 1st · 3rd, aligned at the base. */}
        <div className="flex items-end justify-center gap-2 sm:gap-4">
          <PodiumColumn finisher={second} />
          <PodiumColumn finisher={first} />
          <PodiumColumn finisher={third} />
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

function PodiumColumn({ finisher }: { finisher?: HistoryFinisher }) {
  if (!finisher) return <></>
  const style = PLACE_STYLE[finisher.place]
  const isWinner = finisher.place === 1

  return (
    <div className="flex flex-1 flex-col items-center">
      <PodiumAvatar name={finisher.name} winner={isWinner} />
      <div className="mt-2 min-h-[2.5rem] px-0.5 text-center">
        <div className="text-[13px] font-bold leading-tight text-ink sm:text-sm">{finisher.name}</div>
        {renderPrizeIfNeeded(finisher.prize)}
      </div>
      <div
        className={cn(
          'mt-1.5 flex w-full items-start justify-center rounded-t-xl pt-2 shadow-soft',
          style.block,
          style.height,
        )}
      >
        <span aria-hidden className="text-2xl drop-shadow-sm sm:text-3xl">{style.medal}</span>
      </div>
    </div>
  )
}

function PodiumAvatar({ name, winner }: { name: string; winner: boolean }) {
  const initials = getInitials(name)
  const { bg, fg } = avatarColor(initials)
  const size = winner ? 'h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl' : 'h-12 w-12 text-base sm:h-14 sm:w-14 sm:text-lg'
  return (
    <div className="relative">
      {renderCrownIfNeeded(winner)}
      <div
        className={cn('flex items-center justify-center rounded-full font-extrabold ring-2 ring-white', size)}
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
    <span aria-hidden className="absolute -right-3 -top-2 rotate-12 text-2xl drop-shadow-sm sm:text-3xl">
      👑
    </span>
  )
}

function renderPrizeIfNeeded(prize?: number) {
  if (prize === undefined) return <></>
  return (
    <div className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-bold text-leaf">
      {prize.toLocaleString('he-IL')} ₪
    </div>
  )
}
