/**
 * Smooth-scrolls to an element by id (`<prefix>-<id>`) and flashes it once it
 * has actually scrolled into view. The flash class is toggled directly on the
 * DOM node (with a forced reflow) so the CSS animation reliably re-runs on every
 * click, independent of React's render timing.
 */
export function useFlashScroll(prefix: string, durationMs = 1300) {
  const flashScrollTo = (id: string | undefined) => {
    if (!id) return
    const el = document.getElementById(`${prefix}-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    let fired = false
    const fire = () => {
      if (fired) return
      fired = true
      observer.disconnect()
      window.clearTimeout(fallback)
      el.classList.remove('animate-flash')
      void el.offsetWidth // force reflow so the animation restarts from 0
      el.classList.add('animate-flash')
      window.setTimeout(() => el.classList.remove('animate-flash'), durationMs + 100)
    }

    // Fire when the target is substantially visible (i.e. the scroll arrived).
    // Fires immediately if it is already on screen; fallback covers edge cases.
    const observer = new IntersectionObserver(
      (entries) => {
        if ((entries[0]?.intersectionRatio ?? 0) >= 0.6) fire()
      },
      { threshold: [0.6] },
    )
    observer.observe(el)
    const fallback = window.setTimeout(fire, 800)
  }

  return { flashScrollTo }
}
