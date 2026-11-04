import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initMedia } from './store'
import './index.css'

// Load uploaded photos from IndexedDB before first paint so images resolve immediately.
initMedia().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
