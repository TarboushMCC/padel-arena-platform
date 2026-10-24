import type { MetadataRoute } from "next";

const paths = [
  "/",
  "/about",
  "/courts",
  "/booking",
  "/pricing",
  "/events",
  "/contact",
  "/faq",
  "/login",
  "/register"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const now = new Date();

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7
  }));
}
