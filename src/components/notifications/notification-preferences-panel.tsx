import { useState } from "react"
import { Volume2, Vibrate, Moon } from "lucide-react"
import { notificationPrefs, type NotificationPreferences } from "@/lib/notification-prefs"

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
    <div className="space-y-6">
      {/* Sound Settings */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Sound Notifications</h3>
        </div>

        <div className="space-y-4 ml-7">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Enable sound</label>
            <button
              onClick={handleToggleSound}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.soundEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.soundEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Volume Control */}
          {prefs.soundEnabled && (
            <>
              <div>
                <label className="text-sm block mb-2">Volume: {Math.round(prefs.soundVolume * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={prefs.soundVolume}
                  onChange={(e) => handleSoundVolumeChange(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Test Button */}
              <button
                onClick={handleTestNotification}
                className="text-xs px-3 py-1.5 rounded border border-sage/30 hover:bg-sage/10 transition-colors"
              >
                Test notification
              </button>
            </>
          )}
        </div>
      </div>

      {/* Vibration Settings */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-2 mb-4">
          <Vibrate className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Vibration</h3>
        </div>

        <div className="space-y-4 ml-7">
          {/* Vibration Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Enable vibration</label>
            <button
              onClick={handleToggleVibration}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.vibrationEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.vibrationEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Vibration Type */}
          {prefs.vibrationEnabled && (
            <div>
              <label className="text-sm block mb-2">Vibration pattern</label>
              <div className="space-y-2">
                {(["light", "medium", "heavy"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleVibrationType(type)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors capitalize ${
                      prefs.vibrationType === type
                        ? "bg-primary/20 text-primary border border-primary/50"
                        : "bg-muted/50 hover:bg-muted border border-transparent"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Quiet Hours</h3>
        </div>

        <div className="space-y-4 ml-7">
          {/* Quiet Hours Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm">Mute during quiet hours</label>
            <button
              onClick={handleToggleQuietHours}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs.muteDuringQuietHours ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs.muteDuringQuietHours ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Time Range */}
          {prefs.muteDuringQuietHours && (
            <div className="space-y-3">
              <div>
                <label className="text-sm block mb-1">Start time</label>
                <input
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) => handleQuietHoursStartChange(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-sage/30 bg-muted/50"
                />
              </div>
              <div>
                <label className="text-sm block mb-1">End time</label>
                <input
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) => handleQuietHoursEndChange(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-sage/30 bg-muted/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sound and vibration will be disabled during these hours
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={handleReset}
          className="flex-1 text-sm px-3 py-2 rounded border border-muted hover:bg-muted/50 transition-colors"
        >
          Reset to defaults
        </button>
        <button
          onClick={onClose}
          className="flex-1 text-sm px-3 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
