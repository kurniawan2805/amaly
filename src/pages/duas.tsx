import { Play, Search, Sparkles, Star } from "lucide-react"
import { useMemo, useState } from "react"

import { DuaCard } from "@/components/duas/dua-card"
import { DuaFlowMode } from "@/components/duas/dua-flow-mode"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { duaCategories, type DuaCategory, type DuaGroup, type DuaItem } from "@/data/duas"
import type { AppLanguage } from "@/lib/app-settings"
import { isDuaFavorite, loadDuaFavorites, saveDuaFavorites, toggleDuaFavorite } from "@/lib/dua-favorites"
import { loadDuaFlowSessions } from "@/lib/dua-flow-session"
import { cn } from "@/lib/utils"

type DuasPageProps = {
  language: AppLanguage
}

type VisibleDua = {
  item: DuaItem
  groupTitle?: string
}

const favoritesCategoryId = "favorites"

const copy = {
  en: {
    title: "Daily Duas",
    subtitle: "Morning dhikr, evening dhikr, and everyday duas in one quiet place.",
    search: "Search duas",
    favorites: "Favorites",
    flow: "Start Flow",
    resumeFlow: "Resume Flow",
    items: (count: number) => `${count} duas`,
    noResults: "No duas found.",
    emptyFavorites: "No favorite duas yet. Tap the star icon on any dua to save it here.",
    all: "All",
  },
  id: {
    title: "Doa Harian",
    subtitle: "Dzikir pagi, dzikir petang, dan doa sehari-hari dalam satu tempat.",
    search: "Cari doa",
    favorites: "Favorit",
    flow: "Mulai Flow",
    resumeFlow: "Lanjutkan Flow",
    items: (count: number) => `${count} doa`,
    noResults: "Doa tidak ditemukan.",
    emptyFavorites: "Belum ada doa favorit. Tap ikon bintang di doa untuk menyimpannya di sini.",
    all: "Semua",
  },
}

function getCategoryCount(category: DuaCategory) {
  return category.items?.length ?? category.groups?.reduce((total, group) => total + group.items.length, 0) ?? 0
}

function getCategoryTitle(category: DuaCategory, language: AppLanguage) {
  if (language === "id") return category.title

  const titles: Record<string, string> = {
    "daily-duas": "Daily Duas",
    "evening-dhikr": "Afternoon Dhikr",
    "morning-dhikr": "Morning Dhikr",
  }

  return titles[category.id] ?? category.title
}

function flattenDuas(language: AppLanguage) {
  const items = new Map<string, VisibleDua>()
  duaCategories.forEach((category) => {
    const categoryTitle = getCategoryTitle(category, language)
    if (category.items) {
      category.items.forEach((item) => items.set(item.id, { item, groupTitle: categoryTitle }))
    }
    category.groups?.forEach((group) => group.items.forEach((item) => items.set(item.id, { item, groupTitle: group.title })))
  })
  return Array.from(items.values())
}

function itemMatchesQuery(item: DuaItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return [item.title, item.translation, item.transliteration, item.source, item.note]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery))
}

function getVisibleDuas(category: DuaCategory | null, selectedGroupId: string, query: string, favoriteIds: string[], language: AppLanguage): VisibleDua[] {
  if (!category) {
    return flattenDuas(language).filter(({ item }) => favoriteIds.includes(item.id) && itemMatchesQuery(item, query))
  }

  const groups: DuaGroup[] = category.groups ?? [{ id: "all", title: category.title, items: category.items ?? [] }]
  const scopedGroups = selectedGroupId === "all" ? groups : groups.filter((group) => group.id === selectedGroupId)

  return scopedGroups.flatMap((group) =>
    group.items
      .filter((item) => itemMatchesQuery(item, query))
      .map((item) => ({ item, groupTitle: category.groups ? group.title : undefined })),
  )
}

function isFlowCategory(categoryId: string) {
  return categoryId === "morning-dhikr" || categoryId === "evening-dhikr"
}

