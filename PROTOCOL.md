# Vox protocol

*Version 1.* This is the wire contract between a **Vox client** and a **Vox
relay** — enough to write your own client (any language) or audit ours. The
reference implementation is [`@elementaio/vox-sdk`](apps/web/src/sdk) (TypeScript).

Vox's model: the relay is a **post office, not an archive**. It carries sealed
envelopes and holds them only until delivery (then GC). It never sees plaintext,
never keeps history. All content security lives in the client — which is why a
client is not "dumb": it holds the keys and does the crypto described here.

---

## 1. Identity

An account **is** an Ed25519 keypair; there is no username/password and no server
account record.

- **Signing key** — Ed25519. The 32-byte seed is the private key; the public key
  (64 hex chars) is your account id. Derived from a 12-word BIP39 mnemonic (first
  32 bytes of the BIP39 seed).
- **Encryption key** — X25519, derived deterministically from the signing seed:
  `encPriv = SHA-256(seed ‖ "x25519-v1")`, `encPub = X25519.getPublicKey(encPriv)`.
  Published so others can seal to you.
- **Display name** — deterministic from the pubkey (`adjective-animal-NNNN`); UI
  sugar, not identity.

## 2. Transport & authentication

Transport is **Phoenix Channels over WebSocket** at `/socket`.

**Connect params** (proof you hold the key):

| param    | value                                             |
|----------|---------------------------------------------------|
| `pubkey` | Ed25519 public key (hex)                           |
| `enc`    | X25519 public key (hex)                            |
| `ts`     | `String(Date.now())` (ms)                          |
| `sig`    | `Ed25519.sign("<pubkey>|<enc>|<ts>")` (hex)        |
| `name`   | display name (optional)                            |

Signing `pubkey|enc|ts` both proves possession of the signing key **and binds**
your encryption key to your identity (a malicious relay can't swap in its own
`enc` to MITM). The relay verifies the signature and a fresh `ts`, and — on a
guarded relay — that the pubkey is enrolled. (A nonce challenge replaces the `ts`
window in a later version.)

**Inbox channel.** After connect, join your own inbox:

```
topic:  inbox:<your-pubkey-hex>
params: { device_id: "<stable-uuid>" }
```

`device_id` is a stable per-device id so the relay's delivery cursor replays only
genuinely-missed messages after a reconnect (exactly-once catch-up), not the whole
backlog. You may only join your **own** inbox.

## 3. The sealed envelope (E2E)

Every message is **signed then sealed** (`seal`/`open` in the SDK). The relay only
ever sees the `SealedEnvelope`.

**Seal** (`body` → envelope), given sender signing seed + recipient's `encPub`:

1. `sig = Ed25519.sign( JSON.stringify({from, ts, body}) )` — `from` is the
   sender pubkey hex, `ts` is ms.
2. `plaintext = JSON.stringify({from, ts, body, sig})`.
3. Ephemeral X25519: `epk` pub / `eph` priv (32 random bytes).
4. `shared = X25519(eph, recipientEncPub)`; `key = SHA-256(shared ‖ epk ‖ recipientEncPub)`.
5. `nonce = 24 random bytes`; `ct = XChaCha20-Poly1305(key, nonce).encrypt(plaintext)`.
6. Envelope = `{ epk: hex, n: hex(nonce), ct: hex }`.

**Open** reverses it: derive the same `key` from `(recipientEncPriv, epk)`,
decrypt, then **verify the inner Ed25519 signature** against `from` and reject on
mismatch (or if `expectFrom` is supplied and differs). No forward secrecy yet
(ephemeral sender key, long-lived recipient key); a Double-Ratchet upgrade is
future work.

## 4. Sending & receiving

**Send** — push on the inbox channel:

```
event:   "send"
payload: { to, envelope, id, ephemeral, relay }
```

- `to` — recipient pubkey hex.
- `envelope` — the sealed envelope (§3).
- `id` — app-level id for idempotency/dedup.
- `ephemeral` — `true` = live-only (never queued; used for typing + call
  signaling); `false` = store-and-forward (queued if the recipient is offline).
- `relay` — the recipient's **home-relay hint** (http base) if known, so a
  federating relay can forward cross-server. Absent/same ⇒ delivered locally.

**Receive** — the relay pushes:

```
event:   "message"
payload: { envelope }
```

`open` it, then dispatch on `body.t` (§5). Drop anything that fails to open/verify.

## 5. Sealed body schema

