import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import HandSignature from './HandSignature.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HandSignature />

  </StrictMode>,
)
