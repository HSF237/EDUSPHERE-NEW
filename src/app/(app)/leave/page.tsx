import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getCtx } from "@/lib/scope";
import { Card, PageHeader, Table, Badge, Empty } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { ApplyLeave, Decide } from "./forms";

export const metadata = { title: "Leave" };
const tone = { PENDING: "amber", APPROVED: "green", REJECTED: "red" } as const;

export default async function LeavePage() {
  const ctx = await getCtx();
  if (ctx.role === "TEACHER" && ctx.mode !== "CLASS") redirect("/dashboard");
  const where = ctx.role === "PARENT" ? { schoolId: ctx.schoolId, studentId: { in: ctx.childIds } } : { schoolId: ctx.schoolId, student: { classId: { in: ctx.classIds } } };
  const list = await db.leaveRequest.findMany({ where, include: { student: { include: { class: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  const kids = ctx.role === "PARENT" ? await db.student.findMany({ where: { id: { in: ctx.childIds } }, select: { id: true, name: true } }) : [];
  return (
    <>
      <PageHeader title="Leave requests" sub={ctx.role === "PARENT" ? "Apply for leave for your child and track the decision." : "Review leave requests from parents."} />
      {ctx.role === "PARENT" && <Card title="Apply for leave" className="mb-6"><ApplyLeave kids={kids} /></Card>}
      <Card title="Requests" flush>
        {list.length === 0 ? <Empty title="No leave requests" /> : (
          <Table head={["Student", "Class", "Dates", "Reason", "Status", ""]}>
            {list.map((l) => (
              <tr key={l.id}><td className="td font-medium">{l.student.name}</td><td className="td">{l.student.class.name}</td><td className="td whitespace-nowrap">{fmtDate(l.fromDate)} – {fmtDate(l.toDate)}</td>
                <td className="td max-w-xs">{l.reason}</td><td className="td"><Badge tone={tone[l.status]}>{l.status.toLowerCase()}</Badge></td>
                <td className="td">{ctx.role !== "PARENT" && l.status === "PENDING" && <Decide id={l.id} />}</td></tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
