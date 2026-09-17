import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { asset } from './asset'

const root = document.documentElement
root.style.setProperty('--dune-mark-arch', `url("${asset('icons/dune-mark-arch.svg')}")`)
root.style.setProperty('--dune-mark-dune', `url("${asset('icons/dune-mark-dune.svg')}")`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
