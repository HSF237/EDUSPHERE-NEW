# EduSphere AI Studio — rollout notes

This branch upgrades the assistant experience while preserving existing Prisma models, Gemini server provider, multi-school permissions, school modules and prior migrations. It does **not** change production database schema or introduce third-party credentials.

## Implemented

- New premium visual treatment for the floating assistant, the full Copilot conversation, daily updates, page headers and dashboards. Respects reduced-motion preferences.
- Three transparent assistant modes:
  - **Smart:** handle supported deterministic commands without invoking a model; fall back to Gemini only if separately authorized and enabled.
  - **Free actions:** deterministic school operations only. Does not claim to be generative AI.
  - **Gemini:** existing server-side Gemini integration, disabled by default even when a key exists. It is **not** personal Google account linking. Enabling requires a documented provider eligibility and privacy review (including Google's under-18 app restriction).
- No-key commands:
  - "Show school status today."
  - "Find available teachers in Period 3 today." (staff member must have substitution permission)
  - "Show my updates today."
  - "Mrs. Fathima is absent tomorrow. Prepare substitute coverage." (principal only; name must match an active teacher in the school)
  - "Mark roll 5 and 17 absent and roll 9 late today." (class teacher only, with an explicit confirmation)
- Attendance uses an exact grammar and cross-checks typed/model arguments against the user's text. It resolves the selected class teacher's active class from the authenticated server session, verifies each roll number against the actual active student roster and rejects ambiguous/duplicate roll numbers. A preview is stored as a ten-minute AiProposal without changing the register. A separate authenticated confirmation rechecks the roster, existing register and school role in a serializable transaction; all other active students become present and the full register becomes **PENDING** for principal review.
- Existing principal-only class creation, substitute planning and broad school-action batches remain protected by their original confirmation and audit mechanism.

## Provider connection limitations

- **ChatGPT:** OpenAI's official Sign in with ChatGPT can cover eligible account-based usage, but hosted/paid EduSphere requires eligibility and partner approval. This branch does **not** offer a fake ChatGPT login or collect ChatGPT credentials. See https://developers.openai.com/siwc/quickstart .
- **Gemini:** OAuth identity alone does not grant personal Gemini subscription inference. Google’s Gemini Developer API Additional Terms (effective March 23, 2026) prohibit use in apps directed at or likely to be accessed by users under 18. This includes EduSphere’s student experience. Keep the AI inference feature disabled until Google confirms an eligible integration and an authorized school representative completes a privacy review. Its free tier may use submitted data to improve Google products; never send identifiable student records through that tier.
- School-specific BYOK is **not** implemented. Personal Google AI subscription access is not equivalent to Gemini API inference. Never put an API key in client-side JavaScript or localStorage.
- The free actions do not incur external AI inference costs, but they still consume the normal website and database resources. This is not a guarantee of free commercial hosting or unlimited usage.

## Gemini activation safeguard

`src/lib/ai/provider.ts` requires **both** a server-only `GEMINI_API_KEY` and explicit `EDUSPHERE_GEMINI_AUTHORIZED=true` before inference can be enabled. **Do not set this flag just to bypass the provider restrictions.** It is reserved for use only after documented permission/eligibility for this school-facing application and appropriate privacy agreements. Without that, the UI remains key-free and the server executes deterministic school actions only. The Vercel preview uses fictional data, with no real provider requests.

References: https://ai.google.dev/gemini-api/terms and https://ai.google.dev/gemini-api/docs/pricing

## Before merging into a production school

1. Confirm the new PR passes Prisma generation, TypeScript, tests and build.
2. Test the attendance command as a **class teacher** in two test schools with distinct rosters. Review the proposed roll numbers and ensure the register remains unchanged until approval.
3. Confirm that an expired/stale attendance preview, read-only billing account, student/parent and teacher without a homeroom all fail without a write.
4. Verify principal approval still controls notifications to parents. No parent messages are sent from the new attendance preview or confirmation.
5. Use fictional school records during provider testing, and review data-processing terms and permissions before using children's real information with any third-party model.
6. Confirm no real provider account is presented as connected until an official flow has actually completed.
7. Deploy a preview before merging. Database migration and production rollout remain separate deliberate steps.

## Follow-up work, not represented as complete

- ChatGPT hosted-app program enrollment and approved OpenID Connect / plan-usage credentials; secure account and token lifecycle.
- OAuth/provider entitlements for other AI services when officially available.
- School-level notification outbox for AI-approved substitute assignments.
- Persistent suggestion dismissal/acknowledgment and a full event worker.
- Comprehensive high-volume concurrency testing on production-like PostgreSQL.
- Additional teacher tools beyond attendance and principal tools beyond those already enabled.

No AI subscription, account linking, API key, or database migration is purchased or configured by this branch. Claude integration has been removed. Gemini is the only planned LLM provider; deterministic school actions still work without any external AI inference.
