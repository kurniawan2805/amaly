import { Bookmark, Check, ChevronLeft, ChevronRight, Home, Loader2 } from "lucide-react"
import { Fragment, useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AppLanguage } from "@/lib/app-settings"
import { loadQuranReaderBookmarks, saveQuranReaderBookmarks, toggleQuranReaderBookmark, isQuranVerseBookmarked } from "@/lib/quran-reader-bookmarks"
import { getMushafFontName, getQuranReaderJuzNavigation, getQuranReaderPage, getQuranReaderSurahNavigation, loadBismillahFont, loadChapterHeaderFont, loadMushafFont, QURAN_BISMILLAH_CODES, QURAN_CHAPTER_HEADER_CODES, type QuranReaderNavigationItem, type QuranReaderPage, type QuranReaderVerse } from "@/lib/quran-reader-data"
import { cn } from "@/lib/utils"

type QuranReaderPageProps = {
  language: AppLanguage
  onSetPage: (page: number) => void
}

const copy = {
  en: {
    home: "Back to Quran tracker",
    loading: "Loading Quran page...",
    offlineHint: "If you are offline, this page opens from cache after the first online load.",
    previous: "Previous page",
    next: "Next page",
    page: "Page",
    juz: "Juz",
    bookmark: "Bookmark ayah",
    removeBookmark: "Remove bookmark",
    markDone: "Mark read until this page",
    done: "Reading progress updated.",
    close: "Close",
  },
  id: {
    home: "Kembali ke tracker Quran",
    loading: "Memuat halaman Quran...",
    offlineHint: "Kalau offline, halaman ini terbuka dari cache setelah pernah dibuka online.",
    previous: "Halaman sebelumnya",
    next: "Halaman berikutnya",
    page: "Halaman",
    juz: "Juz",
    bookmark: "Bookmark ayat",
    removeBookmark: "Hapus bookmark",
    markDone: "Tandai selesai baca sampai halaman ini",
    done: "Progress bacaan diperbarui.",
    close: "Tutup",
  },
}

function pageFromParams(value: string | null) {
  return Math.max(1, Math.min(604, Number(value) || 1))
}

