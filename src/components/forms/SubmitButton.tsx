"use client";
import { useFormStatus } from "react-dom";
import { btnPrimary } from "@/components/ui/styles";

export function SubmitButton({ children, pending }: { children: React.ReactNode; pending: string }) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" disabled={busy} className={btnPrimary}>
      {busy ? pending : children}
    </button>
  );
}
