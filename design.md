# Amaly Design Documentation

## Two-Tier Bookmark System for Quran Reading

### Overview

The bookmark system supports two distinct use cases:
1. **Main Bookmark** - Mandatory progress tracker for khatm (complete Quran reading)
2. **Optional Bookmarks** - Quick-access shortcuts for specific reading contexts (habits, daily goals, hifz, murojaah)

---

## Architecture

### 1. Data Model

#### Main Bookmark (`QuranMainBookmark`)
```typescript
{
  page: number              // Current page (mandatory)
  surah?: number            // Optional - specific surah if determined
  ayah?: number             // Optional - specific ayah if determined
  surahName?: string        // Optional - for display
  lastUpdated: string       // ISO timestamp
}
```

**Purpose:** Track the user's progress point for continuing khatm.  
**Updated by:** "Save & Log" button in mushaf reader or when logging daily reading.  
**Storage:** `localStorage['amaly.quran-main-bookmark.v1']`

#### Optional Context Bookmarks (`QuranContextBookmark`)
```typescript
{
  id: string                // Unique identifier
  label: string             // Display: "Surat Al-Kahfi Reading"
  page: number              // Starting page
  toPage?: number           // Optional - for ranges
  context: "habit" | "daily" | "hifz" | "murojaah" | "custom"
  linkedId?: string         // Reference to habit/daily goal ID
  createdAt: string
  position: number          // For sorting in UI
}
```

**Purpose:** Quick navigation to specific reading contexts without affecting khatm progress.  
**Created by:** System (habits, daily goals) or manual user creation.  
**Storage:** `localStorage['amaly.quran-context-bookmarks.v1']` (local only, no cloud sync)

#### Enhanced Logging (`QuranProgressLog`)
```typescript
{
  // Existing fields
  date: string
  pages: number
  page: number
  from_page: number
  to_page: number
  surah_name: string
  ayah: number
  juz: number
  completed_juz?: number
  completed_juzs?: number[]
  
  // NEW fields - when ayah is bookmarked
  specific_ayah?: number
  specific_surah?: number
  specific_surah_name?: string
  last_ayah_in_session?: number
}
```

---

### 2. Logging Strategy

When user taps "Save & Log" from mushaf reader bookmark:

| Scenario | What Happens | Logged Fields | Main Bookmark |
|----------|-------------|---------------|---------------|
| **Page only** (no verse selected) | Regular logging | `page`, `surah_name`, `ayah` from page start | `{ page }` |
| **With ayah** (long-pressed verse) | Enhanced logging with specific ayah | `page`, `specific_surah`, `specific_ayah`, `specific_surah_name` | `{ page, surah, ayah, surahName }` |
| **Continue reading** (multiple sessions) | Each session logs latest reading position | Incremental updates with `last_ayah_in_session` | Updated to latest position |

**Key Detail:** The main bookmark is updated to reflect the **specific ayah** if one is determined (via long-press). This allows the app to show "Continue from Surah Al-Kahfi, Ayah 5" instead of just "Page 262".

---

### 3. User Interface

#### Dashboard / Home
**Display:** "Continue Reading from [position]"
- If main bookmark has only page: `"Page 145 • Al-Kahfi"`
- If main bookmark has ayah: `"Al-Kahfi 1:5 • Page 262"` with ayah count badge

#### Mushaf Reader: Ayah Highlighting
**When opening mushaf after bookmark with specific ayah:**
- Soft background highlight applied to the last bookmarked ayah
- Color: `bg-amber-100/30 dark:bg-amber-900/20`
- Persistence: Shows while reading (no timeout) - user context
- Implementation: Pass `lastBookmarkedAyah?: { surah, ayah }` to mushaf reader
- CSS class: `ayah-last-read`

#### Journey Log Display
**Same visual layout as before**, but entries now show:
- Page range (current: from_page to to_page)
- Surah/ayah info (from page start)
- **NEW:** Optional badge "⭐" if specific ayah was bookmarked: `"Al-Kahfi:5 (Specific)"`

