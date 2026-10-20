import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Social sign-in (OIDC authorization-code + PKCE).
 *
 * Google is configured today. "Sign in with ChatGPT" uses the same path and
 * switches on only when OpenAI issues a client ID and documents its endpoints
 * (CHATGPT_* environment variables). Identity scopes only: this signs an
 * existing EduSphere account in — it never creates one and never calls a model.
 */
export type ProviderId = "google" | "chatgpt";

type ProviderConfig = {
  id: ProviderId;
  label: string;
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  issuer: string;
  scope: string;
  /** Google needs an explicit account picker; harmless default elsewhere. */
  extraAuthParams?: Record<string, string>;
};

const GOOGLE_ENDPOINTS = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  issuer: "https://accounts.google.com",
  scope: "openid email profile",
  extraAuthParams: { prompt: "select_account" },
};

/** Returns a usable provider config, or null when it is not configured. */
export function providerConfig(id: string): ProviderConfig | null {
  if (id === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return { id: "google", label: "Continue with Google", clientId, clientSecret, ...GOOGLE_ENDPOINTS };
  }
  if (id === "chatgpt") {
    const clientId = process.env.CHATGPT_CLIENT_ID;
    const clientSecret = process.env.CHATGPT_CLIENT_SECRET;
    const authorizationEndpoint = process.env.CHATGPT_AUTHORIZATION_ENDPOINT;
    const tokenEndpoint = process.env.CHATGPT_TOKEN_ENDPOINT;
    const jwksUri = process.env.CHATGPT_JWKS_URI;
    const issuer = process.env.CHATGPT_ISSUER;
    if (!clientId || !clientSecret || !authorizationEndpoint || !tokenEndpoint || !jwksUri || !issuer) return null;
    return {
      id: "chatgpt",
      label: "Continue with ChatGPT",
      clientId,
      clientSecret,
      authorizationEndpoint,
      tokenEndpoint,
      jwksUri,
      issuer,
      scope: "openid email profile",
    };
  }
  return null;
}

/** Providers that are safe to show on the sign-in page right now. */
export function configuredProviders(): { id: ProviderId; label: string; href: string }[] {
  return (["google", "chatgpt"] as const).flatMap((id) => {
    const c = providerConfig(id);
    return c ? [{ id, label: c.label, href: `/api/auth/${id}/start` }] : [];
  });
}

// ---------------------------------------------------------------------------
// Transaction cookie: holds the CSRF state and the PKCE verifier for 10 min.
// ---------------------------------------------------------------------------
const TXN_COOKIE = "es_oauth_txn";
const TXN_TTL_SECONDS = 600;

const b64url = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function beginOAuth(c: ProviderConfig, redirectUri: string): Promise<string> {
  const state = b64url(crypto.getRandomValues(new Uint8Array(24)));
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));

  const url = new URL(c.authorizationEndpoint);
  url.searchParams.set("client_id", c.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", c.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  for (const [k, v] of Object.entries(c.extraAuthParams ?? {})) url.searchParams.set(k, v);

  (await cookies()).set(TXN_COOKIE, JSON.stringify({ p: c.id, s: state, v: verifier }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TXN_TTL_SECONDS,
  });
  return url.toString();
}

/** Consumes the transaction cookie once; returns the PKCE verifier when state matches. */
export async function consumeOAuthTxn(provider: string, state: string | null): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(TXN_COOKIE)?.value;
  jar.delete(TXN_COOKIE);
  if (!raw || !state) return null;
  try {
    const txn = JSON.parse(raw) as { p?: string; s?: string; v?: string };
    if (txn.p !== provider || txn.s !== state || typeof txn.v !== "string") return null;
    return txn.v;
  } catch {
    return null;
  }
}

export async function exchangeCode(
  c: ProviderConfig,
  code: string,
  redirectUri: string,
  verifier: string,
): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: c.clientId,
    client_secret: c.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code_verifier: verifier,
  });
  const res = await fetch(c.tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id_token?: string };
  return typeof json.id_token === "string" ? json.id_token : null;
}

export type OidcClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function verifyIdToken(c: ProviderConfig, idToken: string): Promise<OidcClaims | null> {
  let jwks = jwksCache.get(c.id);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(c.jwksUri));
    jwksCache.set(c.id, jwks);
  }
  try {
    const { payload } = await jwtVerify(idToken, jwks, { issuer: c.issuer, audience: c.clientId });
    if (typeof payload.sub !== "string") return null;
    return payload as unknown as OidcClaims;
  } catch {
    return null;
  }
}

/** Google may send the claim as boolean or string. Both true spellings count. */
export const emailIsVerified = (v: OidcClaims["email_verified"]) => v === true || v === "true";
