import { create } from "zustand"

import {
  type AppLanguage,
  type AppSettings,
  type AppTheme,
  type HabitDefinition,
  type HabitTiming,
  type HijriOffset,
  type PrayerAnchor,
  loadAppSettings,
  saveAppSettings,
} from "@/lib/app-settings"
import {
  endPeriod,
  loadCycleState,
  saveCycleRange,
  saveCycleState,
  setCycleQadhaStatus,
  startPeriod,
  toggleCyclePrivacy,
  toggleCycleSymptom,
  type CycleState,
} from "@/lib/cycle-progress"
import {
  addQadhaDebt,
  loadFastingState,
  markQadhaPaid,
  saveFastingState,
  toggleSahurReminder,
  type FastingState,
} from "@/lib/fasting-progress"
import {
  loadQuranProgress,
  saveQuranProgress,
  setProgressToPage,
  updateProgress,
  updateQuranDailyGoal,
  type QuranProgressState,
} from "@/lib/quran-progress"

export type QuranBurst = { type: "juz"; juz: number } | { type: "goal" }

type StoreState = {
  settings: AppSettings
  quranProgress: QuranProgressState
  fastingState: FastingState
  cycleState: CycleState
  settingsOpen: boolean
  quranBurst: QuranBurst | null
  setSettingsOpen: (open: boolean) => void
  dismissQuranBurst: () => void
  setLanguage: (language: AppLanguage) => void
  setTheme: (theme: AppTheme) => void
  setHijriOffset: (offset: HijriOffset) => void
  addHabit: () => void
  updateHabit: (id: string, patch: Partial<HabitDefinition>) => void
  deleteHabit: (id: string) => void
  setHabitFrequency: (id: string, plannedDays: boolean[]) => void
  quickLogQuran: (increment: number) => void
  setQuranPage: (page: number) => void
  setQuranDailyGoal: (goal: number) => void
  addQadhaDebt: (days?: number) => void
  markQadhaPaid: () => void
  toggleSahurReminder: (dateKey: string) => void
  startPeriod: (date?: string) => void
  endPeriod: (date?: string) => void
  saveCycleRange: (input: { startDate: string; endDate: string }) => void
  confirmCycleQadha: (logId: string) => void
  ignoreCycleQadha: (logId: string) => void
  toggleCyclePrivacy: () => void
  toggleCycleSymptom: (symptomId: string) => void
}

let burstTimer: number | null = null

function persistSettings(settings: AppSettings) {
  saveAppSettings(settings)
  return settings
}

function timingLabel(timing: HabitTiming, fallback: string) {
  if (timing.mode === "fixed") {
    return timing.time || fallback || "Anytime"
  }

  const prefix = timing.offsetMinutes === 0 ? "At" : timing.offsetMinutes > 0 ? `${timing.offsetMinutes} min after` : `${Math.abs(timing.offsetMinutes)} min before`
  return `${prefix} ${timing.prayer}`
}

function makeHabit(): HabitDefinition {
  const timing: HabitTiming = { mode: "fixed", time: "" }
  return {
    id: `habit-${Date.now()}`,
    label: "New Habit",
    category: "Spiritual",
    scheduleLabel: "Anytime",
    plannedDays: [true, true, true, true, true, false, false],
    enabled: true,
    timing,
  }
}

function normalizeHabitPatch(patch: Partial<HabitDefinition>) {
  if (!patch.timing) {
    return patch
  }

  return {
    ...patch,
    scheduleLabel: patch.scheduleLabel ?? timingLabel(patch.timing, ""),
  }
}

function maybeShowQuranBurst(set: (partial: Partial<StoreState>) => void, progress: QuranProgressState) {
  if (burstTimer) {
    window.clearTimeout(burstTimer)
  }

  if (progress.barakah_burst && progress.completed_juz) {
    set({ quranBurst: { type: "juz", juz: progress.completed_juz } })
    burstTimer = window.setTimeout(() => set({ quranBurst: null }), 4200)
    return
  }

  if (progress.goal_burst) {
    set({ quranBurst: { type: "goal" } })
    burstTimer = window.setTimeout(() => set({ quranBurst: null }), 3200)
  }
}

const initialSettings = loadAppSettings()
const initialFastingState = loadFastingState()

