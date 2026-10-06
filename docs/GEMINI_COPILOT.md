# EduSphere Gemini Copilot

EduSphere uses Gemini through a server-side API key. No custom model training, Kaggle session or GPU server is needed for this integration. School operations remain in EduSphere's authenticated backend.

## Enable the integration

1. Install dependencies with `npm ci`.
2. Apply the migration with `npm run db:migrate` against the intended PostgreSQL database.
3. Set `GEMINI_API_KEY` in the **server** environment. For local work use `.env.local`; Prisma CLI also needs `DATABASE_URL` supplied in its environment or `.env`.
4. Set `GEMINI_MODEL` to a model available to your API project. The provided default follows Google's current Interactions examples: `gemini-3.8-flash`.
5. Build and deploy, then sign in with an active school account and open **AI Copilot**. Principals see Principal Copilot.

Do not paste a key into chat, commit it, put it in a client-side setting, or use a `NEXT_PUBLIC_` variable. The code reads the key only in the server provider and sends it as an HTTP header. No key is returned to the browser. Missing configuration produces a setup message and disables chat, without fabricated responses.

The Gemini app subscription is not the application's API configuration. Use the API project's credentials, quotas and billing. Confirm applicable model access and pricing in AI Studio. This branch does not create a billing account, buy credits, deploy production or apply production database migrations.

## Vercel rollout

Vercel's default `npm run build` generates Prisma and builds Next.js; it does not apply database migrations. The Production environment needs `DATABASE_URL`, `AUTH_SECRET` and `GEMINI_API_KEY`. Environment changes apply to newly built deployments.

For the initial approved production rollout, use the build command `npm run db:migrate && npm run build` so a failed migration prevents publishing the new application. Review migration history first: an existing database created with `prisma db push` may need a verified baseline; do not reset the database or blindly mark migrations applied. The Gemini migration adds tables, columns, indexes and constraints without changing existing Portion relationships or deleting school records.

Keep a successful existing production deployment available for application rollback. A Vercel rollback does not undo database migrations. The new schema additions remain compatible with the previous application.

The first rollout can run `npx prisma generate && node --import tsx scripts/copilot-preflight.cjs` before migration. This read-only check verifies the existing migration history and checksums, permits only the Gemini migration to be pending, and makes a generic Gemini verification request without school data. It stops on missing history, unexpected pending migrations, failed migrations or invalid API configuration; it never resets or baselines the database. Run it once for this release, then retain a Production-only migration/build command for later deployments. Preview builds should run `npm run build` and use their own database lifecycle.

If the production database already has the previous schema but no migration history, the explicit one-time flag `COPILOT_ALLOW_VERIFIED_BASELINE=1` allows recording the historical migrations. The script first requires a zero-difference, read-only Prisma comparison against `prisma/baselines/pre_copilot.prisma`, the schema from commit `4c89d572fa0bfb6fdf1506e0b2b28b2525e3b04c`. It also requires the Gemini API check to pass, repeats the schema comparison, then uses `prisma migrate resolve --applied` only for those verified historical migrations. It does not replay their SQL or historical data updates. The new Gemini migration is applied normally afterward. Remove the flag and first-rollout check after success.

For a separately observed Gemini HTTP 503 outage, `COPILOT_ALLOW_GEMINI_503=1` permits completing the rollout while clearly logging `verification_pending`. It allows only HTTP 503; missing credentials, authentication failures, malformed responses and schema/history mismatches still block the rollout. This allowance does not validate the API key or claim a successful live response. Copilot reports API failures without executing school actions. Remove this one-time flag after rollout and verify a successful authenticated request when the service responds.

Preview testing needs its own database, authentication secret and Gemini key in the Preview environment. The existing preview's successful build alone does not verify database access or a live Gemini response. After the approved rollout, sign in to `/copilot`, verify a read-only Gemini request, then inspect a class-creation preview without confirming it.

## Request path

