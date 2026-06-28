import type { LeadersFile } from '../types'
import { ProjectedBanner } from './ProjectedBanner'

/**
 * Mobile-only modal: shows the projected call-out in the roomy vertical layout
 * (label over value, full text, no truncation) — the same way the desktop sidebar shows it.
 */
export function ProjectedDialog({ leaders, onClose }: { leaders?: LeadersFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 xl:hidden">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[88vh] w-full max-w-xs animate-pop-in overflow-y-auto"
      >
        <ProjectedBanner leaders={leaders} vertical />
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-2xl bg-sun py-2.5 font-bold text-ink shadow-soft transition hover:brightness-95"
        >
          סגור
        </button>
      </div>
    </div>
  )
}
