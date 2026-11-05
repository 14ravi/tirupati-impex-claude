"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TaskChain } from "@/components/task-chain";
import { api } from "@/lib/api";
import { formatDateTime, type WorkflowSummary } from "@/lib/workflows";

export function WorkflowList() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<WorkflowSummary[]>("/workflows").then(setWorkflows, (err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <PageHeader title="Workflows" description="Pick a workflow to see its steps, change settings, run it or schedule it." />
      <div className="px-8 py-6">
        {error && (
          <p role="alert" className="mb-4 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {workflows === null && !error && [0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg bg-subtle" />)}
          {workflows?.map((w) => (w.available ? <AvailableCard key={w.key} workflow={w} /> : <SoonCard key={w.key} workflow={w} />))}
        </div>
      </div>
    </>
  );
}

function AvailableCard({ workflow }: { workflow: WorkflowSummary }) {
  return (
    <Link
      href={`/workflows/${workflow.key}`}
      className="group flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">{workflow.name}</h2>
          <p className="mt-1 text-sm text-muted">{workflow.description}</p>
        </div>
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted group-hover:text-accent" aria-hidden />
      </div>
      <TaskChain tasks={workflow.tasks} />
      <p className="text-xs text-muted">
        Last run {formatDateTime(workflow.last_run_at, "never")} · Next run {formatDateTime(workflow.next_run_at, "not scheduled")}
      </p>
    </Link>
  );
}

function SoonCard({ workflow }: { workflow: WorkflowSummary }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium text-muted">{workflow.name}</h2>
          <p className="mt-1 text-sm text-muted">{workflow.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">Coming soon</span>
      </div>
      <TaskChain tasks={workflow.tasks} />
    </div>
  );
}
