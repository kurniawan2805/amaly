import { BookOpen, Check, Clock, Lock, Moon, Plus, Quote, Settings, Sparkles, Sun } from "lucide-react"
import { CSSProperties, FormEvent, PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { PartnerWidget } from "@/components/partner/partner-widget"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AppSettings, HabitDefinition, PrayerAnchor } from "@/lib/app-settings"
import { type CycleState, getCycleSummary } from "@/lib/cycle-progress"
import { getDailyTrackerDay, localDailyTrackerKey, type DailyTrackerState } from "@/lib/daily-tracker"
import { formatHijriDate } from "@/lib/hijri-date"
import { getActiveDhikrWindow, getNowMinutes, prayers, timeToMinutes } from "@/lib/prayer-windows"
import { shouldShowQuranEveningNudge, type QuranProgressState } from "@/lib/quran-progress"
import { cn } from "@/lib/utils"

type Habit = {
  id: string
  label: string
  category: string
  scheduleLabel: string
  plannedDays: boolean[]
  timing: HabitDefinition["timing"]
  completed: boolean
  completedAt: string | null
}

type FlowerBurst = {
  id: number
  prayer: string
}

type PressActionProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  onPress: () => void
  onLongPress: () => void
  ariaLabel: string
}

const flowerEmojis = ["💐", "🌸", "🌷", "🌹", "🌺", "🌼", "🪷", "🌸", "🌷", "🌹", "🌺", "🌼", "💐", "🪷"]
const flowerConfetti = Array.from({ length: 64 }, (_, index) => ({
  emoji: flowerEmojis[index % flowerEmojis.length],
  left: (index * 37) % 100,
  top: (index * 23) % 100,
  delay: (index % 16) * 42,
  drift: ((index % 9) - 4) * 18,
  fall: 70 + (index % 7) * 18,
  rotate: ((index % 11) - 5) * 18,
  size: index % 4 === 0 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
}))

