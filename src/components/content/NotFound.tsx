import { Link } from '@tanstack/react-router'

/**
 * Root 404: styled like an empty frame rather than a bare router fallback.
 */
export function NotFound() {
  return (
    <section className="surface-panel mx-auto flex min-h-[50svh] max-w-2xl flex-col items-center gap-7 rounded-3xl px-6 py-14 text-center sm:px-10">
      <span
        aria-hidden="true"
        className="pocket-frame flex h-16 w-16 shrink-0 items-center justify-center border border-(--line) text-(--muted)"
      >
        <span className="display-italic text-3xl">?</span>
        <span className="frame-corners opacity-100!" />
      </span>
      <div>
        <p className="section-label">404</p>
        <h1 className="display-font mt-4 text-4xl leading-none text-(--ink) sm:text-5xl">
          This frame doesn’t exist.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-(--muted)">
          The page you’re looking for isn’t in the archive — it may have moved, or it never
          developed.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
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
      </div>
    </section>
  )
}
