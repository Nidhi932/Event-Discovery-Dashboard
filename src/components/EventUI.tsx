import { forwardRef, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import type { GuideEvent } from '../types'
import { useCardTilt } from './useCardTilt'
import '../event-ui.css'

type EventAction = (event: GuideEvent) => void
type IconName = 'bookmark' | 'pin' | 'close' | 'calendar' | 'ticket' | 'remove'

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    bookmark: <path d="M6.5 5.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15l-5.5-3.7-5.5 3.7z" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.4" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M7.5 3v4m9-4v4m-13 3h17" /></>,
    ticket: <><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z" /><path d="M15.5 5.2v2m0 3.8v2m0 3.8v2" /></>,
    remove: <><path d="M4 6.5h16M9 6V4h6v2M6 7l1 13h10l1-13M10 10v7m4-7v7" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function eventDate(date: string) {
  return new Date(date.slice(0, 10) + 'T12:00:00')
}

const fullDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const shortMonth = new Intl.DateTimeFormat('en-US', { month: 'short' })
const drawerDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 })
const priceLabel = (event: GuideEvent) => event.price === 0 ? 'Free' : priceFormat.format(event.price)

function timeLabel(time: string) {
  const match = /^(\d\d?):(\d\d)$/.exec(time)
  if (!match) return time
  const hour = Number(match[1])
  return (hour % 12 || 12) + ':' + match[2] + (hour >= 12 ? ' PM' : ' AM')
}

function categoryColor(category: string) {
  if (/music|live/i.test(category)) return 'violet'
  if (/food|drink|market/i.test(category)) return 'orange'
  if (/art|workshop|design|culture|creative/i.test(category)) return 'blue'
  if (/comedy|film|theat/i.test(category)) return 'rose'
  return 'green'
}

function Category({ event }: { event: GuideEvent }) {
  return <div className="sq-labels">
    <span className={'sq-category sq-category--' + categoryColor(event.category)}>{event.category}</span>
    {event.tag && event.tag.toLowerCase() !== event.category.toLowerCase() && <span className="sq-tag">{event.tag}</span>}
  </div>
}

type SaveProps = { event: GuideEvent; saved: boolean; onSave: EventAction; withLabel?: boolean }

export function SaveButton({ event, saved, onSave, withLabel = false }: SaveProps) {
  const reduced = usePrefersReducedMotion()
  const [burst, setBurst] = useState(false)
  const showBurst = saved && burst && !reduced

  useLayoutEffect(() => {
    if (reduced || !saved) setBurst(false)
  }, [reduced, saved])

  return (
    <motion.button
      type="button"
      className={withLabel ? 'sq-save sq-save--label' : 'sq-save'}
      aria-label={'Save ' + event.title}
      aria-pressed={saved}
      title={saved ? 'Remove from saved events' : 'Save event'}
      whileTap={reduced ? undefined : { scale: 0.94 }}
      onClick={() => {
        setBurst(!saved && !reduced)
        onSave(event)
      }}
    >
      <span className="sq-save-glyph">
        <span className={showBurst ? 'sq-save-mark sq-save-mark--stamp' : 'sq-save-mark'}>
          <Icon name="bookmark" size={withLabel ? 18 : 19} />
        </span>
        {showBurst && (
          <span
            aria-hidden="true"
            className="sq-bookmark-burst"
            onAnimationEnd={animation => {
              if (animation.target === animation.currentTarget) setBurst(false)
            }}
          >
            <i /><i /><i /><i /><i /><i />
          </span>
        )}
      </span>
      {withLabel && (saved ? 'Saved to your list' : 'Save event')}
    </motion.button>
  )
}

type CardProps = SaveProps & { onOpen: EventAction; index?: number }

export const EventCard = forwardRef<HTMLElement, CardProps>(function EventCard({ event, saved, onSave, onOpen, index = 0 }, ref) {
  const reduced = usePrefersReducedMotion()
  const surfaceRef = useCardTilt(reduced, index)
  const date = eventDate(event.date)
  return <motion.article
    ref={ref}
    className="sq-card"
    layout={reduced ? false : 'position'}
    initial={reduced ? false : { opacity: 0, y: 17 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: .04 }}
    exit={reduced ? undefined : { opacity: 0, scale: .975, transition: { duration: .15 } }}
    transition={{ opacity: { duration: .28, delay: (index % 3) * .055 }, y: { duration: .36, delay: (index % 3) * .055 }, layout: { type: 'spring', stiffness: 400, damping: 38 } }}
  >
    <div className="sq-card-surface" ref={surfaceRef}>
      <div className="sq-media">
        <img src={event.image} alt="" loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />
        <time className="sq-stamp" dateTime={event.date} aria-label={fullDate.format(date)}>
          <span>{shortMonth.format(date)}</span><strong>{date.getDate()}</strong>
        </time>
        <SaveButton event={event} saved={saved} onSave={onSave} />
      </div>
      <div className="sq-card-info">
        <Category event={event} />
        <h3><button className="sq-card-link" type="button" onClick={() => onOpen(event)}>{event.title}</button></h3>
        <div className="sq-card-meta">
          <span className="sq-venue"><Icon name="pin" size={15} /><span>{event.venue}</span></span>
          <strong className={'sq-price' + (event.price === 0 ? ' sq-free' : '')}>{priceLabel(event)}</strong>
        </div>
      </div>
    </div>
  </motion.article>
})

