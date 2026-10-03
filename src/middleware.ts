import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { pageKey } from "@/lib/pagekey";

/**
 * Keyed page URLs: /classes/09807726217hhdhhiaCHL is served by /classes.
 * The key is bound to the signed-in user and the section, so a copied/guessed key is rejected.
 */
const KEYED = /^\/([a-z][a-z-]*)\/(\d{11}[a-z]{8}[A-Z]{3})(\/.*)?$/;

export async function middleware(req: NextRequest) {
  const m = req.nextUrl.pathname.match(KEYED);
  if (!m) return NextResponse.next();
  const [, section, key, rest = ""] = m;
  const secret = process.env.AUTH_SECRET;
  const token = req.cookies.get("es_session")?.value;
  if (!secret || !token) return NextResponse.redirect(new URL("/login", req.url));
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    userId = String(payload.userId);
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (key !== (await pageKey(userId, section, secret))) {
    return NextResponse.rewrite(new URL("/zz-not-found", req.url), { status: 404 });
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${section}${rest}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ["/((?!_next/|api/|favicon|icon|apple-icon|pwa-icon|logo|manifest|sw\\.js).*)"] };
