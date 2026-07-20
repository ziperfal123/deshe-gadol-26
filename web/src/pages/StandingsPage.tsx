import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventListener, useLocalStorage } from 'usehooks-ts'
import type { CustomGroup, Standings, StandingsRow } from '../types'
import { fetchStandings, peekStandings } from '../lib/data'
import { useFlashScroll } from '../lib/useFlashScroll'
import { rankStandings } from '../lib/ranking'
import { cn } from '../lib/cn'
import { Header } from '../components/Header'
import { NavTabs } from '../components/NavTabs'
import { GroupViewBar } from '../components/GroupViewBar'
import { GroupEditorDialog } from '../components/GroupEditorDialog'
import { WinnerCelebration } from '../components/WinnerCelebration'
import { PRIZE_PLACES } from '../consts/prizes'

/** Home screen: the final standings table (all players or a custom group view). */
export function StandingsPage() {
  const [data, setData] = useState<Standings | undefined>(peekStandings)
  const [error, setError] = useState<string>()
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [groups, setGroups] = useLocalStorage<CustomGroup[]>('custom-groups', [])
  const [activeView, setActiveView] = useState('all')
  const [editor, setEditor] = useState<{ open: boolean; editing?: CustomGroup }>({ open: false })
  const { flashScrollTo } = useFlashScroll('player')
  const navigate = useNavigate()

  // The header is sticky only on desktop; the filter bar is sticky on both, so
  // on desktop it must sit just below the header (measured height as its top).
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerH, setHeaderH] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)

  useEventListener('scroll', () => setScrolled(window.scrollY > 250))

  useEffect(() => {
    const el = headerRef.current
    const measure = () => {
      setIsDesktop(window.innerWidth >= 640)
      if (el) setHeaderH(el.offsetHeight)
    }
    measure()
    const ro = el ? new ResizeObserver(measure) : undefined
    ro?.observe(el!)
    window.addEventListener('resize', measure)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [data, groups, activeView])

  useEffect(() => {
    fetchStandings()
      .then(setData)
      .catch(() => setError('שגיאה בטעינת הטבלה'))
  }, [])

  const onRowClick = (id: string) => navigate(`/player/${id}`)
  const activeGroup = groups.find((g) => g.id === activeView)
  const baseStandings: StandingsRow[] = data?.standings ?? []
  const ready = !!data
  // Custom group views are re-ranked within the chosen subset.
  const rows = activeGroup
    ? rankStandings(baseStandings.filter((r) => activeGroup.playerIds.includes(r.player_id)))
    : baseStandings

  const onSaveGroup = (g: CustomGroup) => {
    setGroups((prev) => {
      const i = prev.findIndex((x) => x.id === g.id)
      if (i < 0) return [...prev, g]
      const copy = [...prev]
      copy[i] = g
      return copy
    })
    setActiveView(g.id)
    setEditor({ open: false })
  }

  const onDeleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((x) => x.id !== id))
    setActiveView('all')
    setEditor({ open: false })
  }

  return (
    <div>
      {data && <WinnerCelebration standings={data.standings} />}
      <div ref={headerRef} className="sm:sticky sm:top-0 sm:z-20 sm:w-full sm:bg-sand/95 sm:backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pb-2 sm:pb-3">
          <Header syncedAt={data?.synced_at} />
          <NavTabs />
          {data && (
            <GroupViewBar
              groups={groups}
              activeView={activeView}
              onSelect={setActiveView}
              onCreate={() => setEditor({ open: true })}
            />
          )}
          {renderActiveGroupToolbarIfNeeded(activeGroup, () => setEditor({ open: true, editing: activeGroup }))}
        </div>
      </div>
      {data && (
        <div
          className="sticky z-10 w-full border-b border-ink/10 bg-sand/95 shadow-header backdrop-blur"
          style={{ top: isDesktop ? headerH : 0 }}
        >
          <div className="mx-auto max-w-3xl px-4 py-3">
            {renderSearchIfNeeded(data, query, setQuery, rows, scrolled, flashScrollTo)}
          </div>
        </div>
      )}
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-3">
        {renderListIfNeeded(ready, error, rows, query, onRowClick)}
      </div>
      {renderEditorIfNeeded(editor, data, onSaveGroup, onDeleteGroup, () => setEditor({ open: false }))}
    </div>
  )
}

function renderActiveGroupToolbarIfNeeded(group: CustomGroup | undefined, onEdit: () => void) {
  if (!group) return <></>
  return (
    <div className="mt-2 flex items-center justify-between gap-2 px-1">
      <span className="text-sm font-bold text-ink/70">
        {group.name} · {group.playerIds.length} חברים
      </span>
      <button onClick={onEdit} className="rounded-full px-2 py-0.5 text-xs font-bold text-leaf transition hover:bg-leaf/10">
        ✎ עריכה
      </button>
    </div>
  )
}

function renderEditorIfNeeded(
  editor: { open: boolean; editing?: CustomGroup },
  data: Standings | undefined,
  onSave: (g: CustomGroup) => void,
  onDelete: (id: string) => void,
  onClose: () => void,
) {
  if (!editor.open || !data) return <></>
  return (
    <GroupEditorDialog
      players={data.standings}
      initial={editor.editing}
      onSave={onSave}
      onDelete={editor.editing ? onDelete : undefined}
      onClose={onClose}
    />
  )
}

