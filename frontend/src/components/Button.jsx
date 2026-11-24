const styles = {
  primary:
    "bg-brand text-white hover:bg-brand-strong disabled:bg-brand/50",
  secondary:
    "border border-line bg-surface text-ink hover:border-brand/40 hover:bg-brand-tint/50 disabled:opacity-50",
  danger:
    "border border-danger/20 bg-danger-tint text-danger hover:bg-danger/10 disabled:opacity-50",
  quiet:
    "bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink disabled:opacity-50",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
