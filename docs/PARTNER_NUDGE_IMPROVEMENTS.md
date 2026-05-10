# Partner Nudge Notifications - Improvement Plan

**Status:** Current system partially working, offline + disconnection scenarios broken  
**Priority:** High (affects partner experience)

---

## Current State Analysis

### What Works ✅
- Online nudge sending works reliably
- Real-time delivery on stable connections
- In-app banner displays nudge messages
- Browser notifications for manual nudges
- Partner connection via invite codes

### What's Broken ❌
1. **Offline nudge sending** — Fails silently, user sees "Sent" but it doesn't queue
2. **Realtime disconnects** — No error handling, notifications lost
3. **Quran goal asymmetry** — Auto-nudges don't trigger browser notifications
4. **Persistent banner** — Stays until manual close (no auto-dismiss)
5. **No notification history** — Can't see past nudges, no read/unread tracking
6. **No offline queue** — Pending nudges lost if app closes

---

## Improvements Required

### Priority 1: Offline Nudge Queue (High Impact)

**Problem:** User sends nudge while offline → false "Sent" confirmation → nudge never reaches partner

**Solution:**
1. Create `nudge-queue.ts` utility
2. When sending nudge offline:
   - Save to localStorage queue
   - Show "Pending..." status instead of success
3. When reconnecting (online event):
   - Retry queued nudges
   - Update UI with delivery status
   - Remove from queue on success

**Files to Create/Modify:**
- `src/lib/nudge-queue.ts` (NEW)
- `src/lib/supabase-sync.ts` (modify `sendPartnerEvent`)
- `src/stores/app-store.ts` (add queue retry logic)
- `src/components/partner/partner-widget.tsx` (show pending status)

**Expected Result:**
- ✅ No silent failures
- ✅ User knows nudge is pending
- ✅ Auto-retry when online
- ✅ Clear delivery confirmation

---

### Priority 2: Realtime Connection Status (High Impact)

**Problem:** Realtime disconnects silently → user thinks they got notified but didn't

**Solution:**
1. Add error handler to `subscribeToPartnerEvents()`
2. Track connection status in Zustand store
3. Show connection indicator in UI
4. Implement exponential backoff reconnection

**Files to Modify:**
- `src/lib/supabase-sync.ts` (add error/reconnection handlers)
- `src/stores/app-store.ts` (add connectionStatus state)
- `src/App.tsx` (show connection status badge)
- `src/components/layout/header.tsx` (connection indicator)

**Expected Result:**
- ✅ Connection status visible to user
- ✅ Auto-reconnect on disconnect
- ✅ Clear notification if missed during disconnect

---

### Priority 3: Parity for Quran Goal Notifications

**Problem:** Manual "nudge" shows browser notification, but auto "quran_goal" doesn't

**Solution:**
1. When `event_type === "quran_goal"`, also trigger browser notification
2. Format notification with pages info
3. Consistency in delivery mechanism

**Files to Modify:**
- `src/lib/supabase-sync.ts` (line ~252)
- `src/stores/app-store.ts` (modify condition)

**Expected Result:**
- ✅ Both manual nudges & quran goals show browser notifs
- ✅ Consistent UX
- ✅ User always gets notifications

---

### Priority 4: Auto-Dismiss Banner (Medium Impact)

**Problem:** Partner notice stays on screen until manually closed

**Solution:**
1. Auto-dismiss after 5 seconds (for nudges)
2. Keep visible longer for important messages
3. Show dismiss countdown or fade effect

**Files to Modify:**
- `src/App.tsx` (line ~237-249)
- `src/components/partner/` (create auto-dismiss component)

**Expected Result:**
- ✅ Non-intrusive notification
- ✅ Still visible enough to read
- ✅ Manual close always available

---

### Priority 5: Notification History + Read Tracking

**Problem:** Can't see past nudges, no way to know if partner saw message

**Solution:**
1. Create partner notification history UI component
2. Track `read_at` timestamp when user views notification
3. Show in partner widget or dedicated page
4. Mark as read when viewing

**Files to Create/Modify:**
- `src/components/partner/notification-history.tsx` (NEW)
- `src/lib/supabase-sync.ts` (add `markNotificationRead()`)
- `src/stores/app-store.ts` (notification history state)

