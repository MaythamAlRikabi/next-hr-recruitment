"use client";
import { useFormStatus } from "react-dom";
import { btnPrimary } from "@/components/ui/styles";

export function SubmitButton({ children, pending, className = btnPrimary }: { children: React.ReactNode; pending: string; className?: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" disabled={busy} className={className}>
      {busy ? pending : children}
    </button>
  );
}