export default function DuasPage({ language }: DuasPageProps) {
  const t = copy[language]
  const [selectedCategoryId, setSelectedCategoryId] = useState(duaCategories[0]?.id ?? "")
  const [selectedGroupId, setSelectedGroupId] = useState("all")
  const [query, setQuery] = useState("")
  const [favorites, setFavorites] = useState(() => loadDuaFavorites())
  const [flowCategory, setFlowCategory] = useState<DuaCategory | null>(null)
  const selectedCategory = selectedCategoryId === favoritesCategoryId ? null : duaCategories.find((category) => category.id === selectedCategoryId) ?? duaCategories[0]
  const visibleDuas = useMemo(
    () => getVisibleDuas(selectedCategory, selectedGroupId, query, favorites.ids, language),
    [favorites.ids, language, query, selectedCategory, selectedGroupId],
  )
  const groups = selectedCategory?.groups ?? []
  const sessions = loadDuaFlowSessions()
  const selectedFlowSession = selectedCategory ? sessions[selectedCategory.id] : null
  const selectedCategoryTitle = selectedCategory ? getCategoryTitle(selectedCategory, language) : t.favorites
  const selectedCategoryDescription = selectedCategory?.description ?? t.emptyFavorites

  function selectCategory(categoryId: string) {
    setSelectedCategoryId(categoryId)
    setSelectedGroupId("all")
    setQuery("")
  }

  function toggleFavorite(id: string) {
    const next = toggleDuaFavorite(favorites, id)
    setFavorites(next)
    saveDuaFavorites(next)
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-5 pb-28">
      {flowCategory?.items ? (
        <DuaFlowMode
          categoryId={flowCategory.id}
          categoryTitle={getCategoryTitle(flowCategory, language)}
          favoriteIds={favorites.ids}
          items={flowCategory.items}
          language={language}
          onClose={() => setFlowCategory(null)}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center gap-2 text-sage">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wide">Amaly Library</span>
        </div>
        <h2 className="font-serif text-4xl font-semibold leading-tight text-primary">{t.title}</h2>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">{t.subtitle}</p>
      </section>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {duaCategories.map((category) => (
          <button
            className={cn(
              "shrink-0 rounded-2xl border border-sage/15 bg-card px-4 py-3 text-left transition",
              selectedCategoryId === category.id && "border-sage bg-sage-pale/80 text-sage-deep",
            )}
            key={category.id}
            onClick={() => selectCategory(category.id)}
            type="button"
          >
            <span className="block text-sm font-bold">{getCategoryTitle(category, language)}</span>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">{t.items(getCategoryCount(category))}</span>
          </button>
        ))}
        <button
          className={cn(
            "shrink-0 rounded-2xl border border-sage/15 bg-card px-4 py-3 text-left transition",
            selectedCategoryId === favoritesCategoryId && "border-sage bg-sage-pale/80 text-sage-deep",
          )}
          onClick={() => selectCategory(favoritesCategoryId)}
          type="button"
        >
          <span className="flex items-center gap-1 text-sm font-bold">
            <Star className={cn("h-4 w-4", favorites.ids.length > 0 && "fill-current")} />
            {t.favorites}
          </span>
          <span className="mt-1 block text-xs font-semibold text-muted-foreground">{t.items(favorites.ids.length)}</span>
        </button>
      </div>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-primary">{selectedCategoryTitle}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedCategoryDescription}</p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-primary">
            {t.items(visibleDuas.length)}
          </span>
        </div>

        <label className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold text-muted-foreground focus-within:border-sage">
          <Search className="h-4 w-4" />
          <input
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            value={query}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCategory?.items && isFlowCategory(selectedCategory.id) ? (
            <Button onClick={() => setFlowCategory(selectedCategory)} size="sm" type="button">
              <Play className="h-4 w-4 fill-current" />
              {selectedFlowSession && !selectedFlowSession.completed ? t.resumeFlow : t.flow}
            </Button>
          ) : null}

          {groups.length > 0 ? (
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              <Button onClick={() => setSelectedGroupId("all")} size="sm" type="button" variant={selectedGroupId === "all" ? "default" : "outline"}>
                {t.all}
              </Button>
              {groups.map((group) => (
                <Button
                  className="shrink-0"
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  size="sm"
                  type="button"
                  variant={selectedGroupId === group.id ? "default" : "outline"}
                >
                  {group.title}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        {visibleDuas.map(({ item, groupTitle }) => (
          <DuaCard
            favorite={isDuaFavorite(favorites, item.id)}
            groupTitle={groupTitle}
            item={item}
            key={`${groupTitle ?? selectedCategoryTitle}-${item.id}`}
            language={language}
            onToggleFavorite={toggleFavorite}
          />
        ))}
        {visibleDuas.length === 0 ? <Card className="p-4 text-sm font-semibold text-muted-foreground">{selectedCategoryId === favoritesCategoryId ? t.emptyFavorites : t.noResults}</Card> : null}
      </section>
    </div>
  )
}
