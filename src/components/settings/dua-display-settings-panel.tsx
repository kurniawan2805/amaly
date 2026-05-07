import { Eye, EyeOff, RefreshCw, Type } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  loadDuaDisplaySettings,
  saveDuaDisplaySettings,
  duaDisplayModes,
  type DuaDisplayMode,
  type DuaArabicSize,
  type DuaTranslationSize,
  type DuaDisplaySettings,
  defaultDuaDisplaySettings,
} from "@/lib/dua-display-settings"
import type { AppLanguage } from "@/lib/app-settings"
import { cn } from "@/lib/utils"

type DuaDisplaySettingsPanelProps = {
  open: boolean
  onClose: () => void
  onSettingsChange: (settings: DuaDisplaySettings) => void
  language: AppLanguage
  settings: DuaDisplaySettings
}

const copy = {
  en: {
    title: "Dua Display",
    subtitle: "Customize how duas appear on your screen.",
    displayMode: "Display Mode",
    arabicSize: "Arabic Text Size",
    translationSize: "Translation Size",
    visibility: "Show/Hide",
    showTranslation: "Translation",
    showTransliteration: "Transliteration",
    showSource: "Source",
    showBenefit: "Benefit",
    showRepetition: "Repetition",
    reset: "Reset to Default",
    save: "Save Settings",
    cancel: "Cancel",
    modeMinimal: "Minimal",
    modeCompact: "Compact",
    modeStandard: "Standard",
    modeFull: "Full",
    minimalDesc: "Arabic only",
    compactDesc: "Arabic + Translation",
    standardDesc: "All standard info",
    fullDesc: "Everything included",
    sizeXS: "Extra Small",
    sizeSM: "Small",
    sizeMD: "Medium",
    sizeLG: "Large",
    sizeXL: "Extra Large",
    preview: "Preview",
  },
  id: {
    title: "Tampilan Doa",
    subtitle: "Sesuaikan cara doa ditampilkan di layar Anda.",
    displayMode: "Mode Tampilan",
    arabicSize: "Ukuran Teks Arab",
    translationSize: "Ukuran Terjemahan",
    visibility: "Tampilkan/Sembunyikan",
    showTranslation: "Terjemahan",
    showTransliteration: "Transliterasi",
    showSource: "Sumber",
    showBenefit: "Manfaat",
    showRepetition: "Pengulangan",
    reset: "Kembalikan ke Default",
    save: "Simpan Pengaturan",
    cancel: "Batal",
    modeMinimal: "Minimal",
    modeCompact: "Ringkas",
    modeStandard: "Standar",
    modeFull: "Lengkap",
    minimalDesc: "Arab saja",
    compactDesc: "Arab + Terjemahan",
    standardDesc: "Semua info standar",
    fullDesc: "Semua termasuk",
    sizeXS: "Extra Kecil",
    sizeSM: "Kecil",
    sizeMD: "Sedang",
    sizeLG: "Besar",
    sizeXL: "Extra Besar",
    preview: "Pratinjau",
  },
}

const arabicSizeOptions: Array<{ label: string; value: DuaArabicSize; key: keyof typeof copy.en }> = [
  { label: "A--", value: "xs", key: "sizeXS" },
  { label: "A-", value: "sm", key: "sizeSM" },
  { label: "A", value: "md", key: "sizeMD" },
  { label: "A+", value: "lg", key: "sizeLG" },
  { label: "A++", value: "xl", key: "sizeXL" },
]

const translationSizeOptions: Array<{ label: string; value: DuaTranslationSize; key: keyof typeof copy.en }> = [
  { label: "T-", value: "xs", key: "sizeXS" },
  { label: "T", value: "sm", key: "sizeSM" },
  { label: "T+", value: "md", key: "sizeMD" },
  { label: "T++", value: "lg", key: "sizeLG" },
]

const modeOptions: Array<{ mode: DuaDisplayMode; key: keyof typeof copy.en; descKey: keyof typeof copy.en }> = [
  { mode: "minimal", key: "modeMinimal", descKey: "minimalDesc" },
  { mode: "compact", key: "modeCompact", descKey: "compactDesc" },
  { mode: "standard", key: "modeStandard", descKey: "standardDesc" },
  { mode: "full", key: "modeFull", descKey: "fullDesc" },
]

