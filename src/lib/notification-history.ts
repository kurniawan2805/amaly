/**
 * Notification History
 * Stores and retrieves partner notification history with read/unread tracking
 */

export interface NotificationHistoryItem {
  id: string
  type: "nudge" | "quran_goal"
  partnerId: string
  senderName: string
  message: string
  timestamp: number
  readAt: number | null
  metadata?: {
    pages?: number
    goal?: number
  }
}

const STORAGE_KEY = "amaly.notification-history.v1"
const MAX_HISTORY = 100 // Keep last 100 notifications

class NotificationHistory {
  private history: NotificationHistoryItem[] = []

  constructor() {
    this.load()
  }

  /**
   * Load history from localStorage
   */
  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.history = JSON.parse(stored) as NotificationHistoryItem[]
        // Keep only recent notifications
        if (this.history.length > MAX_HISTORY) {
          this.history = this.history.slice(-MAX_HISTORY)
          this.save()
        }
      }
    } catch (error) {
      console.error("Failed to load notification history:", error)
      this.history = []
    }
  }

  /**
   * Save history to localStorage
   */
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history))
    } catch (error) {
      console.error("Failed to save notification history:", error)
    }
  }

  /**
   * Add notification to history
   */
  add(notification: Omit<NotificationHistoryItem, "id" | "timestamp" | "readAt">): NotificationHistoryItem {
    const item: NotificationHistoryItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      readAt: null,
      ...notification,
    }
    this.history.push(item)

    // Trim if exceeds max
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY)
    }

    this.save()
    return item
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): boolean {
    const item = this.history.find((n) => n.id === id)
    if (item) {
      item.readAt = Date.now()
      this.save()
      return true
    }
    return false
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const now = Date.now()
    this.history.forEach((n) => {
      if (!n.readAt) {
        n.readAt = now
      }
    })
    this.save()
  }

  /**
   * Get all notifications (most recent first)
   */
  getAll(): NotificationHistoryItem[] {
    return [...this.history].reverse()
  }

  /**
   * Get unread notifications (most recent first)
   */
  getUnread(): NotificationHistoryItem[] {
    return this.history.filter((n) => !n.readAt).reverse()
  }

  /**
   * Get notifications for a specific partner
   */
  getForPartner(partnerId: string): NotificationHistoryItem[] {
    return this.history.filter((n) => n.partnerId === partnerId).reverse()
  }

  /**
   * Get notifications from last N hours
   */
  getRecent(hours: number = 24): NotificationHistoryItem[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    return this.history.filter((n) => n.timestamp > cutoff).reverse()
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.history.filter((n) => !n.readAt).length
  }

  /**
   * Delete a notification
   */
  delete(id: string): boolean {
    const index = this.history.findIndex((n) => n.id === id)
    if (index >= 0) {
      this.history.splice(index, 1)
      this.save()
      return true
    }
    return false
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = []
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number
    unread: number
    byType: Record<string, number>
    byPartner: Record<string, number>
  } {
    const stats = {
      total: this.history.length,
      unread: this.getUnreadCount(),
      byType: {} as Record<string, number>,
      byPartner: {} as Record<string, number>,
    }

    this.history.forEach((n) => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1
      stats.byPartner[n.partnerId] = (stats.byPartner[n.partnerId] || 0) + 1
    })

    return stats
  }
}

// Singleton instance
export const notificationHistory = new NotificationHistory()
