"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCtx } from "@/lib/scope";
import { addMonths } from "@/lib/billing";
import { isPlan, isTier, priceFor } from "@/lib/plans";
import { createOrder, razorpayKeyId, razorpayLive, verifySignature } from "@/lib/razorpay";

export type StartResult = { error: string } | { paymentId: string; amount: number; demo: boolean; orderId?: string; keyId?: string; name: string };

async function adminCtx() {
  const ctx = await getCtx({ allowLocked: true });
  if (ctx.role !== "ADMIN") return null;
  return ctx;
}

export async function startPayment(tier: string, plan: string): Promise<StartResult> {
  const ctx = await adminCtx();
  if (!ctx) return { error: "Only the principal can manage billing." };
  if (!isTier(tier) || !isPlan(plan)) return { error: "Pick a plan." };
  const school = await db.school.findUnique({ where: { id: ctx.schoolId } });
  if (!school) return { error: "School not found." };
  const p = priceFor(tier, plan, school.introMonthsLeft);
  const live = razorpayLive();
  let orderId: string | undefined;
  try {
    if (live) orderId = (await createOrder(p.amount, `es_${school.code}_${Date.now()}`)).id;
  } catch {
    return { error: "Couldn't reach the payment gateway. Please try again." };
  }
  const row = await db.billingPayment.create({ data: { schoolId: school.id, planCode: plan, tier, months: p.months, amount: p.amount, kind: p.kind, demo: !live, orderId } });
  return { paymentId: row.id, amount: p.amount, demo: !live, orderId, keyId: live ? razorpayKeyId() : undefined, name: school.name };
}

/** Marks a payment paid (once) and extends the school's paid period. */
async function settle(paymentId: string, schoolId: string, ref: string | null) {
  const row = await db.billingPayment.findFirst({ where: { id: paymentId, schoolId } });
  if (!row) return false;
  const now = new Date();
  const invoiceNo = `ES-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}-${row.id.slice(-6).toUpperCase()}`;
  const won = await db.billingPayment.updateMany({ where: { id: row.id, status: { not: "PAID" } }, data: { status: "PAID", paidAt: now, paymentId: ref, invoiceNo } });
  if (won.count === 0) return true; // already settled
  const s = await db.school.findUnique({ where: { id: schoolId } });
  if (!s) return false;
  const base = s.paidUntil && s.paidUntil > now ? s.paidUntil : now;
  await db.school.update({ where: { id: schoolId }, data: { paidUntil: addMonths(base, row.months), tier: row.tier, planCode: row.planCode, cancelledAt: null, introMonthsLeft: row.kind === "INTRO" ? Math.max(0, s.introMonthsLeft - row.months) : s.introMonthsLeft } });
  await db.auditLog.create({ data: { schoolId, action: row.demo ? "billing_paid_demo" : "billing_paid", entity: row.id, detail: `${row.planCode}/${row.tier} ₹${row.amount}` } });
  return true;
}

export async function demoPay(paymentId: string): Promise<{ error?: string }> {
  const ctx = await adminCtx();
  if (!ctx) return { error: "Only the principal can manage billing." };
  if (razorpayLive()) return { error: "Demo payments are switched off." };
  const ok = await settle(paymentId, ctx.schoolId, "demo");
  revalidatePath("/billing");
  return ok ? {} : { error: "Payment not found." };
}

export async function confirmPayment(paymentId: string, razorpayPaymentId: string, signature: string): Promise<{ error?: string }> {
  const ctx = await adminCtx();
  if (!ctx) return { error: "Only the principal can manage billing." };
  const row = await db.billingPayment.findFirst({ where: { id: paymentId, schoolId: ctx.schoolId } });
  if (!row?.orderId || !verifySignature(row.orderId, razorpayPaymentId, signature)) {
    await db.billingPayment.updateMany({ where: { id: paymentId, schoolId: ctx.schoolId, status: "CREATED" }, data: { status: "FAILED" } });
    return { error: "We couldn't verify that payment. If money was deducted, contact support." };
  }
  await settle(paymentId, ctx.schoolId, razorpayPaymentId);
  revalidatePath("/billing");
  return {};
}

export async function setCancelled(cancel: boolean) {
  const ctx = await adminCtx();
  if (!ctx) return;
  await db.school.update({ where: { id: ctx.schoolId }, data: { cancelledAt: cancel ? new Date() : null } });
  await db.auditLog.create({ data: { schoolId: ctx.schoolId, userId: ctx.user.id, action: cancel ? "billing_cancel" : "billing_resume" } });
  revalidatePath("/billing");
}
