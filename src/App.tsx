import { Route, Routes, useLocation } from "react-router-dom"
import { lazy, Suspense, type CSSProperties, useEffect } from "react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { type AppSettings } from "@/lib/app-settings"
import { useAppStore } from "@/stores/app-store"

const AccountSettingsPanel = lazy(() =>
  import("@/components/settings/account-settings-panel").then((module) => ({ default: module.AccountSettingsPanel })),
)
const HabitSettingsPanel = lazy(() =>
  import("@/components/settings/habit-settings-panel").then((module) => ({ default: module.HabitSettingsPanel })),
)
const CyclePage = lazy(() => import("@/pages/cycle"))
const DailyPage = lazy(() => import("@/pages/daily"))
const FastingPage = lazy(() => import("@/pages/fasting"))
const QuranPage = lazy(() => import("@/pages/quran"))

const titles: Record<AppSettings["language"], Record<string, string>> = {
  en: {
    "/": "Amaly",
    "/quran": "Amaly",
    "/fasting": "Amaly",
    "/cycle": "Amaly",
  },
  id: {
    "/": "Amaly",
    "/quran": "Amaly",
    "/fasting": "Amaly",
    "/cycle": "Amaly",
  },
}

const flowerEmojis = ["💐", "🌸", "🌷", "🌹", "🌺", "🌼", "🪷", "🌸", "🌷", "🌹", "🌺", "🌼", "💐", "🪷"]
const flowerConfetti = Array.from({ length: 56 }, (_, index) => ({
  emoji: flowerEmojis[index % flowerEmojis.length],
  left: (index * 37) % 100,
  top: (index * 23) % 100,
  delay: (index % 14) * 42,
  drift: ((index % 9) - 4) * 18,
  fall: 70 + (index % 7) * 18,
  rotate: ((index % 11) - 5) * 18,
  size: index % 4 === 0 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
}))

function AppLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sage/20 border-t-sage" aria-label="Loading" />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const settings = useAppStore((state) => state.settings)
  const user = useAppStore((state) => state.user)
  const profile = useAppStore((state) => state.profile)
  const quranProgress = useAppStore((state) => state.quranProgress)
  const fastingState = useAppStore((state) => state.fastingState)
  const cycleState = useAppStore((state) => state.cycleState)
  const dailyTrackerState = useAppStore((state) => state.dailyTrackerState)
  const activePanel = useAppStore((state) => state.activePanel)
  const quranBurst = useAppStore((state) => state.quranBurst)
  const partnerNotice = useAppStore((state) => state.partnerNotice)
  const initializeAuth = useAppStore((state) => state.initializeAuth)
  const openPanel = useAppStore((state) => state.openPanel)
  const closePanel = useAppStore((state) => state.closePanel)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const setTheme = useAppStore((state) => state.setTheme)
  const dismissQuranBurst = useAppStore((state) => state.dismissQuranBurst)
  const clearPartnerNotice = useAppStore((state) => state.clearPartnerNotice)
  const quickLogQuran = useAppStore((state) => state.quickLogQuran)
  const setQuranPage = useAppStore((state) => state.setQuranPage)
  const setQuranDailyGoal = useAppStore((state) => state.setQuranDailyGoal)
  const setHijriOffset = useAppStore((state) => state.setHijriOffset)
  const addQadhaDebt = useAppStore((state) => state.addQadhaDebt)
  const markQadhaPaid = useAppStore((state) => state.markQadhaPaid)
  const toggleSahurReminder = useAppStore((state) => state.toggleSahurReminder)
  const setPrayerCompleted = useAppStore((state) => state.setPrayerCompleted)
  const toggleSunnahSelection = useAppStore((state) => state.toggleSunnahSelection)
  const setHabitCompleted = useAppStore((state) => state.setHabitCompleted)
  const setHabitsCompleted = useAppStore((state) => state.setHabitsCompleted)
  const startPeriod = useAppStore((state) => state.startPeriod)
  const endPeriod = useAppStore((state) => state.endPeriod)
  const saveCycleRange = useAppStore((state) => state.saveCycleRange)
  const confirmCycleQadha = useAppStore((state) => state.confirmCycleQadha)
  const ignoreCycleQadha = useAppStore((state) => state.ignoreCycleQadha)
  const toggleCyclePrivacy = useAppStore((state) => state.toggleCyclePrivacy)
  const toggleCycleSymptom = useAppStore((state) => state.toggleCycleSymptom)
  const title = titles[settings.language][location.pathname] ?? "Amaly"
  const displayName =
    profile?.displayName ||
    (typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "") ||
    user?.email ||
    ""

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark")
  }, [settings.theme])

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        language={settings.language}
        onOpenAccount={() => openPanel("account")}
        onOpenHabits={() => openPanel("habits")}
        onToggleLanguage={() => setLanguage(settings.language === "en" ? "id" : "en")}
        onToggleTheme={() => setTheme(settings.theme === "dark" ? "day" : "dark")}
        theme={settings.theme}
        title={title}
      />
      <main className="flex-1">
        <Suspense fallback={<AppLoading />}>
          <Routes>
            <Route
              element={
                <DailyPage
                  onOpenSettings={() => openPanel("habits")}
                  onQuickLog={quickLogQuran}
                  onSetQuranPage={setQuranPage}
                  onSetPrayerCompleted={setPrayerCompleted}
                  onToggleSunnahSelection={toggleSunnahSelection}
                  onSetHabitCompleted={setHabitCompleted}
                  onSetHabitsCompleted={setHabitsCompleted}
                  cycleState={cycleState}
                  dailyTrackerState={dailyTrackerState}
                  displayName={displayName}
                  quranProgress={quranProgress}
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
          </Routes>
        </Suspense>
      </main>
      <BottomNav language={settings.language} />
      <Suspense fallback={null}>
        {activePanel === "habits" ? <HabitSettingsPanel onClose={closePanel} open /> : null}
        {activePanel === "account" ? <AccountSettingsPanel onClose={closePanel} open /> : null}
      </Suspense>
      {partnerNotice ? (
        <div className="fixed inset-x-4 top-20 z-[75] mx-auto max-w-sm rounded-2xl border border-sage/20 bg-card p-4 text-card-foreground shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {partnerNotice.type === "quran_goal" ? "Partner Progress" : "Partner Nudge"}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{partnerNotice.message}</p>
          <button className="mt-3 text-sm font-bold text-primary" onClick={clearPartnerNotice} type="button">
            Close
          </button>
        </div>
      ) : null}
      {quranBurst ? (
        <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
          {flowerConfetti.map((flower, index) => (
            <span
              className={`animate-flower-burst fixed ${flower.size}`}
              key={index}
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