The authenticated Copilot server action resolves the real user, school, workspace and permissions. It validates request size, reserves a persistent request budget and sends the message to Gemini with only permitted function declarations. Gemini returns structured function calls. The runtime validates schemas and exact request values, rechecks database authorization and executes controlled reads or stores a preview. The browser receives the result or an approval card.

For writes, the user clicks the approval card. A separate authenticated server action retrieves the stored payload, checks its ownership, fingerprint, expiry and current authoritative data, then executes the operation and writes the audit record in one serializable PostgreSQL transaction. A model cannot call the confirmation action or provide its payload. Typing “confirm” in chat does not execute a write.

## Tool registry

`src/lib/ai/tools.ts` owns tool schemas, required fields, roles, capabilities, read-only status, confirmation rules, risk level, audit requirements and enabled state. Only enabled tools permitted for the authenticated account are sent to Gemini. Runtime checks remain mandatory even if a model invents a tool or supplies another school ID.

| Tool | State | Effect |
| --- | --- | --- |
| `create_classes` | Implemented | Stored preview; principal approves atomic batch |
| `plan_substitute_coverage` | Implemented | Stored preview of absence + substitute records; principal approves |
| `get_school_status` | Implemented | Date-specific approved attendance totals, known absences, uncovered periods and pending AI approvals |
| `get_attendance` | Implemented | Authorized class totals for approved registers; no student names |
| `get_class_timetable` | Implemented | Authorized class schedule with approved date-specific substitutions |
| `get_teacher_timetable` | Implemented | Named teacher schedule; ordinary teachers can read only their own |
| `get_available_teachers` | Implemented | Free and available staff for an explicit period/date |
| `create_class`, `update_class`, `archive_class` | Catalog only | Class management services; single-class creation currently uses `create_classes` with one entry |
| `get_attendance_summary` | Catalog only | Filtered attendance analysis |
| `assign_substitute` | Catalog only | Direct model assignment stays unavailable; confirmation uses the stored plan |
| `assign_class_teacher`, `assign_subject_teacher` | Catalog only | Teacher assignment previews |
| `move_class_period` | Catalog only | Timetable change preview |
| `create_homework_draft`, `publish_homework` | Catalog only | Separate content draft and approved publication |
| `generate_class_report`, `generate_student_report` | Catalog only | Scoped reporting |
| `create_announcement_draft`, `publish_announcement` | Catalog only | Separate draft and approved publication |
| `create_teacher_account`, `create_student_account` | Catalog only | Account provisioning; invite services, never password disclosure |
| `get_student_performance`, `get_class_performance` | Catalog only | Performance queries with object-level scope |
| `calculator` | Catalog only | Bounded arithmetic service |

General Gemini responses can help draft educational content, but they do not publish homework or announcements. Disabled tools are not exposed or executed. Add each future handler, scope validation and tests before enabling its declaration.

## Permissions

The database's `ADMIN` role represents the school principal/admin. `SUPER_ADMIN` is the platform owner, not automatically a school operator. `TEACHER` includes class teachers and teachers with delegated permissions. The application currently has no student login role; do not invent one in the AI layer.

| Account | Available scope |
| --- | --- |
| Principal (`ADMIN`) | School-scoped reads, class previews, substitution previews, confirmation and manual teacher availability |
| Teacher | Selected authorized workspace attendance/timetable; own teacher timetable |
| Teacher + `REPORTS` | School status reads in addition to ordinary teacher scope |
| Teacher + `SUBSTITUTES` | School teacher timetable and availability reads |
| Parent | Timetable for a class containing their active child; no class attendance totals, student reports or writes |
| Platform owner / support mode | Copilot disabled |
| Locked / setup school | Permitted reads only; no operational writes |

Fresh user activity, role, school membership, school activity, billing state and teacher permissions are checked in the transaction. Teacher assignments and parent-child membership are checked against current records for scoped reads. Signed cookie contents, user role claims and model arguments do not authorize access. Parent timetable access does not imply permission to see other students' records.

## Class creation

