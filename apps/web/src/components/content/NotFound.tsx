import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'

import { contactSheet, revealVariants, useHydratedReducedMotion } from '@/lib/motion'

/**
 * Root 404: styled like an empty frame rather than a bare router fallback —
 * a darkroom safelight glow behind an unexposed frame, since the copy
 * already leans on "it never developed."
 */
export function NotFound() {
  const reducedMotion = useHydratedReducedMotion()

  return (
    <section className="relative mx-auto flex min-h-[60svh] max-w-2xl items-center justify-center overflow-clip px-6 py-14 sm:px-10">
      <span aria-hidden="true" className="not-found-safelight" />
      <motion.div
        className="surface-panel relative flex flex-col items-center gap-7 rounded-3xl px-6 py-14 text-center sm:px-10"
        initial="hidden"
        animate="visible"
        variants={contactSheet}
      >
        <motion.span
          aria-hidden="true"
          className="pocket-frame not-found-frame flex h-16 w-16 shrink-0 items-center justify-center border border-(--line) text-(--muted)"
          variants={revealVariants(reducedMotion)}
        >
          <span className="display-italic text-3xl">?</span>
          <span className="frame-corners opacity-100!" />
        </motion.span>
        <div>
          <motion.p className="section-label" variants={revealVariants(reducedMotion)}>
            404
          </motion.p>
          <motion.h1
            className="display-font mt-4 text-4xl leading-none text-(--ink) sm:text-5xl"
            variants={revealVariants(reducedMotion)}
          >
            This frame doesn’t exist.
          </motion.h1>
          <motion.p
            className="mx-auto mt-5 max-w-md text-base leading-7 text-(--muted)"
            variants={revealVariants(reducedMotion)}
          >
            The page you’re looking for isn’t in the archive — it may have moved, or it never
            developed.
          </motion.p>
        </div>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          variants={revealVariants(reducedMotion)}
        >
          <Link
            to="/"
            hash="worlds"
            className="rounded-full bg-(--ink) px-6 py-3.5 text-sm font-semibold text-(--bg) no-underline"
          >
            Back to the worlds
          </Link>
          <Link
            to="/archive"
            className="rounded-full border border-(--line) bg-(--panel) px-6 py-3.5 text-sm font-semibold text-(--ink) no-underline"
          >
            Open the Index
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
