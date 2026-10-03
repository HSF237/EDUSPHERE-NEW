import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: { default: "EduSphere", template: "%s · EduSphere" },
  description: "School management platform for attendance, homework, exams and communication.",
  appleWebApp: { capable: true, title: "EduSphere", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#4f46e5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}<PwaRegister /></body>
    </html>
  );
}
