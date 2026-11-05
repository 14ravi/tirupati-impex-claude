import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none ${className}`}
      {...props}
    />
  );
}
