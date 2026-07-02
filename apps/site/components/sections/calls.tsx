import type { Dictionary } from "@/lib/i18n";
import { CallGrid } from "@/components/mockups/call-grid";
import { IconInfo } from "@/components/icons";

const DIAGRAMS = [
  // 1:1 — a direct line
  <svg viewBox="0 0 120 58" fill="none" key="d1">
    <line x1="34" y1="29" x2="86" y2="29" stroke="currentColor" strokeWidth="2" />
    <circle cx="34" cy="29" r="9" fill="currentColor" />
    <circle cx="86" cy="29" r="9" fill="currentColor" />
  </svg>,
  // mesh — everyone connected to everyone
  <svg viewBox="0 0 120 58" fill="none" key="d2">
    <g stroke="currentColor" strokeWidth="1.6" opacity="0.55">
      <line x1="60" y1="12" x2="30" y2="46" />
      <line x1="60" y1="12" x2="90" y2="46" />
      <line x1="30" y1="46" x2="90" y2="46" />
    </g>
    <circle cx="60" cy="12" r="8" fill="currentColor" />
    <circle cx="30" cy="46" r="8" fill="currentColor" />
    <circle cx="90" cy="46" r="8" fill="currentColor" />
  </svg>,
  // SFU — a central host with spokes
  <svg viewBox="0 0 120 58" fill="none" key="d3">
    <g stroke="currentColor" strokeWidth="1.6" opacity="0.55">
      <line x1="60" y1="29" x2="24" y2="14" />
      <line x1="60" y1="29" x2="24" y2="44" />
      <line x1="60" y1="29" x2="96" y2="14" />
      <line x1="60" y1="29" x2="96" y2="44" />
    </g>
    <circle cx="24" cy="14" r="6.5" fill="currentColor" opacity="0.7" />
    <circle cx="24" cy="44" r="6.5" fill="currentColor" opacity="0.7" />
    <circle cx="96" cy="14" r="6.5" fill="currentColor" opacity="0.7" />
    <circle cx="96" cy="44" r="6.5" fill="currentColor" opacity="0.7" />
    <circle cx="60" cy="29" r="10" fill="currentColor" />
  </svg>,
];

export function CallsSection({ dict }: { dict: Dictionary }) {
  const c = dict.calls;
  return (
    <section className="section section--alt" id="calls">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="h-section">{c.title}</h2>
          <p className="lead">{c.lead}</p>
        </div>

        <div className="tier-flow">
          {c.tiers.map((tier, i) => (
            <div className="tier" key={tier.size}>
              <span className="tier-step">
                <span className="tier-num">{i + 1}</span>
              </span>
              <div className="tier-diagram">{DIAGRAMS[i]}</div>
              <div className="tier-size">{tier.size}</div>
              <div className="tier-model">{tier.model}</div>
              <p className="tier-desc">{tier.desc}</p>
            </div>
          ))}
        </div>

        <div className="calls-showcase">
          <CallGrid dict={dict} />
          <div>
            <p className="calls-note">
              <IconInfo />
              <span>{c.note}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
