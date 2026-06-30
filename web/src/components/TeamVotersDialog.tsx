import { useEffect, useState } from 'react'
import type { TeamVoters } from '../types'
import { fetchTeamVoters } from '../lib/data'
import { avatarColor, getInitials } from '../lib/avatar'
import { teamFlag } from '../lib/flags'
import { STAGE_LABELS } from '../lib/format'

interface TeamVotersDialogProps {
  stage: string
  teamCode: string
  teamHe: string
  onClose: () => void
}

/** Modal listing every player who picked a given team to reach a knockout stage. */
export function TeamVotersDialog({ stage, teamCode, teamHe, onClose }: TeamVotersDialogProps) {
  const [voters, setVoters] = useState<TeamVoters | undefined>(undefined)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchTeamVoters().then(setVoters).catch(() => setError(true))
  }, [])

  const names = voters?.[stage]?.[teamCode] ?? []
  const isLoaded = !!voters
  const filtered = names.filter((n) => n.includes(query.trim()))
  const stageLabel = STAGE_LABELS[stage] ?? stage

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
              <span>{teamFlag(teamCode)}</span>
              <span className="min-w-0 truncate">{teamHe}</span>
            </h2>
            <p className="mt-0.5 text-xs font-medium text-leaf">
              ניחשו שתגיע ל{stageLabel}
              {isLoaded && <span className="text-ink/40"> · {names.length} משתתפים</span>}
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

        {renderSearchIfNeeded(isLoaded && names.length > 0, query, setQuery)}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {renderBodyIfNeeded(voters, error, filtered, names.length)}
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

function renderSearchIfNeeded(show: boolean, query: string, setQuery: (q: string) => void) {
  if (!show) return <></>
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
  voters: TeamVoters | undefined,
  error: boolean,
  filtered: string[],
  total: number,
) {
  if (error) return <p className="py-8 text-center text-clay">שגיאה בטעינת הרשימה</p>
  if (!voters) return <p className="py-8 text-center text-ink/40">טוען…</p>
  if (total === 0) return <p className="py-10 text-center text-sm font-medium text-ink/50">אף אחד לא ניחש את זה 😬</p>
  if (!filtered.length) return <p className="py-8 text-center text-ink/40">לא נמצאו שחקנים</p>
  return (
    <ul className="space-y-1">
      {filtered.map((name, i) => (
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
