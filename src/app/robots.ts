import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/terms", "/privacy"], disallow: ["/dashboard", "/api", "/messages", "/students", "/join", "/reset"] }], sitemap: `${SITE.url}/sitemap.xml` };
}
