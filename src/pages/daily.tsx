import { BookOpen, Check, ChevronDown, Clock, Lock, MoreHorizontal, Moon, Plus, Quote, Settings, Sparkles, Sun } from "lucide-react"
import { CSSProperties, PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { PartnerWidget } from "@/components/partner/partner-widget"
import { QuickLogButtons } from "@/components/quran/quick-log-buttons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AppSettings, HabitDefinition, PrayerAnchor } from "@/lib/app-settings"
import { type CycleState, getCycleSummary } from "@/lib/cycle-progress"
import { getDailyTrackerDay, localDailyTrackerKey, type DailyTrackerState } from "@/lib/daily-tracker"
import { formatHijriDate } from "@/lib/hijri-date"
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

const prayers = [
  { label: "Fajr", start: "04:00", end: "06:00" },
  { label: "Dzuhr", start: "11:45", end: "15:00" },
  { label: "Ashr", start: "15:00", end: "17:45" },
  { label: "Maghrib", start: "17:45", end: "19:30" },
  { label: "Isya", start: "19:00", end: "23:59" },
]
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

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function getNowMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
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

function getHabitPhase(habit: Habit, activePhase: "morning" | "night") {
  if (habit.timing.mode !== "prayer") {
    return activePhase
  }

  return habit.timing.prayer === "fajr" || habit.timing.prayer === "dzuhr" ? "morning" : "night"
}

function getHabitSortValue(habit: Habit, activePhase: "morning" | "night", currentPrayer: string | null) {
  if (habit.timing.mode !== "prayer") {
    return activePhase === "night" ? timeToMinutes("15:00") : 0
  }

  const anchorLabel = habit.timing.prayer
  const boost = currentPrayer?.toLowerCase() === anchorLabel ? -1000 : 0
  return prayerToMinutes(anchorLabel) + habit.timing.offsetMinutes + boost
}

function formatTime(date: Date, language: AppSettings["language"]) {
  return new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatAnchor(prayer: PrayerAnchor) {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1)
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
  },
  id: {
    morning: (name: string) => `Ahlan, ${name || "sahabat"}`,
    intro: "Nikmati ketenangan hari ini. Perjalanan ibadahmu menanti.",
    prayerCheck: "Cek Shalat",
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

type DailyPageProps = {
  settings: AppSettings
  cycleState: CycleState
  dailyTrackerState: DailyTrackerState
  displayName?: string
  quranProgress: QuranProgressState
  onQuickLog: (increment: number) => void
  onSetQuranPage: (page: number) => void
  onSetPrayerCompleted: (prayer: string, completed: boolean, dateKey?: string) => void
  onToggleSunnahSelection: (prayer: string, dateKey?: string) => void
  onSetHabitCompleted: (habitId: string, completed: boolean, completedAt: string | null, dateKey?: string) => void
  onSetHabitsCompleted: (habitIds: string[], completedAt: string, dateKey?: string) => void
  onOpenSettings: () => void
}

export default function DailyPage({
  settings,
  cycleState,
  dailyTrackerState,
  displayName = "",
  quranProgress,
  onQuickLog,
  onSetQuranPage,
  onSetPrayerCompleted,
  onToggleSunnahSelection,
  onSetHabitCompleted,
  onSetHabitsCompleted,
  onOpenSettings,
}: DailyPageProps) {
  const [flowerBursts, setFlowerBursts] = useState<FlowerBurst[]>([])
  const [cycleRevealed, setCycleRevealed] = useState(false)
  const [now, setNow] = useState(() => new Date())
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
          completed: Boolean(completion?.completed),
          completedAt: completion?.completedAt ?? null,
        }
      }),
    [todayTracker.habitCompletions, visibleHabitDefinitions],
  )

  const completedHabits = useMemo(() => habits.filter((habit) => habit.completed).length, [habits])
  const hasPrayerProgress = completedPrayers.length > 0
  const nowMinutes = getNowMinutes(now)
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
  const morningHabits = useMemo(
    () =>
      habits
        .filter((habit) => getHabitPhase(habit, activeHabitPhase) === "morning")
        .sort((a, b) => getHabitSortValue(a, activeHabitPhase, currentPrayer?.label ?? null) - getHabitSortValue(b, activeHabitPhase, currentPrayer?.label ?? null)),
    [activeHabitPhase, currentPrayer?.label, habits],
  )
  const nightHabits = useMemo(
    () =>
      habits
        .filter((habit) => getHabitPhase(habit, activeHabitPhase) === "night")
        .sort((a, b) => getHabitSortValue(a, activeHabitPhase, currentPrayer?.label ?? null) - getHabitSortValue(b, activeHabitPhase, currentPrayer?.label ?? null)),
    [activeHabitPhase, currentPrayer?.label, habits],
  )
  const activeHabits = activeHabitPhase === "night" ? nightHabits : morningHabits
  const earlierHabits = activeHabitPhase === "night" ? morningHabits : []
  const activeCompletedHabits = activeHabits.filter((habit) => habit.completed).length
  const earlierCompletedHabits = earlierHabits.filter((habit) => habit.completed).length
  const activeProgress = activeHabits.length > 0 ? (activeCompletedHabits / activeHabits.length) * 100 : 0

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  function completeHabit(id: string) {
    onSetHabitCompleted(id, true, formatTime(new Date(), settings.language), todayKey)
  }

  function uncompleteHabit(id: string) {
    onSetHabitCompleted(id, false, null, todayKey)
  }

  function completeHabits(ids: string[]) {
    onSetHabitsCompleted(ids, formatTime(new Date(), settings.language), todayKey)
  }

  function habitTimeLabel(habit: Habit) {
    if (habit.completed && habit.completedAt) {
      return t.doneAt(habit.completedAt)
    }

    if (habit.timing.mode !== "prayer") {
      return t.anytimeActive
    }

    const anchor = formatAnchor(habit.timing.prayer)
    if (habit.timing.offsetMinutes > 0) {
      return t.upcomingAfter(anchor)
    }

    if (habit.timing.offsetMinutes < 0) {
      return t.upcomingBefore(anchor)
    }

    return t.upcomingDuring(anchor)
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

  function renderHabitItem(habit: Habit) {
    const isCurrentAnchor = habit.timing.mode === "prayer" && currentPrayer?.label.toLowerCase() === habit.timing.prayer

    return (
      <li
        key={habit.id}
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-sage/10 bg-card px-3 py-3 transition hover:border-sage/20 hover:bg-surface-container-low/70",
          isCurrentAnchor && !habit.completed && "border-sage/45 bg-sage-pale/35 dark:bg-sage/10",
        )}
      >
        <HabitMark habit={habit} />
        <div className="min-w-0 flex-1">
          <PressAction
            ariaLabel={
              habit.completed
                ? `${habit.label} ${t.completed}. Long press to uncheck.`
                : `Mark ${habit.label} ${t.completed}.`
            }
            className={cn(
              "block min-w-0 text-left transition",
              habit.completed ? "text-foreground/60 line-through" : "text-foreground",
            )}
            onLongPress={() => uncompleteHabit(habit.id)}
            onPress={() => completeHabit(habit.id)}
          >
            <span className="block truncate text-sm font-bold">{habit.label}</span>
            <span className="block truncate text-xs font-semibold text-muted-foreground">{habitTimeLabel(habit)}</span>
          </PressAction>
        </div>
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
        </section>

        <Card
          className={cn(
            "overflow-hidden p-4 transition-[border-color,box-shadow] duration-1000 md:col-span-12",
            hasPrayerProgress
              ? "border-sage/70 shadow-[0_0_34px_rgba(139,168,136,0.24)]"
              : "border-surface-container-highest shadow-none",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-[1.4rem] font-semibold tracking-normal text-sage sm:text-2xl">{t.prayerCheck}</h3>
            <Button aria-label={t.options} className="text-sage" onClick={onOpenSettings} size="icon" type="button" variant="ghost">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-sage/30 bg-sage-pale/70 px-3 py-1.5 text-sage-deep">
            <Clock className="h-4 w-4 shrink-0" />
            <p className="text-xs font-semibold leading-5">{prayerReminder}</p>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
            {prayers.map((prayer) => {
              const isCompleted = completedPrayers.includes(prayer.label)
              const isAvailable = timeToMinutes(prayer.start) <= nowMinutes
              const isFuture = !isAvailable
              const isCurrent = currentPrayer?.label === prayer.label
              const isDisabled = isFuture && !isCompleted
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
                    isDisabled && "cursor-not-allowed opacity-55",
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
                        isCurrent && !isCompleted && "border-sage/80 text-sage shadow-[0_0_26px_rgba(139,168,136,0.2)]",
                        isFuture && "border-surface-container-highest bg-surface-container text-muted-foreground/50",
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
              <Settings className="h-4 w-4" />
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
                  )}
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
          <QuickLogButtons
            language={settings.language}
            onQuickLog={onQuickLog}
            onSetPage={onSetQuranPage}
            progress={quranProgress}
          />
          {shouldShowQuranEveningNudge(quranProgress) ? (
            <div className="mt-3 rounded-xl border border-sage/20 bg-sage-pale/70 px-4 py-3 text-sm font-semibold text-sage-deep">
              {t.quranNudge}
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
            <Button aria-label={t.manageHabits} className="text-sage" onClick={onOpenSettings} size="icon" variant="ghost">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative z-10 mt-6 rounded-2xl border border-sage/15 bg-surface-container-low/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                {activeHabitPhase === "night" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>{activeHabitPhase === "night" ? t.nightPhase : t.morningComplete}</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t.phaseDone(activeCompletedHabits, activeHabits.length)}
              </span>
            </div>
            <Progress value={activeProgress} />
          </div>

          <div className="relative z-10 mt-5 flex flex-col gap-3">
            {earlierHabits.length > 0 ? (
              <details className="group rounded-2xl border border-sage/10 bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.earlierToday}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {t.phaseDone(earlierCompletedHabits, earlierHabits.length)}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
                </summary>
                <div className="border-t border-sage/10 p-3">
                  <Button
                    className="mb-3 w-full"
                    onClick={() => completeHabits(earlierHabits.map((habit) => habit.id))}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Sun className="h-4 w-4" />
                    {t.logAllMorning}
                  </Button>
                  <ul className="flex flex-col gap-2">{earlierHabits.map(renderHabitItem)}</ul>
                </div>
              </details>
            ) : null}

            <section
              className={cn(
                "rounded-2xl border bg-card p-3",
                activeHabitPhase === "night" ? "border-sage/25 shadow-[0_0_24px_rgba(88,112,83,0.1)]" : "border-sage/10",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  {activeHabitPhase === "night" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                  <h4 className="text-sm font-bold text-foreground">
                    {activeHabitPhase === "night" ? t.eveningNight : t.dailyHabits}
                  </h4>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {t.phaseDone(activeCompletedHabits, activeHabits.length)}
                </span>
              </div>
              <ul className="flex flex-col gap-2">{activeHabits.map(renderHabitItem)}</ul>
            </section>
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
