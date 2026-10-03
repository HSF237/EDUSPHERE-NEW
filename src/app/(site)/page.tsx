import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SceneCampus, SceneClassroom, SceneLaptop, SceneParent, SceneReader, Spot, type SpotName } from "@/components/art";
import { Icon, type IconName } from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata = {
  title: { absolute: "EduSphere — School management for principals, teachers and parents" },
  description: "EduSphere brings attendance, homework, class diary, exams, timetables, leave, messaging and analytics into one secure, mobile-friendly platform — with every school’s data kept separate.",
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{children}</p>;
const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-brand-950 sm:text-4xl">{children}</h2>;
const Lead = ({ children }: { children: React.ReactNode }) => <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">{children}</p>;
const Tick = ({ children }: { children: React.ReactNode }) => <li className="flex gap-2.5"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" className="h-3 w-3" /></span><span>{children}</span></li>;

const STATS: [string, string][] = [["4", "role-based workspaces"], ["20+", "connected modules"], ["100%", "per-school data separation"], ["60 days", "of history in the demo school"], ["Mobile-first", "built for phones, tablets and desktops"]];

const PAIN: [string, string][] = [
  ["Paper registers and lost notebooks", "Attendance written by hand, copied into a file later, and impossible to analyse. A parent asking “was my child present on the 12th?” means a trip to the office."],
  ["Messages scattered over WhatsApp groups", "Homework, circulars, fee reminders and personal queries all land in the same noisy group. Important notices get buried, and there is no record of who saw what."],
  ["Spreadsheets for marks and timetables", "One teacher’s Excel file becomes the only copy of a class’s results. Rank lists, report cards and substitution plans are rebuilt manually every term."],
  ["No single view for the principal", "To know how attendance is trending, which class is falling behind or which teacher is absent today, the principal has to phone around and wait for reports."],
  ["Parents left in the dark", "Parents learn about low marks, repeated absences or pending homework only at the parent–teacher meeting — long after the problem could have been fixed."],
  ["Staff overloaded with admin", "Teachers spend evenings on registers, reports and circulars instead of preparing lessons or helping students who need attention."],
];

const ROLES: { id: string; icon: IconName; title: string; tag: string; scene: React.ReactNode; intro: string; points: string[] }[] = [
  { id: "principal", icon: "shield", title: "Principal / School Admin", tag: "Manages everything, sees everything", scene: <SceneCampus className="mx-auto w-full max-w-sm" />,
    intro: "The principal is the manager of the school workspace — not another teacher. EduSphere gives the principal full oversight and every management tool, while day-to-day classroom work stays with the teachers it belongs to.",
    points: ["Live dashboard with school-wide attendance, pending approvals, leave requests and announcements", "Approve or return attendance registers submitted by class teachers — parents are notified only after approval", "Create and manage students, teachers, classes, subjects and the academic year", "Give each teacher a position (for example Section Head or Exam Coordinator) and switch individual permissions on or off", "Create exams, review results across all classes, and publish them to parents when ready", "Read-only visibility into every class’s diary, homework and discussed portions", "Assign substitutes with automatic clash detection against the substitute’s own timetable", "Reports and analytics: attendance trends, class comparisons, performance distribution and more", "Post announcements to the whole school, only teachers, or only parents — and pin the important ones"] },
  { id: "teacher", icon: "teacher", title: "Teachers", tag: "Class teacher, subject teacher — or both", scene: <SceneLaptop className="mx-auto w-full max-w-sm" />,
    intro: "A teacher’s workspace adapts to the role they actually have. A class teacher gets the full class toolkit. A subject-only teacher gets a focused interface for marks, homework and portions. A teacher who is both simply picks which class to work in.",
    points: ["Class-teacher mode: mark the daily register, manage the class diary, review leave requests and message parents", "Subject-teacher mode: enter exam marks, assign homework and post discussed portions for the subjects you teach", "Workspace switcher for teachers who are class teacher of one class and subject teacher in others", "Attendance in under a minute — everyone defaults to present, tap the exceptions, submit for approval", "Homework with due dates and per-student completion tracking; parents see it instantly", "Discussed portions: record exactly what was taught each day so absent students and parents can catch up", "Extra responsibilities (adding students, creating exams, approving attendance and more) appear only when the principal grants them"] },
  { id: "parent", icon: "users", title: "Parents & Guardians", tag: "Everything about your child, in your pocket", scene: <SceneParent className="mx-auto w-full max-w-sm" />,
    intro: "Parents get a clean, phone-first view of their child’s school life. Multiple children, one login — switch between them with a tap.",
    points: ["Approved attendance history with present, absent, late and excused days and an overall percentage", "Upcoming and overdue homework, with a clear done/pending status for each task", "Class diary and discussed portions — what was taught today, in every subject", "Published exam results, subject-wise marks, grades, rank and printable report cards", "Apply for leave in seconds and see the teacher’s decision with their remarks", "Private one-to-one chat with the class teacher and the principal in a WhatsApp-style messaging centre", "Announcements, parent–teacher meeting slots and notifications in one place"] },
  { id: "platform", icon: "building", title: "Platform administrators", tag: "For networks and groups of schools", scene: <SceneReader className="mx-auto w-full max-w-sm" />,
    intro: "EduSphere is multi-tenant from the ground up. A platform administrator can onboard any number of schools, each with its own principal, staff, parents and data — completely isolated from one another.",
    points: ["Create and activate schools, each with a unique school code", "Provision the first principal account for each school", "See a platform-wide overview of schools, users and students", "Enable or disable a school without touching any other school’s data", "Scale from a single campus to a whole network on the same deployment"] },
];

const MODS: { spot: SpotName; title: string; blurb: string }[] = [
  { spot: "attendance", title: "Attendance with approval", blurb: "Class teachers mark the daily register — everyone starts as present, so only exceptions need a tap (absent, late, excused). Registers go to the principal for approval; only then are parents of absent students notified. Approved registers are locked, and a principal can return one for correction with a note. Percentages and trends update automatically." },
  { spot: "homework", title: "Homework tracking", blurb: "Subject teachers assign homework with a title, instructions and due date. Every student in the class gets a completion record the teacher can tick off. Parents see what is due and what is overdue; the principal gets a read-only view across all classes. Closed homework moves to an archive so lists stay tidy." },
  { spot: "diary", title: "Class diary", blurb: "A dated log of what was taught in every class — subject, topic and notes. Students who missed a day and their parents can catch up without asking around, and the principal can verify coverage at a glance." },
  { spot: "classes", title: "Discussed portions", blurb: "Subject teachers record the portion covered each day (for example “Chapter 7: Quadratic equations — worked examples 1–6”). It is searchable by class and subject, and it gives parents and the school an honest picture of syllabus progress." },
  { spot: "timetable", title: "Timetables", blurb: "Weekly, period-by-period timetables for every class and teacher, with start and end times. Teachers see their own day; parents see their child’s class. Clashes are prevented because one teacher cannot be in two classes in the same period." },
  { spot: "substitutes", title: "Substitute management", blurb: "When a teacher is absent, the principal (or a teacher with that permission) picks the period, date and a substitute. EduSphere blocks the assignment if the substitute is already teaching at that time, notifies them, and shows the cover plan to everyone concerned. Filters by teacher, class, day and subject keep this fast even in large schools." },
  { spot: "exams", title: "Exams, marks & report cards", blurb: "Create exams per class with maximum and pass marks and a subject-wise schedule. Subject teachers enter marks only for their own subjects. Totals, percentages, grades and ranks are calculated automatically. Results stay hidden until the principal publishes them, then parents are notified and can open printable report cards." },
  { spot: "leave", title: "Leave requests", blurb: "Parents submit leave with dates and a reason. The class teacher approves or declines with a remark, the parent is notified, and approved days are automatically recorded as excused in attendance — no double entry." },
  { spot: "messages", title: "Messaging centre", blurb: "A WhatsApp-style inbox: a searchable list of chats and contacts on the left, the conversation on the right, and a full-screen chat on phones. Read receipts, unread counts, date separators and live refresh. Who can message whom is controlled by role — parents reach their child’s teachers and the principal; teachers reach their parents; the principal reaches everyone." },
  { spot: "announcements", title: "Announcements", blurb: "Publish notices to the whole school, to parents only, or to teachers only. Pin the important ones so they stay on top, and keep a dated archive so nothing is ever “lost in the group”." },
  { spot: "ptm", title: "Parent–teacher meetings", blurb: "Create a meeting day, generate time slots per teacher, and let parents book their own. No more phone tag, no double bookings, and teachers can see their schedule before the day starts." },
  { spot: "notifications", title: "Notifications", blurb: "In-app alerts for approved or returned registers, new homework, published results, leave decisions, new messages and substitutions — each linking straight to the item. An unread badge keeps important things visible." },
  { spot: "students", title: "Student records", blurb: "Admission number, roll number, class, gender, date of birth, blood group, address and guardian links — all in one place. Search and filter by class, move students between classes, and mark students inactive without losing their history." },
  { spot: "teachers", title: "Teacher profiles, positions & access", blurb: "Store each teacher’s qualification, employee number and joining date. Assign a position and toggle individual permissions — add students, add teachers, manage classes, create exams, approve attendance, post announcements, run reports, handle substitutes and parent meetings. Everything else stays the principal’s." },
  { spot: "reports", title: "Reports & analytics", blurb: "School-wide attendance trends over time, class-by-class comparison, students with chronic absence, performance distribution by exam and subject, and top and bottom performers — presented as clear charts and tables rather than raw data." },
  { spot: "settings", title: "Settings, roles & audit trail", blurb: "Profile and password management for every user, and an audit trail of significant actions (logins, approvals, publishing results, leave decisions, announcements) so a school can always answer “who did what, and when?”." },
];

const PERMS: [string, string][] = [["Manage students", "Add, edit, move or deactivate student records"], ["Manage teachers", "Add and update teacher profiles"], ["Manage classes & subjects", "Create classes, assign subjects and class teachers"], ["Create exams & publish results", "Schedule exams, review results, publish to parents"], ["Approve attendance", "Review submitted registers and return them for correction"], ["Post announcements", "Publish notices to the school, parents or teachers"], ["View reports", "Open school-wide analytics and reports"], ["Handle substitutes", "Assign cover for absent teachers"], ["Run parent meetings", "Create meeting days and manage slots"]];

const STEPS: [string, string][] = [
  ["Set up the school", "A platform administrator creates your school and the principal’s account. The principal signs in, sets the academic year and reviews the school profile."],
  ["Create classes and subjects", "Add classes and sections, define the subjects taught, and name a class teacher for each class."],
  ["Add teachers and give them positions", "Create teacher accounts, assign them to subjects and classes, and decide what extra access each person needs."],
  ["Import students and link parents", "Add students class by class and link each to a parent or guardian account. Siblings share one parent login."],
  ["Publish the timetable", "Set up period-by-period timetables so teachers, parents and the substitute system all work from the same schedule."],
  ["Go live", "Teachers start marking attendance and posting homework; the principal approves; parents get notified. Everyone uses the same system from day one."],
];

const COMPARE: [string, string, string, string][] = [
  ["Daily attendance", "Paper register, copied later", "Photo in a group", "Tap-to-mark, principal-approved, instantly analysed"],
  ["Parent notified of absence", "Phone call, if at all", "Manual message", "Automatic after approval"],
  ["Homework", "Written on the board", "Posted in a group", "Per-class, per-student tracking"],
  ["Marks & report cards", "Hand-written, copied", "Excel files per teacher", "Per-subject entry, automatic ranks, printable reports"],
  ["Leave", "Paper note", "Message to the teacher", "Request → decision → excused attendance"],
  ["Principal’s overview", "Wait for reports", "Not available", "Live dashboard and analytics"],
  ["Data separation between schools", "—", "—", "Enforced on every query"],
  ["History and audit", "Lost with the notebook", "Scroll back", "Searchable records and audit trail"],
];

const FAQ: [string, string][] = [
  ["What is EduSphere?", "EduSphere is a web-based school management platform. It combines attendance, homework, class diary, discussed portions, timetables, substitutes, exams and report cards, leave, announcements, parent–teacher meetings, private messaging, notifications and analytics in one system for principals, teachers and parents."],
  ["Who can use it?", "Schools of any size. The same platform works for a single school and for a network of schools, because every school is a separate, isolated workspace on the platform."],
  ["Do we need to install anything?", "No. EduSphere runs in the browser on phones, tablets and computers. There is nothing to install and nothing for your staff to maintain."],
  ["Does it work well on mobile phones?", "Yes — mobile is a first-class design target. Parents and teachers get thumb-friendly navigation, a bottom bar for the most-used pages, full-screen chat, and large tap targets."],
  ["Can a principal also mark attendance or post homework?", "No, by design. The principal’s role is management and oversight: approving registers, publishing results, managing people and seeing analytics. Marking registers, posting diary entries, assigning homework and entering marks belong to the teachers responsible for them."],
  ["What is the difference between a class teacher and a subject teacher?", "A class teacher is responsible for one class’s daily register, diary, leave requests and parent communication. A subject teacher teaches a subject in one or more classes and works with homework, marks and discussed portions. One person can be both; the workspace switcher lets them choose which class to work in, and the interface changes accordingly."],
  ["Can the principal give a teacher extra responsibilities?", "Yes. Each teacher can be given a position (such as Section Head or Exam Coordinator) and any combination of permissions — adding students or teachers, managing classes, creating exams, approving attendance, posting announcements, viewing reports, handling substitutes and running parent meetings. Permissions can be turned on or off at any time."],
  ["How is our school’s data kept separate from other schools?", "Every record belongs to exactly one school, and every query is scoped to the signed-in user’s school. Users can only reach data inside their own school, and roles further restrict what they can see and do within it."],
  ["Who can see my child’s information?", "Only the child’s parents or guardians linked to that student, the teachers responsible for the child’s class and subjects, and the school’s principal. Other parents cannot see another child’s records. See our Student & Children’s Data notice for details."],
  ["How are passwords and sessions protected?", "Passwords are stored only as salted one-way hashes (never in plain text). Sessions use signed, HTTP-only cookies that expire, accounts can be deactivated instantly, and the connection is encrypted with HTTPS. See the Security page for more."],
  ["Can parents see results before the school publishes them?", "No. Exam marks stay invisible to parents until the principal (or a teacher with that permission) publishes the exam."],
  ["What happens when a register is approved?", "It becomes locked. If a mistake is found, the principal returns it to the class teacher with a note; the teacher corrects and resubmits, and the principal approves again. Parents of absent students are notified only after approval."],
  ["Can one parent have more than one child at the school?", "Yes. A single parent login can be linked to several students — including children in different classes — and switch between them from any page."],
  ["Is there a mobile app?", "EduSphere is a responsive web application that behaves like an app on phones. You can add it to your home screen from the browser menu."],
  ["How do we get started or see a demo?", "Contact us by email or WhatsApp and we will arrange a walkthrough. A fully populated demo school is available so you can try every role before deciding."],
  ["What does it cost?", "Pricing depends on the size of the school or network and the support you need. Get in touch and we will share a clear, written quote with no hidden charges."],
  ["Who owns our data, and can we take it with us?", "Your school owns its data. We act as a service provider that stores and processes it on your behalf. On request we will provide an export of your school’s records and delete them when the agreement ends, subject to the retention terms in our Privacy Policy."],
  ["Which laws and standards do you design for?", "EduSphere is built with India’s Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 in mind, and with general good practice such as data minimisation, role-based access and purpose limitation. Each school remains responsible for its own lawful basis and consents for the data it collects."],
];

export default async function Home() {
  if (await getSession()) redirect("/dashboard");
  return (
    <>
      {/* HERO */}
      <section className="blob-bg relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sun-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">Complete school management · Multi-school ready</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-950 sm:text-5xl lg:text-6xl">Run every school from one calm, clear place.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">EduSphere brings attendance, homework, class diary, exams, timetables, leave and parent communication into one secure platform — so principals can manage, teachers can teach, and parents always know what is happening.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/login" className="btn !px-6 !py-3 text-base">Sign in</Link><Link href="/contact" className="btn-ghost !px-6 !py-3 text-base">Request a demo</Link></div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
              {["Mobile-first", "Role-based access", "Separate data for every school", "Encrypted connections"].map((t) => <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-emerald-600" />{t}</li>)}
            </ul>
          </div>
          <SceneClassroom className="animate-float mx-auto w-full max-w-xl" />
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-100 bg-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-3 lg:grid-cols-5">
          {STATS.map(([v, l]) => <div key={l} className="text-center"><dt className="text-2xl font-extrabold text-brand-700 sm:text-3xl">{v}</dt><dd className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{l}</dd></div>)}
        </dl>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <Eyebrow>The problem</Eyebrow>
        <H2>Running a school should not mean running after information.</H2>
        <Lead>Most schools still run on a patchwork of paper registers, spreadsheets and chat groups. It works until it doesn’t — and the cost is paid in lost time, missed signals and frustrated families.</Lead>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PAIN.map(([t, d]) => <div key={t} className="card p-6"><h3 className="font-bold text-brand-950">{t}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p></div>)}
        </div>
      </section>

      {/* SOLUTION */}
      <section className="bg-brand-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">The solution</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">One system. Four roles. Every school day, connected.</h2>
            <p className="mt-4 text-base leading-relaxed text-brand-100 sm:text-lg">EduSphere replaces the patchwork with a single source of truth. When a teacher marks attendance, the principal sees it. When the principal approves it, parents are told. When results are published, report cards appear. Nothing is typed twice and nothing is lost.</p>
            <ul className="mt-6 space-y-3 text-brand-100">
              {["Teachers record once; everyone else sees it in the right place", "Approval steps keep the principal in control without becoming a bottleneck", "Parents get timely, trustworthy information instead of rumours", "Analytics build themselves from the work already being done"].map((t) => <li key={t} className="flex gap-3"><Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-sun-400" />{t}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-300">A day in the life</p>
            <ol className="mt-4 space-y-4 text-sm leading-relaxed text-brand-100">
              {[["8:30", "The class teacher marks the register — everyone starts present, she taps the three who are absent — and submits."], ["9:15", "The principal sees “9 registers awaiting approval” on the dashboard and approves them in one pass."], ["9:16", "Parents of absent children get a notification. No phone calls were needed."], ["11:00", "A subject teacher posts today’s discussed portion and assigns homework, due in three days."], ["16:00", "A parent opens the app on her phone, sees the homework and the portion, and messages the teacher a question."], ["Weekly", "The principal opens Reports to compare class attendance and spot students who need attention."]].map(([t, d]) => <li key={t} className="flex gap-4"><span className="w-14 shrink-0 font-extrabold text-sun-400">{t}</span><span>{d}</span></li>)}
            </ol>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <Eyebrow>Who it’s for</Eyebrow>
        <H2>A workspace shaped around each person’s job.</H2>
        <Lead>EduSphere does not give everyone the same screen with different buttons greyed out. Each role gets its own navigation, dashboard and tools — focused on what that person actually needs to do.</Lead>
        <div className="mt-14 space-y-20">
          {ROLES.map((r, i) => (
            <article key={r.id} id={r.id} className={`grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700"><Icon name={r.icon} className="h-4 w-4" />{r.tag}</span>
                <h3 className="mt-3 text-2xl font-extrabold text-brand-950 sm:text-3xl">{r.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{r.intro}</p>
                <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-slate-700">{r.points.map((p) => <Tick key={p}>{p}</Tick>)}</ul>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-brand-50 to-sun-50 p-6 sm:p-10">{r.scene}</div>
            </article>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="scroll-mt-20 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <Eyebrow>Every feature, explained</Eyebrow>
          <H2>Sixteen modules that work as one.</H2>
          <Lead>Each module is useful on its own and more powerful together. Here is exactly what every one does, who uses it, and how it connects to the rest of the school.</Lead>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {MODS.map((m, i) => (
              <article key={m.title} className="card flex flex-col gap-4 p-6 transition hover:-translate-y-1 hover:shadow-lift sm:flex-row">
                <Spot name={m.spot} className="h-28 w-auto shrink-0 self-start sm:h-32" />
                <div><p className="text-xs font-bold text-brand-500">{String(i + 1).padStart(2, "0")}</p><h3 className="text-lg font-extrabold text-brand-950">{m.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{m.blurb}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ACCESS CONTROL */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Positions & permissions</Eyebrow>
            <H2>The principal decides who can do what.</H2>
            <Lead>Schools are not flat. A Section Head, an Exam Coordinator and a new subject teacher need different access. Give each teacher a position, then switch individual permissions on or off like a settings panel — no developers, no tickets.</Lead>
            <p className="mt-4 leading-relaxed text-slate-600">Permissions only ever add responsibilities; they never turn a teacher into a principal. Class-level work such as the daily register, diary and homework always stays with the teacher assigned to that class or subject.</p>
            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm leading-relaxed text-slate-700"><b className="text-brand-950">Example.</b> Ms. Iyer teaches Mathematics to grades 9 and 10 and is the Exam Coordinator. The principal switches on “Create exams & publish results” and “View reports” for her. She sees an extra Exams section and Reports in her menu — nothing else changes.</div>
          </div>
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-sm font-bold text-brand-950">Access toggles the principal controls</div>
            <ul className="divide-y divide-slate-100">
              {PERMS.map(([t, d]) => (
                <li key={t} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div><div className="text-sm font-semibold text-slate-800">{t}</div><div className="text-xs text-slate-500">{d}</div></div>
                  <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-brand-600"><span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TEACHER MODES */}
      <section className="bg-brand-50/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <Eyebrow>Smart teacher workspaces</Eyebrow>
          <H2>Class teacher, subject teacher — or both.</H2>
          <Lead>Real timetables are messy. One teacher may be class teacher of 8A and also teach Science in 7B and 9A. EduSphere handles that with a simple workspace switcher.</Lead>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[["Class teacher", "Own a class", ["Daily register", "Class diary", "Leave decisions", "Student list", "Parent messaging", "Homework & marks for own subjects"]], ["Subject teacher", "Teach a subject in a class", ["Enter marks for own subjects", "Assign homework", "Post discussed portions", "Message class parents", "Focused, uncluttered menu"]], ["Both", "Pick the class you’re working in", ["Select a class from the switcher", "Your own class → class-teacher tools", "Another class → subject-teacher tools", "The menu and dashboard change instantly"]]].map(([t, s, l]) => (
              <div key={t as string} className="card p-6"><h3 className="text-lg font-extrabold text-brand-950">{t as string}</h3><p className="text-sm font-semibold text-brand-600">{s as string}</p><ul className="mt-4 space-y-2.5 text-sm text-slate-700">{(l as string[]).map((x) => <Tick key={x}>{x}</Tick>)}</ul></div>
            ))}
          </div>
        </div>
      </section>

      {/* ANALYTICS */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Analytics</Eyebrow>
            <H2>See the whole school at a glance.</H2>
            <Lead>Because teachers record work in EduSphere as they go, the principal gets analytics without anyone compiling a single report.</Lead>
            <ul className="mt-6 space-y-3 text-[15px] text-slate-700">
              {["Attendance trend over the last 30 and 60 days, with a moving average that smooths out single bad days", "Class-by-class attendance ranking to see where help is needed", "Students with repeated absence flagged early", "Exam performance distribution by class and subject; pass percentage and averages", "Top performers and students at risk in every exam", "Pending approvals, leave requests and homework due — the day’s to-do list on one page"].map((t) => <Tick key={t}>{t}</Tick>)}
            </ul>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-brand-950">Attendance — last 30 days</p><span className="text-xs text-slate-400">% present or late</span></div>
            <svg viewBox="0 0 400 160" className="mt-4 w-full" role="img" aria-label="Illustrative attendance trend chart">
              <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity=".28" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
              {[30, 70, 110].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#e2e8f0" />)}
              <path d="M0 50 L25 44 L50 52 L75 40 L100 46 L125 38 L150 70 L175 96 L200 88 L225 62 L250 48 L275 42 L300 50 L325 36 L350 44 L375 34 L400 40 V160 H0Z" fill="url(#g)" />
              <path d="M0 50 L25 44 L50 52 L75 40 L100 46 L125 38 L150 70 L175 96 L200 88 L225 62 L250 48 L275 42 L300 50 L325 36 L350 44 L375 34 L400 40" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[["93%", "30-day average"], ["9", "to approve"], ["4", "leave pending"]].map(([v, l]) => <div key={l} className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-extrabold text-brand-700">{v}</div><div className="text-xs text-slate-500">{l}</div></div>)}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">Illustrative view — your dashboard shows your school’s live data.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <Eyebrow>Getting started</Eyebrow>
          <H2>From sign-up to first register in six steps.</H2>
          <Lead>There is no complex installation or training programme. A school can be set up in days and teachers are productive within their first session.</Lead>
          <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map(([t, d], i) => <li key={t} className="card relative p-6 pt-10"><span className="absolute -top-4 left-6 grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-lg font-extrabold text-white shadow-lift">{i + 1}</span><h3 className="font-bold text-brand-950">{t}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p></li>)}
          </ol>
        </div>
      </section>

      {/* MOBILE */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="mx-auto w-64 rounded-[2.5rem] border-[10px] border-brand-950 bg-white p-3 shadow-lift">
              <div className="rounded-2xl bg-[#eceefa] p-3">
                <div className="mb-3 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-xs font-bold text-white">AI</span><div><div className="text-xs font-bold text-slate-800">Class teacher</div><div className="text-[10px] text-slate-500">Teacher</div></div></div>
                <div className="space-y-2 text-[11px]">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white p-2.5 text-slate-700 shadow-sm">Homework for Friday is on the app. Please check the Science portion.</div>
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 p-2.5 text-white shadow-sm">Thank you, seen it. Will he need the lab record too? <span className="block text-right text-[9px] text-indigo-200">✓✓</span></div>
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white p-2.5 text-slate-700 shadow-sm">Yes, bring it on Monday.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>Designed for phones</Eyebrow>
            <H2>Most parents will use it on a phone — so we started there.</H2>
            <Lead>Every page is built to be comfortable on a small screen, not squeezed onto one.</Lead>
            <ul className="mt-6 space-y-3 text-[15px] text-slate-700">
              {["Bottom navigation puts the most-used pages under your thumb", "Slide-out menu with every module and your profile", "Full-screen WhatsApp-style chat with a back button and a keyboard-friendly composer", "Large tap targets and readable text that never forces pinch-to-zoom", "Tables turn into scrollable cards so nothing is cut off", "Add to your home screen for one-tap access"].map((t) => <Tick key={t}>{t}</Tick>)}
            </ul>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="scroll-mt-20 bg-brand-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Security & privacy</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">Student data deserves more care than most data. We treat it that way.</h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-brand-100 sm:text-lg">Schools hold information about children and families. EduSphere is designed around the principle that people should see only what they need, and that every access is accountable.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["shield", "Strict school separation", "Every record belongs to one school and every query is scoped to it. One school can never see another’s students, staff or messages."],
              ["users", "Role-based access", "Principal, teacher, parent and platform administrator each see only their own tools — enforced on the server, not just hidden in the menu."],
              ["check", "Least privilege", "Parents see only their own children. Teachers see only their classes and subjects. Extra access has to be granted explicitly by the principal."],
              ["bolt", "Protected sign-in", "Passwords are stored only as salted one-way hashes. Sessions use signed, HTTP-only cookies that expire, and deactivated accounts lose access immediately."],
              ["clipboard", "Audit trail", "Significant actions such as logins, approvals, publishing results and leave decisions are recorded so the school can always see who did what."],
              ["building", "Encrypted in transit", "All traffic is served over HTTPS. Responses include protections against clickjacking and content sniffing."],
            ].map(([i, t, d]) => <div key={t} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sun-400"><Icon name={i as IconName} /></span><h3 className="mt-4 font-bold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-brand-100">{d}</p></div>)}
          </div>
          <p className="mt-10 text-sm text-brand-200">Read the full documents: <Link className="font-semibold text-white underline" href="/privacy">Privacy Policy</Link> · <Link className="font-semibold text-white underline" href="/student-data">Student & Children’s Data</Link> · <Link className="font-semibold text-white underline" href="/security">Security</Link> · <Link className="font-semibold text-white underline" href="/terms">Terms & Conditions</Link></p>
        </div>
      </section>

      {/* COMPARE */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <Eyebrow>Why switch</Eyebrow>
        <H2>How EduSphere compares with the usual ways of working.</H2>
        <div className="card mt-10 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Task</th><th className="px-5 py-3">Paper</th><th className="px-5 py-3">Chat groups & spreadsheets</th><th className="px-5 py-3 text-brand-700">EduSphere</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARE.map(([a, b, c, d]) => <tr key={a}><td className="px-5 py-3.5 font-semibold text-slate-800">{a}</td><td className="px-5 py-3.5 text-slate-500">{b}</td><td className="px-5 py-3.5 text-slate-500">{c}</td><td className="bg-brand-50/50 px-5 py-3.5 font-medium text-brand-900">{d}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {/* SCALE */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <Eyebrow>Built to grow</Eyebrow>
          <H2>From one classroom to a network of schools.</H2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[["Single school", "A principal, a few dozen teachers and several hundred families. Be productive in days with a clean, uncluttered interface."], ["School groups & trusts", "Each campus is its own isolated workspace under one platform, so you can onboard new branches without new infrastructure."], ["Large schools", "Searchable lists, filters on busy screens such as substitutes, and fast dashboards keep working at 700 students and beyond."]].map(([t, d]) => <div key={t} className="card p-6"><h3 className="text-lg font-extrabold text-brand-950">{t}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p></div>)}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-slate-600">EduSphere is built with Next.js and TypeScript on a PostgreSQL database, hosted on managed cloud infrastructure, so capacity can be increased as your school grows without changing how your staff work.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 mx-auto max-w-4xl px-5 py-16 sm:py-24">
        <div className="text-center"><Eyebrow>Frequently asked questions</Eyebrow><H2>Everything you might want to ask.</H2></div>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-5 py-4 open:bg-slate-50/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-brand-950 [&::-webkit-details-marker]:hidden">{q}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 transition group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-[15px] leading-7 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* LEGAL STRIP */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-xl font-extrabold text-brand-950">Transparent by default</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">We believe schools and families should be able to read, in plain language, how their data is used. Our legal documents are written to be understood.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[["/terms", "Terms & Conditions", "The agreement between your school, its users and us."], ["/privacy", "Privacy Policy", "What we collect, why, and the rights you have."], ["/student-data", "Student & Children’s Data", "Special protections for children’s information."], ["/cookies", "Cookie Policy", "The few cookies we use, and why."], ["/acceptable-use", "Acceptable Use", "What is and isn’t allowed on the platform."], ["/security", "Security", "How we protect the platform and report issues."]].map(([h, t, d]) => <Link key={h} href={h} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lift"><div className="font-bold text-brand-700">{t} →</div><div className="mt-1 text-sm text-slate-600">{d}</div></Link>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="blob-bg bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:py-24">
          <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">Ready to bring your school together?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">See EduSphere with a fully populated demo school — or tell us about your school and we will set up your workspace.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="inline-flex min-h-[48px] items-center rounded-xl bg-white px-7 text-base font-bold text-brand-700 shadow-lift hover:bg-brand-50">Request a demo</Link>
            <a href={`https://wa.me/${SITE.whatsapp}`} className="inline-flex min-h-[48px] items-center rounded-xl border border-white/40 px-7 text-base font-bold text-white hover:bg-white/10">Chat on WhatsApp</a>
            <Link href="/login" className="inline-flex min-h-[48px] items-center rounded-xl border border-white/40 px-7 text-base font-bold text-white hover:bg-white/10">Sign in</Link>
          </div>
        </div>
      </section>
    </>
  );
}
