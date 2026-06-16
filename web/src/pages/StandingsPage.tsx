import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventListener } from 'usehooks-ts'
import type { Standings, StandingsRow } from '../types'
import { fetchStandings } from '../lib/data'
import { useFlashScroll } from '../lib/useFlashScroll'
import { cn } from '../lib/cn'
import { Header } from '../components/Header'
import { NavTabs } from '../components/NavTabs'

/** Home screen: the full standings table, click a row to open a player. */
export function StandingsPage() {
  const [data, setData] = useState<Standings>()
  const [error, setError] = useState<string>()
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const { flashScrollTo } = useFlashScroll('player')
  const navigate = useNavigate()

  useEventListener('scroll', () => setScrolled(window.scrollY > 250))

  useEffect(() => {
    fetchStandings()
      .then(setData)
      .catch(() => setError('שגיאה בטעינת הטבלה'))
  }, [])

  const onRowClick = (id: string) => navigate(`/player/${id}`)
  const lastId = data?.standings.at(-1)?.player_id

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Header syncedAt={data?.synced_at} />
      <NavTabs />
      {renderBodyIfNeeded({ data, error, query, setQuery, onRowClick, lastId, scrolled, flashScrollTo })}
    </div>
  )
}

interface BodyProps {
  data: Standings | undefined
  error: string | undefined
  query: string
  setQuery: (q: string) => void
  onRowClick: (id: string) => void
  lastId: string | undefined
  scrolled: boolean
  flashScrollTo: (id: string | undefined) => void
}

function renderBodyIfNeeded({ data, error, query, setQuery, onRowClick, lastId, scrolled, flashScrollTo }: BodyProps) {
  if (error) return <p className="mt-10 text-center text-clay">{error}</p>
  if (!data) return <p className="mt-10 text-center text-ink/40">טוען…</p>

  const filtered = data.standings.filter((r) => r.name.includes(query.trim()))
  const filtering = query.trim() !== ''

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 rounded-b-3xl border-b border-ink/10 bg-sand/90 px-4 pb-3 pt-3 shadow-header backdrop-blur">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש שחקן…"
          className="w-full rounded-2xl border border-ink/15 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
        {renderLastPlayerButtonIfNeeded(lastId, scrolled, filtering, () => flashScrollTo(lastId))}
      </div>
      <ul className="mt-3 space-y-2">
        {filtered.map((row) => (
          <StandingRow key={row.player_id} row={row} onClick={onRowClick} />
        ))}
        {renderEmptyIfNeeded(filtered.length)}
      </ul>
    </>
  )
}

function renderLastPlayerButtonIfNeeded(
  lastId: string | undefined,
  scrolled: boolean,
  filtering: boolean,
  onLast: () => void,
) {
  if (!lastId) return <></>
  // Once scrolled, the same button flips to "back to top".
  const onTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const disabled = !scrolled && filtering
  return (
    <div className="mt-2 flex justify-end">
      <button
        onClick={scrolled ? onTop : onLast}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1 rounded-full text-sm transition',
          scrolled
            ? 'bg-leaf px-3.5 py-1.5 font-bold text-white shadow-soft hover:brightness-95'
            : cn(
                'px-2 py-0.5 font-medium text-clay/80',
                disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-clay/10',
              ),
        )}
      >
        {scrolled ? (
          <>
            קח אותי חזרה למעלה <span aria-hidden>⬆</span>
          </>
        ) : (
          <>
            למה אחרונים תמיד בסוף? <span aria-hidden>⬇</span>
          </>
        )}
      </button>
    </div>
  )
}

function renderEmptyIfNeeded(count: number) {
  if (count > 0) return <></>
  return <li className="py-8 text-center text-ink/40">לא נמצאו שחקנים</li>
}

interface RowProps {
  row: StandingsRow
  onClick: (id: string) => void
}

function StandingRow({ row, onClick }: RowProps) {
  const isTop3 = row.rank <= 3
  return (
    <li id={`player-${row.player_id}`} className="scroll-mt-24">
      <button
        onClick={() => onClick(row.player_id)}
        className="flex w-full items-center gap-3 rounded-2xl border border-ink/5 bg-white px-3 py-3 text-right shadow-soft transition hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-lg"
      >
        <RankBadge rank={row.rank} isTop3={isTop3} />
        <span className="flex-1 truncate font-semibold text-ink">{row.name}</span>
        <span className="text-xs text-ink/45">{row.correct_group} פגיעות</span>
        <span className="min-w-[3.5rem] rounded-xl bg-sun/40 px-3 py-1 text-center font-bold text-ink">
          {row.total_points}
        </span>
      </button>
    </li>
  )
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function RankBadge({ rank, isTop3 }: { rank: number; isTop3: boolean }) {
  if (isTop3) {
    return <span className="w-8 text-center text-xl">{MEDALS[rank]}</span>
  }
  return <span className="w-8 text-center text-sm font-bold text-ink/40">{rank}</span>
}
