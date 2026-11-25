import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowDownWideNarrow, CalendarDays, Check, ChevronDown, LayoutGrid, Tag } from 'lucide-react'
import type { GuideEvent } from '../types'
import '../filters.css'

type PriceRange = 'any' | 'under25' | '25to50' | '50plus'
export type SortOrder = 'recommended' | 'soonest' | 'price'
export type FilterState = {
  category: string
  date: string
  price: PriceRange
  freeOnly: boolean
}

export const initialFilters: FilterState = { category: '', date: 'any', price: 'any', freeOnly: false }

type Choice = { value: string; label: string; description?: string }

const dateChoices: Choice[] = [
  { value: 'any', label: 'Any date' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'month', label: 'Next 30 days' },
]

const priceChoices: Choice[] = [
  { value: 'any', label: 'Any price' },
  { value: 'under25', label: 'Under $25' },
  { value: '25to50', label: '$25–$50', description: 'From $25 up to $49.99' },
  { value: '50plus', label: '$50+' },
]

const dayMilliseconds = 86400000

function calendarDay(value: string) {
  return Date.parse(value.slice(0, 10) + 'T00:00:00Z') / dayMilliseconds
}

function eventMinutes(time: string) {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i.exec(time.trim())
  if (!match) return 0
  const [, hour, minute, meridiem] = match
  const hours = meridiem ? Number(hour) % 12 + (meridiem.toUpperCase() === 'PM' ? 12 : 0) : Number(hour)
  return hours * 60 + Number(minute || 0)
}

function chronological(a: GuideEvent, b: GuideEvent) {
  return a.date.localeCompare(b.date) || eventMinutes(a.time) - eventMinutes(b.time)
}

function matchesPrice(price: number, range: PriceRange) {
  switch (range) {
    case 'under25': return price < 25
    case '25to50': return price >= 25 && price < 50
    case '50plus': return price >= 50
    default: return true
  }
}

function matchesDate(date: string, choice: string, today: number, weekday: number) {
  if (choice === 'any') return true
  const delta = calendarDay(date) - today
  if (choice === 'week') return delta >= 0 && delta < 7
  if (choice === 'month') return delta >= 0 && delta < 30
  if (choice === 'weekend') {
    const daysUntilSaturday = (6 - weekday + 7) % 7
    return weekday === 0 ? delta === 0 : delta >= daysUntilSaturday && delta <= daysUntilSaturday + 1
  }
  return date.slice(0, 10) === choice
}

