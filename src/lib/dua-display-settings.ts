export const DUA_DISPLAY_SETTINGS_STORAGE_KEY = "amaly.dua-display-settings.v2"

export type DuaArabicSize = "xs" | "sm" | "md" | "lg" | "xl"
export type DuaTranslationSize = "xs" | "sm" | "md" | "lg"

export type DuaDisplayMode = "minimal" | "compact" | "standard" | "full"

export type DuaDisplaySettings = {
  arabicSize: DuaArabicSize
  translationSize: DuaTranslationSize
  mode: DuaDisplayMode
  showTranslation: boolean
  showTransliteration: boolean
  showSource: boolean
  showBenefit: boolean
  showRepetition: boolean
}

export const defaultDuaDisplaySettings: DuaDisplaySettings = {
  arabicSize: "md",
  translationSize: "sm",
  mode: "standard",
  showTranslation: true,
  showTransliteration: false,
  showSource: true,
  showBenefit: true,
  showRepetition: true,
}

export const duaDisplayModes: Record<DuaDisplayMode, DuaDisplaySettings> = {
  minimal: {
    arabicSize: "sm",
    translationSize: "xs",
    mode: "minimal",
    showTranslation: false,
    showTransliteration: false,
    showSource: false,
    showBenefit: false,
    showRepetition: false,
  },
  compact: {
    arabicSize: "md",
    translationSize: "sm",
    mode: "compact",
    showTranslation: true,
    showTransliteration: false,
    showSource: false,
    showBenefit: false,
    showRepetition: true,
  },
  standard: {
    arabicSize: "md",
    translationSize: "sm",
    mode: "standard",
    showTranslation: true,
    showTransliteration: false,
    showSource: true,
    showBenefit: true,
    showRepetition: true,
  },
  full: {
    arabicSize: "lg",
    translationSize: "md",
    mode: "full",
    showTranslation: true,
    showTransliteration: true,
    showSource: true,
    showBenefit: true,
    showRepetition: true,
  },
}

const arabicSizes = new Set<DuaArabicSize>(["xs", "sm", "md", "lg", "xl"])
const translationSizes = new Set<DuaTranslationSize>(["xs", "sm", "md", "lg"])
const displayModes = new Set<DuaDisplayMode>(["minimal", "compact", "standard", "full"])

function normalizeDuaDisplaySettings(value: unknown): DuaDisplaySettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return defaultDuaDisplaySettings
  }

  const candidate = value as Partial<DuaDisplaySettings>
  return {
    arabicSize: candidate.arabicSize && arabicSizes.has(candidate.arabicSize) ? candidate.arabicSize : defaultDuaDisplaySettings.arabicSize,
    translationSize: candidate.translationSize && translationSizes.has(candidate.translationSize) ? candidate.translationSize : defaultDuaDisplaySettings.translationSize,
    mode: candidate.mode && displayModes.has(candidate.mode) ? candidate.mode : defaultDuaDisplaySettings.mode,
    showTranslation: typeof candidate.showTranslation === "boolean" ? candidate.showTranslation : defaultDuaDisplaySettings.showTranslation,
    showTransliteration: typeof candidate.showTransliteration === "boolean" ? candidate.showTransliteration : defaultDuaDisplaySettings.showTransliteration,
    showSource: typeof candidate.showSource === "boolean" ? candidate.showSource : defaultDuaDisplaySettings.showSource,
    showBenefit: typeof candidate.showBenefit === "boolean" ? candidate.showBenefit : defaultDuaDisplaySettings.showBenefit,
    showRepetition: typeof candidate.showRepetition === "boolean" ? candidate.showRepetition : defaultDuaDisplaySettings.showRepetition,
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
