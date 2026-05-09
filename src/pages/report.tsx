import { BarChart3, CalendarDays, Flame, HeartPulse, Moon, Sparkles, Utensils } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { AppSettings } from "@/lib/app-settings"
import type { CycleState } from "@/lib/cycle-progress"
import type { DailyTrackerState } from "@/lib/daily-tracker"
import type { FastingState } from "@/lib/fasting-progress"
import type { QuranProgressLog, QuranProgressState } from "@/lib/quran-progress"
import { cn } from "@/lib/utils"
import { useAppStore, type StoreState } from "@/stores/app-store"


type DayReport = {
  dateKey: string
  day: number
  habitCompleted: number
  isCycleDay: boolean
  prayerCompleted: number
  quranPages: number
  sahurReminder: boolean
  score: number
}

const prayersPerDay = 5

const copy = {
  en: {
    title: "Monthly Report",
    subtitle: "A quiet overview of this month's rhythm, consistency, and care.",
    heatmap: "Monthly Heatmap",
    selectedDay: "Selected Day",
    prayer: "Prayer",
    quran: "Quran",
    habits: "Habits",
    fasting: "Fasting",
    cycle: "Cycle",
    pages: (count: number) => `${count} pages`,
    prayers: (count: number) => `${count}/5 prayers`,
    habitsDone: (count: number) => `${count} habits done`,
    activeDays: (count: number) => `${count} active days`,
    openFasting: "Open Fasting Tracker",
    qadha: (remaining: number) => `${remaining} qadha days remaining`,
    cycleDays: (count: number) => `${count} cycle days this month`,
    noActivity: "No activity logged for this day yet.",
    sahur: "Sahur reminder set",
    period: "Period day",
  },
  id: {
    title: "Laporan Bulanan",
    subtitle: "Ringkasan lembut untuk melihat ritme, konsistensi, dan perhatian bulan ini.",
    heatmap: "Heatmap Bulanan",
    selectedDay: "Hari Terpilih",
    prayer: "Shalat",
    quran: "Quran",
    habits: "Habit",
    fasting: "Puasa",
    cycle: "Siklus",
    pages: (count: number) => `${count} halaman`,
    prayers: (count: number) => `${count}/5 shalat`,
    habitsDone: (count: number) => `${count} habit selesai`,
    activeDays: (count: number) => `${count} hari aktif`,
    openFasting: "Buka Tracker Puasa",
    qadha: (remaining: number) => `${remaining} hari qadha tersisa`,
    cycleDays: (count: number) => `${count} hari siklus bulan ini`,
    noActivity: "Belum ada aktivitas tercatat untuk hari ini.",
    sahur: "Reminder sahur aktif",
    period: "Hari haid",
  },
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function monthDays(date = new Date()) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return Array.from({ length: end.getDate() }, (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1))
}

function isBetween(dateKey: string, startDate: string, endDate: string) {
  return dateKey >= startDate && dateKey <= endDate
}

function countCycleDays(cycleState: CycleState, days: Date[]) {
  return days.filter((day) => isCycleDay(cycleState, localDateKey(day))).length
}

function isCycleDay(cycleState: CycleState, dateKey: string) {
  if (cycleState.activePeriod && dateKey >= cycleState.activePeriod.startDate) return true
  return cycleState.logs.some((log) => isBetween(dateKey, log.startDate, log.endDate))
}

interface ReportData {
  cycleState: CycleState
  dailyTrackerState: DailyTrackerState
  fastingState: FastingState
  quranProgress: QuranProgressState
}

function reportForDay(date: Date, input: ReportData): DayReport {
  const dateKey = localDateKey(date)
  const daily = input.dailyTrackerState.days[dateKey]
  const quranPages = input.quranProgress.logs.find((log: QuranProgressLog) => log.date === dateKey)?.pages ?? 0
  const prayerCompleted = daily?.completedPrayers.length ?? 0
  const habitCompleted = daily ? Object.values(daily.habitCompletions).filter((item: any) => item.completed).length : 0
  const sahurReminder = input.fastingState.sahurReminderDates.includes(dateKey)
  const cycleDay = isCycleDay(input.cycleState, dateKey)
  const score = Math.min(4, Number(quranPages > 0) + Math.min(2, Math.ceil(prayerCompleted / 3)) + Number(habitCompleted > 0) + Number(sahurReminder))

  return {
    dateKey,
    day: date.getDate(),
    habitCompleted,
    isCycleDay: cycleDay,
    prayerCompleted,
    quranPages,
    sahurReminder,
    score,
  }
}

