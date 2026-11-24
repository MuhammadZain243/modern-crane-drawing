export default function ErrorMessage({ error, className = "" }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className={`rounded-2xl border border-danger/20 bg-danger-tint p-4 text-sm text-danger ${className}`}
    >
      <p className="font-bold">{error.message || "Something went wrong."}</p>
      {error.code === "NETWORK_ERROR" && (
        <p className="mt-1 text-danger/85">Check that the backend is running, then try again.</p>
      )}
    </div>
  );
}