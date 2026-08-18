import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/login",
    "/signup",
    "/explore",
    "/community",
    "/terms",
    "/privacy",
    "/guidelines",
    "/safety",
  ];

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "hourly" : "weekly",
    priority: route === "" ? 1 : 0.6,
  }));
}
