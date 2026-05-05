import { BarChart3, BookOpen, CalendarHeart, Home, Moon } from "lucide-react"
import { NavLink } from "react-router-dom"

import { AppLanguage } from "@/lib/app-settings"
import { cn } from "@/lib/utils"

const navItems = [
  { path: "/", icon: Home, labels: { en: "Daily", id: "Harian" } },
  { path: "/quran", icon: Moon, labels: { en: "Quran", id: "Quran" } },
  { path: "/duas", icon: BookOpen, labels: { en: "Duas", id: "Doa" } },
  { path: "/cycle", icon: CalendarHeart, labels: { en: "Cycle", id: "Siklus" } },
  { path: "/report", icon: BarChart3, labels: { en: "Report", id: "Report" } },
]

type BottomNavProps = {
  cycleModeActive?: boolean
  dhikrReminderActive?: boolean
  language: AppLanguage
}

export function BottomNav({ cycleModeActive = false, dhikrReminderActive = false, language }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-sage/10 bg-card/85 shadow-[0_-4px_20px_0_rgba(139,168,136,0.08)] backdrop-blur">
      <div className="mx-auto flex h-20 max-w-5xl items-center justify-around px-4 pb-safe pt-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex min-w-14 flex-col items-center justify-center gap-1 text-sage/55 transition sm:min-w-16",
                isActive && "scale-105 text-blush",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
                  {item.path === "/duas" && dhikrReminderActive ? (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-card bg-sage" />
                  ) : null}
                  {item.path === "/cycle" && cycleModeActive ? (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-card bg-blush" />
                  ) : null}
                </span>
                <span className={cn("text-[11px] font-semibold", isActive && "text-sage-deep")}>
                  {item.labels[language]}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
