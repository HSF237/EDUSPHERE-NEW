/** Public-site details used by the marketing pages and legal documents. Edit here — every page picks it up. */
export const SITE = {
  name: "EduSphere",
  operator: "Zerox Studios",
  tagline: "The school management platform for principals, teachers and parents.",
  email: "zerox9861@gmail.com",
  whatsapp: "919496829330",
  phoneDisplay: "+91 94968 29330",
  location: "Kerala, India",
  jurisdiction: "Kerala, India",
  updated: "3 October 2026",
  url: "https://eduspere-beta.vercel.app",
} as const;

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/student-data", label: "Student & Children’s Data" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/security", label: "Security" },
] as const;
