import { getDictionary, locales, isLocale, type Locale } from "@/lib/i18n";
import { Hero } from "@/components/sections/hero";
import { TwoWays } from "@/components/sections/two-ways";
import { HostSection } from "@/components/sections/host";
import { CallsSection } from "@/components/sections/calls";
import { E2ESection } from "@/components/sections/e2e";
import { Developers } from "@/components/sections/developers";
import { FinalCta } from "@/components/sections/cta";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? raw : "en";
  const dict = getDictionary(lang);

  return (
    <main id="main">
      <Hero dict={dict} />
      <TwoWays dict={dict} />
      <HostSection dict={dict} />
      <CallsSection dict={dict} />
      <E2ESection dict={dict} />
      <Developers dict={dict} />
      <FinalCta dict={dict} />
    </main>
  );
}
