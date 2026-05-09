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
        "fixed top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border transition-all duration-500 z-[60] animate-in fade-in slide-in-from-top-4",
        isOnline
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-amber-50 border-amber-200 text-amber-700",
        className,
      )}
    >
      {isOnline ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wide">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">Offline Mode</span>
        </>
      )}
    </div>
  )
}