function intensityClass(day: DayReport) {
  if (day.isCycleDay) return "bg-blush/70 text-accent-foreground ring-2 ring-blush/30"
  if (day.score >= 4) return "bg-sage text-white"
  if (day.score === 3) return "bg-sage/75 text-white"
  if (day.score === 2) return "bg-sage/45 text-sage-deep"
  if (day.score === 1) return "bg-sage-pale text-sage-deep"
  return "bg-surface-container-low text-muted-foreground"
}

export default function ReportPage() {
  const language = useAppStore((s: StoreState) => s.settings.language)
  const cycleState = useAppStore((s: StoreState) => s.cycleState)
  const dailyTrackerState = useAppStore((s: StoreState) => s.dailyTrackerState)
  const fastingState = useAppStore((s: StoreState) => s.fastingState)
  const quranProgress = useAppStore((s: StoreState) => s.quranProgress)
  
  const t = copy[language]
  const days = useMemo(() => monthDays(), [])
  const reports = useMemo(
    () => days.map((day) => reportForDay(day, { cycleState, dailyTrackerState, fastingState, quranProgress })),
    [cycleState, dailyTrackerState, days, fastingState, quranProgress],
  )
  const [selectedDateKey, setSelectedDateKey] = useState(() => localDateKey(new Date()))
  const selectedDay = reports.find((day) => day.dateKey === selectedDateKey) ?? reports[reports.length - 1]
  const monthLabel = new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { month: "long", year: "numeric" }).format(new Date())
  const totalQuranPages = reports.reduce((total, day) => total + day.quranPages, 0)
  const prayerProgress = Math.round((reports.reduce((total, day) => total + day.prayerCompleted, 0) / (reports.length * prayersPerDay)) * 100)
  const activeDays = reports.filter((day) => day.score > 0 || day.isCycleDay).length
  const cycleDays = countCycleDays(cycleState, days)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-5 pb-28">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sage">
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wide">{monthLabel}</span>
        </div>
        <h2 className="font-serif text-4xl font-semibold leading-tight text-primary">{t.title}</h2>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">{t.subtitle}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <Moon className="h-5 w-5 text-sage" />
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.prayer}</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-primary">{prayerProgress}%</p>
          <Progress className="mt-3" value={prayerProgress} />
        </Card>
        <Card className="p-4">
          <Sparkles className="h-5 w-5 text-sage" />
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.quran}</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-primary">{totalQuranPages}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.pages(totalQuranPages)}</p>
        </Card>
        <Card className="p-4">
          <Flame className="h-5 w-5 text-sage" />
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.habits}</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-primary">{activeDays}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.activeDays(activeDays)}</p>
        </Card>
        <Card className="p-4">
          <HeartPulse className="h-5 w-5 text-blush" />
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.cycle}</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-primary">{cycleDays}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.cycleDays(cycleDays)}</p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-primary">{t.heatmap}</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{monthLabel}</p>
            </div>
            <Badge className="bg-sage-pale text-sage-deep">{t.activeDays(activeDays)}</Badge>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {reports.map((day) => (
              <button
                aria-label={day.dateKey}
                className={cn(
                  "aspect-square rounded-xl text-xs font-bold transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  intensityClass(day),
                  selectedDateKey === day.dateKey && "ring-2 ring-primary",
                )}
                key={day.dateKey}
                onClick={() => setSelectedDateKey(day.dateKey)}
                type="button"
              >
                {day.day}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif text-2xl font-semibold text-primary">{t.selectedDay}</h3>
              <Badge>{selectedDay.dateKey}</Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm font-semibold text-muted-foreground">
              {selectedDay.score === 0 && !selectedDay.isCycleDay ? <p>{t.noActivity}</p> : null}
              {selectedDay.prayerCompleted > 0 ? <p>{t.prayers(selectedDay.prayerCompleted)}</p> : null}
              {selectedDay.quranPages > 0 ? <p>{t.pages(selectedDay.quranPages)}</p> : null}
              {selectedDay.habitCompleted > 0 ? <p>{t.habitsDone(selectedDay.habitCompleted)}</p> : null}
              {selectedDay.sahurReminder ? <p>{t.sahur}</p> : null}
              {selectedDay.isCycleDay ? <p>{t.period}</p> : null}
            </div>
          </Card>

          <Card className="overflow-hidden p-4">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-sage-pale/40" />
            <div className="relative">
              <Utensils className="h-5 w-5 text-sage" />
              <h3 className="mt-3 font-serif text-2xl font-semibold text-primary">{t.fasting}</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{t.qadha(fastingState.remainingQadha)}</p>
              <Button asChild className="mt-4" size="sm" type="button">
                <Link to="/fasting">{t.openFasting}</Link>
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sage">
              <CalendarDays className="h-5 w-5" />
              <h3 className="font-serif text-2xl font-semibold text-primary">{t.cycle}</h3>
            </div>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">{t.cycleDays(cycleDays)}</p>
          </Card>
        </div>
      </section>
    </div>
  )
}
