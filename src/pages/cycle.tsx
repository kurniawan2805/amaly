import { CalendarDays, Droplets, Eye, EyeOff, FileText, Heart, Moon, Sparkles, Sun } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  type CycleLog,
  type CycleState,
  formatCycleMonthMarkdown,
  getCycleSummary,
} from "@/lib/cycle-progress"
import { cn } from "@/lib/utils"

type CyclePageProps = {
  cycleState: CycleState
  onStartPeriod: (date?: string) => void
  onEndPeriod: (date?: string) => void
  onSaveCycleRange: (input: { startDate: string; endDate: string }) => void
  onConfirmCycleQadha: (logId: string) => void
  onIgnoreCycleQadha: (logId: string) => void
  onToggleCyclePrivacy: () => void
  onToggleCycleSymptom: (symptomId: string) => void
}

const symptomOptions = [
  { id: "cramps-low", label: "Cramps Low", icon: Droplets },
  { id: "cramps-mid", label: "Cramps Mid", icon: Droplets },
  { id: "cramps-high", label: "Cramps High", icon: Droplets },
  { id: "energy-low", label: "Energy Low", icon: Moon },
  { id: "energy-high", label: "Energy High", icon: Sun },
  { id: "mood-calm", label: "Calm", icon: Heart },
  { id: "mood-tender", label: "Tender", icon: Sparkles },
]

