export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-72 animate-pulse rounded bg-muted" />
        </div>

        <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="overflow-hidden rounded-lg border bg-card shadow-sm"
            key={index}
          >
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-4 p-6">
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
