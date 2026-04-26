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

export const dailyHabits = [
  { label: "Morning Dhikr", completed: true },
  { label: "Read Surah Al-Kahf", completed: false },
  { label: "Evening Reflection", completed: true },
  { label: "Du'a List", completed: true },
  { label: "Sleep Intention", completed: false },
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
