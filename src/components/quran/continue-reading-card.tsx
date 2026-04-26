import { BookOpen, Pencil } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { AppLanguage } from "@/lib/app-settings"
import type { QuranProgressState } from "@/lib/quran-progress"

type ContinueReadingCardProps = {
  language: AppLanguage
  progress: QuranProgressState
  onSetDailyGoal: (goal: number) => void
}

const copy = {
  en: {
    ayah: "Ayah",
    cancel: "Cancel",
    continueReading: "Continue Reading",
    dailyGoal: "Daily Goal",
    goalAchieved: "MashaAllah! Daily Goal Achieved!",
    goalHelp: "Set a gentle page target for today.",
    pagesLoggedToday: "pages logged today",
    save: "Save",
    startReading: "Start Reading",
    updateGoal: "Update daily goal",
  },
  id: {
    ayah: "Ayat",
    cancel: "Batal",
    continueReading: "Lanjut Membaca",
    dailyGoal: "Target Harian",
    goalAchieved: "MashaAllah! Target harian tercapai!",
    goalHelp: "Atur target halaman yang ringan untuk hari ini.",
    pagesLoggedToday: "halaman dicatat hari ini",
    save: "Simpan",
    startReading: "Mulai Membaca",
    updateGoal: "Ubah target harian",
  },
}

export function ContinueReadingCard({ language, progress, onSetDailyGoal }: ContinueReadingCardProps) {
  const t = copy[language]
  const [goalOpen, setGoalOpen] = useState(false)
  const [goalInput, setGoalInput] = useState(String(progress.daily_goal))
  const goalPercent = Math.min(100, (progress.pages_read_today / progress.daily_goal) * 100)

  useEffect(() => {
    setGoalInput(String(progress.daily_goal))
  }, [progress.daily_goal])

  function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSetDailyGoal(Number(goalInput))
    setGoalOpen(false)
  }

  return (
    <>
      <Card className="flex flex-col justify-between p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-secondary">{t.continueReading}</p>
            <h2 className="font-serif text-3xl font-medium text-primary">{progress.surah_name}</h2>
            <p className="text-muted-foreground">
              {t.ayah} {progress.ayah_range} • {progress.surah_english_name}
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Page {progress.page} • Juz {progress.juz}
            </p>
          </div>
          <div className="rounded-full bg-sage/10 p-3 text-primary">
            <BookOpen className="h-7 w-7" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-muted-foreground">{t.dailyGoal}</span>
            <button
              aria-label={t.updateGoal}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition hover:bg-surface-container"
              onClick={() => setGoalOpen(true)}
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <Progress className="h-2" value={goalPercent} />
          <div className="flex justify-between gap-3 text-sm font-semibold text-muted-foreground">
            <span>{progress.goal_completed_today ? t.goalAchieved : t.dailyGoal}</span>
            <span>
              {progress.pages_read_today} / {progress.daily_goal} {t.pagesLoggedToday}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button asChild>
            <a href={progress.continue_url} rel="noreferrer" target="_blank">
              {t.startReading}
            </a>
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
              {t.dailyGoal}
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
