export const en = {
  meta: {
    title: "Vox — private chat, voice & video you own",
    description:
      "Vox is a private messaging app: chat and call end-to-end encrypted, with no phone number, no email, and no company in the middle. Get the desktop app, or build on the @elementaio/vox-sdk.",
    ogAlt: "Vox — a private messenger you actually own.",
  },

  a11y: {
    skip: "Skip to content",
    toggleTheme: "Toggle light / dark theme",
  },

  nav: {
    twoWays: "Two ways",
    host: "Hosting",
    calls: "Calls",
    security: "Security",
    developers: "Developers",
    github: "GitHub",
    switchLang: "العربية",
    switchLangAria: "Switch to Arabic",
    menu: "Menu",
  },

  hero: {
    badge: "Private messenger · chat, voice & video",
    title: "Private chat, voice & video — that you actually own.",
    subtitle:
      "Vox is a messaging app: chat and call your people, end-to-end encrypted. No phone number, no email, no company in the middle. Your account is a key on your device, and the network runs on people's own computers — so nobody can read you, lock you out, or shut it down.",
    ctaPrimary: "Get the desktop app",
    ctaSecondary: "For developers",
    microcopy: "No phone number · No email · No account server",
    trust: [
      "No company servers",
      "Keys on your device",
      "MIT licensed",
      "npm i @elementaio/vox-sdk",
    ],
    mockup: {
      appName: "Vox",
      hostPill: "Host: on",
      search: "Search",
      chats: "Chats",
      convo1Name: "Layla",
      convo1Preview: "See you at the studio 👋",
      convo2Name: "Design guild",
      convo2Preview: "Karim: shipping the new build",
      convo3Name: "Omar",
      convo3Preview: "voice note · 0:12",
      activeName: "Layla",
      presence: "online",
      encryptedNote: "Messages are end-to-end encrypted",
      bubbleIn: "Sealed to you, signed by me — no one in the middle can read it.",
      bubbleOut: "That's the whole point of a post office 📮",
      inputPlaceholder: "Message",
    },
  },

  twoWays: {
    eyebrow: "Two ways to use Vox",
    title: "A product for people. A toolkit for builders.",
    lead: "The same end-to-end core, two audiences. Use the apps if you just want a private messenger. Use the tools if you want to build your own chat network.",
    product: {
      label: "The product — apps you run",
      items: [
        {
          name: "Desktop",
          platforms: "Windows · macOS · Linux",
          flag: "Flagship",
          badge: "Client + Host",
          desc: "Your messenger and your on-ramp to the network. A client by default — flip Host on and it helps run Vox for everyone.",
        },
        {
          name: "Web",
          platforms: "Any browser",
          flag: "",
          badge: "Client",
          desc: "A lightweight client in the browser. Nothing to install — open a link and you're in.",
        },
        {
          name: "Mobile",
          platforms: "iOS · Android",
          flag: "",
          badge: "Client",
          desc: "A lightweight client in your pocket, with your identity and history in sync.",
        },
      ],
      footnote:
        "Only the desktop can host. Web and mobile are clients that join the mesh — the more people host, the bigger and faster the network gets.",
    },
    dev: {
      label: "The dev tools — build your own",
      items: [
        {
          name: "@elementaio/vox-sdk",
          badge: "npm",
          desc: "The end-to-end client core — identity, sign-then-seal crypto, transport, and every message op. Build any app on it; it ships no UI and no database.",
        },
        {
          name: "Self-hostable relay",
          badge: "Docker",
          desc: "Run your own private network or island with one Docker image or a self-contained release — and federate it with others.",
        },
      ],
      footnote: "Read the developer guide",
    },
  },

  host: {
    eyebrow: "No company servers",
    title: "Anyone can host — old Skype, done right.",
    lead: "Old Skype quietly turned users' machines into relays, then a company moved everything onto its own servers. Vox brings back “anyone can host” — but consented and encrypted.",
    points: [
      {
        title: "Offered, never forced",
        desc: "Your desktop hosts only if you allow it. When a big meeting needs capacity, it invites strong, reachable machines to help — you say yes or no. Never silent, always visible.",
      },
      {
        title: "Hosts are blind",
        desc: "Everything is end-to-end encrypted, so a host relays sealed ciphertext it can never read — even in a 200-person meeting.",
      },
      {
        title: "It scales like a mesh",
        desc: "Two people is pure peer-to-peer, no host at all. A big meeting recruits a slice of participants as forwarders. No data center, no license tier — the community is the capacity.",
      },
    ],
    honest:
      "Honest nuance: “no central or company servers” isn't zero infrastructure. Large calls and strict-NAT links lean on the volunteer host mesh — real capacity, run by people, not a data center.",
    panel: {
      title: "Host",
      state: "On",
      status: "Helping run the network",
      relayLabel: "Relaying encrypted traffic",
      ciphertextNote: "Ciphertext only — you can't read it",
      uplink: "Uplink",
      forLabel: "Carrying mail for 6 people",
    },
  },

  calls: {
    eyebrow: "Group calls that scale",
    title: "From a 1:1 to a full room — everyone sees everyone.",
    lead: "Calls grow with the room. Small groups stay pure peer-to-peer; big rooms borrow capacity from a host, so each person holds a single connection and still sees the whole room.",
    tiers: [
      {
        size: "1:1",
        model: "Peer-to-peer",
        desc: "A direct, encrypted line between two devices. No host and no server in the media path.",
      },
      {
        size: "Small groups",
        model: "P2P mesh",
        desc: "A handful of people connect directly to each other — the most private setup, with zero hosts.",
      },
      {
        size: "Big rooms",
        model: "Elected-host forwarder (SFU)",
        desc: "One host relays everyone to everyone. Each person holds one connection and still sees the whole room.",
      },
    ],
    note: "All live-tested with real clients. Next up: SFrame — so the forwarder relays ciphertext it can't read — and cascading forwarders for very large rooms.",
    grid: {
      you: "You",
      host: "Host",
      names: ["Layla", "Karim", "Omar", "Sara", "Nadia", "You"],
      caption: "Everyone sees everyone — through one host.",
    },
  },

  e2e: {
    eyebrow: "End-to-end by design",
    title: "Sealed to you. Signed by you.",
    lead: "Every message is signed by you and sealed to the recipient. A host only ever sees ciphertext — it cannot read your chats, even if compelled.",
    points: [
      {
        title: "Your identity is a key",
        desc: "No phone number, no email, no account server. Your account is a cryptographic key on your device, backed up by 12 words like a crypto wallet — nothing to leak or be locked out of.",
      },
      {
        title: "Signed then sealed",
        desc: "Ed25519 signatures, X25519 key exchange, and XChaCha20-Poly1305, via audited libraries. The relay holds only sealed envelopes.",
      },
      {
        title: "No archive, by design",
        desc: "Your history lives on your devices. A host keeps a sealed message only until it's delivered, then deletes it.",
      },
      {
        title: "Email is for invites only",
        desc: "Email bootstraps a new contact — never to carry your messages. There's no central directory; discovery rides in the invite.",
      },
    ],
    chips: ["Ed25519", "X25519", "XChaCha20-Poly1305", "BIP39 · 12 words"],
    limits: {
      title: "Honest about the limits",
      lead: "Trust comes from being straight about what this does and doesn't guarantee.",
      items: [
        { kind: "ok", text: "Content is end-to-end encrypted — a host holds only ciphertext." },
        { kind: "warn", text: "A host still sees metadata: who talks to whom, when, and message sizes." },
        { kind: "warn", text: "Large calls and strict-NAT links need forwarding capacity — a mesh of volunteer desktops, not a company, but still real infrastructure." },
        { kind: "warn", text: "“100% secure” is not a real claim. A stolen device or lost passphrase is out of our hands." },
      ],
    },
  },

  developers: {
    eyebrow: "For developers",
    title: "Build on the same core.",
    lead: "Vox's client is a real, reusable SDK. Build your own app on the same E2E core, or run your own network behind a different frontend. It ships no UI and no database — you inject those.",
    install: "npm i @elementaio/vox-sdk",
    codeCaption: "The E2E core — identity, crypto, and transport. Storage and UI are yours.",
    features: [
      "Identity, sign-then-seal crypto, transport, and every message op",
      "Framework- and storage-agnostic TypeScript, published on npm",
      "Self-host the relay in one Docker command — or a self-contained release",
      "Federate separate islands into one network, signed and origin-verified",
    ],
    relayTitle: "Run a relay in one command",
    relayCaption: "One image bundles the relay, the web client, and its storage.",
    links: {
      npm: "SDK on npm",
      protocol: "Protocol spec",
      architecture: "Architecture",
      github: "View the code",
    },
  },

  cta: {
    title: "Your messenger. Your keys. No company in the middle.",
    lead: "Free and open source, MIT-licensed. Get the desktop app, or build your own on the SDK.",
    primary: "Get the desktop app",
    secondary: "Star on GitHub",
  },

  footer: {
    tagline: "A post office, not an archive.",
    columns: {
      product: {
        title: "Product",
        links: [
          { label: "Desktop", href: "desktop" },
          { label: "Web", href: "web" },
          { label: "Mobile", href: "mobile" },
        ],
      },
      developers: {
        title: "Developers",
        links: [
          { label: "SDK on npm", href: "npm" },
          { label: "Protocol", href: "protocol" },
          { label: "Architecture", href: "architecture" },
          { label: "Self-host", href: "deployment" },
        ],
      },
      project: {
        title: "Project",
        links: [
          { label: "GitHub", href: "github" },
          { label: "MIT License", href: "license" },
          { label: "vox.uts.qa", href: "site" },
        ],
      },
    },
    madeBy: "© 2026 Emad Jumaah · MIT licensed",
    note: "Proven public-key cryptography. No blockchain, no tokens, no tracking.",
  },
};

export type Dictionary = typeof en;
