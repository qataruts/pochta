import type { Metadata } from "next";
import { getDictionary, locales, dir, isLocale, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/links";
import { fontVariables } from "../fonts";
import "../globals.css";
import { ThemeScript } from "@/components/theme-script";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? raw : "en";
  const dict = getDictionary(lang);
  const path = `/${lang}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: dict.meta.title,
    description: dict.meta.description,
    applicationName: "Pochta",
    authors: [{ name: "Emad Jumaah" }],
    keywords: [
      "Pochta",
      "encrypted messenger",
      "end-to-end encryption",
      "self-hosted chat",
      "federated messenger",
      "@pochta-chat/sdk",
      "private video calls",
    ],
    alternates: {
      canonical: path,
      languages: {
        en: "/en",
        ar: "/ar",
        "x-default": "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: "Pochta",
      url: SITE_URL + path,
      title: dict.meta.title,
      description: dict.meta.description,
      locale: lang === "ar" ? "ar_AR" : "en_US",
      alternateLocale: lang === "ar" ? "en_US" : "ar_AR",
      images: [{ url: "/og.svg", width: 1200, height: 630, alt: dict.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
      images: ["/og.svg"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? raw : "en";
  const dict = getDictionary(lang);

  return (
    <html lang={lang} dir={dir(lang)} className={fontVariables} suppressHydrationWarning>
      <body>
        <ThemeScript />
        <a href="#main" className="skip-link">
          {dict.a11y.skip}
        </a>
        <Header lang={lang} dict={dict} />
        {children}
        <Footer lang={lang} dict={dict} />
      </body>
    </html>
  );
}
