import { Menu, Sprout, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AppLanguage } from "@/lib/app-settings"

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

  return (
    <header className="sticky top-0 z-40 border-b border-sage/10 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Button aria-label={t.menu} onClick={onOpenSettings} size="icon" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-sage">
          <Sprout className="h-5 w-5" />
          <h1 className="font-serif text-2xl font-medium tracking-normal">{title}</h1>
        </div>
        <Button aria-label={t.profile} size="icon" variant="ghost">
          <UserRound className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
