import React from 'react';

export default function AdminIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <mask id="admin-ladder-mask">
          {/* White = visible, Black = cut out */}
          <rect width="100" height="110" fill="white" />
          {/* Left rail */}
          <rect x="36" y="20" width="7" height="58" rx="2" fill="black" />
          {/* Right rail */}
          <rect x="57" y="20" width="7" height="58" rx="2" fill="black" />
          {/* Rungs */}
          <rect x="36" y="30" width="28" height="6" rx="1.5" fill="black" />
          <rect x="36" y="44" width="28" height="6" rx="1.5" fill="black" />
          <rect x="36" y="58" width="28" height="6" rx="1.5" fill="black" />
          <rect x="36" y="72" width="28" height="6" rx="1.5" fill="black" />
        </mask>
      </defs>

      {/* Shield with ladder cut through it */}
      <path
        d="M 50 105 Q 8 86 8 64 L 8 18 Q 8 8 18 8 L 82 8 Q 92 8 92 18 L 92 64 Q 92 86 50 105 Z"
        mask="url(#admin-ladder-mask)"
      />
    </svg>
  );
}
