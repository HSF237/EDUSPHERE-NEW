export type Step = { kind: "center" | "click" | "page"; nav?: string; card?: string; chapter: string; title: string; body: string };
type TourRole = "ADMIN" | "TEACHER" | "PARENT";
type Page = { card?: string; title: string; body: string };
type Item = { nav: string; chapter: string; label: string; why: string; pages: Page[] };

const ADMIN: Item[] = [
  { nav: "/dashboard", chapter: "Overview", label: "Dashboard", why: "This is your home screen.", pages: [{ title: "Your dashboard", body: "Today’s attendance, pending approvals, fee collection and quick shortcuts live here. Come back to it any time with this menu item." }] },
  { nav: "/classes", chapter: "Setup 1 · Classes & subjects", label: "Classes & subjects", why: "Start here. Everything else depends on it.", pages: [
    { card: "Add class", title: "Step 1: create every class", body: "Add each class and section, for example Grade 5 / A. Teachers can only pick from classes that exist, so create ALL your classes before inviting anyone." },
    { card: "Add subject", title: "Step 2: add your subjects", body: "Add every subject with a short code such as ENG or MAT. Teachers choose their subjects from this list when they sign up, so add them now." },
    { card: "Assign subject teacher", title: "Later: assign who teaches what", body: "After teachers have joined, you can set the subject teacher for each class here. Teachers can also pick their own class and subject while signing up." },
  ] },
  { nav: "/teachers", chapter: "Setup 2 · Teachers", label: "Teachers", why: "Only after classes and subjects exist.", pages: [
    { card: "Invite teachers with a secret link", title: "Step 3: invite your teachers", body: "Press the button to make a one-time link and send it on WhatsApp. The teacher opens it, enters their details and chooses their class and subject while signing up. This is locked until you have at least one class and one subject." },
    { card: "Add teacher manually", title: "Or add a teacher yourself", body: "If a teacher can’t use a link, add them here. They get a temporary password and must change it at first sign-in." },
  ] },
  { nav: "/students", chapter: "Setup 3 · Students & parents", label: "Students", why: "Add pupils, then bring their parents in.", pages: [
    { card: "Add student", title: "Step 4: add your students", body: "Add each student with their class, roll number and admission number. You can import the rest later and print ID cards." },
    { card: "Invite parents with secret links", title: "Step 5: invite parents", body: "Make a link for each child and send it to the parent. When they open it they create their login and see only their own child." },
  ] },
  { nav: "/attendance", chapter: "Daily work", label: "Attendance", why: "Daily attendance.", pages: [{ title: "Attendance and approvals", body: "Class teachers mark attendance every day and it comes to you for approval here. Approved absences can alert parents automatically." }] },
  { nav: "/homework", chapter: "Daily work", label: "Homework", why: "See what is assigned.", pages: [{ title: "Homework", body: "Teachers post homework with a due date and optional attachment. You can see everything assigned across all classes." }] },
  { nav: "/portions", chapter: "Daily work", label: "Discussed portions", why: "Track syllabus progress.", pages: [{ title: "Discussed portions", body: "Teachers log what they covered in each class, so you can check the syllabus is on track." }] },
  { nav: "/diary", chapter: "Daily work", label: "Class diary", why: "The daily class diary.", pages: [{ title: "Class diary", body: "A day-by-day record of lessons for each class, visible to parents." }] },
  { nav: "/timetable", chapter: "Daily work", label: "Timetable", why: "Weekly timetable.", pages: [{ title: "Timetable", body: "Build the weekly timetable for each class. Teachers and parents see it automatically." }] },
  { nav: "/exams", chapter: "Academics", label: "Exams & marks", why: "Exams and report cards.", pages: [{ title: "Exams and marks", body: "Create an exam, let teachers enter marks, then publish. Each student gets a printable report card with your logo and signature." }] },
  { nav: "/leave", chapter: "Academics", label: "Leave", why: "Student leave requests.", pages: [{ title: "Leave requests", body: "Parents apply for leave and it reaches the class teacher and you. Approve or reject with a note." }] },
  { nav: "/fees", chapter: "Connect", label: "Fees", why: "Fee collection.", pages: [{ title: "Fees", body: "Set up fee items, record payments, print receipts and see who still owes what. Parents can see their own dues and receipts." }] },
  { nav: "/messages", chapter: "Connect", label: "Messages", why: "Chat with staff and parents.", pages: [{ title: "Messages", body: "One-to-one chat with teachers and parents. You’ll see sent, delivered and read ticks like WhatsApp." }] },
  { nav: "/announcements", chapter: "Connect", label: "Announcements", why: "Notices to everyone.", pages: [{ title: "Announcements", body: "Post a notice to the whole school, only teachers, only parents, or a single class. You can pin important ones and attach a file." }] },
  { nav: "/ptm", chapter: "Connect", label: "Parent meetings", why: "Parent-teacher meetings.", pages: [{ title: "Parent meetings", body: "Create a meeting day and parents book a time slot with the teacher." }] },
  { nav: "/alerts", chapter: "School", label: "Parent alerts", why: "WhatsApp alerts to parents.", pages: [{ title: "Parent alerts", body: "Absence and other alerts prepared for parents. With a provider connected they send automatically; otherwise send them in one tap on WhatsApp." }] },
  { nav: "/substitutes", chapter: "School", label: "Substitutes", why: "When a teacher is away.", pages: [{ title: "Substitutes", body: "When a teacher is absent, assign a substitute for each period they miss." }] },
  { nav: "/reports", chapter: "School", label: "Reports", why: "School-wide reports.", pages: [{ title: "Reports", body: "Attendance, results and fee summaries for the whole school." }] },
  { nav: "/billing", chapter: "Account", label: "Billing", why: "Your plan and invoices.", pages: [{ title: "Billing", body: "See your plan, renew, download invoices and read our promise about your data: cancelling never deletes anything." }] },
  { nav: "/settings", chapter: "Account", label: "Settings", why: "Make it yours.", pages: [{ title: "Settings", body: "Add your school logo, brand colour and principal signature for report cards and ID cards. Change your password and language here too." }] },
];

