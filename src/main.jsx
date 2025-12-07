import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import iconaIco from './assets/media/icona.ico'
import iconaPng from './assets/media/icona.png'

function ensureLink(rel, href, attributes = {}) {
  if (typeof document === 'undefined' || !href) return
  let link = document.querySelector(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
  }
  link.href = href
  Object.entries(attributes).forEach(([key, value]) => {
    if (value) link.setAttribute(key, value)
  })
}

if (typeof document !== 'undefined') {
  ensureLink('icon', iconaIco, { type: 'image/x-icon' })
  ensureLink('apple-touch-icon', iconaPng)
  ensureLink('mask-icon', iconaPng, { color: '#111827' })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