function formatGregorianDate(date: Date, language: AppSettings["language"]) {
  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function toHabitState(habit: HabitDefinition): Habit {
  return {
    id: habit.id,
    label: habit.label,
    category: habit.category,
    scheduleLabel: habit.scheduleLabel,
    plannedDays: habit.plannedDays,
    timing: habit.timing,
    completed: false,
    completedAt: null,
  }
}

function prayerToMinutes(prayer: PrayerAnchor) {
  const prayerWindow = prayers.find((item) => item.label.toLowerCase() === prayer)
  return prayerWindow ? timeToMinutes(prayerWindow.start) : Number.MAX_SAFE_INTEGER
}

function getActiveHabitPhase(nowMinutes: number) {
  return nowMinutes >= timeToMinutes("15:00") ? "night" : "morning"
}

function formatTime(date: Date, language: AppSettings["language"]) {
  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function HabitMark({ habit }: { habit: Habit }) {
  const label = habit.label.toLowerCase()
  const Icon = label.includes("quran") || label.includes("surah") ? BookOpen : label.includes("dhikr") ? Sun : Moon
  const color = label.includes("quran")
    ? "bg-sage-pale text-sage-deep"
    : label.includes("dhikr")
      ? "bg-blush-pale text-accent-foreground"
      : "bg-sky-pale text-secondary"

  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
      <Icon className="h-5 w-5" />
    </span>
  )
}

const copy = {
  en: {
    morning: (name: string) => `Ahlan, ${name || "friend"}`,
    intro: "Embrace the tranquility of today. Your spiritual journey awaits.",
    prayerCheck: "Prayer Check",
    haidMode: "Period Mode",
    prayerPaused: "Prayer check is paused during period mode. When you are pure again, end the period from Cycle.",
    manageCycle: "Manage in Cycle",
    khobarEstimate: "Khobar estimate",
    options: "Prayer options",
    beforeFajr: "Have you prayed witr? Prepare your heart for the fajr prayer.",
    allComplete: "All prayers available today are complete. May the rest of your night feel peaceful.",
    completedPrayer: (prayer: string) => `${prayer} is complete. May your next prayer feel light.`,
    currentPrayer: (prayer: string) => `It's time for ${prayer}. Take a peaceful moment to pray.`,
    passedPrayer: (prayer: string) => `${prayer} has passed. You can still mark it when you're ready.`,
    prayerDone: (prayer: string) => `${prayer} completed. Long press to uncheck.`,
    prayerFuture: (prayer: string, start: string) => `${prayer} begins around ${start} in Khobar.`,
    prayerMark: (prayer: string) => `Mark ${prayer} complete.`,
    sunnah: "Sunnah",
    dailyHabits: "Daily Habits",
    quran: "Quran",
    quranContinue: "Continue",
    quranCustom: "Custom",
    quranTarget: "Daily Quran Target",
    quranTargetHelp: "Set your gentle page target for each day.",
    editQuranTarget: "Edit daily Quran target",
    cancel: "Cancel",
    save: "Save",
    quranToday: "Today progress",
    quranPage: "Page",
    quranJuz: "Juz",
    quranPages: "pages",
    earlierToday: "Earlier Today",
    eveningNight: "Evening & Night",
    phaseDone: (done: number, total: number) => `${done} of ${total} Done`,
    morningComplete: "Morning Complete",
    nightPhase: "Night phase",
    logAllMorning: "Log All Morning",
    upcomingAfter: (anchor: string) => `Upcoming: After ${anchor}`,
    upcomingDuring: (anchor: string) => `Upcoming: During ${anchor}`,
    upcomingBefore: (anchor: string) => `Upcoming: Before ${anchor}`,
    anytimeActive: "Anytime today",
    doneAt: (time: string) => `Done at ${time}`,
    completed: "completed",
    manageHabits: "Manage daily habits",
    cyclePhase: "Cycle Phase",
    follicular: "Follicular Day 4",
    logSymptoms: "Log Symptoms",
    quranNudge: "Salam! There's still time for a quick page tonight to keep your streak glowing.",
    dhikrCtaTitle: (window: "morning" | "evening") => (window === "morning" ? "Morning dhikr window" : "Evening dhikr window"),
    dhikrCtaBody: (window: "morning" | "evening") =>
      window === "morning" ? "After Fajr is a gentle time for morning remembrance." : "After Ashr is a gentle time for evening remembrance.",
    dhikrCtaAction: "Open Dzikir Flow",
    now: "Now",
    upcoming: "Upcoming",
    available: "Available",
    flexible: "Flexible",
    missed: "Missed",
    completedStatus: "Completed",
  },
  id: {
    morning: (name: string) => `Ahlan, ${name || "sahabat"}`,
    intro: "Nikmati ketenangan hari ini. Perjalanan ibadahmu menanti.",
    prayerCheck: "Cek Shalat",
    haidMode: "Mode Haid",
    prayerPaused: "Cek shalat dijeda selama mode haid. Jika sudah suci, akhiri period dari halaman Siklus.",
    manageCycle: "Kelola di Siklus",
    khobarEstimate: "Perkiraan Khobar",
    options: "Opsi shalat",
    beforeFajr: "Sudah shalat witr? Siapkan hati untuk shalat fajr.",
    allComplete: "Semua shalat yang tersedia hari ini sudah selesai. Semoga malammu terasa tenang.",
    completedPrayer: (prayer: string) => `${prayer} selesai. Semoga shalat berikutnya terasa ringan.`,
    currentPrayer: (prayer: string) => `Saatnya ${prayer}. Ambil momen tenang untuk shalat.`,
    passedPrayer: (prayer: string) => `${prayer} sudah lewat. Kamu tetap bisa menandainya saat siap.`,
    prayerDone: (prayer: string) => `${prayer} selesai. Tekan lama untuk batal.`,
    prayerFuture: (prayer: string, start: string) => `${prayer} mulai sekitar ${start} di Khobar.`,
    prayerMark: (prayer: string) => `Tandai ${prayer} selesai.`,
    sunnah: "Sunnah",
    dailyHabits: "Kebiasaan Harian",
    quran: "Quran",
    quranContinue: "Lanjutkan",
    quranCustom: "Custom",
    quranTarget: "Target Quran Harian",
    quranTargetHelp: "Atur target halaman ringan untuk setiap hari.",
    editQuranTarget: "Ubah target Quran harian",
    cancel: "Batal",
    save: "Simpan",
    quranToday: "Progress hari ini",
    quranPage: "Halaman",
    quranJuz: "Juz",
    quranPages: "halaman",
    earlierToday: "Tadi Hari Ini",
    eveningNight: "Sore & Malam",
    phaseDone: (done: number, total: number) => `${done} dari ${total} selesai`,
    morningComplete: "Pagi Selesai",
    nightPhase: "Fase malam",
    logAllMorning: "Tandai Semua Pagi",
    upcomingAfter: (anchor: string) => `Berikutnya: Setelah ${anchor}`,
    upcomingDuring: (anchor: string) => `Berikutnya: Saat ${anchor}`,
    upcomingBefore: (anchor: string) => `Berikutnya: Sebelum ${anchor}`,
    anytimeActive: "Kapan saja hari ini",
    doneAt: (time: string) => `Selesai ${time}`,
    completed: "selesai",
    manageHabits: "Atur kebiasaan harian",
    cyclePhase: "Fase Siklus",
    follicular: "Hari Folikular 4",
    logSymptoms: "Catat Gejala",
    quranNudge: "Salam! Masih ada waktu untuk satu halaman malam ini agar istiqomah tetap menyala.",
    dhikrCtaTitle: (window: "morning" | "evening") => (window === "morning" ? "Waktu dzikir pagi" : "Waktu dzikir petang"),
    dhikrCtaBody: (window: "morning" | "evening") =>
      window === "morning" ? "Setelah Fajr adalah waktu lembut untuk dzikir pagi." : "Setelah Ashr adalah waktu lembut untuk dzikir petang.",
    dhikrCtaAction: "Buka Flow Dzikir",
    now: "Sekarang",
    upcoming: "Nanti",
    available: "Tersedia",
    flexible: "Fleksibel",
    missed: "Terlewat",
    completedStatus: "Selesai",
  },
}

function PressAction({ children, className, disabled = false, onPress, onLongPress, ariaLabel }: PressActionProps) {
  const timerRef = useRef<number | null>(null)
  const longPressedRef = useRef(false)

  function clearPressTimer() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    longPressedRef.current = false
    clearPressTimer()
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true
      onLongPress()
    }, 650)
  }

  function handlePointerUp() {
    clearPressTimer()

    if (disabled) {
      return
    }

    if (longPressedRef.current) {
      longPressedRef.current = false
      return
    }

    onPress()
  }

  function handlePointerCancel() {
    clearPressTimer()
    longPressedRef.current = false
  }

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerCancel}
      onPointerUp={handlePointerUp}
      type="button"
    >
      {children}
    </button>
  )
}