Example: `Create 4 new Class 8 divisions: 8A, 8B, 8C and 8D.`

The runtime preserves all explicit divisions and verifies the requested count and grade. Section letters are never inferred from a bare grade. It requires exactly one current academic year; if the request omits the year, the backend current year is shown in the preview. If a requested year differs, duplicates exist, or data changes before approval, the operation is rejected or requires a fresh preview. The reference naming rule supports grades 1–12 and one or two uppercase section letters.

`Confirm and create` creates all divisions in one transaction with the existing class uniqueness constraint. Repeating the same approval returns its stored result without repeating the write or audit event. A new preview with the same class names cannot bypass duplicate checks.

## Substitute planning

Example: `Mrs. Fathima is absent tomorrow. Assign suitable substitute teachers automatically.`

The user must explicitly identify the absent teacher and date. The name must resolve uniquely among active teachers in the authenticated school. The runtime resolves relative dates in `School.timezone` (default `Asia/Kolkata`) and fetches the current-year timetable, date-specific substitutions, teacher assignments, availability and daily limits.

Hard constraints:

- No overlapping timetable, substitution or blocked time, including differently numbered periods that overlap by clock time.
- No absent or inactive teacher, including teachers recorded absent through existing substitutions.
- Subject eligibility comes from current school-approved subject assignments. Free text `qualification` is not treated as verified qualification evidence.
- Respect `maxSubstitutePeriods` (default 2) and `maxDailyPeriods` (default 8).
- Never overwrite an existing substitution; never assign the original absent teacher.
- No past-date assignment, incomplete-coverage approval or execution without principal confirmation.

The deterministic planner handles periods with the fewest candidates first and prefers lower teaching workloads, breaking ties by teacher ID. This is a greedy policy, not proof of a global optimum: a gap can require a manual timetable adjustment even when another arrangement might be feasible. A later matching/optimization service can replace the planner without changing the approval flow.

The card shows each period, class, subject and substitute, and explicitly previews recording the original teacher absent. Approval creates `Substitute` rows and the absence record atomically. The weekly timetable stays intact; the application's existing date-specific substitution overlay shows the effective teacher. All scheduling inputs are reloaded and compared before executing the exact approved assignments.

Teacher notifications are **off** for this first integration. No messages are sent. Add an explicit opted-in notification preview and transactional outbox before enabling delivery.

### Availability data

The principal's Copilot page includes a teacher availability form. It shows the proposed teacher/date and full-day absence or time block before the principal clicks **Confirm availability**. Exam duties and other unavailable periods can be entered there. Writes and removals are scoped and audited. Removing an absence with approved substitutions is blocked until those substitutions are explicitly resolved.

Existing exam schedules do not identify teacher invigilation duties, and existing `LeaveRequest` rows concern students. The planner does not pretend to know duties or absences that were never entered. Populate availability before relying on automatic coverage. Workload limits are persistent teacher fields; defaults are visible in the form. A full workload-policy settings editor is a future addition.

## Principal workflows

“Give me today's school status” queries actual approved attendance, known teacher absences, uncovered timetable periods and pending AI approvals. Missing/unapproved registers remain missing. The response states unavailable metrics rather than inventing complaints or homework approvals.

A more involved request can perform several permitted reads. The agent permits at most four Gemini turns and eight tool calls per chat request, validates the returned tool batch before dispatch, and stops immediately when it prepares an approval card. The first release supports one action preview per chat request. After execution, submit a fresh request to get updated school status.

“Automatically arrange substitutes for tomorrow” without a named absent teacher needs clarification in this release. A future all-absent-teachers workflow should fetch recorded absences, plan all affected periods together and approve one atomic plan, rather than run independently competing plans.

## Exact values and conversation state

Validators intentionally accept a narrow syntax: explicit uppercase class divisions, exact teacher names, a supported absence statement, one ISO/relative date, digit period numbers and the current year. Missing, ambiguous or changed values request clarification. Gemini can explain in the user's language, but unsupported operation wording may need an explicit restatement.

