import { Card } from "@/components/ui/card"
import type { QuranProgressState } from "@/lib/quran-progress"

type JuzGridProps = {
  progress: QuranProgressState
}

export function JuzGrid({ progress }: JuzGridProps) {
  const completed = new Set(progress.completed_juzs)
  const freshMilestones = new Set(progress.completed_juzs_this_update)
  const nextIncompleteJuz = Math.min(30, Math.max(1, progress.completed_juzs.length + 1))
  const activeJuz = completed.has(progress.juz) ? nextIncompleteJuz : progress.juz

  return (
    <Card className="grid grid-cols-5 gap-2 p-4 sm:grid-cols-6">
      {Array.from({ length: 30 }, (_, index) => {
        const juz = index + 1
        const isCompleted = completed.has(juz)
        const isFresh = freshMilestones.has(juz)
        const isCurrent = activeJuz === juz

        return (
          <div
            className={
              isFresh
                ? "flex aspect-square items-center justify-center rounded-lg border border-sage/30 bg-amber-300 text-sm font-bold text-amber-950 shadow-[0_0_18px_rgba(252,211,77,0.45)]"
                : isCompleted
                  ? "flex aspect-square items-center justify-center rounded-lg border border-sage/20 bg-primary text-sm font-bold text-primary-foreground"
                  : isCurrent
                    ? "flex aspect-square animate-pulse items-center justify-center rounded-lg border border-primary bg-sage-pale text-sm font-bold text-sage-deep"
                    : "flex aspect-square items-center justify-center rounded-lg border border-sage/10 bg-surface-container text-sm font-bold text-muted-foreground"
            }
            key={juz}
            title={`Juz ${juz}`}
          >
            {juz}
          </div>
        )
      })}
    </Card>
  )
}
