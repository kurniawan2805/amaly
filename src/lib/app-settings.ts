import { dailyHabits } from "@/data/app-data"

export type AppLanguage = "en" | "id"
export type AppTheme = "day" | "dark"
export type HijriOffset = -2 | -1 | 0 | 1 | 2
export type PartnerRole = "husband" | "wife"
export type PrayerAnchor = "fajr" | "dzuhr" | "ashr" | "maghrib" | "isya"
export type HabitTiming =
  | { mode: "flexible"; customEnd?: string; customStart?: string }
  | { mode: "fixed_time"; end: string; start: string }
  | { endOffsetMinutes?: number; fallbackEnd: string; fallbackStart: string; mode: "prayer_based_time"; prayer: PrayerAnchor; startOffsetMinutes?: number; untilPrayer?: PrayerAnchor; window?: "untilPrayerEnd" }
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
  sunnahPrayers: string[]
  habits: HabitDefinition[]
}

export const APP_SETTINGS_STORAGE_KEY = "amaly.settings.v1"
export const defaultSunnahPrayers = ["Witr", "Rawatib Fajr", "Dhuha"]

function slugify(value: string) {
  return value.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "")
}

function timingFromHabitSeed(habit: (typeof dailyHabits)[number]): HabitTiming {
  const timing = habit.timing as Partial<HabitTiming> & Record<string, unknown>
  const schedule = habit.scheduleLabel.toLowerCase()
  const offsetMatch = schedule.match(/(\d+)\s*(?:min|menit)/)
  const baseOffset = offsetMatch ? Number(offsetMatch[1]) : 0
  const offsetMinutes = schedule.includes("before") || schedule.includes("sebelum") ? -baseOffset : baseOffset

  if (timing.mode === "flexible") {
    return {
      customEnd: typeof timing.customEnd === "string" ? timing.customEnd : undefined,
      customStart: typeof timing.customStart === "string" ? timing.customStart : undefined,
      mode: "flexible",
    }
  }

  if (timing.mode === "fixed_time") {
    return {
      end: typeof timing.end === "string" ? timing.end : "",
      mode: "fixed_time",
      start: typeof timing.start === "string" ? timing.start : "",
    }
  }

  if (timing.mode === "prayer_based_time") {
    const prayer = timing.prayer
    const untilPrayer = timing.untilPrayer
    return {
      fallbackEnd: typeof timing.fallbackEnd === "string" ? timing.fallbackEnd : "",
      fallbackStart: typeof timing.fallbackStart === "string" ? timing.fallbackStart : "",
      endOffsetMinutes: typeof timing.endOffsetMinutes === "number" && Number.isFinite(timing.endOffsetMinutes) ? Math.round(timing.endOffsetMinutes) : undefined,
      mode: "prayer_based_time",
      prayer: prayer === "fajr" || prayer === "dzuhr" || prayer === "ashr" || prayer === "maghrib" || prayer === "isya" ? prayer : "fajr",
      startOffsetMinutes: typeof timing.startOffsetMinutes === "number" && Number.isFinite(timing.startOffsetMinutes) ? Math.round(timing.startOffsetMinutes) : undefined,
      untilPrayer: untilPrayer === "fajr" || untilPrayer === "dzuhr" || untilPrayer === "ashr" || untilPrayer === "maghrib" || untilPrayer === "isya" ? untilPrayer : undefined,
      window: timing.window === "untilPrayerEnd" ? "untilPrayerEnd" : undefined,
    }
  }

  if (timing.mode === "prayer") {
    return {
      mode: "prayer",
      prayer:
        timing.prayer === "fajr" || timing.prayer === "dzuhr" || timing.prayer === "ashr" || timing.prayer === "maghrib" || timing.prayer === "isya"
          ? timing.prayer
          : "fajr",
      offsetMinutes: typeof timing.offsetMinutes === "number" ? timing.offsetMinutes : 0,
    }
  }

  if (schedule.includes("fajr") || schedule.includes("shubuh") || schedule.includes("subuh")) {
    return { mode: "prayer", prayer: "fajr", offsetMinutes }
  }
  if (schedule.includes("dzuhr") || schedule.includes("dzuhur")) {
    return { mode: "prayer", prayer: "dzuhr", offsetMinutes }
  }
  if (schedule.includes("ashr") || schedule.includes("ashar")) {
    return { mode: "prayer", prayer: "ashr", offsetMinutes }
  }
  if (schedule.includes("maghrib")) return { mode: "prayer", prayer: "maghrib", offsetMinutes }
  if (schedule.includes("isya")) return { mode: "prayer", prayer: "isya", offsetMinutes }

  if (timing.mode === "fixed") {
    return { mode: "fixed", time: typeof timing.time === "string" ? timing.time : "" }
  }

  return { mode: "fixed", time: "" }
}

export const defaultAppSettings: AppSettings = {
  language: "en",
  theme: "day",
  hijriOffset: 0,
  partnerRole: null,
  shareCycleSupportStatus: false,
  sunnahPrayers: defaultSunnahPrayers,
  habits: dailyHabits.map((habit, index) => ({
    id: `habit-${slugify(habit.label) || index}`,
    label: habit.label,
    category: habit.category,
    scheduleLabel: habit.scheduleLabel,
    plannedDays: habit.plannedDays.map(Boolean),
    enabled: true,
    timing: timingFromHabitSeed(habit),
  })),
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

export function normalizeSunnahPrayers(value: unknown) {
  if (!Array.isArray(value)) {
    return defaultSunnahPrayers
  }

  const prayers = Array.from(
    new Set(value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)),
  )
  return prayers.length > 0 ? prayers : defaultSunnahPrayers
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
      sunnahPrayers: normalizeSunnahPrayers(parsed.sunnahPrayers),
      habits: normalizeHabitCollection(parsed.habits),
    }
  } catch {
    return defaultAppSettings
  }
}

export function saveAppSettings(settings: AppSettings) {
  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}
