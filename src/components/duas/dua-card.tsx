import { BookOpen, ChevronDown, Star } from "lucide-react"
import { useState } from "react"

import { Card } from "@/components/ui/card"
import { duaFootnotes, type DuaItem } from "@/data/duas"
import type { AppLanguage } from "@/lib/app-settings"
import { cn } from "@/lib/utils"

type DuaCardProps = {
  favorite: boolean
  groupTitle?: string
  item: DuaItem
  language: AppLanguage
  onToggleFavorite: (id: string) => void
}

const copy = {
  en: {
    repetition: (count: number) => `Read ${count}x`,
    source: "Source",
    benefit: "Benefit",
    note: "Note",
    favorite: "Save dua as favorite",
    unfavorite: "Remove dua from favorites",
  },
  id: {
    repetition: (count: number) => `Baca ${count}x`,
    source: "Sumber",
    benefit: "Manfaat",
    note: "Catatan",
    favorite: "Simpan doa ke favorit",
    unfavorite: "Hapus doa dari favorit",
  },
}

export function DuaCard({ favorite, groupTitle, item, language, onToggleFavorite }: DuaCardProps) {
  const [open, setOpen] = useState(false)
  const t = copy[language]
  const footnotes = item.footnoteIds
    ?.map((id) => duaFootnotes.find((footnote) => footnote.id === id))
    .filter((footnote): footnote is NonNullable<typeof footnote> => Boolean(footnote))

  return (
    <Card className="overflow-hidden p-0">
      <button
        className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-sage-pale/10"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-pale text-sage-deep">
          <BookOpen className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          {groupTitle ? <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{groupTitle}</span> : null}
          <span className="block text-sm font-bold text-foreground">{item.title}</span>
          <span className="mt-1 inline-flex rounded-full bg-surface-container-low px-2 py-1 text-xs font-bold text-primary">
            {t.repetition(item.repetition)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <span
            aria-label={favorite ? t.unfavorite : t.favorite}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sage-pale/30 hover:text-primary",
              favorite && "bg-sage-pale text-primary",
            )}
            onClick={(event) => {
              event.stopPropagation()
              onToggleFavorite(item.id)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                event.stopPropagation()
                onToggleFavorite(item.id)
              }
            }}
          >
            <Star className={cn("h-4 w-4", favorite && "fill-current")} />
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <div className="border-t border-sage/10 px-4 pb-4 pt-3">
          {item.arabic ? (
            <p className="whitespace-pre-line text-right font-serif text-2xl leading-[2.4] text-primary" dir="rtl" lang="ar">
              {item.arabic}
            </p>
          ) : null}
          {item.transliteration ? <p className="mt-3 text-sm font-semibold italic leading-6 text-muted-foreground">{item.transliteration}</p> : null}
          {item.translation ? <p className="mt-3 text-sm leading-6 text-foreground">{item.translation}</p> : null}
          {item.benefit ? (
            <div className="mt-3 rounded-xl bg-sage-pale/60 px-3 py-2 text-sm font-semibold leading-6 text-sage-deep">
              <span className="font-bold">{t.benefit}: </span>
              {item.benefit}
            </div>
          ) : null}
          {item.note ? (
            <div className="mt-3 whitespace-pre-line rounded-xl bg-surface-container-low px-3 py-2 text-sm leading-6 text-muted-foreground">
              <span className="font-bold text-foreground">{t.note}: </span>
              {item.note}
            </div>
          ) : null}
          {item.source ? (
            <p className="mt-3 text-xs font-semibold leading-5 text-muted-foreground">
              <span className="font-bold text-foreground">{t.source}: </span>
              {item.source}
            </p>
          ) : null}
          {footnotes?.length ? (
            <div className="mt-3 space-y-2 border-t border-sage/10 pt-3">
              {footnotes.map((footnote) => (
                <p className="text-xs leading-5 text-muted-foreground" key={footnote.id}>
                  [{footnote.id}] {footnote.text}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}
