/** Permissions a principal can switch on for an individual teacher. */
export const PERMS = [
  { key: "STUDENTS", label: "Add & manage students", hint: "See every student in the school, add new students and parent accounts." },
  { key: "TEACHERS", label: "Add & manage teachers", hint: "Add teachers and enable or disable their accounts." },
  { key: "CLASSES", label: "Add classes & subjects", hint: "Create classes and subjects, and assign subject teachers." },
  { key: "EXAMS", label: "Create & publish exams", hint: "Create exams for any class and publish results to parents." },
  { key: "ATTENDANCE_APPROVE", label: "Approve attendance", hint: "Review and approve registers submitted by class teachers." },
  { key: "ANNOUNCE", label: "Post announcements", hint: "Post and delete school announcements." },
  { key: "REPORTS", label: "View school reports", hint: "Open the analytics and reports page." },
  { key: "SUBSTITUTES", label: "Arrange substitutes", hint: "Assign substitute teachers for absent staff." },
  { key: "FEES", label: "Collect fees", hint: "Set fee amounts, record payments, print receipts and send reminders." },
  { key: "PTM", label: "Schedule parent meetings", hint: "Create parent-teacher meeting days." },
] as const;
export type Perm = (typeof PERMS)[number]["key"];
export const PERM_KEYS = PERMS.map((p) => p.key) as Perm[];

/** One-click starting points for common positions. */
export const PRESETS: { position: string; perms: Perm[] }[] = [
  { position: "Section Head", perms: ["STUDENTS", "ATTENDANCE_APPROVE", "ANNOUNCE", "REPORTS", "SUBSTITUTES", "PTM"] },
  { position: "Vice Principal", perms: ["STUDENTS", "TEACHERS", "CLASSES", "EXAMS", "ATTENDANCE_APPROVE", "ANNOUNCE", "REPORTS", "SUBSTITUTES", "PTM"] },
  { position: "Exam Coordinator", perms: ["EXAMS", "REPORTS"] },
  { position: "Head of Department", perms: ["EXAMS", "REPORTS", "SUBSTITUTES"] },
  { position: "Admissions Officer", perms: ["STUDENTS"] },
];
