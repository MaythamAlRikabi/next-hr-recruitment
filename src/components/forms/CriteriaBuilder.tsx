"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FIELDS, LEVELS, type Criterion } from "@/lib/eligibility";
import { inputCls } from "@/components/ui/styles";
import type { Locale } from "@/lib/i18n";
import type { fit } from "@/content/fit";

type L = (typeof fit)["en"];
type Row = { kind: "education" | "experience"; field: string; level: string; years: string; required: boolean };
const MAX = 8;

/** Employer-side builder. Serialises to a hidden `criteria` input (validated again on the server and in the database). */
const toRow = (c: Criterion): Row =>
  c.kind === "education"
    ? { kind: "education", field: c.field ?? "", level: c.level ?? "", years: "", required: c.required !== false }
    : { kind: "experience", field: c.field, level: "", years: c.min_years ? String(c.min_years) : "", required: c.required !== false };

export function CriteriaBuilder({ locale, L, initial = [] }: { locale: Locale; L: L; initial?: Criterion[] }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map(toRow));
  const set = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const json: Criterion[] = rows.flatMap((r): Criterion[] => {
    if (r.kind === "education") {
      if (!r.field && !r.level) return [];
      return [{ kind: "education", ...(r.field ? { field: r.field } : {}), ...(r.level ? { level: r.level } : {}), required: r.required }];
    }
    if (!r.field) return [];
    const y = Number(r.years);
    return [{ kind: "experience", field: r.field, ...(y > 0 ? { min_years: Math.round(y * 2) / 2 } : {}), required: r.required }];
  });

  return (
    <fieldset className="space-y-3 rounded-xl border border-line p-4">
      <legend className="px-1 text-sm font-bold text-midnight">{L.critTitle}</legend>
      <p className="text-xs text-muted">{L.critHint}</p>
      <input type="hidden" name="criteria" value={JSON.stringify(json)} />
      {rows.map((r, i) => (
        <div key={i} className="grid gap-3 rounded-xl bg-brand-soft/60 p-3 sm:grid-cols-[9rem_1fr_1fr_auto]">
          <select aria-label={L.critTitle} value={r.kind} onChange={(e) => set(i, { kind: e.target.value as Row["kind"], level: "", years: "" })} className={inputCls}>
            <option value="education">{L.kindEdu}</option>
            <option value="experience">{L.kindExp}</option>
          </select>
          <select aria-label={r.kind === "education" ? L.field : L.workField} value={r.field} onChange={(e) => set(i, { field: e.target.value })} className={inputCls}>
            <option value="">{r.kind === "education" ? L.any : L.choose}</option>
            {FIELDS.map((f) => <option key={f.slug} value={f.slug}>{f[locale]}</option>)}
          </select>
          {r.kind === "education" ? (
            <select aria-label={L.minLevel} value={r.level} onChange={(e) => set(i, { level: e.target.value })} className={inputCls}>
              <option value="">{L.minLevel}: {L.any}</option>
              {LEVELS.map((l) => <option key={l.slug} value={l.slug}>{l[locale]}</option>)}
            </select>
          ) : (
            <input aria-label={L.minYears} type="number" inputMode="decimal" min={0} max={40} step={0.5} dir="ltr" placeholder={L.minYears} value={r.years} onChange={(e) => set(i, { years: e.target.value })} className={inputCls} />
          )}
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <label className="flex items-center gap-1.5 text-sm font-medium">
              <input type="checkbox" checked={r.required} onChange={(e) => set(i, { required: e.target.checked })} className="size-4 accent-brand" />{L.isRequired}
            </label>
            <button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger">
              <Trash2 className="size-4" aria-hidden /><span className="sr-only">{L.removeRule}</span>
            </button>
          </div>
        </div>
      ))}
      {rows.length < MAX ? (
        <button
          type="button"
          onClick={() => setRows((x) => [...x, { kind: "education", field: "", level: "", years: "", required: true }])}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-bold text-brand hover:border-brand"
        >
          <Plus className="size-4" aria-hidden />{L.addRule}
        </button>
      ) : null}
    </fieldset>
  );
}
