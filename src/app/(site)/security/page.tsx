import { LegalDoc, type LegalSection } from "@/components/site/legal";
import { SITE } from "@/lib/site";

export const metadata = { title: "Security", description: "How EduSphere protects school data, and how to report a vulnerability." };

const S: LegalSection[] = [
  { id: "approach", title: "Our approach", body: ["Schools trust EduSphere with information about children and families. We design every feature around three questions: who needs to see this, how do we prove who they are, and how will the school know who did what? Security is built into the product rather than added afterwards."] },
  { id: "separation", title: "School separation", body: ["Every record belongs to exactly one school. Every query is scoped to the signed-in user’s school on the server, so one school’s users cannot reach another school’s students, staff, messages or reports, even if they know an identifier."] },
  { id: "access", title: "Access control", body: [["Role-based access: principal, teacher, parent and platform administrator each have separate capabilities, checked on the server for every page and action — not just hidden in the interface;", "Least privilege: parents see only their own children; teachers see only their class and subject workspace; principals oversee but do not perform teachers’ classroom actions;", "Granted permissions: extra responsibilities for a teacher exist only when the principal explicitly switches them on;", "Approval and publication gates: attendance is locked after approval; exam results stay hidden from parents until published;", "Immediate deactivation: disabling an account removes access on the next request."]] },
  { id: "auth", title: "Authentication and sessions", body: [["Passwords are stored only as salted one-way hashes; we cannot read them;", "Sessions use signed tokens in HTTP-only, same-site cookies, marked secure in production, that expire after seven days;", "Every request re-checks that the account still exists and is active;", "Users can sign out at any time to end the session in their browser."]] },
  { id: "transport", title: "Transport and application protections", body: [["All traffic is served over HTTPS;", "Responses carry protections against clickjacking and content-type sniffing, and the framework is configured not to advertise its version;", "Input from users is validated on the server before it is stored;", "Database access uses parameterised queries through an ORM, which prevents SQL injection."]] },
  { id: "infra", title: "Infrastructure and backups", body: ["The application runs on managed cloud hosting and a managed PostgreSQL database operated by reputable infrastructure providers, which provide physical security, network protection and routine backups. Access to production systems is limited to authorised personnel."] },
  { id: "audit", title: "Audit trail", body: ["Significant actions — sign-ins, attendance approvals, publishing results, leave decisions, announcements — are recorded with the user and time so a school can review who did what."] },
  { id: "responsibilities", title: "Shared responsibility", body: ["Security is shared. Schools should: give accounts only to people who need them; use the permission toggles carefully and review them regularly; deactivate leavers promptly; and train staff to protect their credentials. Users should: use a strong, unique password; never share it; avoid public computers; and sign out on shared devices."] },
  { id: "incident", title: "Incident response", body: ["If we discover a security incident that affects School Data, we will contain it, investigate, fix the cause and notify affected schools without undue delay, with the information they need to meet their own legal duties."] },
  { id: "report", title: "Reporting a vulnerability", body: [
    `If you believe you have found a security problem, please email ${SITE.email} with the subject “Security report”. Include what you found, how to reproduce it and the potential impact.`,
    ["Give us a reasonable chance to fix the issue before disclosing it publicly;", "Do not access, change or delete data that is not yours, and do not disrupt the Service;", "Test only with your own account or a demo school.", "If you follow these guidelines we will not take legal action against you for good-faith research, and we will credit you if you wish."],
  ] },
  { id: "limits", title: "Honest limits", body: ["No system is perfectly secure. We continue to improve our controls — for example additional sign-in protections, rate limiting and activity alerts — and will update this page as we do."] },
];

export default function Security() {
  return <LegalDoc path="/security" title="Security" intro="How EduSphere protects school data through separation, least-privilege access, protected sign-in and accountability — and how to report a concern." sections={S} />;
}
