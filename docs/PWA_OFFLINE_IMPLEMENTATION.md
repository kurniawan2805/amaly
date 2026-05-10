# PWA Offline Implementation - Setup Complete

## Summary of Changes

### 1. **vite-plugin-pwa Configuration** (`vite.config.ts`)
- Integrated `VitePWA` plugin with `autoUpdate` registration type
- Generated comprehensive Web App Manifest:
  - Name: "Amaly - Daily Ibadah Tracker"
  - Display: standalone (full-screen app)
  - Start URL: `/`
  - Theme color: emerald (`#16a34a`)
- Configured Workbox caching strategies:
  - **App Shell (pre-cache):** All JS/CSS/HTML/images at build time
  - **Quran CDN:** CacheFirst, 30-day expiration (external URLs from quranwbw.com)
  - **Duas Data:** CacheFirst, 30-day expiration
  - **Supabase API:** NetworkFirst with 3-second timeout (attempts network, falls back to cache)

### 2. **Service Worker Registration** (`src/main.tsx`)
- **Before:** Manual registration of static `/public/service-worker.js`
- **After:** Automatic registration by vite-plugin-pwa (production only)
- Benefit: Plugin-generated SW includes all Vite chunk hashes, fixes offline loading

### 3. **Offline Indicator Component** (`src/components/offline-indicator.tsx`)
- Shows status badge in bottom-left corner
- **Offline state:** "Offline • Changes saved locally" (amber background)
- **Online state:** "Back online • Changes will sync" (emerald background, auto-hides after 2s)
- Uses `navigator.onLine` events + window online/offline listeners
- Minimal z-index to avoid UI conflicts

### 4. **App Integration** (`src/App.tsx`)
- Imported `OfflineIndicator` component
- Added `<OfflineIndicator />` after BottomNav (persistent placement)
- Indicator shows automatically when offline, hides 2s after reconnecting

---

## What Gets Cached (PWA Workbox)

### Pre-Cached at Build Time (App Shell)
✅ All `**/*.{js,css,html,svg,png,ico,woff2}`
✅ Static assets (favicon, logo)
✅ HTML entry point

### Runtime Cached (First Access)
✅ Quran CDN (quranwbw.com) — fonts, Quran text data
✅ Duas data — bundled component assets
✅ Supabase API responses (5-min cache)

### Not Cached
❌ External analytics/tracking scripts
❌ Dynamic API responses (unless explicitly cached)

---

## Installation & Testing

### Install Dependencies
```bash
npm install -D vite-plugin-pwa workbox-build
```

### Build & Preview
```bash
npm run build          # Generates SW with chunk hashes
npm run preview        # Test offline locally
```

### Test Offline Mode

**Option 1: DevTools Offline Simulation**
1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Refresh page
4. Should load fully from cache ✅
5. Indicator shows "Offline • Changes saved locally"

**Option 2: Network Throttling**
1. DevTools → Network → Slow 3G / Offline preset
2. Refresh
3. Should load without chunks failing ✅

**Test Points:**
- [ ] Daily page loads (all habits, prayers, tracking data)
- [ ] Quran page loads and displays progress
- [ ] Duas page loads without errors
- [ ] Settings page shows saved preferences
- [ ] Making edits offline saves to localStorage
- [ ] Indicator shows/hides correctly
- [ ] Reconnect → indicator shows "Back online" briefly
- [ ] Quran Reader loads (after first online visit)

---

## How It Fixes Offline Loading

**Before:** 
- Static 5-file APP_SHELL in manual SW
- Vite chunks with dynamic hashes not included
- Offline = ChunkLoadError → infinite reload ❌

**After:**
- Plugin scans build output, captures ALL chunk hashes
- Adds chunks to Workbox pre-cache manifest automatically
- Offline = all chunks available from cache ✅
- No manual SW maintenance needed

---

## Offline Data Strategy (Current)

✅ **Local-First:** All app data (habits, prayers, tracking) in localStorage
✅ **Read-Only Offline:** Can use app fully without network
✅ **Graceful Sync:** On reconnect, `hydrateFromSupabase()` merges cloud state with local
⚠️ **Silent Failures:** Supabase sync errors not shown to user (indicator helps, but no error messages)

### Future: Sync Queue
- Queue offline edits, retry on reconnect
- Show pending badge for unsync data
- Discussed but deferred to later phase

---

## Files Changed

1. `vite.config.ts` — Added VitePWA plugin with Workbox config
2. `src/main.tsx` — Removed manual SW registration
3. `src/components/offline-indicator.tsx` — **NEW**
4. `src/App.tsx` — Added OfflineIndicator import + component

---

## Next Steps (After Testing)

1. Verify offline loading works
2. If issues: Check browser console for SW errors, cache keys in DevTools
3. If good: Commit changes + tag as "PWA offline ready"
4. Later: Discuss sync queue strategy (merging offline edits)

---

## Rollback (if needed)

If plugin causes issues:
1. Remove `VitePWA` from vite.config.ts
2. Restore manual SW registration in src/main.tsx
3. Restore `/public/service-worker.js` (backup kept)

---

## References

- [vite-plugin-pwa docs](https://vite-plugin-pwa.netlify.app/)
- [Workbox caching strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
- [PWA offline detection](https://developer.mozilla.org/en-US/docs/Online_and_offline_events)
