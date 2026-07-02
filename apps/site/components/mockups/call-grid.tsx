import type { Dictionary } from "@/lib/i18n";
import { IconMic, IconVideo, IconPhoneOff } from "@/components/icons";

const GRAD = ["g1", "g2", "g3", "g4", "g5", "g6"];

export function CallGrid({ dict }: { dict: Dictionary }) {
  const g = dict.calls.grid;
  return (
    <div className="call-frame" aria-hidden>
      <div className="call-grid">
        {g.names.map((name, i) => {
          const isHost = i === 0;
          const isYou = i === g.names.length - 1;
          const initial = Array.from(name)[0] ?? "";
          return (
            <div className={`call-tile ${GRAD[i % GRAD.length]}${isHost ? " is-host" : ""}`} key={i}>
              {isHost && <span className="t-host">{g.host}</span>}
              <span className="t-avatar">{initial}</span>
              <span className="t-name">{isYou ? g.you : name}</span>
            </div>
          );
        })}
      </div>

      <div className="call-bar">
        <span className="call-ctrl">
          <IconMic />
        </span>
        <span className="call-ctrl">
          <IconVideo />
        </span>
        <span className="call-ctrl is-end">
          <IconPhoneOff />
        </span>
      </div>

      <p className="call-caption">{g.caption}</p>
    </div>
  );
}
