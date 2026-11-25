import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { MapPin, Sparkles, Ticket } from 'lucide-react'
import type { GuideEvent } from '../types'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import '../hero-motion.css'

const editorialDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const spring = { stiffness: 120, damping: 22 }

const stampPoints = Array.from({ length: 40 }, (_, index) => {
  const angle = index / 40 * 2 * Math.PI - Math.PI / 2
  const radius = index % 2 === 0 ? 54 : 47
  const x = 55 + radius * Math.cos(angle)
  const y = 55 + radius * Math.sin(angle)
  return x.toFixed(2) + ',' + y.toFixed(2)
}).join(' ')

function PickStamp() {
  return (
    <svg aria-hidden="true" viewBox="0 0 110 110" className="pick-stamp">
      <defs>
        <path id="stamp-circle" d="M55,55m-35,0a35,35 0 1,1 70,0a35,35 0 1,1 -70,0" />
      </defs>
      <polygon points={stampPoints} fill="#e5ff73" />
      <circle cx="55" cy="55" r="42" fill="none" stroke="#213521" strokeWidth=".9" />
      <text fontSize="9.7" fill="#162b1e" fontWeight="800" letterSpacing="1.35">
        <textPath href="#stamp-circle" textLength="218">SIDEQUEST PICK ✦ SIDEQUEST PICK ✦ </textPath>
      </text>
      <path
        fill="#183727"
        d="M55 31c1.4 15.3 8.4 21.8 23 24-15.4 2.1-21.5 9.7-23 24-1.9-15-8.5-21.7-24-24 15-1.9 21.7-8.7 24-24Z"
      />
      <path
        fill="#183727"
        d="M72 34c.6 5 2.9 7.5 7.6 8.2-4.6.7-7 3.3-7.6 8.1-.7-4.7-2.9-7.4-7.6-8.1 4.8-.8 7-3.1 7.6-8.2Z"
      />
    </svg>
  )
}

interface HeroProps {
  picks: GuideEvent[]
  browse: () => void
  onOpen: (event: GuideEvent) => void
}

