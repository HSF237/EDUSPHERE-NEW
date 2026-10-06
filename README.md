# EduSphere

A multi-school management platform: attendance, homework, class diary, timetables, exams and report cards, leave, messaging, announcements, parent–teacher meetings and substitute management — for principals, teachers and parents.

Built with **Next.js 15 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL**.

## Architecture

- **Multi-tenant.** Every tenant row carries a `schoolId`; every page and server action starts with `getCtx()` (`src/lib/scope.ts`), which resolves the signed-in user and the classes / children they may access. Queries are always filtered by `schoolId` and the user's allowed class ids, so one school can never read another's data.
- **Roles.** `SUPER_ADMIN` (platform: onboard schools), `ADMIN` (principal), `TEACHER`, `PARENT`. Authorization is enforced on the server in each action, not just by hiding links.
- **Auth.** Email + bcrypt password, signed JWT in an `httpOnly` cookie (7 days). The user record is re-checked on every request, so disabling a user or school takes effect immediately.
- **Workflows.** Teacher marks attendance → principal approves → parents are notified of absences. Parent applies for leave → class teacher / principal decides. Exams → marks by subject teacher → principal publishes → parents see report cards.
- **Scale.** Indexed foreign keys and date columns, paginated lists, aggregate queries via `groupBy`, stateless web tier (`output: standalone`) behind a load balancer, one Postgres.

## Run locally

```bash
cp .env.example .env            # set DATABASE_URL and AUTH_SECRET (32+ chars)
npm install
npx prisma migrate deploy
npm run db:seed                 # DEV ONLY: two sample schools, password Passw0rd!
npm run dev
```

Sample logins (after seeding): `principal@greenfield.test`, `teacher1@greenfield.test`, `parent1@greenfield.test`, `super@edusphere.test`.

## Deploy

```bash
export AUTH_SECRET=$(openssl rand -base64 48)
docker compose up --build -d
```

Migrations run on container start. **Do not run the seed in production** (it refuses when `NODE_ENV=production`). Create the first platform admin with a one-off SQL/Prisma script, then onboard schools from **Schools**. Health check: `GET /api/health`.

## Before going live at scale

- Put the app behind HTTPS and a reverse proxy / CDN; add rate limiting on `/login` (not included).
- Use managed Postgres with backups, PgBouncer / Prisma Accelerate for connection pooling, and read replicas for reporting.
- Add email/SMS delivery for notifications and file storage for attachments (in-app notifications only for now).
- Add automated tests and CI; error monitoring (e.g. Sentry).

## Layout

`prisma/schema.prisma` data model · `src/lib` auth, scoping, db · `src/components` UI kit · `src/app/(app)/*` modules, each with its page and server actions.

## Gemini Copilot

The **AI Copilot** page uses a server-side Gemini API key for authorized school queries and principal-approved class creation/substitute coverage. Set `GEMINI_API_KEY`, apply the new Prisma migration, and deploy. Gemini is the reasoning layer; EduSphere owns permission checks, exact-value validation, previews, transactional execution and audit logs. No GPU or custom model training is needed.

See [Gemini Copilot setup and architecture](docs/GEMINI_COPILOT.md) for implemented tools, limitations, request budgets and rollout checks. Never commit a real API key or use a `NEXT_PUBLIC_` key.
