"use client";

// global-error replaces the root layout entirely when it's the root layout
// itself that throws, so it can't rely on globals.css or the theme system —
// it renders its own bare <html>/<body>. Styled inline, deliberately simple.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          fontFamily: "system-ui, sans-serif",
          background: "#ffffff",
          color: "#18181b",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "320px", margin: 0 }}>
          UNSAID hit an unexpected error. Please try again.
        </p>
        <button
          onClick={() => retry()}
          style={{
            marginTop: "8px",
            borderRadius: "999px",
            background: "#e0245e",
            color: "#ffffff",
            border: "none",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
