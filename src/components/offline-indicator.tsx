import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfflineIndicatorProps {
  className?: string
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Hide indicator after 2 seconds when coming back online
      const timeout = setTimeout(() => setShowIndicator(false), 2000)
      return () => clearTimeout(timeout)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Set initial state
    setIsOnline(navigator.onLine)
    if (!navigator.onLine) {
      setShowIndicator(true)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!showIndicator) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 z-50",
        isOnline
          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-amber-50 border border-amber-200 text-amber-700",
        className,
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Back online • Changes will sync</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Offline • Changes saved locally</span>
        </>
      )}
    </div>
  )
}
