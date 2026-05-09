import { BookOpen, Pencil, Plus } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { trackContinueReadingClick } from "@/lib/analytics"
import type { AppLanguage } from "@/lib/app-settings"
import type { QuranProgressState } from "@/lib/quran-progress"

type ContinueReadingCardProps = {
  language: AppLanguage
  progress: QuranProgressState
  onQuickLog: (increment: number) => void
  onSetDailyGoal: (goal: number) => void
}

const copy = {
  en: {
    ayah: "Ayah",
    cancel: "Cancel",
    continueReading: "Continue Reading",
    completed: "Completed",
    dailyGoalProgress: "Daily goal progress",
    goalAchieved: "MashaAllah! Daily Goal Achieved!",
    goalHelp: "Set a gentle page target for today.",
    juz: "Juz",
    page: "Page",
    pages: "pages",
    save: "Save",
    startReading: "Start Reading",
    updateGoal: "Update daily goal",
  },
  id: {
    ayah: "Ayat",
    cancel: "Batal",
    continueReading: "Lanjut Membaca",
    completed: "Selesai",
    dailyGoalProgress: "Progress target harian",
    goalAchieved: "MashaAllah! Target harian tercapai!",
    goalHelp: "Atur target halaman yang ringan untuk hari ini.",
    juz: "Juz",
    page: "Halaman",
    pages: "halaman",
    save: "Simpan",
    startReading: "Mulai Membaca",
    updateGoal: "Ubah target harian",
  },
}

export function ContinueReadingCard({ language, progress, onQuickLog, onSetDailyGoal }: ContinueReadingCardProps) {
  const t = copy[language]
  const navigate = useNavigate()
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalInput, setGoalInput] = useState(String(progress.daily_goal))
  const goalPercent = Math.min(100, (progress.pages_read_today / progress.daily_goal) * 100)
  const actionLabel = progress.pages_read_today > 0 ? t.continueReading : t.startReading

  useEffect(() => {
    setGoalInput(String(progress.daily_goal))
  }, [progress.daily_goal])

  function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSetDailyGoal(Number(goalInput))
    setGoalOpen(false)
  }

   function openReadingPage() {
     trackContinueReadingClick(progress.page, progress.surah, progress.ayah)
     navigate(progress.continue_url)
   }

  return (
    <>
      <Card
        className="flex cursor-pointer flex-col gap-4 p-4 transition hover:bg-sage-pale/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={openReadingPage}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openReadingPage()
          }
        }}
        role="link"
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl font-medium leading-tight text-primary">{progress.surah_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.ayah} {progress.ayah_range} • {progress.surah_english_name}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
              <span className="rounded-full bg-surface-container-low px-2.5 py-1">
                {t.page} {progress.page}
              </span>
              <span className="rounded-full bg-surface-container-low px-2.5 py-1">
                {t.juz} {progress.juz}
              </span>
              <span className="rounded-full bg-sage/10 px-2.5 py-1 text-primary">
                {progress.progress_percent}% {t.completed}
              </span>
            </div>
          </div>
          <div className="rounded-full bg-sage/10 p-2 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-muted-foreground">
              {progress.goal_completed_today ? t.goalAchieved : t.dailyGoalProgress}
            </span>
            <span className="text-sm font-bold text-primary">
              {progress.pages_read_today} / {progress.daily_goal} {t.pages}
            </span>
            <button
              aria-label={t.updateGoal}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition hover:bg-surface-container"
              onClick={(event) => {
                event.stopPropagation()
                setGoalOpen(true)
              }}
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <Progress className="h-2" value={goalPercent} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 5].map((increment) => (
            <Button
              key={increment}
              onClick={(event) => {
                event.stopPropagation()
                onQuickLog(increment)
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <Plus className="h-4 w-4" />+{increment}
            </Button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={(event) => {
              event.stopPropagation()
              openReadingPage()
            }}
            type="button"
          >
            {actionLabel}
          </Button>
        </div>
      </Card>

      {goalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-4 pb-4 sm:items-center sm:pb-0">
          <form
            className="w-full max-w-sm rounded-2xl border border-sage/20 bg-card p-5 text-card-foreground shadow-2xl"
            onSubmit={submitGoal}
          >
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-semibold text-primary">{t.updateGoal}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{t.goalHelp}</p>
            </div>
            <label className="mt-5 block text-sm font-semibold text-muted-foreground">
              {t.dailyGoalProgress}
              <input
                autoFocus
                className="mt-2 h-11 w-full rounded-xl border border-sage/20 bg-background px-3 text-base font-bold text-foreground outline-none focus:border-sage"
                inputMode="numeric"
                max={30}
                min={1}
                onChange={(event) => setGoalInput(event.target.value)}
                type="number"
                value={goalInput}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setGoalOpen(false)} type="button" variant="ghost">
                {t.cancel}
              </Button>
              <Button type="submit">{t.save}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
