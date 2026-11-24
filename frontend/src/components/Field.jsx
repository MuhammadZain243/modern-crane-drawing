export default function Field({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  unit,
  ...props
}) {
  const errorId = `${name}-error`;
  return (
    <label className="block min-w-0" htmlFor={name}>
      <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-bold text-ink">
        <span>{label}</span>
        {unit && <span className="text-xs font-medium text-ink-faint">{unit}</span>}
      </span>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-12 w-full rounded-xl border bg-surface px-3.5 text-base text-ink shadow-sm transition placeholder:text-ink-faint/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 ${
          error ? "border-danger" : "border-line"
        }`}
        {...props}
      />
      {error ? (
        <span id={errorId} className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      )}
    </label>
  );
}
