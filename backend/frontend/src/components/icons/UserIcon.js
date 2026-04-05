import React from 'react';

export default function UserIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 98"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Head */}
      <circle cx="50" cy="28" r="20" />

      {/* Body / chest — clip gives the shoulder silhouette */}
      <path d="M 10 98 C 10 68 28 58 50 58 C 72 58 90 68 90 98 Z" />
    </svg>
  );
}