**Expected Result:**
- ✅ Users can review past nudges
- ✅ Partners know if message was delivered & read
- ✅ Better communication flow

---

### Priority 6: Notification Sound/Vibration (Low Priority)

**Problem:** Silent notifications may be missed

**Solution:**
1. Optional sound + vibration on nudge
2. Settings to customize
3. Respect device Do Not Disturb

**Files to Create/Modify:**
- `src/lib/browser-notifications.ts` (add sound/vibration)
- `src/components/settings/` (notification preferences)

**Expected Result:**
- ✅ More noticeable notifications
- ✅ Customizable per user
- ✅ Respects device settings

---

## Implementation Phases

### Phase 1 (This Session) - Core Fixes
1. ✅ Offline nudge queue (highest impact)
2. ✅ Realtime connection status
3. ✅ Quran goal browser notification parity
4. ✅ Auto-dismiss banner (quick win)

### Phase 2 (Next Session) - UX Improvements
5. ⏳ Notification history + read tracking
6. ⏳ Notification sound/vibration

---

## Architecture Changes

### New: Nudge Queue System
```typescript
// src/lib/nudge-queue.ts
interface QueuedNudge {
  id: string
  partnerId: string
  type: "nudge" | "quran_goal"
  payload: any
  timestamp: number
  retries: number
  status: "pending" | "sending" | "sent" | "failed"
}

export const nudgeQueue = {
  add(nudge: QueuedNudge): void
  retry(): Promise<void>
  clear(nudgeId: string): void
  getAll(): QueuedNudge[]
}
```

### Modified: App Store
```typescript
// src/stores/app-store.ts additions
{
  // Connection status
  realtimeConnected: boolean
  connectionError: string | null
  
  // Nudge queue
  pendingNudges: QueuedNudge[]
  
  // Actions
  retryPendingNudges: () => Promise<void>
  setConnectionStatus: (status: boolean, error?: string) => void
}
```

### Modified: Supabase Sync
```typescript
// src/lib/supabase-sync.ts changes
export async function sendPartnerEvent(...) {
  try {
    // Attempt to send
  } catch (error) {
    if (!navigator.onLine) {
      // Queue for retry
      nudgeQueue.add(...)
    }
  }
}

export function subscribeToPartnerEvents(...) {
  // Add error handler
  channel.on("system", { event: "*" }, (err) => {
    // Handle connection issues
    setConnectionStatus(false, err.message)
  })
}
```

---

## Testing Strategy

### Test Scenarios

**Offline Queue:**
1. Go offline
2. Send nudge
3. Verify "Pending..." status
4. Go online
5. Verify auto-retry and delivery

**Realtime Disconnect:**
1. Throttle connection to "Slow 3G"
2. Trigger partner event
3. Force disconnect DevTools
4. Verify error UI
5. Reconnect and verify delivery

**Auto-Dismiss:**
1. Receive nudge
2. Banner appears
3. Wait 5 seconds
4. Banner auto-dismisses
5. Can manually dismiss earlier

---

## Success Criteria

- ✅ No more silent nudge failures
- ✅ Clear delivery status (pending/sent/failed)
- ✅ Connection status visible
- ✅ Browser notifications for all nudge types
- ✅ Auto-dismiss non-intrusive banner
- ✅ Offline queue retries on reconnect
- ✅ User always knows notification status

---

## Files to Modify/Create

### Create
- `src/lib/nudge-queue.ts` (NEW)
- `src/components/partner/notification-history.tsx` (Phase 2)

### Modify
- `src/lib/supabase-sync.ts` (error handling, queue retry)
- `src/stores/app-store.ts` (connection state, queue management)
- `src/App.tsx` (auto-dismiss, connection badge)
- `src/components/partner/partner-widget.tsx` (pending status)

### Review (may not need changes)
- `src/components/layout/header.tsx` (connection indicator placement)
- `public/service-worker.js` (notification handlers already there)

---

## Rollout Plan

1. Create nudge queue utilities
2. Integrate offline queuing in sendPartnerEvent
3. Add Realtime error handling
4. Auto-dismiss banner
5. Browser notification parity
6. Test thoroughly
7. Commit & push
8. Monitor in production

---

**Ready to implement Phase 1?**
