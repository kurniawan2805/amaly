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
import {
  acceptPartnerInvite as acceptSupabasePartnerInvite,
  createPartnerInvite as createSupabasePartnerInvite,
  getAuthSnapshot,
  isSupabaseConfigured,
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
  upsertQuranProgress,
  type PartnerInvite,
  type PartnerNotice,
  type PartnerProfile,
  type PartnerSnapshot,
} from "@/lib/supabase-sync"
import { supabase } from "@/lib/supabase"

export type QuranBurst = { type: "juz"; juz: number } | { type: "goal" }

type StoreState = {
  settings: AppSettings
  quranProgress: QuranProgressState
  fastingState: FastingState
  cycleState: CycleState
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
  createPartnerInvite: (role: PartnerRole) => Promise<void>
  acceptPartnerInvite: (code: string, role: PartnerRole) => Promise<void>
  loadPartnerSnapshot: () => Promise<void>
  sendPartnerNudge: () => Promise<void>
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
    if (!email.trim() || !password) {
      set({ authMessage: "Enter an email address first." })
      return
    }

    set({ authLoading: true, authMessage: null })
    try {
      await signInWithEmailPassword(email.trim(), password)
      set({ authLoading: false, authMessage: null })
    } catch (error) {
      set({ authLoading: false, authMessage: error instanceof Error ? error.message : "Could not sign in." })
    }
  },
  signUpWithPassword: async (email, password) => {
    if (!email.trim() || password.length < 6) {
      set({ authMessage: "Use an email and a password with at least 6 characters." })
      return
    }

    set({ authLoading: true, authMessage: null })
    try {
      await signUpWithEmailPassword(email.trim(), password)
      set({ authLoading: false, authMessage: "Account created. Check your email if confirmation is enabled." })
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
      const cloudProgress = await loadOwnQuranProgress(current.user.id, current.settings.language, current.settings.hijriOffset)
      if (!cloudProgress) {
        await upsertQuranProgress(current.quranProgress, current.user.id)
      } else if (
        cloudProgress.last_page_read >= current.quranProgress.last_page_read ||
        cloudProgress.logs.length >= current.quranProgress.logs.length
      ) {
        saveQuranProgress(cloudProgress)
        set({ quranProgress: cloudProgress })
      } else {
        await upsertQuranProgress(current.quranProgress, current.user.id)
      }

      await get().loadPartnerSnapshot()
      set({ syncLoading: false })
    } catch (error) {
      set({ syncLoading: false, syncMessage: error instanceof Error ? error.message : "Could not sync with Supabase." })
    }
  },
  syncQuranProgress: async () => {
    const current = get()
    if (!current.user) return

    try {
      await upsertQuranProgress(current.quranProgress, current.user.id)
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