Conversation history is bounded and sent as text, never as authorization or executable tool calls from the browser. Exact operation values must occur in the **current** request; a follow-up containing only “four” cannot borrow unverified values from prior model text. `Edit command` cancels the old preview and prepares a new request. Verified multi-turn entity slots can be added later.

## Audit and approval storage

`AiProposal` stores server-normalized changes, ownership, input snapshot hash, stable fingerprint, ten-minute expiry and state (`PENDING`, `EXECUTED`, `CANCELLED`). Fingerprints canonicalize JSON keys so PostgreSQL JSONB ordering cannot invalidate legitimate previews. Every confirmation looks up the same school and proposing user and rechecks authorization, including when returning an executed result.

`AuditLog` records `AI_REQUEST`, `AI_READ`, `AI_PROPOSED`, `AI_EXECUTED`, `AI_CANCELLED`, minimal rejected-request events and manual availability changes. Operational writes, proposal state and success audit records commit together. An audit insertion failure rolls back the school operation. Logs contain action metadata/hashes rather than full prompts, credentials, student records or model thoughts. Database-level access control and retention policy still need production configuration; these application rows are not an externally immutable audit system.

Serializable transactions retry recognized Prisma serialization conflicts up to three times. They provide coherent reads and prevent duplicate confirmation effects. Load-testing with the actual production Postgres and other concurrent school services remains necessary before large rollout.

## Provider interface and budgets

`ModelProvider.generate` returns normalized calls, text and native steps. The Gemini implementation uses the REST Interactions API and `store:false`; it preserves all native steps inside a single request's tool loop, including thought signatures, and returns only user-facing text/previews to the client. It disables any automatic action execution by controlling dispatch itself. No third-party SDK or AI framework is required at runtime.

A future provider can implement the same interface. It must produce registry names and normalized calls; it must not own authorization, approvals or database execution. This integration uses Gemini only and does not deploy or train Qwen.

Persistent `AiUsage` counters limit requests per user and school per school-local day, including failures after a reserved request. Defaults are 20/user and 200/school, configurable with `AI_USER_DAILY_REQUESTS` and `AI_SCHOOL_DAILY_REQUESTS`. Each request has bounded message/history sizes, four model turns, eight tools, a 20-second timeout per model turn and 2,048 output tokens per turn. These are request guards, not an exact currency spending cap or substitute for provider quotas. There are no automatic retries of Gemini calls.

Only minimum permitted school data is returned to the model: aggregate attendance, relevant timetable information and teacher names. Confirm the API project's data-handling settings and the school's rollout policy before using actual records. `store:false` opts out of stored Interactions resources; it does not override Google's service-wide logging, retention or terms.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`.

The database tests run all checked-in PostgreSQL migrations in an isolated in-process PGlite database, then use a Prisma adapter to exercise the real runtime. They cover previews without writes, exact approved execution, repeated confirmation, other-school/actor rejection, tampered payloads, expired/cancelled previews, role/billing/school revocation, stale class/timetable inputs, audit rollback, persistent budgets and fresh teacher/parent scope checks. The adapter is test-only and its driver utility version is aligned with Prisma 6.19.3; production continues to use the existing PostgreSQL client.

Other tests cover date rollover in India, missing/changed values, tool/role restrictions, subject and workload rules, time overlaps, absences, blocked duties, incomplete coverage, bounded Gemini loops, native-step preservation and credential-safe provider errors.

A live Gemini request, authenticated browser interaction against a deployed database and real multi-connection Postgres concurrency are separate rollout checks. Do not describe mocked Gemini tests as a live API connection.

## Official integration references

- Gemini Interactions: https://ai.google.dev/gemini-api/docs/interactions-overview
- Function calls and stateless history: https://ai.google.dev/gemini-api/docs/function-calling
- Interactions REST fields: https://ai.google.dev/api/interactions-api
- Key security: https://ai.google.dev/gemini-api/docs/api-key
