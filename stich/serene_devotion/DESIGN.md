---
name: Serene Devotion
colors:
  surface: '#faf9f5'
  surface-dim: '#dadad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ef'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e3de'
  on-surface: '#1a1c1a'
  on-surface-variant: '#434841'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f1f1ec'
  outline: '#737970'
  outline-variant: '#c3c8bf'
  surface-tint: '#4a6549'
  primary: '#4a6549'
  on-primary: '#ffffff'
  primary-container: '#8ba888'
  on-primary-container: '#243d24'
  inverse-primary: '#b0cfad'
  secondary: '#4b626a'
  on-secondary: '#ffffff'
  secondary-container: '#cee7f0'
  on-secondary-container: '#516870'
  tertiary: '#7b5455'
  on-tertiary: '#ffffff'
  tertiary-container: '#c39595'
  on-tertiary-container: '#4f2e2f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ccebc7'
  primary-fixed-dim: '#b0cfad'
  on-primary-fixed: '#07200b'
  on-primary-fixed-variant: '#334d33'
  secondary-fixed: '#cee7f0'
  secondary-fixed-dim: '#b2cad3'
  on-secondary-fixed: '#061e25'
  on-secondary-fixed-variant: '#344a52'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#ecbaba'
  on-tertiary-fixed: '#2f1314'
  on-tertiary-fixed-variant: '#613d3e'
  background: '#faf9f5'
  on-background: '#1a1c1a'
  surface-variant: '#e3e3de'
typography:
  h1:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  h2:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  h3:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 64px
  container-padding: 24px
  gutter: 16px
---

## Brand & Style

This design system centers on a "Modern Spiritual Minimalist" aesthetic, specifically tailored for a feminine audience seeking tranquility in their daily spiritual habits. The brand personality is gentle, nurturing, and intentional. 

The visual style leans into **Minimalism** with a touch of **Tactile Softness**. It prioritizes heavy whitespace to reduce cognitive load and create a "digital sanctuary." The interface avoids harsh shadows or high-density information patterns, instead using a breathy layout that honors the contemplative nature of the content. Visual elements should feel light, airy, and grounded by organic tones.

## Colors

The palette is anchored by a grounded **Sage Green** (#8BA888) and a warm **Cream** (#FDF5E6) base. To enhance the feminine and modern feel, two new accents are introduced:

- **Primary (Sage Green):** Used for core branding and success states.
- **Secondary (Sky Blue #AEC6CF):** Applied to secondary actions, utility buttons, and subtle background washes to differentiate sections.
- **Tertiary/Accent (Soft Pink #F4C2C2):** Dedicated to active states, highlights, and emotional resonance points (e.g., "Favorite" or "Current Task").
- **Neutral (Warm Charcoal #4A4A4A):** Used for typography to maintain readability without the harshness of pure black.

## Typography

This design system utilizes **Playfair Display** for headers to evoke elegance and tradition. For functional text, **Plus Jakarta Sans** provides a friendly, contemporary contrast that ensures high legibility on mobile devices.

Headlines should be treated with generous top margins to establish clear section breaks. Body text uses increased line height (1.6) to maintain an airy, unhurried reading experience. Labels use slightly tighter tracking and a semi-bold weight for immediate recognition.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on safe margins. A 24px side margin is mandatory for all mobile screens to prevent elements from feeling cramped against the edges. 

The spacing rhythm is based on an 8px scale. Use "Large" (48px) and "Extra Large" (64px) spacing between major sections to emphasize the minimalist philosophy. Components within a card should utilize "Small" (12px) and "Medium" (24px) spacing to maintain a cohesive grouping.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. 

- **Level 0 (Background):** The Cream (#FDF5E6) canvas.
- **Level 1 (Cards/Containers):** Solid white or a very subtle Sky Blue wash (#AEC6CF at 10% opacity) with a 1px border of Sage Green at 15% opacity.
- **Level 2 (Active States):** A soft, diffused ambient shadow (Blur 20px, Spread 0, Color: Sage Green at 8% opacity) is used only for elements that require physical interaction cues, such as a focused input or an active floating action button.

## Shapes

The shape language is defined by the **16px (1rem)** standard corner radius. This "Rounded" approach softens the interface, making it feel approachable and feminine.

- **Standard Containers:** 16px radius.
- **Buttons and Chips:** 16px or fully pill-shaped for smaller utility items.
- **Input Fields:** 12px radius to provide a slight visual distinction from larger layout containers.
- **Images:** Always clipped to a minimum of 16px radius to maintain consistency with the UI.

## Components

### Buttons
- **Primary:** Sage Green background with white text. Rounded 16px.
- **Secondary:** Sky Blue background with charcoal text. Use for less critical actions.
- **Ghost/Tertiary:** Cream background with Sage Green border.

### Highlights & Active States
- **Soft Pink (#F4C2C2):** Use exclusively for active navigation icons, selected calendar dates, or "in-progress" progress bars. This provides a clear visual signal that differs from the branding colors.

### Cards
- White background with a 16px corner radius. Use a 1px Sage Green stroke at low opacity (10-15%) instead of a shadow for a cleaner, flatter look.

### Input Fields
- Subtle Sky Blue background (5% opacity) with a bottom-only border or a soft 1px Cream-tinted stroke. Focus state should transition the border to Sage Green.

### Progress Trackers
- Use Sky Blue for the "track" and Sage Green for the "filled" state. For daily goals achieved, the fill color can transition to Soft Pink to provide a sense of reward and delight.