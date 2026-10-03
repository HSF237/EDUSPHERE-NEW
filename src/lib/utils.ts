export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
export const isoDate = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
export const todayUTC = () => new Date(new Date().toISOString().slice(0, 10));
export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
export const inr = (n: number) => "₹" + new Intl.NumberFormat("en-IN").format(n);
export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const grade = (p: number) =>
  p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B" : p >= 60 ? "C" : p >= 50 ? "D" : p >= 35 ? "E" : "F";
