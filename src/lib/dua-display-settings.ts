export const DUA_DISPLAY_SETTINGS_STORAGE_KEY = "amaly.dua-display-settings.v1"

export type DuaArabicSize = "xs" | "sm" | "md" | "lg" | "xl"

export type DuaDisplaySettings = {
  arabicSize: DuaArabicSize
}

export const defaultDuaDisplaySettings: DuaDisplaySettings = {
  arabicSize: "md",
}

const arabicSizes = new Set<DuaArabicSize>(["xs", "sm", "md", "lg", "xl"])

function normalizeDuaDisplaySettings(value: unknown): DuaDisplaySettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return defaultDuaDisplaySettings
  }

  const candidate = value as Partial<DuaDisplaySettings>
  return {
    arabicSize: candidate.arabicSize && arabicSizes.has(candidate.arabicSize) ? candidate.arabicSize : defaultDuaDisplaySettings.arabicSize,
  }
}

export function loadDuaDisplaySettings(): DuaDisplaySettings {
  if (typeof window === "undefined") {
    return defaultDuaDisplaySettings
  }

  try {
    const stored = window.localStorage.getItem(DUA_DISPLAY_SETTINGS_STORAGE_KEY)
    return stored ? normalizeDuaDisplaySettings(JSON.parse(stored)) : defaultDuaDisplaySettings
  } catch {
    return defaultDuaDisplaySettings
  }
}

export function saveDuaDisplaySettings(settings: DuaDisplaySettings) {
  window.localStorage.setItem(DUA_DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeDuaDisplaySettings(settings)))
}
