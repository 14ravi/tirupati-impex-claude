import { Users } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <ComingSoon title="Leads" icon={Users}>
      Every lead from every run in one list, with its status: new, emailed, replied, won or released. Mark a lead as not a
      lead, block it, or mark it won from here.
    </ComingSoon>
  );
}
