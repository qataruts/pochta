import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { randomBytes } from "@noble/hashes/utils.js";

/**
 * Media blobs: the file is encrypted on-device with a fresh random key, and only
 * the CIPHERTEXT is uploaded to the relay's blob store. The key is returned to
 * the caller, who puts it inside the E2E-sealed message — so the relay (which
 * holds the ciphertext) can never decrypt the media. `httpBase` is the relay's
 * http(s) origin (the host provides it; the SDK stays URL-agnostic).
 */

const toHex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h: string): Uint8Array =>
  Uint8Array.from(h.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

/** Encrypt bytes and upload the ciphertext. Returns the blob id + hex key. */
export async function encryptAndUpload(
  httpBase: string,
  bytes: Uint8Array,
): Promise<{ blobId: string; key: string }> {
  const key = randomBytes(32);
  const nonce = randomBytes(24);
  const ct = xchacha20poly1305(key, nonce).encrypt(bytes);
  const payload = new Uint8Array(nonce.length + ct.length);
  payload.set(nonce);
  payload.set(ct, nonce.length);

  const form = new FormData();
  form.append("file", new Blob([payload], { type: "application/octet-stream" }), "blob");
  const res = await fetch(`${httpBase}/blobs`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  const { id } = (await res.json()) as { id: string };
  return { blobId: id, key: toHex(key) };
}

// A blob is E2E-encrypted media; cap the download so a malicious relay can't
// OOM-crash the client by serving an enormous body (matches the relay's 25MB
// upload cap, with headroom for the nonce + AEAD tag).
const MAX_BLOB_BYTES = 30 * 1024 * 1024;

/** Download the ciphertext for a blob and decrypt it with the hex key. */
export async function downloadAndDecrypt(
  httpBase: string,
  blobId: string,
  keyHex: string,
): Promise<Uint8Array> {
  const res = await fetch(`${httpBase}/blobs/${blobId}`);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const buf = await readCapped(res, MAX_BLOB_BYTES);
  const nonce = buf.slice(0, 24);
  const ct = buf.slice(24);
  return xchacha20poly1305(fromHex(keyHex), nonce).decrypt(ct);
}

// Read a response body with a hard byte cap — reject early on Content-Length and
// stream-count as a fallback (a hostile server can omit/lie about the header).
async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  const cl = res.headers.get("content-length");
  if (cl && Number(cl) > max) throw new Error("blob too large");

  const reader = res.body?.getReader?.();
  if (!reader) {
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > max) throw new Error("blob too large");
    return buf;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.length;
      if (total > max) {
        await reader.cancel();
        throw new Error("blob too large");
      }
      chunks.push(value);
    }
  }

  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}
