import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Emails" };

export default function EmailsPage() {
  return (
    <ComingSoon title="Emails" icon={Mail}>
      Emails waiting for your approval, scheduled, sent, and replies, with the full history for each lead.
    </ComingSoon>
  );
}
