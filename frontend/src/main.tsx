import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Hide the loading splash once React mounts
const splash = document.getElementById('app-loading')
if (splash) {
  // Give React a single frame to paint before fading
  requestAnimationFrame(() => {
    splash.classList.add('hidden')
    // Remove from DOM after fade completes
    splash.addEventListener('transitionend', () => splash.remove(), { once: true })
  })
}

createRoot(document.getElementById('root')!).render(
  <App />
)
