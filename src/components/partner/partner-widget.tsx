import { HeartHandshake, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AppLanguage } from "@/lib/app-settings"
import { useAppStore } from "@/stores/app-store"

const copy = {
  en: {
    title: "Amaly Together",
    noPartner: "Connect a partner in Settings to share gentle Quran progress.",
    noQuran: "No Quran progress synced yet.",
    sendNudge: "Send Nudge",
    today: "today",
    page: "Page",
  },
  id: {
    title: "Amaly Bersama",
    noPartner: "Hubungkan pasangan di Pengaturan untuk berbagi progres Quran.",
    noQuran: "Belum ada progres Quran yang tersinkron.",
    sendNudge: "Kirim Nudge",
    today: "hari ini",
    page: "Halaman",
  },
}

type PartnerWidgetProps = {
  language: AppLanguage
}

export function PartnerWidget({ language }: PartnerWidgetProps) {
  const partnerSnapshot = useAppStore((state) => state.partnerSnapshot)
  const user = useAppStore((state) => state.user)
  const sendPartnerNudge = useAppStore((state) => state.sendPartnerNudge)
  const t = copy[language]

  if (!user) {
    return null
  }

  return (
    <Card className="relative overflow-hidden p-5 md:col-span-12">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-sage-pale/50 dark:bg-sage/10" />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-pale text-sage-deep dark:bg-sage/20 dark:text-sage-pale">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{t.title}</p>
            {partnerSnapshot ? (
              <>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-foreground">{partnerSnapshot.profile.displayName}</h3>
                {partnerSnapshot.quranProgress ? (
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    {partnerSnapshot.quranProgress.pages_read_today}/{partnerSnapshot.quranProgress.daily_goal} {t.today} • {t.page}{" "}
                    {partnerSnapshot.quranProgress.page} • {partnerSnapshot.quranProgress.surah_name}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">{t.noQuran}</p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{t.noPartner}</p>
            )}
          </div>
        </div>
        {partnerSnapshot ? (
          <Button className="shrink-0" onClick={() => void sendPartnerNudge()} type="button" variant="outline">
            <Send className="h-4 w-4" />
            {t.sendNudge}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