export default function QuranReaderPage({ language, onSetPage }: QuranReaderPageProps) {
  const t = copy[language]
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const page = pageFromParams(params.get("page"))
  const [readerPage, setReaderPage] = useState<QuranReaderPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mushafFontReady, setMushafFontReady] = useState(false)
  const [extrasFontReady, setExtrasFontReady] = useState(false)
  const [pageInputOpen, setPageInputOpen] = useState(false)
  const [pageInputValue, setPageInputValue] = useState(String(page))
  const [navigationPicker, setNavigationPicker] = useState<"surah" | "juz" | null>(null)
  const [selectedVerse, setSelectedVerse] = useState<QuranReaderVerse | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState(() => loadQuranReaderBookmarks())
  const longPressTimerRef = useRef<number | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMushafFontReady(false)
    setExtrasFontReady(false)
    setError(null)
    getQuranReaderPage(page)
      .then((nextPage) => {
        if (cancelled) return
        setReaderPage(nextPage)
        setLoading(false)
        Promise.all([loadMushafFont(page), loadChapterHeaderFont(), loadBismillahFont()])
          .then(() => {
            if (!cancelled) {
              setMushafFontReady(true)
              setExtrasFontReady(true)
            }
          })
          .catch(() => {
            if (!cancelled) {
              setMushafFontReady(false)
              setExtrasFontReady(false)
            }
          })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Could not load Quran page.")
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  useEffect(() => {
    if (pageInputOpen) setPageInputValue(String(page))
  }, [page, pageInputOpen])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        goToPage(page + 1)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        goToPage(page - 1)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  })

  function goToPage(nextPage: number) {
    const safePage = Math.max(1, Math.min(604, nextPage))
    setParams({ page: String(safePage) })
    setSelectedVerse(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function submitPageInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    goToPage(pageFromParams(pageInputValue))
    setPageInputOpen(false)
  }

  function selectNavigationItem(item: QuranReaderNavigationItem) {
    goToPage(item.page)
    setNavigationPicker(null)
  }

  function clearLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  function startLongPress(verse: QuranReaderVerse) {
    clearLongPress()
    longPressTimerRef.current = window.setTimeout(() => setSelectedVerse(verse), 520)
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    clearLongPress()
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) < Math.abs(deltaY) * 1.08) return
    goToPage(deltaX < 0 ? page + 1 : page - 1)
  }

  function toggleBookmark() {
    if (!selectedVerse) return
    const next = toggleQuranReaderBookmark(bookmarks, selectedVerse)
    setBookmarks(next)
    saveQuranReaderBookmarks(next)
    setSelectedVerse(null)
  }

  function markDone() {
    if (!selectedVerse) return
    onSetPage(selectedVerse.page)
    setNotice(t.done)
    setSelectedVerse(null)
    window.setTimeout(() => setNotice(null), 2400)
  }

  function getBismillahCode(surah: number) {
    if (surah === 2) return QURAN_BISMILLAH_CODES.baqarah
    if (surah === 95 || surah === 97) return QURAN_BISMILLAH_CODES.special
    return QURAN_BISMILLAH_CODES.default
  }

  return (
    <div className="min-h-screen bg-[#f7f1e7] text-foreground dark:bg-[#10161f]">
      <header className="sticky top-0 z-40 border-b border-amber-900/10 bg-[#f7f1e7]/95 backdrop-blur dark:border-amber-200/10 dark:bg-[#10161f]/95">
        <div className="mx-auto flex min-h-[60px] max-w-5xl items-center justify-between gap-3 px-4">
          <Button aria-label={t.home} onClick={() => navigate("/quran")} size="sm" type="button" variant="outline">
            <Home className="h-4 w-4" />
            Quran
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center">
            <button className="group rounded-xl border border-dashed border-amber-900/15 px-3 py-1 text-center transition hover:bg-amber-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-amber-100/15 dark:hover:bg-amber-100/5" onClick={() => setPageInputOpen(true)} type="button">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground group-hover:text-primary">{t.page}</p>
              <h1 className="font-serif text-xl font-semibold leading-none text-primary underline decoration-amber-700/25 underline-offset-4">{page}</h1>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label={t.next} disabled={page >= 604} onClick={() => goToPage(page + 1)} size="icon" type="button" variant="outline">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button aria-label={t.previous} disabled={page <= 1} onClick={() => goToPage(page - 1)} size="icon" type="button" variant="outline">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {readerPage ? (
          <div className="flex min-h-9 items-center justify-between border-t border-amber-900/10 px-4 text-xs font-semibold text-foreground/80 dark:border-amber-200/10">
            <button className="rounded-lg px-2 py-1 underline decoration-amber-700/20 underline-offset-4 transition hover:bg-amber-900/5 hover:text-primary dark:hover:bg-amber-100/5" onClick={() => setNavigationPicker("surah")} type="button">
              {readerPage.verses.map((verse) => verse.surahName).filter((name, index, names) => names.indexOf(name) === index).join(" · ")}
            </button>
            <button className="rounded-lg px-2 py-1 underline decoration-amber-700/20 underline-offset-4 transition hover:bg-amber-900/5 hover:text-primary dark:hover:bg-amber-100/5" onClick={() => setNavigationPicker("juz")} type="button">
              {t.juz} {readerPage.juz}
            </button>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-3xl px-0 py-4 sm:px-0">
        {loading ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">{t.loading}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.offlineHint}</p>
          </Card>
        ) : null}

        {error ? <Card className="p-4 text-sm font-semibold text-muted-foreground">{error}</Card> : null}

        {readerPage ? (
          <div onPointerCancel={clearLongPress} onPointerDown={(event) => (pointerStartRef.current = { x: event.clientX, y: event.clientY })} onPointerUp={handlePointerUp} style={{ touchAction: "pan-y" }}>
            {mushafFontReady ? (
              <style>{`
                @font-palette-values --amaly-mushaf-words-${page}{font-family:p${page};base-palette:3;}
                @font-palette-values --amaly-mushaf-ayah-${page}{font-family:p${page};base-palette:0;override-colors:10 #008000,11 #b78b14,12 #f8efd3,13 #000000;}
                @font-palette-values --amaly-header-palette{font-family:chapter-headers;base-palette:7;}
                .amaly-mushaf-page-${page} .amaly-v4-word{font-family:p${page};font-palette:--amaly-mushaf-words-${page};}
                .amaly-mushaf-page-${page} .amaly-v4-ayah{font-family:p${page};font-palette:--amaly-mushaf-ayah-${page};}
                .amaly-mushaf-page-${page} .amaly-chapter-header{font-palette:--amaly-header-palette;}
              `}</style>
            ) : null}
            <Card className="relative mt-0 overflow-hidden border-amber-900/10 bg-[#fffdf8] px-2 pb-3 pt-3 shadow-none dark:border-amber-200/10 dark:bg-[#141c27] sm:px-2">
              <button
                aria-label={t.next}
                className="absolute left-0 top-1/2 z-20 flex h-28 w-12 -translate-y-1/2 items-center justify-center rounded-r-2xl border-y border-r border-dashed border-amber-900/10 bg-amber-900/0 text-amber-900/35 transition hover:bg-amber-900/5 hover:text-amber-900/70 disabled:pointer-events-none disabled:opacity-0 dark:border-amber-100/10 dark:text-amber-100/35 dark:hover:bg-amber-100/5 dark:hover:text-amber-100/70"
                disabled={page >= 604}
                onClick={() => goToPage(page + 1)}
                type="button"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                aria-label={t.previous}
                className="absolute right-0 top-1/2 z-20 flex h-28 w-12 -translate-y-1/2 items-center justify-center rounded-l-2xl border-y border-l border-dashed border-amber-900/10 bg-amber-900/0 text-amber-900/35 transition hover:bg-amber-900/5 hover:text-amber-900/70 disabled:pointer-events-none disabled:opacity-0 dark:border-amber-100/10 dark:text-amber-100/35 dark:hover:bg-amber-100/5 dark:hover:text-amber-100/70"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                type="button"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
              <div
                className={cn("mx-auto flex max-w-[40rem] flex-col text-primary", mushafFontReady ? `amaly-mushaf-page-${page} text-[5.4vw] leading-none md:text-[36px] lg:text-[36px]` : "font-arabic text-[5.2vw] leading-none md:text-[35px]")}
                dir="rtl"
                lang="ar"
              >
                {readerPage.lines.map((line) => (
                  <Fragment key={line.line}>
                    {line.chapterStart ? (
                      <div className="flex flex-col text-center">
                        <div
                          className={cn("amaly-chapter-header pb-1 pt-0 text-[28vw] leading-[0.55] text-primary md:pb-1 md:pt-0 md:text-[195px] lg:text-[195px]", !extrasFontReady && "font-serif text-[0.52em] font-bold leading-tight")}
                          style={extrasFontReady ? { fontFamily: "chapter-headers" } : undefined}
                        >
                          {extrasFontReady ? QURAN_CHAPTER_HEADER_CODES[line.chapterStart.surah] : `سورة ${line.chapterStart.surahName}`}
                        </div>
                        {line.chapterStart.showBismillah ? (
                          <div
                            className={cn("block flex-col flex-wrap text-center text-[5vw] leading-normal text-foreground", page === 1 || page === 2 ? "md:mt-1" : "mt-0 md:mt-1", page === 2 ? "md:text-[36px] lg:text-[36px]" : "md:text-[32px] lg:text-[36px]", !extrasFontReady && "font-arabic")}
                            style={extrasFontReady ? { fontFamily: "bismillah" } : undefined}
                          >
                            {extrasFontReady ? getBismillahCode(line.chapterStart.surah) : "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className={cn("flex flex-nowrap items-center px-2 text-center whitespace-nowrap", line.words.length > 0 && "min-h-[1.28em]", line.centered ? "justify-center gap-0" : "justify-between gap-0")}>
                      {line.words.map((word) => {
                        const bookmarked = isQuranVerseBookmarked(bookmarks, word.verse)
                        return (
                          <button
                            className={cn(
                              "m-0 inline-flex appearance-none items-center justify-center border-0 bg-transparent p-0 text-inherit leading-none transition hover:bg-amber-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-amber-300/10",
                              word.isEndMarker ? "rounded-lg px-0.5 text-amber-700 dark:text-amber-200" : "rounded-md",
                              bookmarked && !word.isEndMarker && "bg-amber-50 text-amber-900 dark:bg-amber-300/10 dark:text-amber-100",
                            )}
                            key={word.key}
                            onPointerCancel={clearLongPress}
                            onPointerDown={() => startLongPress(word.verse)}
                            onPointerLeave={clearLongPress}
                            onPointerUp={clearLongPress}
                            type="button"
                          >
                            <span
                              className={cn("inline-block leading-normal", mushafFontReady && (word.isEndMarker ? "amaly-v4-word amaly-v4-ayah" : "amaly-v4-word"))}
                              style={mushafFontReady ? { fontFamily: getMushafFontName(page) } : undefined}
                            >
                              {mushafFontReady && word.glyphText ? word.glyphText : word.text}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </Fragment>
                ))}
              </div>
              <div className="mx-auto mt-2 flex max-w-[40rem] items-center justify-center text-sm text-muted-foreground">
                <div className="flex-1 border-t border-amber-900/15 dark:border-amber-200/15" />
                <span className="px-3">{page}</span>
                <div className="flex-1 border-t border-amber-900/15 dark:border-amber-200/15" />
              </div>
            </Card>

          </div>
        ) : null}
      </main>

      {notice ? <div className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-2xl border border-sage/20 bg-card p-4 text-center text-sm font-bold text-primary shadow-2xl">{notice}</div> : null}

      {pageInputOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-24 backdrop-blur-sm" onClick={() => setPageInputOpen(false)}>
          <Card className="w-full max-w-xs p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <form className="grid gap-3" onSubmit={submitPageInput}>
              <label className="text-sm font-bold text-primary" htmlFor="quran-page-input">{t.page}</label>
              <input
                autoFocus
                className="rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-bold text-primary outline-none focus:ring-2 focus:ring-ring"
                id="quran-page-input"
                inputMode="numeric"
                max={604}
                min={1}
                onChange={(event) => setPageInputValue(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                type="number"
                value={pageInputValue}
              />
              <Button type="submit">Go</Button>
            </form>
          </Card>
        </div>
      ) : null}

      {navigationPicker ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0" onClick={() => setNavigationPicker(null)}>
          <Card className="max-h-[70vh] w-full max-w-sm overflow-hidden p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-primary">{navigationPicker === "surah" ? "Surah" : t.juz}</h2>
              <Button onClick={() => setNavigationPicker(null)} size="sm" type="button" variant="ghost">{t.close}</Button>
            </div>
            <div className="grid max-h-[56vh] gap-2 overflow-y-auto pr-1">
              {(navigationPicker === "surah" ? getQuranReaderSurahNavigation() : getQuranReaderJuzNavigation()).map((item) => (
                <button
                  className="flex items-center justify-between rounded-xl border border-dashed border-amber-900/15 bg-background px-3 py-2 text-left transition hover:bg-amber-50 dark:border-amber-100/15 dark:hover:bg-amber-300/10"
                  key={item.value}
                  onClick={() => selectNavigationItem(item)}
                  type="button"
                >
                  <span className="font-semibold text-primary">{item.value}. {item.label}</span>
                  <span className="text-xs font-bold text-muted-foreground">{t.page} {item.page}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {selectedVerse ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 px-4 pb-4 sm:items-center sm:pb-0">
          <Card className="w-full max-w-sm p-4 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{selectedVerse.surahName} {selectedVerse.ayah}</p>
            <div className="mt-4 grid gap-2">
              <Button onClick={toggleBookmark} type="button" variant="outline">
                <Bookmark className="h-4 w-4" />
                {isQuranVerseBookmarked(bookmarks, selectedVerse) ? t.removeBookmark : t.bookmark}
              </Button>
              <Button onClick={markDone} type="button">
                <Check className="h-4 w-4" />
                {t.markDone}
              </Button>
              <Button onClick={() => setSelectedVerse(null)} type="button" variant="ghost">{t.close}</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
