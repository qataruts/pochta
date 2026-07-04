import { useEffect, useRef, useState } from "react";
import { RoomCall } from "@elementaio/vox-sdk";
import type { Identity } from "./lib/identity";
import { socketUrl, httpBase } from "./lib/server";
import { meetingLink } from "./lib/meeting";
import { useLocales } from "./locales";
import { Logo, IconVideo, IconVideoOff, IconLink } from "./components/icons";
import { CallVideo, CallControls } from "./components/callkit";
import { useTrackControls, useHasVideo, initial } from "./lib/call";

type Peers = Record<string, { name: string; stream: MediaStream }>;

/**
 * A meeting room — reached by opening a `?meet=<id>` link. Works for a signed-in
 * user OR a guest (an ephemeral identity, no account). Pre-join camera check,
 * then a full end-to-end mesh call.
 */
export default function Meeting({
  roomId,
  identity,
  guest,
  onExit,
}: {
  roomId: string;
  identity: Identity;
  guest: boolean;
  onExit: () => void;
}) {
  const { t } = useLocales();
  const [stage, setStage] = useState<"pre" | "live">("pre");
  const [name, setName] = useState(guest ? "" : identity.name);
  const [wantVideo, setWantVideo] = useState(true);
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Peers>({});
  const [count, setCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const roomRef = useRef<RoomCall | null>(null);

  // Pre-join camera preview.
  useEffect(() => {
    if (stage !== "pre") return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((tk) => tk.stop());
        stream = s;
        setPreview(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tk) => tk.stop());
    };
  }, [stage]);

  // Leave the room if the component unmounts.
  useEffect(() => () => roomRef.current?.leave(), []);

  function join() {
    preview?.getTracks().forEach((tk) => tk.stop());
    setPreview(null);
    const room = new RoomCall({
      socketUrl: socketUrl(),
      httpBase: httpBase(),
      identity,
      roomId,
      name: name.trim() || t("meeting.guest"),
      video: wantVideo,
      events: {
        onStatus: () => {},
        onLocalStream: setLocal,
        onPeer: (pk, pname, stream) =>
          setPeers((prev) => {
            const next = { ...prev };
            if (stream) next[pk] = { name: pname, stream };
            else delete next[pk];
            return next;
          }),
        onCount: setCount,
      },
    });
    roomRef.current = room;
    void room.join();
    setStage("live");
  }

  function leave() {
    roomRef.current?.leave();
    roomRef.current = null;
    onExit();
  }

  function copyLink() {
    void navigator.clipboard.writeText(meetingLink(roomId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (stage === "pre") {
    return (
      <div className="meet-pre">
        <div className="meet-pre-card">
          <div className="meet-brand">
            <Logo size={34} />
            <span className="wordmark">Vox</span>
          </div>
          <div className="meet-preview">
            {preview && wantVideo ? (
              <CallVideo stream={preview} className="meet-preview-video" muted />
            ) : (
              <div className="meet-preview-off">
                <div className="avatar callbig">{initial(name || t("meeting.you"))}</div>
              </div>
            )}
            <button
              className={`meet-cam-toggle ${wantVideo ? "" : "off"}`}
              onClick={() => setWantVideo((v) => !v)}
              title={wantVideo ? t("call.cameraOff") : t("call.cameraOn")}
            >
              {wantVideo ? <IconVideo width="20" height="20" /> : <IconVideoOff width="20" height="20" />}
            </button>
          </div>
          <h1>{t("meeting.readyTitle")}</h1>
          {guest && (
            <input
              className="meet-name"
              placeholder={t("meeting.yourName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join()}
              autoFocus
            />
          )}
          <button className="meet-join" onClick={join}>
            {t("meeting.join")}
          </button>
          <button className="meet-copy" onClick={copyLink}>
            <IconLink width="16" height="16" /> {copied ? t("chat.copied") : t("meeting.copyLink")}
          </button>
          <p className="meet-note">{t("meeting.e2eNote")}</p>
        </div>
      </div>
    );
  }

  return <MeetingLive local={local} peers={peers} count={count} onCopy={copyLink} copied={copied} onLeave={leave} />;
}

function MeetingLive({
  local,
  peers,
  count,
  onCopy,
  copied,
  onLeave,
}: {
  local: MediaStream | null;
  peers: Peers;
  count: number;
  onCopy: () => void;
  copied: boolean;
  onLeave: () => void;
}) {
  const { t } = useLocales();
  const ctl = useTrackControls(local);
  const entries = Object.entries(peers);

  return (
    <div className="call-overlay">
      <div className="call-topbar">
        <div className="call-head">
          <div className="call-title">{t("call.participants", { n: count })}</div>
        </div>
        <div className="meet-top-actions">
          <button className="meet-invite" onClick={onCopy}>
            <IconLink width="15" height="15" /> {copied ? t("chat.copied") : t("meeting.invite")}
          </button>
          <div className="call-e2e">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            {t("call.encrypted")}
          </div>
        </div>
      </div>

      <div className={`gc-grid count-${Math.min(count, 6)}`}>
        {local && <MeetTile stream={local} name={t("call.you")} you />}
        {entries.map(([pk, p]) => (
          <MeetTile key={pk} stream={p.stream} name={p.name} />
        ))}
      </div>

      {entries.length === 0 && <div className="call-waiting">{t("meeting.waiting")}</div>}

      <CallControls ctl={ctl} onHangup={onLeave} />
    </div>
  );
}

function MeetTile({ stream, name, you }: { stream: MediaStream; name: string; you?: boolean }) {
  const { t } = useLocales();
  const hasVideo = useHasVideo(stream);
  return (
    <div className="gc-tile">
      {hasVideo ? (
        <CallVideo stream={stream} className={`gc-tile-video ${you ? "mirror" : ""}`} muted={you} />
      ) : (
        <div className="gc-tile-avatar">
          <div className="avatar med">{initial(name)}</div>
        </div>
      )}
      <span className="gc-tile-name">{you ? `${name} (${t("call.you")})` : name}</span>
    </div>
  );
}