function TicketIllustration({ saved }: { saved: boolean }) {
  return <svg className="sq-empty-art" viewBox="0 0 160 110" fill="none" aria-hidden="true">
    <ellipse cx="80" cy="93" rx="46" ry="4" fill="#1d4937" opacity=".09" />
    <g transform="rotate(-13 75 60)" stroke="#244b37" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M28 37a4 4 0 0 1 4-4h91a4 4 0 0 1 4 4v14a8 8 0 0 0 0 16v14a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4V67a8 8 0 0 0 0-16Z" fill="#d4efab" />
      <path d="M100 37v4m0 7v4m0 7v4m0 7v4m0 7v1" />
      <path d="m43 52 6.5 6.5L58 46.8m-13 23h31m-9-17h19m-19 8h11" />
    </g>
    {saved ? <g transform="rotate(12 103 69)" stroke="#244b37" strokeWidth="2.4" strokeLinejoin="round">
      <path d="M98 52.5h19a2 2 0 0 1 2 2v32l-11.5-7.5L96 86.5v-32a2 2 0 0 1 2-2Z" fill="#d7c3fc" />
    </g> : <g stroke="#244b37" strokeWidth="3.2" strokeLinecap="round">
      <circle cx="103" cy="66" r="13" fill="#d6c3f4" /><circle cx="103" cy="66" r="8" fill="#f0e6ff" /><path d="m113 76 11 12" strokeWidth="6" />
    </g>}
    <g stroke="#679463" strokeWidth="2" strokeLinecap="round"><path d="M21 22v8m-4-4h8m105-7v9m-4.5-4.5h9M15 74l4-2m119-27 4-3" /></g>
  </svg>
}

export function EmptyState({ saved = false, onReset }: { saved?: boolean; onReset?: () => void }) {
  return <div className="sq-empty">
    <TicketIllustration saved={saved} />
    <h3>{saved ? 'Your saved events live here' : 'No events match this search'}</h3>
    <p>{saved ? 'Tap the bookmark on any event to keep it for later.' : 'Try another search or clear your filters to see all events.'}</p>
    {onReset && <button className="sq-action" type="button" onClick={onReset}>{saved ? 'Back to discovery' : 'Clear search and filters'}</button>}
  </div>
}

let activeDialogs = 0
let previousBodyOverflow = ''

function Modal({ mode, titleId, children, onClose }: { mode: 'drawer' | 'details'; titleId: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const reduce = usePrefersReducedMotion()
  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    element.showModal()
    panel.current?.querySelector<HTMLButtonElement>('button[data-initial-focus]')?.focus({ preventScroll: true })
    if (activeDialogs++ === 0) {
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    return () => {
      element.close()
      if (--activeDialogs === 0) {
        document.body.style.overflow = previousBodyOverflow
        if (opener?.isConnected) opener.focus({ preventScroll: true })
      }
    }
  }, [])
  return <motion.dialog
    ref={dialog}
    className={'sq-dialog sq-dialog--' + mode}
    aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}
    initial={{ opacity: reduce ? 1 : 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: reduce ? 1 : 0 }}
    transition={{ duration: reduce ? 0 : .2 }}
  >
    <motion.div
      ref={panel}
      className="sq-panel"
      layoutScroll
      initial={reduce ? false : mode === 'drawer' ? { x: '100%' } : { y: 15, scale: .98 }}
      animate={{ x: 0, y: 0, scale: 1 }}
      exit={reduce ? undefined : mode === 'drawer' ? { x: '100%' } : { y: 15, scale: .98 }}
      transition={{ duration: reduce ? 0 : .25, ease: [.22, .72, .25, 1] }}
    >{children}</motion.div>
  </motion.dialog>
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return <button className="sq-close" type="button" onClick={onClose} aria-label="Close dialog" data-initial-focus><Icon name="close" size={19} /></button>
}

type SavedRowProps = {
  event: GuideEvent
  index: number
  reduced: boolean
  onOpen: EventAction
  onRemove: (event: GuideEvent, index: number) => void
}

