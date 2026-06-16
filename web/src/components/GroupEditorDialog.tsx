import { useState } from 'react'
import type { CustomGroup, StandingsRow } from '../types'
import { cn } from '../lib/cn'

interface GroupEditorDialogProps {
  players: StandingsRow[]
  initial?: CustomGroup
  onSave: (group: CustomGroup) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

/** Modal to create or edit a custom group: name + searchable player checklist. */
export function GroupEditorDialog({ players, initial, onSave, onDelete, onClose }: GroupEditorDialogProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set(initial?.playerIds ?? []))
  const [query, setQuery] = useState('')

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const filtered = players.filter((p) => p.name.includes(query.trim()))
  const canSave = name.trim().length > 0 && selected.size > 0

  const onSaveClick = () => {
    if (!canSave) return
    onSave({ id: initial?.id ?? crypto.randomUUID(), name: name.trim(), playerIds: [...selected] })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[85vh] w-full max-w-md animate-pop-in flex-col rounded-3xl border border-ink/10 bg-sand text-right shadow-soft"
      >
        <div className="flex items-start gap-2 p-5 pb-3">
          <h2 className="flex-1 font-extrabold text-ink">{initial ? 'עריכת קבוצה' : 'קבוצה חדשה'}</h2>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="shrink-0 rounded-full p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 border-b border-ink/10 px-5 pb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם הקבוצה (למשל: חבר׳ה מהעבודה)"
            className="w-full rounded-2xl border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none placeholder:text-ink/40 focus:border-sage focus:ring-2 focus:ring-sage/30"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש שחקן…"
            className="w-full rounded-2xl border border-ink/15 bg-white/60 px-4 py-2 text-sm outline-none placeholder:text-ink/40 focus:border-sage focus:ring-2 focus:ring-sage/30"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {renderListIfNeeded(filtered, selected, toggle)}
        </div>

        <div className="flex items-center gap-2 border-t border-ink/10 p-4">
          {renderDeleteIfNeeded(initial, onDelete)}
          <span className="text-xs font-medium text-ink/50">{selected.size} נבחרו</span>
          <button
            onClick={onSaveClick}
            disabled={!canSave}
            className={cn(
              'mr-auto rounded-2xl px-5 py-2 font-bold text-white shadow-soft transition',
              canSave ? 'bg-leaf hover:brightness-95' : 'cursor-not-allowed bg-ink/20',
            )}
          >
            שמירה
          </button>
        </div>
      </div>
    </div>
  )
}

function renderListIfNeeded(
  players: StandingsRow[],
  selected: Set<string>,
  toggle: (id: string) => void,
) {
  if (!players.length) return <p className="py-8 text-center text-ink/40">לא נמצאו שחקנים</p>
  return (
    <ul className="space-y-0.5">
      {players.map((p) => {
        const checked = selected.has(p.player_id)
        return (
          <li key={p.player_id}>
            <button
              onClick={() => toggle(p.player_id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right transition hover:bg-ink/5"
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs text-white',
                  checked ? 'border-leaf bg-leaf' : 'border-ink/25',
                )}
              >
                {checked ? '✓' : ''}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function renderDeleteIfNeeded(initial: CustomGroup | undefined, onDelete?: (id: string) => void) {
  if (!initial || !onDelete) return <></>
  return (
    <button
      onClick={() => onDelete(initial.id)}
      className="rounded-2xl px-3 py-2 text-sm font-bold text-clay transition hover:bg-clay/10"
    >
      מחיקה
    </button>
  )
}
