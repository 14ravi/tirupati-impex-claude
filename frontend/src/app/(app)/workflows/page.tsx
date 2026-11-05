import type { Metadata } from "next";
import { WorkflowList } from "./workflow-list";

export const metadata: Metadata = { title: "Workflows" };

export default function WorkflowsPage() {
  return <WorkflowList />;
}
