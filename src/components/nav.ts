import type { Role } from "@prisma/client";
import type { IconName } from "./icons";
export type NavItem = { href: string; label: string; roles: Role[]; icon: IconName; group: string };
const all: Role[] = ["ADMIN", "TEACHER", "PARENT", "SUPER_ADMIN"];
const school: Role[] = ["ADMIN", "TEACHER", "PARENT"];
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: all, icon: "home", group: "Overview" },
  { href: "/schools", label: "Schools", roles: ["SUPER_ADMIN"], icon: "building", group: "Overview" },
  { href: "/attendance", label: "Attendance", roles: school, icon: "attendance", group: "Daily" },
  { href: "/homework", label: "Homework", roles: school, icon: "book", group: "Daily" },
  { href: "/diary", label: "Class diary", roles: school, icon: "notebook", group: "Daily" },
  { href: "/timetable", label: "Timetable", roles: school, icon: "clock", group: "Daily" },
  { href: "/exams", label: "Exams & marks", roles: school, icon: "award", group: "Academics" },
  { href: "/leave", label: "Leave", roles: school, icon: "send", group: "Academics" },
  { href: "/messages", label: "Messages", roles: school, icon: "message", group: "Connect" },
  { href: "/announcements", label: "Announcements", roles: school, icon: "megaphone", group: "Connect" },
  { href: "/ptm", label: "Parent meetings", roles: school, icon: "users", group: "Connect" },
  { href: "/notifications", label: "Notifications", roles: school, icon: "bell", group: "Connect" },
  { href: "/students", label: "Students", roles: ["ADMIN", "TEACHER"], icon: "cap", group: "School" },
  { href: "/teachers", label: "Teachers", roles: ["ADMIN"], icon: "teacher", group: "School" },
  { href: "/classes", label: "Classes & subjects", roles: ["ADMIN"], icon: "layers", group: "School" },
  { href: "/substitutes", label: "Substitutes", roles: ["ADMIN", "TEACHER"], icon: "swap", group: "School" },
  { href: "/reports", label: "Reports", roles: ["ADMIN"], icon: "chart", group: "School" },
  { href: "/settings", label: "Settings", roles: all, icon: "settings", group: "Account" },
];
