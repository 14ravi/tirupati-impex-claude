export type ParamValue = string | number | boolean;

export type Param = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox";
  help: string;
  options: string[];
  min: number | null;
  max: number | null;
};

export type Task = { key: string; name: string; description: string; params: Param[] };

export type RunStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export type Run = {
  id: string;
  status: RunStatus;
  trigger: "manual" | "schedule";
  created_at: string;
  leads_found: number;
  task_counts: Record<string, number>;
};

export type Schedule = {
  kind: "once" | "daily" | "weekly";
  run_at: string | null;
  time_of_day: string | null;
  weekdays: number[];
  timezone: string;
  next_run_at: string | null;
};

export type WorkflowSummary = {
  key: string;
  name: string;
  description: string;
  available: boolean;
  tasks: string[];
  last_run_at: string | null;
  next_run_at: string | null;
};

export type WorkflowDetail = {
  key: string;
  name: string;
  description: string;
  run_params: Param[];
  tasks: Task[];
  values: Record<string, Record<string, ParamValue>>;
  schedule: Schedule | null;
  recent_runs: Run[];
  runs_30d: number;
};

export const RUN_SECTION = "run";
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(iso: string | null, empty = "–"): string {
  return iso ? dateTime.format(new Date(iso)) : empty;
}

export function describeSchedule(schedule: Schedule): string {
  if (schedule.kind === "once") return `Once, ${formatDateTime(schedule.run_at)}`;
  if (schedule.kind === "daily") return `Every day at ${schedule.time_of_day}`;
  return `Every ${schedule.weekdays.map((d) => WEEKDAYS[d]).join(", ")} at ${schedule.time_of_day}`;
}
