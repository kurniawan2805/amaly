export const BROWSER_NOTIFICATIONS_STORAGE_KEY = "amaly.browser-notifications.v1"

export type BrowserNotificationStatus = "unsupported" | "default" | "granted" | "denied"

type NotificationPreference = {
  enabled: boolean
}

type BrowserNotificationInput = {
  body: string
  tag?: string
  title: string
  url?: string
}

function canUseNotifications() {
  return typeof window !== "undefined" && "Notification" in window
}

function loadPreference(): NotificationPreference {
  if (typeof window === "undefined") return { enabled: false }

  try {
    const stored = window.localStorage.getItem(BROWSER_NOTIFICATIONS_STORAGE_KEY)
    return stored ? { enabled: Boolean(JSON.parse(stored).enabled) } : { enabled: false }
  } catch {
    return { enabled: false }
  }
}

function savePreference(preference: NotificationPreference) {
  window.localStorage.setItem(BROWSER_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(preference))
}

export function getBrowserNotificationStatus(): BrowserNotificationStatus {
  if (!canUseNotifications()) return "unsupported"
  return window.Notification.permission
}

export function areBrowserNotificationsEnabled() {
  return loadPreference().enabled && getBrowserNotificationStatus() === "granted"
}

export async function requestBrowserNotifications() {
  if (!canUseNotifications()) return getBrowserNotificationStatus()

  const permission = await window.Notification.requestPermission()
  savePreference({ enabled: permission === "granted" })
  return permission
}

export function disableBrowserNotifications() {
  if (typeof window === "undefined") return
  savePreference({ enabled: false })
}

export async function showBrowserNotification({ body, tag, title, url = "/" }: BrowserNotificationInput) {
  if (!areBrowserNotificationsEnabled()) return

  const options: NotificationOptions = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/favicon-32x32.png",
    data: { url },
    tag,
  }

  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready.catch(() => null) : null
  if (registration?.showNotification) {
    await registration.showNotification(title, options)
    return
  }

  new window.Notification(title, options)
}
