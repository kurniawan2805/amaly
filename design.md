# Amaly Design System

Amaly is a private spiritual companion app with a calm, devotional, and gently feminine visual direction. The current design uses soft natural colors, rounded surfaces, serif display headings, compact mobile-first layouts, and subtle celebratory motion.

This document reflects the implemented app design as of the current codebase.

## Design Principles

- Calm first: avoid sharp contrast, aggressive motion, or dense controls.
- Private by default: sensitive health and account content should feel protected, calm, and reversible.
- Mobile-native: primary layouts are optimized for phone width, with restrained desktop expansion.
- Soft structure: cards, sheets, pills, and circular controls carry the interface.
- Spiritual warmth: Quran, prayer, fasting, and cycle features should feel connected through tone, not clinical dashboards.

## Visual Language

The app uses a sanctuary-like style: warm off-white backgrounds, sage greens, blush accents, soft sky tones, rounded cards, and botanical iconography. UI elements should look tactile and gentle rather than flat enterprise controls.

Common visual motifs:

- Rounded cards and panels with `rounded-xl` or `rounded-2xl`.
- Sage green for primary actions, selected states, progress, and spiritual emphasis.
- Blush pink for cycle-related moments, celebratory highlights, and emotional warmth.
- Sky blue for secondary calm surfaces.
- Circular icons and progress rings.
- Flower burst animation for milestone celebration.

## Typography

Fonts are loaded in `src/index.css` from Google Fonts.

- Display/headings: `Playfair Display`, configured as `font-serif`.
- Body/UI: `Plus Jakarta Sans`, configured as `font-sans`.

Usage:

- Page titles: `font-serif text-4xl font-semibold leading-tight`.
- Section titles: `font-serif text-2xl` or `text-3xl`, usually `text-primary` or `text-sage`.
- Body copy: `text-lg leading-8 text-muted-foreground` for introductory copy.
- Labels: uppercase, bold, small text with tracking: `text-xs/text-sm font-bold uppercase tracking-wide text-muted-foreground`.
- UI labels and list items: mostly `text-sm font-semibold` or `font-bold`.

## Color Tokens

Theme tokens live in `src/index.css` and are mapped through `tailwind.config.ts`.

Core light theme:

- Background: warm off-white, `--background: 52 33% 97%`.
- Foreground: near-black green, `--foreground: 120 4% 11%`.
- Card: white, `--card: 0 0% 100%`.
- Primary: deep sage, `--primary: 118 16% 34%`.
- Secondary: muted teal/sky, `--secondary: 193 17% 35%`.
- Muted: warm pale gray, `--muted: 60 14% 93%`.
- Accent: blush, `--accent: 0 70% 86%`.
- Border/input: soft sage gray, `--border: 105 8% 77%`.

Extended semantic palettes:

- `sage`: primary spiritual and selected-state color.
- `sage-deep`: deep green text and emphasis.
- `sage-pale`: pale green filled surfaces.
- `sage-muted`: subdued green support color.
- `sky`, `sky-pale`, `sky-muted`: secondary calm surfaces.
- `blush`, `blush-pale`, `blush-muted`: cycle, warmth, and celebration.
- `surface-*`: Material-like layered backgrounds for low/high containers.

Dark theme:

- Uses the `.dark` class on `document.documentElement`.
- Keeps the same semantic palette but shifts backgrounds to deep green-black and foregrounds to soft cream.
- Avoid hard white in dark theme; use tokenized foreground/card/surface colors.

## Layout

The app is mobile-first with centered max-width containers.

Global shell:

- Sticky top header: `h-16`, translucent background, subtle bottom border.
- Fixed bottom navigation: `h-20`, rounded top corners, safe-area padding.
- Main content uses bottom padding around `pb-32` to clear the bottom nav.

Page containers:

- Daily page: `max-w-5xl`, `px-6 py-6`, larger multi-card dashboard.
- Quran page: `max-w-4xl`, centered, `space-y-12`.
- Fasting/Cycle pages: `max-w-3xl`, vertical rhythm with `gap-10`.
- Settings sheet: full-screen on mobile, right-side `480px` sheet on desktop.

Desktop behavior is additive, not a separate desktop design. Use `md:grid-cols-12`, `md:col-span-*`, or `sm:grid-cols-*` only where more space improves scanning.

