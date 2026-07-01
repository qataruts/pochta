import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Client,
  Vault,
  type ClientEvents,
  type Identity,
  type StoredContact,
  type StoredMessage,
} from "@pochta-chat/sdk";
import { getContacts, getMessages, kv, store } from "../services/storage";

const RELAY_KEY = "chat.relay.v1";

/** Holds the live SDK Client + messaging state so it persists across routes. */
interface Messenger {
  relay: string | null;
  setRelay: (r: string) => void;
  contacts: StoredContact[];
  status: string;
  tick: number; // bumps on any message change → chat screens re-read
  messagesFor: (pubkey: string) => StoredMessage[];
  send: (pubkey: string, text: string) => void;
  addContact: (c: StoredContact) => Promise<void>;
  setActive: (pubkey: string | null) => void;
}

const Ctx = createContext<Messenger | null>(null);

export function MessengerProvider({
  identity,
  children,
}: {
  identity: Identity;
  children: ReactNode;
}) {
  const [relay, setRelayState] = useState<string | null>(() => kv.getItem(RELAY_KEY));
  const [contacts, setContacts] = useState<StoredContact[]>(getContacts());
  const [status, setStatus] = useState("connecting…");
  const [tick, setTick] = useState(0);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!relay) return;
    const bump = () => setTick((n) => n + 1);
    const events: ClientEvents = {
      onStatus: setStatus,
      onMessage: () => {
        setContacts(getContacts());
        bump();
      },
      onMessageUpdated: bump,
      onMessageRemoved: bump,
      onReceipt: bump,
      onTyping: () => {},
      onContact: () => setContacts(getContacts()),
      onPresence: () => {},
      onIncomingCall: () => {},
      onCallState: () => {},
      onLocalStream: () => {},
      onRemoteStream: () => {},
    };
    const client = new Client({
      socketUrl: relay.replace(/^http/, "ws") + "/socket",
      httpBase: relay,
      identity,
      store,
      events,
      deviceId: new Vault(kv).deviceId(),
    });
    clientRef.current = client;
    client.connect(getContacts());
    return () => client.leave();
  }, [relay, identity]);

  const value: Messenger = {
    relay,
    setRelay: (r) => {
      kv.setItem(RELAY_KEY, r);
      setRelayState(r);
    },
    contacts,
    status,
    tick,
    messagesFor: getMessages,
    send: (pubkey, text) => void clientRef.current?.sendText(pubkey, text),
    addContact: async (c) => {
      await clientRef.current?.addContact(c);
      setContacts(getContacts());
    },
    setActive: (pubkey) => clientRef.current?.setActive(pubkey),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMessenger(): Messenger {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMessenger must be used inside <MessengerProvider>");
  return ctx;
}
