import { BookOpen, GripHorizontal, Moon, Plus, Save, Sun, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AppLanguage, AppSettings, AppTheme, HabitDefinition, HabitSection, HijriOffset } from "@/lib/app-settings"

type SettingsPanelProps = {
  open: boolean
  settings: AppSettings
  onClose: () => void
  onSave: (settings: AppSettings) => void
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
    daily: "Daily Habits",
    friday: "Friday Specials",
    addDaily: "Add Daily",
    addFriday: "Add Friday",
    label: "Name",
    category: "Category",
    schedule: "Schedule",
    enabled: "Enabled",
    save: "Save Changes",
    close: "Close settings",
    plannedDays: "Planned Days",
  },
  id: {
    title: "Pengaturan",
    subtitle: "Atur rutinitas ibadahmu dengan tenang.",
    language: "Bahasa",
    theme: "Tema",
    hijriOffset: "Koreksi Hijri",
    day: "Terang",
    dark: "Gelap",
    daily: "Rutinitas Harian",
    friday: "Spesial Jumat",
    addDaily: "Tambah Harian",
    addFriday: "Tambah Jumat",
    label: "Nama",
    category: "Kategori",
    schedule: "Jadwal",
    enabled: "Aktif",
    save: "Simpan",
    close: "Tutup pengaturan",
    plannedDays: "Hari Terjadwal",
  },
}

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]
const offsetOptions: HijriOffset[] = [-2, -1, 0, 1, 2]

function formatOffset(offset: HijriOffset) {
  return offset > 0 ? `+${offset}` : String(offset)
}

function makeHabit(section: HabitSection): HabitDefinition {
  const id = `${section}-${Date.now()}`
  return {
    id,
    label: section === "daily" ? "New Habit" : "New Friday Habit",
    category: section === "daily" ? "Daily Routine" : "Friday Specials",
    scheduleLabel: section === "daily" ? "Anytime" : "Anytime Friday",
    plannedDays: section === "daily" ? [true, true, true, true, true, false, false] : [false, false, false, false, true, false, false],
    enabled: true,
    section,
  }
}

function HabitMark({ habit }: { habit: HabitDefinition }) {
  const label = habit.label.toLowerCase()
  const Icon = label.includes("quran") || label.includes("surah") ? BookOpen : label.includes("dhikr") ? Sun : Moon
  const color = label.includes("quran")
    ? "bg-sage-pale text-sage-deep"
    : label.includes("dhikr")
      ? "bg-blush-pale text-accent-foreground"
      : "bg-sky-pale text-secondary"

  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
      <Icon className="h-5 w-5" />
    </span>
  )
}

function FrequencyDots({ plannedDays }: { plannedDays: boolean[] }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
      {plannedDays.map((active, index) => (
        <span className={active ? "h-2 w-2 rounded-full bg-sage-deep" : "h-2 w-2 rounded-full bg-surface-container-highest"} key={index} />
      ))}
    </div>
  )
}

