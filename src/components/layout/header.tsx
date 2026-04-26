import { Menu, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AppLanguage } from "@/lib/app-settings"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"

type HeaderProps = {
  language: AppLanguage
  onOpenSettings: () => void
  title: string
}

const labels: Record<AppLanguage, { menu: string; profile: string }> = {
  en: {
    menu: "Open settings",
    profile: "Open profile",
  },
  id: {
    menu: "Buka pengaturan",
    profile: "Buka profil",
  },
}

export function Header({ language, onOpenSettings, title }: HeaderProps) {
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
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Button aria-label={t.menu} onClick={onOpenSettings} size="icon" variant="ghost">
          {user ? (
            avatarUrl ? (
              <img alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-sage/25" src={avatarUrl} />
            ) : (
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full bg-sage text-sm font-bold text-white shadow-soft",
                )}
              >
                {initial}
              </span>
            )
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        <div className="flex items-center gap-2 text-sage">
          <img alt="" className="h-7 w-7" src="/logo.svg" />
          <h1 className="font-serif text-2xl font-medium tracking-normal">{title}</h1>
        </div>
        <Button aria-label={t.profile} onClick={onOpenSettings} size="icon" variant="ghost">
          <UserRound className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
