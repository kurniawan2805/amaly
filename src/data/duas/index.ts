import { dailyDuasCategory } from "./daily-duas"
import { eveningDhikrCategory, morningDhikrCategory, duaFootnotes as morningEveningFootnotes } from "./morning-evening-dhikr"

export const duaCategories = [morningDhikrCategory, eveningDhikrCategory, dailyDuasCategory]
export const duaFootnotes = morningEveningFootnotes

export { dailyDuasCategory } from "./daily-duas"
export { eveningDhikrCategory, morningDhikrCategory } from "./morning-evening-dhikr"
export type { DuaCategory, DuaFootnote, DuaGroup, DuaItem, DuaTime } from "./types"
