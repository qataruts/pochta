import { useEffect, useState } from "react";
import { useLocales } from "../../locales";
import { desktop, type NetworkStatus } from "../../lib/desktop";
import { setServer } from "../../lib/server";
import { RoleCard } from "./RoleCard";

/**
 * The Host panel — the only place hosting lives, and only in the desktop app.
 * ONE role: turning Host on makes this desktop help run the network (its own
 * circle's sealed mail today; forwarding for big meetings when its connection can
 * spare it, offered not forced, is the roadmap). It points this client at the
 * local relay and reloads (reusing the same relay-override the server switch uses).
 * A host only ever sees ciphertext.
 */
export function NetworkPanel({ onClose }: { onClose: () => void }) {
  const { t } = useLocales();
  const bridge = desktop();
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!bridge) return;
    void (async () => {
      setStatus({ host: await bridge.host.status() });
    })();
    return bridge.onStatus(setStatus);
  }, [bridge]);

  // Not the desktop app → hosting isn't available here (web/mobile are clients).
  if (!bridge) {
    return (
      <Shell title={t("network.title")} onClose={onClose}>
        <p className="net-intro">{t("network.desktopOnly")}</p>
      </Shell>
    );
  }

  async function toggleHost(next: boolean) {
    if (!bridge) return;
    setBusy(true);
    try {
      const s = next ? await bridge.host.start() : await bridge.host.stop();
      // Point the client at the local relay (or back to default), then reconnect.
      setServer(next && s.port ? `ws://localhost:${s.port}` : "");
      location.reload();
    } finally {
      setBusy(false);
    }
  }

  const host = status?.host;

  return (
    <Shell title={t("network.title")} onClose={onClose}>
      <p className="net-intro">{t("network.intro")}</p>

      <RoleCard
        icon="🏤"
        title={t("network.host.title")}
        desc={t("network.host.desc")}
        on={!!host?.running}
        busy={busy}
        toggleLabel={t("network.host.title")}
        status={
          host?.running ? t("network.host.statusOn", { port: host.port }) : t("network.host.statusOff")
        }
        tone={host?.running ? "live" : "muted"}
        note={t("network.host.note")}
        onToggle={toggleHost}
      />

      <div className="net-foot">{t("network.footNote")}</div>
    </Shell>
  );
}

function Shell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="net-overlay" onClick={onClose}>
      <div className="net-panel" onClick={(e) => e.stopPropagation()}>
        <div className="net-header">
          <h3>{title}</h3>
          <button className="net-close" aria-label="close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
