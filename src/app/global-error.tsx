"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "6rem 1rem", color: "#172536" }}>
        <h1 style={{ color: "#124B89" }}>NEXT | HR &amp; Recruitment</h1>
        <p>حدث خطأ غير متوقع · An unexpected error occurred.</p>
        <button onClick={reset} style={{ marginTop: "1rem", padding: "0.6rem 1.2rem", background: "#1769B4", color: "#fff", border: 0, borderRadius: 8 }}>
          حاول مرة أخرى · Try again
        </button>
      </body>
    </html>
  );
}
