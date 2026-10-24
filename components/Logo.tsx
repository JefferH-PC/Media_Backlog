import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 28, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>

      {/* Squircle container with hairline stroke */}
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#logoBg)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />

      {/* Layered Shelf / Monogram Geometry */}
      {/* Bottom shelf item */}
      <rect x="7" y="21" width="18" height="3" rx="1.5" fill="#52525b" />

      {/* Middle shelf item */}
      <rect x="7" y="15" width="15" height="3" rx="1.5" fill="#71717a" />

      {/* Top active shelf item */}
      <rect x="7" y="9" width="18" height="3" rx="1.5" fill="url(#accentGrad)" />

      {/* Subtle bookmark ribbon hanging from top shelf */}
      <path
        d="M19 8V18L21.5 16.5L24 18V8H19Z"
        fill="#34d399"
        fillOpacity="0.9"
      />
    </svg>
  );
};
