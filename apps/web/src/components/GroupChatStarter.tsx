import { useState } from "react";
import type { StoredContact } from "../lib/db";
import { useLocales } from "../locales";
import { IconClose } from "./icons";
import { initial } from "../lib/call";

/** Name a new group and pick its members (from your 1:1 contacts). */
export function GroupChatStarter({
  contacts,
  onCreate,
  onClose,
}: {
  contacts: StoredContact[];
  onCreate: (name: string, members: StoredContact[]) => void;
  onClose: () => void;
}) {
  const { t } = useLocales();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (pk: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(pk)) n.delete(pk);
      else n.add(pk);
      return n;
    });

  const create = () => {
    const members = contacts.filter((c) => selected.has(c.pubkey));
    if (name.trim() && members.length) onCreate(name.trim(), members);
  };

  return (
    <div className="net-overlay" onClick={onClose}>
      <div className="net-panel" onClick={(e) => e.stopPropagation()}>
        <div className="net-header">
          <h3>{t("chat.newGroupChat")}</h3>
          <button className="net-close" aria-label="close" onClick={onClose}>
            <IconClose width="18" height="18" />
          </button>
        </div>
        <input
          className="pass-input"
          placeholder={t("chat.groupNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <p className="net-intro">{t("chat.pickMembers")}</p>
        <div className="gc-list">
          {contacts.length === 0 && <div className="gc-empty">{t("chat.noContactsYet")}</div>}
          {contacts.map((c) => (
            <label className="gc-row" key={c.pubkey}>
              <input type="checkbox" checked={selected.has(c.pubkey)} onChange={() => toggle(c.pubkey)} />
              <span className="gc-avatar">{initial(c.name)}</span>
              <span className="gc-name">{c.name}</span>
            </label>
          ))}
        </div>
        <div className="gc-actions">
          <button
            className="gc-start video"
            disabled={!name.trim() || selected.size === 0}
            onClick={create}
          >
            {t("chat.createGroup")}
          </button>
        </div>
      </div>
    </div>
  );
}
