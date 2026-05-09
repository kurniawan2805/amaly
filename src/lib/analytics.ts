/**
 * Analytics tracking for two-tier bookmark system
 * Tracks context bookmark navigation, main bookmark ayah-level logging, and user engagement
 */

export type AnalyticsEventName =
  | "bookmark_context_navigate"
  | "bookmark_context_add"
  | "bookmark_context_remove"
  | "bookmark_context_reorder"
  | "bookmark_main_update"
  | "bookmark_main_ayah_logged"
  | "bookmark_ayah_highlighted"
  | "continue_reading_click"

export type AnalyticsEvent = {
  name: AnalyticsEventName
  timestamp: string // ISO timestamp
  sessionId: string
  properties?: Record<string, string | number | boolean | null>
}

const ANALYTICS_STORAGE_KEY = "amaly.analytics-events.v1"
const SESSION_ID_KEY = "amaly.session-id.v1"
const MAX_EVENTS_PER_SESSION = 500 // Prevent storage from growing too large

class AnalyticsTracker {
  private sessionId: string
  private events: AnalyticsEvent[] = []
  private isInitialized = false

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
  }

  private getOrCreateSessionId(): string {
    const stored = localStorage.getItem(SESSION_ID_KEY)
    if (stored) {
      return stored
    }
    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(SESSION_ID_KEY, newId)
    return newId
  }

  private loadEvents(): void {
    if (this.isInitialized) return

    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY)
      this.events = stored ? JSON.parse(stored) : []
      this.isInitialized = true
    } catch (error) {
      console.error("Failed to load analytics events:", error)
      this.events = []
      this.isInitialized = true
    }
  }

  private saveEvents(): void {
    try {
      // Keep only most recent events if over limit
      if (this.events.length > MAX_EVENTS_PER_SESSION) {
        this.events = this.events.slice(-MAX_EVENTS_PER_SESSION)
      }
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.events))
    } catch (error) {
      console.error("Failed to save analytics events:", error)
    }
  }

  track(
    name: AnalyticsEventName,
    properties?: Record<string, string | number | boolean | null>
  ): void {
    this.loadEvents()

    const event: AnalyticsEvent = {
      name,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      properties: properties || {},
    }

    this.events.push(event)
    this.saveEvents()

    // Log in development
    if (import.meta.env.DEV) {
      console.log("[Analytics]", name, properties || {})
    }
  }

  /**
   * Get all tracked events (for reporting/sync to backend)
   */
  getEvents(limit?: number): AnalyticsEvent[] {
    this.loadEvents()
    return limit ? this.events.slice(-limit) : this.events
  }

  /**
   * Get events for a specific name
   */
  getEventsByName(name: AnalyticsEventName): AnalyticsEvent[] {
    this.loadEvents()
    return this.events.filter((e) => e.name === name)
  }

  /**
   * Clear all events (typically after successful sync to backend)
   */
  clearEvents(): void {
    this.events = []
    localStorage.removeItem(ANALYTICS_STORAGE_KEY)
  }

  /**
   * Get session summary for the current session
   */
  getSessionSummary(): {
    sessionId: string
    eventCount: number
    eventTypes: Record<AnalyticsEventName, number>
  } {
    this.loadEvents()
    const eventTypes: Record<AnalyticsEventName, number> = {} as Record<
      AnalyticsEventName,
      number
    >

    for (const event of this.events) {
      eventTypes[event.name] = (eventTypes[event.name] || 0) + 1
    }

    return {
      sessionId: this.sessionId,
      eventCount: this.events.length,
      eventTypes,
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker()

/**
 * Convenient tracking functions for bookmark events
 */

export function trackContextBookmarkNavigate(
  contextId: string,
  context: "habit" | "daily" | "hifz" | "murojaah" | "custom",
  page: number
): void {
  analytics.track("bookmark_context_navigate", {
    contextId,
    context,
    page,
  })
}

export function trackContextBookmarkAdd(
  context: "habit" | "daily" | "hifz" | "murojaah" | "custom",
  page: number
): void {
  analytics.track("bookmark_context_add", {
    context,
    page,
  })
}

export function trackContextBookmarkRemove(
  contextId: string,
  context: "habit" | "daily" | "hifz" | "murojaah" | "custom"
): void {
  analytics.track("bookmark_context_remove", {
    contextId,
    context,
  })
}

export function trackContextBookmarkReorder(): void {
  analytics.track("bookmark_context_reorder")
}

export function trackMainBookmarkUpdate(
  page: number,
  surah?: number,
  ayah?: number,
  surahName?: string
): void {
  analytics.track("bookmark_main_update", {
    page,
    surah: surah || null,
    ayah: ayah || null,
    surahName: surahName || null,
    hasAyahData: !!(surah && ayah),
  })
}

export function trackMainBookmarkAyahLogged(
  page: number,
  surah: number,
  ayah: number,
  surahName: string
): void {
  analytics.track("bookmark_main_ayah_logged", {
    page,
    surah,
    ayah,
    surahName,
  })
}

export function trackAyahHighlighted(surah: number, ayah: number): void {
  analytics.track("bookmark_ayah_highlighted", {
    surah,
    ayah,
  })
}

export function trackContinueReadingClick(
  page: number,
  surah?: number,
  ayah?: number
): void {
  analytics.track("continue_reading_click", {
    page,
    surah: surah || null,
    ayah: ayah || null,
    hasAyahData: !!(surah && ayah),
  })
}
