export const DUA_FAVORITES_STORAGE_KEY = "amaly.dua-favorites.v1"

export type DuaFavoritesState = {
  ids: string[]
}

export const defaultDuaFavoritesState: DuaFavoritesState = {
  ids: [],
}

function normalizeDuaFavorites(value: unknown): DuaFavoritesState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return defaultDuaFavoritesState
  }

  const candidate = value as Partial<DuaFavoritesState>
  return {
    ids: Array.isArray(candidate.ids) ? Array.from(new Set(candidate.ids.filter((id): id is string => typeof id === "string" && Boolean(id)))) : [],
  }
}

export function loadDuaFavorites(): DuaFavoritesState {
  if (typeof window === "undefined") {
    return defaultDuaFavoritesState
  }

  try {
    const stored = window.localStorage.getItem(DUA_FAVORITES_STORAGE_KEY)
    return stored ? normalizeDuaFavorites(JSON.parse(stored)) : defaultDuaFavoritesState
  } catch {
    return defaultDuaFavoritesState
  }
}

export function saveDuaFavorites(state: DuaFavoritesState) {
  window.localStorage.setItem(DUA_FAVORITES_STORAGE_KEY, JSON.stringify(normalizeDuaFavorites(state)))
}

export function isDuaFavorite(state: DuaFavoritesState, id: string) {
  return state.ids.includes(id)
}

export function toggleDuaFavorite(state: DuaFavoritesState, id: string): DuaFavoritesState {
  return state.ids.includes(id) ? { ids: state.ids.filter((item) => item !== id) } : { ids: [...state.ids, id] }
}
