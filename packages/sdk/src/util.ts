import { randomBytes } from "@noble/hashes/utils.js";

/**
 * Environment-agnostic helpers so the SDK runs unchanged in a browser, Node, and
 * React Native — none of these use `btoa`/`atob`, `crypto.subtle`, or
 * `crypto.randomUUID` (which RN lacks). The only host requirement is a global
 * `crypto.getRandomValues` (built into browsers/Node; one small polyfill on RN).
 */

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Standard base64 (same output as `btoa`), without `btoa`. */
export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[b2 & 63] : "=";
  }
  return out;
}

/** Decode standard base64 (accepts the `btoa` output the old vault produced). */
export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, "");
  const out = new Uint8Array((clean.length * 3) >> 2);
  let bits = 0;
  let nbits = 0;
  let o = 0;
  for (let i = 0; i < clean.length; i++) {
    bits = (bits << 6) | B64.indexOf(clean[i]);
    nbits += 6;
    if (nbits >= 8) {
      nbits -= 8;
      out[o++] = (bits >> nbits) & 0xff;
    }
  }
  return out;
}

/** A random UUID-shaped id without `crypto.randomUUID` (RN-safe). */
export function randomId(): string {
  const b = randomBytes(16);
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
