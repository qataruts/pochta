import type { Identity } from "./identity";
import type { StoredContact } from "./types";
import { fromBase64, toBase64 } from "./util";

/**
 * An invite carries your identity (public + encryption key + name) AND your
 * home-relay hint — so the person who opens it can add you, message you, and (if
 * you're on a different server) have their relay forward to yours. No central
 * directory: discovery info rides in the invite you share. `relay` is your home
 * relay's http base (the host passes it; the SDK doesn't assume where it runs).
 * Base64 via the util (no `btoa`/`atob`) so it works in RN too.
 */

const isHex64 = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-f]{64}$/i.test(s);

export function inviteToken(id: Identity, relay: string): string {
  const json = JSON.stringify({
    p: id.publicKeyHex,
    e: id.encPublicKeyHex,
    n: id.name,
    r: relay, // home relay (http base)
  });
  // URL-SAFE base64: the token is shared as a link / QR, where standard base64's
  // `+` and `/` (and `=` padding) get corrupted by URL parsing. parseInvite
  // accepts both this and legacy standard-base64 tokens.
  return toBase64(new TextEncoder().encode(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function parseInvite(token: string): StoredContact | null {
  try {
    // Accept url-safe or standard base64 (restore the alphabet + padding).
    let b64 = String(token).replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const o = JSON.parse(decodeURIComponent(new TextDecoder().decode(fromBase64(b64))));

    // Validate before trusting: the identity + encryption keys are 32-byte
    // (64 hex char) values — reject anything malformed instead of adding a
    // broken/unusable contact.
    if (!isHex64(o.p) || !isHex64(o.e)) return null;

    return {
      pubkey: o.p,
      enc: o.e,
      name: typeof o.n === "string" && o.n.trim() ? o.n.slice(0, 80) : o.p.slice(0, 6),
      relay: typeof o.r === "string" ? o.r : undefined,
      addedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
