import { BookOpen, CalendarDays, Flame, Plus } from "lucide-react"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import type { AppLanguage } from "@/lib/app-settings"
import type { QuranProgressState } from "@/lib/quran-progress"

type QuickLogButtonsProps = {
  language: AppLanguage
  progress: QuranProgressState
  onQuickLog: (increment: number) => void
  onSetPage: (page: number) => void
}

const copy = {
  en: {
    title: "Quick Log",
    subtitle: "Salam. Keep the Quran close today.",
    page: "Page",
    juz: "Juz",
    finish: "Projected finish",
    currentPage: "Currently on page",
    savePage: "Update",
  },
  id: {
    title: "Catat Cepat",
    subtitle: "Salam. Dekatkan Quran hari ini.",
    page: "Halaman",
    juz: "Juz",
    finish: "Perkiraan selesai",
    currentPage: "Sekarang di halaman",
    savePage: "Perbarui",
  },
}

export function QuickLogButtons({ language, progress, onQuickLog, onSetPage }: QuickLogButtonsProps) {
  const t = copy[language]
  const [editingPage, setEditingPage] = useState(false)
  const [pageInput, setPageInput] = useState(String(progress.last_page_read || progress.page))

  function submitPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSetPage(Number(pageInput))
    setEditingPage(false)
  }

  return (
    <div className="rounded-xl border border-sage/15 bg-card p-5 text-card-foreground shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-pale text-sage-deep">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">{t.title}</p>
          <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight text-foreground">
            {progress.surah_name}, Ayah {progress.ayah}
          </h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {t.page} {progress.page} • {t.juz} {progress.juz}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-sage/20 bg-sage-pale px-3 py-1 text-xs font-bold text-sage-deep">
          <Flame className="h-3.5 w-3.5" />
          {progress.streak_label}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{progress.milestone_message ?? t.subtitle}</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[1, 2, 5].map((increment) => (
          <Button key={increment} onClick={() => onQuickLog(increment)} type="button" variant="outline">
            <Plus className="h-4 w-4" />
            {increment}
          </Button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-sage/10 bg-surface-container-low px-3 py-2">
        {editingPage ? (
          <form className="flex items-center gap-2" onSubmit={submitPage}>
            <label className="min-w-0 flex-1 text-sm font-semibold text-muted-foreground">
              {t.currentPage}
              <input
                autoFocus
                className="ml-2 h-9 w-24 rounded-lg border border-sage/20 bg-background px-3 text-sm font-bold text-foreground outline-none focus:border-sage"
                inputMode="numeric"
                max={604}
                min={1}
                onChange={(event) => setPageInput(event.target.value)}
                type="number"
                value={pageInput}
              />
            </label>
            <Button size="sm" type="submit">
              {t.savePage}
            </Button>
          </form>
        ) : (
          <button
            className="text-sm font-semibold text-muted-foreground transition hover:text-primary"
            onClick={() => {
              setPageInput(String(progress.last_page_read || progress.page))
              setEditingPage(true)
            }}
            type="button"
          >
            {t.currentPage} <span className="font-bold text-primary">{progress.last_page_read || progress.page}</span>
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2 text-sm font-semibold text-muted-foreground">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span>
          {t.finish}: {progress.projected_finish_date}
        </span>
      </div>
    </div>
  )
}
