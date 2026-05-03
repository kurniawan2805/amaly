export type PrayerWindow = {
  label: string
  start: string
  end: string
}

export const prayers: PrayerWindow[] = [
  { label: "Fajr", start: "04:00", end: "06:00" },
  { label: "Dzuhr", start: "11:45", end: "15:00" },
  { label: "Ashr", start: "15:00", end: "17:45" },
  { label: "Maghrib", start: "17:45", end: "19:30" },
  { label: "Isya", start: "19:00", end: "23:59" },
]

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function getNowMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

export function getActiveDhikrWindow(date = new Date()): "morning" | "evening" | null {
  const nowMinutes = getNowMinutes(date)
  const fajr = prayers.find((prayer) => prayer.label === "Fajr")
  const dzuhr = prayers.find((prayer) => prayer.label === "Dzuhr")
  const ashr = prayers.find((prayer) => prayer.label === "Ashr")
  const isya = prayers.find((prayer) => prayer.label === "Isya")

  if (fajr && dzuhr && nowMinutes >= timeToMinutes(fajr.start) && nowMinutes < timeToMinutes(dzuhr.start)) {
    return "morning"
  }

  if (ashr && isya && nowMinutes >= timeToMinutes(ashr.start) && nowMinutes < timeToMinutes(isya.end)) {
    return "evening"
  }

  return null
}
