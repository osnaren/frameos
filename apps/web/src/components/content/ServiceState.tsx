export function ServiceState({ title, body }: { title: string; body: string }) {
  return (
    <section className="surface-panel mx-auto flex min-h-[50svh] max-w-3xl flex-col justify-center px-6 py-12 text-center sm:px-10">
      <p className="section-label">Temporarily unavailable</p>
      <h1 className="display-font mt-4 text-4xl leading-none text-(--ink) sm:text-6xl">{title}</h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-(--muted) sm:text-lg">{body}</p>
    </section>
  )
}
