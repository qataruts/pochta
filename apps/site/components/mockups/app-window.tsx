import type { Dictionary } from "@/lib/i18n";
import { IconSearch, IconLock, IconSend } from "@/components/icons";

export function AppWindow({ dict }: { dict: Dictionary }) {
  const m = dict.hero.mockup;
  return (
    <div className="mock-window" aria-hidden>
      <div className="mock-titlebar">
        <div className="mock-traffic">
          <i />
          <i />
          <i />
        </div>
        <span className="mock-title">{m.appName}</span>
        <span className="mock-host-pill">
          <span className="dot" />
          {m.hostPill}
        </span>
      </div>

      <div className="mock-body">
        <aside className="mock-sidebar">
          <div className="mock-search">
            <IconSearch />
            <span>{m.search}</span>
          </div>

          <div className="mock-convo is-active">
            <span className="mock-avatar g1">L</span>
            <div className="mock-convo-text">
              <div className="mock-convo-name">{m.convo1Name}</div>
              <div className="mock-convo-preview">{m.convo1Preview}</div>
            </div>
          </div>
          <div className="mock-convo">
            <span className="mock-avatar g2">D</span>
            <div className="mock-convo-text">
              <div className="mock-convo-name">{m.convo2Name}</div>
              <div className="mock-convo-preview">{m.convo2Preview}</div>
            </div>
          </div>
          <div className="mock-convo">
            <span className="mock-avatar g3">O</span>
            <div className="mock-convo-text">
              <div className="mock-convo-name">{m.convo3Name}</div>
              <div className="mock-convo-preview">{m.convo3Preview}</div>
            </div>
          </div>
        </aside>

        <div className="mock-chat">
          <div className="mock-chat-head">
            <span className="mock-avatar g1" style={{ width: 30, height: 30 }}>
              L
            </span>
            <div>
              <div className="name">{m.activeName}</div>
              <div className="presence">{m.presence}</div>
            </div>
            <span className="lock">
              <IconLock />
            </span>
          </div>

          <div className="mock-messages">
            <div className="mock-sys">
              <IconLock />
              {m.encryptedNote}
            </div>
            <div className="bubble in">{m.bubbleIn}</div>
            <div className="bubble out">{m.bubbleOut}</div>
          </div>

          <div className="mock-input">
            <span className="field">{m.inputPlaceholder}</span>
            <span className="mock-send">
              <IconSend />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
