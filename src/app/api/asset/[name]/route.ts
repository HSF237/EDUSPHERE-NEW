import { db } from "@/lib/db";

/** Public, cacheable site images (messaging backgrounds). Names are restricted so only these can be requested. */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9-]{1,40}$/.test(name)) return new Response("Not found", { status: 404 });
  const a = await db.siteAsset.findUnique({ where: { name } });
  if (!a) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(a.data), { headers: { "Content-Type": a.mime, "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800", "X-Content-Type-Options": "nosniff" } });
}
