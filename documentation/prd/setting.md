# PRD: Amaly Master Settings Panel

## 1. Objective
To provide a central "Command Center" for personalizing the app's look, language, and calendar calibration.

## 2. Functional Requirements

### 2.1 Language Toggle
* **Options:** English (EN) and Indonesian (ID).
* **Component:** Shadcn Tabs (Segmented Control).
* **Impact:** Updates all UI strings, surah names (if applicable), and notification text.

### 2.2 Theme Toggle
* **Options:** Day (Light) and Dark.
* **Component:** Shadcn Tabs with Icons (Sun/Moon).
* **Impact:** Switches Tailwind CSS classes via the `next-theme` provider.

### 2.3 Hijri Offset (Calibration)
* **Range:** [-2, -1, 0, +1, +2].
* **Component:** Segmented Toggle Group.
* **Logic:** This is the "Master Variable" that offsets all Hijri dates in the Quran, Fasting, and Habit modules.

## 3. UI/UX Refinement
* **Aesthetic:** Minimalist Olive Green (#556B2F) for active states.
* **Accessibility:** Use high-contrast text for the active selection in the toggles.
* **Animations:** Smooth sliding transition for the background highlight when switching options.

PRD: Amaly Habits Setting Panel
1. Objective
To provide a clean, high-speed interface for creating and editing habits. The focus is on frequency automation (KSA-specific presets) and religious anchoring (Prayer-based timing).

2. Functional Requirements
2.1 Basic Metadata
Name Field: A simple text input for the habit name (e.g., "Morning Dhikr").

Category Picker: A selection of 4–6 color-coded categories:

Spiritual, Self-Care, Family, Household, Learning.

Status Toggle: An "Enabled/Disabled" switch to temporarily hide a habit without deleting it.

2.2 Timing System (The "Anchor" Logic)
Mode Selector: Toggle between Fixed Time and Prayer Anchor.

Fixed Time: A standard time picker (e.g., 07:30 AM).

Prayer Anchor: * Select Prayer: [Fajr, Dhuhr, Asr, Maghrib, Isha].

Offset: A slider or +/- selector for minutes (e.g., "15 minutes after Fajr").

Logic: The app uses the local prayer API to calculate the actual notification time daily.

2.3 Frequency & Planned Days (KSA Optimized)
Frequency Presets (One-Tap Chips):

[Daily]: Selects all 7 days.

[Weekdays]: Selects Sun, Mon, Tue, Wed, Thu (Saudi Work/School Week).

[Weekends]: Selects Fri, Sat.

[Friday Only]: Selects only Fri.

Manual Selector: 7 circular chips (S M T W T F S) that allow for custom selection.

Visual Note: Friday and Saturday should be visually grouped/styled as the weekend.

2.4 Actions
Save: Updates the Supabase habits table.

Delete: A "trash" icon with a confirmation dialog: "Are you sure you want to remove this habit?"

3. Technical Specifications
3.1 Data Structure (Supabase)
JSON
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Surah Al-Kahf",
  "category": "spiritual",
  "is_enabled": true,
  "timing_mode": "fixed | prayer",
  "timing_value": "07:30" || { "prayer": "fajr", "offset": 15 },
  "planned_days": [5], // Array of indices (0=Sun, 5=Fri)
  "created_at": "timestamp"
}
3.2 Logic: KSA Weekday/Weekend Mapping
JavaScript
const presets = {
  daily: [0, 1, 2, 3, 4, 5, 6],
  weekdays: [0, 1, 2, 3, 4], // Sunday to Thursday
  weekends: [5, 6],          // Friday and Saturday
  friday: [5]                // Just Friday
};
4. UI/UX Design (Bottom Sheet Layout)
Minimalist Aesthetic: Use the Amaly Olive palette.

Frictionless Interaction: Large tap targets for the "Frequency Chips" to accommodate a busy mother's workflow.

Unified View: No separate Friday section. A habit set only for Friday will simply appear in the main list on Fridays and be hidden/grayed out on other days.

Prompt for Codex / AI Assistant
"Build the 'Habit Settings Panel' for the Amaly app as a React component (preferably a Bottom Sheet/Drawer).

Requirements:

Header: Habit name input and category selector (color-coded chips).

Timing Logic: Create a toggle between 'Fixed Time' and 'Prayer Anchor'. If 'Prayer Anchor' is selected, provide a dropdown for the 5 prayers and a +/- 60 minute offset selector.

Frequency Presets: Implement 4 quick-select chips: 'Daily', 'Weekdays (Sun-Thu)', 'Weekends (Fri-Sat)', and 'Friday Only'. Clicking a chip must automatically update the 7-day 'S M T W T F S' manual selector.

State Sync: Ensure changes are reflected in the 'Planned Days' (green dots) and the main dashboard list.

Persistence: Connect to Supabase to save/update the habit settings.

UI: Use Tailwind CSS with the Amaly Olive (#556B2F) theme. Make it mobile-responsive and clean."