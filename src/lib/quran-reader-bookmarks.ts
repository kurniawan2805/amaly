import type { QuranReaderVerse } from "@/lib/quran-reader-data"

export const QURAN_READER_BOOKMARKS_KEY = "amaly.quran-reader-bookmarks.v1"

export type QuranReaderBookmark = {
  ayah: number
  createdAt: string
  page: number
  surah: number
  surahName: string
}

export type QuranReaderBookmarkState = {
  bookmarks: QuranReaderBookmark[]
}

function normalizeBookmark(value: Partial<QuranReaderBookmark>): QuranReaderBookmark | null {
  if (typeof value.surah !== "number" || typeof value.ayah !== "number" || typeof value.page !== "number") return null

  return {
    ayah: value.ayah,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    page: value.page,
    surah: value.surah,
    surahName: typeof value.surahName === "string" ? value.surahName : `Surah ${value.surah}`,
  }
}

export function loadQuranReaderBookmarks(): QuranReaderBookmarkState {
  if (typeof window === "undefined") return { bookmarks: [] }

  try {
    const stored = window.localStorage.getItem(QURAN_READER_BOOKMARKS_KEY)
    const parsed = stored ? JSON.parse(stored) as Partial<QuranReaderBookmarkState> : null
    return {
      bookmarks: Array.isArray(parsed?.bookmarks)
        ? parsed.bookmarks.map((bookmark) => normalizeBookmark(bookmark)).filter((bookmark): bookmark is QuranReaderBookmark => Boolean(bookmark))
        : [],
    }
  } catch {
    return { bookmarks: [] }
  }
}

export function saveQuranReaderBookmarks(state: QuranReaderBookmarkState) {
  window.localStorage.setItem(QURAN_READER_BOOKMARKS_KEY, JSON.stringify(state))
}

export function isQuranVerseBookmarked(state: QuranReaderBookmarkState, verse: QuranReaderVerse) {
  return state.bookmarks.some((bookmark) => bookmark.surah === verse.surah && bookmark.ayah === verse.ayah)
}

export function toggleQuranReaderBookmark(state: QuranReaderBookmarkState, verse: QuranReaderVerse): QuranReaderBookmarkState {
  if (isQuranVerseBookmarked(state, verse)) {
    return {
      bookmarks: state.bookmarks.filter((bookmark) => !(bookmark.surah === verse.surah && bookmark.ayah === verse.ayah)),
    }
  }

  return {
    bookmarks: [
      {
        ayah: verse.ayah,
        createdAt: new Date().toISOString(),
        page: verse.page,
        surah: verse.surah,
        surahName: verse.surahName,
      },
      ...state.bookmarks,
    ],
  }
}
