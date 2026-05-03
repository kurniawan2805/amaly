export type DuaTime = "morning" | "evening" | "daily"

export type DuaItem = {
  id: string
  title: string
  arabic: string
  transliteration?: string
  translation: string
  times: DuaTime[]
  repetition: number
  source?: string
  benefit?: string
  note?: string
  footnoteIds?: number[]
}

export type DuaGroup = {
  id: string
  title: string
  description?: string
  items: DuaItem[]
}

export type DuaCategory = {
  id: string
  title: string
  description?: string
  items?: DuaItem[]
  groups?: DuaGroup[]
}

export type DuaFootnote = {
  id: number
  text: string
}
