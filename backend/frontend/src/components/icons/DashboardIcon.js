import React from 'react';

function DashboardIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
    >
      {/* Dashboard grid squares — background */}
      <rect x="0" y="0" width="43" height="43" rx="8" fill={color} opacity="0.28" />
      <rect x="57" y="0" width="43" height="43" rx="8" fill={color} opacity="0.28" />
      <rect x="0" y="57" width="43" height="43" rx="8" fill={color} opacity="0.28" />
      <rect x="57" y="57" width="43" height="43" rx="8" fill={color} opacity="0.28" />

      {/* Ladder — foreground (drawn on top) */}
      {/* Left rail */}
      <rect x="30" y="4" width="7" height="92" rx="3.5" fill={color} />
      {/* Right rail */}
      <rect x="63" y="4" width="7" height="92" rx="3.5" fill={color} />
      {/* Rungs */}
      <rect x="30" y="19" width="40" height="7" rx="2" fill={color} />
      <rect x="30" y="37" width="40" height="7" rx="2" fill={color} />
      <rect x="30" y="55" width="40" height="7" rx="2" fill={color} />
      <rect x="30" y="73" width="40" height="7" rx="2" fill={color} />
    </svg>
  );
}

export default DashboardIcon;
