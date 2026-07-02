import type { Dictionary } from "@/lib/i18n";
import { LINKS } from "@/lib/links";
import {
  IconDesktop,
  IconGlobe,
  IconPhone,
  IconPackage,
  IconServer,
  IconArrowRight,
} from "@/components/icons";

const PRODUCT_ICONS = [IconDesktop, IconGlobe, IconPhone];
const DEV_ICONS = [IconPackage, IconServer];

export function TwoWays({ dict }: { dict: Dictionary }) {
  const t = dict.twoWays;
  return (
    <section className="section section--alt" id="two-ways">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 className="h-section">{t.title}</h2>
          <p className="lead">{t.lead}</p>
        </div>

        <div className="two-panels">
          {/* Product */}
          <div className="panel panel--product">
            <span className="panel-label">{t.product.label}</span>
            {t.product.items.map((item, i) => {
              const Icon = PRODUCT_ICONS[i] ?? IconDesktop;
              return (
                <div className={`stack-item${item.flag ? " is-flag" : ""}`} key={item.name}>
                  <span className="stack-ic">
                    <Icon />
                  </span>
                  <div className="stack-main">
                    <div className="stack-head">
                      <span className="stack-name">{item.name}</span>
                      {item.flag ? (
                        <span className="badge badge--flag">{item.flag}</span>
                      ) : null}
                      <span className="badge badge--muted">{item.badge}</span>
                    </div>
                    {item.platforms ? (
                      <span className="stack-platforms">{item.platforms}</span>
                    ) : null}
                    <p className="stack-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
            <p className="panel-foot">{t.product.footnote}</p>
          </div>

          {/* Dev tools */}
          <div className="panel">
            <span className="panel-label">{t.dev.label}</span>
            {t.dev.items.map((item, i) => {
              const Icon = DEV_ICONS[i] ?? IconPackage;
              return (
                <div className="stack-item" key={item.name}>
                  <span className="stack-ic">
                    <Icon />
                  </span>
                  <div className="stack-main">
                    <div className="stack-head">
                      <span className="stack-name mono">{item.name}</span>
                      <span className="badge badge--muted">{item.badge}</span>
                    </div>
                    <p className="stack-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
            <p className="panel-foot">
              <a className="panel-link" href={LINKS.devGuide} target="_blank" rel="noreferrer">
                {t.dev.footnote}
                <IconArrowRight className="arrow" width={16} height={16} />
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
