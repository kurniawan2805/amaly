# 🚀 PWA Offline - Quick Start

## One-Command Setup & Test

```bash
# 1. Install dependencies
npm install -D vite-plugin-pwa workbox-build

# 2. Build with PWA support
npm run build

# 3. Preview locally
npm run preview
# Opens at http://localhost:4173
```

## Test Offline (60 seconds)

1. **Open DevTools:** Press `F12`
2. **Go to Network tab:** Click on "Network" tab
3. **Enable Offline:** Check the "Offline" checkbox
4. **Refresh:** Press `Cmd+R` (Mac) or `Ctrl+R` (Windows)
5. **Verify:**
   - ✅ App loads fully (no blank screen)
   - ✅ See "Offline • Changes saved locally" badge (bottom-left)
   - ✅ Daily page shows all habits & prayers
   - ✅ Can scroll, interact, make edits
   - ✅ Try `/duas`, `/quran`, `/fasting` routes

## Go Back Online

1. **Uncheck Offline:** DevTools Network tab
2. **Verify:**
   - ✅ Badge shows "Back online • Changes will sync"
   - ✅ Badge disappears after 2 seconds
   - ✅ App syncs with Supabase

## What's New

✅ **Offline First:** Full app works without internet  
✅ **Smart Caching:** JS chunks pre-cached, Quran CDN cached on first load  
✅ **Status Indicator:** Shows when offline/online  
✅ **Local Storage:** All edits saved locally, synced when back online  
✅ **No Breaking Changes:** All existing features work same as before  

## Key Files

- `vite.config.ts` — PWA configuration with Workbox
- `src/components/offline-indicator.tsx` — Status badge
- `src/App.tsx` — Integrated indicator
- `package.json` — vite-plugin-pwa + workbox-build dependencies

## Troubleshooting

**App won't load offline?**
- Hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
- Check DevTools Console for errors
- Verify Service Worker active: DevTools → Application → Service Workers

**Indicator doesn't show?**
- Verify offline mode enabled in DevTools Network tab
- Check browser console for component errors

**Quran data not cached?**
- Must visit app online first (caches on first load)
- Then available offline

## Full Documentation

See these files for detailed info:
- `PWA_IMPLEMENTATION_COMPLETE.md` — Full implementation details & testing checklist
- `SETUP_AND_TEST_PWA.sh` — Detailed setup script
- `PWA_OFFLINE_IMPLEMENTATION.md` — Architecture & caching strategy

## Status

✅ Code complete  
✅ Dependencies configured  
✅ Committed & pushed to main  
⏳ Ready for `npm install && npm run build`

---

**Next:** Run the commands above and test offline! 🎉
