import type { HijriOffset } from "@/lib/app-settings"
import { addGregorianDays, dateFromGregorianKey, getHijriParts } from "@/lib/hijri-date"

export const CYCLE_STORAGE_KEY = "amaly.cycle.v1"

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulation" | "Luteal"
export type QadhaUpdateStatus = "none" | "pending" | "added" | "ignored"

export type CycleLog = {
  id: string
  startDate: string
  endDate: string
  symptoms: string[]
  qadhaOverlapDays: number
  qadhaUpdateStatus: QadhaUpdateStatus
}

export type CycleState = {
  settings: {
    avgCycleLength: number
    privacyEnabled: boolean
  }
  activePeriod: { startDate: string } | null
  currentSymptoms: string[]
  logs: CycleLog[]
}

type LegacyCycleLog = {
  id: string
  startDate: string
  endDate: string
  qadhaAdded: number
}

export const defaultCycleState: CycleState = {
  settings: {
    avgCycleLength: 28,
    privacyEnabled: true,
  },
  activePeriod: null,
  currentSymptoms: [],
  logs: [],
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function daysBetween(startDate: string, endDate: string) {
  const start = dateFromGregorianKey(startDate)
  const end = dateFromGregorianKey(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000)
}

function isValidDateRange(startDate: string, endDate: string) {
  const start = dateFromGregorianKey(startDate)
  const end = dateFromGregorianKey(endDate)
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end
}

function normalizeAvgCycleLength(value: unknown) {
  return Math.max(21, Math.min(40, typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 28))
}

function normalizeSymptoms(value: unknown) {
  return Array.isArray(value) ? value.filter((symptom): symptom is string => typeof symptom === "string") : []
}

function normalizeStatus(value: unknown): QadhaUpdateStatus {
  return value === "pending" || value === "added" || value === "ignored" || value === "none" ? value : "none"
}

function normalizeLog(value: Partial<CycleLog>): CycleLog | null {
  if (!value.startDate || !value.endDate) {
    return null
  }

  return {
    id: typeof value.id === "string" && value.id ? value.id : `cycle-${value.startDate}-${value.endDate}`,
    startDate: value.startDate,
    endDate: value.endDate,
    symptoms: normalizeSymptoms(value.symptoms),
    qadhaOverlapDays:
      typeof value.qadhaOverlapDays === "number" && Number.isFinite(value.qadhaOverlapDays)
        ? Math.max(0, Math.round(value.qadhaOverlapDays))
        : 0,
    qadhaUpdateStatus: normalizeStatus(value.qadhaUpdateStatus),
  }
}

function migrateLegacyLogs(legacyLogs: LegacyCycleLog[] = []): CycleLog[] {
  return legacyLogs.map((log) => ({
    id: log.id,
    startDate: log.startDate,
    endDate: log.endDate,
    symptoms: [],
    qadhaOverlapDays: Math.max(0, Math.round(log.qadhaAdded ?? 0)),
    qadhaUpdateStatus: log.qadhaAdded > 0 ? "added" : "none",
  }))
}

export function loadCycleState(legacyLogs: LegacyCycleLog[] = []): CycleState {
  if (typeof window === "undefined") {
    return { ...defaultCycleState, logs: migrateLegacyLogs(legacyLogs) }
  }

  try {
    const stored = window.localStorage.getItem(CYCLE_STORAGE_KEY)
    if (!stored) {
      return { ...defaultCycleState, logs: migrateLegacyLogs(legacyLogs) }
    }

    const parsed = JSON.parse(stored) as Partial<CycleState>

    return {
      settings: {
        avgCycleLength: normalizeAvgCycleLength(parsed.settings?.avgCycleLength),
        privacyEnabled:
          typeof parsed.settings?.privacyEnabled === "boolean"
            ? parsed.settings.privacyEnabled
            : defaultCycleState.settings.privacyEnabled,
      },
      activePeriod:
        parsed.activePeriod && typeof parsed.activePeriod.startDate === "string"
          ? { startDate: parsed.activePeriod.startDate }
          : null,
      currentSymptoms: normalizeSymptoms(parsed.currentSymptoms),
      logs: Array.isArray(parsed.logs)
        ? parsed.logs
            .map((log) => normalizeLog(typeof log === "object" && log !== null ? log : {}))
            .filter((log): log is CycleLog => Boolean(log))
        : [],
    }
  } catch {
    return { ...defaultCycleState, logs: migrateLegacyLogs(legacyLogs) }
  }
}

export function saveCycleState(state: CycleState) {
  window.localStorage.setItem(CYCLE_STORAGE_KEY, JSON.stringify(state))
}

export function calculateCyclePhase(dayInCycle: number): CyclePhase {
  if (dayInCycle <= 5) return "Menstrual"
  if (dayInCycle <= 13) return "Follicular"
  if (dayInCycle === 14) return "Ovulation"
  return "Luteal"
}

export function calculateCycleDay(logs: CycleLog[], activePeriod: CycleState["activePeriod"], today = new Date(), avgCycleLength = 28) {
  const latestStart = activePeriod?.startDate ?? [...logs].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]?.startDate

  if (!latestStart) {
    return null
  }

  const elapsed = Math.max(0, daysBetween(latestStart, localDateKey(today)))
  return ((elapsed % avgCycleLength) + 1)
}