## Surfaces And Elevation

Primary surfaces:

- Cards use `rounded-xl border border-sage/15 bg-card text-card-foreground`.
- Larger panels often use `rounded-2xl border border-sage/15 bg-card p-4/p-6`.
- Internal soft containers use `bg-surface-container-low` or `bg-muted`.
- Decorative overlays use low-opacity gradients or soft circles.

Elevation:

- Default cards are mostly flat with borders.
- Use `shadow-soft` for selected/primary elements.
- Use glow sparingly for active prayer, cycle, or celebratory states.
- Existing shadows are very subtle: avoid heavy drop shadows.

## Buttons

Button variants are defined in `src/components/ui/button.tsx`.

Base style:

- Rounded: `rounded-xl`.
- Height: `h-11` default, `h-9` small, `h-10 w-10` icon.
- Typography: `text-sm font-semibold`.
- Focus: `focus-visible:ring-2 focus-visible:ring-ring`.

Variants:

- `default`: sage filled button, white text, soft shadow.
- `outline`: white/card background, sage border tint, primary text.
- `secondary`: sky pale background with secondary text.
- `ghost`: transparent, primary text, pale sage hover.

Guidelines:

- Use filled `default` for the main action in a local context.
- Use `outline` for secondary actions and calm settings actions.
- Icon buttons should be circular and have accessible labels.
- Avoid destructive filled red unless the action is immediately destructive.

## Controls

Segmented controls:

- Implemented with `Tabs` or `ToggleGroup`.
- Outer container: `h-11`, `rounded-xl`, `border-sage/15`, `bg-muted`, `p-1`.
- Active item: `bg-sage text-white shadow-soft`.
- Inactive item: muted foreground, pale sage hover.

Inputs:

- Rounded `rounded-xl`.
- Border: `border-sage/15`.
- Background: `bg-background`.
- Height: usually `h-10` or `h-11`.
- Focus: border changes to `focus:border-sage`.
- Labels are uppercase, bold, and muted.

Checkboxes:

- Native checkbox with `accent-sage` is currently used in habit editing.

Frequency and chip controls:

- Pills use `rounded-full border border-sage/15 px-3 py-1.5 text-xs font-bold`.
- Active pills use `border-sage bg-sage text-white`.

## Navigation

Header:

- Sticky, `top-0`, `z-40`.
- Background: `bg-background/95 backdrop-blur`.
- Center brand lockup: logo plus Playfair title.
- Left and right controls open settings/profile.
- Signed-in users show avatar or initial in sage circle.

Bottom nav:

- Fixed bottom, rounded top, translucent card background.
- Icons from Lucide.
- Active route scales slightly and uses blush icon with sage-deep label.
- Nav items: Daily, Quran, Fasting, Cycle.

## Settings Panel

Implemented as a Radix Dialog sheet in `src/components/ui/sheet.tsx` and `src/components/settings/settings-panel.tsx`.

Behavior:

- Full-screen modal sheet on mobile.
- Right-side drawer at desktop width: `md:w-[480px]`.
- Overlay uses foreground tint and backdrop blur.
- Close button is circular, top-right, `h-10 w-10`.

Structure:

- Header: large serif title and short subtitle.
- Scrollable content with `px-6 py-6` and vertical `gap-8`.
- Cloud Sync card appears first.
- Partner card appears for signed-in users.
- Language, theme, and Hijri offset controls follow.
- Habits editor appears last.

Settings panel style notes:

- Section cards use `rounded-2xl border border-sage/15 bg-card p-4`.
- Leading section icons sit in pale sage circular badges.
- Account profile row uses `bg-surface-container-low` and a circular avatar.
- Partner role, language, theme, and Hijri offset all use segmented controls.
- Habit rows use icon badge, label, schedule, frequency dots, and chevron expansion.

Known design pressure point:

- The partner code row is compact on narrow widths. If revisiting this panel, split invite creation and code entry into clearer stacked flows.

## Cards And Feature Patterns

Daily page:

- Hero date uses serif sage text and muted Gregorian date.
- Primary greeting uses large serif primary text.
- Prayer check card is the dominant daily card with circular prayer controls.
- Active/completed prayer states use sage borders/fills and soft glow.
- Sunnah prayer chips are horizontally scrollable pills.
- Daily habit card uses soft internal progress container and collapsible earlier-habits section.
- Cycle preview uses blush gradient, circular icon, and privacy reveal behavior.

