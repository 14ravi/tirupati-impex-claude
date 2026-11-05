"use client";

import { useState } from "react";
import { PanelForm } from "@/components/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { WEEKDAYS, type Schedule } from "@/lib/workflows";

type Kind = "off" | Schedule["kind"];

const KINDS: { value: Kind; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

/** "YYYY-MM-DDTHH:MM" in India time, the format a datetime-local input expects. */
function toIndiaInput(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function tomorrowAtNine(): string {
  const tomorrow = toIndiaInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
  return `${tomorrow.slice(0, 10)}T09:00`;
}

export type ScheduleInput = { kind: Schedule["kind"]; run_at?: string; time_of_day?: string; weekdays?: number[] };

export function ScheduleForm({
  schedule,
  save,
  onCancel,
}: {
  schedule: Schedule | null;
  save: (input: ScheduleInput | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<Kind>(schedule?.kind ?? "off");
  const [runAt, setRunAt] = useState(schedule?.run_at ? toIndiaInput(new Date(schedule.run_at)) : tomorrowAtNine());
  const [time, setTime] = useState(schedule?.time_of_day ?? "09:00");
  const [weekdays, setWeekdays] = useState<number[]>(schedule?.weekdays.length ? schedule.weekdays : [0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) =>
    setWeekdays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()));

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (kind === "off") await save(null);
      else if (kind === "once") await save({ kind, run_at: runAt });
      else if (kind === "daily") await save({ kind, time_of_day: time });
      else await save({ kind, time_of_day: time, weekdays });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
      setSaving(false);
    }
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
            {saving ? "Saving…" : "Save schedule"}
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="How often" className="grid grid-cols-4 gap-1 rounded-md bg-subtle p-1">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={kind === k.value}
            onClick={() => setKind(k.value)}
            className={`h-8 cursor-pointer rounded text-sm ${kind === k.value ? "bg-surface font-medium shadow-sm" : "text-muted hover:text-fg"}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {kind === "off" && <p className="text-sm text-muted">This workflow only runs when you press Run now.</p>}

      {kind === "once" && (
        <div>
          <label htmlFor="run-at" className="mb-1.5 block text-sm font-medium">
            Date and time
          </label>
          <Input id="run-at" type="datetime-local" value={runAt} onChange={(e) => setRunAt(e.target.value)} required />
        </div>
      )}

      {kind === "weekly" && (
        <div>
          <p className="mb-1.5 text-sm font-medium">Days</p>
          <div className="flex gap-1">
            {WEEKDAYS.map((label, day) => (
              <button
                key={label}
                type="button"
                aria-pressed={weekdays.includes(day)}
                onClick={() => toggleDay(day)}
                className={`h-8 flex-1 cursor-pointer rounded-md border text-xs ${
                  weekdays.includes(day) ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted hover:text-fg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(kind === "daily" || kind === "weekly") && (
        <div>
          <label htmlFor="time" className="mb-1.5 block text-sm font-medium">
            Time
          </label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      )}

      {kind !== "off" && <p className="text-xs text-muted">Times are India Standard Time (IST).</p>}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </PanelForm>
  );
}
