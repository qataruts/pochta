import { createMMKV } from "react-native-mmkv";
import type {
  KVStore,
  MessageStatus,
  Store,
  StoredContact,
  StoredMessage,
} from "@pochta-chat/sdk";

/**
 * On-device storage — the native adapters that plug the platform-agnostic SDK
 * into React Native. MMKV is synchronous (which the SDK's KVStore needs) and
 * encrypted at rest. It backs both the identity vault (KVStore) and a first-cut
 * message/contact Store; swap in expo-sqlite for large histories later.
 */

// TODO(security): derive the encryptionKey from the OS keychain before shipping.
const mmkv = createMMKV({ id: "pochta", encryptionKey: "pochta-mmkv-v1" });

/** KVStore for the SDK identity vault + device id + app settings (language, relay). */
export const kv: KVStore = {
  getItem: (k) => mmkv.getString(k) ?? null,
  setItem: (k, v) => mmkv.set(k, v),
  removeItem: (k) => mmkv.remove(k),
};

const MSG = (id: string) => `msg:${id}`;
const CONTACT = (pk: string) => `contact:${pk}`;
const readJSON = <T>(k: string): T | undefined => {
  const s = mmkv.getString(k);
  return s ? (JSON.parse(s) as T) : undefined;
};

/** The SDK persistence port (the client's write-ops). */
export const store: Store = {
  async addMessage(m) {
    mmkv.set(MSG(m.id), JSON.stringify(m));
  },
  async getMessage(id) {
    return readJSON<StoredMessage>(MSG(id));
  },
  async setMessageStatus(id, status: MessageStatus) {
    const m = readJSON<StoredMessage>(MSG(id));
    if (m && m.mine) {
      const rank = { sent: 0, delivered: 1, read: 2 } as const;
      if (!m.status || rank[status] > rank[m.status]) {
        mmkv.set(MSG(id), JSON.stringify({ ...m, status }));
      }
    }
  },
  async editStoredMessage(id, newText) {
    const m = readJSON<StoredMessage>(MSG(id));
    if (!m) return false;
    mmkv.set(MSG(id), JSON.stringify({ ...m, text: newText, edited: true }));
    return true;
  },
  async tombstoneStoredMessage(id) {
    const m = readJSON<StoredMessage>(MSG(id));
    if (!m) return false;
    mmkv.set(MSG(id), JSON.stringify({ ...m, deleted: true, text: "", media: undefined }));
    return true;
  },
  async removeStoredMessage(id) {
    mmkv.remove(MSG(id));
  },
  async applyReaction(id, emoji, reactor, remove) {
    const m = readJSON<StoredMessage>(MSG(id));
    if (!m) return false;
    const reactions = { ...(m.reactions ?? {}) };
    const set = new Set(reactions[emoji] ?? []);
    if (remove) set.delete(reactor);
    else set.add(reactor);
    if (set.size) reactions[emoji] = [...set];
    else delete reactions[emoji];
    mmkv.set(MSG(id), JSON.stringify({ ...m, reactions }));
    return true;
  },
  async upsertContact(c: StoredContact) {
    mmkv.set(CONTACT(c.pubkey), JSON.stringify(c));
  },
  async cacheMedia() {},
  async getCachedMedia() {
    return undefined;
  },
};

// --- synchronous UI query helpers (the SDK Store only exposes write-ops) ------

export function getContacts(): StoredContact[] {
  return mmkv
    .getAllKeys()
    .filter((k) => k.startsWith("contact:"))
    .map((k) => readJSON<StoredContact>(k))
    .filter((c): c is StoredContact => !!c)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getMessages(contact: string): StoredMessage[] {
  return mmkv
    .getAllKeys()
    .filter((k) => k.startsWith("msg:"))
    .map((k) => readJSON<StoredMessage>(k))
    .filter((m): m is StoredMessage => !!m && m.contact === contact)
    .sort((a, b) => a.ts - b.ts);
}
