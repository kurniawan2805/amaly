import { BookOpen, ChevronDown, Plus, Save, Sparkles, Sun, Trash2, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type HabitDefinition, type HabitTiming, type PrayerAnchor } from "@/lib/app-settings"
import { cn } from "@/lib/utils"
import { prayerAnchors, useAppStore } from "@/stores/app-store"

type HabitSettingsPanelProps = {
  open: boolean
  onClose: () => void
}

const copy = {
  en: {
    title: "Habits",
    subtitle: "Edit your daily rhythm. Save when everything feels right.",
    addHabit: "Add Habit",
    cancel: "Cancel",
    save: "Save",
    unsaved: "Unsaved changes",
    label: "Name",
    category: "Category",
    enabled: "Enabled",
    close: "Close habit settings",
    plannedDays: "Frequency",
    timing: "Timing",
    fixed: "Fixed Time",
    prayer: "Prayer Anchor",
    time: "Time",
    offset: "Offset",
    delete: "Delete",
  },
  id: {
    title: "Kebiasaan",
    subtitle: "Atur rutinitas harianmu. Simpan saat sudah sesuai.",
    addHabit: "Tambah Kebiasaan",
    cancel: "Batal",
    save: "Simpan",
    unsaved: "Perubahan belum disimpan",
    label: "Nama",
    category: "Kategori",
    enabled: "Aktif",
    close: "Tutup pengaturan habit",
    plannedDays: "Frekuensi",
    timing: "Waktu",
    fixed: "Jam Tetap",
    prayer: "Patokan Shalat",
    time: "Jam",
    offset: "Jarak",
    delete: "Hapus",
  },
}

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]
const categoryOptions = ["Spiritual", "Self-Care", "Family", "Household", "Learning"]
const frequencyPresets = [
  { label: "Daily", days: [true, true, true, true, true, true, true] },
  { label: "Friday", days: [false, false, false, false, false, true, false] },
  { label: "Weekdays", days: [true, true, true, true, true, false, false] },
  { label: "Weekend", days: [false, false, false, false, false, true, true] },
]
const prayerOffsetOptions = [-30, -15, -10, 0, 10, 15, 30]

function makeDraftHabit(): HabitDefinition {
  return {
    id: `habit-${Date.now()}`,
    label: "New Habit",
    category: "Spiritual",
    scheduleLabel: "Anytime",
    plannedDays: [true, true, true, true, true, false, false],
    enabled: true,
    timing: { mode: "fixed", time: "" },
  }
}

function timingLabel(timing: HabitTiming, fallback: string) {
  if (timing.mode === "fixed") return timing.time || fallback || "Anytime"
  const prefix = timing.offsetMinutes === 0 ? "At" : timing.offsetMinutes > 0 ? `${timing.offsetMinutes} min after` : `${Math.abs(timing.offsetMinutes)} min before`
  return `${prefix} ${timing.prayer}`
}

function normalizeHabit(habit: HabitDefinition): HabitDefinition {
  return {
    ...habit,
    label: habit.label.trim(),
    category: habit.category.trim() || "Spiritual",
    plannedDays: habit.plannedDays.length === 7 ? habit.plannedDays : [true, true, true, true, true, false, false],
    scheduleLabel: timingLabel(habit.timing, habit.scheduleLabel),
  }
}

function formatPrayer(prayer: PrayerAnchor) {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1)
}

function formatPrayerOffset(offset: number, prayer: PrayerAnchor) {
  const anchor = formatPrayer(prayer)
  if (offset === 0) return `During ${anchor}`
  return offset > 0 ? `${offset} mins after ${anchor}` : `${Math.abs(offset)} mins before ${anchor}`
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
  if (mode === current.mode) return current
  return mode === "fixed" ? { mode: "fixed", time: "" } : { mode: "prayer", prayer: "fajr", offsetMinutes: 0 }
}

function prayerTiming(timing: HabitTiming) {
  return timing.mode === "prayer" ? timing : { mode: "prayer" as const, prayer: "fajr" as const, offsetMinutes: 0 }
}

