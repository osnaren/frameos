import { Link } from '@tanstack/react-router'

/**
 * Full-page "something went wrong" state. Always offers a way forward: a
 * retry when the caller can re-run the page, and the Index regardless.
 */
export function ServiceState({
  title,
  body,
  onRetry,
  debug,
}: {
  title: string
  body: string
  onRetry?: () => void
  /** Raw error text, shown only in development builds. */
  debug?: string
}) {
  return (
    <section
      role="alert"
      className="surface-panel mx-auto flex min-h-[50svh] max-w-3xl flex-col items-center justify-center rounded-3xl px-6 py-12 text-center sm:px-10"
    >
      <p className="section-label">Temporarily unavailable</p>
      <h1 className="display-font mt-4 text-4xl leading-none text-balance text-(--ink) sm:text-6xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-(--muted) sm:text-lg">{body}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 cursor-pointer rounded-full bg-(--ink) px-6 py-3 text-sm font-semibold text-(--bg)"
          >
            Try again
          </button>
        ) : null}
        <Link
          to="/archive"
          className="inline-flex min-h-11 items-center rounded-full border border-(--line) bg-(--panel) px-6 py-3 text-sm font-semibold text-(--ink) no-underline"
        >
          Open the Index
        </Link>
      </div>
      {debug ? (
        <pre className="mt-8 max-w-full overflow-auto rounded-lg bg-black/5 px-4 py-3 text-left font-mono text-xs text-(--muted)">
          {debug}
        </pre>
      ) : null}
    </section>
  )
}
