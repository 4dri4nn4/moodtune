type MoodTuneLogoProps = {
  size?: number;
};

export default function MoodTuneLogo(props: MoodTuneLogoProps) {
  const size: number = props.size ?? 62;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MoodTune logo"
    >
      <defs>
        <linearGradient
          id="moodtuneGradient"
          x1="20"
          y1="15"
          x2="80"
          y2="85"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#765cff" />
          <stop offset="50%" stopColor="#c34fff" />
          <stop offset="100%" stopColor="#ff5dbd" />
        </linearGradient>

        <filter
          id="moodtuneGlow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation="2.5"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Diamond */}
      <rect
        x="19"
        y="19"
        width="62"
        height="62"
        rx="11"
        transform="rotate(45 50 50)"
        stroke="url(#moodtuneGradient)"
        strokeWidth="2.5"
        filter="url(#moodtuneGlow)"
      />

      {/* Headphone arch */}
      <path
        d="M29 53C29 38 38 28 50 28C62 28 71 38 71 53"
        stroke="url(#moodtuneGradient)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Left headphone */}
      <path
        d="M29 52C25 53 23 57 23 62C23 67 25 70 30 71"
        stroke="url(#moodtuneGradient)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Right headphone */}
      <path
        d="M71 52C75 53 77 57 77 62C77 67 75 70 70 71"
        stroke="url(#moodtuneGradient)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Soundwave */}
      <g
        stroke="url(#moodtuneGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
      >
        <path d="M34 57V64" />
        <path d="M39 52V68" />
        <path d="M44 46V73" />
        <path d="M50 39V78" />
        <path d="M56 46V73" />
        <path d="M61 52V68" />
        <path d="M66 57V64" />
      </g>
    </svg>
  );
}