import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "EduSphere", template: "%s · EduSphere" },
  description: "School management platform for attendance, homework, exams and communication.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
