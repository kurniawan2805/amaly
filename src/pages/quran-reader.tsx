import { Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, Home, Loader2, Save, ChevronUp } from "lucide-react"
import { Fragment, useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { AppLanguage } from "@/lib/app-settings"
import { loadQuranReaderBookmarks, saveQuranReaderBookmarks, upsertQuranReaderBookmark, removeQuranReaderBookmark, isQuranVerseBookmarked, getVerseBookmark, type QuranLabel } from "@/lib/quran-reader-bookmarks"
import { getMushafFontName, getQuranReaderJuzNavigation, getQuranReaderPage, getQuranReaderSurahNavigation, loadBismillahFont, loadChapterHeaderFont, loadMushafFont, QURAN_BISMILLAH_CODES, QURAN_CHAPTER_HEADER_CODES, type QuranReaderNavigationItem, type QuranReaderPage, type QuranReaderVerse } from "@/lib/quran-reader-data"
import { cn } from "@/lib/utils"
import { type QuranReaderBookmarkState } from "@/lib/quran-reader-bookmarks"

type QuranReaderPageProps = {
  language: AppLanguage
  onSetPage: (page: number, ayahDetails?: { surah: number; ayah: number; surahName: string }) => void
  onUpsertBookmark: (verse: QuranReaderVerse, data: any) => void
  onRemoveBookmark: (verse: QuranReaderVerse) => void
  bookmarks: QuranReaderBookmarkState
  lastBookmarkedAyah?: { surah: number; ayah: number }
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
    label: "Category",
    note: "Note",
    private: "Private",
    saveAndLog: "Save & Log Progress",
    saved: "Bookmark saved",
    moreOptions: "More Options",
    showNotes: "Show notes",
    hideNotes: "Hide notes",
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
    label: "Kategori",
    note: "Catatan",
    private: "Privat",
    saveAndLog: "Simpan & Log Progress",
    saved: "Bookmark disimpan",
    moreOptions: "Opsi Lanjut",
    showNotes: "Tampilkan catatan",
    hideNotes: "Sembunyikan catatan",
  },
}

function pageFromParams(value: string | null) {
  return Math.max(1, Math.min(604, Number(value) || 1))
}

function MeccaIcon() {
  return (
    <svg aria-hidden="true" className="h-3 w-3 fill-amber-700 text-amber-700 dark:fill-amber-200 dark:text-amber-200" viewBox="0 0 100 100">
      <path d="M4.53,81.42l45,15s0,0,0,0c.15,.05,.31,.08,.47,.08s.32-.03,.47-.08c0,0,0,0,0,0l45-15c.61-.2,1.03-.78,1.03-1.42V20c0-.14-.03-.28-.07-.42-.01-.04-.03-.08-.04-.12-.04-.09-.08-.18-.14-.27-.02-.04-.04-.07-.07-.11-.07-.1-.16-.18-.25-.26-.02-.01-.03-.03-.04-.04,0,0,0,0,0,0-.11-.08-.24-.14-.37-.19-.01,0-.02-.01-.03-.02L50.47,3.58c-.31-.1-.64-.1-.95,0L4.53,18.58s-.02,.01-.03,.02c-.13,.05-.25,.11-.37,.19,0,0,0,0,0,0-.02,.01-.03,.03-.04,.04-.1,.08-.18,.16-.25,.26-.03,.03-.05,.07-.07,.11-.06,.09-.1,.17-.14,.27-.02,.04-.03,.08-.04,.12-.04,.14-.07,.28-.07,.42v60c0,.65,.41,1.22,1.03,1.42Zm35.96,8.82l-11.49-3.84v-25.17l11.49,3.84v25.17Zm8.01-40.41v4.34L6.5,40.17v-4.34l42,14Zm45-9.66l-42,14v-4.34l42-14v4.34Zm-43.5-6.75L9.74,20,50,6.58l40.26,13.42-40.26,13.42Z" />
    </svg>
  )
}

