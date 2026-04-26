import type { HijriOffset } from "@/lib/app-settings"
import { addGregorianDays, dateFromGregorianKey, formatGregorianDateKey, formatHijriDate, getHijriParts } from "@/lib/hijri-date"

export const FASTING_STORAGE_KEY = "amaly.fasting.v1"

export type CycleLog = {
  id: string
  startDate: string
  endDate: string
  qadhaAdded: number
}

export type FastingState = {
  remainingQadha: number
  totalQadhaDebt: number
  paidQadha: number
  cycleLogs: CycleLog[]
  sahurReminderDates: string[]
  lastAutoQadhaMessage: string | null
}

export type SunnahFast = {
  dateKey: string
  date: Date
  hijriDate: {
    en: string
    id: string
  }
  labels: string[]
}

export const defaultFastingState: FastingState = {
  remainingQadha: 0,
  totalQadhaDebt: 0,
  paidQadha: 0,
  cycleLogs: [],
  sahurReminderDates: [],
  lastAutoQadhaMessage: null,
}

function normalizeCount(value: unknown) {
  return Math.max(0, typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0)
}

function normalizeCycleLog(value: Partial<CycleLog>): CycleLog | null {
  if (!value.startDate || !value.endDate) {
    return null
  }

  return {
    id: typeof value.id === "string" && value.id ? value.id : `${value.startDate}-${value.endDate}`,
    startDate: value.startDate,
    endDate: value.endDate,
    qadhaAdded: normalizeCount(value.qadhaAdded),
  }
}

export function loadFastingState(): FastingState {
  if (typeof window === "undefined") {
    return defaultFastingState
  }

  try {
    const stored = window.localStorage.getItem(FASTING_STORAGE_KEY)
    if (!stored) {
      return defaultFastingState
    }

    const parsed = JSON.parse(stored) as Partial<FastingState>

    return {
      remainingQadha: normalizeCount(parsed.remainingQadha),
      totalQadhaDebt: normalizeCount(parsed.totalQadhaDebt),
      paidQadha: normalizeCount(parsed.paidQadha),
      cycleLogs: Array.isArray(parsed.cycleLogs)
        ? parsed.cycleLogs
            .map((log) => normalizeCycleLog(typeof log === "object" && log !== null ? log : {}))
            .filter((log): log is CycleLog => Boolean(log))
        : [],
      sahurReminderDates: Array.isArray(parsed.sahurReminderDates)
        ? parsed.sahurReminderDates.filter((date): date is string => typeof date === "string")
        : [],
      lastAutoQadhaMessage: typeof parsed.lastAutoQadhaMessage === "string" ? parsed.lastAutoQadhaMessage : null,
    }
  } catch {
    return defaultFastingState
  }
}

export function saveFastingState(state: FastingState) {
  window.localStorage.setItem(FASTING_STORAGE_KEY, JSON.stringify(state))
}

export function addQadhaDebt(state: FastingState, days = 1): FastingState {
  const added = Math.max(0, Math.round(days))

  return {
    ...state,
    remainingQadha: state.remainingQadha + added,
    totalQadhaDebt: state.totalQadhaDebt + added,
    lastAutoQadhaMessage: null,
  }
}

export function markQadhaPaid(state: FastingState): FastingState {
  if (state.remainingQadha <= 0) {
    return { ...state, lastAutoQadhaMessage: null }
  }

  return {
    ...state,
    remainingQadha: Math.max(0, state.remainingQadha - 1),
    paidQadha: state.paidQadha + 1,
    lastAutoQadhaMessage: null,
  }
}

export function toggleSahurReminder(state: FastingState, dateKey: string): FastingState {
  const active = state.sahurReminderDates.includes(dateKey)

  return {
    ...state,
    sahurReminderDates: active
      ? state.sahurReminderDates.filter((date) => date !== dateKey)
      : [...state.sahurReminderDates, dateKey],
    lastAutoQadhaMessage: null,
  }
}

function countRamadanOverlap(startDate: string, endDate: string, offset: HijriOffset) {
  const start = dateFromGregorianKey(startDate)
  const end = dateFromGregorianKey(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0
  }

  let cursor = start
  let count = 0

  while (cursor <= end) {
    if (getHijriParts(cursor, offset).month === 9) {
      count += 1
    }

    cursor = addGregorianDays(cursor, 1)
  }

  return count
}

export function logCycleForAutoQadha(
  state: FastingState,
  input: { startDate: string; endDate: string },
  offset: HijriOffset,
): FastingState {
  const start = input.startDate
  const end = input.endDate
  const existing = state.cycleLogs.some((log) => log.startDate === start && log.endDate === end)

  if (existing || !start || !end) {
    return { ...state, lastAutoQadhaMessage: null }
  }

  const qadhaAdded = countRamadanOverlap(start, end, offset)
  const log: CycleLog = {
    id: `cycle-${Date.now()}`,
    startDate: start,
    endDate: end,
    qadhaAdded,
  }

  return {
    ...state,
    remainingQadha: state.remainingQadha + qadhaAdded,
    totalQadhaDebt: state.totalQadhaDebt + qadhaAdded,
    cycleLogs: [...state.cycleLogs, log],
    lastAutoQadhaMessage:
      qadhaAdded > 0 ? `MashaAllah, I've added ${qadhaAdded} days to your Qadha debt from Ramadan.` : null,
  }
}

function addSunnahLabel(map: Map<string, SunnahFast>, date: Date, offset: HijriOffset, label: string) {
  const dateKey = formatGregorianDateKey(date)
  const existing = map.get(dateKey)

  if (existing) {
    if (!existing.labels.includes(label)) {
      existing.labels.push(label)
    }
    return
  }

  map.set(dateKey, {
    dateKey,
    date,
    hijriDate: {
      en: formatHijriDate(date, offset, "en"),
      id: formatHijriDate(date, offset, "id"),
    },
    labels: [label],
  })
}

export function getUpcomingSunnahFasts(offset: HijriOffset, startDate = new Date(), limit = 5): SunnahFast[] {
  const fasts = new Map<string, SunnahFast>()

  for (let index = 0; index < 400 && fasts.size < limit + 8; index += 1) {
    const date = addGregorianDays(startDate, index)
    const day = date.getDay()
    const hijri = getHijriParts(date, offset)

    if (day === 1) {
      addSunnahLabel(fasts, date, offset, "Monday Fast")
    }

    if (day === 4) {
      addSunnahLabel(fasts, date, offset, "Thursday Fast")
    }

    if ([13, 14, 15].includes(hijri.day)) {
      addSunnahLabel(fasts, date, offset, "Ayyam al-Bidh")
    }

    if (hijri.month === 12 && hijri.day === 9) {
      addSunnahLabel(fasts, date, offset, "Arafah")
    }

    if (hijri.month === 1 && hijri.day === 9) {
      addSunnahLabel(fasts, date, offset, "Tasu'a")
    }

    if (hijri.month === 1 && hijri.day === 10) {
      addSunnahLabel(fasts, date, offset, "Ashura")
    }
  }

  return Array.from(fasts.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit)
}

export function isNextRamadanWithinDays(offset: HijriOffset, days = 30, startDate = new Date()) {
  for (let index = 0; index <= days; index += 1) {
    const hijri = getHijriParts(addGregorianDays(startDate, index), offset)
    if (hijri.month === 9 && hijri.day === 1) {
      return true
    }
  }

  return false
}