The `body` inside the envelope (the relay never sees these). `t` is the tag.
Outward-facing bodies carry `relay` (sender's home relay) so replies can federate.

| `t`           | fields                                                        | meaning |
|---------------|--------------------------------------------------------------|---------|
| `msg`         | `id, text, enc, name, relay?, replyTo?`                       | a chat message; `enc`/`name` re-advertise the sender |
| `carbon`      | `id, to, toName, toEnc, text, replyTo?`                       | copy of a message *I* sent, sealed to my own inbox (multi-device) |
| `media`       | `id, enc, sender, relay?, blobId, key, mime, mkind, name?`   | a media message (blob is E2E; see §6) |
| `cmedia`      | `id, to, toName, toEnc, blobId, key, mime, mkind, name?`     | carbon of a media message I sent |
| `edit`        | `targetId, text`                                             | edit a message (author only) |
| `del`         | `targetId`                                                    | delete-for-everyone (author only) → tombstone |
| `react`       | `targetId, emoji, remove`                                    | toggle a reaction |
| `rcpt`        | `id, state` (`"delivered"`\|`"read"`)                         | delivery/read receipt |
| `typing`      | `on`                                                         | typing indicator (send `ephemeral: true`) |
| `call-offer`  | `callId, sdp, video, enc, name, relay?`                      | WebRTC offer (ephemeral) |
| `call-answer` | `callId, sdp`                                                | WebRTC answer (ephemeral) |
| `call-ice`    | `callId, candidate`                                          | trickled ICE candidate (ephemeral) |
| `call-decline`| `callId`                                                     | decline (ephemeral) |
| `call-hangup` | `callId`                                                     | hang up (1:1, ephemeral) |
| `call-invite` | `callId, video, roster[], forwarder?`                        | ring for a **group** call; `roster` is a participant directory; `forwarder` = elected host (ephemeral) |
| `call-join`   | `callId, enc, name, relay?`                                  | "I accepted" — announce to the roster (ephemeral) |
| `call-leave`  | `callId`                                                     | leave a group call (ephemeral) |
| `call-host-offer` | `callId, video, roster[]`                                | ask a capable node to host (forward) the call (ephemeral) |
| `call-host-ack`   | `callId, accept`                                         | the asked node accepts/declines the forwarder role (ephemeral) |

A **`roster` entry** is `{ pk, enc, name, relay? }` — enough to seal to and name
each participant, so people who aren't each other's contacts can still connect.

**Multi-device:** carbon every outgoing message/op to your *own* inbox too
(sealed to yourself). Other devices reconstruct sent history from carbons on
catch-up. Accept carbons only when `from == your pubkey`.

**1:1 calls:** once offer/answer/ICE complete, media flows **peer-to-peer over
WebRTC** — never through the relay. ICE servers come from `GET /config`.

**Group calls (mesh):** a call becomes a room sharing one `callId`. The initiator
sends `call-invite` (with the full roster) to each invitee; on accept an invitee
sends `call-join` to every roster member. Glare is avoided **deterministically**:
for each pair the **lower pubkey** is the offerer. Receiving a `call-join`, the
lower peer sends the `call-offer`; the higher peer instead replies with a
`call-join` (a "join-back") so the lower one offers — which also repairs the race
where a join arrived before the recipient had entered the room. `call-offer/answer/ice`
are then reused **per peer**, routed by `callId`. Every leg is direct P2P (full
mesh), so small groups need no server at all.

**Forwarder (star / SFU) for larger calls:** above `MESH_MAX` participants (or when
a forwarder is named), the initiator **offers** the host role to a capable node
(`call-host-offer` → `call-host-ack`, so it's opt-in, not forced). Once accepted,
the ring's `call-invite` carries `forwarder`, and every participant connects **only
to the forwarder** (a star) instead of meshing. The forwarder then **relays each
participant's media to the others**: it adds their tracks to every other leg,
renegotiates, and sends `call-fwd` so the receiver can attribute each relayed stream
to its origin — so everyone sees everyone through one host, each holding a single
connection. **Cascading:** for very large calls, elect **multiple** forwarders — they
mesh among themselves and each serves a cluster (participants are round-robin
assigned; `call-invite.forwarders` carries the set, `forwarder` the recipient's host).
A forwarder relays its own cluster's media to peer forwarders, which fan it out to
theirs; media received *from* a forwarder is relayed only to local participants, never
back to a forwarder (no loops). The two-way forwarder↔forwarder renegotiation uses
**perfect negotiation** (polite peer rolls back on a glare). Election + star + relay +
cascade are live-tested (everyone-sees-everyone, glare-free). Remaining hardening:
**SFrame** so forwarders relay ciphertext they can't decode (today a browser forwarder
handles media in the clear).

## 6. Media blobs

Large/offline media goes through the relay's **content-blind blob store**:

1. Client picks a fresh 32-byte key + 24-byte nonce, `ct = XChaCha20-Poly1305`
   over the file, uploads `nonce ‖ ct` as `multipart/form-data` to `POST /blobs`
   → `{ id }`.
2. The `{ blobId, key(hex), mime, mkind, name? }` (`MediaRef`) rides **inside the
   sealed body** (`media`/`cmedia`).
3. Recipient `GET /blobs/:id`, splits `nonce ‖ ct`, decrypts with `key`.

The relay holds only ciphertext; the decrypt key is only ever inside E2E bodies.
No per-user authz on the blob (relies on the unguessable id + E2E of the key).

## 7. Relay HTTP endpoints (client-facing)

| method + path        | purpose |
|----------------------|---------|
| `GET /config`        | `{ ice_servers: [...] }` — operator-controlled WebRTC ICE (may be `[]` for LAN/air-gap) |
| `POST /blobs`        | upload ciphertext blob → `{ id }` |
| `GET /blobs/:id`     | download ciphertext blob |
| `POST /enroll`       | join a guarded relay: `{ pubkey, token, ts, sig }`, `sig = sign("enroll|<token>|<ts>")` |

**Invite token** (no central directory — discovery rides in the invite):
`base64( encodeURIComponent( JSON.stringify({ p: pubkey, e: encPub, n: name, r: homeRelayHttpBase }) ) )`.

## 8. Federation (relay-to-relay, brief)

A client never speaks federation — it just includes the `relay` hint. Relays
forward remote-addressed envelopes to each other over signed HTTP
(`POST /federation/push`, Ed25519-signed, origin-bound, policy-gated, retried).
See the README and ARCHITECTURE.md for the operator-facing detail; content stays
E2E throughout (the relays only move sealed envelopes).

## 9. Versioning

`PROTOCOL_VERSION = 1`. Bumped on incompatible wire changes. Clients and relays
should surface a clear error on mismatch rather than fail silently.
