import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "@/App"
import "@/index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/service-worker.js")
  })
}

window.addEventListener("error", (event) => {
  const error = event.error as Error & { code: string }
  if (error?.code === "MODULE_NOT_FOUND" || error?.name === "ChunkLoadError") {
    window.location.reload()
  }
}, true)

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason as Error | undefined
  if (reason?.name === "ChunkLoadError" || reason?.message?.includes("Failed to fetch dynamically imported module")) {
    window.location.reload()
  }
})
