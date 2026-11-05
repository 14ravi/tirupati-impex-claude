"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** A panel that slides over the right side of the page. Escape closes it. */
export function SidePanel({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-label={title}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-line bg-surface shadow-xl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-medium">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="cursor-pointer rounded p-1 text-muted hover:bg-subtle hover:text-fg"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {children}
    </aside>
  );
}

/** Scrolling body and a fixed footer for a SidePanel form. */
export function PanelForm({
  onSubmit,
  footer,
  children,
}: {
  onSubmit: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">{children}</div>
      <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>
    </form>
  );
}
