import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './controlProfiles.css'
import './practice.css'
import './scoring.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