export function SettingsPanel({ open, settings, onClose, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings)
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null)
  const t = copy[draft.language]

  useEffect(() => {
    if (open) {
      setDraft(settings)
      setExpandedHabitId(null)
    }
  }, [open, settings])

  function setLanguage(language: AppLanguage) {
    setDraft((current) => ({ ...current, language }))
  }

  function setTheme(theme: AppTheme) {
    setDraft((current) => ({ ...current, theme }))
  }

  function setHijriOffset(hijriOffset: HijriOffset) {
    setDraft((current) => ({ ...current, hijriOffset }))
  }

  function addHabit(section: HabitSection) {
    setDraft((current) => ({
      ...current,
      habits: {
        ...current.habits,
        [section]: [...current.habits[section], makeHabit(section)],
      },
    }))
  }

  function deleteHabit(section: HabitSection, id: string) {
    setDraft((current) => ({
      ...current,
      habits: {
        ...current.habits,
        [section]: current.habits[section].filter((habit) => habit.id !== id),
      },
    }))
  }

  function updateHabit(section: HabitSection, id: string, patch: Partial<HabitDefinition>) {
    setDraft((current) => ({
      ...current,
      habits: {
        ...current.habits,
        [section]: current.habits[section].map((habit) => (habit.id === id ? { ...habit, ...patch } : habit)),
      },
    }))
  }

  function togglePlannedDay(section: HabitSection, habit: HabitDefinition, index: number) {
    updateHabit(section, habit.id, {
      plannedDays: habit.plannedDays.map((active, dayIndex) => (dayIndex === index ? !active : active)),
    })
  }

  function renderSection(section: HabitSection) {
    const title = section === "daily" ? t.daily : t.friday
    const addLabel = section === "daily" ? t.addDaily : t.addFriday

    return (
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-2xl font-semibold text-primary">{title}</h3>
          <Button className="shrink-0" onClick={() => addHabit(section)} size="sm" type="button" variant="outline">
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {draft.habits[section].map((habit) => (
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
              </button>

              {expandedHabitId === habit.id ? (
                <div className="border-t border-sage/10 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <GripHorizontal className="h-5 w-5 shrink-0 text-muted-foreground/45" />
                    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold text-muted-foreground">
                      <span>{t.enabled}</span>
                      <input
                        checked={habit.enabled}
                        className="h-5 w-5 accent-sage"
                        onChange={(event) => updateHabit(section, habit.id, { enabled: event.target.checked })}
                        type="checkbox"
                      />
                    </label>
                    <Button
                      aria-label={`Delete ${habit.label}`}
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteHabit(section, habit.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t.label}
                      <input
                        className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                        onChange={(event) => updateHabit(section, habit.id, { label: event.target.value })}
                        value={habit.label}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t.schedule}
                      <input
                        className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                        onChange={(event) => updateHabit(section, habit.id, { scheduleLabel: event.target.value })}
                        value={habit.scheduleLabel}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:col-span-2">
                      {t.category}
                      <input
                        className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                        onChange={(event) => updateHabit(section, habit.id, { category: event.target.value })}
                        value={habit.category}
                      />
                    </label>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.plannedDays}</p>
                    <div className="mt-2 flex gap-2">
                      {habit.plannedDays.map((active, index) => (
                        <button
                          className={
                            active
                              ? "flex h-8 w-8 items-center justify-center rounded-full bg-sage text-xs font-bold text-white"
                              : "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
                          }
                          key={`${habit.id}-${index}`}
                          onClick={() => togglePlannedDay(section, habit, index)}
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
    )
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label={t.close}
        className="hidden h-full w-full bg-foreground/25 backdrop-blur-sm md:block"
        onClick={onClose}
        type="button"
      />
      <aside className="fixed inset-0 flex flex-col bg-background md:inset-y-0 md:left-auto md:right-0 md:w-[440px] md:border-l md:border-sage/15 md:shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-sage/10 px-6 py-5">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-primary">{t.title}</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{t.subtitle}</p>
          </div>
          <Button aria-label={t.close} onClick={onClose} size="icon" type="button" variant="ghost">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-8">
            <section className="grid gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t.language}</p>
                <ToggleGroup aria-label={t.language} className="mt-2 flex w-full">
                  <ToggleGroupItem onClick={() => setLanguage("en")} pressed={draft.language === "en"}>
                    EN
                  </ToggleGroupItem>
                  <ToggleGroupItem onClick={() => setLanguage("id")} pressed={draft.language === "id"}>
                    ID
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t.theme}</p>
                <ToggleGroup aria-label={t.theme} className="mt-2 flex w-full">
                  <ToggleGroupItem onClick={() => setTheme("day")} pressed={draft.theme === "day"}>
                    <Sun className="h-4 w-4" />
                    {t.day}
                  </ToggleGroupItem>
                  <ToggleGroupItem onClick={() => setTheme("dark")} pressed={draft.theme === "dark"}>
                    <Moon className="h-4 w-4" />
                    {t.dark}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t.hijriOffset}</p>
                <ToggleGroup aria-label={t.hijriOffset} className="mt-2 flex w-full">
                  {offsetOptions.map((offset) => (
                    <ToggleGroupItem key={offset} onClick={() => setHijriOffset(offset)} pressed={draft.hijriOffset === offset}>
                      {formatOffset(offset)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </section>

            {renderSection("daily")}
            {renderSection("friday")}
          </div>
        </div>

        <div className="border-t border-sage/10 bg-background px-6 py-4">
          <Button className="w-full" onClick={() => onSave(draft)} type="button">
            <Save className="h-4 w-4" />
            {t.save}
          </Button>
        </div>
      </aside>
    </div>
  )
}