const SavedRow = forwardRef<HTMLLIElement, SavedRowProps>(function SavedRow(
  { event, index, reduced, onOpen, onRemove },
  ref,
) {
  const present = useIsPresent()
  const delay = reduced ? 0 : Math.min(index, 4) * .032

  return (
    <motion.li
      ref={ref}
      data-event-id={event.id}
      inert={!present}
      aria-hidden={!present}
      layout={reduced ? false : 'position'}
      initial={reduced ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? { opacity: 0, transition: { duration: 0 } } : {
        opacity: 0, x: 16, transition: { duration: .14, ease: 'easeOut' },
      }}
      transition={{
        opacity: { duration: reduced ? 0 : .19, delay },
        x: { duration: reduced ? 0 : .25, delay, ease: [.18, .7, .25, 1] },
        layout: { duration: reduced ? 0 : .25, ease: [.22, .8, .32, 1] },
      }}
    >
      <button className="sq-saved-open" type="button" onClick={() => onOpen(event)}>
        <img src={event.image} alt="" />
        <span className="sq-saved-copy">
          <span className="sq-saved-date">{drawerDate.format(eventDate(event.date))}</span>
          <strong>{event.title}</strong>
          <span>{event.venue}</span>
        </span>
      </button>
      <button
        className="sq-remove"
        type="button"
        aria-label={'Remove ' + event.title + ' from saved events'}
        onClick={() => onRemove(event, index)}
      >
        <Icon name="remove" size={18} />
      </button>
    </motion.li>
  )
})

type DrawerProps = {
  open: boolean
  onClose: () => void
  events: GuideEvent[]
  onSave: EventAction
  onOpen: EventAction
}

export function SavedDrawer({ open, onClose, events, onSave, onOpen }: DrawerProps) {
  const titleId = useId()
  const reduced = usePrefersReducedMotion()
  const list = useRef<HTMLUListElement>(null)
  const focusAfterRemoval = useRef<number | null>(null)

  useLayoutEffect(() => {
    const index = focusAfterRemoval.current
    if (index === null) return
    focusAfterRemoval.current = null

    // Exiting rows remain in the DOM. Only target an event still in the saved data.
    const next = events[Math.min(index, events.length - 1)]
    const row = next && list.current?.querySelector(`[data-event-id="${CSS.escape(next.id)}"]`)
    const button = row?.querySelector<HTMLButtonElement>('.sq-remove')
      ?? list.current?.closest('dialog')?.querySelector<HTMLButtonElement>('.sq-action')
    button?.focus({ preventScroll: true })
  }, [events])

  function remove(event: GuideEvent, index: number) {
    focusAfterRemoval.current = index
    onSave(event)
  }

  return (
    <AnimatePresence>
      {open && (
        <Modal key="saved-drawer" mode="drawer" titleId={titleId} onClose={onClose}>
          <div className="sq-drawer-head">
            <h2 id={titleId}>Saved events <span>{events.length}</span></h2>
            <CloseButton onClose={onClose} />
          </div>
          <ul className="sq-saved-list" ref={list} aria-hidden={events.length === 0 || undefined}>
            <AnimatePresence mode="popLayout">
              {events.map((event, index) => (
                <SavedRow
                  key={event.id}
                  event={event}
                  index={index}
                  reduced={reduced}
                  onOpen={onOpen}
                  onRemove={remove}
                />
              ))}
            </AnimatePresence>
          </ul>
          {events.length === 0 && <EmptyState saved onReset={onClose} />}
        </Modal>
      )}
    </AnimatePresence>
  )
}

export function EventDetails({ event, onClose, saved, onSave }: { event: GuideEvent | null; onClose: () => void; saved: boolean; onSave: EventAction }) {
  const titleId = useId()
  return <AnimatePresence>{event && <Modal key={event.id} mode="details" titleId={titleId} onClose={onClose}>
    <div className="sq-detail-cover"><img src={event.image} alt="" /><CloseButton onClose={onClose} /></div>
    <div className="sq-detail-body">
      <Category event={event} />
      <h2 id={titleId}>{event.title}</h2>
      <div className="sq-detail-list">
        <div><Icon name="calendar" /><span>{fullDate.format(eventDate(event.date))}<small>{timeLabel(event.time)}</small></span></div>
        <div><Icon name="pin" /><span>{event.venue}<small>{[event.neighborhood, event.city].filter(Boolean).join(', ')}</small></span></div>
        <div><Icon name="ticket" /><span>{event.price === 0 ? 'Free admission' : priceLabel(event)}</span></div>
      </div>
      <p>{event.description}</p>
      <SaveButton withLabel event={event} saved={saved} onSave={onSave} />
    </div>
  </Modal>}</AnimatePresence>
}
