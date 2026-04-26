import { Route, Routes, useLocation } from "react-router-dom"
import { type CSSProperties, useEffect, useState } from "react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { Header } from "@/components/layout/header"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { type AppSettings, type HijriOffset, loadAppSettings, saveAppSettings } from "@/lib/app-settings"
import {
  endPeriod,
  loadCycleState,
  saveCycleRange,
  saveCycleState,
  setCycleQadhaStatus,
  startPeriod,
  toggleCyclePrivacy,
  toggleCycleSymptom,
} from "@/lib/cycle-progress"
import {
  addQadhaDebt,
  loadFastingState,
  markQadhaPaid,
  saveFastingState,
  toggleSahurReminder,
} from "@/lib/fasting-progress"
import { loadQuranProgress, saveQuranProgress, setProgressToPage, updateProgress, updateQuranDailyGoal } from "@/lib/quran-progress"
import CyclePage from "@/pages/cycle"
import DailyPage from "@/pages/daily"
import FastingPage from "@/pages/fasting"
import QuranPage from "@/pages/quran"

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

type QuranBurst = { type: "juz"; juz: number } | { type: "goal" }

export default function App() {
  const location = useLocation()
  const [settings, setSettings] = useState(loadAppSettings)
  const [quranProgress, setQuranProgress] = useState(() => loadQuranProgress(settings.language, settings.hijriOffset))
  const [fastingState, setFastingState] = useState(loadFastingState)
  const [cycleState, setCycleState] = useState(() => loadCycleState(fastingState.cycleLogs))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [quranBurst, setQuranBurst] = useState<QuranBurst | null>(null)
  const title = titles[settings.language][location.pathname] ?? "Amaly"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark")
  }, [settings.theme])

  useEffect(() => {
    setQuranProgress((current) =>
      updateProgress(current.last_page_read, 0, current.logs, settings.language, current.daily_goal, settings.hijriOffset),
    )
  }, [settings.hijriOffset, settings.language])

  function handleSaveSettings(nextSettings: AppSettings) {
    setSettings(nextSettings)
    saveAppSettings(nextSettings)
    setSettingsOpen(false)
  }

  function handleSetHijriOffset(hijriOffset: HijriOffset) {
    setSettings((current) => {
      const next = { ...current, hijriOffset }
      saveAppSettings(next)
      return next
    })
  }

  function handleQuickLog(increment: number) {
    setQuranProgress((current) => {
      const next = updateProgress(
        current.last_page_read,
        increment,
        current.logs,
        settings.language,
        current.daily_goal,
        settings.hijriOffset,
      )
      saveQuranProgress(next)
      if (next.barakah_burst && next.completed_juz) {
        setQuranBurst({ type: "juz", juz: next.completed_juz })
        window.setTimeout(() => setQuranBurst(null), 4200)
      } else if (next.goal_burst) {
        setQuranBurst({ type: "goal" })
        window.setTimeout(() => setQuranBurst(null), 3200)
      }
      return next
    })
  }

  function handleSetQuranPage(page: number) {
    setQuranProgress((current) => {
      const next = setProgressToPage(
        current.last_page_read,
        page,
        current.logs,
        settings.language,
        current.daily_goal,
        settings.hijriOffset,
      )
      saveQuranProgress(next)
      if (next.barakah_burst && next.completed_juz) {
        setQuranBurst({ type: "juz", juz: next.completed_juz })
        window.setTimeout(() => setQuranBurst(null), 4200)
      } else if (next.goal_burst) {
        setQuranBurst({ type: "goal" })
        window.setTimeout(() => setQuranBurst(null), 3200)
      }
      return next
    })
  }

  function handleSetDailyGoal(goal: number) {
    setQuranProgress((current) => {
      const next = updateQuranDailyGoal(current, goal, settings.language, settings.hijriOffset)
      saveQuranProgress(next)
      return next
    })
  }

  function handleAddQadhaDebt(days = 1) {
    setFastingState((current) => {
      const next = addQadhaDebt(current, days)
      saveFastingState(next)
      return next
    })
  }

  function handleMarkQadhaPaid() {
    setFastingState((current) => {
      const next = markQadhaPaid(current)
      saveFastingState(next)
      return next
    })
  }

  function handleToggleSahurReminder(dateKey: string) {
    setFastingState((current) => {
      const next = toggleSahurReminder(current, dateKey)
      saveFastingState(next)
      return next
    })
  }

  function handleStartPeriod(date?: string) {
    setCycleState((current) => {
      const next = startPeriod(current, date)
      saveCycleState(next)
      return next
    })
  }

  function handleEndPeriod(date?: string) {
    setCycleState((current) => {
      const next = endPeriod(current, settings.hijriOffset, date)
      saveCycleState(next)
      return next
    })
  }

  function handleSaveCycleRange(input: { startDate: string; endDate: string }) {
    setCycleState((current) => {
      const next = saveCycleRange(current, input, settings.hijriOffset)
      saveCycleState(next)
      return next
    })
  }

  function handleConfirmCycleQadha(logId: string) {
    const log = cycleState.logs.find((item) => item.id === logId)

    if (!log || log.qadhaUpdateStatus !== "pending") {
      return
    }

    setFastingState((current) => {
      const next = addQadhaDebt(current, log.qadhaOverlapDays)
      saveFastingState(next)
      return next
    })
    setCycleState((current) => {
      const next = setCycleQadhaStatus(current, logId, "added")
      saveCycleState(next)
      return next
    })
  }

  function handleIgnoreCycleQadha(logId: string) {
    setCycleState((current) => {
      const next = setCycleQadhaStatus(current, logId, "ignored")
      saveCycleState(next)
      return next
    })
  }

  function handleToggleCyclePrivacy() {
    setCycleState((current) => {
      const next = toggleCyclePrivacy(current)
      saveCycleState(next)
      return next
    })
  }

  function handleToggleCycleSymptom(symptomId: string) {
    setCycleState((current) => {
      const next = toggleCycleSymptom(current, symptomId)
      saveCycleState(next)
      return next
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header language={settings.language} onOpenSettings={() => setSettingsOpen(true)} title={title} />
      <main className="flex-1">
        <Routes>
          <Route
            element={
              <DailyPage
                onOpenSettings={() => setSettingsOpen(true)}
                onQuickLog={handleQuickLog}
                onSetQuranPage={handleSetQuranPage}
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
                onQuickLog={handleQuickLog}
                onSetDailyGoal={handleSetDailyGoal}
                onSetPage={handleSetQuranPage}
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
                onAddQadhaDebt={handleAddQadhaDebt}
                onMarkQadhaPaid={handleMarkQadhaPaid}
                onSetHijriOffset={handleSetHijriOffset}
                onToggleSahurReminder={handleToggleSahurReminder}
              />
            }
            path="/fasting"
          />
          <Route
            element={
              <CyclePage
                cycleState={cycleState}
                onConfirmCycleQadha={handleConfirmCycleQadha}
                onEndPeriod={handleEndPeriod}
                onIgnoreCycleQadha={handleIgnoreCycleQadha}
                onSaveCycleRange={handleSaveCycleRange}
                onStartPeriod={handleStartPeriod}
                onToggleCyclePrivacy={handleToggleCyclePrivacy}
                onToggleCycleSymptom={handleToggleCycleSymptom}
              />
            }
            path="/cycle"
          />
        </Routes>
      </main>
      <BottomNav language={settings.language} />
      <SettingsPanel
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
        open={settingsOpen}
        settings={settings}
      />
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
            <button className="mt-5 text-sm font-bold text-primary" onClick={() => setQuranBurst(null)} type="button">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
