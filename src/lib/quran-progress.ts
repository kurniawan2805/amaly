import type { AppLanguage, HijriOffset } from "@/lib/app-settings"
import { dateFromGregorianKey, formatHijriDate } from "@/lib/hijri-date"
import { findQuranJuz, getAyahId, getQuranJuzFirstKey, getQuranJuzLastKey, getQuranPageEnd, getQuranPageStart, getSurahEnglishName, getSurahName, QURAN_TOTAL_PAGES as STATIC_QURAN_TOTAL_PAGES } from "@/lib/quran-static-meta"

export const QURAN_PROGRESS_STORAGE_KEY = "amaly.quran-progress.v1"
export const QURAN_TOTAL_PAGES = STATIC_QURAN_TOTAL_PAGES
export const QURAN_DAILY_GOAL = 5
export const QURAN_STREAK_GRACE_PAGES = QURAN_DAILY_GOAL * 2

function quranReadingUrl(page: number) {
  return `/quran/read?page=${clampPage(page || 1)}`
}

export type QuranProgressLog = {
  date: string
  pages: number
  page: number
  from_page: number
  to_page: number
  surah_name: string
  ayah: number
  juz: number
  completed_juz?: number
  completed_juzs?: number[]
}

export type QuranProgressState = {
  last_page_read: number
  logs: QuranProgressLog[]
  surah: number
  surah_name: string
  surah_english_name: string
  ayah: number
  ayah_range: string
  juz: number
  page: number
  progress_percent: number
  current_juz_progress_percent: number
  projected_finish_date: string
  message: string
  milestone_message: string | null
  streak_days: number
  streak_label: string
  missed_yesterday: boolean
  completed_juzs: number[]
  last_juz: number
  completed_juz?: number
  daily_goal: number
  pages_read_today: number
  goal_completed_today: boolean
  goal_burst: boolean
  completed_juzs_this_update: number[]
  continue_url: string
  barakah_burst: boolean
  is_khatm_complete: boolean
}

function clampPage(page: number) {
  return Math.max(1, Math.min(QURAN_TOTAL_PAGES, page))
}

function normalizeDailyGoal(goal: unknown) {
  return Math.max(1, Math.min(30, typeof goal === "number" && Number.isFinite(goal) ? Math.round(goal) : QURAN_DAILY_GOAL))
}

export function getRiyadhDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Riyadh",
    year: "numeric",
  }).formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value ?? "1970"
  const month = parts.find((part) => part.type === "month")?.value ?? "01"
  const day = parts.find((part) => part.type === "day")?.value ?? "01"

  return `${year}-${month}-${day}`
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function getTodayPages(logs: QuranProgressLog[]) {
  const today = getRiyadhDateKey()
  return logs.find((log) => log.date === today)?.pages ?? 0
}

function normalizeLog(log: Partial<QuranProgressLog>, language: AppLanguage): QuranProgressLog | null {
  if (!log.date || typeof log.pages !== "number") {
    return null
  }

  const toPage = clampPage(log.to_page ?? log.page ?? 1)
  const fromPage = Math.max(0, log.from_page ?? Math.max(0, toPage - log.pages))
  const details = getQuranPageDetails(toPage, language)

  return {
    date: log.date,
    pages: Math.max(0, log.pages),
    page: toPage,
    from_page: fromPage,
    to_page: toPage,
    surah_name: log.surah_name ?? details.surah_name,
    ayah: log.ayah ?? details.ayah,
    juz: log.juz ?? details.juz,
    completed_juz: log.completed_juz,
    completed_juzs: Array.isArray(log.completed_juzs)
      ? log.completed_juzs.filter((juz): juz is number => typeof juz === "number" && juz >= 1 && juz <= 30)
      : typeof log.completed_juz === "number"
        ? [log.completed_juz]
        : undefined,
  }
}

function mergeCompletedJuzs(current: number[] | undefined, next: number[]) {
  const merged = Array.from(new Set([...(current ?? []), ...next])).sort((a, b) => a - b)
  return merged.length > 0 ? merged : undefined
}

