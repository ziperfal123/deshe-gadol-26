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
      <FinalizingBanner />
    </header>
  )
}

/** Tournament-finale notice: results are being finalized, current standings are provisional. */
function FinalizingBanner() {
  return (
    <div className="mt-2 rounded-2xl border border-clay/40 bg-gradient-to-l from-sun/30 to-clay/20 px-4 py-2.5 text-center shadow-soft">
      <p className="flex items-center justify-center gap-1.5 text-sm font-extrabold text-ink">
        <span aria-hidden className="animate-pulse">⏳</span>
        תוצאות האמת מחושבות...
      </p>
      <p className="mt-0.5 text-xs font-medium text-ink/60">יש להתעלם ממצבה הנוכחי של הטבלה</p>
    </div>
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
