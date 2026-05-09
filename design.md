# Amaly Design System

Amaly is a private spiritual companion app. The visual direction is calm, devotional, mobile-first, softly feminine, and sanctuary-like. The UI should feel gentle, tactile, and spiritually warm, not clinical or enterprise-like.

## Core Principles

1. Calm first
   - Avoid harsh contrast, dense controls, heavy shadows, and aggressive motion.
   - Prefer quiet surfaces, soft borders, and spacious rhythm.

2. Private by default
   - Sensitive account, partner, fasting, and cycle data should feel protected.
   - Use blur, reveal controls, reversible actions, and calm confirmation patterns.

3. Mobile-native
   - Design for phone width first.
   - Desktop layouts should only add breathing room, not become a separate dashboard.

4. Soft structure
   - Use rounded cards, pills, sheets, circular controls, and progress rings.
   - Avoid square panels and hard dividers.

5. Spiritual warmth
   - Prayer, Quran, duas, fasting, habits, and cycle features should feel emotionally connected through tone, color, and interaction.

## Visual Language

Use a warm off-white background with white cards, sage green actions, blush accents, soft sky surfaces, botanical iconography, and subtle celebratory motion.

Common patterns:
- Cards: `rounded-xl` or `rounded-2xl`
- Borders: `border border-sage/15`
- Primary action/selected state: sage
- Emotional warmth/cycle/celebration: blush
- Secondary calm surfaces: sky
- Icons: circular badges, usually pale sage
- Progress: rings, bars, soft fills
- Motion: short, subtle, non-blocking

## Typography

Fonts:
- Headings/display: `Playfair Display` via `font-serif`
- Body/UI: `Plus Jakarta Sans` via `font-sans`

Usage:
- Page title: `font-serif text-4xl font-semibold leading-tight`
- Section title: `font-serif text-2xl` or `text-3xl`
- Intro/body copy: `text-lg leading-8 text-muted-foreground`
- Labels: `text-xs font-bold uppercase tracking-wide text-muted-foreground`
- UI text: `text-sm font-semibold` or `font-bold`

Keep serif for spiritual/emotional hierarchy. Keep sans-serif for controls, labels, and dense UI.

## Color System

Use tokenized colors only. Do not introduce hardcoded grays, blacks, neon colors, or saturated palettes.

Core tokens:
- Background: warm off-white
- Foreground: near-black green
- Card: white
- Primary: deep sage
- Secondary: muted teal/sky
- Muted: warm pale gray
- Accent: blush
- Border/input: soft sage gray

Semantic palettes:
- `sage`: primary spiritual color, selected states, progress, main actions
- `sage-deep`: strong green text and emphasis
- `sage-pale`: soft green filled surfaces
- `sage-muted`: supporting green text/icons
- `sky`, `sky-pale`, `sky-muted`: secondary calm surfaces
- `blush`, `blush-pale`, `blush-muted`: cycle, warmth, celebration
- `surface-*`: layered low-contrast containers

Dark mode:
- Use `.dark` theme tokens.
- Keep semantic colors consistent.
- Avoid pure white and pure black.
- Use soft cream foregrounds and deep green-black backgrounds.

## Layout

Global shell:
- Sticky header: `h-16`, translucent background, subtle bottom border
- Fixed bottom nav: `h-20`, rounded top corners, safe-area padding
- Main content: use `pb-32` to clear bottom nav

Page containers:
- Daily: `max-w-5xl px-6 py-6`
- Quran: `max-w-4xl mx-auto space-y-12`
- Fasting/Cycle: `max-w-3xl gap-10`
- Settings: full-screen mobile sheet, `md:w-[480px]` right drawer

Responsive rules:
- Mobile first.
- Use `px-6` as default page padding.
- Use horizontal scrolling for dense chips.
- Use desktop grids only when they improve scanning.
- Avoid dense desktop dashboards.

## Surfaces

Default card:
`rounded-xl border border-sage/15 bg-card text-card-foreground`

Large panel:
`rounded-2xl border border-sage/15 bg-card p-4` or `p-6`

Internal soft container:
`bg-surface-container-low` or `bg-muted`

Elevation:
- Most cards should be flat with soft borders.
- Use `shadow-soft` only for selected, active, or primary elements.
- Avoid heavy drop shadows.

## Buttons

Base:
- `rounded-xl`
- Default height: `h-11`
- Small: `h-9`
- Icon: `h-10 w-10`
- Text: `text-sm font-semibold`
- Focus: visible ring using theme token

Variants:
- `default`: sage filled, white text, soft shadow
- `outline`: card/white background, sage-tinted border, primary text
- `secondary`: sky pale background, secondary text
- `ghost`: transparent, primary text, pale sage hover

Guidelines:
- Use one filled primary action per local context.
- Use outline/ghost for secondary actions.
- Do not make every action green-filled.
- Destructive actions should be calm and reversible unless immediately destructive.

## Controls

Segmented controls:
- Outer: `h-11 rounded-xl border-sage/15 bg-muted p-1`
- Active: `bg-sage text-white shadow-soft`
- Inactive: muted text with pale sage hover

