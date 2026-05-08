import { useEffect, useState } from "react"
import { Bell, Trash2, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { notificationHistory, type NotificationHistoryItem } from "@/lib/notification-history"

interface NotificationHistoryPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationHistoryPanel({ open, onClose }: NotificationHistoryPanelProps) {
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  function loadNotifications() {
    setNotifications(notificationHistory.getAll())
    setUnreadCount(notificationHistory.getUnreadCount())
  }

  function handleMarkAsRead(id: string) {
    notificationHistory.markAsRead(id)
    loadNotifications()
  }

  function handleMarkAllAsRead() {
    notificationHistory.markAllAsRead()
    loadNotifications()
  }

  function handleDelete(id: string) {
    notificationHistory.delete(id)
    loadNotifications()
  }

  function handleClear() {
    if (confirm("Clear all notifications? This cannot be undone.")) {
      notificationHistory.clear()
      loadNotifications()
    }
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-card p-4 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex gap-2 mb-4">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex-1 text-xs px-2 py-1 rounded border border-sage/30 hover:bg-sage/10 transition-colors"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={handleClear}
              className="flex-1 text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/75">Your partner nudges will appear here</p>
          </div>
        ) : (
          // Notification List
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  notif.readAt
                    ? "bg-muted/50 border-sage/10"
                    : "bg-primary/5 border-primary/30"
                )}
              >
                {/* Title & Time */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1">
                    {notif.readAt ? (
                      <CheckCheck className="w-4 h-4 text-sage flex-shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {notif.type === "nudge" ? "Partner Nudge" : "Partner Progress"}
                      </p>
                      <p className="text-xs text-muted-foreground">{notif.senderName}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">{formatTime(notif.timestamp)}</p>
                </div>

                {/* Message */}
                <p className="text-sm leading-5 mb-2 ml-6">{notif.message}</p>

                {/* Metadata */}
                {notif.metadata && (
                  <div className="ml-6 text-xs text-muted-foreground space-y-1">
                    {notif.metadata.pages && <p>Pages: {notif.metadata.pages}</p>}
                    {notif.metadata.goal && <p>Goal: {notif.metadata.goal} pages</p>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-2 ml-6">
                  {!notif.readAt && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs px-2 py-1 rounded hover:bg-primary/10 text-primary transition-colors"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="text-xs px-2 py-1 rounded hover:bg-red-50 text-red-600 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
