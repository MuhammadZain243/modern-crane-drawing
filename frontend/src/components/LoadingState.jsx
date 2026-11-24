export default function LoadingState({ label = "Loading your designs…" }) {
  return (
    <div
      role="status"
      className="flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-line bg-surface text-sm font-medium text-ink-soft"
    >
      <span className="size-5 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
      {label}
    </div>
  );
}
