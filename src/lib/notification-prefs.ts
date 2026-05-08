/**
 * Notification Preferences
 * Manages user's notification sound, vibration, and other preferences
 */

export interface NotificationPreferences {
  soundEnabled: boolean
  soundVolume: number // 0-1
  vibrationEnabled: boolean
  vibrationType: "light" | "medium" | "heavy" // Vibration pattern
  autoPlaySound: boolean // Play immediately or wait for user interaction
  muteDuringQuietHours: boolean
  quietHoursStart: string // HH:mm format, e.g. "22:00"
  quietHoursEnd: string // HH:mm format, e.g. "07:00"
}

const STORAGE_KEY = "amaly.notification-prefs.v1"

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  soundVolume: 0.8,
  vibrationEnabled: true,
  vibrationType: "medium",
  autoPlaySound: false,
  muteDuringQuietHours: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
}

class NotificationPrefs {
  private prefs: NotificationPreferences

  constructor() {
    this.prefs = this.load()
  }

  /**
   * Load preferences from localStorage
   */
  private load(): NotificationPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error)
    }
    return { ...DEFAULT_PREFERENCES }
  }

  /**
   * Save preferences to localStorage
   */
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs))
    } catch (error) {
      console.error("Failed to save notification preferences:", error)
    }
  }

  /**
   * Get all preferences
   */
  getAll(): NotificationPreferences {
    return { ...this.prefs }
  }

  /**
   * Update preferences
   */
  update(partial: Partial<NotificationPreferences>): NotificationPreferences {
    this.prefs = { ...this.prefs, ...partial }
    this.save()
    return { ...this.prefs }
  }

  /**
   * Reset to defaults
   */
  reset(): NotificationPreferences {
    this.prefs = { ...DEFAULT_PREFERENCES }
    this.save()
    return { ...this.prefs }
  }

  /**
   * Check if currently in quiet hours
   */
  isQuietHours(): boolean {
    if (!this.prefs.muteDuringQuietHours) return false

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const [startHour, startMin] = this.prefs.quietHoursStart.split(":").map(Number)
    const [endHour, endMin] = this.prefs.quietHoursEnd.split(":").map(Number)
    const [currHour, currMin] = currentTime.split(":").map(Number)

    const startMins = startHour * 60 + startMin
    const endMins = endHour * 60 + endMin
    const currMins = currHour * 60 + currMin

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startMins > endMins) {
      return currMins >= startMins || currMins < endMins
    }

    return currMins >= startMins && currMins < endMins
  }

  /**
   * Should play sound now?
   */
  shouldPlaySound(): boolean {
    return this.prefs.soundEnabled && !this.isQuietHours()
  }

  /**
   * Should vibrate now?
   */
  shouldVibrate(): boolean {
    return this.prefs.vibrationEnabled && !this.isQuietHours()
  }

  /**
   * Play notification sound
   */
  playSound(): void {
    if (!this.shouldPlaySound()) return

    try {
      // Use Web Audio API or simple audio element
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()

      oscillator.connect(gain)
      gain.connect(audioContext.destination)

      // Beep parameters
      oscillator.frequency.value = 800 // Hz
      oscillator.type = "sine"

      // Volume
      gain.gain.setValueAtTime(this.prefs.soundVolume, audioContext.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      // Duration
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error("Failed to play notification sound:", error)
    }
  }

  /**
   * Trigger vibration
   */
  vibrate(): void {
    if (!this.shouldVibrate()) return

    try {
      if ("vibrate" in navigator) {
        const pattern =
          this.prefs.vibrationType === "light"
            ? [50]
            : this.prefs.vibrationType === "medium"
              ? [100, 50, 100]
              : [200, 100, 200] // heavy

        navigator.vibrate(pattern)
      }
    } catch (error) {
      console.error("Failed to trigger vibration:", error)
    }
  }

  /**
   * Play sound and vibrate
   */
  notify(): void {
    this.playSound()
    this.vibrate()
  }
}

// Singleton instance
export const notificationPrefs = new NotificationPrefs()
