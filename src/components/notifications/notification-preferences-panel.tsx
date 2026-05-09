import { useState } from "react"
import { Volume2, Vibrate, Moon, RotateCcw } from "lucide-react"
import { notificationPrefs, type NotificationPreferences } from "@/lib/notification-prefs"
import { cn } from "@/lib/utils"

interface NotificationPreferencesPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPreferencesPanel({ open, onClose }: NotificationPreferencesPanelProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(notificationPrefs.getAll())

  function handleToggleSound() {
    const updated = notificationPrefs.update({ soundEnabled: !prefs.soundEnabled })
    setPrefs(updated)
  }

  function handleToggleVibration() {
    const updated = notificationPrefs.update({ vibrationEnabled: !prefs.vibrationEnabled })
    setPrefs(updated)
  }

  function handleToggleQuietHours() {
    const updated = notificationPrefs.update({ muteDuringQuietHours: !prefs.muteDuringQuietHours })
    setPrefs(updated)
  }

  function handleSoundVolumeChange(volume: number) {
    const updated = notificationPrefs.update({ soundVolume: volume })
    setPrefs(updated)
  }

  function handleVibrationType(type: "light" | "medium" | "heavy") {
    const updated = notificationPrefs.update({ vibrationType: type })
    setPrefs(updated)
  }

  function handleQuietHoursStartChange(time: string) {
    const updated = notificationPrefs.update({ quietHoursStart: time })
    setPrefs(updated)
  }

  function handleQuietHoursEndChange(time: string) {
    const updated = notificationPrefs.update({ quietHoursEnd: time })
    setPrefs(updated)
  }

  function handleTestNotification() {
    notificationPrefs.notify()
  }

  function handleReset() {
    if (confirm("Reset notification preferences to defaults?")) {
      const updated = notificationPrefs.reset()
      setPrefs(updated)
    }
  }

  if (!open) return null

  return (
    <div className="space-y-5">
      {/* Sound Settings */}
      <section className="rounded-xl border border-sage/15 bg-surface-container-low/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-pale text-primary">
              <Volume2 className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-foreground">Sound</h3>
          </div>
          <button
            onClick={handleToggleSound}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              prefs.soundEnabled ? "bg-sage" : "bg-surface-container"
            )}
            role="switch"
            aria-checked={prefs.soundEnabled}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                prefs.soundEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {prefs.soundEnabled && (
          <div className="space-y-3 mt-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Volume</label>
                <span className="text-sm font-bold text-primary">{Math.round(prefs.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={prefs.soundVolume}
                onChange={(e) => handleSoundVolumeChange(Number(e.target.value))}
                className="w-full h-2 bg-sage/20 rounded-full appearance-none cursor-pointer accent-sage"
              />
            </div>

            <button
              onClick={handleTestNotification}
              className="w-full text-sm px-3 py-2 rounded-lg border border-sage/30 text-sage hover:bg-sage/10 transition-colors font-semibold"
            >
              Test sound
            </button>
          </div>
        )}
      </section>

      {/* Vibration Settings */}
      <section className="rounded-xl border border-sage/15 bg-surface-container-low/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blush-pale text-accent-foreground">
              <Vibrate className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-foreground">Vibration</h3>
          </div>
          <button
            onClick={handleToggleVibration}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              prefs.vibrationEnabled ? "bg-accent" : "bg-surface-container"
            )}
            role="switch"
            aria-checked={prefs.vibrationEnabled}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                prefs.vibrationEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {prefs.vibrationEnabled && (
          <div className="space-y-2 mt-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pattern</p>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "medium", "heavy"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleVibrationType(type)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-xs font-semibold transition-all capitalize",
                    prefs.vibrationType === type
                      ? "bg-accent text-white shadow-sm"
                      : "bg-surface-container border border-sage/10 text-foreground hover:border-sage/25"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quiet Hours */}
      <section className="rounded-xl border border-sage/15 bg-surface-container-low/30 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-pale text-secondary">
              <Moon className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-foreground">Quiet Hours</h3>
          </div>
          <button
            onClick={handleToggleQuietHours}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              prefs.muteDuringQuietHours ? "bg-secondary" : "bg-surface-container"
            )}
            role="switch"
            aria-checked={prefs.muteDuringQuietHours}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                prefs.muteDuringQuietHours ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        {prefs.muteDuringQuietHours && (
          <div className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  From
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) => handleQuietHoursStartChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-sage/20 bg-surface-container text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  To
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) => handleQuietHoursEndChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-sage/20 bg-surface-container text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center py-2 rounded-lg bg-surface-container italic">
              Sound & vibration disabled during these hours
            </p>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleReset}
          className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-2.5 rounded-lg border border-sage/20 hover:bg-sage/10 transition-colors font-semibold text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={onClose}
          className="flex-1 text-sm px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  )
}
