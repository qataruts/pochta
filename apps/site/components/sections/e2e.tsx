import type { Dictionary } from "@/lib/i18n";
import {
  IconKey,
  IconLock,
  IconArchiveOff,
  IconMail,
  IconShield,
  IconCheck,
  IconAlert,
} from "@/components/icons";

const POINT_ICONS = [IconKey, IconLock, IconArchiveOff, IconMail];

export function E2ESection({ dict }: { dict: Dictionary }) {
  const e = dict.e2e;
  return (
    <section className="section" id="security">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{e.eyebrow}</span>
          <h2 className="h-section">{e.title}</h2>
          <p className="lead">{e.lead}</p>
        </div>

        <div className="e2e-points">
          {e.points.map((point, i) => {
            const Icon = POINT_ICONS[i] ?? IconLock;
            return (
              <div className="card card--hover" key={point.title}>
                <span className="icon-badge">
                  <Icon />
                </span>
                <h3>{point.title}</h3>
                <p>{point.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="crypto-chips">
          {e.chips.map((chip) => (
            <span className="crypto-chip" key={chip}>
              <IconShield />
              {chip}
            </span>
          ))}
        </div>

        <div className="limits">
          <div className="limits-head">
            <span className="g">
              <IconShield />
            </span>
            <h3>{e.limits.title}</h3>
          </div>
          <p className="limits-lead">{e.limits.lead}</p>
          <ul className="limits-list">
            {e.limits.items.map((item, i) => (
              <li key={i}>
                <span className={`mk ${item.kind}`}>
                  {item.kind === "ok" ? <IconCheck /> : <IconAlert />}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
