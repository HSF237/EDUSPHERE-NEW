import type { Role } from "@prisma/client";
import type { IconName } from "./icons";
import type { Perm } from "@/lib/perms";
export type NavItem = {
  href: string; label: string; roles: Role[]; icon: IconName; group: string;
  /** Teachers only see this item in this workspace mode (class teacher vs subject teacher). */
  tMode?: "CLASS";
  /** A teacher granted this permission sees the item whatever their mode. */
  perm?: Perm;
};
const all: Role[] = ["ADMIN", "TEACHER", "PARENT", "SUPER_ADMIN"];
const school: Role[] = ["ADMIN", "TEACHER", "PARENT"];
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: all, icon: "home", group: "Overview" },
  { href: "/schools", label: "Schools", roles: ["SUPER_ADMIN"], icon: "building", group: "Overview" },
  { href: "/attendance", label: "Attendance", roles: school, icon: "attendance", group: "Daily", tMode: "CLASS", perm: "ATTENDANCE_APPROVE" },
  { href: "/homework", label: "Homework", roles: school, icon: "book", group: "Daily" },
  { href: "/portions", label: "Discussed portions", roles: school, icon: "clipboard", group: "Daily" },
  { href: "/diary", label: "Class diary", roles: school, icon: "notebook", group: "Daily", tMode: "CLASS" },
  { href: "/timetable", label: "Timetable", roles: school, icon: "clock", group: "Daily" },
  { href: "/exams", label: "Exams & marks", roles: school, icon: "award", group: "Academics" },
  { href: "/leave", label: "Leave", roles: school, icon: "send", group: "Academics", tMode: "CLASS" },
  { href: "/messages", label: "Messages", roles: school, icon: "message", group: "Connect" },
  { href: "/announcements", label: "Announcements", roles: school, icon: "megaphone", group: "Connect" },
  { href: "/ptm", label: "Parent meetings", roles: school, icon: "users", group: "Connect" },
  { href: "/notifications", label: "Notifications", roles: school, icon: "bell", group: "Connect" },
  { href: "/students", label: "Students", roles: ["ADMIN", "TEACHER"], icon: "cap", group: "School", tMode: "CLASS", perm: "STUDENTS" },
  { href: "/teachers", label: "Teachers", roles: ["ADMIN"], icon: "teacher", group: "School", perm: "TEACHERS" },
  { href: "/classes", label: "Classes & subjects", roles: ["ADMIN"], icon: "layers", group: "School", perm: "CLASSES" },
  { href: "/substitutes", label: "Substitutes", roles: ["ADMIN", "TEACHER"], icon: "swap", group: "School" },
  { href: "/reports", label: "Reports", roles: ["ADMIN"], icon: "chart", group: "School", perm: "REPORTS" },
  { href: "/settings", label: "Settings", roles: all, icon: "settings", group: "Account" },
];

export function navFor(role: Role, mode: "CLASS" | "SUBJECT" | null, perms: string[]) {
  return NAV.filter((n) => {
    if (role !== "TEACHER") return n.roles.includes(role);
    if (n.perm && perms.includes(n.perm)) return true;
    if (!n.roles.includes("TEACHER")) return false;
    return !n.tMode || mode === n.tMode;
  });
}
