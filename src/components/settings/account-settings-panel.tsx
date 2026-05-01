import { Cloud, LogOut, Mail, UserRound, Users } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type PartnerRole } from "@/lib/app-settings"
import { isSupabaseConfigured } from "@/lib/supabase-sync"
import { useAppStore } from "@/stores/app-store"

type AccountSettingsPanelProps = {
  open: boolean
  onClose: () => void
}

const copy = {
  en: {
    title: "Account",
    subtitle: "Manage login, nickname, partner sync, and sign out.",
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
    close: "Close account settings",
  },
  id: {
    title: "Akun",
    subtitle: "Atur login, nama panggilan, pasangan, dan logout.",
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
    close: "Tutup pengaturan akun",
  },
}

export function AccountSettingsPanel({ open, onClose }: AccountSettingsPanelProps) {
  const settings = useAppStore((state) => state.settings)
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayNameInput, setDisplayNameInput] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [role, setRole] = useState<PartnerRole>(settings.partnerRole ?? "husband")
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
                    <Tabs value={role} onValueChange={(value) => setRole(value as PartnerRole)}>
                      <TabsList className="mt-2 flex w-full">
                        <TabsTrigger value="husband">{t.husband}</TabsTrigger>
                        <TabsTrigger value="wife">{t.wife}</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="grid gap-3">
                    <Button disabled={syncLoading || Boolean(partnerSnapshot)} onClick={() => void createPartnerInvite(role)} type="button" variant="outline">
                      {t.createCode}
                    </Button>
                    <form
                      className="grid gap-2 sm:grid-cols-[1fr_auto]"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void acceptPartnerInvite(inviteCode, role)
                      }}
                    >
                      <input
                        className="h-10 min-w-0 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold tracking-[0.2em] text-foreground outline-none focus:border-sage"
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
