/** Initials from a full name: first letters of the first two word-with-letters, else first 2 chars. */
export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
  if (words.length === 0) return name.trim().slice(0, 2)
  if (words.length === 1) return words[0].slice(0, 2)
  return (words[0][0] ?? '') + (words[1][0] ?? '')
}

/**
 * Deterministic avatar colors derived from a seed (the initials), so the same
 * initials always get the same hue. Returns a pastel background + darker
 * matching foreground for readable text.
 */
export function avatarColor(seed: string): { bg: string; fg: string } {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const hue = hash % 360
  return { bg: `hsl(${hue} 58% 86%)`, fg: `hsl(${hue} 45% 32%)` }
}
