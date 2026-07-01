import type { TFunction } from "i18next";
import type { PresenceInfo } from "./client";
import type { MediaRef, StoredMessage } from "./db";

/** Presentation helpers shared by the messenger components (all translation-aware). */

export const time = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function mediaLabel(t: TFunction, mk: MediaRef["mkind"], name?: string): string {
  if (mk === "image") return t("chat.photo");
  if (mk === "audio") return t("chat.voiceLabel");
  return t("chat.fileLabel", { name: name || t("chat.file") });
}

export function quoteText(t: TFunction, q?: StoredMessage): string {
  if (!q) return t("chat.quoteMessage");
  if (q.deleted) return t("chat.deletedMessage");
  return q.media ? mediaLabel(t, q.media.mkind, q.media.name) : q.text;
}

export function previewText(t: TFunction, m: StoredMessage): string {
  if (m.deleted) return t("chat.deletedShort");
  if (m.media) return mediaLabel(t, m.media.mkind, m.media.name);
  return m.text;
}

export function presenceText(t: TFunction, info?: PresenceInfo): string {
  if (!info) return "";
  if (info.online) return t("chat.online");
  if (!info.lastSeen) return t("chat.offline");
  return t("chat.lastSeen", { ago: timeAgo(t, info.lastSeen) });
}

export function timeAgo(t: TFunction, ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return t("chat.justNow");
  const m = Math.floor(s / 60);
  if (m < 60) return t("chat.minutesAgo", { m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("chat.hoursAgo", { h });
  return new Date(ts).toLocaleDateString();
}
