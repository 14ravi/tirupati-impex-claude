import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon title="Settings" icon={Settings}>
      Your 100 confidence points per service, agency profile and signature, email style for each industry, block list,
      sending mailboxes and team.
    </ComingSoon>
  );
}
