export const DAILY_TRACKER_STORAGE_KEY = "amaly.daily-tracker.v1"

export type DailyHabitCompletion = {
  completed: boolean
  completedAt: string | null
}

export type DailyTrackerDay = {
  completedPrayers: string[]
  selectedSunnah: string[]
  habitCompletions: Record<string, DailyHabitCompletion>
}

export type DailyTrackerState = {
  days: Record<string, DailyTrackerDay>
}

export const defaultDailyTrackerDay: DailyTrackerDay = {
  completedPrayers: [],
  selectedSunnah: [],
  habitCompletions: {},
}

export const defaultDailyTrackerState: DailyTrackerState = {
  days: {},
}

export function localDailyTrackerKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function normalizeHabitCompletions(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([id, completion]) => {
      if (typeof completion !== "object" || completion === null || Array.isArray(completion)) {
        return [id, { completed: Boolean(completion), completedAt: null }]
      }

      const candidate = completion as Partial<DailyHabitCompletion>
      return [
        id,
        {
          completed: Boolean(candidate.completed),
          completedAt: typeof candidate.completedAt === "string" ? candidate.completedAt : null,
        },
      ]
    }),
  )
}

function normalizeDay(value: unknown): DailyTrackerDay {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...defaultDailyTrackerDay }
  }

  const day = value as Partial<DailyTrackerDay>
  return {
    completedPrayers: normalizeStringList(day.completedPrayers),
    selectedSunnah: normalizeStringList(day.selectedSunnah),
    habitCompletions: normalizeHabitCompletions(day.habitCompletions),
  }
}

export function normalizeDailyTrackerState(value: unknown): DailyTrackerState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return defaultDailyTrackerState
  }

  const candidate = value as Partial<DailyTrackerState>
  if (typeof candidate.days !== "object" || candidate.days === null || Array.isArray(candidate.days)) {
    return defaultDailyTrackerState
  }

  return {
    days: Object.fromEntries(Object.entries(candidate.days).map(([dateKey, day]) => [dateKey, normalizeDay(day)])),
  }
}

export function loadDailyTrackerState(): DailyTrackerState {
  if (typeof window === "undefined") {
    return defaultDailyTrackerState
  }

  try {
    const stored = window.localStorage.getItem(DAILY_TRACKER_STORAGE_KEY)
    return stored ? normalizeDailyTrackerState(JSON.parse(stored)) : defaultDailyTrackerState
  } catch {
    return defaultDailyTrackerState
  }
}

export function saveDailyTrackerState(state: DailyTrackerState) {
  window.localStorage.setItem(DAILY_TRACKER_STORAGE_KEY, JSON.stringify(state))
}

export function getDailyTrackerDay(state: DailyTrackerState, dateKey = localDailyTrackerKey()) {
  return state.days[dateKey] ?? defaultDailyTrackerDay
}

function updateDay(state: DailyTrackerState, dateKey: string, updater: (day: DailyTrackerDay) => DailyTrackerDay): DailyTrackerState {
  const day = getDailyTrackerDay(state, dateKey)
  return {
    ...state,
    days: {
      ...state.days,
      [dateKey]: updater(day),
    },
  }
}

export function setPrayerCompleted(state: DailyTrackerState, dateKey: string, prayer: string, completed: boolean) {
  return updateDay(state, dateKey, (day) => ({
    ...day,
    completedPrayers: completed
      ? Array.from(new Set([...day.completedPrayers, prayer]))
      : day.completedPrayers.filter((item) => item !== prayer),
  }))
}

export function toggleSunnahSelection(state: DailyTrackerState, dateKey: string, prayer: string) {
  return updateDay(state, dateKey, (day) => ({
    ...day,
    selectedSunnah: day.selectedSunnah.includes(prayer)
      ? day.selectedSunnah.filter((item) => item !== prayer)
      : [...day.selectedSunnah, prayer],
  }))
}

export function setHabitCompleted(
  state: DailyTrackerState,
  dateKey: string,
  habitId: string,
  completed: boolean,
  completedAt: string | null,
) {
  return updateDay(state, dateKey, (day) => ({
    ...day,
    habitCompletions: {
      ...day.habitCompletions,
      [habitId]: { completed, completedAt: completed ? completedAt : null },
    },
  }))
}

export function setHabitsCompleted(state: DailyTrackerState, dateKey: string, habitIds: string[], completedAt: string) {
  return updateDay(state, dateKey, (day) => ({
    ...day,
    habitCompletions: {
      ...day.habitCompletions,
      ...Object.fromEntries(habitIds.map((id) => [id, { completed: true, completedAt }])),
    },
  }))
}
