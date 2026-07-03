# Vox — architecture & design

Technical deep-dive (the README is the product overview). Companion doc:
[PROTOCOL.md](PROTOCOL.md) (the client/relay wire contract). This doc is written to
double as an LLM context document — paste it in and you can reason about the system.

## Tech stack

- **Relay (backend)**: Elixir + Phoenix (channels for signaling/inbox; a small
  HTTP surface for media blobs + serving the SPA). Bandit server.
- **Messaging core**: **`chat_engine`** — a separate Elixir library providing
  ordering (gap-free `seq`), per-device cursors, exactly-once catch-up, presence,
  fan-out, and clustering behind pluggable *ports*. Pinned by tag as a git
  dependency from [github.com/elementaio/engine](https://github.com/elementaio/engine)
  (public — Docker builds fetch it with no tokens; bump the tag for updates).
- **Storage**: Ecto adapters implementing the engine's ports, over **SQLite**
  (`ecto_sqlite3`, default) or **Postgres** (`postgrex`). Chosen by config.
- **Client SDK**: [`@elementaio/vox-sdk`](packages/sdk) — framework- & storage-agnostic
  TypeScript (identity, crypto, transport, ops). Published to npm.
- **Web client**: React + Vite + TypeScript, consuming the SDK.
- **Crypto (client)**: `@noble/curves` (ed25519 + x25519), `@noble/ciphers`
  (xchacha20poly1305), `@noble/hashes`, `@scure/bip39`. WebCrypto (PBKDF2/AES-GCM)
  for the identity vault.
- **Realtime**: WebRTC (RTCPeerConnection, media), STUN/TURN (relay-provided).
- **On-device storage**: IndexedDB (`idb`), encrypted at rest.

## Diagram

```
┌─────────────── device (browser / later desktop+mobile) ───────────────┐
│ React UI  ─consumes→  @elementaio/vox-sdk                                  │
│  identity   vault (passphrase→AES-GCM), Ed25519+X25519 keys             │
│  crypto     sign-then-seal envelopes                                    │
│  client     ONE socket → inbox channel; all app logic                  │
│  blobs      encrypt→upload / download→decrypt media                    │
│  (browser bindings: IndexedDB Store, localStorage vault, relay URLs)    │
└───────────┬───────────────────────────────────────────┬────────────────┘
            │ WebSocket (Phoenix)                         │ HTTP (media blobs)
            ▼                                             ▼
┌──────────────────────── relay (Elixir/Phoenix) ────────────────────────┐
│ UserSocket    signature auth (Ed25519 via :crypto)                      │
│ InboxChannel  per-identity mailbox: send/deliver, receipts, typing,     │
│               presence query, AND call signaling — all opaque/sealed    │
│ EngineTransport → chat_engine (Session per device, cursor catch-up)     │
│ Ports.Db.*    Ecto adapters (SQLite default | Postgres) implement the   │
│               engine's Persistence/Cursor/Conversation/Receipt/Presence │
│ BlobController content-blind encrypted media store                      │
│ Federation    signed relay-to-relay forwarding (durable outbox + retry) │
│ Retention     GC messages+blobs older than the window                   │
│ PageController serves the bundled SPA (single self-hosted deployable)   │
└─────────────────────────────────────────────────────────────────────────┘
  once two peers connect ──► direct P2P WebRTC media for calls (no server)
```

**The model that ties it together — the per-identity inbox.** Each account's inbox
is a single-member `chat_engine` conversation keyed by the public key. Sending to a
contact = `inject` a sealed envelope into *their* inbox; each of their devices is a
`Session` with its own cursor and catches up. Text, receipts, typing, reactions,
edits, media refs, and call signaling are all sealed payloads through this one
path. Calls then establish direct WebRTC media.

## Repo map

```
packages/sdk/     @elementaio/vox-sdk — framework- & storage-agnostic client core
  src/            (published to npm; the web app consumes it via alias)
    crypto.ts       seal()/open() — sign-then-seal (pure)
    identity.ts     keys, 12-word phrase, Vault(kv) — encrypted vault + device id
    client.ts       the messaging client (socket, inbox, all ops, calls); injects Store+URLs
    blobs.ts        media encrypt+upload / download+decrypt
    invite.ts enroll.ts protocol.ts types.ts   invites, private-relay enroll, wire consts, model+Store port
    index.ts        barrel export
apps/web/src/
  lib/            thin BROWSER bindings over the SDK (keep the app's imports stable):
    identity.ts     Vault(localStorage)
    db.ts           IndexedDB (encrypted at rest) implementing the SDK `Store`
    client.ts       injects the IndexedDB store + relay URLs into the SDK Client
    server.ts       relay URL selection (self-host)  ·  invite.ts / enroll.ts wrap SDK with httpBase()
  Welcome.tsx Unlock.tsx Messenger.tsx App.tsx AdminPanel.tsx   UI
apps/server/lib/
  vox_web/channels/user_socket.ex     signature auth
  vox_web/channels/inbox_channel.ex   the mailbox (+ call signaling)
  vox_web/engine_transport.ex         engine → channel bridge
  vox_web/controllers/*.ex            blobs, config, federation, membership, admin, page
  vox/ports/db/*.ex                   Ecto port adapters (SQLite/PG)
  vox/federation*.ex                  signed relay-to-relay forwarding + policy
  vox/membership.ex, admin.ex         guarded membership + admin facade
  vox/retention.ex                    delivery-buffer GC
  vox/release.ex                      schema migrations + boot
  (chat_engine — git dependency, pinned by tag; no vendored copy)
```

## Key design decisions (the "why")

- **Text goes through the relay, not P2P.** Offline delivery + multi-device need a
  fan-out/queue point; text is tiny so P2P buys nothing. WebRTC is reserved for
  **calls** (where P2P media matters). Standard messenger split.
- **Per-recipient sealing** (not a shared group key) — simple and correct for 1:1.
  Trade-off: group chat will want sender-keys/MLS.
- **Server = bounded encrypted buffer.** Retention GC (30d) keeps it from being an
  archive; the durable truth is on devices.
- **No "primary" device.** Multi-device truth is the union of devices; because
  messages are immutable + id'd + `seq`-ordered, merges are conflict-free.
- **Storage behind ports** — SQLite for plug-and-play self-host, Postgres for
  scale, zero code change (proves `chat_engine`'s design).
- **Client SDK, not a coupled app.** All client logic lives in `@elementaio/vox-sdk`
  with storage/transport injected — so third parties build their own apps on the
  same E2E core (see [PROTOCOL.md](PROTOCOL.md)).

## Does the `chat_engine` need changes? (assessment)

Short answer: **no blockers — it's carrying the load well.** Nice-to-haves from
integrating it:

- **Presence change subscription.** We poll presence every 20s; a
  subscribe/notify-on-change API would remove the polling.
- **First-class "mailbox" pattern.** The engine is conversation-centric; our
  per-identity single-member inbox works but bypasses its group features
  (seen-by-N receipts, membership). A documented mailbox mode would fit E2E apps.
- **DX guardrails.** `append/2` (persist only) vs `inject/2` (persist + fan out)
  is an easy footgun; and the in-memory adapter accepts non-binary payloads while
  SQL adapters need binary — enforcing binary everywhere would fail fast.
- **Retention hook.** The engine has no log GC (bodies do it, as we did) — an
  optional retention policy per conversation would be handy.
- **Big one (future):** untrusted-node federation for the volunteer-relay vision —
  a major feature, not a fix.

Larger items on the horizon: per-device keys, group chat (sender-keys/MLS + SFU),
TURN for strict NATs, forward secrecy (Double Ratchet), the untrusted volunteer-node
mesh, human-friendly `@handles`, and native mobile apps.

## Transport seam & serverless discovery (design)

**The seam (done).** The SDK `Client` no longer talks to Phoenix directly — it depends
on a `Transport` interface ([`packages/sdk/src/transport.ts`](packages/sdk/src/transport.ts)):
`connect` (subscribe to sealed envelopes + status), `send`, `queryPresence`, `leave`.
Today's relay is one implementation, `PhoenixTransport` (one socket + your inbox
channel). Inject a different backend via `ClientConfig.transport`; the messaging + call
machinery is unchanged. The transport only ever moves **sealed** envelopes — it never
sees plaintext, on any backend. Verified behaviour-preserving: 1:1, mesh, and SFU calls
all still pass against the relay through `PhoenixTransport`.

**Why:** it decouples *how peers find and reach each other* from the E2E core, so the
last bit of centralization — the relay as rendezvous — can be swapped for a peer mesh.

**Serverless discovery (future backend).** A `DhtTransport` on **js-libp2p**:
- **Discovery:** a Kademlia DHT keyed by **pubkey → your signed, current endpoint**
  (addresses + ICE candidates). `lookup(pubkey)` → connect directly (WebRTC), no relay
  in the middle. DHT nodes = the desktop hosts; a newcomer bootstraps off a few known ones.
- **Transport:** libp2p's WebRTC transport for the connection; **circuit-relay** for
  hard NATs (a volunteer host relays the encrypted stream — the TURN role).
- **Not replaced by the DHT:** offline delivery still needs a **host mailbox** (a DHT
  only rendezvous *online* peers), and presence becomes gossip/heartbeat rather than a
  server query. So the DHT kills the *discovery/signaling* server; hosts still provide
  the post office + relay-of-last-resort.
- **Scope:** the seam is the buildable step (done); the js-libp2p backend (WebRTC +
  Kademlia + circuit-relay + bootstrap + a mailbox bridge) is the multi-week build.
