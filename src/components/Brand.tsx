import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../usePrefersReducedMotion'

export function Brand({ compact = false }: { compact?: boolean }) {
  const reduceMotion = usePrefersReducedMotion()

  return (
    <a
      href="#top"
      className={`brand inline-flex items-center${compact ? ' brand-small' : ''}`}
      aria-label="Sidequest home"
    >
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 46 42"
        className="brand-mark"
        initial={reduceMotion ? false : { rotate: -12, scale: 0.82 }}
        animate={{ rotate: 0, scale: 1 }}
        whileHover={reduceMotion ? undefined : { rotate: -9 }}
        transition={{ type: 'spring', stiffness: 230, damping: 15 }}
      >
        <g transform="rotate(10 23 21)">
          <path
            d="M7 9h32v7a4 4 0 0 0 0 8v7H7v-7a4 4 0 0 0 0-8Z"
            fill="#70c793"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        </g>
        <g transform="rotate(-20 23 21)">
          <path
            d="M4.5 10h35v7a4 4 0 0 0 0 8v7h-35v-7a4 4 0 0 0 0-8Z"
            fill="#acfac7"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="m19 14.3 1.9 4.2 4.7.6-3.4 3.3.8 4.5-4-2.2-4.2 2.2.8-4.5-3.3-3.3 4.6-.6Z"
            fill="#143c2c"
          />
          <path
            d="M31.3 11v20"
            stroke="#19472f"
            strokeWidth="1.4"
            strokeDasharray="2.8 2.8"
          />
        </g>
      </motion.svg>
      <span>
        sidequest<span className="brand-period">.</span>
      </span>
    </a>
  )
}
