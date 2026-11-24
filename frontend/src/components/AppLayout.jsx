import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-brand-tint text-brand-strong"
      : "text-ink-soft hover:bg-surface-muted hover:text-ink"
  }`;

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-page">
      <a
        href="#main-content"
        className="sr-only-focusable fixed left-4 top-4 z-50 rounded-lg bg-ink px-4 py-3 text-white"
      >
        Skip to content
      </a>
      <header className="no-print border-b border-line bg-surface/90 backdrop-blur">
        <div className="page-shell flex min-h-18 items-center justify-between gap-4 py-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-3" aria-label="Modern Crane home">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-lg font-black text-white">
              M
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black tracking-tight text-ink">
                MODERN CRANE
              </span>
              <span className="block text-xs text-ink-faint">Design studio</span>
            </span>
          </NavLink>
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <NavLink to="/" end className={linkStyle}>
              Designs
            </NavLink>
            <NavLink
              to="/designs/new"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong"
            >
              <span aria-hidden="true">+</span>
              <span className="hidden sm:inline">New design</span>
              <span className="sm:hidden">New</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main-content" className="page-shell py-8 sm:py-11">
        <Outlet />
      </main>
      <footer className="no-print border-t border-line">
        <div className="page-shell flex flex-col gap-1 py-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>Modern Crane Co. · Preliminary design tool</span>
          <span>Concept dimensions only — not for manufacture.</span>
        </div>
      </footer>
    </div>
  );
}
