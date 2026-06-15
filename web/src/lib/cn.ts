/**
 * Join class names, dropping falsy values. Keeps className concatenation
 * consistent across components (base classes + conditional/props classes).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
