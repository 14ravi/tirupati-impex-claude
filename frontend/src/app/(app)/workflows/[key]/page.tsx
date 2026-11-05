import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkflowView } from "./workflow-view";

export const metadata: Metadata = { title: "Workflow" };

export default function WorkflowPage() {
  // WorkflowView reads the workflow key from the URL, which is only known at request time.
  return (
    <Suspense fallback={<div className="m-8 h-48 animate-pulse rounded-lg bg-subtle" />}>
      <WorkflowView />
    </Suspense>
  );
}
