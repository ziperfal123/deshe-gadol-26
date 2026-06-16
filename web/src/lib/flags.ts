/** FIFA team code → flag emoji. England/Scotland use subdivision flag sequences. */
const FLAGS: Record<string, string> = {
  ALG: '🇩🇿', ARG: '🇦🇷', AUS: '🇦🇺', AUT: '🇦🇹', BEL: '🇧🇪', BIH: '🇧🇦', BRA: '🇧🇷',
  CAN: '🇨🇦', CIV: '🇨🇮', COD: '🇨🇩', COL: '🇨🇴', CPV: '🇨🇻', CRO: '🇭🇷', CUW: '🇨🇼',
  CZE: '🇨🇿', ECU: '🇪🇨', EGY: '🇪🇬', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ESP: '🇪🇸', FRA: '🇫🇷', GER: '🇩🇪',
  GHA: '🇬🇭', HAI: '🇭🇹', IRN: '🇮🇷', IRQ: '🇮🇶', JPN: '🇯🇵', JOR: '🇯🇴', KOR: '🇰🇷',
  KSA: '🇸🇦', MAR: '🇲🇦', MEX: '🇲🇽', NED: '🇳🇱', NOR: '🇳🇴', NZL: '🇳🇿', PAN: '🇵🇦',
  PAR: '🇵🇾', POR: '🇵🇹', QAT: '🇶🇦', RSA: '🇿🇦', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', SEN: '🇸🇳', SUI: '🇨🇭',
  SWE: '🇸🇪', TUN: '🇹🇳', TUR: '🇹🇷', URU: '🇺🇾', USA: '🇺🇸', UZB: '🇺🇿',
}

/** Flag emoji for a team code, or empty string if unknown. */
export function teamFlag(code: string | null | undefined): string {
  if (!code) return ''
  return FLAGS[code] ?? ''
}

/** "🇫🇷 צרפת" when a flag is known, otherwise just the name. */
export function withFlag(code: string | null | undefined, name: string): string {
  const flag = teamFlag(code)
  return flag ? `${flag} ${name}` : name
}
