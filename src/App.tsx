import { Route, Routes, useLocation } from "react-router-dom"
import { type CSSProperties, useEffect } from "react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { type AppSettings } from "@/lib/app-settings"
import CyclePage from "@/pages/cycle"
import DailyPage from "@/pages/daily"
import FastingPage from "@/pages/fasting"
import QuranPage from "@/pages/quran"
import { useAppStore } from "@/stores/app-store"

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

export default function App() {
  const location = useLocation()
  const settings = useAppStore((state) => state.settings)
  const quranProgress = useAppStore((state) => state.quranProgress)
  const fastingState = useAppStore((state) => state.fastingState)
  const cycleState = useAppStore((state) => state.cycleState)
  const settingsOpen = useAppStore((state) => state.settingsOpen)
  const quranBurst = useAppStore((state) => state.quranBurst)
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen)
  const dismissQuranBurst = useAppStore((state) => state.dismissQuranBurst)
  const quickLogQuran = useAppStore((state) => state.quickLogQuran)
  const setQuranPage = useAppStore((state) => state.setQuranPage)
  const setQuranDailyGoal = useAppStore((state) => state.setQuranDailyGoal)
  const setHijriOffset = useAppStore((state) => state.setHijriOffset)
  const addQadhaDebt = useAppStore((state) => state.addQadhaDebt)
  const markQadhaPaid = useAppStore((state) => state.markQadhaPaid)
  const toggleSahurReminder = useAppStore((state) => state.toggleSahurReminder)
  const startPeriod = useAppStore((state) => state.startPeriod)
  const endPeriod = useAppStore((state) => state.endPeriod)
  const saveCycleRange = useAppStore((state) => state.saveCycleRange)
  const confirmCycleQadha = useAppStore((state) => state.confirmCycleQadha)
  const ignoreCycleQadha = useAppStore((state) => state.ignoreCycleQadha)
  const toggleCyclePrivacy = useAppStore((state) => state.toggleCyclePrivacy)
  const toggleCycleSymptom = useAppStore((state) => state.toggleCycleSymptom)
  const title = titles[settings.language][location.pathname] ?? "Amaly"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark")
  }, [settings.theme])

  return (
    <div className="flex min-h-screen flex-col">
      <Header language={settings.language} onOpenSettings={() => setSettingsOpen(true)} title={title} />
      <main className="flex-1">
        <Routes>
          <Route
            element={
              <DailyPage
                onOpenSettings={() => setSettingsOpen(true)}
                onQuickLog={quickLogQuran}
                onSetQuranPage={setQuranPage}
                cycleState={cycleState}
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
      </main>
      <BottomNav language={settings.language} />
      <SettingsPanel onClose={() => setSettingsOpen(false)} open={settingsOpen} />
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
