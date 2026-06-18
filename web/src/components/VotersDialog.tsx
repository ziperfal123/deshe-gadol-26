import { useEffect, useState } from 'react'
import type { MatchVoters } from '../types'
import { fetchMatchVoters } from '../lib/data'
import { avatarColor, getInitials } from '../lib/avatar'
import { EMPTY_VOTER_TEMPLATES, emptyVoterMessage } from '../lib/emptyMessages'

interface VotersDialogProps {
  matchId: string
  pick: '1' | 'X' | '2'
  homeHe: string | null
  awayHe: string | null
  onClose: () => void
}

/** Modal listing every player who picked a given outcome for a match. */
export function VotersDialog({ matchId, pick, homeHe, awayHe, onClose }: VotersDialogProps) {
  const [voters, setVoters] = useState<MatchVoters>()
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  // chosen once per open, so the empty message stays stable while the dialog is up
  const [msgIdx] = useState(() => Math.floor(Math.random() * EMPTY_VOTER_TEMPLATES.length))

  useEffect(() => {
    fetchMatchVoters(matchId).then(setVoters).catch(() => setError(true))
  }, [matchId])

  const outcomeLabel =
    pick === '1' ? `ניצחון ${homeHe}` : pick === '2' ? `ניצחון ${awayHe}` : 'תיקו'
  const fullList = voters?.[pick] ?? []
  const isEmptyList = !!voters && fullList.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[80vh] w-full max-w-md animate-pop-in flex-col rounded-3xl border border-ink/10 bg-sand text-right shadow-soft"
      >
        <div className="flex items-start gap-2 p-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 font-extrabold text-ink">
              <span className="min-w-0 truncate">{homeHe}</span>
              <span className="shrink-0 text-sm font-bold tracking-wide text-ink/45">VS</span>
              <span className="min-w-0 truncate">{awayHe}</span>
            </h2>
            <p className="mt-0.5 text-xs font-medium text-leaf">
              ניחשו {outcomeLabel}
              {renderCountIfNeeded(voters?.[pick]?.length)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="shrink-0 rounded-full p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
          >
            ✕
          </button>
        </div>

        {renderSearchIfNeeded(isEmptyList, query, setQuery)}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {renderBodyIfNeeded(voters, error, pick, query, isEmptyList, outcomeLabelForEmpty(pick, homeHe, awayHe), msgIdx)}
        </div>

        <div className="border-t border-ink/10 p-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-sun py-2.5 font-bold text-ink shadow-soft transition hover:brightness-95"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}

/** The noun injected into empty-state messages: team name for 1/2, "תיקו" for X. */
function outcomeLabelForEmpty(pick: '1' | 'X' | '2', homeHe: string | null, awayHe: string | null): string {
  if (pick === '1') return homeHe ?? 'הקבוצה הזו'
  if (pick === '2') return awayHe ?? 'הקבוצה הזו'
  return 'תיקו'
}

function renderCountIfNeeded(count: number | undefined) {
  if (count === undefined) return <></>
  return <span className="text-ink/40"> · {count} משתתפים</span>
}

function renderSearchIfNeeded(
  isEmptyList: boolean,
  query: string,
  setQuery: (q: string) => void,
) {
  // Hidden only when the full list is empty (nobody picked this outcome).
  if (isEmptyList) return <></>
  return (
    <div className="border-b border-ink/10 px-5 pb-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש שחקן…"
        className="w-full rounded-2xl border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none placeholder:text-ink/40 focus:border-sage focus:ring-2 focus:ring-sage/30"
      />
    </div>
  )
}

function renderBodyIfNeeded(
  voters: MatchVoters | undefined,
  error: boolean,
  pick: '1' | 'X' | '2',
  query: string,
  isEmptyList: boolean,
  emptyLabel: string,
  msgIdx: number,
) {
  if (error) return <p className="py-8 text-center text-clay">שגיאה בטעינת הרשימה</p>
  if (!voters) return <p className="py-8 text-center text-ink/40">טוען…</p>
  if (isEmptyList) {
    return (
      <p className="px-4 py-10 text-center text-sm font-medium leading-relaxed text-ink/60">
        {emptyVoterMessage(emptyLabel, msgIdx)}
      </p>
    )
  }
  const names = voters[pick].filter((n) => n.includes(query.trim()))
  if (!names.length) return <p className="py-8 text-center text-ink/40">לא נמצאו שחקנים</p>
  return (
    <ul className="space-y-1">
      {names.map((name, i) => (
        <VoterRow key={`${name}-${i}`} name={name} />
      ))}
    </ul>
  )
}

function VoterRow({ name }: { name: string }) {
  const initials = getInitials(name)
  const { bg, fg } = avatarColor(initials)
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-1.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: bg, color: fg }}
      >
        {initials}
      </span>
      <span className="truncate text-sm font-medium text-ink">{name}</span>
    </li>
  )
}