function searchText(text: string) {
  return text.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function filterEvents(events: GuideEvent[], query: string, filters: FilterState, sort: SortOrder, now = new Date()) {
  // Event dates have no time component. Compare calendar days across daylight-saving boundaries.
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / dayMilliseconds
  const words = searchText(query).split(/\s+/).filter(Boolean)
  const matches = events.filter(event => {
    if (filters.category && event.category !== filters.category) return false
    if (filters.freeOnly && event.price !== 0) return false
    if (!matchesPrice(event.price, filters.price) || !matchesDate(event.date, filters.date, today, now.getDay())) return false
    const searchable = searchText([event.title, event.venue, event.neighborhood, event.city, event.category, event.tag, event.description].join(' '))
    return words.every(word => searchable.includes(word))
  })
  if (sort === 'soonest') return matches.sort(chronological)
  if (sort === 'price') return matches.sort((a, b) => a.price - b.price || chronological(a, b))
  return matches
}

type ChoiceFilterProps = {
  label: string
  icon: ReactNode
  value: string
  choices: Choice[]
  active: boolean
  display: string
  onChange: (value: string) => void
  extra?: (close: () => void, open: boolean) => ReactNode
}

function ChoiceFilter({ label, icon, value, choices, active, display, onChange, extra }: ChoiceFilterProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const focusOnOpen = useRef(false)

  function focusChoice() {
    const selected = popover.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    const first = popover.current?.querySelector<HTMLButtonElement>('[data-filter-option]')
    const target = selected || first
    target?.focus()
  }

  useLayoutEffect(() => {
    if (open && focusOnOpen.current) focusChoice()
    focusOnOpen.current = false
  }, [open])

  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  function close() {
    trigger.current?.focus({ preventScroll: true })
    setOpen(false)
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      close()
      return
    }
    if (!(event.target instanceof HTMLButtonElement)) return
    if (event.target === trigger.current && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      if (open) focusChoice()
      else {
        focusOnOpen.current = true
        setOpen(true)
      }
      return
    }
    if (!open) return
    const options = Array.from(popover.current?.querySelectorAll<HTMLButtonElement>('[data-filter-option]') || [])
    const current = options.indexOf(event.target)
    if (current === -1) return
    let next: number
    switch (event.key) {
      case 'ArrowDown': next = (current + 1) % options.length; break
      case 'ArrowUp': next = (current + options.length - 1) % options.length; break
      case 'Home': next = 0; break
      case 'End': next = options.length - 1; break
      default: return
    }
    event.preventDefault()
    options[next]?.focus()
  }

  return (
    <div className="sq-filter-segment" ref={root} onKeyDown={navigate} onBlur={event => {
      if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <button type="button" ref={trigger} className="sq-filter-trigger" data-active={active} aria-expanded={open}
        aria-controls={id} aria-label={active ? label + ': ' + display : label}
        onClick={() => setOpen(current => !current)}>
        {icon}
        <span key={display} className={active ? 'sq-filter-value' : undefined}>{display}</span>
        <ChevronDown size={15} className="sq-filter-chevron" aria-hidden="true" />
      </button>
      <div ref={popover} className="sq-filter-popover" role="group" id={id} aria-label={label + ' options'}
        data-open={open} inert={!open}>
        {choices.map(option => (
          <button type="button" key={option.value} data-filter-option aria-pressed={value === option.value}
            className="sq-filter-option" onClick={() => { onChange(option.value); close() }}>
            <span>{option.label}{option.description && <small>{option.description}</small>}</span>
            <Check size={16} className="sq-filter-check" aria-hidden="true" />
          </button>
        ))}
        {extra?.(close, open)}
      </div>
    </div>
  )
}

function ExactDate({ selected, open, onChoose }: { selected: string; open: boolean; onChoose: (value: string) => void }) {
  const [draft, setDraft] = useState(selected)
  const fieldId = useId()
  useLayoutEffect(() => {
    if (open) setDraft(selected)
  }, [open, selected])
  return (
    <form className="sq-exact-date" onSubmit={event => { event.preventDefault(); if (draft) onChoose(draft) }}>
      <label htmlFor={fieldId}>Choose a date</label>
      <div>
        <input type="date" id={fieldId} value={draft} required onChange={event => setDraft(event.target.value)} />
        <button type="submit" disabled={!draft}>Apply</button>
      </div>
    </form>
  )
}

export function FilterBar({ categories, filters, onChange }: {
  categories: string[]; filters: FilterState; onChange: (filters: FilterState) => void
}) {
  const categoryChoices = [{ value: '', label: 'All categories' }, ...categories.map(name => ({ value: name, label: name }))]
  const dateChoice = dateChoices.find(choice => choice.value === filters.date)
  const exactDate = dateChoice ? '' : filters.date
  const dateLabel = dateChoice?.label || new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(calendarDay(exactDate) * dayMilliseconds))
  const priceLabel = priceChoices.find(choice => choice.value === filters.price)?.label || 'Price'

  function changePrice(value: string) {
    const price = value as PriceRange
    onChange({ ...filters, price, freeOnly: filters.freeOnly && matchesPrice(0, price) })
  }

  function changeFree() {
    const nextFree = !filters.freeOnly
    onChange({ ...filters, freeOnly: nextFree, price: nextFree && !matchesPrice(0, filters.price) ? 'any' : filters.price })
  }

  return (
    <div className="sq-filter-bar" role="group" aria-label="Filter events">
      <ChoiceFilter label="Category" display={filters.category || 'Category'} value={filters.category} choices={categoryChoices}
        active={Boolean(filters.category)} icon={<LayoutGrid size={17} aria-hidden="true" />}
        onChange={category => onChange({ ...filters, category })} />
      <ChoiceFilter label="Date" display={filters.date === 'any' ? 'Date' : dateLabel} value={filters.date} choices={dateChoices}
        active={filters.date !== 'any'} icon={<CalendarDays size={17} aria-hidden="true" />}
        onChange={date => onChange({ ...filters, date })}
        extra={(close, open) => <ExactDate selected={exactDate} open={open} onChoose={date => { onChange({ ...filters, date }); close() }} />} />
      <ChoiceFilter label="Price" display={filters.price === 'any' ? 'Price' : priceLabel} value={filters.price} choices={priceChoices}
        active={filters.price !== 'any'} icon={<Tag size={17} aria-hidden="true" />} onChange={changePrice} />
      <button className="sq-free-toggle" type="button" role="switch" aria-checked={filters.freeOnly} onClick={changeFree}>
        <span className="sq-switch-track" aria-hidden="true"><span /></span>Free only
      </button>
    </div>
  )
}

export function SortSelect({ value, onChange }: { value: SortOrder; onChange: (value: SortOrder) => void }) {
  return (
    <label className="sq-sort">
      <ArrowDownWideNarrow size={16} aria-hidden="true" />
      <select aria-label="Sort events" value={value} onChange={event => onChange(event.target.value as SortOrder)}>
        <option value="recommended">Recommended</option>
        <option value="soonest">Soonest first</option>
        <option value="price">Price: low to high</option>
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
  )
}
