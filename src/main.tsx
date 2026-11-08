import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { initStore } from "./store"
import "./index.css"

// Load the shared catalogue from Supabase before first paint (capped so a slow network never blocks the page).
Promise.race([initStore(), new Promise((r) => setTimeout(r, 3000))]).finally(
  () => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  },
)
