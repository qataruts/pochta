/** A small on/off switch. Presentational — parent owns the state. */
export function Toggle({
  on,
  busy,
  disabled,
  label,
  onChange,
}: {
  on: boolean;
  busy?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? "on" : ""} ${busy ? "busy" : ""}`}
      disabled={disabled || busy}
      onClick={() => onChange(!on)}
    >
      <span className="toggle-knob" />
    </button>
  );
}
