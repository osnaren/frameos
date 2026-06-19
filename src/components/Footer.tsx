export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--line)] px-4 py-10 text-[var(--muted)]">
      <div className="page-shell grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="section-label">FrameOS</p>
          <h2 className="display-font mt-3 text-3xl text-[var(--ink)] sm:text-4xl">
            Built for a photography archive that can keep changing shape without losing its footing.
          </h2>
        </div>
        <div className="space-y-2 text-sm leading-7 lg:justify-self-end lg:text-right">
          <p className="m-0">
            Cloudinary for photo operations, Sanity for editorial content, TanStack Start for
            runtime delivery.
          </p>
          <p className="m-0">&copy; {year} FrameOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
