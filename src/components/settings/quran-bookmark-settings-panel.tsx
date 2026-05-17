import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"

type QuranBookmarkSettingsPanelProps = {
  open: boolean
  onClose: () => void
}

const copy = {
  en: {
    title: "Quran Marks",
    subtitle: "Manage your spiritual bookmarks and labels. Click to open.",
    labels: "Labels",
    addLabel: "Add Label",
    bookmarks: "Bookmarks",
    cancel: "Cancel",
    save: "Save",
    name: "Name",
    color: "Color",
    delete: "Delete",
    noBookmarks: "No bookmarks in this category.",
  },
  id: {
    title: "Tanda Quran",
    subtitle: "Kelola label dan tanda bacaan spiritualmu. Klik untuk buka.",
    labels: "Label",
    addLabel: "Tambah Label",
    bookmarks: "Daftar Ayat",
    cancel: "Batal",
    save: "Simpan",
    name: "Nama",
    color: "Warna",
    delete: "Hapus",
    noBookmarks: "Belum ada tanda di kategori ini.",
  },
}

const colorOptions = [
  { name: "Sage", value: "sage" },
  { name: "Sky", value: "sky" },
  { name: "Blush", value: "blush" },
  { name: "Amber", value: "amber" },
  { name: "Indigo", value: "indigo" },
  { name: "Rose", value: "rose" },
  { name: "Violet", value: "violet" },
  { name: "Teal", value: "teal" },
  { name: "Orange", value: "orange" },
  { name: "Emerald", value: "emerald" },
]

