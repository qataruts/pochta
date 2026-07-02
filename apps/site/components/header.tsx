import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { LangSwitch } from "./lang-switch";
import { IconGitHub } from "./icons";
import { LINKS } from "@/lib/links";
import type { Dictionary, Locale } from "@/lib/i18n";

export function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="site-header">
      <div className="container nav">
        <a className="brand" href={`/${lang}`} aria-label="Pochta">
          <Logo size={32} className="brand-mark" />
          <span>Pochta</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a href="#two-ways">{dict.nav.twoWays}</a>
          <a href="#host">{dict.nav.host}</a>
          <a href="#calls">{dict.nav.calls}</a>
          <a href="#security">{dict.nav.security}</a>
          <a href="#developers">{dict.nav.developers}</a>
        </nav>

        <div className="nav-actions">
          <LangSwitch
            lang={lang}
            label={dict.nav.switchLang}
            ariaLabel={dict.nav.switchLangAria}
          />
          <ThemeToggle label={dict.a11y.toggleTheme} />
          <a
            className="btn btn-ghost btn-sm"
            href={LINKS.github}
            target="_blank"
            rel="noreferrer"
          >
            <IconGitHub width={17} height={17} />
            <span className="nav-github-label">{dict.nav.github}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