Quran page:

- Centered page title and subtitle.
- Circular progress ring with primary stroke.
- Continue-reading card and Juz grid use card surfaces.
- Journey log is a vertical timeline with sage border and rounded entries.
- Juz completion can show flower/celebratory markers.

Fasting page:

- Hijri date and offset controls appear at top.
- Remaining Qadha card centers a large circular progress ring.
- Ramadan warning uses amber border/glow when applicable.
- Upcoming Sunnah cards use circular sage-pale icon badges.

Cycle page:

- Privacy toggle appears above title.
- Main cycle ring is large, centered, and blush-accented.
- Private health data uses blur and tap-to-reveal behavior.
- Symptom buttons are compact cards, active state uses blush tint.
- Data export/period action sections use standard cards.

## Icons And Imagery

- Icons use `lucide-react` throughout.
- Icon size is usually `h-4 w-4`, `h-5 w-5`, or `h-6 w-6`.
- Leading feature icons often sit inside `h-10 w-10` or `h-12 w-12` circles.
- Brand logo is served from `/logo.svg` and appears in the header.
- The app uses a Quran image in the Daily continue-reading card; imagery should remain soft, natural, and devotional.

## Motion

Motion is subtle and purposeful.

Current patterns:

- Hover transitions on buttons, cards, and chips.
- Active nav item scales slightly with `scale-105`.
- Pressable symptom buttons use `active:scale-95`.
- Chevrons rotate when sections expand.
- Flower burst animation celebrates prayer/Quran milestones.

Flower burst:

- Defined in `src/index.css` as `@keyframes flower-burst`.
- Uses translate, scale, rotation, and fade-out.
- Should remain celebratory but short-lived and non-blocking.

## Accessibility

Current accessibility conventions:

- Interactive icon-only buttons include `aria-label` or screen-reader text.
- Sheet close button includes an `sr-only` label.
- Focus states use `focus-visible:ring-2 focus-visible:ring-ring`.
- Toggle groups use `aria-pressed` or Radix Tabs state.
- Sensitive cycle data can be hidden/blurred by default.

Guidelines:

- Keep tap targets near or above `40px`; prefer `44px` for primary mobile controls.
- Preserve visible focus rings on all custom buttons.
- Use semantic buttons for actions and links for navigation.
- Avoid relying only on color for status; include text or icons.

## Responsive Rules

- Design for mobile first.
- Use `px-6` as the standard horizontal page padding.
- Use `pb-32` on pages with bottom navigation.
- Use horizontal scrolling for dense chip rows instead of squeezing them.
- Use desktop grids only when content benefits from side-by-side comparison.
- Settings remains a sheet, not a full desktop settings page.

## Implementation References

- Theme tokens: `src/index.css`.
- Tailwind token mapping: `tailwind.config.ts`.
- Button primitive: `src/components/ui/button.tsx`.
- Card primitive: `src/components/ui/card.tsx`.
- Sheet primitive: `src/components/ui/sheet.tsx`.
- Segmented controls: `src/components/ui/tabs.tsx`, `src/components/ui/toggle-group.tsx`.
- Header: `src/components/layout/header.tsx`.
- Bottom navigation: `src/components/layout/bottom-nav.tsx`.
- Settings panel: `src/components/settings/settings-panel.tsx`.
- Main pages: `src/pages/daily.tsx`, `src/pages/quran.tsx`, `src/pages/fasting.tsx`, `src/pages/cycle.tsx`.

## Do And Do Not

Do:

- Use tokenized colors instead of hardcoded colors.
- Keep headings serif and UI text sans-serif.
- Prefer soft borders and low-opacity fills over heavy shadows.
- Use sage for primary spiritual progress and selected states.
- Use blush for cycle, emotional warmth, and celebration.
- Keep settings and data-entry flows calm and spacious.

Do not:

- Introduce harsh blacks, pure grays, or saturated neon colors.
- Replace rounded cards with square panels.
- Overuse green filled buttons for every action.
- Add dense desktop-only layouts that break the mobile sanctuary feel.
- Add heavy animations or persistent confetti.
- Show sensitive cycle data without respecting the privacy state.
