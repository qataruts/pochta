import { Toggle } from "./Toggle";

/**
 * One capability in the Network panel — used for BOTH Host and Donate so the two
 * read as siblings but never merge. Presentational: an icon, a title/description,
 * an on/off switch, and a status line whose colour reflects the current state.
 */
export function RoleCard({
  icon,
  title,
  desc,
  on,
  busy,
  disabled,
  toggleLabel,
  status,
  tone = "idle",
  note,
  onToggle,
}: {
  icon: string;
  title: string;
  desc: string;
  on: boolean;
  busy?: boolean;
  disabled?: boolean;
  toggleLabel: string;
  status: string;
  tone?: "idle" | "live" | "muted";
  note?: string;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className={`role-card ${on ? "on" : ""} ${disabled ? "disabled" : ""}`}>
      <div className="role-head">
        <span className="role-icon">{icon}</span>
        <div className="role-titles">
          <div className="role-title">{title}</div>
          <div className="role-desc">{desc}</div>
        </div>
        <Toggle on={on} busy={busy} disabled={disabled} label={toggleLabel} onChange={onToggle} />
      </div>
      <div className={`role-status ${tone}`}>
        <span className="role-dot" />
        <span>{status}</span>
      </div>
      {note && <div className="role-note">{note}</div>}
    </div>
  );
}
