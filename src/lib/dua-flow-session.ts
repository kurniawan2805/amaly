export const DUA_FLOW_SESSION_STORAGE_KEY = "amaly.dua-flow-session.v1"

export type DuaFlowSession = {
  currentIndex: number
  currentCount: number
  completed: boolean
  updatedAt: string
  windowKey?: string | null
}

export type DuaFlowSessionState = Record<string, DuaFlowSession>

const dhikrSessionWindows: Record<string, { startMinutes: number; endMinutes: number }> = {
  "morning-dhikr": { startMinutes: 5 * 60 + 10, endMinutes: 11 * 60 + 30 },
  "evening-dhikr": { startMinutes: 16 * 60, endMinutes: 20 * 60 + 30 },
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

export function getDuaFlowWindowKey(categoryId: string, date = new Date()) {
  const window = dhikrSessionWindows[categoryId]
  if (!window) return null

  const minutes = minutesSinceMidnight(date)
  if (minutes < window.startMinutes || minutes > window.endMinutes) {
    return null
  }

  return `${categoryId}:${localDateKey(date)}`
}

function isSessionFresh(categoryId: string, session: DuaFlowSession) {
  if (!dhikrSessionWindows[categoryId]) return true
  return session.windowKey === getDuaFlowWindowKey(categoryId)
}

function normalizeSession(value: unknown): DuaFlowSessionState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([categoryId, session]) => {
      if (typeof session !== "object" || session === null || Array.isArray(session)) {
        return []
      }

      const candidate = session as Partial<DuaFlowSession>
      return [
        [
          categoryId,
            {
              currentIndex: typeof candidate.currentIndex === "number" && Number.isFinite(candidate.currentIndex) ? Math.max(0, Math.floor(candidate.currentIndex)) : 0,
              currentCount: typeof candidate.currentCount === "number" && Number.isFinite(candidate.currentCount) ? Math.max(0, Math.floor(candidate.currentCount)) : 0,
              completed: Boolean(candidate.completed),
              updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
              windowKey: typeof candidate.windowKey === "string" ? candidate.windowKey : null,
            },
          ],
        ]
    }),
  )
}

export function loadDuaFlowSessions(): DuaFlowSessionState {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const stored = window.localStorage.getItem(DUA_FLOW_SESSION_STORAGE_KEY)
    const sessions = stored ? normalizeSession(JSON.parse(stored)) : {}
    return Object.fromEntries(Object.entries(sessions).filter(([categoryId, session]) => isSessionFresh(categoryId, session)))
  } catch {
    return {}
  }
}

export function saveDuaFlowSessions(state: DuaFlowSessionState) {
  window.localStorage.setItem(DUA_FLOW_SESSION_STORAGE_KEY, JSON.stringify(normalizeSession(state)))
}

export function saveDuaFlowSession(categoryId: string, session: Omit<DuaFlowSession, "updatedAt">) {
  const sessions = loadDuaFlowSessions()
  saveDuaFlowSessions({
    ...sessions,
    [categoryId]: {
      ...session,
      updatedAt: new Date().toISOString(),
      windowKey: getDuaFlowWindowKey(categoryId),
    },
  })
}

export function clearDuaFlowSession(categoryId: string) {
  const sessions = loadDuaFlowSessions()
  const nextSessions = { ...sessions }
  delete nextSessions[categoryId]
  saveDuaFlowSessions(nextSessions)
}
