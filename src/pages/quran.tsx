import { Bookmark } from "lucide-react"
import { ContinueReadingCard } from "@/components/quran/continue-reading-card"
import { ContextBookmarksPanel } from "@/components/quran/context-bookmarks-panel"
import { JuzGrid } from "@/components/quran/juz-grid"
import { Button } from "@/components/ui/button"
import type { AppLanguage, HijriOffset } from "@/lib/app-settings"
import { formatQuranLogDate, type QuranProgressLog, type QuranProgressState } from "@/lib/quran-progress"
import { useAppStore, type StoreState } from "@/stores/app-store"
import { useShallow } from "zustand/react/shallow"


const copy = {
  en: {
    title: "Quran Tracker",
    subtitle: "Salam. Nurture your soul with daily recitation.",
    juzGrid: "Juz Grid",
    journeyLog: "Journey Log",
    readPages: (pages: number) => `Read ${pages} page${pages === 1 ? "" : "s"}`,
    reached: "reached",
    completedJuzs: (juzs: number[]) => `Completed Juz ${juzs.join(", ")}.`,
  },
  id: {
    title: "Pelacak Quran",
    subtitle: "Salam. Rawat hati dengan tilawah harian.",
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

export default function QuranPage() {
  const language = useAppStore((s: StoreState) => s.settings.language)
  const hijriOffset = useAppStore((s: StoreState) => s.settings.hijriOffset)
  const progress = useAppStore((s: StoreState) => s.quranProgress)
  const quranBookmarks = useAppStore((s: StoreState) => s.quranBookmarks)
  
  const { onQuickLog, onSetDailyGoal, onSetPage, openPanel } = useAppStore(
    useShallow((s: StoreState) => ({
      onQuickLog: s.quickLogQuran,
      onSetDailyGoal: s.setQuranDailyGoal,
      onSetPage: s.setQuranPage,
      openPanel: s.openPanel,
    }))
  )
  
  const t = copy[language]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-4 pb-28">
      <header className="relative flex flex-col items-center gap-1 text-center">
        <h2 className="font-serif text-3xl font-semibold leading-tight text-primary">{t.title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
        
        <Button 
          onClick={() => openPanel("quran-marks")}
          size="sm" 
          variant="outline" 
          className="absolute right-0 top-0 rounded-full border-sage/20 bg-sage-pale/10 text-sage-deep hover:bg-sage-pale/20"
        >
          <Bookmark className="mr-2 h-4 w-4" />
          Marks
        </Button>
      </header>

      <section>
        <ContinueReadingCard language={language} onQuickLog={onQuickLog} onSetDailyGoal={onSetDailyGoal} progress={progress} />
      </section>

      {quranBookmarks.contextBookmarks.length > 0 && (
        <section>
          <ContextBookmarksPanel
            bookmarks={quranBookmarks.contextBookmarks}
            language={language}
            onNavigate={(page) => onSetPage(page)}
          />
        </section>
      )}

      <section className="space-y-2">
        <h3 className="font-serif text-xl font-medium text-primary">{t.juzGrid}</h3>
        <JuzGrid progress={progress} />
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-xl font-medium text-primary">{t.journeyLog}</h3>
        <ol className="space-y-3 border-l border-sage/15 pl-3">
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
