import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { copilotActor } from "@/app/(app)/copilot/actions";
import { pendingPreviews } from "@/lib/ai/runtime";
import { personalUpdates } from "@/lib/ai/updates";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await getSession()) return NextResponse.json({ error: "Sign in to see your updates." }, { status: 401 });
  try {
    const actor = await copilotActor();
    const [data, previews] = await Promise.all([
      personalUpdates(db, actor),
      actor.role === "ADMIN" && new URL(request.url).searchParams.get("previews") === "1" ? pendingPreviews(actor) : [],
    ]);
    return NextResponse.json({ ...data, previews }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Your updates are unavailable. Refresh or sign in again." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
}
