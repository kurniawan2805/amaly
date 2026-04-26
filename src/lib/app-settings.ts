import { dailyHabits } from "@/data/app-data"

export type AppLanguage = "en" | "id"
export type AppTheme = "day" | "dark"
export type HijriOffset = -2 | -1 | 0 | 1 | 2
export type PartnerRole = "husband" | "wife"
export type PrayerAnchor = "fajr" | "dzuhr" | "ashr" | "maghrib" | "isya"
export type HabitTiming =
  | { mode: "fixed"; time: string }
  | { mode: "prayer"; prayer: PrayerAnchor; offsetMinutes: number }

export type HabitDefinition = {
  id: string
  label: string
  category: string
  scheduleLabel: string
  plannedDays: boolean[]
  enabled: boolean
  timing: HabitTiming
}

export type AppSettings = {
  language: AppLanguage
  theme: AppTheme
  hijriOffset: HijriOffset
  partnerRole: PartnerRole | null
  shareCycleSupportStatus: boolean
  habits: HabitDefinition[]
}

export const APP_SETTINGS_STORAGE_KEY = "amaly.settings.v1"

function slugify(value: string) {
  return value.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "")
}

export const defaultAppSettings: AppSettings = {
  language: "en",
  theme: "day",
  hijriOffset: 0,
  partnerRole: null,
  shareCycleSupportStatus: false,
  habits: [
    ...dailyHabits.map((habit, index) => ({
      id: `daily-${slugify(habit.label) || index}`,
      label: habit.label,
      category: "Daily Routine",
      scheduleLabel: index === 0 ? "06:00 AM" : index === 1 ? "07:30 AM" : "Anytime",
      plannedDays: index === 1 ? [true, true, true, true, true, true, true] : [true, true, true, true, true, false, false],
      enabled: true,
      timing:
        index === 0
          ? ({ mode: "fixed", time: "06:00" } satisfies HabitTiming)
          : index === 1
            ? ({ mode: "fixed", time: "07:30" } satisfies HabitTiming)
            : ({ mode: "fixed", time: "" } satisfies HabitTiming),
    })),
    {
      id: "friday-surah-al-kahf",
      label: "Surah Al-Kahf",
      category: "Friday Specials",
      scheduleLabel: "Anytime Friday",
      plannedDays: [false, false, false, false, false, true, false],
      enabled: true,
      timing: { mode: "fixed", time: "" },
    },
    {
      id: "friday-salawat",
      label: "Salawat",
      category: "Friday Specials",
      scheduleLabel: "Evening",
      plannedDays: [false, false, false, false, false, true, false],
      enabled: true,
      timing: { mode: "fixed", time: "" },
    },
  ],
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "en" || value === "id"
}

function isAppTheme(value: unknown): value is AppTheme {
  return value === "day" || value === "dark"
}

function isHijriOffset(value: unknown): value is HijriOffset {
  return value === -2 || value === -1 || value === 0 || value === 1 || value === 2
}

function normalizeTiming(value: unknown, fallback: HabitTiming): HabitTiming {
  if (typeof value !== "object" || value === null) {
    return fallback
  }

  const timing = value as Partial<HabitTiming>

  if (timing.mode === "prayer") {
    const prayer = timing.prayer
    return {
      mode: "prayer",
      prayer: prayer === "fajr" || prayer === "dzuhr" || prayer === "ashr" || prayer === "maghrib" || prayer === "isya" ? prayer : "fajr",
      offsetMinutes:
        typeof timing.offsetMinutes === "number" && Number.isFinite(timing.offsetMinutes)
          ? Math.max(-120, Math.min(120, Math.round(timing.offsetMinutes)))
          : 0,
    }
  }

  if (timing.mode === "fixed") {
    return {
      mode: "fixed",
      time: typeof timing.time === "string" ? timing.time : "",
    }
  }

  return fallback
}

function timingFromSchedule(scheduleLabel: string, fallback: HabitTiming): HabitTiming {
  const match = scheduleLabel.match(/(\d{1,2}):(\d{2})/)
  if (!match) {
    return fallback
  }

  let hour = Number(match[1])
  const minute = match[2]
  if (/pm/i.test(scheduleLabel) && hour < 12) hour += 12
  if (/am/i.test(scheduleLabel) && hour === 12) hour = 0

  return { mode: "fixed", time: `${String(hour).padStart(2, "0")}:${minute}` }
}

function normalizeHabit(value: Partial<HabitDefinition>, fallback: HabitDefinition): HabitDefinition {
  const scheduleLabel = typeof value.scheduleLabel === "string" ? value.scheduleLabel : fallback.scheduleLabel
  return {
    id: typeof value.id === "string" && value.id ? value.id : fallback.id,
    label: typeof value.label === "string" && value.label ? value.label : fallback.label,
    category: typeof value.category === "string" ? value.category : fallback.category,
    scheduleLabel,
    plannedDays:
      Array.isArray(value.plannedDays) && value.plannedDays.length === 7
        ? value.plannedDays.map(Boolean)
        : fallback.plannedDays,
    enabled: typeof value.enabled === "boolean" ? value.enabled : fallback.enabled,
    timing: normalizeTiming(value.timing, timingFromSchedule(scheduleLabel, fallback.timing)),
  }
}

function normalizeHabits(value: unknown, fallback: HabitDefinition[]): HabitDefinition[] {
  if (!Array.isArray(value)) {
    return fallback
  }

  return value.map((habit, index) =>
    normalizeHabit(
      typeof habit === "object" && habit !== null ? (habit as Partial<HabitDefinition>) : {},
      fallback[index] ?? fallback[0],
    ),
  )
}

function normalizeHabitCollection(value: unknown): HabitDefinition[] {
  if (Array.isArray(value)) {
    return normalizeHabits(value, defaultAppSettings.habits)
  }

  if (typeof value === "object" && value !== null) {
    const legacy = value as {
      daily?: unknown
      friday?: unknown
    }

    return [
      ...normalizeHabits(legacy.daily, defaultAppSettings.habits.filter((habit) => !habit.id.startsWith("friday-"))),
      ...normalizeHabits(legacy.friday, defaultAppSettings.habits.filter((habit) => habit.id.startsWith("friday-"))).map((habit) => ({
        ...habit,
        plannedDays:
          habit.plannedDays.length === 7 && habit.plannedDays[4] && !habit.plannedDays[5]
            ? [false, false, false, false, false, true, false]
            : habit.plannedDays,
      })),
    ]
  }

  return defaultAppSettings.habits
}

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultAppSettings
  }

  try {
    const stored = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    if (!stored) {
      return defaultAppSettings
    }

    const parsed = JSON.parse(stored) as Partial<AppSettings>

    return {
      language: isAppLanguage(parsed.language) ? parsed.language : defaultAppSettings.language,
      theme: isAppTheme(parsed.theme) ? parsed.theme : defaultAppSettings.theme,
      hijriOffset: isHijriOffset(parsed.hijriOffset) ? parsed.hijriOffset : defaultAppSettings.hijriOffset,
      partnerRole: parsed.partnerRole === "husband" || parsed.partnerRole === "wife" ? parsed.partnerRole : defaultAppSettings.partnerRole,
      shareCycleSupportStatus:
        typeof parsed.shareCycleSupportStatus === "boolean"
          ? parsed.shareCycleSupportStatus
          : defaultAppSettings.shareCycleSupportStatus,
      habits: normalizeHabitCollection(parsed.habits),
    }
  } catch {
    return defaultAppSettings
  }
}

export function saveAppSettings(settings: AppSettings) {
  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}
