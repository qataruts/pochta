import { Vault, createIdentity, restoreIdentity, VAULT_PREFIX } from "@elementaio/vox-sdk";
import type { AccountRef, Identity, KVStore } from "@elementaio/vox-sdk";

/**
 * Browser binding for the SDK vault. Account seeds (the `chat.vault.*` keys) are
 * routed to the desktop's OS-keychain-backed secure store when present (Electron
 * safeStorage), and to `localStorage` otherwise. The non-secret account index and
 * the device id always use `localStorage`.
 */
type SecureStore = {
  get(k: string): string | null;
  set(k: string, v: string): void;
  remove(k: string): void;
};
const secure = (globalThis as { vox?: { secureStore?: SecureStore } }).vox?.secureStore;
const isVault = (k: string) => k.startsWith(VAULT_PREFIX);

const kv: KVStore = {
  getItem: (k) => (secure && isVault(k) ? secure.get(k) : localStorage.getItem(k)),
  setItem: (k, v) => (secure && isVault(k) ? secure.set(k, v) : localStorage.setItem(k, v)),
  removeItem: (k) => (secure && isVault(k) ? secure.remove(k) : localStorage.removeItem(k)),
};
const vault = new Vault(kv);

export const listAccounts = (): AccountRef[] => vault.list();
export const hasIdentity = (): boolean => vault.has();
export const persistIdentity = (id: Identity, passphrase: string, name?: string): Promise<void> =>
  vault.persist(id, passphrase, name);
export const unlockIdentity = (pubkey: string, passphrase: string): Promise<Identity | null> =>
  vault.unlock(pubkey, passphrase);
export const removeAccount = (pubkey: string): void => vault.remove(pubkey);
export const deviceId = (): string => vault.deviceId();

// Effortless return on desktop: with the OS keychain (safeStorage) as the gate, we
// keep the account "signed in" so the app opens straight to the chats — no PIN,
// zero effort — yet the seed at rest is still OS-encrypted. Desktop only (needs the
// secure store); on the web we always require the PIN or passkey.
const SESSION_PREFIX = "chat.session.";
export function saveSession(id: Identity): void {
  secure?.set(SESSION_PREFIX + id.publicKeyHex, id.mnemonic);
}
export function clearSession(pubkey: string): void {
  secure?.remove(SESSION_PREFIX + pubkey);
}
/** If exactly one account is kept signed in (desktop), return it for a no-PIN launch. */
export function autoUnlock(): Identity | null {
  if (!secure) return null;
  const kept = vault.list().filter((a) => secure!.get(SESSION_PREFIX + a.pubkey));
  if (kept.length !== 1) return null;
  const seed = secure.get(SESSION_PREFIX + kept[0].pubkey);
  if (!seed) return null;
  try {
    return { ...restoreIdentity(seed), name: kept[0].name };
  } catch {
    return null;
  }
}

export { createIdentity, restoreIdentity };
export type { Identity, AccountRef };
