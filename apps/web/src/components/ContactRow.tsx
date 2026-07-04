import type { StoredContact } from "../lib/db";
import { time } from "../lib/format";
import { useLocales } from "../locales";
import { IconUsers } from "./icons";

export interface Preview {
  text: string;
  ts: number;
  mine: boolean;
}

export function ContactRow({
  c,
  active,
  preview,
  typing,
  online,
  unread,
  onOpen,
}: {
  c: StoredContact;
  active: boolean;
  preview?: Preview;
  typing: boolean;
  online: boolean;
  unread: number;
  onOpen: () => void;
}) {
  const { t } = useLocales();
  return (
    <button className={`contact ${active ? "active" : ""}`} onClick={onOpen}>
      <div className="avatar-wrap">
        <div className={`avatar ${c.isGroup ? "group" : ""}`}>
          {c.isGroup ? <IconUsers width="22" height="22" /> : c.name.slice(0, 1).toUpperCase()}
        </div>
        {online && !c.isGroup && <span className="presence-dot" />}
      </div>
      <div className="contact-main">
        <div className="contact-top">
          <span className="contact-name">{c.name}</span>
          {preview && <span className="contact-time">{time(preview.ts)}</span>}
        </div>
        <div className="contact-sub">
          <span className="preview">
            {typing
              ? t("chat.typing")
              : preview
                ? (preview.mine ? t("chat.youPrefix") : "") + preview.text
                : t("chat.sayHello")}
          </span>
          {unread > 0 && <span className="badge">{unread}</span>}
        </div>
      </div>
    </button>
  );
}
