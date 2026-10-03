import { ImageResponse } from "next/og";

/** Installable-app icon, drawn in code so no binary files are needed: /pwa-icon/192 and /pwa-icon/512. */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const n = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#4f46e5" }}>
        <div style={{ width: n * 0.62, height: n * 0.62, borderRadius: n * 0.16, background: "#fff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: n * 0.44, fontWeight: 800 }}>E</div>
      </div>
    ),
    { width: n, height: n },
  );
}