Inputs:
- `rounded-xl`
- `border-sage/15`
- `bg-background`
- `h-10` or `h-11`
- Focus: `focus:border-sage`

Pills/chips:
- `rounded-full border border-sage/15 px-3 py-1.5 text-xs font-bold`
- Active: `border-sage bg-sage text-white`

Checkboxes:
- Use `accent-sage`

## Navigation

Header:
- Sticky top, `z-40`
- `bg-background/95 backdrop-blur`
- Center brand lockup with logo and Playfair title
- Left menu/settings control
- Right profile/theme/language controls
- Signed-in user shows avatar or initial in sage circle

Bottom nav:
- Fixed bottom, rounded top, translucent card background
- Active route: slight scale, blush icon, sage-deep label
- Items: Daily, Quran, Duas, Cycle, Report

## Daily Page Pattern

Daily page should answer: "What should I do now?"

Recommended order:
1. Hijri/Gregorian date
2. Greeting
3. Contextual Banner (Smart Access)
4. Prayer Check
5. Quran quick card
6. Daily Habits
7. Optional cycle/fasting preview

Contextual Banner:
- Location: Dashboard, below greeting.
- Behavior: Automatically detects time/day context.
- Examples: Friday (Al-Kahfi), Night (Al-Mulk).
- UI: Gradient card with prominent icon and "Zap" action button.
- Interaction: Single tap navigates to the first verse of the relevant surah in Mushaf.

Prayer Check:
- Dominant daily card
- Circular prayer controls
- Active/completed states use sage borders/fills and soft glow
- Sunnah chips are horizontally scrollable

Quran card on Daily:
- Keep compact.
- Support both reading-in-app and logging-after-reading.
- Do not duplicate the full Quran tracker here.

Preferred hybrid structure:
- Current reading: Surah, ayah, page, juz
- Today progress: `0 / 5 pages`
- Target text is clickable and opens a small calm edit dialog
- Progress bar
- Quick log: `+1`, `+2`, `+5`
- Secondary action: `Continue` or `Custom`

Daily Quran target dialog:
- Trigger: progress target text, e.g. `0 / 5 pages`
- Title: `Daily Quran Target`
- Numeric pages-per-day input
- Actions: `Cancel`, `Save`
- Use card/sheet styling with sage borders and tokenized colors
- Keep the Quran card compact; the dialog carries the edit UI
- Add an accessible label for editing the target

Do not show on Daily Quran card:
- Projected finish when unavailable
- "Currently on page X" if page is already shown
- Multiple competing actions like "Start a Streak" and "Open reading"
- Long motivational copy

Daily Habits:
- Support timed spiritual habits.
- Group by status/time when useful: Now, Upcoming, Missed, Completed.
- Habits can be flexible, fixed-time, or prayer-time based.
- Habit rows are compact status rows, not duplicate feature cards.
- Each row shows habit name, time window/schedule, status, and a secondary completion fallback.

Default spiritual habits:
- Morning Dhikr: prayer-based time, Fajr/Subuh +10 min until Dhuhr -30 min, fallback `05:10-11:30`
- Evening Dhikr: prayer-based time, Asr until Isha +30 min, fallback `16:00-20:30`
- Quran Reading: flexible by default, uses the Quran daily goal

Habit statuses:
- Upcoming: before window
- Available: inside window
- Completed: done today
- Missed: window passed and incomplete
- Flexible: available all day unless completed

Quran Reading habit:
- Must exist as a compact Daily Habits row.
- Shows progress like `0 / 5 pages today`.
- Auto-completes when today's logged Quran pages meet the daily target.
- If the target changes lower or higher, completion should derive from current progress.
- Tapping the row opens the Quran tracker.

Dhikr habits:
- Morning Dhikr and Evening Dhikr are flow-based.
- Completing the matching dua/dhikr flow marks that habit complete for the day.
- Tapping the habit row opens the correct dhikr flow.
- Manual completion can remain as a small secondary fallback, not the primary path.
- Dhikr flow session freshness should use the same broad fallback windows.

## Quran Bookmarks & Notes

The Mushaf experience should be tactile and distraction-free.

Interaction:
- Long press (Tap & Hold) on any verse to open the bookmark drawer.
- Haptic feedback ("Magic Buzz") on successful save.

Smart Labels:
- Categories: Hifz, Tadabbur, Ruqyah.
- Custom Labels: Users can rename labels and choose theme colors (Sage, Blush, Amber, etc.).
- Visuals: Subtle colored dots next to verses instead of heavy highlights.

Secret Cave Notes:
- Privacy: Notes are private by default.
- Storage: Bidirectional sync with Supabase with RLS protection.
- Sheet UI: Bottom Drawer (Sheet) for non-blocking note entry.

Management:
- Reading Settings panel for renaming labels and choosing colors.
- Tactile reordering of bookmarked verses via up/down controls.

## Quran Page Pattern

Quran page should answer: "How is my Quran journey progressing?"

Include:
- Page title and subtitle
- Overall progress ring
- Current reading card
- Daily goal progress
- Detailed log controls
- Juz grid
- Journey log timeline

