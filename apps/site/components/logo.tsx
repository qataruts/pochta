type LogoProps = {
  size?: number;
  className?: string;
  title?: string;
};

// The Pochta mark: the Cyrillic П (first letter of почта) drawn as a
// post-office doorway with a mail slot, in white on a blue squircle.
export function Logo({ size = 32, className, title = "Pochta" }: LogoProps) {
  const gid = "pochta-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="72" y1="56" x2="452" y2="472" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6ea0ff" />
          <stop offset="0.5" stopColor="#4f8cff" />
          <stop offset="1" stopColor="#2f6fe6" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="480" height="480" rx="120" fill={`url(#${gid})`} />
      <rect x="16.5" y="16.5" width="479" height="479" rx="119.5" fill="none" stroke="#000" strokeOpacity="0.06" />
      {/* the Cyrillic П — the doorway of a post office */}
      <path
        d="M150 374 L150 202 Q150 150 202 150 L310 150 Q362 150 362 202 L362 374 L300 374 L300 210 L212 210 L212 374 Z"
        fill="#fff"
      />
      {/* a mail slot cut into the crossbar */}
      <rect x="218" y="171" width="76" height="17" rx="8.5" fill="#2f6fe6" />
    </svg>
  );
}
