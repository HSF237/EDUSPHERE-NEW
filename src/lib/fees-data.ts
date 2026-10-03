import { db } from "./db";
import { ledger, type FeeItemLite } from "./fees-calc";

export const PAY_MODES = ["Cash", "UPI", "Card", "Bank transfer", "Cheque", "Waiver / concession"] as const;

export async function loadItems(schoolId: string): Promise<FeeItemLite[]> {
  return db.feeItem.findMany({ where: { schoolId }, orderBy: { dueOn: "asc" } });
}
export const itemsFor = (items: FeeItemLite[], classId: string) => items.filter((i) => !i.classId || i.classId === classId);

/** Ledger for one student. */
export async function studentLedger(schoolId: string, student: { id: string; classId: string }, today: Date) {
  const [items, pays] = await Promise.all([loadItems(schoolId), db.feePayment.findMany({ where: { schoolId, studentId: student.id }, orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }] })]);
  return { ...ledger(itemsFor(items, student.classId), pays, today), payments: pays };
}

/** Ledgers for many students at once (used by the principal's overview). */
export async function schoolLedgers(schoolId: string, today: Date) {
  const [items, students, pays] = await Promise.all([
    loadItems(schoolId),
    db.student.findMany({ where: { schoolId, active: true }, select: { id: true, name: true, rollNo: true, classId: true, class: { select: { name: true } } } }),
    db.feePayment.groupBy({ by: ["studentId", "itemId"], where: { schoolId }, _sum: { amount: true } }),
  ]);
  const byStudent = new Map<string, { itemId: string | null; amount: number }[]>();
  for (const p of pays) { const a = byStudent.get(p.studentId) ?? []; a.push({ itemId: p.itemId, amount: p._sum.amount ?? 0 }); byStudent.set(p.studentId, a); }
  return students.map((s) => ({ s, ...ledger(itemsFor(items, s.classId), byStudent.get(s.id) ?? [], today) }));
}

/** First phone number among a student's guardians. */
export async function guardianPhone(studentId: string) {
  const g = await db.guardian.findMany({ where: { studentId }, include: { user: { select: { phone: true } } } });
  return g.map((x) => x.user.phone).find(Boolean) ?? null;
}
