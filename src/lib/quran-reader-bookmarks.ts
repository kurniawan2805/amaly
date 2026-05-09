import type { QuranReaderVerse } from "@/lib/quran-reader-data"

export const QURAN_READER_BOOKMARKS_KEY = "amaly.quran-reader-bookmarks.v2"
export const QURAN_READER_LABELS_KEY = "amaly.quran-labels.v1"

export type QuranLabel = {
  id: string
  name: string
  color: string
}

export type QuranReaderBookmark = {
  id: string
  ayah: number
  createdAt: string
  page: number
  surah: number
  surahName: string
  labelId: string | null
  note: string | null
  position: number
  isPrivate: boolean
}

export type QuranReaderBookmarkState = {
  bookmarks: QuranReaderBookmark[]
  labels: QuranLabel[]
}

export const DEFAULT_LABELS: QuranLabel[] = [
  { id: "hifz", name: "Hifz", color: "sage" },
  { id: "tadabbur", name: "Tadabbur", color: "blush" },
  { id: "ruqyah", name: "Ruqyah", color: "amber" },
]

function normalizeBookmark(value: Partial<QuranReaderBookmark>): QuranReaderBookmark | null {
  if (typeof value.surah !== "number" || typeof value.ayah !== "number" || typeof value.page !== "number") return null

  return {
    id: value.id || `${value.surah}-${value.ayah}`,
    ayah: value.ayah,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    page: value.page,
    surah: value.surah,
    surahName: typeof value.surahName === "string" ? value.surahName : `Surah ${value.surah}`,
    labelId: value.labelId || null,
    note: value.note || null,
    position: typeof value.position === "number" ? value.position : 0,
    isPrivate: typeof value.isPrivate === "boolean" ? value.isPrivate : true,
  }
}

export function loadQuranReaderBookmarks(): QuranReaderBookmarkState {
  if (typeof window === "undefined") return { bookmarks: [], labels: DEFAULT_LABELS }

  try {
    const storedBookmarks = window.localStorage.getItem(QURAN_READER_BOOKMARKS_KEY)
    const storedLabels = window.localStorage.getItem(QURAN_READER_LABELS_KEY)
    
    const parsedBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) as Partial<QuranReaderBookmarkState> : null
    const parsedLabels = storedLabels ? JSON.parse(storedLabels) as QuranLabel[] : null

    return {
      bookmarks: Array.isArray(parsedBookmarks?.bookmarks)
        ? parsedBookmarks.bookmarks.map((bookmark) => normalizeBookmark(bookmark)).filter((bookmark): bookmark is QuranReaderBookmark => Boolean(bookmark))
        : [],
      labels: Array.isArray(parsedLabels) ? parsedLabels : DEFAULT_LABELS,
    }
  } catch {
    return { bookmarks: [], labels: DEFAULT_LABELS }
  }
}

export function saveQuranReaderBookmarks(state: QuranReaderBookmarkState) {
  window.localStorage.setItem(QURAN_READER_BOOKMARKS_KEY, JSON.stringify({ bookmarks: state.bookmarks }))
  window.localStorage.setItem(QURAN_READER_LABELS_KEY, JSON.stringify(state.labels))
}

export function getVerseBookmark(state: QuranReaderBookmarkState, verse: QuranReaderVerse) {
  return state.bookmarks.find((bookmark) => bookmark.surah === verse.surah && bookmark.ayah === verse.ayah)
}

export function isQuranVerseBookmarked(state: QuranReaderBookmarkState, verse: QuranReaderVerse) {
  return state.bookmarks.some((bookmark) => bookmark.surah === verse.surah && bookmark.ayah === verse.ayah)
}

export function upsertQuranReaderBookmark(
  state: QuranReaderBookmarkState,
  verse: QuranReaderVerse,
  data: Partial<QuranReaderBookmark>
): QuranReaderBookmarkState {
  const existingIndex = state.bookmarks.findIndex((b) => b.surah === verse.surah && b.ayah === verse.ayah)
  
  const newBookmark: QuranReaderBookmark = {
    id: data.id || (existingIndex >= 0 ? state.bookmarks[existingIndex].id : `${verse.surah}-${verse.ayah}`),
    ayah: verse.ayah,
    page: verse.page,
    surah: verse.surah,
    surahName: verse.surahName,
    createdAt: data.createdAt || (existingIndex >= 0 ? state.bookmarks[existingIndex].createdAt : new Date().toISOString()),
    labelId: data.labelId !== undefined ? data.labelId : (existingIndex >= 0 ? state.bookmarks[existingIndex].labelId : null),
    note: data.note !== undefined ? data.note : (existingIndex >= 0 ? state.bookmarks[existingIndex].note : null),
    position: data.position !== undefined ? data.position : (existingIndex >= 0 ? state.bookmarks[existingIndex].position : state.bookmarks.length),
    isPrivate: data.isPrivate !== undefined ? data.isPrivate : (existingIndex >= 0 ? state.bookmarks[existingIndex].isPrivate : true),
  }

  const nextBookmarks = [...state.bookmarks]
  if (existingIndex >= 0) {
    nextBookmarks[existingIndex] = newBookmark
  } else {
    nextBookmarks.unshift(newBookmark)
  }

  return { ...state, bookmarks: nextBookmarks }
}

export function removeQuranReaderBookmark(state: QuranReaderBookmarkState, verse: QuranReaderVerse): QuranReaderBookmarkState {
  return {
    ...state,
    bookmarks: state.bookmarks.filter((bookmark) => !(bookmark.surah === verse.surah && bookmark.ayah === verse.ayah)),
  }
}

export function updateQuranLabel(state: QuranReaderBookmarkState, labelId: string, updates: Partial<QuranLabel>): QuranReaderBookmarkState {
  return {
    ...state,
    labels: state.labels.map((label) => label.id === labelId ? { ...label, ...updates } : label),
  }
}

export function reorderBookmarks(state: QuranReaderBookmarkState, labelId: string | null, bookmarkIds: string[]): QuranReaderBookmarkState {
  const updatedBookmarks = state.bookmarks.map((bookmark) => {
    const newIndex = bookmarkIds.indexOf(bookmark.id)
    if (newIndex >= 0 && bookmark.labelId === labelId) {
      return { ...bookmark, position: newIndex }
    }
    return bookmark
  })

  return {
    ...state,
    bookmarks: updatedBookmarks.sort((a, b) => a.position - b.position),
  }
}
