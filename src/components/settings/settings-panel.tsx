import { BookOpen, ChevronDown, Moon, Plus, Sparkles, Sun, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type AppLanguage, type AppTheme, type HabitDefinition, type HabitTiming, type HijriOffset, type PrayerAnchor } from "@/lib/app-settings"
import { cn } from "@/lib/utils"
import { prayerAnchors, useAppStore } from "@/stores/app-store"

type SettingsPanelProps = {
  open: boolean
  onClose: () => void
}

const copy = {
  en: {
    title: "Settings",
    subtitle: "Customize your spiritual sanctuary.",
    language: "Language",
    theme: "Theme",
    hijriOffset: "Hijri Offset",
    day: "Day",
    dark: "Dark",
    habits: "Habits",
    addHabit: "Add Habit",
    label: "Name",
    category: "Category",
    enabled: "Enabled",
    close: "Close settings",
    plannedDays: "Frequency",
    timing: "Timing",
    fixed: "Fixed Time",
    prayer: "Prayer Anchor",
    time: "Time",
    offset: "Offset",
    delete: "Delete",
    deleteConfirm: (habit: string) => `Delete ${habit}?`,
  },
  id: {
    title: "Pengaturan",
    subtitle: "Atur rutinitas ibadahmu dengan tenang.",
    language: "Bahasa",
    theme: "Tema",
    hijriOffset: "Koreksi Hijri",
    day: "Terang",
    dark: "Gelap",
    habits: "Kebiasaan",
    addHabit: "Tambah Kebiasaan",
    label: "Nama",
    category: "Kategori",
    enabled: "Aktif",
    close: "Tutup pengaturan",
    plannedDays: "Frekuensi",
    timing: "Waktu",
    fixed: "Jam Tetap",
    prayer: "Patokan Shalat",
    time: "Jam",
    offset: "Jarak",
    delete: "Hapus",
    deleteConfirm: (habit: string) => `Hapus ${habit}?`,
  },
}

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]
const offsetOptions: HijriOffset[] = [-2, -1, 0, 1, 2]
const categoryOptions = ["Spiritual", "Self-Care", "Family", "Household", "Learning"]
const frequencyPresets = [
  { label: "Daily", days: [true, true, true, true, true, true, true] },
  { label: "Weekdays", days: [true, true, true, true, true, false, false] },
  { label: "Weekend", days: [false, false, false, false, false, true, true] },
  { label: "Friday", days: [false, false, false, false, false, true, false] },
]

function formatOffset(offset: HijriOffset) {
  return offset > 0 ? `+${offset}` : String(offset)
}

function formatPrayer(prayer: PrayerAnchor) {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1)
}

function plannedDaysMatch(a: boolean[], b: boolean[]) {
  return a.length === b.length && a.every((active, index) => active === b[index])
}

function HabitMark({ habit }: { habit: HabitDefinition }) {
  const label = habit.label.toLowerCase()
  const Icon = label.includes("quran") || label.includes("surah") ? BookOpen : label.includes("dhikr") ? Sun : Sparkles
  const color = label.includes("quran")
    ? "bg-sage-pale text-sage-deep dark:bg-sage/20 dark:text-sage-pale"
    : label.includes("dhikr")
      ? "bg-blush-pale text-accent-foreground dark:bg-blush/20 dark:text-blush-pale"
      : "bg-sky-pale text-secondary dark:bg-sage-muted/25 dark:text-sage-pale"

  return (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", color)}>
      <Icon className="h-5 w-5" />
    </span>
  )
}

function FrequencyDots({ plannedDays }: { plannedDays: boolean[] }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
      {plannedDays.map((active, index) => (
        <span
          className={active ? "h-2 w-2 rounded-full bg-sage-deep dark:bg-sage-pale" : "h-2 w-2 rounded-full bg-surface-container-highest"}
          key={index}
        />
      ))}
    </div>
  )
}