#### Context Bookmarks Panel
**Location:** Dedicated section in quran.tsx or dashboard  
**Display:**
```
┌─ Quick Access ─────────────┐
├─ Surat Al-Kahfi Reading → Page 262
├─ Daily Quran (M-F)      → Page 1
├─ Personal Hifz: Baqara  → Page 49
├─ Murojaah: Juz 1-3      → Page 1
└─ [+ Add Custom Shortcut]
```

**Behavior:**
- Click → Navigate to that page in mushaf reader
- No logging impact - these are shortcuts only
- Ordered by position (user can reorder)

---

## Implementation Details

### Storage Keys
```typescript
export const QURAN_MAIN_BOOKMARK_KEY = "amaly.quran-main-bookmark.v1"
export const QURAN_CONTEXT_BOOKMARKS_KEY = "amaly.quran-context-bookmarks.v1"
export const QURAN_READER_BOOKMARKS_KEY = "amaly.quran-reader-bookmarks.v2" // Unchanged
export const QURAN_READER_LABELS_KEY = "amaly.quran-labels.v1" // Unchanged
```

### State Management
**App Store Updates:**
- `setQuranPage(page, ayahDetails?)` - Now accepts optional ayah information
- `updateMainBookmark(updates)` - Manually update main bookmark
- `addContextBookmark(bookmark)` - Add context shortcut
- `removeContextBookmark(id)` - Remove context shortcut

### Data Flow

```
User long-presses ayah in mushaf
        ↓
selectedVerse = { surah, ayah, surahName, page, ... }
        ↓
Clicks "Save & Log" button
        ↓
saveAndLog() → toggleBookmark() + onSetPage(page, ayahDetails)
        ↓
app-store.setQuranPage(page, { surah, ayah, surahName })
        ↓
quran-progress.setProgressToPage(..., ayahDetails)
        ↓
mergeTodayLog(..., ayahDetails)
        ↓
Creates log entry with:
  - specific_surah, specific_ayah, specific_surah_name
  - last_ayah_in_session
  - Updates main bookmark with ayah details
```

---

## Backward Compatibility

- Old bookmark data still loads and works
- Existing `QuranProgressLog` entries without ayah fields are handled gracefully
- Context bookmarks are local-only (no sync needed)
- Main bookmark stored separately from progress logs

---

## Offline Behavior

- **Main bookmark:** Persists in localStorage, synced to Supabase on next online event
- **Context bookmarks:** Local storage only (light, non-critical)
- **Progress logs:** Enhanced fields included in existing Supabase sync

---

## Future Enhancements

1. **Auto-create context bookmarks:** When user creates a habit with specific surah
2. **Highlight variations:** Different highlight colors for different reading contexts
3. **Sync context bookmarks:** If users want bookmarks across devices
4. **Smart continue point:** Detect if user is continuing from specific session or restarting
5. **Reading sessions:** Track detailed session metadata (time, pages/hour, focus level)

---

## Testing Checklist

- [ ] Main bookmark updates on "Save & Log" with ayah details
- [ ] Ayah highlighting appears correctly when opening mushaf
- [ ] Journey log displays ayah info when available
- [ ] Context bookmarks navigate to correct page
- [ ] Offline sync preserves ayah logging data
- [ ] Old bookmarks migrate without errors
- [ ] Long-press → bookmark → log → highlight all work together

---

## Files Modified

### Core Data Layer
- `src/lib/quran-reader-bookmarks.ts` - New types, storage functions
- `src/lib/quran-progress.ts` - Enhanced logging fields

### State Management
- `src/stores/app-store.ts` - Updated `setQuranPage()`, bookmark state

### UI Layer
- `src/pages/quran-reader.tsx` - Pass ayah details on save/log
- `src/pages/quran.tsx` - Display main bookmark, context bookmarks (pending)
- `src/components/` - Ayah highlighting component (pending)

---

## Version History

- **v1.0** (2026-05-09): Initial two-tier bookmark system with enhanced logging
  - Main bookmark for khatm tracking
  - Optional context bookmarks for quick access
  - Ayah-level logging when determined
  - Soft highlight for last reading position