function mergeTodayLog(
  logs: QuranProgressLog[],
  pagesAdded: number,
  fromPage: number,
  toPage: number,
  completedJuzs: number[],
  language: AppLanguage,
) {
  const today = getRiyadhDateKey()
  const existing = logs.find((log) => log.date === today)
  const details = getQuranPageDetails(toPage, language)
  const latestCompletedJuz = completedJuzs[completedJuzs.length - 1]

  if (existing) {
    return logs.map((log) =>
      log.date === today
        ? {
            ...log,
            pages: log.pages + pagesAdded,
            page: toPage,
            from_page: Math.min(log.from_page, fromPage),
            to_page: toPage,
            surah_name: details.surah_name,
            ayah: details.ayah,
            juz: details.juz,
            completed_juz: latestCompletedJuz ?? log.completed_juz,
            completed_juzs: mergeCompletedJuzs(log.completed_juzs, completedJuzs),
          }
        : log,
    )
  }

  return [
    ...logs,
    {
      date: today,
      pages: pagesAdded,
      page: toPage,
      from_page: fromPage,
      to_page: toPage,
      surah_name: details.surah_name,
      ayah: details.ayah,
      juz: details.juz,
      completed_juz: latestCompletedJuz,
      completed_juzs: completedJuzs.length > 0 ? completedJuzs : undefined,
    },
  ]
}

function averagePagesPerDay(logs: QuranProgressLog[]) {
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentTotal = logs
    .filter((log) => new Date(`${log.date}T00:00:00`) >= sevenDaysAgo)
    .reduce((total, log) => total + log.pages, 0)

  return recentTotal > 0 ? recentTotal / 7 : 0
}

function formatProjectedFinishDate(
  lastPageRead: number,
  logs: QuranProgressLog[],
  language: AppLanguage,
  hijriOffset: HijriOffset = 0,
) {
  const remainingPages = QURAN_TOTAL_PAGES - lastPageRead
  const average = averagePagesPerDay(logs)

  if (remainingPages <= 0) {
    return language === "id" ? "Khatm selesai" : "Khatm complete"
  }

  if (average <= 0) {
    return language === "id" ? "Belum cukup data" : "Not enough data yet"
  }

  const finish = new Date()
  finish.setDate(finish.getDate() + Math.ceil(remainingPages / average))

  return formatHijriDate(finish, hijriOffset, language)
}

function milestoneMessage(page: number, juzProgress: number, language: AppLanguage) {
  if (page >= QURAN_TOTAL_PAGES) {
    return language === "id" ? "Khatm selesai. MashaAllah." : "Khatm complete. MashaAllah."
  }

  if (juzProgress >= 50 && juzProgress < 75) {
    return language === "id" ? "Sudah separuh juz ini!" : "Halfway through this Juz!"
  }

  return null
}

function completedJuzs(logs: QuranProgressLog[]) {
  return Array.from(
    new Set(
      logs
        .flatMap((log) => log.completed_juzs ?? (typeof log.completed_juz === "number" ? [log.completed_juz] : []))
        .filter((juz): juz is number => typeof juz === "number" && juz >= 1 && juz <= 30),
    ),
  ).sort((a, b) => a - b)
}

function rangeFromTo(from: number, to: number) {
  return from === to ? `${from}` : `${from}-${to}`
}

function completedThroughJuzForPage(page: number) {
  const safePage = clampPage(page)
  const pageEnd = getQuranPageEnd(safePage)
  const pageEndJuz = findQuranJuz(pageEnd.surah, pageEnd.ayah)
  const juzEnd = getQuranJuzLastKey(pageEndJuz)

  return getAyahId(pageEnd.surah, pageEnd.ayah) >= getAyahId(juzEnd.surah, juzEnd.ayah) ? pageEndJuz : Math.max(0, pageEndJuz - 1)
}

function completedJuzRange(fromPage: number, toPage: number) {
  if (toPage <= fromPage) {
    return []
  }

  const previousCompletedThrough = fromPage > 0 ? completedThroughJuzForPage(fromPage) : 0
  const nextCompletedThrough = completedThroughJuzForPage(toPage)

  if (nextCompletedThrough <= previousCompletedThrough) {
    return []
  }

  return Array.from({ length: nextCompletedThrough - previousCompletedThrough }, (_, index) => previousCompletedThrough + index + 1)
}

function completedJuzsForProgress(page: number) {
  const completedThrough = page > 0 ? completedThroughJuzForPage(page) : 0
  return Array.from({ length: completedThrough }, (_, index) => index + 1)
}

