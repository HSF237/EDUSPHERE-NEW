import { db } from "./db";

/** Logo, signature and signatory details used on printed documents. */
export async function schoolBrand(schoolId: string) {
  const s = await db.school.findUnique({ where: { id: schoolId } });
  return {
    name: s?.name ?? "School",
    logo: s?.logoFileId ? `/api/files/${s.logoFileId}` : null,
    signature: s?.signatureFileId ? `/api/files/${s.signatureFileId}` : null,
    signatory: s?.signatoryName ?? "",
    title: s?.signatoryTitle || "Principal",
    colour: s?.brandColor ?? "",
  };
}
export type SchoolBrand = Awaited<ReturnType<typeof schoolBrand>>;
