import { useEffect, useState } from "react";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import CraneDrawing from "../components/CraneDrawing.jsx";
import DesignForm from "../components/DesignForm.jsx";
import DimensionTable from "../components/DimensionTable.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingState, { DimensionSkeleton, DrawingSkeleton } from "../components/LoadingState.jsx";
import useConfig from "../hooks/useConfig.js";
import useDebouncedPreview from "../hooks/useDebouncedPreview.js";
import { designService, emptyDesign, mapDesignToForm } from "../services/designService.js";

export default function EditorPage({ id }) {
  const navigate = useNavigate();
  const { config, error: configError } = useConfig();
  const [form, setForm] = useState(emptyDesign);
  const [initialForm, setInitialForm] = useState(emptyDesign);
  const [design, setDesign] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const dirty = Boolean(config && JSON.stringify(form) !== JSON.stringify(initialForm));
  const blocker = useBlocker(dirty && !saving && !deleting);
  const preview = useDebouncedPreview(form, config);
  const heading = id ? "Edit crane design" : "New crane design";

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    let active = true;
    if (!id) return () => {
      active = false;
    };
    designService
      .get(id)
      .then((loaded) => {
        if (!active) return;
        const values = mapDesignToForm(loaded);
        setDesign(loaded);
        setForm(values);
        setInitialForm(values);
      })
      .catch((reason) => {
        if (active) setLoadError(reason);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setFormError(null);
    setMessage("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!config) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    setMessage("");
    try {
      const saved = await designService.save(form, config, id);
      const values = mapDesignToForm(saved);
      setDesign(saved);
      setForm(values);
      setInitialForm(values);
      setMessage(id ? "Your changes are saved." : "Design created.");
      if (!id) navigate(`/designs/${saved.id}`, { replace: true });
    } catch (error) {
      setFormError(error);
      setFieldErrors(error.fields || {});
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await designService.remove(id);
      navigate("/", { state: { notice: "Design deleted." } });
    } catch (error) {
      setFormError(error);
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  if (loading) return <LoadingState label="Opening crane design…" variant="editor" />;
  if (loadError?.status === 404) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 text-center">
        <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Not found</span>
        <h1 className="mt-2 text-2xl font-black text-ink">This design is unavailable</h1>
        <p className="mt-2 text-sm text-ink-soft">It may have been deleted or the link may be incorrect.</p>
        <Link to="/" className="mt-5 inline-flex font-bold text-brand hover:text-brand-strong">
          Return to designs
        </Link>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <ErrorMessage error={loadError} />
        <Link to="/" className="text-sm font-bold text-brand">Return to designs</Link>
      </div>
    );
  }
  if (configError) return <ErrorMessage error={configError} />;
  if (!config) return <LoadingState label="Loading design requirements…" variant="editor" />;

  const dimensions = preview.invalid
    ? []
    : preview.dimensions.length
      ? preview.dimensions
      : design?.dimensions || [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="no-print text-sm font-bold text-brand hover:text-brand-strong">
            ← All designs
          </Link>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-brand">
            Preliminary crane drawing
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">{heading}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Set the requirements and review the server-calculated dimensions.
          </p>
        </div>
        <div className="no-print flex w-full flex-wrap gap-2 sm:w-auto">
          {id && (
            <Button
              variant="danger"
              onClick={() => setDeleteModalOpen(true)}
              disabled={deleting || saving}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()} type="button">
            Print
          </Button>
        </div>
      </div>

      {formError && <ErrorMessage error={formError} />}
      {message && <p role="status" className="rounded-xl bg-brand-tint px-4 py-3 text-sm font-bold text-brand-strong">{message}</p>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(350px,0.82fr)_minmax(0,1.18fr)]">
        <section className="card-shadow rounded-3xl border border-line bg-surface p-5 sm:p-7">
          <DesignForm
            values={form}
            config={config}
            errors={{ ...preview.fields, ...fieldErrors }}
            onChange={handleChange}
            onSubmit={handleSave}
          >
            <div className="border-t border-line pt-5">
              <p className="mb-4 text-xs leading-5 text-ink-faint">
                Calculated dimensions are preliminary estimates. Server validation is authoritative.
              </p>
              <Button type="submit" className="w-full" disabled={saving || deleting}>
                {saving ? "Saving design…" : id ? "Save changes" : "Save design"}
              </Button>
            </div>
          </DesignForm>
        </section>

        <div className="space-y-6">
          <section className="card-shadow rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-ink">Dimension summary</h2>
                <p className="mt-1 text-xs text-ink-faint">Updates as your inputs change</p>
              </div>
              {preview.loading && (
                <span role="status" className="text-xs font-semibold text-brand">Updating…</span>
              )}
            </div>
            {preview.error && <ErrorMessage error={preview.error} className="mb-4" />}
            {preview.loading && !dimensions.length ? (
              <DimensionSkeleton />
            ) : (
              <DimensionTable dimensions={dimensions} />
            )}
          </section>
          {preview.loading && !dimensions.length ? (
            <DrawingSkeleton />
          ) : (
            <CraneDrawing dimensions={dimensions} />
          )}
          <p className="rounded-2xl border border-accent/30 bg-warning-tint px-4 py-3 text-xs leading-5 text-warning-ink">
            The girder depth is a rule-of-thumb estimate only. No structural, load, or standards-compliance calculations are provided.
          </p>
        </div>
      </div>
      <ConfirmationModal
        open={blocker.state === "blocked"}
        title="Leave without saving?"
        description="You have unsaved changes. If you leave this page now, those changes will be discarded."
        confirmLabel="Leave page"
        onCancel={() => blocker.reset()}
        onConfirm={() => blocker.proceed()}
      />
      <ConfirmationModal
        open={deleteModalOpen}
        title="Delete this design?"
        description="This will permanently remove this saved crane design. This action cannot be undone."
        confirmLabel="Delete design"
        cancelLabel="Keep design"
        destructive
        busy={deleting}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}