function calculateStreak(logs: QuranProgressLog[], language: AppLanguage) {
  const byDate = new Map<string, number>()
  logs.forEach((log) => byDate.set(log.date, (byDate.get(log.date) ?? 0) + log.pages))

  let cursor = byDate.has(getRiyadhDateKey()) ? getRiyadhDateKey() : addDays(getRiyadhDateKey(), -1)
  let streak = 0
  let previousNewerPages = byDate.get(addDays(cursor, 1)) ?? 0

  for (let index = 0; index < 730; index += 1) {
    const pages = byDate.get(cursor) ?? 0

    if (pages > 0) {
      streak += 1
      previousNewerPages = pages
      cursor = addDays(cursor, -1)
      continue
    }

    if (previousNewerPages >= QURAN_STREAK_GRACE_PAGES) {
      streak += 1
      previousNewerPages = 0
      cursor = addDays(cursor, -1)
      continue
    }

    break
  }

  const yesterday = addDays(getRiyadhDateKey(), -1)
  const todayPages = byDate.get(getRiyadhDateKey()) ?? 0
  const missedYesterday = !byDate.has(yesterday) && todayPages < QURAN_STREAK_GRACE_PAGES

  return {
    streak_days: streak,
    streak_label:
      language === "id"
        ? streak > 0
          ? `${streak} Hari Istiqomah`
          : "Mulai Istiqomah"
        : streak > 0
          ? `${streak} Day Streak`
          : "Start a Streak",
    missed_yesterday: missedYesterday,
  }
}

export function getQuranPageDetails(page: number, language: AppLanguage = "en") {
  const safePage = clampPage(page)
  const pageStart = getQuranPageStart(safePage)
  const pageEnd = getQuranPageEnd(safePage)
  const { surah, ayah } = pageStart
  const juz = findQuranJuz(surah, ayah)
  const surahName = getSurahName(surah)
  const surahEnglishName = getSurahEnglishName(surah)
  const juzStart = getQuranJuzFirstKey(juz)
  const juzEnd = getQuranJuzLastKey(juz)
  const juzStartAyahId = getAyahId(juzStart.surah, juzStart.ayah)
  const juzEndAyahId = getAyahId(juzEnd.surah, juzEnd.ayah)
  const currentJuzProgress = Math.min(
    100,
    Math.max(0, ((getAyahId(surah, ayah) - juzStartAyahId + 1) / (juzEndAyahId - juzStartAyahId + 1)) * 100),
  )

  return {
    surah,
    surah_name: surahName,
    surah_english_name: surahEnglishName,
    ayah,
    ayah_range: rangeFromTo(pageStart.ayah, pageEnd.ayah),
    juz,
    page: safePage,
    progress_percent: Math.round((safePage / QURAN_TOTAL_PAGES) * 100),
    current_juz_progress_percent: Math.round(currentJuzProgress),
    message:
      language === "id"
        ? `MashaAllah! Kamu sampai di Surah ${surahName}, Ayah ${ayah}.`
        : `MashaAllah! You've reached Surah ${surahName}, Ayah ${ayah}.`,
  }
}

export function updateProgress(
  lastPage: number,
  increment: number,
  logs: QuranProgressLog[] = [],
  language: AppLanguage = "en",
  dailyGoal: number = QURAN_DAILY_GOAL,
  hijriOffset: HijriOffset = 0,
): QuranProgressState {
  const safeIncrement = Math.max(0, increment)
  return setProgressToPage(lastPage, lastPage + safeIncrement, logs, language, dailyGoal, hijriOffset)
}

