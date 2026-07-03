import { Logo } from "./logo";
import { LINKS } from "@/lib/links";
import type { Dictionary, Locale } from "@/lib/i18n";

function resolve(href: string): string {
  return (LINKS as Record<string, string>)[href] ?? href;
}

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const cols = dict.footer.columns;
  const groups = [cols.product, cols.developers, cols.project];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <a className="brand" href={`/${lang}`} aria-label="Vox">
              <Logo size={30} className="brand-mark" />
              <span>Vox</span>
            </a>
            <p className="footer-tagline">{dict.footer.tagline}</p>
          </div>

          {groups.map((group) => (
            <div className="footer-col" key={group.title}>
              <h4>{group.title}</h4>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={resolve(link.href)} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>{dict.footer.madeBy}</span>
          <span className="note">{dict.footer.note}</span>
        </div>
      </div>
    </footer>
  );
}
