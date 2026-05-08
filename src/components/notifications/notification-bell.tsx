import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { notificationHistory } from "@/lib/notification-history"

interface NotificationBellProps {
  onClick: () => void
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Initial count
    setUnreadCount(notificationHistory.getUnreadCount())

    // Listen for storage changes (since notificationHistory modifies localStorage)
    const handleStorageChange = () => {
      setUnreadCount(notificationHistory.getUnreadCount())
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg transition-colors",
        unreadCount > 0 ? "bg-primary/10 hover:bg-primary/20" : "hover:bg-sage/10",
      )}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-primary" : "text-muted-foreground")} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}
