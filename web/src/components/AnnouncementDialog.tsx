import { useSessionStorage } from 'usehooks-ts'

// Bump the version suffix to re-show the dialog after editing the message.
const STORAGE_KEY = 'announcement-2026-06-maintenance-v2-dismissed'

/**
 * One-per-session announcement from the organizers. Shows until dismissed,
 * then stays hidden for the rest of the browser session (sessionStorage).
 */
export function AnnouncementDialog() {
  const [dismissed, setDismissed] = useSessionStorage(STORAGE_KEY, false)
  if (dismissed) return <></>

  const onClose = () => setDismissed(true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announce-title"
        className="relative z-10 w-full max-w-md animate-pop-in rounded-3xl border border-ink/10 bg-sand p-6 text-right shadow-soft"
      >
        <div className="flex items-start gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/30 text-lg">
            🔔
          </span>
          <div className="flex-1 text-center">
            <h2 id="announce-title" className="text-lg font-extrabold text-ink">
              🛠️ האתר חזר!
            </h2>
            <p className="text-xs font-medium text-leaf">הודעה מהנהלת הדשא הגדול</p>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="shrink-0 rounded-full p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink/70"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 text-base leading-relaxed text-ink/80">
          <p>
            חברים, הייתה תקלה (כן, שוב). המחלקה הטכנולוגית עבדה ימים כלילות על קפאין ואדרנלין,
            ויתרה על שינה (וגם על יפן-הולנד), והחזירה את הכל לפסים. 😅
          </p>
          <p>
            כל הניחושים שלכם שמורים, מסומנים ומאובטחים. אף נבחרת לא נפלה בדרך. תהיו רפויים ותמשיכו להנות מהטורניר.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-sun py-3 font-bold text-ink shadow-soft transition hover:brightness-95"
        >
הבנתי
        </button>
      </div>
    </div>
  )
}
