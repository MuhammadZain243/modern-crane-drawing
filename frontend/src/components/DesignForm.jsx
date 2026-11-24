import Field from "./Field.jsx";

const fields = [
  { name: "capacityT", label: "Capacity", unit: "tonnes", step: "any" },
  { name: "spanM", label: "Crane span", unit: "metres", step: "any" },
  { name: "liftHeightM", label: "Lifting height", unit: "metres", step: "any" },
  { name: "endClearanceLeftMm", label: "Left end clearance", unit: "mm", step: "1" },
  { name: "endClearanceRightMm", label: "Right end clearance", unit: "mm", step: "1" },
];

export default function DesignForm({ values, config, errors = {}, onChange, onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Field
        label="Design name"
        name="name"
        value={values.name}
        onChange={onChange}
        error={errors.name}
        hint={`${values.name.length}/${config.ranges.name.maxLength} characters`}
        maxLength={config.ranges.name.maxLength}
        autoComplete="off"
        required
      />
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-extrabold text-ink">Crane requirements</h2>
          <p className="mt-1 text-xs leading-5 text-ink-faint">
            Input limits are initial assumptions. Confirm values with an engineer.
          </p>
        </div>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {fields.map((field) => {
            const range = config.ranges[field.name];
            return (
              <Field
                key={field.name}
                {...field}
                type="number"
                min={range.min}
                max={range.max}
                step={field.step}
                value={values[field.name]}
                onChange={onChange}
                error={errors[field.name]}
                hint={`Allowed: ${range.min}–${range.max}`}
              />
            );
          })}
          <label className="block min-w-0" htmlFor="dutyGroup">
            <span className="mb-1.5 block text-sm font-bold text-ink">Duty group</span>
            <select
              id="dutyGroup"
              name="dutyGroup"
              value={values.dutyGroup}
              onChange={onChange}
              aria-invalid={Boolean(errors.dutyGroup)}
              className={`min-h-12 w-full rounded-xl border bg-surface px-3.5 text-base text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 ${
                errors.dutyGroup ? "border-danger" : "border-line"
              }`}
            >
              {config.dutyGroups.map((group) => (
                <option key={group} value={group}>FEM {group}</option>
              ))}
            </select>
            {errors.dutyGroup && (
              <span className="mt-1 block text-xs font-medium text-danger">
                {errors.dutyGroup}
              </span>
            )}
          </label>
        </div>
      </div>
      {children}
    </form>
  );
}