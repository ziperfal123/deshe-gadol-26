import { formatSync } from '../lib/format'

interface HeaderProps {
  syncedAt?: string
}

/** App title block with the "last sync" freshness line. */
export function Header({ syncedAt }: HeaderProps) {
  return (
    <header className="text-center pt-8 pb-2">
      <div className="inline-flex items-center gap-2 text-3xl sm:text-4xl font-extrabold text-ink">
        <span aria-hidden>🌱</span>
        <h1>הדשא הגדול</h1>
        <span aria-hidden>⚽</span>
      </div>
      <p className="mt-1 text-sm font-medium text-leaf">מונדיאל 2026 · טבלת הניחושים</p>
      {renderSyncIfNeeded(syncedAt)}
    </header>
  )
}

function renderSyncIfNeeded(syncedAt?: string) {
  if (!syncedAt) return <></>
  return (
    <p className="mt-2 text-xs text-ink/50">עודכן לאחרונה: {formatSync(syncedAt)}</p>
  )
}
