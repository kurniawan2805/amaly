import {
  AudioLines,
  BookMarked,
  CalendarDays,
  Droplets,
  Dumbbell,
  Heart,
  History,
  Lightbulb,
  Moon,
  Smile,
} from "lucide-react"

const everyday = [true, true, true, true, true, true, true]
const fridayOnly = [false, false, false, false, false, true, false]

export const dailyHabits = [
  {
    label: "Morning Dhikr",
    category: "Ibadah Harian",
    scheduleLabel: "After Fajr until sunrise",
    plannedDays: everyday,
    timing: { endOffsetMinutes: -30, fallbackEnd: "11:30", fallbackStart: "05:10", mode: "prayer_based_time", prayer: "fajr", startOffsetMinutes: 10, untilPrayer: "dzuhr" },
  },
  {
    label: "Evening Dhikr",
    category: "Ibadah Harian",
    scheduleLabel: "After Asr until Maghrib",
    plannedDays: everyday,
    timing: { endOffsetMinutes: 30, fallbackEnd: "20:30", fallbackStart: "16:00", mode: "prayer_based_time", prayer: "ashr", startOffsetMinutes: 0, untilPrayer: "isya" },
  },
  {
    label: "Quran Reading",
    category: "Ibadah Harian",
    scheduleLabel: "Anytime today",
    plannedDays: everyday,
    timing: { mode: "flexible" },
  },
  {
    label: "Shalat Witr",
    category: "Ibadah Harian",
    scheduleLabel: "30 menit sebelum Shubuh",
    plannedDays: everyday,
    timing: { mode: "prayer", prayer: "fajr", offsetMinutes: -30 },
  },
  {
    label: "Baca Al-Kahfi",
    category: "Jumat",
    scheduleLabel: "Jumat",
    plannedDays: fridayOnly,
    timing: { mode: "fixed", time: "" },
  },
  {
    label: "Shalawat",
    category: "Jumat",
    scheduleLabel: "Jumat",
    plannedDays: fridayOnly,
    timing: { mode: "fixed", time: "" },
  },
]

export const quranShortcuts = [
  { label: "Bookmarks", icon: BookMarked },
  { label: "Favorites", icon: Heart },
  { label: "Audio", icon: AudioLines },
  { label: "History", icon: History },
]

export const surahs = [
  { id: 1, name: "Al-Fatihah", english: "The Opener", verses: 7, arabic: "الفاتحة" },
  { id: 2, name: "Al-Baqarah", english: "The Cow", verses: 286, arabic: "البقرة" },
  { id: 3, name: "Ali 'Imran", english: "Family of Imran", verses: 200, arabic: "آل عمران" },
]

export const cycleInsights = [
  { label: "Focus On", value: "Connection & Creativity", icon: Smile },
  { label: "Movement", value: "High Intensity", icon: Dumbbell },
]

export const cycleLogOptions = [
  { label: "Flow", icon: Droplets, active: false },
  { label: "Mood", icon: Smile, active: true },
  { label: "Energy", icon: Lightbulb, active: false },
  { label: "Sleep", icon: Moon, active: false },
  { label: "Cycle", icon: CalendarDays, active: false },
]
