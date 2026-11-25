import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { Bookmark, Check, MapPin } from 'lucide-react'
import { Brand } from './components/Brand'
import { EmptyState, EventCard, EventDetails, SavedDrawer } from './components/EventUI'
import {
  FilterBar,
  SortSelect,
  filterEvents,
  initialFilters,
  type FilterState,
  type SortOrder,
} from './components/Filters'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ScrollProgress } from './components/ScrollProgress'
import eventData from './data/events.json'
import type { GuideEvent } from './types'

const events: GuideEvent[] = eventData
const categories = Array.from(new Set(events.map(event => event.category)))
const picks = events.slice(0, 3)
const savedKey = 'sidequest.saved.v1'
const themeKey = 'sidequest.theme'

function readSaves(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(savedKey) ?? '[]')
    if (!Array.isArray(data)) return []
    return events.filter(event => data.includes(event.id)).map(event => event.id)
  } catch {
    return []
  }
}

export function App() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [sort, setSort] = useState<SortOrder>('recommended')
  const [saved, setSaved] = useState<string[]>(readSaves)
  const [drawer, setDrawer] = useState(false)
  const [detail, setDetail] = useState<GuideEvent | null>(null)
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  const [notice, setNotice] = useState('')
  const reduced = usePrefersReducedMotion()
  const gridHeading = useRef<HTMLHeadingElement>(null)

  const visible = useMemo(() => filterEvents(events, query, filters, sort), [query, filters, sort])
  const savedEvents = useMemo(() => events.filter(event => saved.includes(event.id)), [saved])
  const searchTerm = query.trim()
  const filtered = searchTerm !== '' || Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof FilterState],
  )

  useEffect(() => {
    const theme = dark ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', dark ? '#142119' : '#f8f9f6',
    )
    try {
      localStorage.setItem(themeKey, theme)
    } catch {
      // The current theme still applies when storage is unavailable.
    }
  }, [dark])

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === savedKey || event.key === null) setSaved(readSaves())
      if (event.key === themeKey || event.key === null) setDark(event.newValue === 'dark')
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2450)
    return () => window.clearTimeout(timer)
  }, [notice])

  function toggleSave(event: GuideEvent) {
    const removing = saved.includes(event.id)
    const next = removing ? saved.filter(id => id !== event.id) : [...saved, event.id]
    setSaved(next)
    try {
      localStorage.setItem(savedKey, JSON.stringify(next))
    } catch {
      // Saved events remain available for this visit.
    }
    setNotice(event.title + (removing ? ' removed from saved events' : ' saved'))
  }

  function browse() {
    gridHeading.current?.focus({ preventScroll: true })
    document.getElementById('events')?.scrollIntoView({
      behavior: reduced ? 'instant' : 'smooth',
      block: 'start',
    })
  }

  function reset() {
    setFilters(initialFilters)
    setQuery('')
    gridHeading.current?.focus({ preventScroll: true })
  }

  return (
    <div id="top">
      {!reduced && <ScrollProgress />}
      <a className="skip-link" href="#events">Skip to events</a>
      <Header
        query={query}
        onQuery={setQuery}
        savedCount={saved.length}
        onSaved={() => setDrawer(true)}
        dark={dark}
        toggleTheme={() => setDark(value => !value)}
        browse={browse}
      />
      <main className="page-width main-content">
        <Hero picks={picks} browse={browse} onOpen={setDetail} />
        <section id="events" aria-labelledby="events-heading" className="events-section">
          <div className="section-heading flex items-center justify-between gap-3">
            <div className="heading-group flex items-center">
              <h2 ref={gridHeading} tabIndex={-1} id="events-heading">Discover events</h2>
              <span className="result-count" aria-live="polite" aria-atomic="true">
                <span key={visible.length} className="count-digit">{visible.length}</span>
                <span className="sr-only">{visible.length === 1 ? ' event found' : ' events found'}</span>
              </span>
            </div>
            <SortSelect value={sort} onChange={setSort} />
          </div>
          <FilterBar categories={categories} filters={filters} onChange={setFilters} />
          {filtered && visible.length > 0 && (
            <div className="filter-summary flex items-center justify-between">
              <span>
                Showing {visible.length} of {events.length} events
                {searchTerm && ` for “${searchTerm}”`}
              </span>
              <button type="button" onClick={reset}>Clear all</button>
            </div>
          )}
          <div className="event-grid">
            <AnimatePresence mode="popLayout">
              {visible.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  saved={saved.includes(event.id)}
                  index={index}
                  onSave={toggleSave}
                  onOpen={setDetail}
                />
              ))}
            </AnimatePresence>
            {visible.length === 0 && <EmptyState onReset={reset} />}
          </div>
        </section>
      </main>
      <footer>
        <div className="page-width footer-inner flex items-center justify-between gap-4">
          <Brand compact />
          <span className="inline-flex items-center gap-2">
            <MapPin size={14} /> New York City
          </span>
        </div>
      </footer>
      <SavedDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        events={savedEvents}
        onSave={toggleSave}
        onOpen={setDetail}
      />
      <EventDetails
        event={detail}
        saved={!!detail && saved.includes(detail.id)}
        onSave={toggleSave}
        onClose={() => setDetail(null)}
      />
      <div role="status" aria-live="polite" className="sr-only">{notice}</div>
      <AnimatePresence>
        {notice && !detail && !drawer && (
          <motion.div
            className="toast flex items-center gap-2"
            key={notice}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 8 }}
            aria-hidden="true"
          >
            {notice.endsWith(' saved') ? <Check size={16} /> : <Bookmark size={16} />}
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
