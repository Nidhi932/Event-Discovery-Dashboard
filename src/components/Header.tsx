import { useEffect, useRef } from 'react'
import { Bookmark, Compass, Moon, Search, Sun, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'
import { Brand } from './Brand'

interface HeaderProps {
  query: string
  onQuery: (value: string) => void
  savedCount: number
  onSaved: () => void
  dark: boolean
  toggleTheme: () => void
  browse: () => void
}

export function Header({
  query,
  onQuery,
  savedCount,
  onSaved,
  dark,
  toggleTheme,
  browse,
}: HeaderProps) {
  const search = useRef<HTMLInputElement>(null)
  const reduceMotion = usePrefersReducedMotion()
  const shortcutModifier = /Mac|iPad|iPhone|iPod/i.test(navigator.platform) ? '⌘' : 'Ctrl'

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!isShortcut || document.querySelector('dialog[open]')) return

      event.preventDefault()
      search.current?.focus()
      search.current?.select()
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  return (
    <header className="masthead">
      <div className="page-width header-inner">
        <Brand />

        <nav aria-label="Main navigation" className="top-nav flex items-center">
          <a
            href="#events"
            className="discover-nav inline-flex items-center"
            onClick={event => {
              event.preventDefault()
              browse()
            }}
          >
            <Compass size={17} aria-hidden="true" />
            Discover
          </a>
          <button
            type="button"
            className="saved-nav inline-flex items-center"
            onClick={onSaved}
            aria-label={`Saved events (${savedCount})`}
          >
            <Bookmark size={17} aria-hidden="true" />
            <span>Saved</span>
            <span className="saved-count" aria-hidden="true">
              <span key={savedCount} className="count-digit">{savedCount}</span>
            </span>
          </button>
        </nav>

        <form
          role="search"
          className="search-box flex items-center"
          onSubmit={event => {
            event.preventDefault()
            browse()
          }}
        >
          <Search size={17} aria-hidden="true" />
          <input
            ref={search}
            type="search"
            aria-label="Search events"
            aria-keyshortcuts="Meta+K Control+K"
            placeholder="Search events..."
            value={query}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                onQuery('')
                search.current?.blur()
              }
            }}
            onChange={event => onQuery(event.target.value)}
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={() => {
                onQuery('')
                search.current?.focus()
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : (
            <kbd aria-hidden="true" className="[@media(pointer:coarse)]:hidden">
              {shortcutModifier} K
            </kbd>
          )}
        </form>

        <button
          type="button"
          className="theme-button center"
          onClick={toggleTheme}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={String(dark)}
              className="center"
              initial={reduceMotion ? false : { rotate: -50, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { rotate: 45, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.13 }}
              aria-hidden="true"
            >
              {dark ? <Moon size={19} /> : <Sun size={20} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  )
}
