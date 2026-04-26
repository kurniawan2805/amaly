import { dailyHabits } from "@/data/app-data"

export type AppLanguage = "en" | "id"
export type AppTheme = "day" | "dark"
export type HijriOffset = -2 | -1 | 0 | 1 | 2
export type HabitSection = "daily" | "friday"

export type HabitDefinition = {
  id: string
  label: string
  category: string
  scheduleLabel: string
  plannedDays: boolean[]
  enabled: boolean
  section: HabitSection
}

export type AppSettings = {
  language: AppLanguage
  theme: AppTheme
  hijriOffset: HijriOffset
  habits: {
    daily: HabitDefinition[]
    friday: HabitDefinition[]
  }
}

export const APP_SETTINGS_STORAGE_KEY = "amaly.settings.v1"

function slugify(value: string) {
  return value.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "")
}

export const defaultAppSettings: AppSettings = {
  language: "en",
  theme: "day",
  hijriOffset: 0,
  habits: {
    daily: dailyHabits.map((habit, index) => ({
      id: `daily-${slugify(habit.label) || index}`,
      label: habit.label,
      category: "Daily Routine",
      scheduleLabel: index === 0 ? "06:00 AM" : index === 1 ? "07:30 AM" : "Anytime",
      plannedDays: index === 1 ? [true, true, true, true, true, true, true] : [true, true, true, true, true, false, false],
      enabled: true,
      section: "daily",
    })),
    friday: [
      {
        id: "friday-surah-al-kahf",
        label: "Surah Al-Kahf",
        category: "Friday Specials",
        scheduleLabel: "Anytime Friday",
        plannedDays: [false, false, false, false, true, false, false],
        enabled: true,
        section: "friday",
      },
      {
        id: "friday-salawat",
        label: "Salawat",
        category: "Friday Specials",
        scheduleLabel: "Evening",
        plannedDays: [false, false, false, false, true, false, false],
        enabled: true,
        section: "friday",
      },
    ],
  },
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

function normalizeHabit(value: Partial<HabitDefinition>, fallback: HabitDefinition): HabitDefinition {
  return {
    id: typeof value.id === "string" && value.id ? value.id : fallback.id,
    label: typeof value.label === "string" && value.label ? value.label : fallback.label,
    category: typeof value.category === "string" ? value.category : fallback.category,
    scheduleLabel: typeof value.scheduleLabel === "string" ? value.scheduleLabel : fallback.scheduleLabel,
    plannedDays:
      Array.isArray(value.plannedDays) && value.plannedDays.length === 7
        ? value.plannedDays.map(Boolean)
        : fallback.plannedDays,
    enabled: typeof value.enabled === "boolean" ? value.enabled : fallback.enabled,
    section: value.section === "friday" || value.section === "daily" ? value.section : fallback.section,
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
      habits: {
        daily: normalizeHabits(parsed.habits?.daily, defaultAppSettings.habits.daily).map((habit) => ({
          ...habit,
          section: "daily",
        })),
        friday: normalizeHabits(parsed.habits?.friday, defaultAppSettings.habits.friday).map((habit) => ({
          ...habit,
          section: "friday",
        })),
      },
    }
  } catch {
    return defaultAppSettings
  }
}

export function saveAppSettings(settings: AppSettings) {
  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}
