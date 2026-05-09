import { Route, Routes, useLocation } from "react-router-dom"
import { lazy, Suspense, type CSSProperties, useEffect, useState } from "react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { OfflineIndicator } from "@/components/offline-indicator"
import { AccountSettingsPanel } from "@/components/settings/account-settings-panel"
import { HabitSettingsPanel, type HabitSettingsInitialSection } from "@/components/settings/habit-settings-panel"
import { QuranBookmarkSettingsPanel } from "@/components/settings/quran-bookmark-settings-panel"
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
  const settings = useAppStore((s) => s.settings)
  const quranProgress = useAppStore((s) => s.quranProgress)
  const fastingState = useAppStore((s) => s.fastingState)
  const cycleState = useAppStore((s) => s.cycleState)
  const dailyTrackerState = useAppStore((s) => s.dailyTrackerState)
  const initializeAuth = useAppStore((s) => s.initializeAuth)
  const displayName = useAppStore((s) => s.profile?.displayName || "")
  const partnerNotice = useAppStore((s) => s.partnerNotice)
  const clearPartnerNotice = useAppStore((s) => s.clearPartnerNotice)
  const activePanel = useAppStore((s) => s.activePanel)
  const closePanel = useAppStore((s) => s.closePanel)
  const openPanel = useAppStore((s) => s.openPanel)
  const quranBurst = useAppStore((s) => s.quranBurst)
  const dismissQuranBurst = useAppStore((s) => s.dismissQuranBurst)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const setTheme = useAppStore((s) => s.setTheme)
  const quickLogQuran = useAppStore((s) => s.quickLogQuran)
  const setQuranPage = useAppStore((s) => s.setQuranPage)
  const setQuranDailyGoal = useAppStore((s) => s.setQuranDailyGoal)
  const addQadhaDebt = useAppStore((s) => s.addQadhaDebt)
  const markQadhaPaid = useAppStore((s) => s.markQadhaPaid)
  const setHijriOffset = useAppStore((s) => s.setHijriOffset)
  const toggleSahurReminder = useAppStore((s) => s.toggleSahurReminder)
  const setPrayerCompleted = useAppStore((s) => s.setPrayerCompleted)
  const toggleSunnahSelection = useAppStore((s) => s.toggleSunnahSelection)
  const setHabitCompleted = useAppStore((s) => s.setHabitCompleted)
  const startPeriod = useAppStore((s) => s.startPeriod)
  const endPeriod = useAppStore((s) => s.endPeriod)
  const saveCycleRange = useAppStore((s) => s.saveCycleRange)
  const confirmCycleQadha = useAppStore((s) => s.confirmCycleQadha)
  const ignoreCycleQadha = useAppStore((s) => s.ignoreCycleQadha)
  const toggleCyclePrivacy = useAppStore((s) => s.toggleCyclePrivacy)
  const toggleCycleSymptom = useAppStore((s) => s.toggleCycleSymptom)

  const [habitSettingsInitialSection, setHabitSettingsInitialSection] = useState<HabitSettingsInitialSection>("all")
  const location = useLocation()
  const title = titles[settings.language][location.pathname] || "Amaly"
  const focusMode = location.pathname === "/quran/read"
  const now = new Date()
  const dhikrReminderActive = Boolean(getActiveDhikrWindow(now))

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark")
  }, [settings.theme])

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
    const habit = label ? settings.habits.find((item) => item.label === label) : null
    if (!habit) return

    const completedAt = new Intl.DateTimeFormat(settings.language === "id" ? "id-ID" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date())
    setHabitCompleted(habit.id, true, completedAt)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {focusMode ? null : (
        <Header
          language={settings.language}
          onOpenAccount={() => openPanel("account")}
          onOpenHabits={() => openHabitSettings("all")}
          onToggleLanguage={() => setLanguage(settings.language === "en" ? "id" : "en")}
          onToggleTheme={() => setTheme(settings.theme === "dark" ? "day" : "dark")}
          theme={settings.theme}
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
                  onQuickLog={quickLogQuran}
                  onSetQuranDailyGoal={setQuranDailyGoal}
                  onSetPrayerCompleted={setPrayerCompleted}
                  onToggleSunnahSelection={toggleSunnahSelection}
                  onSetHabitCompleted={setHabitCompleted}
                  cycleState={cycleState}
                  dailyTrackerState={dailyTrackerState}
                  displayName={displayName}
                  quranProgress={quranProgress}
                  quranBookmarks={useAppStore((s) => s.quranBookmarks)}
                  settings={settings}
                />
              }
              path="/"
            />
            <Route
              element={
                <QuranPage
                  hijriOffset={settings.hijriOffset}
                  language={settings.language}
                  onQuickLog={quickLogQuran}
                  onSetDailyGoal={setQuranDailyGoal}
                  onSetPage={setQuranPage}
                  progress={quranProgress}
                />
              }
              path="/quran"
            />
            <Route
              element={
                <QuranReaderPage 
                  language={settings.language} 
                  onSetPage={setQuranPage}
                  onUpsertBookmark={useAppStore((s) => s.upsertQuranBookmark)}
                  onRemoveBookmark={useAppStore((s) => s.removeQuranBookmark)}
                  bookmarks={useAppStore((s) => s.quranBookmarks)}
                />
              }
              path="/quran/read"
            />
            <Route
              element={
                <FastingPage
                  fastingState={fastingState}
                  language={settings.language}
                  hijriOffset={settings.hijriOffset}
                  onAddQadhaDebt={addQadhaDebt}
                  onMarkQadhaPaid={markQadhaPaid}
                  onSetHijriOffset={setHijriOffset}
                  onToggleSahurReminder={toggleSahurReminder}
                />
              }
              path="/fasting"
            />
            <Route
              element={<DuasPage language={settings.language} onCompleteDhikrFlow={completeDhikrFlow} />}
              path="/duas"
            />
            <Route
              element={
                <CyclePage
                  cycleState={cycleState}
                  onConfirmCycleQadha={confirmCycleQadha}
                  onEndPeriod={endPeriod}
                  onIgnoreCycleQadha={ignoreCycleQadha}
                  onSaveCycleRange={saveCycleRange}
                  onStartPeriod={startPeriod}
                  onToggleCyclePrivacy={toggleCyclePrivacy}
                  onToggleCycleSymptom={toggleCycleSymptom}
                />
              }
              path="/cycle"
            />
            <Route
              element={
                <ReportPage
                  cycleState={cycleState}
                  dailyTrackerState={dailyTrackerState}
                  fastingState={fastingState}
                  quranProgress={quranProgress}
                  settings={settings}
                />
              }
              path="/report"
            />
          </Routes>
        </Suspense>
      </main>
      {focusMode ? null : <BottomNav cycleModeActive={Boolean(cycleState.activePeriod)} dhikrReminderActive={dhikrReminderActive} language={settings.language} />}
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
      {quranBurst ? (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm transition-opacity duration-1000">
          {flowerConfetti.map((flower, index) => (
            <span
              key={index}
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
          ))}
          <div className="pointer-events-auto fixed inset-x-6 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-sage/20 bg-card p-6 text-center text-card-foreground shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Barakah Burst</p>
            {quranBurst.type === "juz" ? (
              <>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-primary">
                  MashaAllah! You've completed Juz {quranBurst.juz}!
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">May this bring barakah to your day.</p>
              </>
            ) : (
              <>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-primary">MashaAllah! Daily Goal Achieved!</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">A small steady step, beautifully kept.</p>
              </>
            )}
            <button className="mt-5 text-sm font-bold text-primary" onClick={dismissQuranBurst} type="button">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
