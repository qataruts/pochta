import type { Dictionary } from "@/lib/i18n";
import { HostPanel } from "@/components/mockups/host-panel";
import { IconHand, IconEyeOff, IconNetwork, IconInfo } from "@/components/icons";

const ICONS = [IconHand, IconEyeOff, IconNetwork];

export function HostSection({ dict }: { dict: Dictionary }) {
  const h = dict.host;
  return (
    <section className="section" id="host">
      <div className="container split">
        <div className="split-copy">
          <span className="eyebrow">{h.eyebrow}</span>
          <h2 className="h-section">{h.title}</h2>
          <p className="lead">{h.lead}</p>

          <div className="feature-list">
            {h.points.map((point, i) => {
              const Icon = ICONS[i] ?? IconNetwork;
              return (
                <div className="feature-item" key={point.title}>
                  <span className="feature-ic">
                    <Icon />
                  </span>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="honest-note">
            <IconInfo />
            <span>{h.honest}</span>
          </div>
        </div>

        <div className="split-media">
          <HostPanel dict={dict} />
        </div>
      </div>
    </section>
  );
}
