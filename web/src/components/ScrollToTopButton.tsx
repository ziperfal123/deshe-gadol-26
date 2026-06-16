import { useState } from 'react'
import { useEventListener } from 'usehooks-ts'

/** Floating button that scrolls the page to the top; shown only once scrolled down. */
export function ScrollToTopButton() {
  const [show, setShow] = useState(false)
  useEventListener('scroll', () => setShow(window.scrollY > 300))

  if (!show) return <></>

  const onClick = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      onClick={onClick}
      aria-label="חזרה למעלה"
      className="fixed bottom-5 left-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-leaf p-4 font-bold text-white shadow-soft transition hover:brightness-95 sm:px-5 sm:py-3"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 14l6-6 6 6" />
      </svg>
      <span className="hidden text-base sm:inline">למעלה</span>
    </button>
  )
}
