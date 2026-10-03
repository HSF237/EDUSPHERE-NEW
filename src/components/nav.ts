import type { Role } from "@prisma/client";
export type NavItem = { href: string; label: string; roles: Role[] };
const all: Role[] = ["ADMIN", "TEACHER", "PARENT", "SUPER_ADMIN"];
export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: all },
  { href: "/schools", label: "Schools", roles: ["SUPER_ADMIN"] },
  { href: "/attendance", label: "Attendance", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/homework", label: "Homework", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/diary", label: "Class diary", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/timetable", label: "Timetable", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/exams", label: "Exams & marks", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/leave", label: "Leave", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/messages", label: "Messages", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/announcements", label: "Announcements", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/ptm", label: "Parent meetings", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/substitutes", label: "Substitutes", roles: ["ADMIN", "TEACHER"] },
  { href: "/students", label: "Students", roles: ["ADMIN", "TEACHER"] },
  { href: "/teachers", label: "Teachers", roles: ["ADMIN"] },
  { href: "/classes", label: "Classes & subjects", roles: ["ADMIN"] },
  { href: "/reports", label: "Reports", roles: ["ADMIN"] },
  { href: "/notifications", label: "Notifications", roles: ["ADMIN", "TEACHER", "PARENT"] },
  { href: "/settings", label: "Settings", roles: ["ADMIN", "TEACHER", "PARENT", "SUPER_ADMIN"] },
];