export function DuaDisplaySettingsPanel({ open, onClose, onSettingsChange, language, settings: parentSettings }: DuaDisplaySettingsPanelProps) {
  const [settings, setSettings] = useState<DuaDisplaySettings>(parentSettings)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const t = copy[language]

  useEffect(() => {
    if (open) {
      setSettings(parentSettings)
      setUnsavedChanges(false)
    }
  }, [open, parentSettings])

  const handleModeChange = (mode: DuaDisplayMode) => {
    const modeSettings = duaDisplayModes[mode]
    setSettings(modeSettings)
    setUnsavedChanges(true)
  }

  const handleArabicSizeChange = (size: DuaArabicSize) => {
    setSettings((prev) => ({ ...prev, arabicSize: size }))
    setUnsavedChanges(true)
  }

  const handleTranslationSizeChange = (size: DuaTranslationSize) => {
    setSettings((prev) => ({ ...prev, translationSize: size }))
    setUnsavedChanges(true)
  }

  const handleToggleVisibility = (key: keyof Omit<DuaDisplaySettings, "arabicSize" | "mode">) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setUnsavedChanges(true)
  }

  const handleReset = () => {
    setSettings(defaultDuaDisplaySettings)
    setUnsavedChanges(true)
  }

  const handleSave = () => {
    saveDuaDisplaySettings(settings)
    onSettingsChange(settings)
    setUnsavedChanges(false)
    onClose()
  }

  const arabicSizeClasses: Record<DuaArabicSize, string> = {
    xs: "text-xl leading-[2.3]",
    sm: "text-2xl leading-[2.4]",
    md: "text-3xl leading-[2.5]",
    lg: "text-4xl leading-[2.6]",
    xl: "text-5xl leading-[2.7]",
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="max-w-md overflow-y-auto px-4">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.subtitle}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-6">
          {/* Display Mode */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold leading-none">{t.displayMode}</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {modeOptions.map(({ mode, key, descKey }) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={cn(
                    "rounded-lg border-2 px-3 py-2.5 text-left transition-all duration-200",
                    settings.mode === mode
                      ? "border-sage bg-sage-pale/50 shadow-sm"
                      : "border-border bg-card hover:border-sage/50 hover:bg-sage-pale/10",
                  )}
                  type="button"
                >
                  <span className="block text-xs font-bold uppercase tracking-wide">{t[key]}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{t[descKey]}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Text Sizes */}
          <section className="space-y-4">
            {/* Arabic Size */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t.arabicSize}</h3>
              <div className="flex gap-1 rounded-lg border border-border bg-surface-container-low p-1">
                {arabicSizeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleArabicSizeChange(value)}
                    className={cn(
                      "flex-1 rounded py-1.5 text-xs font-bold transition-all duration-200",
                      settings.arabicSize === value
                        ? "bg-sage text-white shadow-soft"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    type="button"
                    title={t[arabicSizeOptions.find((o) => o.value === value)?.key as keyof typeof t]}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={cn("rounded bg-sage-pale/20 px-3 py-2 text-right text-sage-deep font-arabic", arabicSizeClasses[settings.arabicSize])} dir="rtl" lang="ar">
                الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
              </div>
            </div>

            {/* Translation Size */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t.translationSize}</h3>
              <div className="flex gap-1 rounded-lg border border-border bg-surface-container-low p-1">
                {translationSizeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleTranslationSizeChange(value)}
                    className={cn(
                      "flex-1 rounded py-1.5 text-xs font-bold transition-all duration-200",
                      settings.translationSize === value
                        ? "bg-sage text-white shadow-soft"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    type="button"
                    title={t[translationSizeOptions.find((o) => o.value === value)?.key as keyof typeof t]}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                className={cn("rounded bg-sage-pale/20 px-3 py-2 text-foreground", {
                  "text-xs leading-5": settings.translationSize === "xs",
                  "text-sm leading-6": settings.translationSize === "sm",
                  "text-base leading-7": settings.translationSize === "md",
                  "text-lg leading-8": settings.translationSize === "lg",
                })}
              >
                All praise is due to Allah, Lord of the worlds.
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Visibility Toggles */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">{t.visibility}</h3>
            <div className="space-y-2">
              {(["showTranslation", "showTransliteration", "showSource", "showBenefit", "showRepetition"] as const).map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => handleToggleVisibility(key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-200",
                      settings[key]
                        ? "border-sage/30 bg-sage-pale/20 hover:bg-sage-pale/30"
                        : "border-border bg-card hover:border-border/50 hover:bg-muted/30",
                    )}
                    type="button"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background">
                      {settings[key] ? (
                        <Eye className="h-3.5 w-3.5 text-sage" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </span>
                    <span className="flex-1 text-left text-sm font-medium">{t[key as keyof typeof t]}</span>
                    {settings[key] && <span className="h-2 w-2 rounded-full bg-sage" />}
                  </button>
                ),
              )}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              {t.reset}
            </Button>
            <Button size="sm" onClick={handleSave} type="button" className="flex-1">
              {t.save}
              {unsavedChanges && <span className="ml-1 text-xs">•</span>}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
