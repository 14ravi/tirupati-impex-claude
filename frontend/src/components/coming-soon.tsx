import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export function ComingSoon({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="px-8 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-subtle text-muted">
            <Icon className="size-5" aria-hidden />
          </div>
          <p className="text-sm font-medium">Coming in the next build</p>
          <p className="mt-1 text-sm text-muted">{children}</p>
        </div>
      </div>
    </>
  );
}
