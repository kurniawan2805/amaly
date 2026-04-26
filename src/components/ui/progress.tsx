import { cn } from "@/lib/utils"

type ProgressProps = {
  value: number
  className?: string
  indicatorClassName?: string
}

export function Progress({ value, className, indicatorClassName }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-sky-pale/60", className)}>
      <div
        className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
