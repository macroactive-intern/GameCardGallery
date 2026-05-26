export default function NewGameLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="space-y-3">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="h-10 w-72 animate-pulse rounded bg-muted" />
      </header>

      <section className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="space-y-2" key={index}>
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="h-20 w-full animate-pulse rounded-lg border bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </section>
    </main>
  );
}
