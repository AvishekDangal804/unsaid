import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/messages",
        "/messages/",
        "/notifications",
        "/settings",
        "/settings/",
        "/onboarding",
        "/requests",
        "/saved",
        "/suspended",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
