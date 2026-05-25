export default function GameLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-6 py-10 sm:px-8 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)] lg:items-start">
        <div className="aspect-[4/3] animate-pulse rounded-lg border bg-muted" />

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-10 w-72 animate-pulse rounded bg-muted" />
              </div>

              <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="space-y-2" key={index}>
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-8 w-24 animate-pulse rounded-md bg-muted"
                key={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-8 w-44 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
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
        </div>
      </section>
    </main>
  );
}
