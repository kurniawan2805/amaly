/**
 * Offline Nudge Queue
 * Manages pending partner nudges that fail due to offline/network issues
 * Retries automatically when connection is restored
 */

const STORAGE_KEY = "amaly.nudge-queue.v1"

export interface QueuedNudge {
  id: string
  partnerId: string
  type: "nudge" | "quran_goal"
  payload: Record<string, unknown>
  timestamp: number
  retries: number
  status: "pending" | "sending" | "sent" | "failed"
  error?: string
}

class NudgeQueue {
  private queue: Map<string, QueuedNudge> = new Map()

  constructor() {
    this.load()
  }

  /**
   * Load queue from localStorage on init
   */
  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored) as QueuedNudge[]
        this.queue.clear()
        items.forEach((item) => this.queue.set(item.id, item))
      }
    } catch (error) {
      console.error("Failed to load nudge queue from localStorage:", error)
      this.queue.clear()
    }
  }

  /**
   * Save queue to localStorage
   */
  private save(): void {
    try {
      const items = Array.from(this.queue.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error("Failed to save nudge queue to localStorage:", error)
    }
  }

  /**
   * Add a nudge to the queue
   */
  add(nudge: Omit<QueuedNudge, "id" | "timestamp">): QueuedNudge {
    const id = `nudge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const queued: QueuedNudge = {
      id,
      timestamp: Date.now(),
      retries: 0,
      ...nudge,
    }
    this.queue.set(id, queued)
    this.save()
    return queued
  }

  /**
   * Update nudge status
   */
  updateStatus(id: string, status: QueuedNudge["status"], error?: string): void {
    const nudge = this.queue.get(id)
    if (nudge) {
      nudge.status = status
      if (error) nudge.error = error
      if (status === "sent") {
        nudge.error = undefined
      }
      this.save()
    }
  }

  /**
   * Mark nudge as being retried
   */
  markRetry(id: string): void {
    const nudge = this.queue.get(id)
    if (nudge) {
      nudge.retries += 1
      nudge.status = "sending"
      this.save()
    }
  }

  /**
   * Remove nudge from queue (after successful send)
   */
  remove(id: string): void {
    this.queue.delete(id)
    this.save()
  }

  /**
   * Clear entire queue
   */
  clear(): void {
    this.queue.clear()
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Get all queued nudges
   */
  getAll(): QueuedNudge[] {
    return Array.from(this.queue.values())
  }

  /**
   * Get pending nudges (not yet sent)
   */
  getPending(): QueuedNudge[] {
    return Array.from(this.queue.values()).filter(
      (n) => n.status === "pending" || n.status === "failed"
    )
  }

  /**
   * Get nudges for a specific partner
   */
  getForPartner(partnerId: string): QueuedNudge[] {
    return Array.from(this.queue.values()).filter((n) => n.partnerId === partnerId)
  }

  /**
   * Check if nudge exceeds max retries (prevent infinite retries)
   */
  shouldRetry(id: string, maxRetries: number = 3): boolean {
    const nudge = this.queue.get(id)
    return nudge ? nudge.retries < maxRetries : false
  }
}

// Singleton instance
export const nudgeQueue = new NudgeQueue()
