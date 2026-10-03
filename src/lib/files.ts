import { db } from "./db";

export const MAX_FILE_BYTES = 3 * 1024 * 1024;

const TYPES: Record<string, { mime: string; magic: (b: Buffer) => boolean; inline: boolean }> = {
  pdf: { mime: "application/pdf", magic: (b) => b.subarray(0, 4).toString() === "%PDF", inline: true },
  png: { mime: "image/png", magic: (b) => b[0] === 0x89 && b.subarray(1, 4).toString() === "PNG", inline: true },
  jpg: { mime: "image/jpeg", magic: (b) => b[0] === 0xff && b[1] === 0xd8, inline: true },
  jpeg: { mime: "image/jpeg", magic: (b) => b[0] === 0xff && b[1] === 0xd8, inline: true },
  webp: { mime: "image/webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP", inline: true },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: (b) => b[0] === 0x50 && b[1] === 0x4b, inline: false },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", magic: (b) => b[0] === 0x50 && b[1] === 0x4b, inline: false },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", magic: (b) => b[0] === 0x50 && b[1] === 0x4b, inline: false },
};
export const IMAGE_EXT = ["png", "jpg", "jpeg", "webp"];
export const isInline = (mime: string) => Object.values(TYPES).some((t) => t.mime === mime && t.inline);

export type Upload = { name: string; mime: string; size: number; data: Buffer };

/** Reads an optional file field. Returns null when nothing was chosen, or an error message. */
export async function readUpload(fd: FormData, field = "file", imagesOnly = false): Promise<Upload | null | { error: string }> {
  const f = fd.get(field);
  if (!f || typeof f === "string" || f.size === 0) return null;
  if (f.size > MAX_FILE_BYTES) return { error: `That file is too big. The limit is ${MAX_FILE_BYTES / 1024 / 1024} MB.` };
  const ext = (f.name.split(".").pop() ?? "").toLowerCase();
  const t = TYPES[ext];
  if (!t || (imagesOnly && !IMAGE_EXT.includes(ext))) return { error: imagesOnly ? "Please choose a PNG, JPG or WebP image." : "Allowed files: PDF, images (PNG/JPG/WebP), Word, Excel and PowerPoint." };
  const data = Buffer.from(await f.arrayBuffer());
  if (!t.magic(data)) return { error: "That file doesn’t look like a valid ." + ext + " file." };
  return { name: f.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) || `file.${ext}`, mime: t.mime, size: data.length, data };
}
export const isError = (u: Upload | null | { error: string }): u is { error: string } => !!u && "error" in u;

export async function storeFile(schoolId: string, uploadedById: string, u: Upload, studentId?: string) {
  const row = await db.file.create({ data: { schoolId, uploadedById, name: u.name, mime: u.mime, size: u.size, data: new Uint8Array(u.data), studentId: studentId ?? null }, select: { id: true } });
  return row.id;
}
export const fileUrl = (id: string | null | undefined) => (id ? `/api/files/${id}` : null);
export const prettySize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
