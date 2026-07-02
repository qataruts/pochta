import type { Dictionary } from "@/lib/i18n";
import { IconServer, IconEyeOff, IconCheck } from "@/components/icons";

export function HostPanel({ dict }: { dict: Dictionary }) {
  const p = dict.host.panel;
  return (
    <div className="host-card" aria-hidden>
      <div className="host-card-top">
        <span className="host-glyph">
          <IconServer />
        </span>
        <div>
          <div className="host-title">{p.title}</div>
          <div className="host-status">{p.status}</div>
        </div>
        <span className="host-switch" role="presentation" />
      </div>

      <div className="host-row">
        <span className="lead-ic">
          <IconServer />
        </span>
        <span>{p.relayLabel}</span>
        <span className="host-cipher mono">a7f3·9c…2e1b·4d</span>
      </div>

      <div className="host-row">
        <span className="lead-ic">
          <IconEyeOff />
        </span>
        <span>{p.ciphertextNote}</span>
        <span className="host-badge-ok">
          <IconCheck />
        </span>
      </div>

      <div className="host-meter">
        <span className="label">{p.uplink}</span>
        <span className="host-bars">
          <i />
        </span>
      </div>

      <div className="host-for">
        <span className="host-stack">
          <span className="mini g1">L</span>
          <span className="mini g2">K</span>
          <span className="mini g3">O</span>
          <span className="mini g4">S</span>
        </span>
        <span>{p.forLabel}</span>
      </div>
    </div>
  );
}
