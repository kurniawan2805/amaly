import { Route, Routes, useLocation } from "react-router-dom"
import { lazy, Suspense, type CSSProperties, useEffect, useState } from "react"
import { useShallow } from "zustand/react/shallow"

import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { OfflineIndicator } from "@/components/offline-indicator"
import { AccountSettingsPanel } from "@/components/settings/account-settings-panel"
import { HabitSettingsPanel, type HabitSettingsInitialSection } from "@/components/settings/habit-settings-panel"
import { QuranBookmarkSettingsPanel } from "@/components/settings/quran-bookmark-settings-panel"
import { QuranBurst } from "@/components/quran/quran-burst"
import { type AppSettings } from "@/lib/app-settings"
import { getActiveDhikrWindow } from "@/lib/prayer-windows"
import DuasPage from "@/pages/duas"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"

const CyclePage = lazy(() => import("@/pages/cycle"))
const DailyPage = lazy(() => import("@/pages/daily"))
const FastingPage = lazy(() => import("@/pages/fasting"))
const QuranPage = lazy(() => import("@/pages/quran"))
const QuranReaderPage = lazy(() => import("@/pages/quran-reader"))
const ReportPage = lazy(() => import("@/pages/report"))

const titles: Record<AppSettings["language"], Record<string, string>> = {
  en: {
    "/": "Amaly",
    "/quran": "Amaly",
    "/quran/read": "Amaly",
    "/fasting": "Amaly",
    "/duas": "Amaly",
    "/cycle": "Amaly",
    "/report": "Amaly",
  },
  id: {
    "/": "Amaly",
    "/quran": "Amaly",
    "/quran/read": "Amaly",
    "/fasting": "Amaly",
    "/duas": "Amaly",
    "/cycle": "Amaly",
    "/report": "Amaly",
  },
}

function AppLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  const language = useAppStore((s) => s.settings.language)
  const theme = useAppStore((s) => s.settings.theme)
  const habits = useAppStore((s) => s.settings.habits)
  
  const cycleStateActive = useAppStore((s) => Boolean(s.cycleState.activePeriod))
  
  const initializeAuth = useAppStore((s) => s.initializeAuth)
  const partnerNotice = useAppStore((s) => s.partnerNotice)
  const activePanel = useAppStore((s) => s.activePanel)
  
  const {
    clearPartnerNotice,
    closePanel,
    openPanel,
    setLanguage,
    setTheme,
    setHabitCompleted,
  } = useAppStore(
    useShallow((s) => ({
      clearPartnerNotice: s.clearPartnerNotice,
      closePanel: s.closePanel,
      openPanel: s.openPanel,
      setLanguage: s.setLanguage,
      setTheme: s.setTheme,
      setHabitCompleted: s.setHabitCompleted,
    }))
  )

  const [habitSettingsInitialSection, setHabitSettingsInitialSection] = useState<HabitSettingsInitialSection>("all")
  const location = useLocation()
  const title = titles[language][location.pathname] || "Amaly"
  const focusMode = location.pathname === "/quran/read"
  const now = new Date()
  const dhikrReminderActive = Boolean(getActiveDhikrWindow(now))

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (partnerNotice) {
      const timeout = setTimeout(() => clearPartnerNotice(), 5000)
      return () => clearTimeout(timeout)
    }
  }, [partnerNotice, clearPartnerNotice])

  function openHabitSettings(initialSection: HabitSettingsInitialSection) {
    setHabitSettingsInitialSection(initialSection)
    openPanel("habits")
  }

  function completeDhikrFlow(categoryId: string) {
    const label = categoryId === "morning-dhikr" ? "Morning Dhikr" : categoryId === "evening-dhikr" ? "Evening Dhikr" : null
    const habit = label ? habits.find((item) => item.label === label) : null
    if (!habit) return

    const completedAt = new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date())
    setHabitCompleted(habit.id, true, completedAt)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {focusMode ? null : (
        <Header
          language={language}
          onOpenAccount={() => openPanel("account")}
          onOpenHabits={() => openHabitSettings("all")}
          onToggleLanguage={() => setLanguage(language === "en" ? "id" : "en")}
          onToggleTheme={() => setTheme(theme === "dark" ? "day" : "dark")}
          theme={theme}
          title={title}
        />
      )}
      <main className="flex-1">
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route
              element={
                <DailyPage
                  onOpenHabitSettings={() => openHabitSettings("habits")}
                  onOpenSunnahSettings={() => openHabitSettings("sunnah")}
                />
              }
              path="/"
            />
            <Route
              element={<QuranPage />}
              path="/quran"
            />
            <Route
              element={<QuranReaderPage />}
              path="/quran/read"
            />
            <Route
              element={<FastingPage />}
              path="/fasting"
            />
            <Route
              element={<DuasPage language={language} onCompleteDhikrFlow={completeDhikrFlow} />}
              path="/duas"
            />
            <Route
              element={<CyclePage />}
              path="/cycle"
            />
            <Route
              element={<ReportPage />}
              path="/report"
            />
          </Routes>
        </Suspense>
      </main>
      {focusMode ? null : <BottomNav cycleModeActive={cycleStateActive} dhikrReminderActive={dhikrReminderActive} language={language} />}
      <OfflineIndicator />
      <Suspense fallback={null}>
        {activePanel === "habits" ? <HabitSettingsPanel initialSection={habitSettingsInitialSection} onClose={closePanel} open /> : null}
        {activePanel === "quran-marks" ? <QuranBookmarkSettingsPanel onClose={closePanel} open /> : null}
        {activePanel === "account" ? <AccountSettingsPanel onClose={closePanel} open /> : null}
      </Suspense>
      {partnerNotice ? (
        <div className="fixed inset-x-4 top-20 z-[75] mx-auto max-w-sm rounded-2xl border border-sage/20 bg-card p-4 text-card-foreground shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Partner Notice
          </p>
          <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
            {partnerNotice.message}
          </p>
        </div>
      ) : null}
      <QuranBurst />
    </div>
  )
}
