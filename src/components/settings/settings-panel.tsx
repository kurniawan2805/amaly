import { BookOpen, ChevronDown, Cloud, LogOut, Mail, Moon, Plus, Sparkles, Sun, Trash2, UserRound, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type AppLanguage, type AppTheme, type HabitDefinition, type HabitTiming, type HijriOffset, type PrayerAnchor } from "@/lib/app-settings"
import { isSupabaseConfigured } from "@/lib/supabase-sync"
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
    cloudSync: "Cloud Sync",
    authIntro: "Sign in to sync Quran progress and connect with your partner.",
    email: "Email",
    password: "Password",
    google: "Continue with Google",
    signIn: "Sign In",
    signUp: "Create Account",
    signedIn: "Signed in",
    localMode: "You can keep using Amaly locally without signing in.",
    nickname: "Nickname",
    saveNickname: "Save Nickname",
    signOut: "Sign Out",
    unavailable: "Cloud sync unavailable. Add Supabase env values to enable it.",
    partner: "Partner",
    role: "My Role",
    husband: "Husband",
    wife: "Wife",
    createCode: "Create Code",
    enterCode: "Enter 6-digit code",
    acceptCode: "Connect",
    partnerConnected: "Connected with",
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
    cloudSync: "Sinkron Cloud",
    authIntro: "Masuk untuk sinkron progres Quran dan terhubung dengan pasangan.",
    email: "Email",
    password: "Password",
    google: "Lanjut dengan Google",
    signIn: "Masuk",
    signUp: "Buat Akun",
    signedIn: "Masuk sebagai",
    localMode: "Amaly tetap bisa dipakai lokal tanpa masuk akun.",
    nickname: "Nama Panggilan",
    saveNickname: "Simpan Nama",
    signOut: "Keluar",
    unavailable: "Sinkron cloud belum tersedia. Tambahkan env Supabase untuk mengaktifkan.",
    partner: "Pasangan",
    role: "Peranku",
    husband: "Suami",
    wife: "Istri",
    createCode: "Buat Kode",
    enterCode: "Masukkan kode 6 digit",
    acceptCode: "Hubungkan",
    partnerConnected: "Terhubung dengan",
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
  { label: "Friday", days: [false, false, false, false, false, true, false] },
  { label: "Weekdays", days: [true, true, true, true, true, false, false] },
  { label: "Weekend", days: [false, false, false, false, false, true, true] },
]
const prayerOffsetOptions = [-30, -15, -10, 0, 10, 15, 30]

function formatOffset(offset: HijriOffset) {
  return offset > 0 ? `+${offset}` : String(offset)
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
  if (mode === current.mode) {
    return current
  }

  return mode === "fixed" ? { mode: "fixed", time: "" } : { mode: "prayer", prayer: "fajr", offsetMinutes: 0 }
}

