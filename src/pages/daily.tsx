import { BookOpen, Check, Clock, Lock, MoreHorizontal, Moon, Play, Plus, Quote, Settings, Sparkles, Sun } from "lucide-react"
import { CSSProperties, PointerEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { PartnerWidget } from "@/components/partner/partner-widget"
import { QuickLogButtons } from "@/components/quran/quick-log-buttons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AppSettings, HabitDefinition } from "@/lib/app-settings"
import { type CycleState, getCycleSummary } from "@/lib/cycle-progress"
import { formatHijriDate } from "@/lib/hijri-date"
import { shouldShowQuranEveningNudge, type QuranProgressState } from "@/lib/quran-progress"
import { cn } from "@/lib/utils"

type Habit = {
  id: string
  label: string
  scheduleLabel: string
  plannedDays: boolean[]
  completed: boolean
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
const sunnahPrayers = ["Tahajjud", "Duha", "Rawatib"]
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
    scheduleLabel: habit.scheduleLabel,
    plannedDays: habit.plannedDays,
    completed: false,
  }
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

function FrequencyDots({ plannedDays }: { plannedDays: boolean[] }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
      {plannedDays.map((active, index) => (
        <span
          className={active ? "h-2 w-2 rounded-full bg-sage-deep" : "h-2 w-2 rounded-full bg-surface-container-highest"}
          key={index}
        />
      ))}
    </div>
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
    completed: "completed",
    manageHabits: "Manage daily habits",
    cyclePhase: "Cycle Phase",
    follicular: "Follicular Day 4",
    logSymptoms: "Log Symptoms",
    continueReading: "Continue Reading",
    page: "Page",
    juz: "Juz",
    continueQuran: "Continue Quran reading",
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
    completed: "selesai",
    manageHabits: "Atur kebiasaan harian",
    cyclePhase: "Fase Siklus",
    follicular: "Hari Folikular 4",
    logSymptoms: "Catat Gejala",
    continueReading: "Lanjut Membaca",
    page: "Halaman",
    juz: "Juz",
    continueQuran: "Lanjut membaca Quran",
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
  displayName?: string
  quranProgress: QuranProgressState
  onQuickLog: (increment: number) => void
  onSetQuranPage: (page: number) => void
  onOpenSettings: () => void
}

export default function DailyPage({ settings, cycleState, displayName = "", quranProgress, onQuickLog, onSetQuranPage, onOpenSettings }: DailyPageProps) {
  const [habits, setHabits] = useState<Habit[]>(() =>
    settings.habits.filter((habit) => habit.enabled && habit.plannedDays[new Date().getDay()]).map(toHabitState),
  )
  const [completedPrayers, setCompletedPrayers] = useState<string[]>([])
  const [selectedSunnah, setSelectedSunnah] = useState<string[]>([])
  const [flowerBursts, setFlowerBursts] = useState<FlowerBurst[]>([])
  const [cycleRevealed, setCycleRevealed] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const t = copy[settings.language]
  const gregorianDate = formatGregorianDate(now, settings.language)
  const hijriDate = formatHijriDate(now, settings.hijriOffset, settings.language)
  const visibleHabitDefinitions = useMemo(() => {
    const todayIndex = now.getDay()
    return settings.habits.filter((habit) => habit.enabled && habit.plannedDays[todayIndex])
  }, [now, settings.habits])

  const completedHabits = useMemo(() => habits.filter((habit) => habit.completed).length, [habits])
  const progress = habits.length > 0 ? (completedHabits / habits.length) * 100 : 0
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

  useEffect(() => {
    setHabits((current) =>
      visibleHabitDefinitions.map((habit) => {
        const existing = current.find((item) => item.id === habit.id)
        return {
          id: habit.id,
          label: habit.label,
          scheduleLabel: habit.scheduleLabel,
          plannedDays: habit.plannedDays,
          completed: existing?.completed ?? false,
        }
      }),
    )
  }, [visibleHabitDefinitions])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  function completeHabit(id: string) {
    setHabits((current) =>
      current.map((habit) => (habit.id === id ? { ...habit, completed: true } : habit)),
    )
  }

  function uncompleteHabit(id: string) {
    setHabits((current) =>
      current.map((habit) => (habit.id === id ? { ...habit, completed: false } : habit)),
    )
  }

  function completePrayer(prayer: string) {
    if (!availablePrayers.some((item) => item.label === prayer)) {
      return
    }

    setCompletedPrayers((current) => {
      if (current.includes(prayer)) {
        return current
      }

      const burstId = Date.now()
      setFlowerBursts((bursts) => [...bursts, { id: burstId, prayer }])
      window.setTimeout(() => {
        setFlowerBursts((bursts) => bursts.filter((burst) => burst.id !== burstId))
      }, 1800)

      return [...current, prayer]
    })
  }

  function uncompletePrayer(prayer: string) {
    setCompletedPrayers((current) => current.filter((item) => item !== prayer))
  }

  function toggleSunnah(prayer: string) {
    setSelectedSunnah((current) =>
      current.includes(prayer) ? current.filter((item) => item !== prayer) : [...current, prayer],
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-6 pb-32">
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

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-serif text-2xl font-semibold leading-tight text-sage sm:text-3xl">{hijriDate}</span>
          <span className="text-sm font-semibold text-muted-foreground">{gregorianDate}</span>
        </div>
        <h2 className="font-serif text-4xl font-semibold leading-tight text-primary">{t.morning(displayName)}</h2>
        <p className="max-w-lg text-lg leading-8 text-muted-foreground">{t.intro}</p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
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

        <PartnerWidget language={settings.language} />

        <Card
          className={cn(
            "overflow-hidden p-8 transition-[border-color,box-shadow] duration-1000 md:col-span-12",
            hasPrayerProgress
              ? "border-sage/70 shadow-[0_0_34px_rgba(139,168,136,0.24)]"
              : "border-surface-container-highest shadow-none",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-3xl font-semibold tracking-normal text-sage">{t.prayerCheck}</h3>
            <Button aria-label={t.options} className="text-sage" size="icon" variant="ghost">
              <MoreHorizontal className="h-6 w-6" />
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sage/30 bg-sage-pale/70 px-4 py-3 text-sage-deep">
            <Clock className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold leading-6">{prayerReminder}</p>
          </div>

          <div className="mt-10 grid grid-cols-5 gap-3">
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
                    "flex min-w-0 flex-col items-center gap-2 transition",
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
                        "flex aspect-square w-full max-w-[68px] items-center justify-center rounded-full border bg-surface text-muted-foreground shadow-[0_10px_28px_rgb(0,0,0,0.04)] transition",
                        isCompleted ? "border-sage bg-sage text-white" : "border-surface-container-highest",
                        isCurrent && !isCompleted && "border-sage/80 text-sage shadow-[0_0_26px_rgba(139,168,136,0.2)]",
                        isFuture && "border-surface-container-highest bg-surface-container text-muted-foreground/50",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-8 w-8" />
                      ) : isFuture ? (
                        <Lock className="h-6 w-6" />
                      ) : (
                        <span className="h-7 w-7 rounded-full border-[3px] border-foreground/20" />
                      )}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "truncate text-center text-base font-bold tracking-wide text-muted-foreground sm:text-lg",
                      isCompleted && "text-sage",
                    )}
                  >
                    {prayer.label}
                  </span>
                </PressAction>
              )
            })}
          </div>

          <div className="my-10 h-px bg-surface-container-highest" />

          <div className="flex items-center gap-3 text-sage">
            <Settings className="h-6 w-6" />
            <h4 className="text-xl font-bold tracking-wide">{t.sunnah}</h4>
          </div>

          <div className="no-scrollbar mt-5 flex gap-4 overflow-x-auto pb-1">
            {sunnahPrayers.map((prayer) => {
              const isSelected = selectedSunnah.includes(prayer)

              return (
                <button
                  key={prayer}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-2xl border border-sage/30 bg-sage-pale/70 px-6 py-3 text-lg font-medium text-sage-deep transition",
                    isSelected && "border-sage bg-sage text-white",
                  )}
                  onClick={() => toggleSunnah(prayer)}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 border-current",
                      isSelected && "bg-white text-sage",
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  {prayer}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="relative overflow-hidden p-6 md:col-span-8">
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
          <Progress className="relative z-10 mt-6" value={progress} />

          <ul className="relative z-10 mt-5 flex flex-col gap-2">
            {habits.map((habit) => (
              <li
                key={habit.id}
                className="group flex items-center gap-3 rounded-xl border border-sage/10 bg-card px-3 py-3 transition hover:border-sage/20 hover:bg-surface-container-low/70"
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
                    <span className="block truncate text-xs font-semibold text-muted-foreground">{habit.scheduleLabel}</span>
                  </PressAction>
                </div>
                <FrequencyDots plannedDays={habit.plannedDays} />
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
            ))}
          </ul>
        </Card>

        <Card className="relative overflow-hidden p-6 text-center md:col-span-4">
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

        <Card className="flex items-center gap-6 p-6 md:col-span-6">
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sky-pale">
            <img
              alt="Open Quran with prayer beads in soft natural light"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7BepeehezA6SgBvSucN4ycy0k21NIsdEYFO_IejApnpESJHTh9dpENtD3xdpMB-Dl9Y8Au29skhYHIAO6Hpnkj9DqQIXaRjpy0FFtPkgIGNTSkBuTZTqir4TctJsqjFfwkAlye-N65L96KcfOQM-epobATLSFeCIpBskFggoHXBhfr9zDDxFoh5XjCNz3T5GVdb6_pQXCfkRT_dgmJCugB9q6cplv7_UfeBWjOiq3KyB4OCb0tsFnaP8xtbCXcy125FmTG7dJFtY7"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">{t.continueReading}</p>
            <h3 className="mt-1 font-serif text-2xl font-medium text-foreground">{quranProgress.surah_name}</h3>
            <p className="text-muted-foreground">
              {t.page} {quranProgress.page} • {t.juz} {quranProgress.juz} • Ayah {quranProgress.ayah}
            </p>
          </div>
          <Button asChild aria-label={t.continueQuran} size="icon">
            <Link to="/quran">
              <Play className="h-5 w-5 fill-current" />
            </Link>
          </Button>
        </Card>

        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-6 md:col-span-6">
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
