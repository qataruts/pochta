type LogoProps = {
  size?: number;
  className?: string;
  title?: string;
};

// The Vox mark: a voice waveform — five rounded bars rising and falling like
// speech — in white on a blue squircle. Vox is Latin for "voice".
export function Logo({ size = 32, className, title = "Vox" }: LogoProps) {
  const gid = "vox-grad";
  const bars: [number, number][] = [
    [120, 132],
    [188, 232],
    [256, 300],
    [324, 208],
    [392, 148],
  ];
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
      {bars.map(([cx, h], i) => (
        <rect key={i} x={cx - 23} y={256 - h / 2} width={46} height={h} rx={23} fill="#fff" />
      ))}
    </svg>
  );
}