export const useAppStore = create<StoreState>((set, get) => ({
  settings: initialSettings,
  quranProgress: loadQuranProgress(initialSettings.language, initialSettings.hijriOffset),
  fastingState: initialFastingState,
  cycleState: loadCycleState(initialFastingState.cycleLogs),
  settingsOpen: false,
  quranBurst: null,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  dismissQuranBurst: () => {
    if (burstTimer) {
      window.clearTimeout(burstTimer)
      burstTimer = null
    }
    set({ quranBurst: null })
  },
  setLanguage: (language) => {
    const current = get()
    const settings = persistSettings({ ...current.settings, language })
    const quranProgress = updateProgress(
      current.quranProgress.last_page_read,
      0,
      current.quranProgress.logs,
      language,
      current.quranProgress.daily_goal,
      settings.hijriOffset,
    )
    saveQuranProgress(quranProgress)
    set({ settings, quranProgress })
  },
  setTheme: (theme) => {
    const settings = persistSettings({ ...get().settings, theme })
    set({ settings })
  },
  setHijriOffset: (hijriOffset) => {
    const current = get()
    const settings = persistSettings({ ...current.settings, hijriOffset })
    const quranProgress = updateProgress(
      current.quranProgress.last_page_read,
      0,
      current.quranProgress.logs,
      settings.language,
      current.quranProgress.daily_goal,
      hijriOffset,
    )
    saveQuranProgress(quranProgress)
    set({ settings, quranProgress })
  },
  addHabit: () => {
    const settings = persistSettings({ ...get().settings, habits: [...get().settings.habits, makeHabit()] })
    set({ settings })
  },
  updateHabit: (id, patch) => {
    const current = get().settings
    const normalizedPatch = normalizeHabitPatch(patch)
    const settings = persistSettings({
      ...current,
      habits: current.habits.map((habit) => (habit.id === id ? { ...habit, ...normalizedPatch } : habit)),
    })
    set({ settings })
  },
  deleteHabit: (id) => {
    const current = get().settings
    const settings = persistSettings({ ...current, habits: current.habits.filter((habit) => habit.id !== id) })
    set({ settings })
  },
  setHabitFrequency: (id, plannedDays) => {
    get().updateHabit(id, { plannedDays: plannedDays.length === 7 ? plannedDays : [true, true, true, true, true, false, false] })
  },
  quickLogQuran: (increment) => {
    const current = get()
    const progress = updateProgress(
      current.quranProgress.last_page_read,
      increment,
      current.quranProgress.logs,
      current.settings.language,
      current.quranProgress.daily_goal,
      current.settings.hijriOffset,
    )
    saveQuranProgress(progress)
    set({ quranProgress: progress })
    maybeShowQuranBurst(set, progress)
  },
  setQuranPage: (page) => {
    const current = get()
    const progress = setProgressToPage(
      current.quranProgress.last_page_read,
      page,
      current.quranProgress.logs,
      current.settings.language,
      current.quranProgress.daily_goal,
      current.settings.hijriOffset,
    )
    saveQuranProgress(progress)
    set({ quranProgress: progress })
    maybeShowQuranBurst(set, progress)
  },
  setQuranDailyGoal: (goal) => {
    const current = get()
    const progress = updateQuranDailyGoal(current.quranProgress, goal, current.settings.language, current.settings.hijriOffset)
    saveQuranProgress(progress)
    set({ quranProgress: progress })
  },
  addQadhaDebt: (days = 1) => {
    const fastingState = addQadhaDebt(get().fastingState, days)
    saveFastingState(fastingState)
    set({ fastingState })
  },
  markQadhaPaid: () => {
    const fastingState = markQadhaPaid(get().fastingState)
    saveFastingState(fastingState)
    set({ fastingState })
  },
  toggleSahurReminder: (dateKey) => {
    const fastingState = toggleSahurReminder(get().fastingState, dateKey)
    saveFastingState(fastingState)
    set({ fastingState })
  },
  startPeriod: (date) => {
    const cycleState = startPeriod(get().cycleState, date)
    saveCycleState(cycleState)
    set({ cycleState })
  },
  endPeriod: (date) => {
    const current = get()
    const cycleState = endPeriod(current.cycleState, current.settings.hijriOffset, date)
    saveCycleState(cycleState)
    set({ cycleState })
  },
  saveCycleRange: (input) => {
    const current = get()
    const cycleState = saveCycleRange(current.cycleState, input, current.settings.hijriOffset)
    saveCycleState(cycleState)
    set({ cycleState })
  },
  confirmCycleQadha: (logId) => {
    const current = get()
    const log = current.cycleState.logs.find((item) => item.id === logId)

    if (!log || log.qadhaUpdateStatus !== "pending") {
      return
    }

    const fastingState = addQadhaDebt(current.fastingState, log.qadhaOverlapDays)
    const cycleState = setCycleQadhaStatus(current.cycleState, logId, "added")
    saveFastingState(fastingState)
    saveCycleState(cycleState)
    set({ fastingState, cycleState })
  },
  ignoreCycleQadha: (logId) => {
    const cycleState = setCycleQadhaStatus(get().cycleState, logId, "ignored")
    saveCycleState(cycleState)
    set({ cycleState })
  },
  toggleCyclePrivacy: () => {
    const cycleState = toggleCyclePrivacy(get().cycleState)
    saveCycleState(cycleState)
    set({ cycleState })
  },
  toggleCycleSymptom: (symptomId) => {
    const cycleState = toggleCycleSymptom(get().cycleState, symptomId)
    saveCycleState(cycleState)
    set({ cycleState })
  },
}))

export function prayerAnchors(): PrayerAnchor[] {
  return ["fajr", "dzuhr", "ashr", "maghrib", "isya"]
}
