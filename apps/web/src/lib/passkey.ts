import { restoreIdentity, type Identity } from "@pochta-chat/sdk";

/**
 * Optional hardware-backed unlock for the web app, via WebAuthn's `prf` extension.
 *
 * A platform passkey (Touch ID / Windows Hello / Android biometric / security key)
 * produces a stable, high-entropy secret (the PRF output) that never leaves the
 * authenticator and is gated by the OS (biometric + hardware rate-limiting). We use
 * that secret directly as an AES-256-GCM key to wrap this account's seed phrase. So
 * unlock = a biometric tap, and the wrapped seed on disk is useless without the
 * authenticator. Requires no server (the challenge is only for a local key, not a
 * remote assertion). Everything degrades to the PIN when passkeys/PRF are absent.
 */

const PK_PREFIX = "chat.passkey."; // + pubkey → { credentialId, salt, iv, wrapped } (b64)

const b64 = (b: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(b)));
// Return ArrayBuffer-backed arrays so they satisfy WebAuthn/WebCrypto BufferSource.
const ub64 = (s: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
const fromHex = (h: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(h.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))) as Uint8Array<ArrayBuffer>;
const enc = (s: string): Uint8Array<ArrayBuffer> => new Uint8Array(new TextEncoder().encode(s));
function rand(n: number): Uint8Array<ArrayBuffer> {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

// The `prf` extension isn't in every TS DOM lib yet; narrow what we use.
type PrfInputs = { prf?: { eval?: { first: BufferSource } } };
type PrfResults = { prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } } };

export function hasPasskey(pubkey: string): boolean {
  return !!localStorage.getItem(PK_PREFIX + pubkey);
}
export function removePasskey(pubkey: string): void {
  localStorage.removeItem(PK_PREFIX + pubkey);
}

/** Is a platform authenticator (biometric / Hello) available in this browser? */
export async function isPasskeySupported(): Promise<boolean> {
  try {
    return (
      !!window.PublicKeyCredential &&
      !!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.())
    );
  } catch {
    return false;
  }
}

async function aesKey(prf: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", prf.slice(0, 32), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function evalPrf(
  credentialId: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer | null> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: rand(32),
      allowCredentials: [{ type: "public-key", id: credentialId }],
      userVerification: "required",
      timeout: 60000,
      extensions: { prf: { eval: { first: salt } } } as PrfInputs as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  return (assertion?.getClientExtensionResults() as PrfResults)?.prf?.results?.first ?? null;
}

/** Register a platform passkey and wrap this account's seed under its PRF secret. */
export async function registerPasskey(pubkey: string, name: string, mnemonic: string): Promise<boolean> {
  const salt = rand(32);
  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: { id: location.hostname, name: "Pochta" },
      user: { id: fromHex(pubkey), name: name || pubkey.slice(0, 8), displayName: name || "Pochta" },
      challenge: rand(32),
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
      timeout: 60000,
      extensions: { prf: { eval: { first: salt } } } as PrfInputs as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  if (!cred) return false;

  const ext = cred.getClientExtensionResults() as PrfResults;
  const credentialId = new Uint8Array(cred.rawId);
  // Some browsers evaluate PRF at create(); most need a follow-up get().
  const prf = ext.prf?.results?.first ?? (ext.prf?.enabled ? await evalPrf(credentialId, salt) : null);
  if (!prf) return false; // authenticator has no PRF support → keep the PIN

  const key = await aesKey(prf);
  const iv = rand(12);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc(mnemonic)),
  );
  localStorage.setItem(
    PK_PREFIX + pubkey,
    JSON.stringify({ credentialId: b64(credentialId), salt: b64(salt), iv: b64(iv), wrapped: b64(ct) }),
  );
  return true;
}

/** Unlock an account with its registered passkey (biometric). Null on cancel/failure. */
export async function unlockWithPasskey(pubkey: string): Promise<Identity | null> {
  const raw = localStorage.getItem(PK_PREFIX + pubkey);
  if (!raw) return null;
  try {
    const { credentialId, salt, iv, wrapped } = JSON.parse(raw);
    const prf = await evalPrf(ub64(credentialId), ub64(salt));
    if (!prf) return null;
    const key = await aesKey(prf);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ub64(iv) }, key, ub64(wrapped));
    return restoreIdentity(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}
