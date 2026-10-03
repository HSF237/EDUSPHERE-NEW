/**
 * DEVELOPMENT SEED ONLY. Never run against production.
 * Creates two sample schools so multi-tenancy can be exercised locally.
 * All sample accounts use the password "Passw0rd!".
 */
import { PrismaClient, AttStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production");
const db = new PrismaClient();
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const day = (offset: number) => { const d = new Date(new Date().toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + offset); return d; };

const FIRST = ["Aarav","Vivaan","Aditya","Ishaan","Kabir","Reyansh","Arjun","Sai","Krish","Rohan","Ananya","Diya","Meera","Saanvi","Isha","Kavya","Riya","Priya","Nisha","Tara","Zoya","Fatima","Ayaan","Zayd","Hana"];
const LAST = ["Sharma","Patel","Nair","Khan","Reddy","Iyer","Gupta","Menon","Das","Verma","Joshi","Ali"];
const SUBJECTS = [["Mathematics","MAT"],["English","ENG"],["Science","SCI"],["Social Studies","SST"],["Hindi","HIN"],["Computer Science","CSC"]];

async function school(name: string, code: string, slug: string) {
  const hash = await bcrypt.hash("Passw0rd!", 10);
  const s = await db.school.create({ data: { name, code, address: "Sample address", email: `office@${slug}.test` } });
  const year = await db.academicYear.create({ data: { schoolId: s.id, name: "2026-27", startsOn: day(-120), endsOn: day(240), current: true } });
  await db.user.create({ data: { schoolId: s.id, email: `principal@${slug}.test`, passwordHash: hash, name: `Principal ${slug.toUpperCase()}`, role: "ADMIN" } });
  const subs = [];
  for (const [n, c] of SUBJECTS) subs.push(await db.subject.create({ data: { schoolId: s.id, name: n, code: c } }));
  const teachers = [];
  for (let i = 0; i < 6; i++) {
    const u = await db.user.create({ data: { schoolId: s.id, email: `teacher${i + 1}@${slug}.test`, passwordHash: hash, name: `${pick(FIRST)} ${pick(LAST)}`, role: "TEACHER" } });
    teachers.push(await db.teacher.create({ data: { schoolId: s.id, userId: u.id, employeeNo: `T${100 + i}`, qualification: "B.Ed" } }));
  }
  const classes: { id: string; name: string }[] = [];
  const ci = () => classes.length;
  let pi = 0;
  for (const [g, sec] of [[6, "A"], [6, "B"], [7, "A"]] as const) {
    const c = await db.class.create({ data: { schoolId: s.id, yearId: year.id, grade: g, section: sec, name: `${g}${sec}`, roomNo: `${g}0${sec === "A" ? 1 : 2}`, classTeacherId: teachers[ci()].id } });
    classes.push(c);
    for (let k = 0; k < subs.length; k++) {
      await db.classSubject.create({ data: { classId: c.id, subjectId: subs[k].id, teacherId: teachers[(k + ci()) % 6].id } });
    }
    // timetable: 5 days x 6 periods
    for (let d = 0; d < 5; d++) for (let p = 0; p < 6; p++) {
      const k = (d + p) % subs.length;
      const cs = await db.classSubject.findFirstOrThrow({ where: { classId: c.id, subjectId: subs[k].id } });
      const h = 8 + p + (p > 2 ? 1 : 0);
      await db.timetableSlot.create({ data: { schoolId: s.id, classId: c.id, subjectId: subs[k].id, teacherId: cs.teacherId, day: d, period: p + 1, startTime: `${String(h).padStart(2, "0")}:00`, endTime: `${String(h).padStart(2, "0")}:45` } });
    }
    const studs = [];
    for (let r = 1; r <= 20; r++) {
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const st = await db.student.create({ data: { schoolId: s.id, classId: c.id, admissionNo: `${c.name}-${String(r).padStart(3, "0")}`, rollNo: r, name, gender: rnd() > 0.5 ? "F" : "M", dob: new Date(2014 - g + 6, 3, 10) } });
      studs.push(st);
      if (pi < 6 || r <= 2) {
        const pu = await db.user.create({ data: { schoolId: s.id, email: `parent${++pi}@${slug}.test`, passwordHash: hash, name: `Parent of ${name.split(" ")[0]}`, role: "PARENT" } });
        await db.guardian.create({ data: { userId: pu.id, studentId: st.id } });
      }
    }
    // attendance for last 20 weekdays
    for (let o = -1; o >= -28; o--) {
      const d = day(o); if ([0, 6].includes(d.getUTCDay())) continue;
      const ses = await db.attendanceSession.create({ data: { schoolId: s.id, classId: c.id, date: d, markedById: teachers[0].userId, status: o < -3 ? "APPROVED" : "PENDING" } });
      await db.attendanceRecord.createMany({ data: studs.map((st) => ({ sessionId: ses.id, studentId: st.id, status: (rnd() < 0.9 ? "PRESENT" : rnd() < 0.5 ? "ABSENT" : "LATE") as AttStatus })) });
    }
    // homework
    for (let k = 0; k < 3; k++) {
      const cs = await db.classSubject.findFirstOrThrow({ where: { classId: c.id, subjectId: subs[k].id } });
      const hw = await db.homework.create({ data: { schoolId: s.id, classId: c.id, subjectId: subs[k].id, teacherId: cs.teacherId, title: `${subs[k].name} practice set ${k + 1}`, description: "Complete the exercises from the chapter and bring your notebook.", dueOn: day(k + 1) } });
      await db.homeworkSubmission.createMany({ data: studs.map((st) => ({ homeworkId: hw.id, studentId: st.id, done: rnd() < 0.6 })) });
    }
    // exam + marks
    const ex = await db.exam.create({ data: { schoolId: s.id, yearId: year.id, classId: c.id, name: "Unit Test 1", maxMarks: 100, passMarks: 35, startsOn: day(-14), published: true } });
    for (const sb of subs) {
      await db.examSchedule.create({ data: { examId: ex.id, subjectId: sb.id, date: day(-14 + subs.indexOf(sb)), startTime: "09:00" } });
      await db.mark.createMany({ data: studs.map((st) => ({ examId: ex.id, subjectId: sb.id, studentId: st.id, score: Math.round(40 + rnd() * 58) })) });
    }
    await db.diaryEntry.create({ data: { schoolId: s.id, classId: c.id, teacherId: teachers[0].id, date: day(0), subject: "Mathematics", topic: "Fractions revision", notes: "Revise chapter 4 examples." } });
  }
  await db.announcement.create({ data: { schoolId: s.id, authorId: (await db.user.findFirstOrThrow({ where: { schoolId: s.id, role: "ADMIN" } })).id, title: "Welcome to the new term", body: "Please check the timetable and homework sections regularly.", pinned: true } });
  const par = await db.user.findFirstOrThrow({ where: { schoolId: s.id, role: "PARENT" }, include: { children: true } });
  await db.leaveRequest.create({ data: { schoolId: s.id, studentId: par.children[0].studentId, requestedById: par.id, fromDate: day(2), toDate: day(3), reason: "Family function" } });
  await db.ptmEvent.create({ data: { schoolId: s.id, title: "Term 1 Parent–Teacher Meeting", date: day(10), venue: "Main hall" } });
}

async function main() {
  await db.user.deleteMany();
  await db.school.deleteMany();
  const hash = await bcrypt.hash("Passw0rd!", 10);
  await db.user.create({ data: { email: "super@edusphere.test", passwordHash: hash, name: "Platform Admin", role: "SUPER_ADMIN" } });
  await school("Greenfield Public School", "GREEN", "greenfield");
  await school("Riverside Academy", "RIVER", "riverside");
  console.log("Seeded. Login e.g. principal@greenfield.test / teacher1@greenfield.test / parent1@greenfield.test, password Passw0rd!");
}
main().finally(() => db.$disconnect());
