import { CalendarDays, Home, Moon, Utensils } from "lucide-react"
import { NavLink } from "react-router-dom"

import { AppLanguage } from "@/lib/app-settings"
import { cn } from "@/lib/utils"

const navItems = [
  { path: "/", icon: Home, labels: { en: "Daily", id: "Harian" } },
  { path: "/quran", icon: Moon, labels: { en: "Quran", id: "Quran" } },
  { path: "/fasting", icon: Utensils, labels: { en: "Fasting", id: "Puasa" } },
  { path: "/cycle", icon: CalendarDays, labels: { en: "Cycle", id: "Siklus" } },
]

type BottomNavProps = {
  language: AppLanguage
}

export function BottomNav({ language }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-sage/10 bg-card/85 shadow-[0_-4px_20px_0_rgba(139,168,136,0.08)] backdrop-blur">
      <div className="mx-auto flex h-20 max-w-5xl items-center justify-around px-4 pb-safe pt-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex min-w-16 flex-col items-center justify-center gap-1 text-sage/55 transition",
                isActive && "scale-105 text-blush",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
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
