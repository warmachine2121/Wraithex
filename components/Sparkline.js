'use client';
import { useRef } from 'react';

// Returns colour with intensity based on % change magnitude
function sparkColor(change) {
  const abs = Math.abs(change ?? 0);
  const up  = (change ?? 0) >= 0;
  // Intensity: dim at <1%, bright at >10%
  const intensity = Math.min(abs / 10, 1); // 0 to 1
  if (up) {
    // dim: #006633  bright: #00ff88
    const r = 0;
    const g = Math.round(102 + intensity * 153);
    const b = Math.round(51  + intensity * 85);
    return `rgb(${r},${g},${b})`;
  } else {
    // dim: #660022  bright: #ff3a5c
    const r = Math.round(102 + intensity * 153);
    const g = Math.round(0   + intensity * 58);
    const b = Math.round(34  + intensity * 56);
    return `rgb(${r},${g},${b})`;
  }
}

// Normalise sparkline points to % change from start (not price)
// So all coins are on the same visual scale
function buildNormalisedPoints(change, seed) {
  let val = 0; // start at 0% change
  const arr = [];
  for (let i = 0; i < 24; i++) {
    const r = Math.abs(Math.sin(seed * 9999 + i * 127));
    val += (r - 0.48) * (Math.abs(change ?? 0) * 0.3 + 0.5);
    arr.push(val);
  }
  // Force final point to match actual 24h change
  arr[23] = change ?? 0;
  return arr;
}

export default function Sparkline({ change = 0, seed = 0 }) {
  const pts = useRef(null);
  if (!pts.current) {
    pts.current = buildNormalisedPoints(change, seed);
  }

  const arr  = pts.current;
  const w    = 200;
  const h    = 36;

  // Scale: find global min/max across the points
  // Add padding so flat lines still show
  const minV  = Math.min(...arr, change * 1.1);
  const maxV  = Math.max(...arr, change * 1.1);
  const range = Math.max(maxV - minV, 0.5); // minimum range of 0.5% to avoid flat lines

  const toY = v => h - ((v - minV) / range) * (h - 6) - 3;

  const coords = arr.map((v, i) => `${(i / (arr.length - 1)) * w},${toY(v)}`);
  const color  = sparkColor(change);
  const gid    = `sg${seed}`;

  // Zero line position
  const zeroY  = toY(0);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Zero baseline */}
      <line x1="0" y1={zeroY} x2={w} y2={zeroY} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
      {/* Fill */}
      <path d={`M ${coords.join(' L ')} L ${w},${toY(0)} L 0,${toY(0)} Z`} fill={`url(#${gid})`} />
      {/* Line */}
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={w} cy={toY(change)} r="2.5" fill={color} opacity="0.9" />
    </svg>
  );
}