Use:
- Sage progress
- Rounded cards
- Soft milestone celebration
- Flower burst only for meaningful milestones

Avoid:
- Repeating the same page/juz/surah info in multiple cards
- Showing unavailable projected finish text
- Oversized 0% cards with little information

## Fasting Page Pattern

Fasting page should answer: "What fasting do I owe or plan?"

Use:
- Hijri date and offset controls at top
- Qadha remaining card with circular progress
- Ramadan warning with amber border/glow when needed
- Sunnah fasting cards with circular sage-pale icons

Keep fasting data calm, clear, and non-judgmental.

## Cycle Page Pattern

Cycle page should answer: "What is my current cycle status, privately?"

Use:
- Privacy toggle above title
- Large centered blush-accented cycle ring
- Blurred sensitive data until revealed
- Compact symptom buttons
- Active symptom state uses blush tint
- Export and period actions inside standard cards

Never expose sensitive cycle details without respecting privacy state.

## Settings Panel

Settings is a calm sheet, not a dense admin page.

Behavior:
- Full-screen on mobile
- Right drawer on desktop: `md:w-[480px]`
- Overlay uses foreground tint and backdrop blur
- Close button: circular, top-right, `h-10 w-10`

Structure:
1. Header with serif title and short subtitle
2. Cloud Sync card
3. Partner card for signed-in users
4. Language control
5. Theme control
6. Hijri offset control
7. Habits editor

Section style:
- `rounded-2xl border border-sage/15 bg-card p-4`
- Leading icons in pale sage circular badges
- Segmented controls for language/theme/role/offset
- Habit rows include icon badge, label, schedule, frequency dots, and chevron expansion

Known improvement:
- Partner invite/code entry should be split into clearer stacked flows on narrow screens.

## Icons And Imagery

- Use `lucide-react`
- Common sizes: `h-4 w-4`, `h-5 w-5`, `h-6 w-6`
- Feature icons sit inside `h-10 w-10` or `h-12 w-12` circles
- Logo: `/logo.svg`
- Imagery should remain soft, natural, devotional, and non-distracting

## Motion

Motion should be subtle and purposeful.

Allowed:
- Button/card hover transitions
- Active nav slight scale
- Press feedback: `active:scale-95`
- Chevron rotation on expand/collapse
- Short flower burst on meaningful milestones

Avoid:
- Persistent confetti
- Heavy bounce
- Large page motion
- Distracting animations during worship tasks

## Accessibility

Requirements:
- Icon-only buttons need `aria-label` or screen-reader text
- Preserve visible focus rings
- Use semantic buttons for actions and links for navigation
- Tap targets should be at least `40px`, preferably `44px`
- Do not rely only on color for status
- Sensitive health/cycle data must respect privacy state

## Implementation References

- Theme tokens: `src/index.css`
- Tailwind mapping: `tailwind.config.ts`
- Button: `src/components/ui/button.tsx`
- Card: `src/components/ui/card.tsx`
- Sheet: `src/components/ui/sheet.tsx`
- Tabs: `src/components/ui/tabs.tsx`
- Toggle group: `src/components/ui/toggle-group.tsx`
- Header: `src/components/layout/header.tsx`
- Bottom nav: `src/components/layout/bottom-nav.tsx`
- Settings panel: `src/components/settings/settings-panel.tsx`
- Pages:
  - `src/pages/daily.tsx`
  - `src/pages/quran.tsx`
  - `src/pages/fasting.tsx`
  - `src/pages/cycle.tsx`

## Do

- Use tokenized colors.
- Keep headings serif and UI text sans-serif.
- Prefer soft borders and pale fills over heavy shadows.
- Use sage for spiritual progress, selection, and primary actions.
- Use blush for cycle, warmth, and celebration.
- Keep Daily page focused on fast action.
- Keep Quran page focused on detailed progress.
- Keep settings calm and spacious.
- Design mobile-first.

## Do Not

- Use harsh black, pure gray, neon, or saturated colors.
- Replace rounded cards with square panels.
- Fill every button with sage.
- Add dense desktop-only dashboard layouts.
- Add heavy animation or persistent celebration effects.
- Show sensitive cycle data without privacy controls.
- Duplicate the same information across multiple cards.

## Features Log

### 2026-05-09: Quran Log & Bookmark Refinement
- **Tactile Interaction:** Long-press to bookmark, haptic buzz on save.
- **Subtle Visuals:** Replaced heavy highlights with soft colored dots for categories.
- **Smart Labels:** Custom categories (Hifz, Tadabbur, Ruqyah) with editable names/colors.
- **Private Notes:** Secure "Secret Cave" notes in a non-blocking bottom sheet.
- **Contextual Dashboard:** Smart banners for Al-Kahfi (Friday) and Al-Mulk (Night).
- **Auto-Sync:** "Save & Log Progress" combines bookmarking and daily tracking.
- **Management Panel:** New "Quran Marks" settings for label editing and list reordering.
- **UX Improvement:** Moved Offline Indicator to the top as a centered pill to avoid blocking navigation.
- **Architecture:** Root `@/` directory cleanup, unused package removal, and Supabase schema migration.
