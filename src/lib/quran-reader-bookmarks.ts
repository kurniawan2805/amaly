import type { QuranReaderVerse } from "@/lib/quran-reader-data"

export const QURAN_READER_BOOKMARKS_KEY = "amaly.quran-reader-bookmarks.v2"
export const QURAN_READER_LABELS_KEY = "amaly.quran-labels.v1"
export const QURAN_MAIN_BOOKMARK_KEY = "amaly.quran-main-bookmark.v1"
export const QURAN_CONTEXT_BOOKMARKS_KEY = "amaly.quran-context-bookmarks.v1"

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

// Main bookmark for khatm progress tracking
export type QuranMainBookmark = {
  page: number              // Current page (mandatory)
  surah?: number            // Optional - if set from mushaf
  ayah?: number             // Optional - if set from mushaf
  surahName?: string        // Optional - for display
  lastUpdated: string       // ISO timestamp
}

// Optional context bookmarks (shortcuts)
export type QuranContextBookmark = {
  id: string                // Unique identifier
  label: string             // Display label "Surat Al-Kahfi Reading"
  page: number              // Starting page
  toPage?: number           // Optional - for ranges
  context: "habit" | "daily" | "hifz" | "murojaah" | "custom"
  linkedId?: string         // Reference to habit ID, daily goal ID, etc
  createdAt: string
  position: number          // For sorting in UI
}

export type QuranReaderBookmarkState = {
  mainBookmark: QuranMainBookmark | null
  contextBookmarks: QuranContextBookmark[]
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

function normalizeMainBookmark(value: Partial<QuranMainBookmark> | null): QuranMainBookmark | null {
  if (!value || typeof value.page !== "number") return null

  return {
    page: value.page,
    surah: typeof value.surah === "number" ? value.surah : undefined,
    ayah: typeof value.ayah === "number" ? value.ayah : undefined,
    surahName: typeof value.surahName === "string" ? value.surahName : undefined,
    lastUpdated: typeof value.lastUpdated === "string" ? value.lastUpdated : new Date().toISOString(),
  }
}

function normalizeContextBookmark(value: Partial<QuranContextBookmark>): QuranContextBookmark | null {
  if (!value.id || !value.label || typeof value.page !== "number") return null

  return {
    id: value.id,
    label: value.label,
    page: value.page,
    toPage: typeof value.toPage === "number" ? value.toPage : undefined,
    context: ["habit", "daily", "hifz", "murojaah", "custom"].includes(value.context || "") ? value.context as any : "custom",
    linkedId: typeof value.linkedId === "string" ? value.linkedId : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    position: typeof value.position === "number" ? value.position : 0,
  }
}

export function loadQuranReaderBookmarks(): QuranReaderBookmarkState {
  if (typeof window === "undefined") return { mainBookmark: null, contextBookmarks: [], bookmarks: [], labels: DEFAULT_LABELS }

  try {
    const storedBookmarks = window.localStorage.getItem(QURAN_READER_BOOKMARKS_KEY)
    const storedLabels = window.localStorage.getItem(QURAN_READER_LABELS_KEY)
    const storedMainBookmark = window.localStorage.getItem(QURAN_MAIN_BOOKMARK_KEY)
    const storedContextBookmarks = window.localStorage.getItem(QURAN_CONTEXT_BOOKMARKS_KEY)
    
    const parsedBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) as Partial<QuranReaderBookmarkState> : null
    const parsedLabels = storedLabels ? JSON.parse(storedLabels) as QuranLabel[] : null
    const parsedMainBookmark = storedMainBookmark ? JSON.parse(storedMainBookmark) as Partial<QuranMainBookmark> : null
    const parsedContextBookmarks = storedContextBookmarks ? JSON.parse(storedContextBookmarks) as Partial<QuranContextBookmark>[] : null

    return {
      mainBookmark: normalizeMainBookmark(parsedMainBookmark),
      contextBookmarks: Array.isArray(parsedContextBookmarks)
        ? parsedContextBookmarks.map((b) => normalizeContextBookmark(b)).filter((b): b is QuranContextBookmark => Boolean(b))
        : [],
      bookmarks: Array.isArray(parsedBookmarks?.bookmarks)
        ? parsedBookmarks.bookmarks.map((bookmark) => normalizeBookmark(bookmark)).filter((bookmark): bookmark is QuranReaderBookmark => Boolean(bookmark))
        : [],
      labels: Array.isArray(parsedLabels) ? parsedLabels : DEFAULT_LABELS,
    }
  } catch {
    return { mainBookmark: null, contextBookmarks: [], bookmarks: [], labels: DEFAULT_LABELS }
  }
}

