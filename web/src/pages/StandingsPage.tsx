import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Standings, StandingsRow } from '../types'
import { fetchStandings } from '../lib/data'
import { Header } from '../components/Header'

/** Home screen: the full standings table, click a row to open a player. */
export function StandingsPage() {
  const [data, setData] = useState<Standings>()
  const [error, setError] = useState<string>()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchStandings()
      .then(setData)
      .catch(() => setError('שגיאה בטעינת הטבלה'))
  }, [])

  const onRowClick = (id: string) => navigate(`/player/${id}`)

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Header syncedAt={data?.synced_at} />
      {renderBodyIfNeeded(data, error, query, setQuery, onRowClick)}
    </div>
  )
}

function renderBodyIfNeeded(
  data: Standings | undefined,
  error: string | undefined,
  query: string,
  setQuery: (q: string) => void,
  onRowClick: (id: string) => void,
) {
  if (error) return <p className="mt-10 text-center text-clay">{error}</p>
  if (!data) return <p className="mt-10 text-center text-ink/40">טוען…</p>

  const filtered = data.standings.filter((r) => r.name.includes(query.trim()))

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 rounded-b-3xl border-b border-ink/10 bg-sand/90 px-4 pb-3 pt-3 shadow-header backdrop-blur">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש שחקן…"
          className="w-full rounded-2xl border border-ink/15 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-sage focus:ring-2 focus:ring-sage/30"
        />
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
    <li>
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
