import { inviteToken as makeToken, parseInvite } from "@elementaio/vox-sdk";
import type { Identity } from "@elementaio/vox-sdk";
import { httpBase } from "./server";

/**
 * Browser binding for SDK invites: the SDK builds the token from your identity +
 * a relay hint; here we fill the hint with THIS relay's http base and wrap it in
 * a shareable link (uses `location`, which only exists in the browser).
 */
export const inviteToken = (id: Identity): string => makeToken(id, httpBase());

export const inviteLink = (id: Identity): string =>
  `${location.origin}${location.pathname}?add=${inviteToken(id)}`;

export { parseInvite };
