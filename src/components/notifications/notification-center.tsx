import { useState } from "react"
import { Settings } from "lucide-react"
import { NotificationBell } from "./notification-bell"
import { NotificationHistoryPanel } from "./notification-history-panel"
import { NotificationPreferencesPanel } from "./notification-preferences-panel"

export function NotificationCenter() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)

  return (
    <>
      {/* Notification Bell */}
      <NotificationBell onClick={() => setHistoryOpen(true)} />

      {/* Notification Preferences Button */}
      <button
        onClick={() => setPrefsOpen(true)}
        className="p-2 rounded-lg hover:bg-sage/10 transition-colors"
        aria-label="Notification preferences"
      >
        <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground" />
      </button>

      {/* History Panel */}
      {historyOpen && <NotificationHistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />}

      {/* Preferences Modal */}
      {prefsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Notification Settings</h2>
            </div>

            <NotificationPreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