export function getNextPeriodDate(lastCycleStart: string | null | undefined, avgCycleLength = 28) {
  if (!lastCycleStart) {
    return null
  }

  return localDateKey(addGregorianDays(dateFromGregorianKey(lastCycleStart), avgCycleLength))
}

export function checkRamadanOverlap(startDate: string, endDate: string, hijriOffset: HijriOffset) {
  const start = dateFromGregorianKey(startDate)
  const end = dateFromGregorianKey(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0
  }

  let cursor = start
  let count = 0

  while (cursor <= end) {
    if (getHijriParts(cursor, hijriOffset).month === 9) {
      count += 1
    }
    cursor = addGregorianDays(cursor, 1)
  }

  return count
}

function createCycleLog(startDate: string, endDate: string, symptoms: string[], hijriOffset: HijriOffset): CycleLog {
  const overlap = checkRamadanOverlap(startDate, endDate, hijriOffset)
  return {
    id: `cycle-${Date.now()}`,
    startDate,
    endDate,
    symptoms,
    qadhaOverlapDays: overlap,
    qadhaUpdateStatus: overlap > 0 ? "pending" : "none",
  }
}

export function startPeriod(state: CycleState, date = localDateKey()): CycleState {
  return {
    ...state,
    activePeriod: { startDate: date },
    currentSymptoms: [],
  }
}

export function endPeriod(state: CycleState, hijriOffset: HijriOffset, date = localDateKey()): CycleState {
  if (!state.activePeriod) {
    return state
  }

  if (!isValidDateRange(state.activePeriod.startDate, date)) {
    return state
  }

  const log = createCycleLog(state.activePeriod.startDate, date, state.currentSymptoms, hijriOffset)

  return {
    ...state,
    activePeriod: null,
    currentSymptoms: [],
    logs: [...state.logs, log],
  }
}

export function saveCycleRange(state: CycleState, input: { startDate: string; endDate: string }, hijriOffset: HijriOffset): CycleState {
  if (!input.startDate || !input.endDate || !isValidDateRange(input.startDate, input.endDate)) {
    return state
  }

  const existing = state.logs.some((log) => log.startDate === input.startDate && log.endDate === input.endDate)
  if (existing) {
    return state
  }

  const log = createCycleLog(input.startDate, input.endDate, state.currentSymptoms, hijriOffset)

  return {
    ...state,
    currentSymptoms: [],
    logs: [...state.logs, log],
  }
}

export function setCycleQadhaStatus(state: CycleState, logId: string, status: QadhaUpdateStatus): CycleState {
  return {
    ...state,
    logs: state.logs.map((log) => (log.id === logId ? { ...log, qadhaUpdateStatus: status } : log)),
  }
}

export function toggleCyclePrivacy(state: CycleState): CycleState {
  return {
    ...state,
    settings: {
      ...state.settings,
      privacyEnabled: !state.settings.privacyEnabled,
    },
  }
}

export function toggleCycleSymptom(state: CycleState, symptomId: string): CycleState {
  const active = state.currentSymptoms.includes(symptomId)

  return {
    ...state,
    currentSymptoms: active
      ? state.currentSymptoms.filter((symptom) => symptom !== symptomId)
      : [...state.currentSymptoms, symptomId],
  }
}

export function getCycleSummary(state: CycleState, today = new Date()) {
  const latestLog = [...state.logs].sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  const latestStart = state.activePeriod?.startDate ?? latestLog?.startDate ?? null
  const dayInCycle = calculateCycleDay(state.logs, state.activePeriod, today, state.settings.avgCycleLength)
  const phase = dayInCycle ? calculateCyclePhase(dayInCycle) : null
  const nextPeriodDate = getNextPeriodDate(latestStart, state.settings.avgCycleLength)

  return {
    dayInCycle,
    phase,
    nextPeriodDate,
    latestLog,
  }
}

function durationLabel(startDate: string, endDate: string) {
  return `${daysBetween(startDate, endDate) + 1} days`
}

export function formatCycleMonthMarkdown(state: CycleState, monthDate = new Date()) {
  const month = monthDate.getMonth()
  const year = monthDate.getFullYear()
  const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate)
  const monthLogs = state.logs.filter((log) => {
    const date = dateFromGregorianKey(log.startDate)
    return date.getMonth() === month && date.getFullYear() === year
  })
  const summary = getCycleSummary(state, monthDate)

  return [
    `# Cycle Log - ${title}`,
    "",
    `- Current phase: ${summary.phase ?? "Not enough data"}`,
    `- Cycle day: ${summary.dayInCycle ?? "Not enough data"}`,
    `- Next period estimate: ${summary.nextPeriodDate ?? "Not enough data"}`,
    "",
    "## Entries",
    ...(monthLogs.length > 0
      ? monthLogs.flatMap((log) => [
          `### ${log.startDate} to ${log.endDate}`,
          `- Duration: ${durationLabel(log.startDate, log.endDate)}`,
          `- Symptoms: ${log.symptoms.length > 0 ? log.symptoms.join(", ") : "None logged"}`,
          `- Qadha status: ${log.qadhaUpdateStatus}`,
          `- Ramadan overlap: ${log.qadhaOverlapDays} days`,
          "",
        ])
      : ["No cycle entries logged this month.", ""]),
  ].join("\n")
}
