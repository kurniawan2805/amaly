import { ContinueReadingCard } from "@/components/quran/continue-reading-card"
import { JuzGrid } from "@/components/quran/juz-grid"
import { QuickLogButtons } from "@/components/quran/quick-log-buttons"
import { Card } from "@/components/ui/card"
import type { AppLanguage, HijriOffset } from "@/lib/app-settings"
import { formatQuranLogDate, type QuranProgressLog, type QuranProgressState } from "@/lib/quran-progress"

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
    completed: "Completed",
    continueReading: "Continue Reading",
    dailyGoal: "Daily Goal: 5 Pages",
    juzGrid: "Juz Grid",
    journeyLog: "Journey Log",
    readPages: (pages: number) => `Read ${pages} page${pages === 1 ? "" : "s"}`,
    reached: "reached",
    completedJuzs: (juzs: number[]) => `Completed Juz ${juzs.join(", ")}.`,
  },
  id: {
    title: "Pelacak Quran",
    subtitle: "Salam. Rawat hati dengan tilawah harian.",
    completed: "Selesai",
    continueReading: "Lanjut Membaca",
    dailyGoal: "Target Harian: 5 Halaman",
    juzGrid: "Grid Juz",
    journeyLog: "Catatan Perjalanan",
    readPages: (pages: number) => `Membaca ${pages} halaman`,
    reached: "sampai",
    completedJuzs: (juzs: number[]) => `Selesai Juz ${juzs.join(", ")}.`,
  },
}

function JourneyEntry({ hijriOffset, language, log }: { hijriOffset: HijriOffset; language: AppLanguage; log: QuranProgressLog }) {
  const t = copy[language]
  const completedJuzs = log.completed_juzs ?? (typeof log.completed_juz === "number" ? [log.completed_juz] : [])

  return (
    <li className="relative pl-9">
      <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-sage/20 bg-card text-xs">
        {completedJuzs.length > 0 ? "💐" : ""}
      </span>
      <div className="rounded-xl border border-sage/15 bg-card p-4">
        <p className="font-serif text-xl font-semibold text-primary">{formatQuranLogDate(log.date, language, hijriOffset)}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {t.readPages(log.pages)} ({t.reached} {log.surah_name}, Ayah {log.ayah})
        </p>
        {completedJuzs.length > 0 ? (
          <p className="mt-2 text-sm font-bold text-primary">MashaAllah! {t.completedJuzs(completedJuzs)}</p>
        ) : null}
      </div>
    </li>
  )
}

export default function QuranPage({ language, hijriOffset, progress, onQuickLog, onSetPage, onSetDailyGoal }: QuranPageProps) {
  const t = copy[language]
  const circumference = 251.2
  const progressOffset = circumference - (progress.progress_percent / 100) * circumference

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-6 py-6 pb-32">
      <section className="space-y-3 text-center">
        <h2 className="font-serif text-4xl font-semibold leading-tight text-primary">{t.title}</h2>
        <p className="text-lg leading-8 text-muted-foreground">{t.subtitle}</p>
      </section>

      <QuickLogButtons language={language} onQuickLog={onQuickLog} onSetPage={onSetPage} progress={progress} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <Card className="flex flex-col items-center justify-center p-6 text-center md:col-span-4">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle className="stroke-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" strokeWidth="8" />
              <circle
                className="stroke-primary"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-3xl font-medium text-primary">{progress.progress_percent}%</span>
              <span className="text-sm font-semibold text-muted-foreground">{t.completed}</span>
            </div>
          </div>
          <p className="mt-6 text-muted-foreground">
            Juz {progress.juz}, Page {progress.page}
          </p>
        </Card>

        <div className="md:col-span-8">
          <ContinueReadingCard language={language} onSetDailyGoal={onSetDailyGoal} progress={progress} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-2xl font-medium text-primary">{t.juzGrid}</h3>
        <JuzGrid progress={progress} />
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-2xl font-medium text-primary">{t.journeyLog}</h3>
        <ol className="space-y-4 border-l border-sage/15 pl-3">
          {[...progress.logs].reverse().slice(0, 8).map((log) => (
            <JourneyEntry hijriOffset={hijriOffset} key={log.date} language={language} log={log} />
          ))}
          {progress.logs.length === 0 ? (
            <li className="rounded-xl border border-sage/15 bg-card p-4 text-sm font-semibold text-muted-foreground">
              Salam. Your first Quran log will appear here.
            </li>
          ) : null}
        </ol>
      </section>
    </div>
  )
}
