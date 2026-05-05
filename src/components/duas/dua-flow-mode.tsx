import { ChevronLeft, ChevronRight, Star, X } from "lucide-react"
import { useEffect, useRef, useState, type PointerEvent } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { duaFootnotes, type DuaItem } from "@/data/duas"
import type { AppLanguage } from "@/lib/app-settings"
import type { DuaArabicSize } from "@/lib/dua-display-settings"
import { clearDuaFlowSession, loadDuaFlowSessions, saveDuaFlowSession } from "@/lib/dua-flow-session"
import { cn } from "@/lib/utils"

type DuaFlowModeProps = {
  arabicSize: DuaArabicSize
  categoryId: string
  categoryTitle: string
  favoriteIds: string[]
  items: DuaItem[]
  language: AppLanguage
  onClose: () => void
  onToggleFavorite: (id: string) => void
}

const arabicSizeClasses: Record<DuaArabicSize, string> = {
  sm: "text-3xl leading-[2.5]",
  md: "text-4xl leading-[2.6]",
  lg: "text-5xl leading-[2.7]",
  xl: "text-6xl leading-[2.8]",
}

const copy = {
  en: {
    close: "Close flow mode",
    next: "Next dua",
    previous: "Previous dua",
    step: (current: number, total: number) => `${current} of ${total}`,
    done: "Complete",
    source: "Source",
    benefit: "Benefit",
    note: "Note",
    completionTitle: (period: "morning" | "evening") => `Alhamdulillah, your ${period} dhikr is complete.`,
    completionBody: "May Allah keep you guarded and surrounded by His protection.",
    backDashboard: "Back to Dashboard",
  },
  id: {
    close: "Tutup mode flow",
    next: "Doa berikutnya",
    previous: "Doa sebelumnya",
    step: (current: number, total: number) => `${current} dari ${total}`,
    done: "Selesai",
    source: "Sumber",
    benefit: "Manfaat",
    note: "Catatan",
    completionTitle: (period: "morning" | "evening") => `Alhamdulillah, dzikir ${period === "morning" ? "pagi" : "petang"} selesai.`,
    completionBody: "Semoga Allah senantiasa menjaga dan melindungimu.",
    backDashboard: "Kembali ke Dashboard",
  },
}

function vibrate(pattern: number | number[]) {
  window.navigator.vibrate?.(pattern)
}

