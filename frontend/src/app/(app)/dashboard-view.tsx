"use client";

import { ArrowRight, Clock, MailCheck, MessageSquareReply, Workflow } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useUser } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard as Stat, StatValue as Value } from "@/components/stat-card";
import { api } from "@/lib/api";

type Summary = {
  emails_waiting_approval: number;
  replies_to_handle: number;
  leads_expiring_soon: number;
  leads_generated_30d: number;
  emails_sent_30d: number;
  reply_rate_30d: number | null;
  credits_used_30d: number;
};

export function DashboardView() {
  const user = useUser();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Summary>("/dashboard/summary").then(setSummary, (err: Error) => setError(err.message));
  }, []);

  const firstName = user?.full_name.split(" ")[0];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={firstName ? `Welcome back, ${firstName}. Here's what needs you today.` : "Here's what needs you today."}
      />
      <div className="space-y-8 px-8 py-6">
        {error && (
          <p role="alert" className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <Section title="Needs your attention">
          <div className="grid gap-3 sm:grid-cols-3">
            <AttentionCard
              href="/emails"
              icon={<MailCheck className="size-4" aria-hidden />}
              label="Waiting for approval"
              value={summary?.emails_waiting_approval}
            />
            <AttentionCard
              href="/emails"
              icon={<MessageSquareReply className="size-4" aria-hidden />}
              label="Replies to handle"
              value={summary?.replies_to_handle}
            />
            <AttentionCard
              href="/leads"
              icon={<Clock className="size-4" aria-hidden />}
              label="Leads expiring soon"
              value={summary?.leads_expiring_soon}
            />
          </div>
        </Section>

        <Section title="Last 30 days">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Leads generated" value={summary?.leads_generated_30d} />
            <Stat label="Emails sent" value={summary?.emails_sent_30d} />
            <Stat
              label="Reply rate"
              value={
                summary ? (summary.reply_rate_30d === null ? "–" : `${Math.round(summary.reply_rate_30d * 100)}%`) : undefined
              }
              hint={summary?.reply_rate_30d === null ? "No emails sent yet" : undefined}
            />
            <Stat label="Credits used" value={summary?.credits_used_30d} />
          </div>
        </Section>

        <Section title="Recent runs">
          <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
            <Workflow className="mx-auto mb-3 size-5 text-muted" aria-hidden />
            <p className="text-sm font-medium">Run your first workflow</p>
            <p className="mt-1 text-sm text-muted">Runs you start or schedule will show here with the leads they found.</p>
            <Link
              href="/workflows"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              Open workflows <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}

function AttentionCard({ href, icon, label, value }: { href: string; icon: ReactNode; label: string; value?: number }) {
  const hasItems = (value ?? 0) > 0;
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:border-accent ${
        hasItems ? "border-accent/40 bg-accent-soft" : "border-line bg-surface"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <Value value={value} />
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted group-hover:text-accent" aria-hidden />
    </Link>
  );
}
