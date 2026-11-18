import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureDemoSeed } from './lib/demoStore'
import { isDemoMode } from './lib/firebase'

if (isDemoMode) {
  ensureDemoSeed()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
