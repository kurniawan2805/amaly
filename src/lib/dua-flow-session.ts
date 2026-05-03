export const DUA_FLOW_SESSION_STORAGE_KEY = "amaly.dua-flow-session.v1"

export type DuaFlowSession = {
  currentIndex: number
  currentCount: number
  completed: boolean
  updatedAt: string
}

export type DuaFlowSessionState = Record<string, DuaFlowSession>

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
    return stored ? normalizeSession(JSON.parse(stored)) : {}
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
    },
  })
}
