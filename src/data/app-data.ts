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
  // --- DAILY ROUTINE ---
  {
    label: "Morning Dhikr",
    category: "Daily Routine",
    scheduleLabel: "After Fajr",
    plannedDays: [true, true, true, true, true, true, true],
    timing: { mode: "fixed", time: "05:30" },
  },
  {
    label: "Mid-day Quran (1 Page)",
    category: "Daily Routine",
    scheduleLabel: "Toddler Nap Time",
    plannedDays: [true, true, true, true, true, true, true],
    timing: { mode: "flexible", window: "Afternoon" },
  },
  {
    label: "Evening Reflection & Shidq",
    category: "Daily Routine",
    scheduleLabel: "Before Bed",
    plannedDays: [true, true, true, true, true, true, true],
    timing: { mode: "fixed", time: "21:00" },
  },
  {
    label: "Dua for Children",
    category: "Daily Routine",
    scheduleLabel: "During Ashr Window",
    plannedDays: [true, true, true, true, true, true, true],
    timing: { mode: "fixed", time: "16:30" }, // Relevant to her current time!
  },

  // --- FRIDAY SPECIALS ---
  {
    label: "Read Surah Al-Kahf",
    category: "Friday Specials",
    scheduleLabel: "Anytime Friday",
    plannedDays: [false, false, false, false, false, true, false], // Index 5 = Friday
    timing: { mode: "flexible", time: "" },
  },
  {
    label: "Increased Salawat",
    category: "Friday Specials",
    scheduleLabel: "Throughout Jumu'ah",
    plannedDays: [false, false, false, false, false, true, false],
    timing: { mode: "flexible", time: "" },
  },
  {
    label: "Friday Sadaqah",
    category: "Friday Specials",
    scheduleLabel: "Morning",
    plannedDays: [false, false, false, false, false, true, false],
    timing: { mode: "fixed", time: "10:00" },
  },

  // --- SUNNAH LOGGING (Optional: Tracking these as habits too) ---
  {
    label: "Log Sunnah Prayers",
    category: "Daily Routine",
    scheduleLabel: "End of Day",
    plannedDays: [true, true, true, true, true, true, true],
    timing: { mode: "fixed", time: "20:30" },
  }
];

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
