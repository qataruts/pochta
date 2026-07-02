"use client";

import { useCallback } from "react";
import { IconSun, IconMoon } from "./icons";

// Icons are swapped by CSS from the `.dark` class on <html>, so the server
// and client render identical markup (no hydration mismatch). The button
// only toggles the class + persists the choice.
export function ThemeToggle({ label }: { label: string }) {
  const toggle = useCallback(() => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    el.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("pochta-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      <IconMoon className="i-moon" />
      <IconSun className="i-sun" />
    </button>
  );
}
