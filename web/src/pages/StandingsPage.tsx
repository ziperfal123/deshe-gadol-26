import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEventListener, useLocalStorage } from 'usehooks-ts'
import type { CustomGroup, LeadersFile, ProjectedStandings, ScoreMode, Standings, StandingsRow } from '../types'
import {
  fetchLeaders,
  fetchProjectedStandings,
  fetchStandings,
  peekLeaders,
  peekProjectedStandings,
  peekStandings,
} from '../lib/data'
import { useFlashScroll } from '../lib/useFlashScroll'
import { rankStandings } from '../lib/ranking'
import { cn } from '../lib/cn'
import { Header } from '../components/Header'
import { NavTabs } from '../components/NavTabs'
import { ScoreModeTabs } from '../components/ScoreModeTabs'
import { ProjectedBanner } from '../components/ProjectedBanner'
import { GroupViewBar } from '../components/GroupViewBar'
import { GroupEditorDialog } from '../components/GroupEditorDialog'

/** Map a projected-standings row to the shared StandingsRow shape (projected_total as the displayed score). */
function projectedToRows(p: ProjectedStandings): StandingsRow[] {
  return p.standings.map((r) => ({
    rank: r.rank,
    player_id: r.player_id,
    name: r.name,
    total_points: r.projected_total,
    correct_group: r.correct_group,
    tied: r.tied,
    extra_points: r.extra_points,
    official_total: r.official_total,
  }))
}

/** Home screen: the standings table (all players or a custom group view). */
export function StandingsPage() {
  const [data, setData] = useState<Standings | undefined>(peekStandings)
  const [mode, setMode] = useLocalStorage<ScoreMode>('score-mode', 'official')
  const [proj, setProj] = useState<ProjectedStandings | undefined>(peekProjectedStandings)
  const [leaders, setLeaders] = useState<LeadersFile | undefined>(peekLeaders)
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

  // Projected data (+ live leaders) is loaded lazily the first time it's needed.
  useEffect(() => {
    if (mode !== 'projected' || proj) return
    fetchProjectedStandings().then(setProj).catch(() => setError('שגיאה בטעינת הטבלה'))
    fetchLeaders().then(setLeaders).catch(() => undefined)
  }, [mode, proj])

  const onRowClick = (id: string) => navigate(`/player/${id}`)
  const activeGroup = groups.find((g) => g.id === activeView)
  const projected = mode === 'projected'
  // Base list for the active mode (official SSOT or projected total).
  const baseStandings: StandingsRow[] = projected ? (proj ? projectedToRows(proj) : []) : data?.standings ?? []
  const ready = projected ? !!proj : !!data
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
      <div ref={headerRef} className="sm:sticky sm:top-0 sm:z-20 sm:w-full sm:bg-sand/95 sm:backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pb-2 sm:pb-3">
          <Header syncedAt={(projected ? proj?.synced_at : undefined) ?? data?.synced_at} />
          <NavTabs />
          <ScoreModeTabs mode={mode} onChange={setMode} />
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
            {/* mobile/tablet: in-flow banner; desktop (xl): moved to the fixed gutter sidebar below */}
            {projected && (
              <div className="xl:hidden">
                <ProjectedBanner leaders={leaders} />
              </div>
            )}
            {renderSearchIfNeeded(data, query, setQuery, rows, scrolled, flashScrollTo)}
          </div>
        </div>
      )}
      {/* desktop (xl+) only: vertical call-out pinned in the RIGHT gutter beside the centered table,
          vertically centered in the table area (below the header). position:fixed keeps it out of the
          header flow, so the header height no longer changes between modes. */}
      {projected && (
        <aside
          className="fixed left-[calc(75vw_+_12rem)] z-10 hidden w-52 -translate-x-1/2 -translate-y-1/2 xl:block 2xl:w-60"
          style={{ top: `calc((100vh + ${headerH}px) / 2 - 4rem)` }}
        >
          <ProjectedBanner leaders={leaders} vertical />
        </aside>
      )}
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-3">
        {renderListIfNeeded(ready, error, rows, query, projected, onRowClick)}
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
  projected: boolean,
  onRowClick: (id: string) => void,
) {
  if (error) return <p className="mt-10 text-center text-clay">{error}</p>
  if (!ready) return <p className="mt-10 text-center text-ink/40">טוען…</p>
  const filtered = rows.filter((r) => r.name.includes(query.trim()))
  return (
    <ul className="mt-3 space-y-2">
      {filtered.map((row) => (
        <StandingRow key={row.player_id} row={row} projected={projected} onClick={onRowClick} />
      ))}
      {renderEmptyIfNeeded(filtered.length)}
    </ul>
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
  projected: boolean
  onClick: (id: string) => void
}

function StandingRow({ row, projected, onClick }: RowProps) {
  const isTop3 = row.rank <= 3
  const extra = row.extra_points ?? 0
  return (
    <li id={`player-${row.player_id}`} className="scroll-mt-24">
      <button
        onClick={() => onClick(row.player_id)}
        className="flex w-full items-center gap-3 rounded-2xl border border-ink/5 bg-white px-3 py-3 text-right shadow-soft transition hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-lg"
      >
        <RankBadge rank={row.rank} isTop3={isTop3} />
        <span className="flex-1 truncate font-semibold text-ink">{row.name}</span>
        {projected ? (
          <span className="text-xs text-ink/45">
            רשמי {row.official_total ?? row.total_points}
            {extra > 0 && <span className="font-bold text-leaf"> +{extra}</span>}
          </span>
        ) : (
          <span className="text-xs text-ink/45">{row.correct_group} פגיעות</span>
        )}
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
