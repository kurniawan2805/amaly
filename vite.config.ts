import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"

const analyze = process.env.ANALYZE === "true"

export default defineConfig({
  plugins: [
    react(),
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
