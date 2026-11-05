import { Workflow } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Workflows" };

export default function WorkflowsPage() {
  return (
    <ComingSoon title="Workflows" icon={Workflow}>
      Each workflow will appear as a card with its steps and a short description. Open one to see its task graph, change
      settings for any step, run it now or schedule it.
    </ComingSoon>
  );
}
