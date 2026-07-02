import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/links";
import { locales } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const languages = {
    en: `${SITE_URL}/en`,
    ar: `${SITE_URL}/ar`,
  };

  return locales.map((lang) => ({
    url: `${SITE_URL}/${lang}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 1,
    alternates: { languages },
  }));
}
