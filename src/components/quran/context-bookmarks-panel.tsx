import { ChevronRight, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { QuranContextBookmark } from "@/lib/quran-reader-bookmarks"
import { cn } from "@/lib/utils"

export type ContextBookmarksPanelProps = {
  bookmarks: QuranContextBookmark[]
  language: "en" | "id"
  onNavigate: (page: number) => void
  onAdd?: () => void
  onRemove?: (id: string) => void
}

const labels = {
  en: {
    quickAccess: "Quick Access",
    addBookmark: "Add Shortcut",
    noBookmarks: "No quick shortcuts yet",
    habitContext: "Habit",
    dailyContext: "Daily Goal",
    hifzContext: "Hifz",
    murojaahContext: "Murojaah",
    customContext: "Custom",
  },
  id: {
    quickAccess: "Akses Cepat",
    addBookmark: "Tambah Pintas",
    noBookmarks: "Belum ada pintas cepat",
    habitContext: "Kebiasaan",
    dailyContext: "Target Harian",
    hifzContext: "Hifz",
    murojaahContext: "Murojaah",
    customContext: "Kustom",
  },
}

function getContextLabel(context: string, lang: "en" | "id"): string {
  const labelMap = {
    habit: lang === "en" ? labels.en.habitContext : labels.id.habitContext,
    daily: lang === "en" ? labels.en.dailyContext : labels.id.dailyContext,
    hifz: lang === "en" ? labels.en.hifzContext : labels.id.hifzContext,
    murojaah: lang === "en" ? labels.en.murojaahContext : labels.id.murojaahContext,
    custom: lang === "en" ? labels.en.customContext : labels.id.customContext,
  }
  return labelMap[context as keyof typeof labelMap] || context
}

export function ContextBookmarksPanel({
  bookmarks,
  language,
  onNavigate,
  onAdd,
  onRemove,
}: ContextBookmarksPanelProps) {
  const t = labels[language]
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (bookmarks.length === 0) {
    return (
      <Card className="border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">{t.noBookmarks}</p>
        {onAdd && (
          <Button onClick={onAdd} variant="ghost" size="sm" className="mt-2">
            <Plus className="mr-2 h-4 w-4" />
            {t.addBookmark}
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-sm font-bold text-primary">{t.quickAccess}</h3>
        {onAdd && (
          <Button onClick={onAdd} variant="ghost" size="sm" className="h-6 px-2 text-xs">
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="space-y-1">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition hover:bg-card/80"
          >
            <button
              onClick={() => onNavigate(bookmark.page)}
              className="flex-1 flex items-center justify-between text-left transition hover:text-primary"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{bookmark.label}</p>
                <p className="text-xs text-muted-foreground">
                  {getContextLabel(bookmark.context, language)} • {language === "en" ? "Page" : "Halaman"} {bookmark.page}
                  {bookmark.toPage ? ` - ${bookmark.toPage}` : ""}
                </p>
              </div>
              <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
            {onRemove && (
              <Button
                onClick={() => {
                  if (deletingId === bookmark.id) {
                    onRemove(bookmark.id)
                    setDeletingId(null)
                  } else {
                    setDeletingId(bookmark.id)
                  }
                }}
                variant="ghost"
                size="sm"
                className={cn(
                  "ml-2 h-8 w-8 shrink-0 transition",
                  deletingId === bookmark.id
                    ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                    : "text-muted-foreground opacity-0 group-hover:opacity-100"
                )}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