export function QuranBookmarkSettingsPanel({ open, onClose }: QuranBookmarkSettingsPanelProps) {
  const language = useAppStore((s) => s.settings.language)
  const bookmarksState = useAppStore((s) => s.quranBookmarks)
  const updateLabel = useAppStore((s) => s.updateQuranLabel)
  const reorderBookmarks = useAppStore((s) => s.reorderQuranBookmarks)
  const removeBookmark = useAppStore((s) => s.removeQuranBookmark)
  const addLabel = useAppStore((s) => s.addQuranLabel)
  const deleteLabel = useAppStore((s) => s.deleteQuranLabel)
  const navigate = useNavigate()
  
  const [activeLabelId, setActiveLabelId] = useState<string | null>(bookmarksState.labels[0]?.id || null)
  const [addingLabel, setAddingLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const t = copy[language]

  function handleAddLabel() {
    const name = newLabelName.trim()
    if (!name) return
    addLabel(name, colorOptions[0].value)
    setNewLabelName("")
    setAddingLabel(false)
  }

  function handleDeleteLabel(labelId: string, labelName: string) {
    if (window.confirm(`Delete label "${labelName}"? Bookmarks in this category will become uncategorized.`)) {
      deleteLabel(labelId)
      if (activeLabelId === labelId) {
        const remaining = bookmarksState.labels.filter((l) => l.id !== labelId)
        setActiveLabelId(remaining[0]?.id || null)
      }
    }
  }

  const filteredBookmarks = bookmarksState.bookmarks
    .filter((b) => b.labelId === activeLabelId)
    .sort((a, b) => a.position - b.position)

  function handleMoveUp(index: number) {
    if (index === 0) return
    const newOrder = [...filteredBookmarks]
    const item = newOrder.splice(index, 1)[0]
    newOrder.splice(index - 1, 0, item)
    reorderBookmarks(activeLabelId, newOrder.map(b => b.id))
  }

  function handleMoveDown(index: number) {
    if (index === filteredBookmarks.length - 1) return
    const newOrder = [...filteredBookmarks]
    const item = newOrder.splice(index, 1)[0]
    newOrder.splice(index + 1, 0, item)
    reorderBookmarks(activeLabelId, newOrder.map(b => b.id))
  }

  function handleNavigate(page: number, surah: number, ayah: number) {
    onClose()
    navigate(`/quran/read?page=${page}&surah=${surah}&ayah=${ayah}`)
  }

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.subtitle}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.labels}</h4>
              <button
                onClick={() => setAddingLabel(true)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-primary transition hover:bg-sage-pale/30"
              >
                <Plus className="h-3 w-3" />
                {t.addLabel}
              </button>
            </div>
            {addingLabel ? (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-sage/20 bg-sage-pale/5 p-3">
                <input
                  autoFocus
                  className="h-9 flex-1 rounded-xl border border-sage/20 bg-background px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                  placeholder={t.name}
                />
                <Button onClick={handleAddLabel} size="sm" className="h-9 rounded-xl">{t.save}</Button>
                <button onClick={() => { setAddingLabel(false); setNewLabelName("") }} className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {bookmarksState.labels.map((label) => (
                <div key={label.id} className="relative group">
                  <button
                    onClick={() => setActiveLabelId(label.id)}
                    className={cn(
                      "rounded-2xl border-2 px-4 py-2 text-sm font-bold transition-all",
                      activeLabelId === label.id
                        ? `bg-${label.color} border-${label.color} text-white shadow-lg shadow-${label.color}/20`
                        : "border-sage/10 bg-background text-muted-foreground hover:border-sage/30"
                    )}
                  >
                    {label.name}
                  </button>
                  <button
                    onClick={() => handleDeleteLabel(label.id, label.name)}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow transition group-hover:opacity-100 hover:scale-110"
                    title={t.delete}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setActiveLabelId(null)}
                className={cn(
                  "rounded-2xl border-2 px-4 py-2 text-sm font-bold transition-all",
                  activeLabelId === null
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "border-sage/10 bg-background text-muted-foreground hover:border-sage/30"
                )}
              >
                Uncategorized
              </button>
            </div>
          </section>

          {activeLabelId && (
            <section className="mb-8 rounded-2xl border border-sage/10 bg-sage-pale/5 p-4">
               <div className="grid gap-4">
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-muted-foreground">{t.name}</span>
                    <input 
                      className="h-10 rounded-xl border border-sage/20 bg-background px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
                      value={bookmarksState.labels.find(l => l.id === activeLabelId)?.name || ""}
                      onChange={(e) => updateLabel(activeLabelId, { name: e.target.value })}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-muted-foreground">{t.color}</span>
                    <div className="flex gap-2">
                      {colorOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateLabel(activeLabelId, { color: opt.value })}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 transition-all",
                            `bg-${opt.value}`,
                            bookmarksState.labels.find(l => l.id === activeLabelId)?.color === opt.value
                              ? "border-primary scale-110 shadow-md"
                              : "border-transparent"
                          )}
                          title={opt.name}
                        />
                      ))}
                    </div>
                  </label>
               </div>
            </section>
          )}

          <section>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.bookmarks}</h4>
            <div className="grid gap-2">
              {filteredBookmarks.length === 0 ? (
                <p className="py-8 text-center text-sm font-semibold text-muted-foreground">{t.noBookmarks}</p>
              ) : (
                filteredBookmarks.map((bookmark, index) => (
                  <div 
                    key={bookmark.id}
                    className="group flex items-center gap-3 rounded-2xl border border-sage/10 bg-background p-3 transition hover:border-sage/30"
                  >
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-primary disabled:opacity-20"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleMoveDown(index)}
                        disabled={index === filteredBookmarks.length - 1}
                        className="text-muted-foreground hover:text-primary disabled:opacity-20"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleNavigate(bookmark.page, bookmark.surah, bookmark.ayah)}
                      className="min-w-0 flex-1 text-left transition hover:opacity-70"
                    >
                      <p className="text-sm font-bold text-foreground">{bookmark.surahName} {bookmark.ayah}</p>
                      <p className="truncate text-xs font-semibold text-muted-foreground">Page {bookmark.page}</p>
                    </button>
                    <Button
                      onClick={() => removeBookmark({ surah: bookmark.surah, ayah: bookmark.ayah } as any)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="border-t border-sage/10 bg-background/95 px-6 py-4 backdrop-blur">
          <Button onClick={onClose} className="w-full h-12 rounded-2xl text-lg font-bold">
            {t.save}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

