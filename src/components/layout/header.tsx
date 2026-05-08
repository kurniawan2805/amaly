import { Menu, Moon, Sun, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { AppLanguage, AppTheme } from "@/lib/app-settings"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"

type HeaderProps = {
  language: AppLanguage
  theme: AppTheme
  onOpenAccount: () => void
  onOpenHabits: () => void
  onToggleLanguage: () => void
  onToggleTheme: () => void
  title: string
}

const labels: Record<AppLanguage, { account: string; habits: string; language: string; theme: string }> = {
  en: {
    account: "Open account settings",
    habits: "Open habit settings",
    language: "Change language",
    theme: "Toggle theme",
  },
  id: {
    account: "Buka pengaturan akun",
    habits: "Buka pengaturan habit",
    language: "Ganti bahasa",
    theme: "Ganti tema",
  },
}

export function Header({ language, theme, onOpenAccount, onOpenHabits, onToggleLanguage, onToggleTheme, title }: HeaderProps) {
  const t = labels[language]
  const user = useAppStore((state) => state.user)
  const profile = useAppStore((state) => state.profile)
  const displayName =
    profile?.displayName ||
    (typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "") ||
    user?.email ||
    ""
  const avatarUrl = profile?.avatarUrl || (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "")
  const initial = displayName.trim().charAt(0).toUpperCase() || "A"

  return (
    <header className="sticky top-0 z-40 border-b border-sage/10 bg-background/95 backdrop-blur">
      <div className="mx-auto grid h-16 w-full max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:px-6">
        <Button aria-label={t.habits} onClick={onOpenHabits} size="icon" type="button" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center justify-center gap-2 text-sage">
          <img alt="" className="h-7 w-7" src="/logo.svg" />
          <h1 className="truncate font-serif text-2xl font-medium tracking-normal">{title}</h1>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <Button aria-label={t.language} className="transition active:scale-95" onClick={onToggleLanguage} size="icon" variant="ghost">
            <span className="text-[11px] font-bold">
              {language === "en" ? "EN" : "ID"}
            </span>
          </Button>
          <Button aria-label={t.theme} className="transition active:scale-95" onClick={onToggleTheme} size="icon" variant="ghost">
            {theme === "dark" ? <Moon className="h-5 w-5 rotate-[-8deg] transition" /> : <Sun className="h-5 w-5 transition" />}
          </Button>
          <NotificationCenter />
          <Button aria-label={t.account} onClick={onOpenAccount} size="icon" variant="ghost">
          {user ? (
            avatarUrl ? (
              <img alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-sage/25" src={avatarUrl} />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-sm font-bold text-white shadow-soft">
                {initial}
              </span>
            )
          ) : (
            <UserRound className="h-5 w-5" />
          )}
          </Button>
        </div>
      </div>
    </header>
  )
}
