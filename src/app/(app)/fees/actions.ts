"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { can, getCtx, notify } from "@/lib/scope";
import { PAY_MODES, guardianPhone, studentLedger } from "@/lib/fees-data";
import { normalizePhone, sendAlert } from "@/lib/alerts";
import { fmtDate, inr, todayUTC } from "@/lib/utils";

type State = { error?: string; ok?: string } | undefined;

async function feeCtx() {
  const ctx = await getCtx();
  return can(ctx, "FEES") ? ctx : null;
}

const itemSchema = z.object({ name: z.string().trim().min(2).max(80), amount: z.coerce.number().int().min(1).max(10_000_000), classId: z.string().optional(), dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export async function createFeeItem(_: State, fd: FormData): Promise<State> {
  const ctx = await feeCtx(); if (!ctx) return { error: "You don’t have permission to manage fees." };
  const p = itemSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Enter a name, a whole-rupee amount and a due date." };
  const classId = p.data.classId || null;
  if (classId && !(await db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId } }))) return { error: "Choose a valid class." };
  await db.feeItem.create({ data: { schoolId: ctx.schoolId, classId, name: p.data.name, amount: p.data.amount, dueOn: new Date(p.data.dueOn) } });
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "fee_item_create", detail: p.data.name } });
  revalidatePath("/fees");
  return { ok: "Fee added." };
}

export async function deleteFeeItem(id: string) {
  const ctx = await feeCtx(); if (!ctx) return;
  if ((await db.feePayment.count({ where: { itemId: id, schoolId: ctx.schoolId } })) > 0) return; // keep history intact
  await db.feeItem.deleteMany({ where: { id, schoolId: ctx.schoolId } });
  revalidatePath("/fees");
}

const paySchema = z.object({ amount: z.coerce.number().int().min(1).max(10_000_000), mode: z.enum(PAY_MODES), itemId: z.string().optional(), reference: z.string().trim().max(60).optional(), note: z.string().trim().max(200).optional(), paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export async function recordPayment(studentId: string, _: State, fd: FormData): Promise<State> {
  const ctx = await feeCtx(); if (!ctx) return { error: "You don’t have permission to record payments." };
  const st = await db.student.findFirst({ where: { id: studentId, schoolId: ctx.schoolId }, include: { guardians: true } });
  if (!st) return { error: "Student not found." };
  const p = paySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Enter a whole-rupee amount, a payment mode and a date." };
  const d = p.data;
  if (new Date(d.paidOn) > new Date()) return { error: "The payment date can’t be in the future." };
  if (d.mode.startsWith("Waiver") && !d.note) return { error: "Add a short reason for the waiver." };
  const itemId = d.itemId || null;
  if (itemId && !(await db.feeItem.findFirst({ where: { id: itemId, schoolId: ctx.schoolId } }))) return { error: "That fee doesn’t exist." };
  const year = new Date().getUTCFullYear();
  let receiptNo = "";
  for (let i = 0; i < 6 && !receiptNo; i++) {
    const n = (await db.feePayment.count({ where: { schoolId: ctx.schoolId } })) + 1 + i;
    const candidate = `R-${year}-${String(n).padStart(5, "0")}`;
    try {
      await db.feePayment.create({ data: { schoolId: ctx.schoolId, studentId: st.id, itemId, amount: d.amount, mode: d.mode, reference: d.reference || null, note: d.note || null, paidOn: new Date(d.paidOn), receiptNo: candidate, receivedById: ctx.user.id } });
      receiptNo = candidate;
    } catch { /* receipt number taken by a parallel payment; try the next one */ }
  }
  if (!receiptNo) return { error: "Couldn’t create a receipt number. Please try again." };
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: "fee_payment", entity: st.id, detail: `${receiptNo} ${d.amount}` } });
  await notify(ctx.schoolId, st.guardians.map((g) => g.userId), "Payment received", `${inr(d.amount)} received for ${st.name}. Receipt ${receiptNo}.`, "/fees");
  revalidatePath("/fees"); revalidatePath(`/fees/${st.id}`);
  return { ok: `Payment recorded. Receipt ${receiptNo}.` };
}

async function reminderFor(ctx: NonNullable<Awaited<ReturnType<typeof feeCtx>>>, studentId: string, overdueOnly: boolean) {
  const st = await db.student.findFirst({ where: { id: studentId, schoolId: ctx.schoolId }, include: { class: true } });
  if (!st) return false;
  const l = await studentLedger(ctx.schoolId, st, todayUTC());
  const amount = overdueOnly ? l.overdue : l.due;
  if (amount <= 0) return false;
  const phone = normalizePhone(await guardianPhone(st.id));
  if (!phone) return false;
  await sendAlert({ schoolId: ctx.schoolId, studentId: st.id, phone, kind: "fee", body: `${ctx.user.school?.name ?? "School"}: fee reminder for ${st.name} (Class ${st.class.name}). Pending amount ${inr(amount)} as on ${fmtDate(new Date())}. Please pay at the school office. Thank you.` });
  return true;
}

export async function sendFeeReminder(studentId: string) {
  const ctx = await feeCtx(); if (!ctx) return;
  await reminderFor(ctx, studentId, false);
  revalidatePath("/alerts");
}

export async function sendAllReminders(): Promise<State> {
  const ctx = await feeCtx(); if (!ctx) return { error: "Not allowed." };
  const { schoolLedgers } = await import("@/lib/fees-data");
  const late = (await schoolLedgers(ctx.schoolId, todayUTC())).filter((x) => x.overdue > 0).sort((a, b) => b.overdue - a.overdue).slice(0, 200);
  let n = 0;
  for (const x of late) if (await reminderFor(ctx, x.s.id, true)) n++;
  revalidatePath("/alerts");
  return { ok: n ? `${n} reminder${n === 1 ? "" : "s"} prepared — open Parent alerts to send them.` : "No reminders to send (nobody overdue with a parent phone number saved)." };
}