function formatDate(dateKey: string | null | undefined) {
  if (!dateKey) {
    return "Not enough data"
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`))
}

function durationDays(log: CycleLog) {
  const start = new Date(`${log.startDate}T12:00:00`)
  const end = new Date(`${log.endDate}T12:00:00`)
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1)
}

function statusLabel(log: CycleLog) {
  if (log.qadhaUpdateStatus === "pending") return `${log.qadhaOverlapDays} Qadha days pending`
  if (log.qadhaUpdateStatus === "added") return `${log.qadhaOverlapDays} Qadha days added`
  if (log.qadhaUpdateStatus === "ignored") return "Qadha declined"
  return "No Ramadan overlap"
}

function CycleRing({ dayInCycle, phase, privateView }: { dayInCycle: number | null; phase: string | null; privateView: boolean }) {
  const circumference = 276
  const progress = dayInCycle ? Math.min(1, dayInCycle / 28) : 0
  const offset = circumference - progress * circumference

  return (
    <div className="relative flex h-64 w-64 items-center justify-center rounded-full border-[12px] border-surface-container-highest shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle className="stroke-surface-container-highest" cx="50" cy="50" fill="none" r="44" strokeWidth="10" />
        <circle
          className="stroke-blush"
          cx="50"
          cy="50"
          fill="none"
          r="44"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="10"
        />
      </svg>
      <div className="z-10 flex h-40 w-40 flex-col items-center justify-center rounded-full bg-background/85 text-center backdrop-blur">
        <Heart className="h-9 w-9 fill-blush text-blush" />
        <span className={cn("mt-3 block font-serif text-2xl font-medium text-primary", privateView && "blur-sm")}>
          {phase ?? "Setup"}
        </span>
        <span className={cn("mt-1 text-xs font-semibold uppercase tracking-wide text-secondary", privateView && "blur-sm")}>
          {dayInCycle ? `Day ${dayInCycle}` : "No Cycle Yet"}
        </span>
      </div>
    </div>
  )
}

export default function CyclePage({
  cycleState,
  onStartPeriod,
  onEndPeriod,
  onSaveCycleRange,
  onConfirmCycleQadha,
  onIgnoreCycleQadha,
  onToggleCyclePrivacy,
  onToggleCycleSymptom,
}: CyclePageProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [revealed, setRevealed] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const summary = useMemo(() => getCycleSummary(cycleState), [cycleState])
  const phase = summary.phase
  const dayInCycle = summary.dayInCycle
  const privateView = cycleState.settings.privacyEnabled && !revealed
  const pendingQadhaLog = cycleState.logs.find((log) => log.qadhaUpdateStatus === "pending")
  const markdown = useMemo(() => formatCycleMonthMarkdown(cycleState), [cycleState])
  const phaseProgress = dayInCycle ? Math.round((dayInCycle / cycleState.settings.avgCycleLength) * 100) : 0

  function submitCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSaveCycleRange({ startDate, endDate })
    setStartDate("")
    setEndDate("")
  }

  function copyMarkdown() {
    void navigator.clipboard?.writeText(markdown)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-8 pb-32">
      <section className="space-y-4 text-center">
        <div className="flex justify-center">
          <Button onClick={onToggleCyclePrivacy} size="sm" type="button" variant="outline">
            {cycleState.settings.privacyEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {cycleState.settings.privacyEnabled ? "Privacy On" : "Privacy Off"}
          </Button>
        </div>
        <h2 className="font-serif text-4xl font-semibold leading-tight text-foreground">Your Cycle</h2>
        <p className="text-lg leading-8 text-muted-foreground">A private health rhythm with permission-based Qadha support.</p>
      </section>

      <button
        className="flex justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setRevealed(true)}
        type="button"
      >
        <CycleRing dayInCycle={dayInCycle} phase={phase} privateView={privateView} />
      </button>

      {privateView ? (
        <button
          className="rounded-xl border border-sage/15 bg-surface-container-low px-4 py-3 text-sm font-semibold text-muted-foreground"
          onClick={() => setRevealed(true)}
          type="button"
        >
          Health data hidden. Tap to reveal for this visit.
        </button>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current Phase</p>
          <p className={cn("mt-2 font-serif text-2xl font-semibold text-primary", privateView && "blur-sm")}>
            {phase ?? "Not enough data"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cycle Progress</p>
          <p className={cn("mt-2 font-serif text-2xl font-semibold text-primary", privateView && "blur-sm")}>
            {dayInCycle ? `${phaseProgress}%` : "Setup"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Next Period</p>
          <p className={cn("mt-2 font-serif text-2xl font-semibold text-primary", privateView && "blur-sm")}>
            {formatDate(summary.nextPeriodDate)}
          </p>
        </Card>
      </section>

      <Card className="p-5">
        <div className="mb-5">
          <h3 className="font-serif text-2xl font-semibold text-primary">Period Actions</h3>
          <p className={cn("mt-1 text-sm font-semibold text-muted-foreground", privateView && cycleState.activePeriod && "blur-sm")}>
            {cycleState.activePeriod
              ? privateView
                ? "Active period hidden."
                : `Started ${formatDate(cycleState.activePeriod.startDate)}`
              : "Start or end a period with one tap."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button disabled={Boolean(cycleState.activePeriod)} onClick={() => onStartPeriod()} type="button" variant="outline">
            <Droplets className="h-4 w-4" />
            Period Started
          </Button>
          <Button disabled={!cycleState.activePeriod} onClick={() => onEndPeriod()} type="button">
            <CalendarDays className="h-4 w-4" />
            Period Ended
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-5">
          <h3 className="font-serif text-2xl font-semibold text-primary">Backfill Cycle Range</h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Use Gregorian dates. Ramadan overlap will ask before adding Qadha.</p>
        </div>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitCycle}>
          <label className="text-sm font-bold text-muted-foreground">
            Start Date
            <input
              className="mt-2 h-11 w-full rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-sage"
              onChange={(event) => setStartDate(event.target.value)}
              required
              type="date"
              value={startDate}
            />
          </label>
          <label className="text-sm font-bold text-muted-foreground">
            End Date
            <input
              className="mt-2 h-11 w-full rounded-xl border border-sage/15 bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-sage"
              onChange={(event) => setEndDate(event.target.value)}
              required
              type="date"
              value={endDate}
            />
          </label>
          <div className="sm:col-span-2">
            <Button className="w-full sm:w-auto" type="submit">
              Save Range
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <h3 className="font-serif text-2xl font-semibold text-primary">Symptoms</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {symptomOptions.map((symptom) => {
            const active = cycleState.currentSymptoms.includes(symptom.id)

            return (
              <button
                className={cn(
                  "flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-sage/15 bg-card px-3 text-center transition active:scale-95",
                  active && "border-blush/50 bg-blush/10 text-accent-foreground",
                )}
                key={symptom.id}
                onClick={() => onToggleCycleSymptom(symptom.id)}
                type="button"
              >
                <symptom.icon className={cn("h-6 w-6 text-primary", active && "text-blush")} />
                <span className="text-sm font-semibold">{symptom.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-3xl font-medium text-primary">Cycle History</h3>
            <p className="mt-1 text-muted-foreground">Recent cycle ranges and Qadha status.</p>
          </div>
          <Badge>{cycleState.logs.length} Logged</Badge>
        </div>
        <div className="space-y-3">
          {[...cycleState.logs].reverse().slice(0, 8).map((log) => (
            <Card className="flex items-center justify-between gap-4 p-4" key={log.id}>
              <div className={cn(privateView && "blur-sm")}>
                <p className="font-semibold text-foreground">
                  {formatDate(log.startDate)} - {formatDate(log.endDate)}
                </p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {durationDays(log)} days • {statusLabel(log)}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {log.symptoms.length > 0 ? log.symptoms.join(", ") : "No symptoms logged"}
                </p>
              </div>
              {log.qadhaUpdateStatus === "pending" ? <Badge>Pending</Badge> : null}
            </Card>
          ))}
          {cycleState.logs.length === 0 ? (
            <Card className="p-4 text-sm font-semibold text-muted-foreground">No cycle ranges logged yet.</Card>
          ) : null}
        </div>
      </section>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-primary">Obsidian Export</h3>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Markdown summary for this month.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setExportOpen((current) => !current)} type="button" variant="outline">
              <FileText className="h-4 w-4" />
              {exportOpen ? "Hide" : "Preview"}
            </Button>
            <Button onClick={copyMarkdown} type="button">
              Copy
            </Button>
          </div>
        </div>
        {exportOpen ? (
          <textarea
            className="mt-4 min-h-56 w-full rounded-xl border border-sage/15 bg-background p-3 font-mono text-sm text-foreground outline-none"
            readOnly
            value={markdown}
          />
        ) : null}
      </Card>

      {pendingQadhaLog ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 px-4 pb-4 sm:items-center sm:pb-0">
          <Card className="w-full max-w-sm p-5 shadow-2xl">
            <h3 className="font-serif text-2xl font-semibold text-primary">Ramadan Qadha</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
              I noticed your cycle ended during Ramadan. Should I add {pendingQadhaLog.qadhaOverlapDays} days to your Remaining Qadha?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => onIgnoreCycleQadha(pendingQadhaLog.id)} type="button" variant="ghost">
                Not now
              </Button>
              <Button onClick={() => onConfirmCycleQadha(pendingQadhaLog.id)} type="button">
                Add Qadha
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
