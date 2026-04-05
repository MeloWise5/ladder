import React from 'react';

export default function PlusIcon({ size = 40, color = 'currentColor' }) {
  const t = size * 0.18; // arm thickness
  const c = size / 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Horizontal bar */}
      <rect x="10" y="41" width="80" height="18" rx="9" />
      {/* Vertical bar */}
      <rect x="41" y="10" width="18" height="80" rx="9" />
    </svg>
  );
}
