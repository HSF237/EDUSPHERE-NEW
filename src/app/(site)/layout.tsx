import { SiteFooter, SiteHeader } from "@/components/site/chrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <SiteHeader />
      <main id="content" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