function MadinahIcon() {
  return (
    <svg aria-hidden="true" className="-mt-0.5 h-4 w-4 fill-amber-700 text-amber-700 dark:fill-amber-200 dark:text-amber-200" viewBox="-5 -10 110 110">
      <path d="m80.699 69.102c0-14.699-22.898-30.699-29.199-34.699v-5.6992-0.10156c3.6016-0.39844 6.5-2.8008 7.8008-6-1.1016.39844-2.3008.69922-3.6016.69922-5.3008 0-9.6992-4.3984-9.6992-9.6992 0-1.3008.19922-2.5.69922-3.6016-3.6016 1.3984-6.1016 4.8984-6.1016 9 0 4.6992 3.3984 8.6016 7.8984 9.5v0.19922 5.6992c-6.1992 4.1016-29.199 20.102-29.199 34.699 0 3.8008.69922 7.5 2 10.898h-8.6016l.003907 10.004h74.602v-10.102h-8.6016c1.3008-3.2969 2-7 2-10.797z" />
    </svg>
  )
}

function RevelationIcon({ revelation }: { revelation: 1 | 2 }) {
  return revelation === 1 ? <MeccaIcon /> : <MadinahIcon />
}

export default function QuranReaderPage({ language, onSetPage, onUpsertBookmark, onRemoveBookmark, bookmarks }: QuranReaderPageProps) {
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
  const [bookmarkLabel, setBookmarkLabel] = useState<string | null>(null)
  const [bookmarkNote, setBookmarkNote] = useState("")
  const [bookmarkPrivate, setBookmarkPrivate] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const longPressTimerRef = useRef<number | null>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (selectedVerse) {
      const existing = getVerseBookmark(bookmarks, selectedVerse)
      setBookmarkLabel(existing?.labelId || null)
      setBookmarkNote(existing?.note || "")
      setBookmarkPrivate(existing?.isPrivate ?? true)
      setNotesExpanded(false)
    }
  }, [selectedVerse, bookmarks])

  const pageSurahs = readerPage
    ? Array.from(new Map(readerPage.verses.map((verse) => [verse.surah, { name: verse.surahName, revelation: verse.revelation, surah: verse.surah }])).values())
    : []

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
    goToPage(deltaX < 0 ? page - 1 : page + 1)
  }

  function toggleBookmark() {
    if (!selectedVerse) return
    onUpsertBookmark(selectedVerse, {
      labelId: bookmarkLabel,
      note: bookmarkNote,
      isPrivate: bookmarkPrivate,
    })
    
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }
    
    setNotice(t.saved)
    setSelectedVerse(null)
    window.setTimeout(() => setNotice(null), 2000)
  }

  function autoSaveLabel(labelId: string | null) {
    if (!selectedVerse) return
    setBookmarkLabel(labelId)
    onUpsertBookmark(selectedVerse, {
      labelId: labelId,
      note: bookmarkNote,
      isPrivate: bookmarkPrivate,
    })
    
    if ("vibrate" in navigator) {
      navigator.vibrate(50)
    }
  }

  function removeBookmark() {
    if (!selectedVerse) return
    onRemoveBookmark(selectedVerse)
    setSelectedVerse(null)
  }

  function saveAndLog() {
    if (!selectedVerse) return
    toggleBookmark()
    // Pass ayah details if available from long-press
    onSetPage(selectedVerse.page, {
      surah: selectedVerse.surah,
      ayah: selectedVerse.ayah,
      surahName: selectedVerse.surahName,
    })
    setNotice(t.done)
  }

  function markDone() {
    if (!selectedVerse) return
    onSetPage(selectedVerse.page)
    setNotice(t.done)
    setSelectedVerse(null)
    window.setTimeout(() => setNotice(null), 2400)
  }

  function getLabelColor(labelId: string | null) {
    if (!labelId) return "sage"
    const label = bookmarks.labels.find((l) => l.id === labelId)
    return label?.color || "sage"
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
          <div className="border-t border-amber-900/10 text-xs font-semibold text-foreground/80 dark:border-amber-200/10">
            <div className="mx-auto flex min-h-9 max-w-screen-lg items-center justify-between px-6">
            <button className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg px-2 py-1 text-left underline decoration-amber-700/20 underline-offset-4 transition hover:bg-amber-900/5 hover:text-primary dark:hover:bg-amber-100/5" onClick={() => setNavigationPicker("surah")} type="button">
              {pageSurahs.map((surah, index) => (
                <Fragment key={surah.surah}>
                  {index > 0 ? <span className="opacity-50">·</span> : null}
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <RevelationIcon revelation={surah.revelation} />
                    {surah.name}
                  </span>
                </Fragment>
              ))}
            </button>
            <button className="rounded-lg px-2 py-1 underline decoration-amber-700/20 underline-offset-4 transition hover:bg-amber-900/5 hover:text-primary dark:hover:bg-amber-100/5" onClick={() => setNavigationPicker("juz")} type="button">
              {t.juz} {readerPage.juz}
            </button>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-screen-lg px-0 py-1 sm:px-0">
        {loading ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">{t.loading}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.offlineHint}</p>
          </Card>
        ) : null}

        {error ? <Card className="p-4 text-sm font-semibold text-muted-foreground">{error}</Card> : null}

        {readerPage ? (
          <div className="mt-2 mb-14 overflow-x-hidden overflow-y-hidden text-center text-xl" onPointerCancel={clearLongPress} onPointerDown={(event) => (pointerStartRef.current = { x: event.clientX, y: event.clientY })} onPointerUp={handlePointerUp} style={{ touchAction: "pan-y" }}>
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
            <div className="relative mt-1 space-y-2 overflow-hidden pb-2">
              <button
                aria-label={t.next}
                className="absolute inset-y-0 left-0 z-20 flex w-[18%] items-center justify-start bg-gradient-to-r from-amber-900/0 via-amber-900/0 to-transparent pl-1 text-amber-900/20 transition hover:from-amber-900/5 hover:text-amber-900/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-0 dark:from-amber-100/0 dark:via-amber-100/0 dark:text-amber-100/25 dark:hover:from-amber-100/5 dark:hover:text-amber-100/60 sm:w-[14%]"
                disabled={page >= 604}
                onClick={() => goToPage(page + 1)}
                type="button"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                aria-label={t.previous}
                className="absolute inset-y-0 right-0 z-20 flex w-[18%] items-center justify-end bg-gradient-to-l from-amber-900/0 via-amber-900/0 to-transparent pr-1 text-amber-900/20 transition hover:from-amber-900/5 hover:text-amber-900/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-0 dark:from-amber-100/0 dark:via-amber-100/0 dark:text-amber-100/25 dark:hover:from-amber-100/5 dark:hover:text-amber-100/60 sm:w-[14%]"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                type="button"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <div
                className={cn("mx-auto flex max-w-3xl flex-col pb-2 text-primary md:max-w-[40rem]", page === 1 ? "space-y-1" : "space-y-2", mushafFontReady ? `amaly-mushaf-page-${page} text-[5.4vw] leading-none md:text-[36px] lg:text-[36px]` : "font-arabic text-[5.2vw] leading-none md:text-[35px]")}
                dir="rtl"
                lang="ar"
              >
                {readerPage.lines.map((line) => (
                  <Fragment key={line.line}>
                    {line.chapterStart ? (
                      <div className={cn("flex flex-col text-center", line.line !== readerPage.lines[0]?.line && "-mt-1")}>
                        <div
                          className={cn("amaly-chapter-header -mt-1 mb-0 pb-0 pt-0 text-[28vw] leading-[0.5] text-primary md:-mt-2 md:mb-0 md:pb-0 md:pt-0 md:text-[195px] lg:text-[195px]", !extrasFontReady && "font-serif text-[0.52em] font-bold leading-tight")}
                          style={extrasFontReady ? { fontFamily: "chapter-headers" } : undefined}
                        >
                          {extrasFontReady ? QURAN_CHAPTER_HEADER_CODES[line.chapterStart.surah] : `سورة ${line.chapterStart.surahName}`}
                        </div>
                        {line.chapterStart.showBismillah ? (
                          <div
                            className={cn("block flex-col flex-wrap text-center text-[5vw] leading-normal text-foreground", page === 1 || page === 2 ? "mt-2 md:mt-2" : "mt-2 md:mt-6", page === 2 ? "md:text-[36px] lg:text-[36px]" : "md:text-[32px] lg:text-[36px]", !extrasFontReady && "font-arabic")}
                            style={extrasFontReady ? { fontFamily: "bismillah" } : undefined}
                          >
                            {extrasFontReady ? getBismillahCode(line.chapterStart.surah) : "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className={cn("flex flex-nowrap px-2 text-center", line.centered ? "justify-center" : "justify-between")}>
                      {line.words.map((word) => {
                        const bookmark = getVerseBookmark(bookmarks, word.verse)
                        const isLastBookmarkedAyah = lastBookmarkedAyah && word.verse.surah === lastBookmarkedAyah.surah && word.verse.ayah === lastBookmarkedAyah.ayah
                        return (
                          <button
                            className={cn(
                              "relative m-0 inline-flex appearance-none items-center justify-center border-0 bg-transparent p-0 text-inherit leading-none transition hover:bg-amber-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-amber-300/10",
                              word.isEndMarker ? "rounded-lg px-0.5 text-amber-700 dark:text-amber-200" : "rounded-md",
                              bookmark && !word.isEndMarker && "bg-sage-pale/20 text-amber-900 dark:bg-sage-pale/10 dark:text-amber-100",
                              isLastBookmarkedAyah && "ayah-last-read",
                            )}
                            key={word.key}
                            onPointerCancel={clearLongPress}
                            onPointerDown={() => startLongPress(word.verse)}
                            onPointerLeave={clearLongPress}
                            onPointerUp={clearLongPress}
                            type="button"
                          >
                            {bookmark && word.isEndMarker ? (
                              <span className={cn(
                                "absolute -top-1 -right-1 h-2 w-2 rounded-full shadow-sm",
                                bookmark.labelId === "hifz" ? "bg-sage" :
                                bookmark.labelId === "tadabbur" ? "bg-blush" :
                                bookmark.labelId === "ruqyah" ? "bg-amber-500" : "bg-sage"
                              )} />
                            ) : null}
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
              <div className="mx-auto flex max-w-3xl items-center justify-center text-sm text-muted-foreground md:max-w-[40rem]">
                <div className="flex-1 border-t border-amber-900/15 dark:border-amber-200/15" />
                <span className="px-3">{page}</span>
                <div className="flex-1 border-t border-amber-900/15 dark:border-amber-200/15" />
              </div>
            </div>

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

      <Sheet open={Boolean(selectedVerse)} onOpenChange={(open) => !open && setSelectedVerse(null)}>
        <SheetContent className="rounded-t-[32px] max-h-[70vh] w-full overflow-y-auto md:rounded-l-[32px] md:rounded-tr-none">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>{selectedVerse?.surahName} {selectedVerse?.ayah}</SheetTitle>
                <SheetDescription>{t.page} {selectedVerse?.page}</SheetDescription>
              </div>
              {selectedVerse && isQuranVerseBookmarked(bookmarks, selectedVerse) && (
                <Button onClick={removeBookmark} size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  {t.removeBookmark}
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="grid gap-4 px-6 py-4">
            {/* Labels - Always visible */}
            <div className="grid gap-2">
              <label className="text-sm font-bold text-primary">{t.label}</label>
              <div className="flex flex-wrap gap-2">
                {bookmarks.labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => autoSaveLabel(label.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-bold transition-all border-2",
                      bookmarkLabel === label.id 
                        ? `bg-${label.color} border-${label.color} text-white` 
                        : `bg-background border-sage/20 text-muted-foreground hover:border-sage/40`
                    )}
                  >
                    {label.name}
                  </button>
                ))}
                <button
                  onClick={() => autoSaveLabel(null)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold transition-all border-2",
                    bookmarkLabel === null 
                      ? "bg-primary border-primary text-white" 
                      : "bg-background border-sage/20 text-muted-foreground hover:border-sage/40"
                  )}
                >
                  None
                </button>
              </div>
            </div>

            {/* Private toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-primary">{t.private}</label>
              <button
                onClick={() => setBookmarkPrivate(!bookmarkPrivate)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  bookmarkPrivate ? "bg-primary" : "bg-muted"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                  bookmarkPrivate ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>

            {/* Collapsible Notes */}
            <div className="grid gap-2">
              <button
                onClick={() => setNotesExpanded(!notesExpanded)}
                className="flex items-center justify-between text-sm font-bold text-primary hover:text-primary/80 transition"
              >
                <span>{t.note}</span>
                {notesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {notesExpanded && (
                <textarea
                  className="min-h-[100px] w-full rounded-2xl border border-sage/20 bg-sage-pale/5 p-4 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-sage-pale/10"
                  placeholder="..."
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="grid gap-3 pt-2">
              <Button onClick={saveAndLog} className="h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                <Save className="mr-2 h-5 w-5" />
                {t.saveAndLog}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={toggleBookmark} variant="outline" className="h-12 rounded-2xl border-sage/20">
                  <Bookmark className="mr-2 h-4 w-4" />
                  {t.bookmark}
                </Button>
                <Button onClick={markDone} variant="ghost" className="h-12 rounded-2xl">
                  <Check className="mr-2 h-4 w-4" />
                  {t.markDone}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
