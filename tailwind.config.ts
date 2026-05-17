import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "960px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          bright: "hsl(var(--surface-bright))",
          dim: "hsl(var(--surface-dim))",
          container: "hsl(var(--surface-container))",
          "container-lowest": "hsl(var(--surface-container-lowest))",
          "container-low": "hsl(var(--surface-container-low))",
          "container-high": "hsl(var(--surface-container-high))",
          "container-highest": "hsl(var(--surface-container-highest))",
          variant: "hsl(var(--surface-variant))",
        },
        sage: {
          DEFAULT: "hsl(var(--sage))",
          deep: "hsl(var(--sage-deep))",
          pale: "hsl(var(--sage-pale))",
          muted: "hsl(var(--sage-muted))",
        },
        sky: {
          DEFAULT: "hsl(var(--sky))",
          pale: "hsl(var(--sky-pale))",
          muted: "hsl(var(--sky-muted))",
        },
        blush: {
          DEFAULT: "hsl(var(--blush))",
          pale: "hsl(var(--blush-pale))",
          muted: "hsl(var(--blush-muted))",
        },
        amber: {
          DEFAULT: "hsl(var(--amber))",
          pale: "hsl(var(--amber-pale))",
          muted: "hsl(var(--amber-muted))",
        },
        indigo: {
          DEFAULT: "hsl(var(--indigo))",
          pale: "hsl(var(--indigo-pale))",
          muted: "hsl(var(--indigo-muted))",
        },
        rose: {
          DEFAULT: "hsl(var(--rose))",
          pale: "hsl(var(--rose-pale))",
          muted: "hsl(var(--rose-muted))",
        },
        violet: {
          DEFAULT: "hsl(var(--violet))",
          pale: "hsl(var(--violet-pale))",
          muted: "hsl(var(--violet-muted))",
        },
        teal: {
          DEFAULT: "hsl(var(--teal))",
          pale: "hsl(var(--teal-pale))",
          muted: "hsl(var(--teal-muted))",
        },
        orange: {
          DEFAULT: "hsl(var(--orange))",
          pale: "hsl(var(--orange-pale))",
          muted: "hsl(var(--orange-muted))",
        },
        emerald: {
          DEFAULT: "hsl(var(--emerald))",
          pale: "hsl(var(--emerald-pale))",
          muted: "hsl(var(--emerald-muted))",
        },
        charcoal: "#4a4a4a",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px 0 rgb(139 168 136 / 8%)",
        glow: "0 0 20px rgb(244 194 194 / 30%)",
      },
    },
  },
  safelist: [
    "bg-sage",
    "bg-sky",
    "bg-blush",
    "bg-amber",
    "bg-indigo",
    "bg-rose",
    "bg-violet",
    "bg-teal",
    "bg-orange",
    "bg-emerald",
    "border-sage",
    "border-sky",
    "border-blush",
    "border-amber",
    "border-indigo",
    "border-rose",
    "border-violet",
    "border-teal",
    "border-orange",
    "border-emerald",
  ],
  plugins: [animate],
} satisfies Config

export default config
