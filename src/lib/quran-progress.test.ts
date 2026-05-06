import { afterEach, describe, expect, it, vi } from "vitest"

import {
  QURAN_DAILY_GOAL,
  QURAN_TOTAL_PAGES,
  getRiyadhDateKey,
  initialQuranProgress,
  setProgressToPage,
  updateProgress,
  updateQuranDailyGoal,
} from "@/lib/quran-progress"
import { getQuranPageStart, quranPageStartKeys } from "@/lib/quran-static-meta"

describe("quran progress", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts with no reading progress", () => {
    const progress = initialQuranProgress()

    expect(progress.last_page_read).toBe(0)
    expect(progress.page).toBe(1)
    expect(progress.progress_percent).toBe(0)
    expect(progress.daily_goal).toBe(QURAN_DAILY_GOAL)
    expect(progress.logs).toEqual([])
    expect(progress.continue_url).toBe("/quran/read?page=1")
  })

  it("logs pages for the current Riyadh day", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-27T12:00:00Z"))

    const progress = updateProgress(0, 3)

    expect(progress.last_page_read).toBe(3)
    expect(progress.pages_read_today).toBe(3)
    expect(progress.goal_completed_today).toBe(false)
    expect(progress.goal_burst).toBe(false)
    expect(progress.logs).toHaveLength(1)
    expect(progress.logs[0]).toMatchObject({
      date: getRiyadhDateKey(),
      pages: 3,
      from_page: 0,
      to_page: 3,
    })
  })

  it("fires the goal burst only when crossing the daily goal", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-27T12:00:00Z"))

    const partial = updateProgress(0, 4, [], "en", 5)
    const completed = updateProgress(partial.last_page_read, 1, partial.logs, "en", 5)
    const extra = updateProgress(completed.last_page_read, 1, completed.logs, "en", 5)

    expect(completed.pages_read_today).toBe(5)
    expect(completed.goal_completed_today).toBe(true)
    expect(completed.goal_burst).toBe(true)
    expect(extra.pages_read_today).toBe(6)
    expect(extra.goal_completed_today).toBe(true)
    expect(extra.goal_burst).toBe(false)
  })

  it("merges multiple readings into one daily log", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-04-27T12:00:00Z"))

    const first = updateProgress(0, 2)
    const second = updateProgress(first.last_page_read, 4, first.logs)

    expect(second.logs).toHaveLength(1)
    expect(second.logs[0]).toMatchObject({
      pages: 6,
      from_page: 0,
      to_page: 6,
    })
  })

  it("clamps page progress to the Quran page range", () => {
    const progress = setProgressToPage(0, QURAN_TOTAL_PAGES + 100)

    expect(progress.last_page_read).toBe(QURAN_TOTAL_PAGES)
    expect(progress.page).toBe(QURAN_TOTAL_PAGES)
    expect(progress.is_khatm_complete).toBe(true)
    expect(progress.continue_url).toBe(`/quran/read?page=${QURAN_TOTAL_PAGES}`)
  })

  it("normalizes daily goals to supported bounds", () => {
    const progress = initialQuranProgress()

    expect(updateQuranDailyGoal(progress, 0).daily_goal).toBe(1)
    expect(updateQuranDailyGoal(progress, 8.6).daily_goal).toBe(9)
    expect(updateQuranDailyGoal(progress, 50).daily_goal).toBe(30)
  })

  it("uses QuranWBW static page boundaries", () => {
    expect(quranPageStartKeys).toHaveLength(QURAN_TOTAL_PAGES)
    expect(getQuranPageStart(600)).toEqual({ surah: 100, ayah: 6 })
  })
})
