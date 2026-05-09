import { type CSSProperties, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"

const flowerEmojis = ["💐", "🌸", "🌷", "🌹", "🌺", "🌼", "🪷", "🌸", "🌷", "🌹", "🌺", "🌼", "💐", "🪷"]

export function QuranBurst() {
  const quranBurst = useAppStore((s) => s.quranBurst)
  const dismissQuranBurst = useAppStore((s) => s.dismissQuranBurst)

  const flowerConfetti = useMemo(() => {
    return Array.from({ length: 64 }, (_, index) => ({
      emoji: flowerEmojis[index % flowerEmojis.length],
      left: (index * 37) % 100,
      top: (index * 23) % 100,
      delay: (index % 16) * 42,
      drift: ((index % 9) - 4) * 18,
      fall: 70 + (index % 7) * 18,
      rotate: ((index % 11) - 5) * 18,
      size: index % 4 === 0 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
    }))
  }, [])

  if (!quranBurst) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm transition-opacity duration-1000">
      {flowerConfetti.map((flower, index) => (
        <span
          key={index}
          className={cn("animate-flower-burst fixed", flower.size)}
          style={
            {
              left: `${flower.left}vw`,
              top: `${flower.top}vh`,
              animationDelay: `${flower.delay}ms`,
              "--flower-x": `${flower.drift}px`,
              "--flower-y": `${flower.fall}px`,
              "--flower-rotate": `${flower.rotate}deg`,
            } as CSSProperties
          }
        >
          {flower.emoji}
        </span>
      ))}
      <div className="pointer-events-auto fixed inset-x-6 top-1/2 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-sage/20 bg-card p-6 text-center text-card-foreground shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Barakah Burst</p>
        {quranBurst.type === "juz" ? (
          <>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-primary">
              MashaAllah! You've completed Juz {quranBurst.juz}!
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">May this bring barakah to your day.</p>
          </>
        ) : (
          <>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-primary">MashaAllah! Daily Goal Achieved!</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">A small steady step, beautifully kept.</p>
          </>
        )}
        <button className="mt-5 text-sm font-bold text-primary" onClick={dismissQuranBurst} type="button">
          Close
        </button>
      </div>
    </div>
  )
}
