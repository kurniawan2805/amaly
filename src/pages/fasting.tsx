import { Moon, Plus, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { AppLanguage, HijriOffset } from "@/lib/app-settings"
import { type FastingState, getUpcomingSunnahFasts, isNextRamadanWithinDays } from "@/lib/fasting-progress"
import { formatHijriDate } from "@/lib/hijri-date"
import { cn } from "@/lib/utils"
import { useAppStore, type StoreState } from "@/stores/app-store"
import { useShallow } from "zustand/react/shallow"


const offsetOptions: HijriOffset[] = [-2, -1, 0, 1, 2]

function formatOffset(offset: HijriOffset) {
  return offset > 0 ? `+${offset}` : String(offset)
}

function formatGregorian(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    weekday: "short",
  }).format(date)
}

export default function FastingPage() {
  const language = useAppStore((s: StoreState) => s.settings.language)
  const hijriOffset = useAppStore((s: StoreState) => s.settings.hijriOffset)
  const fastingState = useAppStore((s: StoreState) => s.fastingState)
  
  const { onAddQadhaDebt, onMarkQadhaPaid, onSetHijriOffset, onToggleSahurReminder } = useAppStore(
    useShallow((s: StoreState) => ({
      onAddQadhaDebt: s.addQadhaDebt,
      onMarkQadhaPaid: s.markQadhaPaid,
      onSetHijriOffset: s.setHijriOffset,
      onToggleSahurReminder: s.toggleSahurReminder,
    }))
  )

  const circumference = 283
  const paidProgress = fastingState.totalQadhaDebt > 0 ? fastingState.paidQadha / fastingState.totalQadhaDebt : 1
  const progressOffset = circumference - Math.min(1, paidProgress) * circumference
  const hasRamadanWarning = fastingState.remainingQadha > 0 && isNextRamadanWithinDays(hijriOffset)
  const upcomingFasts = getUpcomingSunnahFasts(hijriOffset)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-5 pb-28">
      <section className="space-y-3">
        <div>
          <p className="font-serif text-3xl font-semibold text-primary">{formatHijriDate(new Date(), hijriOffset, language)}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Umm al-Qura date with local correction</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Adjust Hijri Date</p>
          <ToggleGroup aria-label="Adjust Hijri date" className="flex w-full sm:w-fit">
            {offsetOptions.map((offset) => (
              <ToggleGroupItem
                className="min-w-12"
                key={offset}
                onClick={() => onSetHijriOffset(offset)}
                pressed={hijriOffset === offset}
              >
                {formatOffset(offset)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </section>

      <section>
        <Card
          className={cn(
            "relative flex flex-col items-center overflow-hidden p-4 text-center transition",
            hasRamadanWarning ? "border-amber-300 shadow-[0_0_28px_rgba(252,211,77,0.18)]" : "border-sage/15",
          )}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-sage-muted/10" />
          <h2 className="font-serif text-2xl font-medium text-primary">Remaining Qadha</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasRamadanWarning ? "Ramadan is close. Keep this gentle and steady." : "Days to make up before Ramadan"}
          </p>

          <div className="relative my-6 flex h-36 w-36 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                className="stroke-surface-container-highest"
                cx="50"
                cy="50"
                fill="none"
                opacity="0.75"
                r="45"
                strokeWidth="6"
              />
              <circle
                className="stroke-primary"
                cx="50"
                cy="50"
                fill="none"
                r="45"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                strokeWidth="6"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-serif text-3xl font-semibold text-primary">{fastingState.remainingQadha}</span>
              <span className="mt-1 text-sm font-semibold text-muted-foreground">Days Remaining</span>
              <span className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {fastingState.paidQadha} of {fastingState.totalQadhaDebt} paid
              </span>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            <Button onClick={() => onAddQadhaDebt(1)} type="button" variant="outline">
              <Plus className="h-4 w-4" />
              Add Debt
            </Button>
            <Button disabled={fastingState.remainingQadha === 0} onClick={onMarkQadhaPaid} type="button">
              Mark Paid
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-medium text-primary">Upcoming Sunnah</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {`Next ${upcomingFasts.length} fasting opportunit${upcomingFasts.length === 1 ? "y" : "ies"}`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {upcomingFasts.map((fast) => {
            const reminderActive = fastingState.sahurReminderDates.includes(fast.dateKey)

            return (
              <Card className="flex items-center gap-4 p-4" key={fast.dateKey}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-pale text-sage-deep">
                  <Sun className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-foreground">{fast.labels.join(" + ")}</h3>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    {formatGregorian(fast.date)} • {fast.hijriDate[language]}
                  </p>
                </div>
                <Button
                  aria-label="Toggle Sahur reminder"
                  onClick={() => onToggleSahurReminder(fast.dateKey)}
                  size="icon"
                  type="button"
                  variant={reminderActive ? "default" : "ghost"}
                >
                  <Moon className="h-4 w-4" />
                </Button>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
