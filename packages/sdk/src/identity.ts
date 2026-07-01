import { ed25519 } from "@noble/curves/ed25519.js";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/hashes/utils.js";
import { deriveEncryptionKey } from "./crypto";
import { fromBase64, randomId, toBase64 } from "./util";

/**
 * Self-owned identity. Your account IS an Ed25519 keypair generated on this
 * device. The public key is your identity; the private key never leaves here.
 * Recovery is a 12-word seed phrase (like a crypto wallet) — the only way to
 * move or restore the account, because no server holds it.
 *
 * The pure functions (create/restore/sign/authParams) have no environment
 * dependencies. At-rest persistence (the encrypted vault + a stable device id)
 * is a `Vault` bound to a `KVStore` the host supplies — `localStorage` in a
 * browser, a keychain-backed KV on desktop/mobile, an in-memory map in tests.
 */

const VAULT_KEY = "chat.identity.vault.v1";
const DEVICE_KEY = "chat.deviceId.v1";
const PBKDF2_ITERATIONS = 210_000;


export interface Identity {
  mnemonic: string; // 12 words — the backup
  privateKey: Uint8Array; // Ed25519 signing seed (32 bytes) — never leaves the device
  publicKeyHex: string; // 64 hex chars — the account id
  encPrivateKey: Uint8Array; // X25519 key for decrypting sealed messages
  encPublicKeyHex: string; // X25519 public key others seal to
  name: string; // friendly, deterministic display name
}

/** A minimal key-value store (the `localStorage` subset the vault needs). */
export interface KVStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const toHex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

const fromHex = (h: string): Uint8Array =>
  Uint8Array.from(h.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

// Derive a 32-byte Ed25519 seed from the mnemonic (first 32 bytes of the
// BIP39 seed). Deterministic: same words → same key.
function identityFromMnemonic(mnemonic: string): Identity {
  const privateKey = mnemonicToSeedSync(mnemonic).slice(0, 32);
  const publicKeyHex = toHex(ed25519.getPublicKey(privateKey));
  const enc = deriveEncryptionKey(privateKey);
  return {
    mnemonic,
    privateKey,
    publicKeyHex,
    encPrivateKey: enc.priv,
    encPublicKeyHex: enc.pubHex,
    name: friendlyName(publicKeyHex),
  };
}

export function createIdentity(): Identity {
  return identityFromMnemonic(generateMnemonic(wordlist, 128)); // 128 bits = 12 words
}

export function restoreIdentity(mnemonic: string): Identity {
  const cleaned = mnemonic.trim().toLowerCase().replace(/\s+/g, " ");
  if (!validateMnemonic(cleaned, wordlist)) {
    throw new Error("That doesn't look like a valid 12-word phrase.");
  }
  return identityFromMnemonic(cleaned);
}

/** Sign a UTF-8 message with the identity's private key. Returns hex. */
export function sign(id: Identity, message: string): string {
  const sig = ed25519.sign(new TextEncoder().encode(message), id.privateKey);
  return toHex(sig);
}

/**
 * Auth material proving possession of the private key to the relay.
 *
 * We sign `pubkey|enc|ts`, which both proves we hold the signing key AND binds
 * our encryption key (`enc`) to our identity — so a malicious relay can't swap
 * in its own encryption key to mount a man-in-the-middle. `ts` bounds replay to
 * a short window (a nonce challenge replaces this later).
 */
export function authParams(id: Identity): {
  pubkey: string;
  enc: string;
  ts: string;
  sig: string;
  name: string;
} {
  const ts = String(Date.now());
  const sig = sign(id, `${id.publicKeyHex}|${id.encPublicKeyHex}|${ts}`);
  return { pubkey: id.publicKeyHex, enc: id.encPublicKeyHex, ts, sig, name: id.name };
}

// PBKDF2(passphrase, salt) → 32-byte AES-256-GCM key that wraps the seed phrase.
// Uses @noble (pure JS) instead of WebCrypto so the vault works identically in a
// browser, Node, and React Native. Output is byte-compatible with the previous
// WebCrypto vault (same PBKDF2-SHA256 + AES-256-GCM), so old vaults still open.
function deriveKek(passphrase: string, salt: Uint8Array): Uint8Array {
  return pbkdf2(sha256, new TextEncoder().encode(passphrase), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  });
}

/**
 * The at-rest account vault + device id, bound to a host-supplied key-value
 * store. The seed phrase is encrypted under a passphrase (PBKDF2 → AES-GCM);
 * only the ciphertext is stored, so disk access alone can't read the account.
 */
export class Vault {
  private kv: KVStore;

  constructor(kv: KVStore) {
    this.kv = kv;
  }

  /** Is there an encrypted account stored on this device? */
  has(): boolean {
    return !!this.kv.getItem(VAULT_KEY);
  }

  clear(): void {
    this.kv.removeItem(VAULT_KEY);
  }

  /** Encrypt the seed phrase under `passphrase` and store only the ciphertext. */
  async persist(id: Identity, passphrase: string): Promise<void> {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = deriveKek(passphrase, salt);
    const ct = gcm(key, iv).encrypt(new TextEncoder().encode(id.mnemonic));
    this.kv.setItem(
      VAULT_KEY,
      JSON.stringify({ v: 1, salt: toBase64(salt), iv: toBase64(iv), ct: toBase64(ct) }),
    );
  }

  /** Decrypt the stored account with `passphrase`. Returns null on wrong passphrase. */
  async unlock(passphrase: string): Promise<Identity | null> {
    const raw = this.kv.getItem(VAULT_KEY);
    if (!raw) return null;
    try {
      const { salt, iv, ct } = JSON.parse(raw);
      const key = deriveKek(passphrase, fromBase64(salt));
      const pt = gcm(key, fromBase64(iv)).decrypt(fromBase64(ct));
      return identityFromMnemonic(new TextDecoder().decode(pt));
    } catch {
      return null; // wrong passphrase → GCM auth failure throws
    }
  }

  /**
   * A stable per-device id, so the engine's delivery cursor persists across
   * reconnects (only genuinely-missed messages are replayed, not everything).
   */
  deviceId(): string {
    let id = this.kv.getItem(DEVICE_KEY);
    if (!id) {
      id = randomId();
      this.kv.setItem(DEVICE_KEY, id);
    }
    return id;
  }
}

// A readable, deterministic name from the key so people see *who*, not hex.
// Same key → same name everywhere. (Real @handles come later.)
const ADJECTIVES = [
  "moon", "sky", "river", "amber", "cedar", "coral", "swift", "quiet",
  "brave", "misty", "solar", "north", "ember", "frost", "willow", "opal",
];
const ANIMALS = [
  "otter", "falcon", "lynx", "heron", "fox", "koala", "raven", "wren",
  "seal", "ibex", "moth", "orca", "crane", "hare", "finch", "puma",
];

function friendlyName(pubkeyHex: string): string {
  const bytes = fromHex(pubkeyHex);
  const adj = ADJECTIVES[bytes[0] % ADJECTIVES.length];
  const animal = ANIMALS[bytes[1] % ANIMALS.length];
  const num = ((bytes[2] << 8) | bytes[3]) % 10000;
  return `${adj}-${animal}-${String(num).padStart(4, "0")}`;
}
