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
    label: "Dzikir pagi",
    category: "Ibadah Harian",
    scheduleLabel: "10 menit setelah Shubuh",
    plannedDays: everyday,
    timing: { mode: "prayer", prayer: "fajr", offsetMinutes: 10 },
  },
  {
    label: "Dzikir petang",
    category: "Ibadah Harian",
    scheduleLabel: "10 menit setelah Ashar",
    plannedDays: everyday,
    timing: { mode: "prayer", prayer: "ashr", offsetMinutes: 10 },
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