type HabitStatus = "upcoming" | "available" | "completed" | "missed" | "flexible"

type HabitSummary = {
  habit: Habit
  sort: number
  status: HabitStatus
  windowLabel: string
}

function formatMinutes(minutes: number) {
  const safe = Math.max(0, Math.min(1439, minutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

function getPrayerStart(prayer: PrayerAnchor) {
  return prayers.find((item) => item.label.toLowerCase() === prayer)?.start
}

function getPrayerEnd(prayer: PrayerAnchor) {
  return prayers.find((item) => item.label.toLowerCase() === prayer)?.end
}

function getHabitSummary(habit: Habit, nowMinutes: number): HabitSummary {
  if (habit.completed) {
    return { habit, sort: 3000, status: "completed", windowLabel: habit.scheduleLabel }
  }

  if (habit.timing.mode === "flexible") {
    const customStart = habit.timing.customStart ? timeToMinutes(habit.timing.customStart) : null
    const customEnd = habit.timing.customEnd ? timeToMinutes(habit.timing.customEnd) : null
    const hasCustomWindow = customStart !== null && customEnd !== null
    const status = hasCustomWindow && nowMinutes < customStart ? "upcoming" : hasCustomWindow && nowMinutes > customEnd ? "missed" : "flexible"
    return { habit, sort: hasCustomWindow ? customStart : 2000, status, windowLabel: hasCustomWindow ? `${formatMinutes(customStart)} - ${formatMinutes(customEnd)}` : habit.scheduleLabel }
  }

  const range = (() => {
    if (habit.timing.mode === "fixed_time") {
      return { end: timeToMinutes(habit.timing.end), start: timeToMinutes(habit.timing.start) }
    }

    if (habit.timing.mode === "prayer_based_time") {
      const start = timeToMinutes(getPrayerStart(habit.timing.prayer) ?? habit.timing.fallbackStart) + (habit.timing.startOffsetMinutes ?? 0)
      const end = habit.timing.untilPrayer ? getPrayerStart(habit.timing.untilPrayer) : habit.timing.window === "untilPrayerEnd" ? getPrayerEnd(habit.timing.prayer) : habit.timing.fallbackEnd
      return { end: timeToMinutes(end ?? habit.timing.fallbackEnd) + (habit.timing.endOffsetMinutes ?? 0), start }
    }

    if (habit.timing.mode === "prayer") {
      const start = prayerToMinutes(habit.timing.prayer) + habit.timing.offsetMinutes
      return { end: Math.min(1439, start + 90), start }
    }

    const start = habit.timing.time ? timeToMinutes(habit.timing.time) : 0
    return { end: start > 0 ? Math.min(1439, start + 90) : 1439, start }
  })()

  const status: HabitStatus = nowMinutes < range.start ? "upcoming" : nowMinutes > range.end ? "missed" : "available"
  return { habit, sort: range.start, status, windowLabel: `${formatMinutes(range.start)} - ${formatMinutes(range.end)}` }
}

type DailyPageProps = {
  settings: AppSettings
  cycleState: CycleState
  dailyTrackerState: DailyTrackerState
  displayName?: string
  quranProgress: QuranProgressState
  onQuickLog: (increment: number) => void
  onSetQuranDailyGoal: (goal: number) => void
  onSetPrayerCompleted: (prayer: string, completed: boolean, dateKey?: string) => void
  onToggleSunnahSelection: (prayer: string, dateKey?: string) => void
  onSetHabitCompleted: (habitId: string, completed: boolean, completedAt: string | null, dateKey?: string) => void
  onOpenHabitSettings: () => void
  onOpenSunnahSettings: () => void
}

export default function DailyPage({
  settings,
  cycleState,
  dailyTrackerState,
  displayName = "",
  quranProgress,
  onQuickLog,
  onSetQuranDailyGoal,
  onSetPrayerCompleted,
  onToggleSunnahSelection,
  onSetHabitCompleted,
  onOpenHabitSettings,
  onOpenSunnahSettings,
}: DailyPageProps) {
  const [flowerBursts, setFlowerBursts] = useState<FlowerBurst[]>([])
  const [cycleRevealed, setCycleRevealed] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [quranTargetOpen, setQuranTargetOpen] = useState(false)
  const [quranTargetInput, setQuranTargetInput] = useState(String(quranProgress.daily_goal))
  const t = copy[settings.language]
  const todayKey = localDailyTrackerKey(now)
  const todayTracker = useMemo(() => getDailyTrackerDay(dailyTrackerState, todayKey), [dailyTrackerState, todayKey])
  const completedPrayers = todayTracker.completedPrayers
  const selectedSunnah = todayTracker.selectedSunnah
  const gregorianDate = formatGregorianDate(now, settings.language)
  const hijriDate = formatHijriDate(now, settings.hijriOffset, settings.language)
  const visibleHabitDefinitions = useMemo(() => {
    const todayIndex = now.getDay()
    return settings.habits.filter((habit) => habit.enabled && habit.plannedDays[todayIndex])
  }, [now, settings.habits])
  const habits = useMemo(
    () =>
      visibleHabitDefinitions.map((habit) => {
        const completion = todayTracker.habitCompletions[habit.id]
        return {
          ...toHabitState(habit),
          completed: habit.label === "Quran Reading" ? quranProgress.goal_completed_today : Boolean(completion?.completed),
          completedAt: completion?.completedAt ?? null,
        }
      }),
    [quranProgress.goal_completed_today, todayTracker.habitCompletions, visibleHabitDefinitions],
  )

  const completedHabits = useMemo(() => habits.filter((habit) => habit.completed).length, [habits])
  const haidModeActive = Boolean(cycleState.activePeriod)
  const hasPrayerProgress = completedPrayers.length > 0
  const nowMinutes = getNowMinutes(now)
  const activeDhikrWindow = getActiveDhikrWindow(now)
  const availablePrayers = prayers.filter((prayer) => timeToMinutes(prayer.start) <= nowMinutes)
  const currentPrayer =
    [...prayers].reverse().find((prayer) => {
      const start = timeToMinutes(prayer.start)
      const end = timeToMinutes(prayer.end)
      return start <= nowMinutes && nowMinutes <= end
    }) ??
    availablePrayers[availablePrayers.length - 1] ??
    null
  const activeHabitPhase = getActiveHabitPhase(nowMinutes)
  const allAvailablePrayersCompleted =
    availablePrayers.length > 0 && availablePrayers.every((prayer) => completedPrayers.includes(prayer.label))
  const prayerReminder = (() => {
    if (!currentPrayer) {
      return t.beforeFajr
    }

    if (availablePrayers.length === prayers.length && allAvailablePrayersCompleted) {
      return t.allComplete
    }

    if (completedPrayers.includes(currentPrayer.label)) {
      return t.completedPrayer(currentPrayer.label)
    }

    if (timeToMinutes(currentPrayer.end) < nowMinutes) {
      return t.passedPrayer(currentPrayer.label)
    }

    return t.currentPrayer(currentPrayer.label)
  })()
  const cycleSummary = useMemo(() => getCycleSummary(cycleState, now), [cycleState, now])
  const cyclePrivate = cycleState.settings.privacyEnabled && !cycleRevealed
  const habitSummaries = useMemo(() => habits.map((habit) => getHabitSummary(habit, nowMinutes)).sort((a, b) => a.sort - b.sort), [habits, nowMinutes])
  const activeHabits = habitSummaries.filter((item) => item.status === "available" || item.status === "flexible")
  const upcomingHabits = habitSummaries.filter((item) => item.status === "upcoming")
  const missedHabits = habitSummaries.filter((item) => item.status === "missed")
  const completedHabitSummaries = habitSummaries.filter((item) => item.status === "completed")
  const activeProgress = habitSummaries.length > 0 ? (completedHabitSummaries.length / habitSummaries.length) * 100 : 0
  const quranGoalProgress = Math.min(100, (quranProgress.pages_read_today / quranProgress.daily_goal) * 100)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    setQuranTargetInput(String(quranProgress.daily_goal))
  }, [quranProgress.daily_goal])

  function saveQuranTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSetQuranDailyGoal(Number(quranTargetInput))
    setQuranTargetOpen(false)
  }

  function completeHabit(id: string) {
    onSetHabitCompleted(id, true, formatTime(new Date(), settings.language), todayKey)
  }

  function uncompleteHabit(id: string) {
    onSetHabitCompleted(id, false, null, todayKey)
  }

  function completePrayer(prayer: string) {
    if (!availablePrayers.some((item) => item.label === prayer)) {
      return
    }

    if (completedPrayers.includes(prayer)) {
      return
    }

    const burstId = Date.now()
    setFlowerBursts((bursts) => [...bursts, { id: burstId, prayer }])
    window.setTimeout(() => {
      setFlowerBursts((bursts) => bursts.filter((burst) => burst.id !== burstId))
    }, 1800)

    onSetPrayerCompleted(prayer, true, todayKey)
  }

  function uncompletePrayer(prayer: string) {
    onSetPrayerCompleted(prayer, false, todayKey)
  }

  function toggleSunnah(prayer: string) {
    onToggleSunnahSelection(prayer, todayKey)
  }

  function renderHabitItem(item: HabitSummary) {
    const habit = item.habit
    const statusLabel = item.status === "completed" ? t.completedStatus : item.status === "missed" ? t.missed : item.status === "upcoming" ? t.upcoming : item.status === "flexible" ? t.flexible : t.available
    const isQuranHabit = habit.label === "Quran Reading"
    const dhikrCategory = habit.label === "Morning Dhikr" ? "morning-dhikr" : habit.label === "Evening Dhikr" ? "evening-dhikr" : null
    const href = isQuranHabit ? "/quran" : dhikrCategory ? `/duas?category=${dhikrCategory}&flow=1` : null
    const windowLabel = isQuranHabit ? `${quranProgress.pages_read_today} / ${quranProgress.daily_goal} ${t.quranPages} today` : habit.completed && habit.completedAt ? t.doneAt(habit.completedAt) : item.windowLabel
    const rowContent = (
      <>
        <span className="block truncate text-sm font-bold">{habit.label}</span>
        <span className="block truncate text-xs font-semibold text-muted-foreground">{windowLabel}</span>
      </>
    )

    return (
      <li
        key={habit.id}
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-sage/10 bg-card px-3 py-2.5 transition hover:border-sage/20 hover:bg-surface-container-low/70",
          item.status === "available" && "border-sage/45 bg-sage-pale/35 dark:bg-sage/10",
          item.status === "missed" && "opacity-70",
        )}
      >
        <HabitMark habit={habit} />
        <div className="min-w-0 flex-1">
          {href ? (
            <Link className={cn("block min-w-0 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", habit.completed ? "text-foreground/60 line-through" : "text-foreground")} to={href}>
              {rowContent}
            </Link>
          ) : (
            <PressAction ariaLabel={habit.completed ? `${habit.label} ${t.completed}. Long press to uncheck.` : `Mark ${habit.label} ${t.completed}.`} className={cn("block min-w-0 text-left transition", habit.completed ? "text-foreground/60 line-through" : "text-foreground")} onLongPress={() => uncompleteHabit(habit.id)} onPress={() => completeHabit(habit.id)}>
              {rowContent}
            </PressAction>
          )}
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-1 text-[0.68rem] font-bold", item.status === "available" || item.status === "flexible" ? "bg-sage-pale text-sage-deep" : "bg-surface-container-low text-muted-foreground")}>{statusLabel}</span>
        <PressAction
          ariaLabel={
            habit.completed
              ? `${habit.label} ${t.completed}. Long press to uncheck.`
              : `Mark ${habit.label} ${t.completed}.`
          }
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sage/35 bg-card transition",
            habit.completed && "border-primary bg-primary text-white",
          )}
          onLongPress={() => uncompleteHabit(habit.id)}
          onPress={() => completeHabit(habit.id)}
        >
          {habit.completed ? <Check className="h-4 w-4" /> : null}
        </PressAction>
      </li>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-5 pb-28">
      {flowerBursts.length > 0 ? (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {flowerBursts.map((burst) =>
            flowerConfetti.map((flower, index) => (
              <span
                key={`${burst.id}-${index}`}
                className={cn("animate-flower-burst fixed", flower.size)}
                style={
                  {
                    left: `${flower.left}vw`,
                    top: `${flower.top}vh`,
                    animationDelay: `${flower.delay}ms`,
                    "--flower-x": `${flower.drift}px`,
                    "--flower-y": `${flower.fall}px`,
                    "--flower-rotate": `${flower.rotate}deg`,
                  } as CSSProperties
                }
              >
                {flower.emoji}
              </span>
            )),
          )}
        </div>
      ) : null}
        <PartnerWidget language={settings.language} />

        <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-serif text-2xl font-semibold leading-tight text-sage sm:text-3xl">{hijriDate}</span>
          <span className="text-sm font-semibold text-muted-foreground">{gregorianDate}</span>
        </div>
        <h2 className="font-serif text-4xl font-semibold leading-tight text-primary">{t.morning(displayName)}</h2>
        <p className="max-w-lg text-lg leading-8 text-muted-foreground">{t.intro}</p>
        {activeDhikrWindow ? (
          <Card className="mt-2 overflow-hidden border-sage/20 bg-gradient-to-br from-sage-pale/80 to-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sage">{t.dhikrCtaTitle(activeDhikrWindow)}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-sage-deep">{t.dhikrCtaBody(activeDhikrWindow)}</p>
              </div>
              <Button asChild className="shrink-0" size="sm" type="button">
                <Link to="/duas">{t.dhikrCtaAction}</Link>
              </Button>
            </div>
          </Card>
        ) : null}
        </section>

        <Card
          className={cn(
            "overflow-hidden p-4 transition-[border-color,box-shadow] duration-1000 md:col-span-12",
            haidModeActive
              ? "border-blush/20 bg-surface-container-low/70 opacity-80 shadow-none"
              : hasPrayerProgress
                ? "border-sage/70 shadow-[0_0_34px_rgba(139,168,136,0.24)]"
                : "border-surface-container-highest shadow-none",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className={cn("font-serif text-[1.4rem] font-semibold tracking-normal text-sage sm:text-2xl", haidModeActive && "text-muted-foreground")}>{t.prayerCheck}</h3>
            {haidModeActive ? <Badge className="shrink-0 bg-blush/20 text-accent-foreground">{t.haidMode}</Badge> : null}
          </div>

          <div className={cn("mt-3 flex items-center gap-2 rounded-2xl border px-3 py-1.5", haidModeActive ? "border-blush/20 bg-blush/10 text-muted-foreground" : "border-sage/30 bg-sage-pale/70 text-sage-deep")}>
            <Clock className="h-4 w-4 shrink-0" />
            <p className="text-xs font-semibold leading-5">{haidModeActive ? t.prayerPaused : prayerReminder}</p>
          </div>

          {haidModeActive ? (
            <Button asChild className="mt-3" size="sm" type="button" variant="outline">
              <Link to="/cycle">{t.manageCycle}</Link>
            </Button>
          ) : null}

          <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
            {prayers.map((prayer) => {
              const isCompleted = completedPrayers.includes(prayer.label)
              const isAvailable = timeToMinutes(prayer.start) <= nowMinutes
              const isFuture = !isAvailable
              const isCurrent = currentPrayer?.label === prayer.label
              const isDisabled = haidModeActive || (isFuture && !isCompleted)
              return (
                <PressAction
                  key={prayer.label}
                  ariaLabel={
                    isCompleted
                      ? t.prayerDone(prayer.label)
                      : isFuture
                        ? t.prayerFuture(prayer.label, prayer.start)
                        : t.prayerMark(prayer.label)
                  }
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1.5 transition",
                    isDisabled && "cursor-not-allowed opacity-45 grayscale",
                  )}
                  disabled={isDisabled}
                  onLongPress={() => {
                    if (isCompleted) {
                      uncompletePrayer(prayer.label)
                    }
                  }}
                  onPress={() => completePrayer(prayer.label)}
                >
                  <span className="relative flex w-full justify-center">
                    <span
                      className={cn(
                        "flex aspect-square w-full max-w-[50px] items-center justify-center rounded-full border bg-surface text-muted-foreground shadow-[0_10px_28px_rgb(0,0,0,0.04)] transition sm:max-w-[56px]",
                        isCompleted ? "border-sage bg-sage text-white" : "border-surface-container-highest",
                        isCurrent && !isCompleted && !haidModeActive && "border-sage/80 text-sage shadow-[0_0_26px_rgba(139,168,136,0.2)]",
                        isFuture && "border-surface-container-highest bg-surface-container text-muted-foreground/50",
                        haidModeActive && "border-muted bg-muted/60 text-muted-foreground shadow-none",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : isFuture ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <span className="h-5 w-5 rounded-full border-[3px] border-foreground/20" />
                      )}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "truncate text-center text-xs font-bold tracking-wide text-muted-foreground sm:text-sm",
                      isCompleted && "text-sage",
                    )}
                  >
                    {prayer.label}
                  </span>
                </PressAction>
              )
            })}
          </div>

          <div className="my-4 h-px bg-surface-container-highest" />

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <div className="mr-1 flex shrink-0 items-center gap-2 text-sage">
              <Button aria-label={t.options} className="h-8 w-8 text-sage" onClick={onOpenSunnahSettings} size="icon" type="button" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
              <h4 className="text-base font-bold tracking-wide">{t.sunnah}</h4>
            </div>
            {settings.sunnahPrayers.map((prayer) => {
              const isSelected = selectedSunnah.includes(prayer)

              return (
                <button
                  key={prayer}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl border border-sage/30 bg-sage-pale/70 px-3 py-2 text-sm font-bold text-sage-deep transition",
                    isSelected && "border-sage bg-sage text-white",
                    haidModeActive && "cursor-not-allowed border-muted bg-muted/60 text-muted-foreground opacity-55 grayscale",
                  )}
                  disabled={haidModeActive}
                  onClick={() => toggleSunnah(prayer)}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border-2 border-current",
                      isSelected && "bg-white text-sage",
                    )}
                  >
                    <Plus className="h-3 w-3" />
                  </span>
                  {prayer}
                </button>
              )
            })}
          </div>
        </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-12">
          <Card className="overflow-hidden p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sage">
                  <BookOpen className="h-4 w-4" />
                  {t.quran}
                </div>
                <h3 className="mt-1 truncate font-serif text-xl font-semibold leading-tight text-primary">
                  {quranProgress.surah_name}, Ayah {quranProgress.ayah}
                </h3>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {t.quranPage} {quranProgress.page} - {t.quranJuz} {quranProgress.juz}
                </p>
              </div>
              <Button asChild className="shrink-0" size="sm" type="button" variant="outline">
                <Link to="/quran">{t.quranContinue}</Link>
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                <span className="text-muted-foreground">{t.quranToday}</span>
                <button aria-label={t.editQuranTarget} className="rounded-lg px-2 py-1 text-primary transition hover:bg-sage-pale/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setQuranTargetOpen(true)} type="button">
                  {quranProgress.pages_read_today} / {quranProgress.daily_goal} {t.quranPages}
                </button>
              </div>
              <Progress className="h-2" value={quranGoalProgress} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[1, 2, 5].map((increment) => (
                <Button key={increment} onClick={() => onQuickLog(increment)} size="sm" type="button" variant="outline">
                  <Plus className="h-4 w-4" />+{increment}
                </Button>
              ))}
              <Button asChild size="sm" type="button" variant="ghost">
                <Link to="/quran">{t.quranCustom}</Link>
              </Button>
            </div>
          </Card>
          {shouldShowQuranEveningNudge(quranProgress) ? (
            <div className="mt-3 rounded-xl border border-sage/20 bg-sage-pale/70 px-4 py-3 text-sm font-semibold text-sage-deep">
              {t.quranNudge}
            </div>
          ) : null}
          {quranTargetOpen ? (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-4 pb-4 sm:items-center sm:pb-0">
              <form className="w-full max-w-sm rounded-2xl border border-sage/20 bg-card p-5 text-card-foreground shadow-2xl" onSubmit={saveQuranTarget}>
                <h3 className="font-serif text-2xl font-semibold text-primary">{t.quranTarget}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.quranTargetHelp}</p>
                <label className="mt-4 block text-sm font-semibold text-muted-foreground">
                  {t.quranPages}
                  <input autoFocus className="mt-2 h-11 w-full rounded-xl border border-sage/20 bg-background px-3 text-base font-bold text-foreground outline-none focus:border-sage" inputMode="numeric" max={30} min={1} onChange={(event) => setQuranTargetInput(event.target.value)} type="number" value={quranTargetInput} />
                </label>
                <div className="mt-5 flex justify-end gap-2">
                  <Button onClick={() => setQuranTargetOpen(false)} type="button" variant="ghost">{t.cancel}</Button>
                  <Button type="submit">{t.save}</Button>
                </div>
              </form>
            </div>
          ) : null}
        </div>

        <Card className="relative overflow-hidden p-4 md:col-span-8">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-sky-pale/30" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="font-serif text-2xl font-medium text-primary">{t.dailyHabits}</h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {completedHabits} of {habits.length} {t.completed}
              </p>
            </div>
            <Button aria-label={t.manageHabits} className="text-sage" onClick={onOpenHabitSettings} size="icon" variant="ghost">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative z-10 mt-4 rounded-2xl border border-sage/15 bg-surface-container-low/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                {activeHabitPhase === "night" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>{t.now}</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t.phaseDone(completedHabitSummaries.length, habitSummaries.length)}
              </span>
            </div>
            <Progress value={activeProgress} />
          </div>

          <div className="relative z-10 mt-4 flex flex-col gap-3">
            <section className="rounded-2xl border border-sage/25 bg-card p-3">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  {activeHabitPhase === "night" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                  <h4 className="text-sm font-bold text-foreground">{t.now}</h4>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {activeHabits.length}
                </span>
              </div>
              <ul className="flex flex-col gap-2">{activeHabits.map(renderHabitItem)}</ul>
            </section>
            {upcomingHabits.length > 0 ? (
              <section className="rounded-2xl border border-sage/10 bg-card p-3">
                <h4 className="mb-2 px-1 text-sm font-bold text-foreground">{t.upcoming}</h4>
                <ul className="flex flex-col gap-2">{upcomingHabits.map(renderHabitItem)}</ul>
              </section>
            ) : null}
            {missedHabits.length > 0 ? (
              <section className="rounded-2xl border border-sage/10 bg-card p-3">
                <h4 className="mb-2 px-1 text-sm font-bold text-foreground">{t.missed}</h4>
                <ul className="flex flex-col gap-2">{missedHabits.map(renderHabitItem)}</ul>
              </section>
            ) : null}
            {completedHabitSummaries.length > 0 ? (
              <section className="rounded-2xl border border-sage/10 bg-card p-3">
                <h4 className="mb-2 px-1 text-sm font-bold text-foreground">{t.completedStatus}</h4>
                <ul className="flex flex-col gap-2">{completedHabitSummaries.map(renderHabitItem)}</ul>
              </section>
            ) : null}
          </div>
        </Card>

        <Card className="relative overflow-hidden p-4 text-center md:col-span-4">
          <div className="absolute inset-0 bg-gradient-to-br from-blush/20 to-transparent" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blush-pale text-accent-foreground shadow-glow">
              <Sparkles className="h-8 w-8 fill-current" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-accent-foreground">{t.cyclePhase}</h3>
            {cyclePrivate ? (
              <button
                className="mt-1 rounded-xl px-3 py-2 text-lg font-semibold leading-8 text-muted-foreground transition hover:bg-blush/10"
                onClick={() => setCycleRevealed(true)}
                type="button"
              >
                Health data hidden. Tap to reveal.
              </button>
            ) : (
              <p className="mt-1 text-lg leading-8 text-muted-foreground">
                {cycleSummary.phase
                  ? `${cycleSummary.phase} Day ${cycleSummary.dayInCycle}`
                  : t.follicular}
              </p>
            )}
            <Button asChild className="mt-6" variant="outline">
              <Link to="/cycle">{t.logSymptoms}</Link>
            </Button>
          </div>
        </Card>

        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-6 md:col-span-12">
          <Quote className="absolute bottom-2 right-2 h-24 w-24 text-primary/10" />
          <p className="relative z-10 font-serif text-3xl font-medium leading-tight text-primary">
            “Verily, with hardship comes ease.”
          </p>
          <p className="relative z-10 mt-3 text-sm font-semibold text-primary/70">Quran 94:5</p>
        </div>
      </section>
    </div>
  )
}