function prayerTiming(timing: HabitTiming) {
  return timing.mode === "prayer" ? timing : { mode: "prayer" as const, prayer: "fajr" as const, offsetMinutes: 0 }
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
  const user = useAppStore((state) => state.user)
  const profile = useAppStore((state) => state.profile)
  const authLoading = useAppStore((state) => state.authLoading)
  const syncLoading = useAppStore((state) => state.syncLoading)
  const authMessage = useAppStore((state) => state.authMessage)
  const syncMessage = useAppStore((state) => state.syncMessage)
  const partnerInvite = useAppStore((state) => state.partnerInvite)
  const partnerSnapshot = useAppStore((state) => state.partnerSnapshot)
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle)
  const signInWithPassword = useAppStore((state) => state.signInWithPassword)
  const signUpWithPassword = useAppStore((state) => state.signUpWithPassword)
  const signOut = useAppStore((state) => state.signOut)
  const updateDisplayName = useAppStore((state) => state.updateDisplayName)
  const createPartnerInvite = useAppStore((state) => state.createPartnerInvite)
  const acceptPartnerInvite = useAppStore((state) => state.acceptPartnerInvite)
  const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null)
  const [creatingHabitId, setCreatingHabitId] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayNameInput, setDisplayNameInput] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [role, setRole] = useState<"husband" | "wife">(settings.partnerRole ?? "husband")
  const habitInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const creatingHabitRef = useRef<HTMLDivElement | null>(null)
  const t = copy[settings.language]
  const fallbackDisplayName =
    profile?.displayName ||
    (typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "") ||
    user?.email ||
    ""
  const avatarUrl = profile?.avatarUrl || (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "")
  const profileInitial = (fallbackDisplayName || user?.email || "A").trim().charAt(0).toUpperCase()

  useEffect(() => {
    setDisplayNameInput(fallbackDisplayName)
  }, [fallbackDisplayName])

  useEffect(() => {
    if (!creatingHabitId) {
      return
    }

    const input = habitInputRefs.current[creatingHabitId]
    window.setTimeout(() => {
      input?.focus()
      input?.select()
    }, 0)
  }, [creatingHabitId])

  useEffect(() => {
    if (!creatingHabitId) {
      return
    }

    const habitId = creatingHabitId

    function handlePointerDown(event: PointerEvent) {
      if (creatingHabitRef.current?.contains(event.target as Node)) {
        return
      }

      deleteHabit(habitId)
      setCreatingHabitId(null)
      setExpandedHabitId(null)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [creatingHabitId, deleteHabit])

  function close(openState: boolean) {
    setSettingsOpen(openState)
    if (!openState) {
      if (creatingHabitId) {
        deleteHabit(creatingHabitId)
        setCreatingHabitId(null)
      }
      onClose()
      setExpandedHabitId(null)
    }
  }

  function createHabit() {
    const id = addHabit()
    setExpandedHabitId(id)
    setCreatingHabitId(id)
  }

  function saveCreatedHabit(habit: HabitDefinition) {
    const label = habit.label.trim()
    if (!label) {
      deleteHabit(habit.id)
      setExpandedHabitId(null)
    } else {
      updateHabit(habit.id, { label })
    }
    setCreatingHabitId(null)
  }

  function cancelCreatedHabit(id: string) {
    deleteHabit(id)
    setCreatingHabitId(null)
    setExpandedHabitId(null)
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
            <section className="rounded-2xl border border-sage/15 bg-card p-4">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-pale text-sage-deep dark:bg-sage/20 dark:text-sage-pale">
                  <Cloud className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-primary">{t.cloudSync}</h3>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    {isSupabaseConfigured ? t.authIntro : t.unavailable}
                  </p>
                  {!user ? <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.localMode}</p> : null}
                </div>
              </div>

              {isSupabaseConfigured ? (
                user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sage text-base font-bold text-white">
                        {avatarUrl ? <img alt="" className="h-full w-full object-cover" src={avatarUrl} /> : profileInitial}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.signedIn}</p>
                        <p className="mt-1 truncate text-sm font-bold text-foreground">{fallbackDisplayName || user.email}</p>
                        {fallbackDisplayName && fallbackDisplayName !== user.email ? (
                          <p className="truncate text-xs font-semibold text-muted-foreground">{user.email}</p>
                        ) : null}
                      </div>
                    </div>
                    <form
                      className="grid gap-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void updateDisplayName(displayNameInput)
                      }}
                    >
                      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t.nickname}
                        <input
                          className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                          autoComplete="nickname"
                          onChange={(event) => setDisplayNameInput(event.target.value)}
                          placeholder={user.email ?? ""}
                          value={displayNameInput}
                        />
                      </label>
                      <Button disabled={authLoading} type="submit" variant="outline">
                        {t.saveNickname}
                      </Button>
                    </form>
                    <Button disabled={authLoading} onClick={() => void signOut()} type="button" variant="outline">
                      <LogOut className="h-4 w-4" />
                      {t.signOut}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <form
                      className="flex flex-col gap-3"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void signInWithPassword(email, password)
                      }}
                      aria-busy={authLoading}
                    >
                      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t.email}
                        <span className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            autoComplete="email"
                            className="h-10 w-full rounded-xl border border-sage/15 bg-background pl-9 pr-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                            disabled={authLoading}
                            inputMode="email"
                            onChange={(event) => setEmail(event.target.value)}
                            type="email"
                            value={email}
                          />
                        </span>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {t.password}
                        <span className="relative">
                          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            autoComplete="current-password"
                            className="h-10 w-full rounded-xl border border-sage/15 bg-background pl-9 pr-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                            disabled={authLoading}
                            minLength={6}
                            onChange={(event) => setPassword(event.target.value)}
                            type="password"
                            value={password}
                          />
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button disabled={authLoading} type="submit">
                          {t.signIn}
                        </Button>
                        <Button disabled={authLoading} onClick={() => void signUpWithPassword(email, password)} type="button" variant="outline">
                          {t.signUp}
                        </Button>
                      </div>
                    </form>
                    <Button disabled={authLoading} onClick={() => void signInWithGoogle()} type="button" variant="outline">
                      {t.google}
                    </Button>
                  </div>
                )
              ) : null}

              {authMessage ? (
                <p className="mt-3 rounded-xl border border-sage/15 bg-surface-container-low px-3 py-2 text-sm font-semibold text-muted-foreground">
                  {authMessage}
                </p>
              ) : null}
            </section>

            {user ? (
              <section className="rounded-2xl border border-sage/15 bg-card p-4">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-pale text-sage-deep dark:bg-sage/20 dark:text-sage-pale">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-primary">{t.partner}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">
                      {partnerSnapshot ? `${t.partnerConnected} ${partnerSnapshot.profile.displayName}` : "Create or enter a partner code."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.role}</p>
                    <Tabs value={role} onValueChange={(value) => setRole(value as "husband" | "wife")}>
                      <TabsList className="mt-2 flex w-full">
                        <TabsTrigger value="husband">{t.husband}</TabsTrigger>
                        <TabsTrigger value="wife">{t.wife}</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button disabled={syncLoading || Boolean(partnerSnapshot)} onClick={() => void createPartnerInvite(role)} type="button" variant="outline">
                      {t.createCode}
                    </Button>
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void acceptPartnerInvite(inviteCode, role)
                      }}
                    >
                      <input
                        className="h-10 min-w-0 flex-1 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold tracking-[0.2em] text-foreground outline-none focus:border-sage"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(event) => setInviteCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder={t.enterCode}
                        value={inviteCode}
                      />
                      <Button disabled={syncLoading || inviteCode.length !== 6 || Boolean(partnerSnapshot)} type="submit">
                        {t.acceptCode}
                      </Button>
                    </form>
                  </div>

                  {partnerInvite ? (
                    <div className="rounded-xl border border-sage/20 bg-sage-pale/60 p-3 text-sage-deep dark:bg-sage/15 dark:text-sage-pale">
                      <p className="text-xs font-bold uppercase tracking-wide">Partner Code</p>
                      <p className="mt-1 font-serif text-3xl font-semibold tracking-[0.18em]">{partnerInvite.code}</p>
                    </div>
                  ) : null}
                  {syncMessage ? <p className="text-sm font-semibold text-muted-foreground">{syncMessage}</p> : null}
                </div>
              </section>
            ) : null}

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
                  onClick={createHabit}
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
                    ref={habit.id === creatingHabitId ? creatingHabitRef : null}
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
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && creatingHabitId === habit.id) {
                                  event.preventDefault()
                                  saveCreatedHabit(habit)
                                }
                                if (event.key === "Escape" && creatingHabitId === habit.id) {
                                  event.preventDefault()
                                  cancelCreatedHabit(habit.id)
                                }
                              }}
                              onChange={(event) => updateHabit(habit.id, { label: event.target.value })}
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
                                <select
                                  className="h-10 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold normal-case tracking-normal text-foreground outline-none focus:border-sage"
                                  onChange={(event) => updatePrayerOffset(habit, Number(event.target.value))}
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
                                onClick={() => {
                                  setHabitFrequency(habit.id, preset.days)
                                  if (preset.label === "Friday") {
                                    updateHabit(habit.id, { category: "Spiritual" })
                                  }
                                }}
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
