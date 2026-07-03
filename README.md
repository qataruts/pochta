<div align="center">

# Vox

### Private chat, voice & video — that you actually own.

Vox is a messaging app: chat and call your people, **end-to-end encrypted**, with
**no phone number, no email, and no company in the middle.** Your account is a key on
your device, and the network runs on people's own computers — so nobody can read you,
lock you out, or shut it down. *(Your mail, not their archive.)*

[![Website](https://img.shields.io/badge/website-vox.uts.qa-E11D48)](https://vox.uts.qa)
[![npm](https://img.shields.io/npm/v/@elementaio/vox-sdk?logo=npm&label=%40vox-chat%2Fsdk&color=cb3837)](https://www.npmjs.com/package/@elementaio/vox-sdk)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![Elixir](https://img.shields.io/badge/relay-Elixir%20%2F%20Phoenix-4B275F?logo=elixir&logoColor=white)
![TypeScript](https://img.shields.io/badge/client-React%20%2F%20TypeScript-3178C6?logo=typescript&logoColor=white)
![End-to-end encrypted](https://img.shields.io/badge/encryption-end--to--end-2ea44f)

**[Get the app → vox.uts.qa](https://vox.uts.qa)** · [For developers](#for-developers) · [Protocol](PROTOCOL.md) · [Architecture](ARCHITECTURE.md)

</div>

---

Vox (Latin for *voice*) is built on one idea: **a messenger's
server should be a post office, not an archive.** It carries your sealed messages,
delivers them, and forgets them. It never reads them, never keeps a history, and
never knows who you are — because your account isn't a row in a database. It's a key
on your device.

The twist: **the post office isn't a company.** It's the desktops of the people using
Vox. Any desktop can host; small calls are pure peer-to-peer; big meetings borrow
capacity from a slice of the people in them. No central servers, no per-seat pricing —
and because everything is end-to-end encrypted, a host only ever relays ciphertext.

## Two ways to use Vox

Vox is **a product for people** and **a toolkit for developers** — the same
end-to-end core, two audiences.

### The product — apps you run

| App | What it is | Hosts? |
|-----|-----------|--------|
| **Desktop** (Win/macOS/Linux) | your messenger **and** your on-ramp to the network — a client by default; flip **Host** on and it helps run Vox | **yes** |
| **Web** | a lightweight client in the browser | no |
| **Mobile** (iOS/Android) | a lightweight client in your pocket | no |

The desktop app is the flagship: it's the only one that can **host**, so the network
is a mesh of people's desktops. Web and mobile are clients that join it. **The more
people host, the bigger and faster the network** — and every host is blind to content.

### The dev tools — build your own

| Tool | What it's for |
|------|---------------|
| **[`@elementaio/vox-sdk`](https://www.npmjs.com/package/@elementaio/vox-sdk)** | the E2E client core (identity, crypto, transport, message ops) — build any app on it |
| **Self-hostable relay** (Docker or a self-contained release) | run your own private network / island, and federate with others |

If you just want a private messenger, use the product. If you want to build your own
chat network or app, use the tools. [Jump to the developer guide.](#for-developers)

## Anyone can be the host — old Skype, done right

Old Skype quietly turned users' machines into relays, then a company bought it and
moved everything onto its own servers. Vox brings back *"anyone can host"* — but
**consented and encrypted**:

- **One role, offered — never forced.** Your desktop hosts only if you allow it. When
  a big meeting needs capacity, it *invites* strong, reachable machines in the call to
  help carry it — you say yes or no. Never silent, always visible.
- **Hosts are blind.** Everything is end-to-end encrypted, so a host relays sealed
  ciphertext it can never read — even in a 200-person meeting.
- **It scales like a mesh.** Two people = pure peer-to-peer, no host at all. A big
  meeting recruits a slice (~10%) of participants as forwarders. No data center, no
  license tier — the community *is* the capacity.

## What you can do

- **Chat** with sent · delivered · read receipts, typing indicators, replies, emoji
  reactions, and edit / delete-for-everyone.
- **Call** over voice and video, peer-to-peer — 1:1, plus **group calls**: a P2P mesh
  for small groups and an elected-host forwarder for big ones, where everyone sees
  everyone through one host (both live-tested).
- **Share** photos, voice notes, and files — encrypted on your device before they ever
  leave it.
- **Use every device** — link a phone or laptop with your 12 words; conversations sync
  across all of them.
- **See presence** — who's online, who was last seen.

## Why Vox?

Every mainstream messenger asks you to trust a company: with your phone number, your
contacts, your metadata, and a copy of your messages on their servers. Vox removes
the company from the middle.

- **Truly end-to-end.** Every message is signed by you and sealed to the recipient. A
  host only ever sees ciphertext — it *cannot* read your chats, even if compelled.
- **You own your identity.** Your account is a cryptographic key created on your
  device, backed up by 12 words like a crypto wallet. No email, no password, no phone
  number — nothing to leak or be locked out of.
- **No company servers.** The network is people's desktops. Nothing central to
  subpoena, monetize, rate-limit, or switch off.
- **No archive, by design.** Your history lives on *your* devices. A host keeps sealed
  messages only until they're delivered, then deletes them.
- **No blockchain, no tokens, no tracking.** Just proven public-key cryptography and a
  plain, honest post-office model.

## Who it's for

- **Families and communities** who want a private group of their own that runs on
  their own machines.
- **Companies** who want internal chat that never leaves their infrastructure — a
  sealed, invite-only network with no messages in or out.
- **Organizations and governments** who need a self-contained, auditable system they
  can run air-gapped on a private network. (We're [honest](#honest-about-security)
  about exactly what that does and doesn't guarantee.)

## How it works

1. **Make an account in seconds** — the app generates your key and shows you 12 backup
   words. No sign-up form.
2. **Share an invite link or QR** — whoever opens it can message you. Discovery rides in
   the invite; there's no central directory. *(Email is used only to send an invite —
   never to carry your messages.)*
3. **Chat, sealed** — messages relay peer-to-peer, or wait on a host's post office
   until you're back online, and land on your devices decrypted only for you.

## <a id="honest-about-security"></a>Honest about security

Trust comes from being straight about the limits, so here they are:

- **Content is end-to-end encrypted** (Ed25519 + X25519 + XChaCha20-Poly1305, via
  audited libraries). A host holds only ciphertext.
- **Self-contained and auditable** — open source, no required external calls, you own
  every component.
- **A host sees metadata** — who talks to whom, when, and message sizes. When *you*
  host (your own desktop or box), that's your own machine, but it is not anonymity
  *from* the host. Large calls need forwarding capacity — a mesh of volunteer desktops,
  not a company data center, but still real infrastructure that strict-NAT users depend
  on.
- **"100% secure" is not a real claim.** A stolen device or lost passphrase is out of
  our hands, and formal certification (FIPS, Common Criteria) is a process beyond the
  code. The architecture *supports* a hardened deployment; the paperwork is separate work.

## <a id="for-developers"></a>For developers

Vox's client is a real, reusable SDK — **[`@elementaio/vox-sdk`](https://www.npmjs.com/package/@elementaio/vox-sdk)** —
so you can build your *own* app (mobile, desktop, a bot) on the same E2E core, or run
your backend behind a different frontend entirely. It ships no UI and no database; you
inject those.

```sh
npm i @elementaio/vox-sdk
```

- **SDK** — identity, sign-then-seal crypto, transport, all message ops → [`packages/sdk`](packages/sdk)
- **Protocol** — the full wire contract, to build any client → [PROTOCOL.md](PROTOCOL.md)
- **Architecture** — how the relay, engine, and storage fit → [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment** — self-host any part (relay · STUN/TURN · push), choose your quality → [DEPLOYMENT.md](DEPLOYMENT.md)

### Run a relay in one command

The relay is a **developer tool** — the backend behind your own network, or a permanent
public host for a community. (Regular users don't need this; they use the desktop app.)
One Docker image bundles the relay, the web client, and its storage:

```sh
docker build -t vox-relay .
docker run -p 4000:4000 -v vox-data:/data \
  -e SECRET_KEY_BASE=$(openssl rand -base64 48) \
  vox-relay
# open http://localhost:4000
```

Want a **private, invite-only network** for a company or org? Same image, three env
vars — a sealed island where only enrolled people connect and nothing leaks out:

```sh
docker run -p 4000:4000 -v vox-data:/data \
  -e SECRET_KEY_BASE=$(openssl rand -base64 48) \
  -e MEMBERSHIP_MODE=invite -e FEDERATION_MODE=closed \
  -e ADMIN_TOKEN=$(openssl rand -hex 16) \
  vox-relay
# open http://your-host/admin, sign in, and invite people from a friendly web panel.
```

Runs on **Windows, macOS, or Linux**. Put a TLS proxy (Caddy/nginx) in front for
anything beyond localhost. Relays can also **federate** — different self-hosted Vox
servers reach each other, signed and origin-verified, so separate islands become a
network without any central authority.

### Monorepo layout

Every frontend is a thin, **forkable** app over the same published SDK — take one as a
starting point for your own branded client.

```
packages/
  sdk/        @elementaio/vox-sdk — the shared client core (published to npm)
apps/
  server/     the Vox relay (Elixir/Phoenix) — dev tool: the backend + serves web
  web/        web client        (React + Vite)         — product: a client
  desktop/    desktop app       (Electron)             — product: client + Host
  mobile/     mobile client     (Expo / React Native)  — product: a client
  site/       the marketing site (static, vox.uts.qa)
deploy/       compose files + coturn config (self-host the relay + STUN/TURN)
scripts/      launchers (run the release)
```

### Develop locally

```sh
pnpm install
pnpm setup:server     # first time: fetch Elixir deps
pnpm dev:server       # relay on :4000 (SQLite, no external DB)
pnpm dev:web          # web on :5180 (Vite → :4000)
```

Open two browsers, create an account in each, share the invite link, and chat.

## Status

**Working today, all automated-tested:** self-owned identity · E2E messaging · contacts
and on-device encrypted history · reliable offline delivery and multi-device sync ·
receipts and typing · presence · edit / delete / reactions / replies · images, voice
notes and files · 1:1 voice/video calls · signed relay-to-relay federation ·
private/guarded (org/gov) modes · a friendly admin web panel.

**The apps (product):** **web** (done) · **desktop** ([Electron](apps/desktop) — client
plus a **Host** panel that runs the bundled relay on your machine; packaging next) ·
**mobile** ([Expo](apps/mobile) — onboarding + messenger on-device). Web and mobile are
clients; the desktop is the one that hosts.

**The tools (developer):** **[`@elementaio/vox-sdk`](packages/sdk)** (published) ·
self-hostable relay (Docker + self-contained release).

**Roadmap:** package the desktop/mobile apps · **group conferences** — a P2P mesh, a
single-host forwarder (SFU), and **cascading** forwarders (many hosts mesh and each
serves a cluster) so calls scale toward Zoom-size, all live-tested; next **SFrame** so
forwarders relay ciphertext they can't read · **serverless discovery** (a DHT
`Transport` backend — the seam is in, the js-libp2p backend is next) · self-host TURN
(coturn) for strict NATs · per-device keys and forward secrecy · human-friendly `@handles`.

---

## <a id="self-hosting"></a>Deployment reference

<details>
<summary><b>Without Docker (self-contained release + one launcher)</b></summary>

`pnpm build` bundles the client into the relay; a `mix release` produces a
**self-contained folder (~33 MB) that runs with no Elixir or Node installed.**
Build it once (needs Elixir), then a regular host just runs the launcher — it
generates + persists a secret and keeps all data in one folder:

```sh
cd apps/server && MIX_ENV=prod mix release      # → _build/prod/rel/vox (copy this anywhere)

# run it — no Elixir/Node needed on the target machine:
./scripts/vox-server.sh                       # http://localhost:4000, data in ~/.vox
PORT=8080 ADMIN_TOKEN=$(openssl rand -hex 16) ./scripts/vox-server.sh   # admin panel on
#   Windows: scripts\vox-server.bat
```

Put a TLS reverse proxy (Caddy/nginx) in front for anything off-localhost — WebRTC
and media need HTTPS. This is also exactly what the desktop app runs for you when you
flip **Host** on — the same release, spawned and managed inside the app.
</details>

<details>
<summary><b>Do I need STUN/TURN servers for calls?</b></summary>

The relay handles **signaling** (offer/answer/ICE, sealed) — that part needs
nothing extra. The actual call **media** is peer-to-peer WebRTC, so:

- **Same LAN / air-gapped** — nothing needed; peers connect via local candidates
  (verified: calls connect with `ice_servers: []`).
- **Across the internet** — you need a **STUN** server so peers discover their
  public address. It's tiny; use a public one or self-host **coturn**.
- **Strict / cellular / symmetric NAT (~10–20% of networks)** — direct P2P fails,
  so you need a **TURN** server (coturn) to relay the encrypted media. This is the
  current gap; without TURN those specific calls won't connect.

The Vox relay does **not** itself speak STUN/TURN — that's separate WebRTC infra
(**coturn**), which the *same host* can run. The relay just advertises whatever you
configure via `GET /config` (`config :vox, :ice_servers, [...]`), so nothing is
hardcoded to the outside world.
</details>

<details>
<summary><b>Air-gapped / private network (nothing leaves)</b></summary>

- **No CDN / web-fonts / external assets** — the client bundles everything.
- **ICE servers are relay-provided** (`GET /config`). Set `ice_servers: []` for a LAN
  (peers connect via local candidates — verified: calls connect with zero STUN), or
  self-host **coturn**.
- **Storage is a local SQLite file**; **TLS** via a private/internal CA.
- The only unavoidable external dependency is optional **mobile push** (APNs/FCM) — skip
  it for air-gap, or use self-hostable **UnifiedPush** on Android.

Storage is SQLite by default (plug-and-play); set `ecto_adapter` to Postgres for a
large relay — same code, no changes.
</details>

<details>
<summary><b>Operating a relay (admin)</b></summary>

**Web panel (for non-technical admins).** Set an `ADMIN_TOKEN` and open
`https://your-relay/admin` — a point-and-click UI to mint join tokens, add/remove
members, and allow/revoke federated peers. Disabled entirely when no token is set.

**CLI (for operators on the box).**

```sh
mix relay.token                     # mint a one-time join token
mix relay.members [add|remove <pubkey>]
mix relay.peers   [allow <origin>|revoke <pubkey>]
# release equivalents: bin/vox rpc "Vox.Admin.mint_token()"
```
</details>

## License

MIT © Emad Jumaah
