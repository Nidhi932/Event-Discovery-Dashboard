import { useSyncExternalStore } from 'react'

const preference = window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribe(onChange: () => void) {
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, () => preference.matches)
}
