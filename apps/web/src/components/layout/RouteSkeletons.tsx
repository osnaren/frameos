/**
 * Pending states shown while a route's data loads on client navigation
 * (only after the router's pendingMs, so fast navigations never flash).
 * Each mirrors its page's real layout — same shell, same rhythm — so the
 * page settles into place instead of jumping. Blocks are ivory "unexposed
 * frames" with a slow light-leak sweep; reduced motion keeps them still.
 */
import type { CSSProperties, ReactNode } from 'react'

function SkeletonShell({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <main className={className} aria-busy="true">
      <p className="sr-only" role="status">
        Loading {label}…
      </p>
      <div aria-hidden="true">{children}</div>
    </main>
  )
}

function Bar({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={`skeleton-block ${className ?? ''}`} style={style} />
}

/** Width/height ratios for a believable mixed contact sheet (portrait-heavy, like the archive). */
const FILTER_PILLS = [4.5, 7, 10, 9, 9, 8].map((width, slot) => ({ id: `pill-${slot}`, width }))

const RING_FRAMES = [0.62, 0.82, 1, 0.82, 0.62].map((scale, slot) => ({
  id: `ring-${slot}`,
  scale,
}))

const SHEET_RATIOS = [
  1.78, 0.56, 0.56, 0.75, 0.56, 0.56, 0.75, 0.56, 0.56, 0.56, 0.56, 1, 0.56, 0.56,
]

/* Placeholders never reorder, but each still gets a stable key of its own. */
const SHEET_FRAMES = SHEET_RATIOS.map((ratio, slot) => ({ id: `sheet-${slot}`, ratio }))

export function ArchiveSkeleton() {
  return (
    <SkeletonShell label="the Index" className="relative px-4 pt-10 pb-16">
      <div className="page-shell">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-(--line) pb-6">
          <div className="grid gap-4">
            <Bar className="skeleton-label w-44" />
            <Bar className="skeleton-title w-[min(30rem,80vw)]" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {FILTER_PILLS.map((pill) => (
            <Bar key={pill.id} className="skeleton-pill" style={{ width: `${pill.width}rem` }} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {SHEET_FRAMES.map(({ id, ratio }) => (
            <span
              key={id}
              className="skeleton-block skeleton-frame grow"
              style={{
                flexBasis: `${Math.round(ratio * 200)}px`,
                flexGrow: Math.round(ratio * 100),
                aspectRatio: String(ratio),
              }}
            />
          ))}
        </div>
      </div>
    </SkeletonShell>
  )
}

export function PhotoSkeleton() {
  return (
    <SkeletonShell label="the photograph" className="relative px-4 pt-6 pb-16">
      <div className="page-shell">
        <div className="flex items-center justify-between gap-4">
          <Bar className="skeleton-label w-36" />
          <Bar className="skeleton-label w-24" />
        </div>
        <div className="mt-6 grid justify-items-center">
          <span className="skeleton-block skeleton-frame skeleton-photo" />
          <Bar className="skeleton-title mt-8 w-[min(26rem,80vw)]" />
          <Bar className="skeleton-line mt-4 w-[min(20rem,70vw)]" />
          <Bar className="skeleton-label mt-6 w-[min(18rem,60vw)]" />
        </div>
      </div>
    </SkeletonShell>
  )
}

export function WorldSkeleton() {
  return (
    <SkeletonShell label="the world" className="relative overflow-clip">
      <div className="page-shell grid justify-items-center px-4 pt-12 pb-8 sm:pt-18 sm:pb-10">
        <Bar className="skeleton-label w-52" />
        <Bar className="skeleton-display mt-6 w-[min(24rem,70vw)]" />
        <Bar className="skeleton-line mt-6 w-[min(22rem,70vw)]" />
        <Bar className="skeleton-line mt-3 w-[min(30rem,80vw)]" />
      </div>
      <div className="page-shell skeleton-ring">
        {RING_FRAMES.map(({ id, scale }) => (
          <span
            key={id}
            className="skeleton-block skeleton-frame"
            style={{ '--ring-scale': scale } as CSSProperties}
          />
        ))}
      </div>
    </SkeletonShell>
  )
}

export function NotesSkeleton() {
  return (
    <SkeletonShell label="Field Notes" className="field-notes-page">
      <div className="page-shell field-notes-hero">
        <div className="grid gap-5">
          <Bar className="skeleton-label w-56" />
          <Bar className="skeleton-display w-[min(40rem,85vw)]" />
          <Bar className="skeleton-display w-[min(30rem,70vw)]" />
        </div>
        <div className="grid gap-3 self-end">
          <Bar className="skeleton-line w-full" />
          <Bar className="skeleton-line w-11/12" />
          <Bar className="skeleton-line w-2/3" />
        </div>
      </div>
      <div className="field-notes-lead">
        <span className="skeleton-block skeleton-lead" />
      </div>
    </SkeletonShell>
  )
}

export function SignalSkeleton() {
  return (
    <SkeletonShell label="Signal" className="signal-page skeleton-dark">
      <div className="page-shell signal-layout">
        <div className="signal-heading grid gap-5">
          <Bar className="skeleton-label w-60" />
          <Bar className="skeleton-display w-[min(34rem,80vw)]" />
          <Bar className="skeleton-display w-[min(24rem,60vw)]" />
        </div>
        <div className="signal-transmission grid gap-4">
          <Bar className="skeleton-label w-full" />
          <Bar className="skeleton-line w-11/12" />
          <Bar className="skeleton-line w-3/4" />
          <Bar className="skeleton-title mt-6 w-4/5" />
        </div>
      </div>
    </SkeletonShell>
  )
}

/** Fallback for any route without a bespoke skeleton. */
export function PageSkeleton() {
  return (
    <SkeletonShell label="the page" className="relative px-4 pt-12 pb-16">
      <div className="page-shell grid gap-5">
        <Bar className="skeleton-label w-40" />
        <Bar className="skeleton-title w-[min(28rem,80vw)]" />
        <Bar className="skeleton-line w-[min(36rem,90vw)]" />
        <Bar className="skeleton-line w-[min(30rem,80vw)]" />
      </div>
    </SkeletonShell>
  )
}