export function saveQuranReaderBookmarks(state: QuranReaderBookmarkState) {
  window.localStorage.setItem(QURAN_READER_BOOKMARKS_KEY, JSON.stringify({ bookmarks: state.bookmarks }))
  window.localStorage.setItem(QURAN_READER_LABELS_KEY, JSON.stringify(state.labels))
  if (state.mainBookmark) {
    window.localStorage.setItem(QURAN_MAIN_BOOKMARK_KEY, JSON.stringify(state.mainBookmark))
  }
  if (state.contextBookmarks.length > 0) {
    window.localStorage.setItem(QURAN_CONTEXT_BOOKMARKS_KEY, JSON.stringify(state.contextBookmarks))
  }
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

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function addQuranLabel(state: QuranReaderBookmarkState, name: string, color: string): QuranReaderBookmarkState {
  const newLabel: QuranLabel = {
    id: generateId(),
    name,
    color,
  }
  return { ...state, labels: [...state.labels, newLabel] }
}

export function deleteQuranLabel(state: QuranReaderBookmarkState, labelId: string): QuranReaderBookmarkState {
  return {
    ...state,
    labels: state.labels.filter((l) => l.id !== labelId),
    bookmarks: state.bookmarks.map((b) =>
      b.labelId === labelId ? { ...b, labelId: null } : b
    ),
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

// Main Bookmark Management
export function updateMainBookmark(state: QuranReaderBookmarkState, bookmark: Partial<QuranMainBookmark>): QuranReaderBookmarkState {
  const current = state.mainBookmark || { page: 1, lastUpdated: new Date().toISOString() }
  return {
    ...state,
    mainBookmark: {
      page: bookmark.page !== undefined ? bookmark.page : current.page,
      surah: bookmark.surah !== undefined ? bookmark.surah : current.surah,
      ayah: bookmark.ayah !== undefined ? bookmark.ayah : current.ayah,
      surahName: bookmark.surahName !== undefined ? bookmark.surahName : current.surahName,
      lastUpdated: new Date().toISOString(),
    },
  }
}

export function getMainBookmark(state: QuranReaderBookmarkState): QuranMainBookmark | null {
  return state.mainBookmark
}

// Context Bookmark Management
export function addContextBookmark(state: QuranReaderBookmarkState, bookmark: Omit<QuranContextBookmark, "position">): QuranReaderBookmarkState {
  const normalized = normalizeContextBookmark({
    ...bookmark,
    position: state.contextBookmarks.length,
  })
  if (!normalized) return state

  return {
    ...state,
    contextBookmarks: [normalized, ...state.contextBookmarks],
  }
}

export function removeContextBookmark(state: QuranReaderBookmarkState, bookmarkId: string): QuranReaderBookmarkState {
  return {
    ...state,
    contextBookmarks: state.contextBookmarks.filter((b) => b.id !== bookmarkId),
  }
}

export function updateContextBookmark(state: QuranReaderBookmarkState, bookmarkId: string, updates: Partial<QuranContextBookmark>): QuranReaderBookmarkState {
  return {
    ...state,
    contextBookmarks: state.contextBookmarks.map((b) =>
      b.id === bookmarkId ? { ...b, ...updates, id: b.id, createdAt: b.createdAt } : b
    ),
  }
}

export function reorderContextBookmarks(state: QuranReaderBookmarkState, bookmarkIds: string[]): QuranReaderBookmarkState {
  return {
    ...state,
    contextBookmarks: state.contextBookmarks
      .map((bookmark) => ({
        ...bookmark,
        position: bookmarkIds.indexOf(bookmark.id),
      }))
      .sort((a, b) => a.position - b.position),
  }
}
