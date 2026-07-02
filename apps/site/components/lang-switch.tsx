import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { IconGlobe } from "./icons";

export function LangSwitch({
  lang,
  label,
  ariaLabel,
}: {
  lang: Locale;
  label: string;
  ariaLabel: string;
}) {
  const other: Locale = lang === "en" ? "ar" : "en";
  return (
    <Link
      href={`/${other}`}
      className="lang-btn"
      hrefLang={other}
      lang={other}
      aria-label={ariaLabel}
    >
      <IconGlobe width={16} height={16} />
      <span>{label}</span>
    </Link>
  );
}
