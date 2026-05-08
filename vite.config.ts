import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"
import { VitePWA } from "vite-plugin-pwa"

const analyze = process.env.ANALYZE === "true"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: "Amaly - Daily Ibadah Tracker",
        short_name: "Amaly",
        description: "Track your daily prayers, Quran reading, fasting, and dhikr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#16a34a",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        categories: ["lifestyle", "productivity"],
        screenshots: [
          {
            src: "/logo.svg",
            sizes: "540x720",
            type: "image/svg+xml",
            form_factor: "narrow",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        globIgnores: ["**/node_modules/**/*", "dist/bundle-stats.html"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://quranwbw.com",
            handler: "CacheFirst",
            options: {
              cacheName: "quran-cdn",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/duas/"),
            handler: "CacheFirst",
            options: {
              cacheName: "duas-data",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://api.supabase.co",
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /\.[a-z0-9]+$/],
      },
    }),
    analyze
      ? visualizer({
          filename: "dist/bundle-stats.html",
          gzipSize: true,
          brotliSize: true,
          open: false,
        })
      : null,
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (id.includes("@supabase")) return "supabase"
          if (id.includes("@umalqura")) return "islamic-data"
          if (id.includes("@radix-ui")) return "radix-ui"
          if (id.includes("lucide-react")) return "icons"
          return "vendor"
        },
      },
    },
  },
})
