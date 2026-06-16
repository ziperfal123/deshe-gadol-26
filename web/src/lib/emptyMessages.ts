/** Funny "nobody picked this" messages. `label` is a team name (for 1/2) or "תיקו" (for X). */
export const EMPTY_VOTER_TEMPLATES: ((label: string) => string)[] = [
  (label) => `${label}?? נו באמת. אף אחד לא נפל בפח. 🤷`,
  (label) => `למה שמישהו יבחר ב${label}? גם אנחנו תוהים. אפס מנחשים.`,
  (label) => `פה היו אמורים להופיע כל מי שהאמין ב${label}... אבל שקט. אין אף אחד. 🦗⚽`,
]

/** Pick one empty-state message by index (caller chooses the index, e.g. randomly once). */
export function emptyVoterMessage(label: string, index: number): string {
  const template = EMPTY_VOTER_TEMPLATES[index % EMPTY_VOTER_TEMPLATES.length]
  return template(label)
}
