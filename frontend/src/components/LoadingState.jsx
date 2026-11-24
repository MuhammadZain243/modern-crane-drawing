function Skeleton({ className }) {
  return <span aria-hidden="true" className={`block rounded-lg bg-surface-muted motion-safe:animate-pulse ${className}`} />;
}

function DesignCardSkeleton() {
  return (
    <li aria-hidden="true" className="card-shadow rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-11 rounded-2xl" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <Skeleton className="mt-5 h-4 w-28" />
    </li>
  );
}

export function MoreDesignsSkeleton() {
  return (
    <div role="status" aria-label="Loading more designs" aria-busy="true">
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <DesignCardSkeleton key={index} />)}
      </ul>
    </div>
  );
}

export function DimensionSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line">
      <Skeleton className="h-10 rounded-none" />
      <div className="space-y-3 bg-surface p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DrawingSkeleton() {
  return (
    <section aria-hidden="true" className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </section>
  );
}

function DesignsSkeleton() {
  return (
    <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <DesignCardSkeleton key={index} />)}
    </ul>
  );
}

function EditorSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(350px,0.82fr)_minmax(0,1.18fr)]">
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
          <Skeleton className="mb-6 h-6 w-40" />
          <div className="space-y-5">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </section>
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <Skeleton className="mb-5 h-6 w-44" />
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
            </div>
          </section>
          <section className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </section>
        </div>
      </div>
    </div>
  );
}

export default function LoadingState({ label = "Loading your designs…", variant = "designs" }) {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">{label}</span>
      {variant === "editor" ? <EditorSkeleton /> : <DesignsSkeleton />}
    </div>
  );
}