export function Hero({ picks, browse, onOpen }: HeroProps) {
  const [slide, setSlide] = useState({ index: 0, previous: -1, direction: 'next' })
  const event = picks[slide.index]
  const reduced = usePrefersReducedMotion()
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const horizontal = useMotionValue(0)
  const vertical = useMotionValue(0)
  const x = useSpring(horizontal, spring)
  const y = useSpring(vertical, spring)

  function select(index: number, direction: 'next' | 'previous') {
    setSlide(current => index === current.index
      ? current
      : { index, previous: current.index, direction })
  }

  function adjacentIndex(step: number) {
    return (slide.index + step + picks.length) % picks.length
  }

  function handleKeys(key: KeyboardEvent<HTMLDivElement>) {
    if (key.altKey || key.ctrlKey || key.metaKey || key.shiftKey) return
    if (key.key !== 'ArrowRight' && key.key !== 'ArrowLeft') return
    key.preventDefault()
    const step = key.key === 'ArrowRight' ? 1 : -1
    const next = adjacentIndex(step)
    select(next, step === 1 ? 'next' : 'previous')

    if (key.target instanceof HTMLElement && key.target.closest('[data-feature-index]')) {
      key.currentTarget.querySelector<HTMLButtonElement>(`[data-feature-index="${next}"]`)?.focus()
    }
  }

  function startGesture(pointer: PointerEvent<HTMLButtonElement>) {
    if (!pointer.isPrimary || pointer.button !== 0) return
    suppressClick.current = false
    gesture.current = { id: pointer.pointerId, x: pointer.clientX, y: pointer.clientY }
    pointer.currentTarget.setPointerCapture(pointer.pointerId)
  }

  function finishGesture(pointer: PointerEvent<HTMLButtonElement>) {
    const start = gesture.current
    if (!start || start.id !== pointer.pointerId) return
    gesture.current = null
    const dx = pointer.clientX - start.x
    const dy = pointer.clientY - start.y
    const box = pointer.currentTarget.getBoundingClientRect()
    const inside = pointer.clientX >= box.left && pointer.clientX <= box.right
      && pointer.clientY >= box.top && pointer.clientY <= box.bottom

    // A drag must never open the event when its trailing click arrives.
    suppressClick.current = Math.max(Math.abs(dx), Math.abs(dy)) > 12 || !inside
    if (Math.abs(dx) >= 42 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      const forward = dx < 0
      select(adjacentIndex(forward ? 1 : -1), forward ? 'next' : 'previous')
    }
    resetPosition()
  }

  function move(pointer: PointerEvent<HTMLElement>) {
    if (reduced) return
    const start = gesture.current
    if (start && start.id === pointer.pointerId) {
      const dx = pointer.clientX - start.x
      const dy = pointer.clientY - start.y
      if (Math.abs(dx) > Math.abs(dy)) horizontal.set(Math.max(-8, Math.min(8, dx * .14)))
      return
    }
    if (pointer.pointerType !== 'mouse') return
    const box = pointer.currentTarget.getBoundingClientRect()
    const relativeX = (pointer.clientX - box.left) / box.width - .5
    const relativeY = (pointer.clientY - box.top) / box.height - .5
    horizontal.set(relativeX * 15)
    vertical.set(relativeY * 11)
  }

  function resetPosition() {
    horizontal.set(0)
    vertical.set(0)
  }

  return (
    <section aria-labelledby="hero-title" className="hero-ticket">
      <div className="hero-paper">
        <div className="hero-content">
          <span className="edition inline-flex items-center">
            <MapPin size={13} strokeWidth={2.5} />New York City Guide
          </span>
          <h1 id="hero-title">
            <span className="hero-title-line">Find your</span><br />
            <em className="hero-title-line">next thing.</em>
          </h1>
          <p>
            From late-night sets to neighborhood gems, discover<br className="wide-break" />
            {' '}what’s happening around the city.
          </p>
          <button type="button" className="browse-button inline-flex items-center" onClick={browse}>
            <Ticket size={17} />Explore events
          </button>
        </div>
        <div className="barcode" aria-hidden="true"><i /><span>SQ · NYC</span></div>
      </div>
      <div
        role="group"
        className="spotlight"
        aria-label="Featured events"
        aria-roledescription="carousel"
        data-direction={slide.direction}
        onKeyDown={handleKeys}
        onPointerMove={move}
        onPointerLeave={resetPosition}
      >
        <motion.div className="feature-image-wrap" style={{ x: reduced ? 0 : x, y: reduced ? 0 : y }}>
          {picks.map((item, position) => {
            let frame = 'hidden'
            if (position === slide.index) frame = slide.previous < 0 ? 'first' : 'current'
            else if (position === slide.previous) frame = 'previous'
            return (
              <img
                key={item.id}
                src={position === 0 ? '/images/hero.webp' : item.image}
                alt=""
                draggable={false}
                data-frame={frame}
              />
            )
          })}
        </motion.div>
        <div className="feature-shade" />
        <PickStamp />
        <button
          type="button"
          className="feature-link"
          onPointerDown={startGesture}
          onPointerUp={finishGesture}
          onPointerCancel={() => {
            gesture.current = null
            suppressClick.current = true
            resetPosition()
          }}
          onClick={click => {
            if (click.detail === 0 || !suppressClick.current) onOpen(event)
            suppressClick.current = false
          }}
          aria-keyshortcuts="ArrowLeft ArrowRight"
          aria-label={'View featured event: ' + event.title}
        >
          <span key={event.id} className="feature-caption">
            <span className="feature-kicker flex items-center">
              <Sparkles size={13} /> In the spotlight
            </span>
            <span className="feature-name">{event.title}</span>
            <span className="feature-place">
              {editorialDate.format(new Date(event.date + 'T12:00:00'))}
              <b>·</b>
              {event.venue}
            </span>
          </span>
        </button>
        <div role="group" className="feature-tabs flex items-center" aria-label="Choose featured event">
          {picks.map((item, position) => (
            <button
              type="button"
              key={item.id}
              aria-label={'Show ' + item.title}
              title={item.title}
              data-feature-index={position}
              aria-pressed={position === slide.index}
              tabIndex={position === slide.index ? 0 : -1}
              aria-keyshortcuts="ArrowLeft ArrowRight"
              onClick={() => select(position, position > slide.index ? 'next' : 'previous')}
            >
              <span />
            </button>
          ))}
        </div>
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          {slide.previous >= 0 && `Featured event ${slide.index + 1} of ${picks.length}: ${event.title}`}
        </span>
      </div>
      <div className="ticket-join" aria-hidden="true" />
    </section>
  )
}