export function HabitSettingsPanel({ open, onClose }: HabitSettingsPanelProps) {
  const settings = useAppStore((state) => state.settings)
  const setHabits = useAppStore((state) => state.setHabits)
  const [draftHabits, setDraftHabits] = useState<HabitDefinition[]>(settings.habits)
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null)
  const habitInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const t = copy[settings.language]
  const normalizedDraft = useMemo(() => draftHabits.map(normalizeHabit), [draftHabits])
  const hasChanges = JSON.stringify(normalizedDraft) !== JSON.stringify(settings.habits)
  const hasInvalidHabit = normalizedDraft.some((habit) => !habit.label)

  useEffect(() => {
    if (open) {
      setDraftHabits(settings.habits)
      setExpandedHabitId(null)
    }
  }, [open, settings.habits])

  function updateDraftHabit(id: string, patch: Partial<HabitDefinition>) {
    setDraftHabits((habits) => habits.map((habit) => (habit.id === id ? normalizeHabit({ ...habit, ...patch }) : habit)))
  }

  function setDraftHabitFrequency(id: string, plannedDays: boolean[]) {
    updateDraftHabit(id, { plannedDays: plannedDays.length === 7 ? plannedDays : [true, true, true, true, true, false, false] })
  }

  function createHabit() {
    const habit = makeDraftHabit()
    setDraftHabits((habits) => [habit, ...habits])
    setExpandedHabitId(habit.id)
    window.setTimeout(() => {
      habitInputRefs.current[habit.id]?.focus()
      habitInputRefs.current[habit.id]?.select()
    }, 0)
  }

  function saveDraft() {
    if (hasInvalidHabit) return
    setHabits(normalizedDraft)
    onClose()
  }

  function close(openState: boolean) {
    if (!openState) onClose()
  }

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent closeLabel={t.close}>
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.subtitle}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-2xl font-semibold text-primary">{t.title}</h3>
            <Button className="shrink-0" onClick={createHabit} size="sm" type="button" variant="outline">
              <Plus className="h-4 w-4" />
              {t.addHabit}
            </Button>
          </div>

          {hasChanges ? <p className="mt-2 text-sm font-semibold text-muted-foreground">{t.unsaved}</p> : null}

          <div className="mt-5 flex flex-col gap-3">
            {draftHabits.map((habit) => (
              <div className="overflow-hidden rounded-xl border border-sage/15 bg-card shadow-[0_8px_24px_rgba(0,0,0,0.03)]" key={habit.id}>
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-sage-pale/15"
                  onClick={() => setExpandedHabitId((current) => (current === habit.id ? null : habit.id))}
                  type="button"
                >
                  <HabitMark habit={habit} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{habit.label || "Untitled habit"}</p>
                    <p className="truncate text-xs font-semibold text-muted-foreground">{habit.scheduleLabel}</p>
                  </div>
                  <FrequencyDots plannedDays={habit.plannedDays} />
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", expandedHabitId === habit.id && "rotate-180")} />
                </button>

                {expandedHabitId === habit.id ? (
                  <div className="border-t border-sage/10 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <input
                          checked={habit.enabled}
                          className="h-5 w-5 accent-sage"
                          onChange={(event) => updateDraftHabit(habit.id, { enabled: event.target.checked })}
                          type="checkbox"
                        />
                        <span>{t.enabled}</span>
                      </label>
                      <Button
                        aria-label={`${t.delete} ${habit.label}`}
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDraftHabits((habits) => habits.filter((item) => item.id !== habit.id))}
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
                          onChange={(event) => updateDraftHabit(habit.id, { label: event.target.value })}
                          ref={(element) => {
                            habitInputRefs.current[habit.id] = element
                          }}
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
                              onClick={() => updateDraftHabit(habit.id, { category })}
                              type="button"
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                        <input
                          className="mt-2 h-10 w-full rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-sage"
                          onChange={(event) => updateDraftHabit(habit.id, { category: event.target.value })}
                          placeholder={t.category}
                          value={habit.category}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.timing}</p>
                      <Tabs value={habit.timing.mode} onValueChange={(value) => updateDraftHabit(habit.id, { timing: timingFromMode(value as "fixed" | "prayer", habit.timing) })}>
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
                            onChange={(event) => updateDraftHabit(habit.id, { timing: { mode: "fixed", time: event.target.value } })}
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
                              onChange={(event) => updateDraftHabit(habit.id, { timing: { ...prayerTiming(habit.timing), prayer: event.target.value as PrayerAnchor } })}
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
                            <select
                              className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                              onChange={(event) => updateDraftHabit(habit.id, { timing: { ...prayerTiming(habit.timing), offsetMinutes: Number(event.target.value) } })}
                              value={prayerTiming(habit.timing).offsetMinutes}
                            >
                              {!prayerOffsetOptions.includes(prayerTiming(habit.timing).offsetMinutes) ? (
                                <option value={prayerTiming(habit.timing).offsetMinutes}>
                                  {formatPrayerOffset(prayerTiming(habit.timing).offsetMinutes, prayerTiming(habit.timing).prayer)}
                                </option>
                              ) : null}
                              {prayerOffsetOptions.map((offset) => (
                                <option key={offset} value={offset}>
                                  {formatPrayerOffset(offset, prayerTiming(habit.timing).prayer)}
                                </option>
                              ))}
                            </select>
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
                            onClick={() => setDraftHabitFrequency(habit.id, preset.days)}
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
                            onClick={() => setDraftHabitFrequency(habit.id, habit.plannedDays.map((day, dayIndex) => (dayIndex === index ? !day : day)))}
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
        </div>

        <div className="border-t border-sage/10 bg-background/95 px-6 py-4 backdrop-blur">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onClose} type="button" variant="outline">
              <X className="h-4 w-4" />
              {t.cancel}
            </Button>
            <Button disabled={!hasChanges || hasInvalidHabit} onClick={saveDraft} type="button">
              <Save className="h-4 w-4" />
              {t.save}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
