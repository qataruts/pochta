import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";

// Latin UI font — used everywhere, and as a fallback under the Arabic route.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-latin",
});

// Arabic webfont — applied on the /ar route (see globals.css: html[lang="ar"]).
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-arabic",
});

export const fontVariables = `${inter.variable} ${plexArabic.variable}`;
