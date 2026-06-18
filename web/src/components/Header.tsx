import { formatSync } from '../lib/format'

interface HeaderProps {
  syncedAt?: string
}

/** App title block with the "last sync" freshness line. */
export function Header({ syncedAt }: HeaderProps) {
  return (
    <header className="text-center pt-5 pb-1">
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
  // Always render the line (with a non-breaking placeholder when there's no
  // timestamp) so the header keeps a constant height across pages and the tabs
  // below it don't jump when navigating.
  return (
    <p className="mt-2 h-4 text-xs text-ink/50">
      {syncedAt ? `עודכן לאחרונה: ${formatSync(syncedAt)}` : ' '}
    </p>
  )
}
