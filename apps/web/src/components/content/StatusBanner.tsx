export function StatusBanner({ title, children }: { title: string; children: string }) {
  return (
    <div className="rounded-full border border-[rgba(173,120,64,0.18)] bg-[rgba(173,120,64,0.08)] px-4 py-2 text-sm text-(--muted-strong)">
      <span className="font-semibold text-(--ink)">{title}</span> {children}
    </div>
  )
}
