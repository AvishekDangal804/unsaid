import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UNSAID — Every feeling has a story.",
    short_name: "UNSAID",
    description:
      "Share instant thoughts, confessions, and stories — with your name, or anonymously.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e0245e",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
