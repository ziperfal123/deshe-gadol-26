import { useEffect, useState } from 'react'
import type { ChampionPointsFile } from '../types'
import { fetchChampionPoints, peekChampionPoints } from '../lib/data'
import { teamFlag } from '../lib/flags'
import { Header } from '../components/Header'
import { NavTabs } from '../components/NavTabs'

/** Scoring rules of the competition, presented clearly. */
export function RulesPage() {
  const [champ, setChamp] = useState<ChampionPointsFile | undefined>(peekChampionPoints)

  useEffect(() => {
    fetchChampionPoints().then(setChamp).catch(() => {})
  }, [])

  return (
    <div>
      <div className="sticky top-0 z-20 w-full border-b border-ink/10 bg-sand/95 shadow-header backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <Header />
          <NavTabs />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-3">
      <p className="text-center text-xs text-ink/45">חוקי הניקוד של הדשא הגדול</p>

      <Card title="שלב הבתים" emoji="⚽">
        <RuleRow label="ניחוש תוצאה נכון (1 / X / 2)" pts={2} />
        <Note>הניחוש הוא על התוצאה (ניצחון בית / תיקו / ניצחון חוץ), לא על התוצאה המדויקת.</Note>
      </Card>

      <Card title="העפלה מהבתים" emoji="🪜">
        <RuleRow label="כל נבחרת שניחשת שתעפיל (מבין 32 המעפילות)" pts={2} />
        <RuleRow label="בונוס אם ניחשת גם את המיקום המדויק שלה בבית" pts={1} prefix="+" />
        <Note>32 מתוך 48 הנבחרות מעפילות (2 הראשונות מכל בית + 8 השלישיות הטובות).</Note>
      </Card>

      <Card title="העפלה לשלבי הנוקאאוט" emoji="🧗">
        <p className="mb-2 text-xs text-ink/60">נקודות לכל נבחרת שניחשת נכון שתגיע לשלב:</p>
        <RuleRow label="שמינית גמר" pts={5} />
        <RuleRow label="רבע גמר" pts={10} />
        <RuleRow label="חצי גמר" pts={15} />
        <RuleRow label="גמר" pts={20} />
      </Card>

      <Card title="אלופת העולם" emoji="🏆">
        <p className="text-sm leading-relaxed text-ink/70">
          הניקוד תלוי כמה הנבחרת מפתיעה: ככל שהיא פחות מועדפת, כך מקבלים יותר נקודות אם היא תזכה.
        </p>
        <p className="mb-3 mt-1 text-sm font-medium text-ink/70">
          הפייבוריטית = <b>20</b> נק׳, ההפתעה הגדולה = <b>60</b> נק׳ (לפי טבלת המארגנים).
        </p>
        {renderChampionTableIfNeeded(champ)}
      </Card>

      <Card title="הימורים מיוחדים" emoji="⭐">
        {SPECIALS.map((s) => (
          <RuleRow key={s.label} label={s.label} pts={s.pts} />
        ))}
        <Note>
          הימורים מספריים (כרטיסים אדומים / הארכות / פנדלים) נקבעים בהתאמה מדויקת. בשוויון בשם שחקן
          (מלך שערים / בישולים) , כל מי שניחש מקבל את מלוא הנקודות.
        </Note>
      </Card>

      <Card title="שוברי שוויון" emoji="⚖️">
        <p className="mb-2 text-xs text-ink/60">בתיקו בנקודות, הסדר נקבע לפי (לפי סדר):</p>
        <ol className="space-y-1.5 pr-1 text-sm text-ink/80">
          {TIEBREAKERS.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-leaf">{i + 1}.</span>
              {t}
            </li>
          ))}
        </ol>
      </Card>
      </div>
    </div>
  )
}

const SPECIALS: { label: string; pts: number }[] = [
  { label: 'מלך השערים', pts: 20 },
  { label: 'השחקן הטוב ביותר', pts: 20 },
  { label: 'מלך הבישולים', pts: 15 },
  { label: 'הכי הרבה שערים (שלב הבתים)', pts: 10 },
  { label: 'הכי הרבה ספיגות (שלב הבתים)', pts: 10 },
  { label: 'הכי הרבה שערים (כל הטורניר)', pts: 10 },
  { label: 'הכי הרבה ספיגות (כל הטורניר)', pts: 10 },
  { label: 'הכי הרבה כרטיסים', pts: 10 },
  { label: 'הכי מעט כרטיסים', pts: 10 },
  { label: 'סה״כ כרטיסים אדומים', pts: 8 },
  { label: 'סה״כ הארכות', pts: 5 },
  { label: 'סה״כ הכרעות פנדלים', pts: 5 },
]

const TIEBREAKERS = [
  'ניחוש האלופה נכון',
  'מספר הפיינליסטיות הנכונות',
  'מספר נבחרות חצי הגמר הנכונות',
  'מספר נבחרות רבע הגמר הנכונות',
  'מספר נבחרות שמינית הגמר הנכונות',
  'מספר הנבחרות שהעפילו מהבתים (32 הראשונות)',
  'מספר תוצאות שלב הבתים הנכונות',
]

function Card({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-base font-bold text-ink/80">
        <span aria-hidden className="ml-1">{emoji}</span>
        {title}
      </h2>
      <div className="rounded-3xl border border-ink/5 bg-white p-4 shadow-soft">{children}</div>
    </section>
  )
}

function RuleRow({ label, pts, prefix = '' }: { label: string; pts: number; prefix?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink/5 py-2 last:border-0">
      <span className="flex-1 text-sm text-ink">{label}</span>
      <PointBadge text={`${prefix}${pts} נק׳`} />
    </div>
  )
}

function PointBadge({ text }: { text: string }) {
  return (
    <span className="shrink-0 rounded-xl bg-sun/50 px-3 py-1 text-center text-sm font-bold text-ink">{text}</span>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs leading-relaxed text-ink/60">{children}</p>
}

function renderChampionTableIfNeeded(champ: ChampionPointsFile | undefined) {
  if (!champ) return <p className="py-3 text-center text-sm text-ink/40">טוען טבלה…</p>
  // group teams by their points value, favorite (low) → surprise (high)
  const byPoints = new Map<number, ChampionPointsFile['teams']>()
  for (const t of champ.teams) {
    const arr = byPoints.get(t.points) ?? []
    arr.push(t)
    byPoints.set(t.points, arr)
  }
  const groups = [...byPoints.entries()].sort((a, b) => a[0] - b[0])
  return (
    <div className="space-y-2.5">
      {groups.map(([points, teams]) => (
        <div key={points} className="flex items-start gap-3">
          <PointBadge text={`${points} נק׳`} />
          <div className="flex flex-1 flex-wrap gap-1.5 pt-0.5">
            {teams.map((t) => (
              <span key={t.code} className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-ink">
                {teamFlag(t.code)} {t.name_he}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
