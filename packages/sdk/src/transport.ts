/**
 * The transport seam. The `Client` talks to a `Transport` — connect/subscribe,
 * send a sealed envelope, query presence, leave — instead of to Phoenix directly.
 * Today's relay is one implementation (`PhoenixTransport`); a peer-to-peer DHT
 * (js-libp2p: Kademlia for pubkey→endpoint discovery + WebRTC transport + circuit
 * relay for NAT) can be another, WITHOUT touching the Client. The transport only
 * ever moves SEALED envelopes — it never sees plaintext, on any backend.
 *
 * Out of scope of this seam (still HTTP, still relay-bound for now): ICE-server
 * config (`GET /config`) and the blob store. A DHT backend would provide those by
 * other means; that's a later step.
 */
import { Socket, type Channel } from "phoenix";
import { authParams, type Identity } from "./identity";
import { EVENTS, inboxTopic } from "./protocol";
import type { SealedEnvelope } from "./crypto";

/** An outbound sealed envelope addressed to a pubkey. */
export interface Outbound {
  to: string;
  envelope: SealedEnvelope;
  id: string;
  ephemeral: boolean; // true = live-only signaling; false = store-and-forward
  relay?: string; // recipient's home-relay hint for cross-server delivery
}

/** One presence result row. */
export interface PresenceRow {
  pubkey: string;
  online: boolean;
  lastSeen: number | null;
}

/** Callbacks the transport invokes as things arrive. */
export interface TransportEvents {
  onEnvelope: (env: SealedEnvelope) => void;
  onStatus: (status: string) => void;
  onReady: () => void; // subscribed + ready (e.g. inbox joined) → safe to poll presence
}

/** What the Client needs from any backend to move sealed mail + learn presence. */
export interface Transport {
  connect(events: TransportEvents): void;
  send(msg: Outbound): void;
  queryPresence(pubkeys: string[], onResult: (rows: PresenceRow[]) => void): void;
  leave(): void;
}

/**
 * The relay-backed transport: one Phoenix socket + your inbox channel. This is the
 * exact behaviour the Client used to embed, now behind the seam.
 */
export class PhoenixTransport implements Transport {
  private socket: Socket;
  private inbox: Channel;

  constructor(socketUrl: string, identity: Identity, deviceId: string) {
    this.socket = new Socket(socketUrl, { params: authParams(identity) });
    this.inbox = this.socket.channel(inboxTopic(identity.publicKeyHex), { device_id: deviceId });
  }

  connect(events: TransportEvents): void {
    this.socket.onOpen(() => events.onStatus("connected"));
    this.socket.onError(() => events.onStatus("reconnecting…"));
    this.socket.onClose(() => events.onStatus("offline"));
    this.socket.connect();

    this.inbox.on(EVENTS.message, (m: { envelope: SealedEnvelope }) => events.onEnvelope(m.envelope));
    this.inbox
      .join()
      .receive("ok", () => {
        events.onStatus("connected");
        events.onReady();
      })
      .receive("error", (e) => events.onStatus(`inbox error: ${JSON.stringify(e)}`));
  }

  send(msg: Outbound): void {
    this.inbox.push(EVENTS.send, msg);
  }

  queryPresence(pubkeys: string[], onResult: (rows: PresenceRow[]) => void): void {
    this.inbox
      .push(EVENTS.presence, { of: pubkeys })
      .receive("ok", (resp: { presence: Record<string, { online: boolean; last_seen: number | null }> }) => {
        onResult(
          Object.entries(resp.presence).map(([pubkey, i]) => ({
            pubkey,
            online: i.online,
            lastSeen: i.last_seen,
          })),
        );
      });
  }

  leave(): void {
    this.inbox.leave();
    this.socket.disconnect();
  }
}
