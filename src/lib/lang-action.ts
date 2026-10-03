"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE } from "./i18n";

export async function setLang(code: string) {
  const v = code === "ml" || code === "hi" ? code : "en";
  (await cookies()).set(LANG_COOKIE, v, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