export function DuaFlowMode({ arabicSize, categoryId, categoryTitle, favoriteIds, items, language, onClose, onToggleFavorite }: DuaFlowModeProps) {
  const t = copy[language]
  const navigate = useNavigate()
  const initialSession = loadDuaFlowSessions()[categoryId]
  const safeInitialIndex = initialSession?.completed ? 0 : Math.min(initialSession?.currentIndex ?? 0, Math.max(0, items.length - 1))
  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex)
  const [currentCount, setCurrentCount] = useState(initialSession?.completed ? 0 : initialSession?.currentCount ?? 0)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [completionSplash, setCompletionSplash] = useState(false)
  const [tapPulse, setTapPulse] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const [showNavHint, setShowNavHint] = useState(true)
  const lastTapAtRef = useRef(0)
  const hintTimerRef = useRef<number | null>(null)
  const advanceTimerRef = useRef<number | null>(null)
  const completionTimerRef = useRef<number | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const swipedRef = useRef(false)
  const currentDua = items[currentIndex]
  const targetCount = Math.max(1, currentDua?.repetition ?? 1)
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0
  const isFavorite = currentDua ? favoriteIds.includes(currentDua.id) : false
  const isMorning = categoryId.includes("morning")
  const dhikrPeriod = isMorning ? "morning" : "evening"
  const footnotes = currentDua?.footnoteIds
    ?.map((id) => duaFootnotes.find((footnote) => footnote.id === id))
    .filter((footnote): footnote is NonNullable<typeof footnote> => Boolean(footnote))

  useEffect(() => {
    if (!currentDua || completionSplash) return
    saveDuaFlowSession(categoryId, {
      currentIndex,
      currentCount,
      completed: false,
    })
  }, [categoryId, completionSplash, currentCount, currentDua, currentIndex])

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current)
      if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current)
    }
  }, [])

  function returnToDashboard() {
    if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current)
    clearDuaFlowSession(categoryId)
    onClose()
    navigate("/")
  }

  function completeFlow() {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current)
    clearDuaFlowSession(categoryId)
    setCurrentCount(targetCount)
    setIsAdvancing(false)
    setCompletionSplash(true)
    if (completionTimerRef.current) window.clearTimeout(completionTimerRef.current)
    completionTimerRef.current = window.setTimeout(returnToDashboard, 5000)
  }

  function resetNavHint() {
    setShowNavHint(false)
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    hintTimerRef.current = window.setTimeout(() => setShowNavHint(true), 2200)
  }

  function goToIndex(index: number, nextDirection: "next" | "prev", count = 0) {
    if (index < 0 || index >= items.length) return
    setDirection(nextDirection)
    setCurrentIndex(index)
    setCurrentCount(count)
    setIsAdvancing(false)
    resetNavHint()
  }

  function goNext() {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current)
    if (currentIndex >= items.length - 1) {
      completeFlow()
      return
    }

    goToIndex(currentIndex + 1, "next", 0)
  }

  function goPrevious() {
    if (currentIndex <= 0) return
    const previousDua = items[currentIndex - 1]
    goToIndex(currentIndex - 1, "prev", Math.max(1, previousDua?.repetition ?? 1))
  }

  function scheduleAdvance() {
    setIsAdvancing(true)
    vibrate([35, 40, 35])
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = window.setTimeout(goNext, 700)
  }

  function handleTap() {
    if (swipedRef.current) {
      swipedRef.current = false
      return
    }

    const now = Date.now()
    if (!currentDua || completionSplash || isAdvancing || now - lastTapAtRef.current < 180) return
    lastTapAtRef.current = now
    resetNavHint()
    setTapPulse(true)
    window.setTimeout(() => setTapPulse(false), 120)

    const nextCount = Math.min(targetCount, currentCount + 1)
    setCurrentCount(nextCount)
    if (nextCount >= targetCount) {
      scheduleAdvance()
      return
    }

    vibrate(18)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    swipedRef.current = false
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start || completionSplash) return

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return

    swipedRef.current = true
    if (deltaX < 0) {
      goNext()
      return
    }

    goPrevious()
  }

  if (!currentDua) {
    return null
  }

  if (completionSplash) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[90] flex items-center justify-center overflow-hidden px-5 py-5 text-foreground",
          isMorning ? "bg-[#fbf7eb] dark:bg-[#1c1b16]" : "bg-[#f5f0fa] dark:bg-[#18151c]",
        )}
      >
        <Card className="mx-auto max-w-sm p-6 text-center shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-sage">{categoryTitle}</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-primary">{t.completionTitle(dhikrPeriod)}</h2>
          <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">{t.completionBody}</p>
          <Button className="mt-6 w-full" onClick={returnToDashboard} type="button">
            {t.backDashboard}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] overflow-hidden px-5 py-5 text-foreground",
        isMorning ? "bg-[#fbf7eb] dark:bg-[#1c1b16]" : "bg-[#f5f0fa] dark:bg-[#18151c]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-surface-container-highest">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 pt-3">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{categoryTitle}</p>
            <h2 className="font-serif text-2xl font-semibold text-primary">{t.step(currentIndex + 1, items.length)}</h2>
          </div>
          <Button aria-label={t.close} onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="h-5 w-5" />
          </Button>
        </header>

        <div className="relative min-h-0 flex-1">
          <button aria-label={t.previous} className="absolute inset-y-0 left-0 z-20 flex w-1/5 items-center justify-start" onClick={goPrevious} type="button">
            {currentIndex > 0 ? (
              <span className={cn("rounded-full bg-card/55 p-2 text-primary shadow-soft backdrop-blur transition-opacity", showNavHint ? "opacity-80" : "opacity-25")}>
                <ChevronLeft className="h-5 w-5" />
              </span>
            ) : null}
          </button>
          <button aria-label={t.next} className="absolute inset-y-0 right-0 z-20 flex w-1/5 items-center justify-end" onClick={goNext} type="button">
            <span className={cn("rounded-full bg-card/55 p-2 text-primary shadow-soft backdrop-blur transition-opacity", showNavHint ? "opacity-80" : "opacity-25")}>
              <ChevronRight className="h-5 w-5" />
            </span>
          </button>
          <Card
            className={cn(
              "flex h-full flex-col overflow-y-auto p-5 transition duration-200",
              tapPulse && "scale-[0.98]",
              direction === "next" ? "animate-in slide-in-from-right-4 fade-in" : "animate-in slide-in-from-left-4 fade-in",
            )}
            key={currentDua.id}
            onClick={handleTap}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleTap()
              }
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-serif text-2xl font-semibold text-primary">{currentDua.title}</h3>
                <p className="mt-1 text-sm font-bold text-muted-foreground">{currentCount >= targetCount ? t.done : `${currentCount} / ${targetCount}`}</p>
              </div>
              <button
                aria-label="Toggle favorite"
                className={cn("rounded-full p-2 text-muted-foreground transition hover:bg-sage-pale/30 hover:text-primary", isFavorite && "bg-sage-pale text-primary")}
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleFavorite(currentDua.id)
                }}
                type="button"
              >
                <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
              </button>
            </div>

            {currentDua.arabic ? (
              <p className={cn("font-arabic whitespace-pre-line text-right text-primary", arabicSizeClasses[arabicSize])} dir="rtl" lang="ar">
                {currentDua.arabic}
              </p>
            ) : null}
            {currentDua.transliteration ? <p className="mt-4 text-sm font-semibold italic leading-6 text-muted-foreground">{currentDua.transliteration}</p> : null}
            {currentDua.translation ? <p className="mt-4 text-base leading-7 text-foreground">{currentDua.translation}</p> : null}
            {currentDua.benefit ? (
              <p className="mt-4 rounded-xl bg-sage-pale/65 px-3 py-2 text-sm font-semibold leading-6 text-sage-deep">
                <span className="font-bold">{t.benefit}: </span>
                {currentDua.benefit}
              </p>
            ) : null}
            {currentDua.note ? (
              <p className="mt-4 whitespace-pre-line rounded-xl bg-surface-container-low px-3 py-2 text-sm leading-6 text-muted-foreground">
                <span className="font-bold text-foreground">{t.note}: </span>
                {currentDua.note}
              </p>
            ) : null}
            {currentDua.source ? (
              <p className="mt-4 text-xs font-semibold leading-5 text-muted-foreground">
                <span className="font-bold text-foreground">{t.source}: </span>
                {currentDua.source}
              </p>
            ) : null}
            {footnotes?.length ? (
              <div className="mt-4 space-y-2 border-t border-sage/10 pt-3">
                {footnotes.map((footnote) => (
                  <p className="text-xs leading-5 text-muted-foreground" key={footnote.id}>
                    [{footnote.id}] {footnote.text}
                  </p>
                ))}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  )
}