function timingFromMode(mode: "fixed" | "prayer", current: HabitTiming): HabitTiming {
  if (mode === current.mode) {
    return current
  }

  return mode === "fixed" ? { mode: "fixed", time: "" } : { mode: "prayer", prayer: "fajr", offsetMinutes: 0 }
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const settings = useAppStore((state) => state.settings)
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const setTheme = useAppStore((state) => state.setTheme)
  const setHijriOffset = useAppStore((state) => state.setHijriOffset)
  const addHabit = useAppStore((state) => state.addHabit)
  const updateHabit = useAppStore((state) => state.updateHabit)
  const deleteHabit = useAppStore((state) => state.deleteHabit)
  const setHabitFrequency = useAppStore((state) => state.setHabitFrequency)
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null)
  const t = copy[settings.language]

  function close(openState: boolean) {
    setSettingsOpen(openState)
    if (!openState) {
      onClose()
      setExpandedHabitId(null)
    }
  }

  function updateTiming(habit: HabitDefinition, timing: HabitTiming) {
    updateHabit(habit.id, { timing })
  }

  function updatePrayerAnchor(habit: HabitDefinition, prayer: PrayerAnchor) {
    const current = habit.timing.mode === "prayer" ? habit.timing : { mode: "prayer" as const, prayer: "fajr" as const, offsetMinutes: 0 }
    updateTiming(habit, { ...current, prayer })
  }

  function updatePrayerOffset(habit: HabitDefinition, offsetMinutes: number) {
    const current = habit.timing.mode === "prayer" ? habit.timing : { mode: "prayer" as const, prayer: "fajr" as const, offsetMinutes: 0 }
    updateTiming(habit, { ...current, offsetMinutes })
  }

  function confirmDelete(habit: HabitDefinition) {
    if (window.confirm(t.deleteConfirm(habit.label))) {
      deleteHabit(habit.id)
    }
  }

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent closeLabel={t.close}>
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.subtitle}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-8">
            <section className="grid gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t.language}</p>
                <Tabs value={settings.language} onValueChange={(value) => setLanguage(value as AppLanguage)}>
                  <TabsList className="mt-2 flex w-full">
                    <TabsTrigger value="en">EN</TabsTrigger>
                    <TabsTrigger value="id">ID</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t.theme}</p>
                <Tabs value={settings.theme} onValueChange={(value) => setTheme(value as AppTheme)}>
                  <TabsList className="mt-2 flex w-full">
                    <TabsTrigger value="day">
                      <Sun className="h-4 w-4" />
                      {t.day}
                    </TabsTrigger>
                    <TabsTrigger value="dark">
                      <Moon className="h-4 w-4" />
                      {t.dark}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t.hijriOffset}</p>
                <ToggleGroup aria-label={t.hijriOffset} className="mt-2 flex w-full">
                  {offsetOptions.map((offset) => (
                    <ToggleGroupItem
                      className="min-w-12 data-[state=active]:bg-sage"
                      key={offset}
                      onClick={() => setHijriOffset(offset)}
                      pressed={settings.hijriOffset === offset}
                    >
                      {formatOffset(offset)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-2xl font-semibold text-primary">{t.habits}</h3>
                <Button
                  className="shrink-0"
                  onClick={() => {
                    addHabit()
                    window.setTimeout(() => setExpandedHabitId(useAppStore.getState().settings.habits.at(-1)?.id ?? null), 0)
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  {t.addHabit}
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {settings.habits.map((habit) => (
                  <div
                    className="overflow-hidden rounded-xl border border-sage/15 bg-card shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
                    key={habit.id}
                  >
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-sage-pale/15"
                      onClick={() => setExpandedHabitId((current) => (current === habit.id ? null : habit.id))}
                      type="button"
                    >
                      <HabitMark habit={habit} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{habit.label}</p>
                        <p className="truncate text-xs font-semibold text-muted-foreground">{habit.scheduleLabel}</p>
                      </div>
                      <FrequencyDots plannedDays={habit.plannedDays} />
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition",
                          expandedHabitId === habit.id && "rotate-180",
                        )}
                      />
                    </button>

                    {expandedHabitId === habit.id ? (
                      <div className="border-t border-sage/10 p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                            <input
                              checked={habit.enabled}
                              className="h-5 w-5 accent-sage"
                              onChange={(event) => updateHabit(habit.id, { enabled: event.target.checked })}
                              type="checkbox"
                            />
                            <span>{t.enabled}</span>
                          </label>
                          <Button
                            aria-label={`${t.delete} ${habit.label}`}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => confirmDelete(habit)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3">
                          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            {t.label}
                            <input
                              className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                              onChange={(event) => updateHabit(habit.id, { label: event.target.value })}
                              value={habit.label}
                            />
                          </label>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.category}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {categoryOptions.map((category) => (
                                <button
                                  className={cn(
                                    "rounded-full border border-sage/15 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-sage-pale/20",
                                    habit.category === category && "border-sage bg-sage text-white hover:bg-sage",
                                  )}
                                  key={category}
                                  onClick={() => updateHabit(habit.id, { category })}
                                  type="button"
                                >
                                  {category}
                                </button>
                              ))}
                            </div>
                            <input
                              className="mt-2 h-10 w-full rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-sage"
                              onChange={(event) => updateHabit(habit.id, { category: event.target.value })}
                              placeholder={t.category}
                              value={habit.category}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.timing}</p>
                          <Tabs
                            value={habit.timing.mode}
                            onValueChange={(value) => updateTiming(habit, timingFromMode(value as "fixed" | "prayer", habit.timing))}
                          >
                            <TabsList className="mt-2 flex w-full">
                              <TabsTrigger value="fixed">{t.fixed}</TabsTrigger>
                              <TabsTrigger value="prayer">{t.prayer}</TabsTrigger>
                            </TabsList>
                          </Tabs>

                          {habit.timing.mode === "fixed" ? (
                            <label className="mt-3 flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                              {t.time}
                              <input
                                className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                                onChange={(event) => updateTiming(habit, { mode: "fixed", time: event.target.value })}
                                type="time"
                                value={habit.timing.time}
                              />
                            </label>
                          ) : (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                {t.prayer}
                                <select
                                  className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                                  onChange={(event) => updatePrayerAnchor(habit, event.target.value as PrayerAnchor)}
                                  value={habit.timing.prayer}
                                >
                                  {prayerAnchors().map((prayer) => (
                                    <option key={prayer} value={prayer}>
                                      {formatPrayer(prayer)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                {t.offset}
                                <input
                                  className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                                  max={120}
                                  min={-120}
                                  onChange={(event) => updatePrayerOffset(habit, Number(event.target.value))}
                                  step={5}
                                  type="number"
                                  value={habit.timing.offsetMinutes}
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.plannedDays}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {frequencyPresets.map((preset) => (
                              <button
                                className={cn(
                                  "rounded-full border border-sage/15 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-sage-pale/20",
                                  plannedDaysMatch(habit.plannedDays, preset.days) && "border-sage bg-sage text-white hover:bg-sage",
                                )}
                                key={preset.label}
                                onClick={() => setHabitFrequency(habit.id, preset.days)}
                                type="button"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2">
                            {habit.plannedDays.map((active, index) => (
                              <button
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground transition",
                                  active && "bg-sage text-white",
                                )}
                                key={`${habit.id}-${index}`}
                                onClick={() =>
                                  setHabitFrequency(
                                    habit.id,
                                    habit.plannedDays.map((day, dayIndex) => (dayIndex === index ? !day : day)),
                                  )
                                }
                                type="button"
                              >
                                {dayLabels[index]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
