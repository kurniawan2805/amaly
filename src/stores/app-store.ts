import { create } from "zustand"
import type { Session, User } from "@supabase/supabase-js"

import {
  type AppLanguage,
  type AppSettings,
  type AppTheme,
  type HabitDefinition,
  type HabitTiming,
  type HijriOffset,
  type PartnerRole,
  type PrayerAnchor,
  APP_SETTINGS_STORAGE_KEY,
  loadAppSettings,
  saveAppSettings,
} from "@/lib/app-settings"
import {
  CYCLE_STORAGE_KEY,
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
  DAILY_TRACKER_STORAGE_KEY,
  defaultDailyTrackerState,
  loadDailyTrackerState,
  localDailyTrackerKey,
  saveDailyTrackerState,
  setHabitCompleted as setDailyHabitCompleted,
  setHabitsCompleted as setDailyHabitsCompleted,
  setPrayerCompleted as setDailyPrayerCompleted,
  toggleSunnahSelection as toggleDailySunnahSelection,
  type DailyTrackerState,
} from "@/lib/daily-tracker"
import {
  FASTING_STORAGE_KEY,
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
import {
  acceptPartnerInvite as acceptSupabasePartnerInvite,
  createPartnerInvite as createSupabasePartnerInvite,
  getAuthSnapshot,
  isSupabaseConfigured,
  loadOwnCloudState,
  loadOwnQuranProgress,
  loadOwnProfile,
  loadPartnerSnapshot,
  sendPartnerEvent,
  signInWithEmailPassword,
  signInWithGoogle,
  signUpWithEmailPassword,
  signOutOfSupabase,
  subscribeToPartnerEvents,
  updateOwnDisplayName,
  upsertCloudState,
  upsertQuranProgress,
  type PartnerInvite,
  type PartnerNotice,
  type PartnerProfile,
  type PartnerSnapshot,
} from "@/lib/supabase-sync"
import { supabase } from "@/lib/supabase"

export type QuranBurst = { type: "juz"; juz: number } | { type: "goal" }
export type ActivePanel = "habits" | "account" | null

type StoreState = {
  settings: AppSettings
  quranProgress: QuranProgressState
  fastingState: FastingState
  cycleState: CycleState
  dailyTrackerState: DailyTrackerState
  session: Session | null
  user: User | null
  authLoading: boolean
  syncLoading: boolean
  authMessage: string | null
  syncMessage: string | null
  profile: PartnerProfile | null
  partnerInvite: PartnerInvite | null
  partnerSnapshot: PartnerSnapshot | null
  partnerNotice: PartnerNotice | null
  settingsOpen: boolean
  activePanel: ActivePanel
  quranBurst: QuranBurst | null
  initializeAuth: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  clearPartnerNotice: () => void
  hydrateFromSupabase: () => Promise<void>
  syncQuranProgress: () => Promise<void>
  syncCloudState: () => Promise<void>
  createPartnerInvite: (role: PartnerRole) => Promise<void>
  acceptPartnerInvite: (code: string, role: PartnerRole) => Promise<void>
  loadPartnerSnapshot: () => Promise<void>
  sendPartnerNudge: () => Promise<void>
  setSettingsOpen: (open: boolean) => void
  openPanel: (panel: Exclude<ActivePanel, null>) => void
  closePanel: () => void
  dismissQuranBurst: () => void
  setLanguage: (language: AppLanguage) => void
  setTheme: (theme: AppTheme) => void
  setHijriOffset: (offset: HijriOffset) => void
  addHabit: () => string
  setHabits: (habits: HabitDefinition[]) => void
  updateHabit: (id: string, patch: Partial<HabitDefinition>) => void
  deleteHabit: (id: string) => void
  setHabitFrequency: (id: string, plannedDays: boolean[]) => void
  quickLogQuran: (increment: number) => void
  setQuranPage: (page: number) => void
  setQuranDailyGoal: (goal: number) => void
  addQadhaDebt: (days?: number) => void
  markQadhaPaid: () => void
  toggleSahurReminder: (dateKey: string) => void
  setPrayerCompleted: (prayer: string, completed: boolean, dateKey?: string) => void
  toggleSunnahSelection: (prayer: string, dateKey?: string) => void
  setHabitCompleted: (habitId: string, completed: boolean, completedAt: string | null, dateKey?: string) => void
  setHabitsCompleted: (habitIds: string[], completedAt: string, dateKey?: string) => void
  startPeriod: (date?: string) => void
  endPeriod: (date?: string) => void
  saveCycleRange: (input: { startDate: string; endDate: string }) => void
  confirmCycleQadha: (logId: string) => void
  ignoreCycleQadha: (logId: string) => void
  toggleCyclePrivacy: () => void
  toggleCycleSymptom: (symptomId: string) => void
}

let burstTimer: number | null = null
let authInitialized = false
let partnerEventsChannel: ReturnType<typeof subscribeToPartnerEvents> = null

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

function persistPartnerRole(settings: AppSettings, partnerRole: PartnerRole) {
  return persistSettings({ ...settings, partnerRole })
}

function senderName(user: User | null, profile: PartnerProfile | null) {
  if (profile?.displayName) return profile.displayName
  const metadataName = user?.user_metadata?.display_name
  return typeof metadataName === "string" && metadataName ? metadataName : "Your partner"
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function hasLocalCloudStateSources() {
  if (typeof window === "undefined") {
    return true
  }

  return [APP_SETTINGS_STORAGE_KEY, FASTING_STORAGE_KEY, CYCLE_STORAGE_KEY, DAILY_TRACKER_STORAGE_KEY].some(
    (key) => window.localStorage.getItem(key) !== null,
  )
}

function subscribeForUser(userId: string, set: (partial: Partial<StoreState>) => void) {
  if (partnerEventsChannel && supabase) {
    void supabase.removeChannel(partnerEventsChannel)
  }

  partnerEventsChannel = subscribeToPartnerEvents(userId, (notice) => set({ partnerNotice: notice }))
}

function unsubscribePartnerEvents() {
  if (partnerEventsChannel && supabase) {
    void supabase.removeChannel(partnerEventsChannel)
  }

  partnerEventsChannel = null
}

const initialSettings = loadAppSettings()
const initialFastingState = loadFastingState()

export const useAppStore = create<StoreState>((set, get) => ({
  settings: initialSettings,
  quranProgress: loadQuranProgress(initialSettings.language, initialSettings.hijriOffset),
  fastingState: initialFastingState,
  cycleState: loadCycleState(initialFastingState.cycleLogs),
  dailyTrackerState: loadDailyTrackerState(),
  session: null,
  user: null,
  authLoading: isSupabaseConfigured,
  syncLoading: false,
  authMessage: null,
  syncMessage: isSupabaseConfigured ? null : "Cloud sync unavailable. Add Supabase env values to enable it.",
  profile: null,
  partnerInvite: null,
  partnerSnapshot: null,
  partnerNotice: null,
  settingsOpen: false,
  activePanel: null,
  quranBurst: null,
  initializeAuth: async () => {
    if (authInitialized) {
      return
    }

    authInitialized = true

    if (!isSupabaseConfigured || !supabase) {
      set({
        authLoading: false,
        syncMessage: "Cloud sync unavailable. Add Supabase env values to enable it.",
      })
      return
    }

    try {
      const snapshot = await getAuthSnapshot()
      set({ ...snapshot, authLoading: false })
      if (snapshot.user) {
        subscribeForUser(snapshot.user.id, set)
        const profile = await loadOwnProfile(snapshot.user.id)
        set({ profile })
        await get().hydrateFromSupabase()
      }
    } catch (error) {
      set({ authLoading: false, authMessage: error instanceof Error ? error.message : "Could not initialize Supabase auth." })
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, authLoading: false })
      if (session?.user) {
        subscribeForUser(session.user.id, set)
        void loadOwnProfile(session.user.id).then((profile) => set({ profile }))
        void get().hydrateFromSupabase()
      } else {
        set({ profile: null, partnerInvite: null, partnerSnapshot: null })
        unsubscribePartnerEvents()
      }
    })
  },
  signInWithGoogle: async () => {
    set({ authLoading: true, authMessage: null })
    try {
      await signInWithGoogle()
      set({ authLoading: false })
    } catch (error) {
      set({ authLoading: false, authMessage: error instanceof Error ? error.message : "Could not sign in with Google." })
    }
  },
  signInWithPassword: async (email, password) => {
    if (!isValidEmail(email)) {
      set({ authMessage: "Enter a valid email address." })
      return
    }

    if (!password) {
      set({ authMessage: "Enter your password." })
      return
    }

    set({ authLoading: true, authMessage: null })
    try {
      await signInWithEmailPassword(email.trim(), password)
      set({ authLoading: false, authMessage: "Signed in. Quran sync will run in the background." })
    } catch (error) {
      set({ authLoading: false, authMessage: error instanceof Error ? error.message : "Could not sign in." })
    }
  },
  signUpWithPassword: async (email, password) => {
    if (!isValidEmail(email)) {
      set({ authMessage: "Enter a valid email address." })
      return
    }

    if (password.length < 6) {
      set({ authMessage: "Use a password with at least 6 characters." })
      return
    }

    set({ authLoading: true, authMessage: null })
    try {
      await signUpWithEmailPassword(email.trim(), password)
      set({ authLoading: false, authMessage: "Account created. Check your email to confirm before signing in." })
    } catch (error) {
      set({ authLoading: false, authMessage: error instanceof Error ? error.message : "Could not create account." })
    }
  },
  signOut: async () => {
    set({ authLoading: true, authMessage: null })
    try {
      await signOutOfSupabase()
      set({
        session: null,
        user: null,
        authLoading: false,
        profile: null,
        partnerInvite: null,
        partnerSnapshot: null,
        syncMessage: null,
      })
      unsubscribePartnerEvents()
    } catch (error) {
      set({ authLoading: false, authMessage: error instanceof Error ? error.message : "Could not sign out." })
    }
  },
  updateDisplayName: async (displayName) => {
    const current = get()
    if (!current.user) {
      set({ authMessage: "Sign in before editing your nickname." })
      return
    }

    set({ authLoading: true, authMessage: null })
    try {
      const profile = await updateOwnDisplayName(current.user.id, displayName)
      set({ profile, authLoading: false, authMessage: "Nickname updated." })
    } catch (error) {
      set({ authLoading: false, authMessage: error instanceof Error ? error.message : "Could not update nickname." })
    }
  },
  clearPartnerNotice: () => set({ partnerNotice: null }),
  hydrateFromSupabase: async () => {
    const current = get()
    if (!current.user) return

    set({ syncLoading: true, syncMessage: null })
    try {
      try {
        const cloudState = await loadOwnCloudState(current.user.id)
        if (cloudState?.appSettings && cloudState.fastingState && cloudState.cycleState && !hasLocalCloudStateSources()) {
          saveAppSettings(cloudState.appSettings)
          saveFastingState(cloudState.fastingState)
          saveCycleState(cloudState.cycleState)
          if (cloudState.dailyTrackerState) {
            saveDailyTrackerState(cloudState.dailyTrackerState)
          }
          set({
            settings: cloudState.appSettings,
            fastingState: cloudState.fastingState,
            cycleState: cloudState.cycleState,
            dailyTrackerState: cloudState.dailyTrackerState ?? defaultDailyTrackerState,
          })
        } else {
          await get().syncCloudState()
        }
      } catch (error) {
        set({ syncMessage: error instanceof Error ? error.message : "Could not load app state from Supabase." })
      }

      const synced = get()
      const userId = current.user.id
      const cloudProgress = await loadOwnQuranProgress(userId, synced.settings.language, synced.settings.hijriOffset)
      if (!cloudProgress) {
        await upsertQuranProgress(synced.quranProgress, userId)
      } else if (
        cloudProgress.last_page_read >= synced.quranProgress.last_page_read ||
        cloudProgress.logs.length >= synced.quranProgress.logs.length
      ) {
        saveQuranProgress(cloudProgress)
        set({ quranProgress: cloudProgress })
      } else {
        await upsertQuranProgress(synced.quranProgress, userId)
      }

      await get().loadPartnerSnapshot()
      set({ syncLoading: false })
    } catch (error) {
      set({ syncLoading: false, syncMessage: error instanceof Error ? error.message : "Could not sync with Supabase." })
    }
  },
  syncCloudState: async () => {
    const current = get()
    if (!current.user) return

    try {
      await upsertCloudState(current.user.id, {
        appSettings: current.settings,
        fastingState: current.fastingState,
        cycleState: current.cycleState,
        dailyTrackerState: current.dailyTrackerState,
        dailyQuranGoal: current.quranProgress.daily_goal,
      })
    } catch (error) {
      set({ syncMessage: error instanceof Error ? error.message : "Could not save app state to Supabase." })
    }
  },
  syncQuranProgress: async () => {
    const current = get()
    if (!current.user) return

    try {
      await upsertQuranProgress(current.quranProgress, current.user.id)
      await get().syncCloudState()
      await get().loadPartnerSnapshot()
    } catch (error) {
      set({ syncMessage: error instanceof Error ? error.message : "Could not save Quran progress to Supabase." })
    }
  },
  createPartnerInvite: async (role) => {
    const current = get()
    if (!current.user) {
      set({ syncMessage: "Sign in before creating a partner code." })
      return
    }

    set({ syncLoading: true, syncMessage: null })
    try {
      const invite = await createSupabasePartnerInvite(current.user.id, role)
      const settings = persistPartnerRole(current.settings, role)
      set({ settings, partnerInvite: invite, syncLoading: false, syncMessage: "Partner code created." })
      void get().syncCloudState()
    } catch (error) {
      set({ syncLoading: false, syncMessage: error instanceof Error ? error.message : "Could not create partner code." })
    }
  },
  acceptPartnerInvite: async (code, role) => {
    const current = get()
    if (!current.user) {
      set({ syncMessage: "Sign in before accepting a partner code." })
      return
    }

    set({ syncLoading: true, syncMessage: null })
    try {
      await acceptSupabasePartnerInvite(code.trim(), role)
      const settings = persistPartnerRole(current.settings, role)
      set({ settings, partnerInvite: null })
      void get().syncCloudState()
      await get().loadPartnerSnapshot()
      set({ syncLoading: false, syncMessage: "Partner connected." })
    } catch (error) {
      set({ syncLoading: false, syncMessage: error instanceof Error ? error.message : "Could not accept partner code." })
    }
  },
  loadPartnerSnapshot: async () => {
    const current = get()
    if (!current.user) return

    try {
      const snapshot = await loadPartnerSnapshot(current.user.id, current.settings.language, current.settings.hijriOffset)
      set({ partnerSnapshot: snapshot })
    } catch (error) {
      set({ syncMessage: error instanceof Error ? error.message : "Could not load partner progress." })
    }
  },
  sendPartnerNudge: async () => {
    const current = get()
    const partnerId = current.partnerSnapshot?.profile.id

    if (!current.user || !partnerId) {
      set({ syncMessage: "Connect a partner before sending a nudge." })
      return
    }

    try {
      await sendPartnerEvent(current.user.id, partnerId, "nudge", {
        senderName: senderName(current.user, current.profile),
      })
      set({ syncMessage: "Nudge sent." })
    } catch (error) {
      set({ syncMessage: error instanceof Error ? error.message : "Could not send nudge." })
    }
  },
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  openPanel: (panel) => set({ activePanel: panel, settingsOpen: true }),
  closePanel: () => set({ activePanel: null, settingsOpen: false }),
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
    void get().syncCloudState()
  },
  setTheme: (theme) => {
    const settings = persistSettings({ ...get().settings, theme })
    set({ settings })
    void get().syncCloudState()
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
    void get().syncCloudState()
  },
  addHabit: () => {
    const habit = makeHabit()
    const settings = persistSettings({ ...get().settings, habits: [habit, ...get().settings.habits] })
    set({ settings })
    void get().syncCloudState()
    return habit.id
  },
  setHabits: (habits) => {
    const settings = persistSettings({ ...get().settings, habits })
    set({ settings })
    void get().syncCloudState()
  },
  updateHabit: (id, patch) => {
    const current = get().settings
    const normalizedPatch = normalizeHabitPatch(patch)
    const settings = persistSettings({
      ...current,
      habits: current.habits.map((habit) => (habit.id === id ? { ...habit, ...normalizedPatch } : habit)),
    })
    set({ settings })
    void get().syncCloudState()
  },
  deleteHabit: (id) => {
    const current = get().settings
    const settings = persistSettings({ ...current, habits: current.habits.filter((habit) => habit.id !== id) })
    set({ settings })
    void get().syncCloudState()
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
    void get().syncQuranProgress()
    if (progress.goal_burst && get().user && get().partnerSnapshot) {
      void sendPartnerEvent(get().user!.id, get().partnerSnapshot!.profile.id, "quran_goal", {
        senderName: senderName(get().user, get().profile),
        pagesReadToday: progress.pages_read_today,
        dailyGoal: progress.daily_goal,
      })
    }
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
    void get().syncQuranProgress()
    if (progress.goal_burst && get().user && get().partnerSnapshot) {
      void sendPartnerEvent(get().user!.id, get().partnerSnapshot!.profile.id, "quran_goal", {
        senderName: senderName(get().user, get().profile),
        pagesReadToday: progress.pages_read_today,
        dailyGoal: progress.daily_goal,
      })
    }
  },
  setQuranDailyGoal: (goal) => {
    const current = get()
    const progress = updateQuranDailyGoal(current.quranProgress, goal, current.settings.language, current.settings.hijriOffset)
    saveQuranProgress(progress)
    set({ quranProgress: progress })
    void get().syncQuranProgress()
  },
  addQadhaDebt: (days = 1) => {
    const fastingState = addQadhaDebt(get().fastingState, days)
    saveFastingState(fastingState)
    set({ fastingState })
    void get().syncCloudState()
  },
  markQadhaPaid: () => {
    const fastingState = markQadhaPaid(get().fastingState)
    saveFastingState(fastingState)
    set({ fastingState })
    void get().syncCloudState()
  },
  toggleSahurReminder: (dateKey) => {
    const fastingState = toggleSahurReminder(get().fastingState, dateKey)
    saveFastingState(fastingState)
    set({ fastingState })
    void get().syncCloudState()
  },
  setPrayerCompleted: (prayer, completed, dateKey = localDailyTrackerKey()) => {
    const dailyTrackerState = setDailyPrayerCompleted(get().dailyTrackerState, dateKey, prayer, completed)
    saveDailyTrackerState(dailyTrackerState)
    set({ dailyTrackerState })
    void get().syncCloudState()
  },
  toggleSunnahSelection: (prayer, dateKey = localDailyTrackerKey()) => {
    const dailyTrackerState = toggleDailySunnahSelection(get().dailyTrackerState, dateKey, prayer)
    saveDailyTrackerState(dailyTrackerState)
    set({ dailyTrackerState })
    void get().syncCloudState()
  },
  setHabitCompleted: (habitId, completed, completedAt, dateKey = localDailyTrackerKey()) => {
    const dailyTrackerState = setDailyHabitCompleted(get().dailyTrackerState, dateKey, habitId, completed, completedAt)
    saveDailyTrackerState(dailyTrackerState)
    set({ dailyTrackerState })
    void get().syncCloudState()
  },
  setHabitsCompleted: (habitIds, completedAt, dateKey = localDailyTrackerKey()) => {
    const dailyTrackerState = setDailyHabitsCompleted(get().dailyTrackerState, dateKey, habitIds, completedAt)
    saveDailyTrackerState(dailyTrackerState)
    set({ dailyTrackerState })
    void get().syncCloudState()
  },
  startPeriod: (date) => {
    const cycleState = startPeriod(get().cycleState, date)
    saveCycleState(cycleState)
    set({ cycleState })
    void get().syncCloudState()
  },
  endPeriod: (date) => {
    const current = get()
    const cycleState = endPeriod(current.cycleState, current.settings.hijriOffset, date)
    saveCycleState(cycleState)
    set({ cycleState })
    void get().syncCloudState()
  },
  saveCycleRange: (input) => {
    const current = get()
    const cycleState = saveCycleRange(current.cycleState, input, current.settings.hijriOffset)
    saveCycleState(cycleState)
    set({ cycleState })
    void get().syncCloudState()
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
    void get().syncCloudState()
  },
  ignoreCycleQadha: (logId) => {
    const cycleState = setCycleQadhaStatus(get().cycleState, logId, "ignored")
    saveCycleState(cycleState)
    set({ cycleState })
    void get().syncCloudState()
  },
  toggleCyclePrivacy: () => {
    const cycleState = toggleCyclePrivacy(get().cycleState)
    saveCycleState(cycleState)
    set({ cycleState })
    void get().syncCloudState()
  },
  toggleCycleSymptom: (symptomId) => {
    const cycleState = toggleCycleSymptom(get().cycleState, symptomId)
    saveCycleState(cycleState)
    set({ cycleState })
    void get().syncCloudState()
  },
}))

export function prayerAnchors(): PrayerAnchor[] {
  return ["fajr", "dzuhr", "ashr", "maghrib", "isya"]
}
