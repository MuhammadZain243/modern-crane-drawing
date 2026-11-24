import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../components/Button.jsx";
import DesignList from "../components/DesignList.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingState, { MoreDesignsSkeleton } from "../components/LoadingState.jsx";
import { designService } from "../services/designService.js";

export default function DesignsPage() {
  const [designs, setDesigns] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    designService
      .list()
      .then((result) => {
        if (!active) return;
        setDesigns(result.designs);
        setPagination(result.pagination);
      })
      .catch((reason) => {
        if (active) setError(reason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retry() {
    setError(null);
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  async function loadMore() {
    setLoadingMore(true);
    setError(null);
    try {
      const result = await designService.list({ limit: 20, offset: designs.length });
      setDesigns((current) => [...current, ...result.designs]);
      setPagination(result.pagination);
    } catch (reason) {
      setError(reason);
    } finally {
      setLoadingMore(false);
    }
  }

  const notice = location.state?.notice;
  return (
    <div className="space-y-8">
      {notice && (
        <p role="status" className="rounded-2xl border border-brand/20 bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-strong">
          {notice}
        </p>
      )}
      <section className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-8 text-white sm:px-10 sm:py-11">
        <div className="absolute -right-10 -top-20 size-64 rounded-full border-[36px] border-white/5" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-highlight">
              Engineering workspace
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Crane concepts,<br className="sm:hidden" /> made clear.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Create a preliminary single-girder crane drawing, review its dimensions, and keep each design close at hand.
            </p>
          </div>
          <Link
            to="/designs/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-highlight px-5 text-sm font-extrabold text-ink transition hover:bg-white"
          >
            <span aria-hidden="true">+</span> Start a design
          </Link>
        </div>
      </section>

      <section aria-labelledby="saved-designs-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="saved-designs-heading" className="text-xl font-black tracking-tight text-ink">
              Saved designs
            </h2>
            <p className="mt-1 text-sm text-ink-faint">
              {pagination ? `${pagination.total} ${pagination.total === 1 ? "design" : "designs"} in your workspace` : "Your recent crane concepts"}
            </p>
          </div>
          {pagination?.total > 0 && (
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft">
              Newest first
            </span>
          )}
        </div>
        <ErrorMessage error={error} className="mb-5" />
        {error && !designs.length && !loading && (
          <div className="mb-5">
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </div>
        )}
        {loading ? (
          <LoadingState />
        ) : designs.length ? (
          <div className="space-y-5">
            <DesignList designs={designs} />
            {pagination && designs.length < pagination.total && (
              loadingMore ? (
                <MoreDesignsSkeleton />
              ) : (
                <div className="flex justify-center">
                  <Button variant="secondary" onClick={loadMore}>
                    Load more designs
                  </Button>
                </div>
              )
            )}
          </div>
        ) : !error ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-12 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-tint text-2xl text-brand">
              ◇
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-ink">No designs yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
              Start with the crane capacity, span, and lifting height. Your first concept will appear here.
            </p>
            <Link
              to="/designs/new"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-strong"
            >
              Create your first design
            </Link>
          </div>
        ) : null}
      </section>
      <p className="text-center text-xs leading-5 text-ink-faint">
        Preliminary concepts only. Dimensions are estimates and are not for manufacture.
      </p>
    </div>
  );
}