export function setProgressToPage(
  lastPage: number,
  targetPage: number,
  logs: QuranProgressLog[] = [],
  language: AppLanguage = "en",
  dailyGoal: number = QURAN_DAILY_GOAL,
  hijriOffset: HijriOffset = 0,
): QuranProgressState {
  const previousPage = Math.max(0, Math.min(QURAN_TOTAL_PAGES, lastPage))
  const hasReadingProgress = previousPage > 0 || targetPage > 0
  const newPage = hasReadingProgress ? clampPage(targetPage) : 0
  const detailPage = newPage || 1
  const pagesAdded = Math.max(0, newPage - previousPage)
  const oldJuz = previousPage > 0 ? findQuranJuz(getQuranPageStart(previousPage).surah, getQuranPageStart(previousPage).ayah) : 1
  const completedJuzsThisUpdate = pagesAdded > 0 ? completedJuzRange(previousPage, newPage) : []
  const normalizedLogs = logs.map((log) => normalizeLog(log, language)).filter((log): log is QuranProgressLog => Boolean(log))
  const safeDailyGoal = normalizeDailyGoal(dailyGoal)
  const previousTodayPages = getTodayPages(normalizedLogs)
  const nextLogs =
    pagesAdded > 0 ? mergeTodayLog(normalizedLogs, pagesAdded, previousPage, newPage, completedJuzsThisUpdate, language) : normalizedLogs
  const pagesReadToday = getTodayPages(nextLogs)
  const details = getQuranPageDetails(detailPage, language)
  const streak = calculateStreak(nextLogs, language)
  const goalCompletedToday = pagesReadToday >= safeDailyGoal
  const goalBurst = pagesAdded > 0 && previousTodayPages < safeDailyGoal && goalCompletedToday

  return {
    last_page_read: newPage,
    logs: nextLogs,
    ...details,
    projected_finish_date: formatProjectedFinishDate(newPage, nextLogs, language, hijriOffset),
    milestone_message: milestoneMessage(newPage, details.current_juz_progress_percent, language),
    ...streak,
    completed_juzs: Array.from(new Set([...completedJuzsForProgress(newPage), ...completedJuzs(nextLogs)])).sort((a, b) => a - b),
    last_juz: oldJuz,
    completed_juz: completedJuzsThisUpdate[completedJuzsThisUpdate.length - 1],
    daily_goal: safeDailyGoal,
    pages_read_today: pagesReadToday,
    goal_completed_today: goalCompletedToday,
    goal_burst: goalBurst,
    completed_juzs_this_update: completedJuzsThisUpdate,
    continue_url: quranReadingUrl(newPage || 1),
    barakah_burst: completedJuzsThisUpdate.length > 0,
    is_khatm_complete: newPage >= QURAN_TOTAL_PAGES,
  }
}

export function initialQuranProgress(language: AppLanguage = "en", hijriOffset: HijriOffset = 0): QuranProgressState {
  const details = getQuranPageDetails(1, language)

  return {
    last_page_read: 0,
    logs: [],
    ...details,
    progress_percent: 0,
    current_juz_progress_percent: 0,
    projected_finish_date: formatProjectedFinishDate(0, [], language, hijriOffset),
    milestone_message: null,
    ...calculateStreak([], language),
    completed_juzs: [],
    last_juz: 1,
    completed_juz: undefined,
    daily_goal: QURAN_DAILY_GOAL,
    pages_read_today: 0,
    goal_completed_today: false,
    goal_burst: false,
    completed_juzs_this_update: [],
    continue_url: quranReadingUrl(1),
    barakah_burst: false,
    is_khatm_complete: false,
  }
}

export function loadQuranProgress(language: AppLanguage = "en", hijriOffset: HijriOffset = 0): QuranProgressState {
  if (typeof window === "undefined") {
    return initialQuranProgress(language, hijriOffset)
  }

  try {
    const stored = window.localStorage.getItem(QURAN_PROGRESS_STORAGE_KEY)

    if (!stored) {
      return initialQuranProgress(language, hijriOffset)
    }

    const parsed = JSON.parse(stored) as Partial<QuranProgressState>
    return updateProgress(parsed.last_page_read ?? 0, 0, parsed.logs ?? [], language, parsed.daily_goal, hijriOffset)
  } catch {
    return initialQuranProgress(language, hijriOffset)
  }
}

export function updateQuranDailyGoal(
  progress: QuranProgressState,
  goal: number,
  language: AppLanguage = "en",
  hijriOffset: HijriOffset = 0,
) {
  return updateProgress(progress.last_page_read, 0, progress.logs, language, goal, hijriOffset)
}

export function saveQuranProgress(progress: QuranProgressState) {
  window.localStorage.setItem(QURAN_PROGRESS_STORAGE_KEY, JSON.stringify(progress))
}

export function hasQuranLogToday(progress: QuranProgressState) {
  const today = getRiyadhDateKey()
  return progress.logs.some((log) => log.date === today && log.pages > 0)
}

export function shouldShowQuranEveningNudge(progress: QuranProgressState) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "Asia/Riyadh",
  }).formatToParts(new Date())
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0)

  return hour >= 20 && !hasQuranLogToday(progress)
}

export function formatQuranLogDate(dateKey: string, language: AppLanguage, hijriOffset: HijriOffset = 0) {
  return formatHijriDate(dateFromGregorianKey(dateKey), hijriOffset, language)
}
