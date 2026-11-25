import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { scrollInfo } from 'framer-motion'

const desktopPointer = window.matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)')

function subscribeToPointerMode(notify: () => void) {
  desktopPointer.addEventListener('change', notify)
  return () => desktopPointer.removeEventListener('change', notify)
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value))

export function useCardTilt(reduced: boolean, position: number) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const followsPointer = useSyncExternalStore(subscribeToPointerMode, () => desktopPointer.matches)

  useLayoutEffect(() => {
    const surface = surfaceRef.current
    const card = surface?.parentElement
    if (reduced || !surface || !card) return

    // Measure the article. Its child can then tilt without changing the reference box.
    const reset = () => surface.style.removeProperty('--card-tilt')
    if (!followsPointer) {
      const unsubscribe = scrollInfo(({ y }) => {
        const pitch = (0.5 - y.progress) * 11
        surface.style.setProperty('--card-tilt', `rotateX(${pitch.toFixed(2)}deg)`)
      }, { target: card, offset: ['start end', 'end start'] })
      return () => { unsubscribe(); reset() }
    }

    const follow = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.buttons) return
      const bounds = card.getBoundingClientRect()
      const x = clamp(2 * (event.clientX - bounds.left) / bounds.width - 1)
      const y = clamp(2 * (event.clientY - bounds.top) / bounds.height - 1)
      surface.style.setProperty(
        '--card-tilt',
        `translateY(-2px) rotateX(${(-4 * y).toFixed(2)}deg) rotateY(${(5 * x).toFixed(2)}deg)`,
      )
    }

    card.addEventListener('pointerenter', follow)
    card.addEventListener('pointermove', follow)
    card.addEventListener('pointerleave', reset)
    card.addEventListener('pointercancel', reset)
    window.addEventListener('blur', reset)
    return () => {
      card.removeEventListener('pointerenter', follow)
      card.removeEventListener('pointermove', follow)
      card.removeEventListener('pointerleave', reset)
      card.removeEventListener('pointercancel', reset)
      window.removeEventListener('blur', reset)
      reset()
    }
  }, [followsPointer, position, reduced])

  return surfaceRef
}
