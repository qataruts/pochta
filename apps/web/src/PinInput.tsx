import { useEffect, useRef } from "react";

/**
 * iPhone-style 6-digit PIN: six boxes, digits hidden as dots, numeric keypad on
 * mobile. A single hidden input captures the keystrokes (handles paste, backspace,
 * and the OS keyboard); the boxes are just the visual.
 */
export function PinInput({
  value,
  onChange,
  onComplete,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const digits = value.replace(/\D/g, "").slice(0, 6);
  return (
    <div className="pin" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        className="pin-hidden"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="PIN"
        maxLength={6}
        value={digits}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          onChange(v);
          if (v.length === 6) onComplete?.(v);
        }}
      />
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={`pin-box${i < digits.length ? " filled" : ""}${i === digits.length ? " active" : ""}`}
        >
          {i < digits.length ? "●" : ""}
        </div>
      ))}
    </div>
  );
}
