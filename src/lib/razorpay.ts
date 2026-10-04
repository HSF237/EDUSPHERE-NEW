import crypto from "node:crypto";

export const razorpayLive = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";

/** Create an order (amount in rupees). Hand-rolled REST call, no SDK. */
export async function createOrder(rupees: number, receipt: string) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: rupees * 100, currency: "INR", receipt: receipt.slice(0, 40) }),
  });
  if (!r.ok) throw new Error("Razorpay order failed");
  return (await r.json()) as { id: string };
}

export function verifySignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expect = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expect), b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
