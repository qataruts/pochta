// Regression tests for the E2E crypto core + invites (framework-free: node --test
// against the built dist). Run: `npm test` (builds first).
import { test } from "node:test";
import assert from "node:assert/strict";
import { seal, open, createIdentity, inviteToken, parseInvite } from "../dist/index.js";
import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";

const te = new TextEncoder();
const toHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const fromHex = (h) => Uint8Array.from(h.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
const concat = (...a) => {
  const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0));
  let f = 0;
  for (const x of a) { o.set(x, f); f += x.length; }
  return o;
};
const signedBytes = (from, to, ts, body) => te.encode(JSON.stringify({ from, to, ts, body }));
const deriveKey = (s, e, r) => sha256(concat(s, e, r));

const body = (a) => ({ t: "msg", id: "m1", text: "yes I agree", enc: a.encPublicKeyHex, name: "Alice" });

test("seal → open roundtrip and sender attribution", () => {
  const alice = createIdentity(), bob = createIdentity();
  const env = seal(alice.privateKey, alice.publicKeyHex, bob.encPublicKeyHex, body(alice), 1719);
  const opened = open(bob.encPrivateKey, bob.encPublicKeyHex, env);
  assert.equal(opened.from, alice.publicKeyHex);
  assert.equal(opened.body.text, "yes I agree");
});

test("recipient binding: a message sealed for Bob cannot be forwarded to Carol (#10)", () => {
  const alice = createIdentity(), bob = createIdentity(), carol = createIdentity();
  const b = body(alice), ts = 1719;
  // Alice legitimately signs+sends to Bob; Bob captures the plaintext {from,ts,body,sig}.
  const sig = ed25519.sign(signedBytes(alice.publicKeyHex, bob.encPublicKeyHex, ts, b), alice.privateKey);
  const plaintext = te.encode(JSON.stringify({ from: alice.publicKeyHex, ts, body: b, sig: toHex(sig) }));
  // Bob re-seals it verbatim to Carol (needs only public values — the attack).
  const ephPriv = randomBytes(32), ephPub = x25519.getPublicKey(ephPriv);
  const carolPub = fromHex(carol.encPublicKeyHex);
  const key = deriveKey(x25519.getSharedSecret(ephPriv, carolPub), ephPub, carolPub);
  const nonce = randomBytes(24);
  const attackEnv = { epk: toHex(ephPub), n: toHex(nonce), ct: toHex(xchacha20poly1305(key, nonce).encrypt(plaintext)) };
  // Carol's open must REJECT it (the signature is bound to Bob's key, not Carol's).
  assert.throws(() => open(carol.encPrivateKey, carol.encPublicKeyHex, attackEnv), /bad signature/);
});

test("tampered ciphertext is rejected", () => {
  const alice = createIdentity(), bob = createIdentity();
  const env = seal(alice.privateKey, alice.publicKeyHex, bob.encPublicKeyHex, body(alice), 1);
  assert.throws(() => open(bob.encPrivateKey, bob.encPublicKeyHex, { ...env, ct: env.ct.slice(0, -2) + "00" }));
});

test("invite token is URL-safe and validated (#37/#15)", () => {
  const alice = createIdentity();
  const tok = inviteToken(alice, "https://r.example.com");
  assert.ok(!/[+/=]/.test(tok), "no +, /, or = in the token");
  const c = parseInvite(tok);
  assert.equal(c.pubkey, alice.publicKeyHex);
  assert.equal(c.enc, alice.encPublicKeyHex);
  assert.equal(parseInvite("!!not base64!!"), null);
  assert.equal(parseInvite(inviteToken({ ...alice, publicKeyHex: "short" }, "r")), null);
});
