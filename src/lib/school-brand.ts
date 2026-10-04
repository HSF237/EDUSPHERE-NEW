import { db } from "./db";
import { hasCustom } from "./custom";

/** Logo, signature and signatory details used on printed documents. */
export async function schoolBrand(schoolId: string) {
  const s = await db.school.findUnique({ where: { id: schoolId } });
  const custom = hasCustom(s);
  return {
    name: s?.name ?? "School",
    logo: custom && s?.logoFileId ? `/api/files/${s.logoFileId}` : null,
    signature: custom && s?.signatureFileId ? `/api/files/${s.signatureFileId}` : null,
    signatory: s?.signatoryName ?? "",
    title: s?.signatoryTitle || "Principal",
    colour: custom ? s?.brandColor ?? "" : "",
  };
}
export type SchoolBrand = Awaited<ReturnType<typeof schoolBrand>>;