function renderSearchIfNeeded(
  data: Standings | undefined,
  query: string,
  setQuery: (q: string) => void,
  rows: StandingsRow[],
  scrolled: boolean,
  flashScrollTo: (id: string | undefined) => void,
) {
  if (!data) return <></>
  const lastId = rows.at(-1)?.player_id
  const filtering = query.trim() !== ''
  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש שחקן…"
        className="w-full rounded-2xl border border-ink/15 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-sage focus:ring-2 focus:ring-sage/30"
      />
      {renderLastPlayerButtonIfNeeded(lastId, scrolled, filtering, () => flashScrollTo(lastId))}
    </>
  )
}

function renderListIfNeeded(
  ready: boolean,
  error: string | undefined,
  rows: StandingsRow[],
  query: string,
  onRowClick: (id: string) => void,
) {
  if (error) return <p className="mt-10 text-center text-clay">{error}</p>
  if (!ready) return <p className="mt-10 text-center text-ink/40">טוען…</p>
  const filtered = rows.filter((r) => r.name.includes(query.trim()))
  return (
    <ul className="mt-3 space-y-2">
      {filtered.map((row, i) => (
        <Fragment key={row.player_id}>
          {renderPrizeLineIfNeeded(filtered[i - 1], row)}
          <StandingRow row={row} onClick={onRowClick} />
        </Fragment>
      ))}
      {renderEmptyIfNeeded(filtered.length)}
    </ul>
  )
}

/** The "prize cutoff" line, drawn once between the last prize-winning row and the first below it. */
function renderPrizeLineIfNeeded(prev: StandingsRow | undefined, row: StandingsRow) {
  const crossesCutoff = !!prev && prev.rank <= PRIZE_PLACES && row.rank > PRIZE_PLACES
  if (!crossesCutoff) return <></>
  return (
    <li aria-hidden className="flex items-center gap-3 py-2">
      <div className="h-0.5 flex-1 rounded-full bg-clay/60" />
      <span className="whitespace-nowrap rounded-full bg-clay px-3 py-0.5 text-xs font-extrabold text-white shadow-soft">
        🏆 קו הפרסים
      </span>
      <div className="h-0.5 flex-1 rounded-full bg-clay/60" />
    </li>
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
            : cn('px-2 py-0.5 font-medium text-clay/80', disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-clay/10'),
        )}
      >
        {scrolled ? (
          <>
            קח אותי חזרה למעלה <span aria-hidden>⬆</span>
          </>
        ) : (
          <>
            למה האחרונים תמיד בסוף? <span aria-hidden>⬇</span>
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

/** Per-rank row appearance: gold/silver/bronze for the podium, a subtle tint for the rest of the prize zone. */
const ROW_STYLE: Record<number, { row: string; name: string }> = {
  1: { row: 'border-sun/70 bg-gradient-to-l from-sun/35 to-white ring-1 ring-sun/60 hover:border-sun', name: 'text-lg font-extrabold' },
  2: { row: 'border-[#C7CDD6] bg-gradient-to-l from-[#E6EAF0] to-white ring-1 ring-[#C7CDD6] hover:border-[#B9C0CC]', name: 'font-bold' },
  3: { row: 'border-clay/40 bg-gradient-to-l from-[#EAC4B2] to-white ring-1 ring-clay/30 hover:border-clay/60', name: 'font-bold' },
}

const PRIZE_ZONE_STYLE = { row: 'border-leaf/25 bg-leaf/[0.06] hover:border-leaf/50', name: 'font-semibold' }
const DEFAULT_ROW_STYLE = { row: 'border-ink/5 hover:border-sage/40', name: 'font-semibold' }

function StandingRow({ row, onClick }: RowProps) {
  const isTop3 = row.rank <= 3
  const style = ROW_STYLE[row.rank] ?? (row.rank <= PRIZE_PLACES ? PRIZE_ZONE_STYLE : DEFAULT_ROW_STYLE)
  const className = cn(
    'flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-3 text-right shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg',
    style.row,
  )
  return (
    <li id={`player-${row.player_id}`} className="scroll-mt-24">
      <button onClick={() => onClick(row.player_id)} className={className}>
        <RankBadge rank={row.rank} isTop3={isTop3} />
        <span className={cn('flex-1 truncate text-ink', style.name)}>{row.name}</span>
        <span className="min-w-[3.5rem] rounded-xl bg-sun/40 px-3 py-1 text-center font-bold text-ink">
          {row.total_points}
        </span>
      </button>
    </li>
  )
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function RankBadge({ rank, isTop3 }: { rank: number; isTop3: boolean }) {
  // The champion row gets a big crown perched over the gold medal.
  if (rank === 1) {
    return (
      <span className="relative w-9 text-center text-2xl">
        <span aria-hidden className="absolute -top-3.5 right-1/2 translate-x-1/2 rotate-12 text-2xl drop-shadow-sm">
          👑
        </span>
        {MEDALS[1]}
      </span>
    )
  }
  if (isTop3) {
    return <span className="w-8 text-center text-xl">{MEDALS[rank]}</span>
  }
  return <span className="w-8 text-center text-sm font-bold text-ink/40">{rank}</span>
}