const TEACHER: Item[] = [
  { nav: "/dashboard", chapter: "Overview", label: "Dashboard", why: "Your home screen.", pages: [{ title: "Your dashboard", body: "Today’s classes, pending work and shortcuts. If you teach in more than one class, switch class from the selector at the top." }] },
  { nav: "/attendance", chapter: "Daily work", label: "Attendance", why: "Mark attendance every day.", pages: [{ title: "Attendance", body: "Mark who is present, absent or late for your class, then submit it. The principal approves it." }] },
  { nav: "/homework", chapter: "Daily work", label: "Homework", why: "Set homework.", pages: [{ title: "Homework", body: "Post homework for your class and subject with a due date, and tick who has done it." }] },
  { nav: "/portions", chapter: "Daily work", label: "Discussed portions", why: "Log what you taught.", pages: [{ title: "Discussed portions", body: "Write down the topics you covered today. It takes a few seconds and keeps the syllabus on track." }] },
  { nav: "/diary", chapter: "Daily work", label: "Class diary", why: "The class diary.", pages: [{ title: "Class diary", body: "Class teachers write the daily diary that parents read." }] },
  { nav: "/timetable", chapter: "Daily work", label: "Timetable", why: "Your timetable.", pages: [{ title: "Timetable", body: "Your periods for the week, including any substitute duty you have been given." }] },
  { nav: "/exams", chapter: "Academics", label: "Exams & marks", why: "Enter marks.", pages: [{ title: "Exams and marks", body: "Enter marks for your subject. Class teachers can also print report cards for their class." }] },
  { nav: "/leave", chapter: "Academics", label: "Leave", why: "Student leave.", pages: [{ title: "Leave requests", body: "Parents’ leave requests for your class arrive here. Approve or reject them." }] },
  { nav: "/students", chapter: "School", label: "Students", why: "Your class list.", pages: [{ title: "Students", body: "Your class list with parent contacts. Class teachers can invite parents with a secret link from here." }] },
  { nav: "/messages", chapter: "Connect", label: "Messages", why: "Chat with parents and staff.", pages: [{ title: "Messages", body: "Message parents and colleagues. Ticks show sent, delivered and read." }] },
  { nav: "/announcements", chapter: "Connect", label: "Announcements", why: "School notices.", pages: [{ title: "Announcements", body: "Notices from the school. You can post to your own class as well." }] },
  { nav: "/ptm", chapter: "Connect", label: "Parent meetings", why: "Parent meetings.", pages: [{ title: "Parent meetings", body: "Your booked meeting slots with parents on meeting days." }] },
  { nav: "/settings", chapter: "Account", label: "Settings", why: "Your account.", pages: [{ title: "Settings", body: "Change your password and language, and install EduSphere on your phone." }] },
];

