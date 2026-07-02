import { en, type Dictionary } from "@/dictionaries/en";
import { ar } from "@/dictionaries/ar";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
