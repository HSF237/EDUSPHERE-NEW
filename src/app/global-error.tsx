"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#f5f6fc", color: "#1e1b4b" }}>
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>EduSphere hit a problem</h1>
          <p style={{ color: "#475569" }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ background: "#4f46e5", color: "#fff", border: 0, borderRadius: 12, padding: "12px 20px", fontWeight: 700, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