const PARENT: Item[] = [
  { nav: "/dashboard", chapter: "Overview", label: "Dashboard", why: "Your home screen.", pages: [{ title: "Your child at a glance", body: "Today’s attendance, homework due, latest marks and notices for your child. If you have more than one child, pick between them here." }] },
  { nav: "/attendance", chapter: "Your child", label: "Attendance", why: "Attendance record.", pages: [{ title: "Attendance", body: "See which days your child was present, absent or late." }] },
  { nav: "/homework", chapter: "Your child", label: "Homework", why: "Homework to do.", pages: [{ title: "Homework", body: "What has been set, when it is due, and what is done." }] },
  { nav: "/portions", chapter: "Your child", label: "Discussed portions", why: "What was taught.", pages: [{ title: "Discussed portions", body: "The topics covered in class, so you can help with revision." }] },
  { nav: "/diary", chapter: "Your child", label: "Class diary", why: "Daily diary.", pages: [{ title: "Class diary", body: "The teacher’s daily diary for your child’s class." }] },
  { nav: "/timetable", chapter: "Your child", label: "Timetable", why: "Class timetable.", pages: [{ title: "Timetable", body: "The weekly timetable for your child’s class." }] },
  { nav: "/exams", chapter: "Your child", label: "Exams & marks", why: "Marks and report cards.", pages: [{ title: "Exams and marks", body: "Exam dates and published results. You can print the report card." }] },
  { nav: "/leave", chapter: "Your child", label: "Leave", why: "Apply for leave.", pages: [{ title: "Apply for leave", body: "Tell the school your child will be away. The class teacher approves it." }] },
  { nav: "/fees", chapter: "Connect", label: "Fees", why: "Fees and receipts.", pages: [{ title: "Fees", body: "See what is due, what you have paid and download receipts." }] },
  { nav: "/messages", chapter: "Connect", label: "Messages", why: "Talk to the teacher.", pages: [{ title: "Messages", body: "Chat with your child’s teachers. Ticks show sent, delivered and read." }] },
  { nav: "/announcements", chapter: "Connect", label: "Announcements", why: "School notices.", pages: [{ title: "Announcements", body: "Notices from the school and your child’s class." }] },
  { nav: "/ptm", chapter: "Connect", label: "Parent meetings", why: "Book a meeting.", pages: [{ title: "Parent meetings", body: "Pick a time slot to meet your child’s teacher." }] },
  { nav: "/notifications", chapter: "Connect", label: "Notifications", why: "Your alerts.", pages: [{ title: "Notifications", body: "Everything new in one list. Turn on phone notifications in Settings so you never miss one." }] },
  { nav: "/settings", chapter: "Account", label: "Settings", why: "Your account.", pages: [{ title: "Settings", body: "Change your password and language, and install EduSphere on your phone's home screen." }] },
];

export function stepsFor(role: TourRole, available: string[], o: { name: string; needsPlan: boolean }): Step[] {
  const items = role === "ADMIN" ? ADMIN : role === "TEACHER" ? TEACHER : PARENT;
  const out: Step[] = [];
  const first = o.name.split(" ")[0];
  if (role === "ADMIN") {
    out.push({ kind: "center", chapter: "Welcome", title: `Welcome to EduSphere, ${first}!`, body: "This short tour shows you every part of your school portal and tells you exactly where to click. You’ll set the school up in the right order: classes, then subjects, then teachers, then students and parents. You can stop any time and reopen the guide from the ? button." });
    if (o.needsPlan) out.push({ kind: "page", nav: "/billing", chapter: "First: activate", title: "Activate your school", body: "Choose a plan and pay (this is a demo checkout for now). Until your school is activated it stays read-only, so you can look around but not add anything yet." });
  } else if (role === "TEACHER") {
    out.push({ kind: "center", chapter: "Welcome", title: `Welcome, ${first}!`, body: "A quick look at the tools you’ll use every day, and where to find them. You can stop any time and reopen the guide from the ? button." });
  } else {
    out.push({ kind: "center", chapter: "Welcome", title: `Welcome, ${first}!`, body: "A quick look at where to find your child’s attendance, homework, marks, fees and messages. You can stop any time and reopen the guide from the ? button." });
  }
  for (const it of items) {
    if (!available.includes(it.nav)) continue;
    if (role === "ADMIN" && it.nav === "/billing" && o.needsPlan) continue;
    out.push({ kind: "click", nav: it.nav, chapter: it.chapter, title: `Open ${it.label}`, body: `${it.why} Click “${it.label}” in the menu.` });
    for (const p of it.pages) out.push({ kind: "page", nav: it.nav, card: p.card, chapter: it.chapter, title: p.title, body: p.body });
  }
  out.push({ kind: "center", chapter: "Done", title: "You’re all set", body: "That’s everything. Tap the ? button at the bottom-right whenever you want to replay this tour" + (role === "ADMIN" ? " or check your setup progress." : ".") });
  return out;
}
