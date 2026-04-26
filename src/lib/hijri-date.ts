import umalqura from "@umalqura/core"

import type { AppLanguage } from "@/lib/app-settings"
import type { HijriOffset } from "@/lib/app-settings"

export type HijriParts = {
  day: number
  month: number
  year: number
}

const englishHijriMonths = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Shaban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qidah",
  "Dhu al-Hijjah",
]

const indonesianHijriMonths = [
  "Muharam",
  "Safar",
  "Rabiulawal",
  "Rabiulakhir",
  "Jumadilawal",
  "Jumadilakhir",
  "Rajab",
  "Syakban",
  "Ramadan",
  "Syawal",
  "Zulkaidah",
  "Zulhijah",
]

export function applyHijriOffset(date: Date, offset: HijriOffset = 0) {
  const adjusted = new Date(date)
  adjusted.setDate(adjusted.getDate() + offset)
  return adjusted
}

export function formatHijriDate(date: Date, offset: HijriOffset = 0, language: AppLanguage = "en") {
  const parts = getHijriParts(date, offset)
  const monthName = language === "id" ? indonesianHijriMonths[parts.month - 1] : englishHijriMonths[parts.month - 1]

  return language === "id"
    ? `${parts.day} ${monthName} ${parts.year} H`
    : `${monthName} ${parts.day}, ${parts.year} H`
}

export function getHijriParts(date: Date, offset: HijriOffset = 0): HijriParts {
  const hijri = umalqura(applyHijriOffset(date, offset))

  return {
    day: hijri.hd,
    month: hijri.hm,
    year: hijri.hy,
  }
}

export function formatGregorianDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function dateFromGregorianKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`)
}

export function addGregorianDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
