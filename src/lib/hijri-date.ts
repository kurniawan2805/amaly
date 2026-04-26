import type { HijriOffset } from "@/lib/app-settings"

export type HijriParts = {
  day: number
  month: number
  year: number
}

export function applyHijriOffset(date: Date, offset: HijriOffset = 0) {
  const adjusted = new Date(date)
  adjusted.setDate(adjusted.getDate() + offset)
  return adjusted
}

export function formatHijriDate(date: Date, offset: HijriOffset = 0) {
  return applyHijriOffset(date, offset)
    .toLocaleDateString("en-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      numberingSystem: "latn",
      year: "numeric",
    })
    .replace(/\bAH\b/, "H")
}

export function getHijriParts(date: Date, offset: HijriOffset = 0): HijriParts {
  const parts = new Intl.DateTimeFormat("en-SA-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    numberingSystem: "latn",
    year: "numeric",
  }).formatToParts(applyHijriOffset(date, offset))

  return {
    day: Number(parts.find((part) => part.type === "day")?.value ?? 1),
    month: Number(parts.find((part) => part.type === "month")?.value ?? 1),
    year: Number(parts.find((part) => part.type === "year")?.value ?? 1),
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
