# Google sign-in — setup guide

The code is deployed and dormant. It switches on the moment two environment
variables exist and the redirect URI is registered. No user-facing change until then.

## What is built

- `GET /api/auth/google/start` — builds an OIDC authorization request with PKCE (S256)
  and a signed-in-cookie state value (`es_oauth_txn`, 10 minutes, httpOnly).
- `GET /api/auth/google/callback` — exchanges the code, verifies the ID token against
  Google's JWKS (issuer + audience checked), requires a verified email, then:
  - finds the EduSphere account by the bound provider subject (`User.oauthSub`), else
    by verified email, and binds the subject on first use;
  - refuses inactive accounts, locked accounts, students without an active roster link,
    unknown emails, and emails already bound to a different identity;
  - writes a `login_oauth` audit row, sets the normal `es_session` cookie and redirects
    to `/dashboard` (where `mustChangePassword` still applies).
- The same code path serves "Continue with ChatGPT" once OpenAI issues a client ID —
  only environment values change.
- The button appears only when the provider is configured. On a school's custom domain
  the buttons are deliberately hidden, because the registered redirect URI belongs to
  the main app domain.

## Step 1 — Google Cloud project

1. Open https://console.cloud.google.com and create a project (for example `edusphere`).
2. **APIs & Services → OAuth consent screen**: choose **External**, fill the app name,
   support email and developer contact. Only the `openid`, `email` and `profile` scopes
   are used, so no sensitive-scope review is required.
3. While the consent screen is in **Testing**, add the Google accounts that should be
   able to sign in under **Test users**. Publish the app when you are ready for anyone.

## Step 2 — OAuth client

**APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**

Authorized redirect URIs (exact strings, no trailing slash):

```
https://edusphere-sand-chi.vercel.app/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

Copy the **client ID** and **client secret**.

## Step 3 — set the variables

Vercel (production and preview):

```powershell
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_ID preview
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GOOGLE_CLIENT_SECRET preview
```

Each command prompts for the value; paste it, never pass it on the command line.

Local development: add two entries to `edusphere/.env` named `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`, with the same values.

Redeploy after adding them (a push, or `vercel --prod`). The button appears on `/login`
as soon as the deployment has both values.

## Step 4 — verify

1. Open `/login` — a divider and **Continue with Google** appear under the sign-in button.
2. Use an account whose email matches an existing EduSphere user (for the demo school,
   `principal@greenfield.test` has no Google identity, so use a real staff account).
3. Wrong cases to check: an unknown Google email → "No EduSphere account uses this
   email"; a cancelled consent → "Sign-in was cancelled"; a second Google identity on an
   already-linked email → "This email is linked to a different sign-in".

## Limits of this version

- **Sign-in only.** No account creation here: principals still create schools with the
  email + password form, and invited staff/parents/students keep their invite flow.
- **Not on custom school domains**, as explained above.
- **No ChatGPT button yet.** It stays hidden until OpenAI issues a client ID and its
  endpoints; then five `CHATGPT_*` values (client ID, client secret, authorization
  endpoint, token endpoint, JWKS URI, issuer) enable the same flow. Per OpenAI's docs,
  that programme is a limited trial for selected commercial partners.
