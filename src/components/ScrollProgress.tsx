import { motion, useScroll } from 'framer-motion'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll({ trackContentSize: true })

  return (
    <motion.div
      aria-hidden="true"
      className="scroll-progress"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
