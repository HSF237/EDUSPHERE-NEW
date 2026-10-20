import { NextResponse } from "next/server";
import { beginOAuth, providerConfig } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/** Public origin, respecting the proxy headers Vercel/Catalyst set. */
function originOf(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const c = providerConfig(provider);
  if (!c) return NextResponse.redirect(new URL("/login?oauth=not-configured", req.url));

  const redirectUri = `${originOf(req)}/api/auth/${provider}/callback`;
  return NextResponse.redirect(await beginOAuth(c, redirectUri));
}
