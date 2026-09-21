import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

// The details each path asks for up front, in order. They head the report: a reseller
// or integrator is shown as who prepared it, and a customer as who sent it, for the
// company that owns the room.
const FIELDS = {
  customer: [
    { key: "contactName", label: "Your name", placeholder: "e.g. Priya Sharma", error: "Add your name, so everyone knows who sent this.", autoComplete: "name" },
    { key: "customerName", label: "Company name", placeholder: "e.g. Acme Corporation", error: "Add your company's name.", autoComplete: "organization" },
    { key: "roomName", label: "Room name", placeholder: "e.g. Executive Boardroom", error: "Add a name for this room." },
  ],
  reseller: [
    { key: "resellerName", label: "Reseller / integrator name", placeholder: "e.g. Your company", error: "Add who's preparing this plan." },
    { key: "customerName", label: "Company name", placeholder: "e.g. Acme Corporation (your client)", error: "Add the company this room is for." },
    { key: "roomName", label: "Room name", placeholder: "e.g. Executive Boardroom", error: "Add a name for this room." },
  ],
};

export const detailsValid = (audience, details) => FIELDS[audience].every((f) => details[f.key].trim());

function TextField({ id, label, value, onChange, onBlur, placeholder, error, inputRef, autoComplete = "off" }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-white/60">
        {label} <span className="text-[color:var(--rc-accent)]">*</span>
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-10 w-full rounded-lg border bg-white/[0.03] px-3 text-sm text-white/85 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-white/35 focus:ring-2 ${
          error ? "border-red-400/50 focus:border-red-400/60 focus:ring-red-500/20" : "border-white/[0.08] focus:border-blue-400/60 focus:ring-blue-500/20"
        }`}
      />
      {error && (
        <span id={`${id}-error`} className="text-xs font-medium text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}

// The first step's form. The values live in the page (so they survive moving around the
// steps); this only tracks which fields have been visited, so errors appear after
// leaving a field rather than while someone is still typing. Each time the page reports
// an attempt to move on (or export) with something missing, every error shows and the
// first missing field takes focus.
export function DetailsForm({ audience, details, onChange, onSubmit, attempt }) {
  const fields = FIELDS[audience];
  const [touched, setTouched] = useState({});
  const refs = useRef({});
  const missing = fields.filter((f) => !details[f.key].trim()).map((f) => f.key);
  const latest = useRef({ fields, missing });
  latest.current = { fields, missing };

  useEffect(() => {
    if (!attempt) return;
    setTouched(Object.fromEntries(latest.current.fields.map((f) => [f.key, true])));
    refs.current[latest.current.missing[0]]?.focus();
  }, [attempt]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
      className="flex flex-col gap-2.5"
    >
      {fields.map((f) => (
        <TextField
          key={f.key}
          id={`rc-details-${f.key}`}
          label={f.label}
          value={details[f.key]}
          onChange={(value) => onChange({ ...details, [f.key]: value })}
          onBlur={() => setTouched((t) => ({ ...t, [f.key]: true }))}
          placeholder={f.placeholder}
          error={touched[f.key] && missing.includes(f.key) ? f.error : null}
          inputRef={(el) => { refs.current[f.key] = el; }}
          autoComplete={f.autoComplete}
        />
      ))}
      {/* Lets Enter in any field move on, like the footer button. */}
      <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1} />
      <p className="flex items-start gap-1.5 text-xs leading-snug text-emerald-200">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-300" />
        Nothing you enter is sent anywhere. Your draft stays in this browser, and the PDF is built here too.
      </p>
    </form>
  );
}
