import { ContinueReadingCard } from "@/components/quran/continue-reading-card"
import { JuzGrid } from "@/components/quran/juz-grid"
import type { AppLanguage, HijriOffset } from "@/lib/app-settings"
import type { QuranProgressState } from "@/lib/quran-progress"

type QuranPageProps = {
  language: AppLanguage
  hijriOffset: HijriOffset
  progress: QuranProgressState
  onQuickLog: (increment: number) => void
  onSetPage: (page: number) => void
  onSetDailyGoal: (goal: number) => void
}

const copy = {
  en: {
    title: "Quran Tracker",
    subtitle: "Salam. Nurture your soul with daily recitation.",
    juzGrid: "Juz Grid",
  },
  id: {
    title: "Pelacak Quran",
    subtitle: "Salam. Rawat hati dengan tilawah harian.",
    juzGrid: "Grid Juz",
  },
}

export default function QuranPage({ language, progress, onQuickLog, onSetDailyGoal }: QuranPageProps) {
  const t = copy[language]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-4 pb-28">
      <section className="space-y-1 text-center">
        <h2 className="font-serif text-3xl font-semibold leading-tight text-primary">{t.title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
      </section>

      <section>
        <ContinueReadingCard language={language} onQuickLog={onQuickLog} onSetDailyGoal={onSetDailyGoal} progress={progress} />
      </section>

      <section className="space-y-2">
        <h3 className="font-serif text-xl font-medium text-primary">{t.juzGrid}</h3>
        <JuzGrid progress={progress} />
      </section>
    </div>
  )
}
