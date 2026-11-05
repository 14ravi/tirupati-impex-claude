"use client";

import { useState } from "react";
import { PanelForm } from "@/components/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import type { Param, ParamValue } from "@/lib/workflows";

const FIELD = "w-full rounded-md border border-line bg-surface px-3 text-sm text-fg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none";

/** Renders a task's settings from their definitions and saves them. */
export function ParamForm({
  params,
  values,
  save,
  onCancel,
}: {
  params: Param[];
  values: Record<string, ParamValue>;
  save: (values: Record<string, ParamValue>) => Promise<void>;
  onCancel: () => void;
}) {
  // Numbers are kept as typed text until saving, so a field can be cleared while editing.
  const [draft, setDraft] = useState<Record<string, ParamValue>>(() =>
    Object.fromEntries(params.map((p) => [p.key, p.type === "number" ? String(values[p.key] ?? "") : values[p.key]])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: ParamValue) => setDraft((d) => ({ ...d, [key]: value }));

  async function submit() {
    const out: Record<string, ParamValue> = {};
    for (const p of params) {
      const value = draft[p.key];
      if (p.type === "number") {
        if (String(value).trim() === "") return setError(`Enter a number for ${p.label}.`);
        out[p.key] = Number(value);
      } else {
        out[p.key] = value;
      }
    }
    setSaving(true);
    setError(null);
    try {
      await save(out);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
      setSaving(false);
    }
  }

  if (params.length === 0) {
    return <p className="px-5 py-5 text-sm text-muted">This step has no settings yet.</p>;
  }

  return (
    <PanelForm
      onSubmit={submit}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      {params.map((p) => {
        const id = `param-${p.key}`;
        const help = p.help && <p className="mt-1 text-xs text-muted">{p.help}</p>;
        if (p.type === "checkbox") {
          return (
            <div key={p.key}>
              <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(draft[p.key])}
                  onChange={(e) => set(p.key, e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--accent)]"
                />
                {p.label}
              </label>
              {help}
            </div>
          );
        }
        return (
          <div key={p.key}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
              {p.label}
            </label>
            {p.type === "select" ? (
              <select id={id} value={String(draft[p.key])} onChange={(e) => set(p.key, e.target.value)} className={`${FIELD} h-9`}>
                {p.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : p.type === "textarea" ? (
              <textarea
                id={id}
                rows={3}
                value={String(draft[p.key])}
                onChange={(e) => set(p.key, e.target.value)}
                className={`${FIELD} py-2`}
              />
            ) : (
              <Input
                id={id}
                type={p.type === "number" ? "number" : "text"}
                inputMode={p.type === "number" ? "numeric" : undefined}
                min={p.min ?? undefined}
                max={p.max ?? undefined}
                value={String(draft[p.key])}
                onChange={(e) => set(p.key, e.target.value)}
              />
            )}
            {help}
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </PanelForm>
  );
}
