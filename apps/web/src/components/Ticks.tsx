import type { MessageStatus } from "../lib/db";

export function Ticks({ status }: { status?: MessageStatus }) {
  if (status === "read") return <span className="tick read">✓✓</span>;
  if (status === "delivered") return <span className="tick">✓✓</span>;
  return <span className="tick">✓</span>;
}
