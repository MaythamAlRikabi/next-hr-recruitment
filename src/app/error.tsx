"use client";

import Link from "next/link";
import { useEffect } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";

/** Route-level error boundary. Bilingual because client error boundaries cannot read the locale cookie on the server. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("route_error", error.digest ?? "no-digest");
  }, [error]);
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="t-h1 text-midnight">حدث خطأ ما · Something went wrong</h1>
      <p className="mt-3 text-muted">وقع خطأ غير متوقع. يرجى المحاولة مرة أخرى.</p>
      <p className="text-muted">An unexpected error occurred. Please try again.</p>
      {error.digest ? (
        <p className="mt-2 text-xs text-muted">Ref: <span dir="ltr" className="font-mono">{error.digest}</span></p>
      ) : null}
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className={btnPrimary}>حاول مرة أخرى · Try again</button>
        <Link href="/" className={btnSecondary}>الرئيسية · Home</Link>
      </div>
    </section>
  );
}
