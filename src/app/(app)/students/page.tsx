import Link from "next/link";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Empty } from "@/components/ui";
import { createStudent } from "./actions";

export const metadata = { title: "Students" };
const PAGE = 25;

export default async function Students({ searchParams }: { searchParams: Promise<{ q?: string; class?: string; page?: string }> }) {
  const ctx = await getCtx();
  if (ctx.role === "PARENT") return null;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const classes = await db.class.findMany({ where: { id: { in: ctx.classIds } }, orderBy: { name: "asc" } });
  const where = { schoolId: ctx.schoolId, classId: sp.class && ctx.classIds.includes(sp.class) ? sp.class : { in: ctx.classIds }, ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" as const } }, { admissionNo: { contains: sp.q, mode: "insensitive" as const } }] } : {}) };
  const [total, list] = await Promise.all([db.student.count({ where }), db.student.findMany({ where, include: { class: true }, orderBy: [{ class: { name: "asc" } }, { rollNo: "asc" }], skip: (page - 1) * PAGE, take: PAGE })]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.class ? { class: sp.class } : {}), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Students" sub={`${total} students`}>
        <form className="flex w-full flex-wrap gap-2 sm:w-auto"><input name="q" defaultValue={sp.q} placeholder="Search name or admission no." className="input w-full sm:w-64" aria-label="Search students" />
          <select name="class" defaultValue={sp.class ?? ""} className="input w-28" aria-label="Class"><option value="">All</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="btn-ghost">Filter</button></form>
      </PageHeader>
      {ctx.role === "ADMIN" && (
        <Card title="Add student" className="mb-6"><form action={createStudent} className="grid gap-4 sm:grid-cols-5">
          <div className="sm:col-span-2"><label className="label" htmlFor="sn">Full name</label><input id="sn" name="name" className="input" required /></div>
          <div><label className="label" htmlFor="sc">Class</label><select id="sc" name="classId" className="input">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label" htmlFor="sg">Gender</label><select id="sg" name="gender" className="input"><option>F</option><option>M</option></select></div>
          <div><label className="label" htmlFor="sd">Date of birth</label><input id="sd" name="dob" type="date" className="input" /></div>
          <div className="sm:col-span-2"><label className="label" htmlFor="pe">Parent email (creates account)</label><input id="pe" name="parentEmail" type="email" className="input" /></div>
          <div><label className="label" htmlFor="pn">Parent name</label><input id="pn" name="parentName" className="input" /></div>
          <div className="sm:col-span-2 flex items-end justify-end"><button className="btn">Add student</button></div></form>
          <p className="mt-2 text-xs text-slate-500">New parent accounts get the temporary password <code>ChangeMe123!</code> — they should change it at first sign-in.</p></Card>
      )}
      <Card flush>
        {list.length === 0 ? <Empty title="No students found" /> : (
          <Table head={["Roll", "Name", "Class", "Admission no.", "Gender"]}>{list.map((s) => (
            <tr key={s.id}><td className="td">{s.rollNo}</td><td className="td font-medium"><Link className="text-brand-600 hover:underline" href={`/students/${s.id}`}>{s.name}</Link></td><td className="td">{s.class.name}</td><td className="td">{s.admissionNo}</td><td className="td">{s.gender}</td></tr>))}</Table>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm"><span className="text-slate-500">Page {page} of {pages}</span>
          <span className="flex gap-2">{page > 1 && <Link className="btn-ghost" href={qs(page - 1)}>Previous</Link>}{page < pages && <Link className="btn-ghost" href={qs(page + 1)}>Next</Link>}</span></div>
      </Card>
    </>
  );
}
