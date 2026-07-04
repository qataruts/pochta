import { newRoomId } from "@elementaio/vox-sdk";

/** A meeting link the app understands: `?meet=<roomId>` (or `/join/<roomId>`). */
export function meetingRoomFromUrl(): string | null {
  const q = new URLSearchParams(location.search).get("meet");
  if (q) return q;
  const m = location.pathname.match(/^\/join\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/** Mint a fresh meeting room id. */
export function newMeeting(): string {
  return newRoomId();
}

/** A shareable link anyone can open to join — no account required. */
export function meetingLink(roomId: string): string {
  const origin =
    location.protocol === "file:" || !location.host
      ? "https://vox.server.jadwal.io" // packaged desktop → the hosted web app
      : location.origin;
  return `${origin}/?meet=${roomId}`;
}

/** Drop the meeting param from the URL (on leave), without a reload. */
export function clearMeetingUrl(): void {
  history.replaceState(null, "", location.pathname);
}
