"use client";

import { ArrowLeft, CalendarClock, Play, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ParamForm } from "@/components/param-form";
import { ScheduleForm, type ScheduleInput } from "@/components/schedule-form";
import { SidePanel } from "@/components/side-panel";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { WorkflowGraph } from "@/components/workflow-graph";
import { api, ApiError } from "@/lib/api";
import {
  describeSchedule,
  formatDateTime,
  RUN_SECTION,
  type ParamValue,
  type Run,
  type RunStatus,
  type Schedule,
  type WorkflowDetail,
} from "@/lib/workflows";

const SCHEDULE_PANEL = "schedule";

export function WorkflowView() {
  const { key } = useParams<{ key: string }>();
  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<string | null>(null); // a task key, RUN_SECTION or SCHEDULE_PANEL
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api<WorkflowDetail>(`/workflows/${key}`).then(setWorkflow, (err: Error) => setError(err.message));
  }, [key]);

  const closePanel = useCallback(() => setPanel(null), []);

  if (!workflow) {
    return (
      <>
        <PageHeader title="Workflow" />
        <div className="px-8 py-6">
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : (
            <div className="h-48 animate-pulse rounded-lg bg-subtle" />
          )}
        </div>
      </>
    );
  }

  async function runNow() {
    setStarting(true);
    setError(null);
    try {
      const run = await api<Run>(`/workflows/${key}/runs`, { method: "POST" });
      setWorkflow((w) => w && { ...w, recent_runs: [run, ...w.recent_runs].slice(0, 10), runs_30d: w.runs_30d + 1 });
      setNotice("Run queued. It'll start once the lead pipeline is connected in the next build.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the run. Try again.");
    } finally {
      setStarting(false);
    }
  }

  async function saveParams(section: string, values: Record<string, ParamValue>) {
    const saved = await api<Record<string, ParamValue>>(`/workflows/${key}/params/${section}`, {
      method: "PUT",
      body: JSON.stringify({ values }),
    });
    setWorkflow((w) => w && { ...w, values: { ...w.values, [section]: saved } });
    setPanel(null);
  }

  async function saveSchedule(input: ScheduleInput | null) {
    const schedule = input
      ? await api<Schedule>(`/workflows/${key}/schedule`, { method: "PUT", body: JSON.stringify(input) })
      : (await api<void>(`/workflows/${key}/schedule`, { method: "DELETE" }), null);
    setWorkflow((w) => w && { ...w, schedule });
    setPanel(null);
  }

  const lastRun = workflow.recent_runs[0];
  const task = workflow.tasks.find((t) => t.key === panel);
  const lastCounts = lastRun && Object.keys(lastRun.task_counts).length > 0 ? lastRun.task_counts : null;

  return (
    <>
      <PageHeader
        title={workflow.name}
        description={workflow.description}
        actions={
          <>
            <Button variant="ghost" onClick={() => setPanel(RUN_SECTION)}>
              <SlidersHorizontal className="size-4" aria-hidden /> Run settings
            </Button>
            <Button onClick={() => setPanel(SCHEDULE_PANEL)}>
              <CalendarClock className="size-4" aria-hidden /> Schedule
            </Button>
            <Button variant="primary" onClick={runNow} disabled={starting}>
              <Play className="size-4" aria-hidden /> {starting ? "Starting…" : "Run now"}
            </Button>
          </>
        }
      />

      <div className="space-y-6 px-8 py-6">
        <Link href="/workflows" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> All workflows
        </Link>

        {(notice || error) && (
          <div
            role={error ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
              error ? "border-danger/40 text-danger" : "border-accent/40 bg-accent-soft"
            }`}
          >
            <span>{error ?? notice}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => (error ? setError(null) : setNotice(null))}
              className="cursor-pointer text-muted hover:text-fg"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Last run" value={formatDateTime(lastRun?.created_at ?? null, "Never")} />
          <StatCard label="Leads in last run" value={lastRun ? lastRun.leads_found : "–"} />
          <StatCard label="Runs in last 30 days" value={workflow.runs_30d} />
          <StatCard
            label="Next run"
            value={workflow.schedule ? formatDateTime(workflow.schedule.next_run_at, "None") : "Not scheduled"}
            hint={workflow.schedule ? describeSchedule(workflow.schedule) : undefined}
          />
        </div>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted">Steps</h2>
            <p className="text-xs text-muted">Click a step to change its settings</p>
          </div>
          <WorkflowGraph tasks={workflow.tasks} counts={lastCounts} selected={task?.key ?? null} onSelect={setPanel} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">Recent runs</h2>
          {workflow.recent_runs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-surface px-6 py-8 text-center text-sm text-muted">
              No runs yet. Press Run now, or set a schedule.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <table className="w-full text-sm">
                <thead className="border-b border-line text-left text-muted">
                  <tr>
                    <th className="px-4 py-2 font-normal">Started</th>
                    <th className="px-4 py-2 font-normal">How</th>
                    <th className="px-4 py-2 font-normal">Status</th>
                    <th className="px-4 py-2 text-right font-normal">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {workflow.recent_runs.map((run) => (
                    <tr key={run.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5">{formatDateTime(run.created_at)}</td>
                      <td className="px-4 py-2.5 text-muted">{run.trigger === "manual" ? "Run now" : "Schedule"}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{run.leads_found}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {panel === SCHEDULE_PANEL && (
        <SidePanel title="Schedule" description={`When ${workflow.name} runs by itself.`} onClose={closePanel}>
          <ScheduleForm schedule={workflow.schedule} save={saveSchedule} onCancel={closePanel} />
        </SidePanel>
      )}
      {panel === RUN_SECTION && (
        <SidePanel title="Run settings" description="Limits for every run of this workflow." onClose={closePanel}>
          <ParamForm
            params={workflow.run_params}
            values={workflow.values[RUN_SECTION]}
            save={(values) => saveParams(RUN_SECTION, values)}
            onCancel={closePanel}
          />
        </SidePanel>
      )}
      {task && (
        <SidePanel key={task.key} title={task.name} description={task.description} onClose={closePanel}>
          <ParamForm
            params={task.params}
            values={workflow.values[task.key]}
            save={(values) => saveParams(task.key, values)}
            onCancel={closePanel}
          />
        </SidePanel>
      )}
    </>
  );
}

const STATUS_STYLES: Record<RunStatus, string> = {
  queued: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  running: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  done: "bg-green-500/15 text-green-700 dark:text-green-300",
  failed: "bg-red-500/15 text-red-700 dark:text-red-300",
  cancelled: "bg-subtle text-muted",
};

function StatusBadge({ status }: { status: RunStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>{status}</span>;
}
