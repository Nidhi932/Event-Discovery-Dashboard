import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import { App } from './App'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import './style.css'

function Dashboard() {
  const reduced = usePrefersReducedMotion()
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <App />
    </MotionConfig>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><Dashboard /></StrictMode>,
)
