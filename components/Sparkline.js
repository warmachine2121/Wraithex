'use client';
import { useRef } from 'react';

export default function Sparkline({ change = 0, seed = 0 }) {
  const pts = useRef(null);
  if (!pts.current) {
    let val = 50;
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const r = Math.abs(Math.sin(seed * 9999 + i * 127));
      val += (r - 0.49) * 10;
      val = Math.max(10, Math.min(90, val));
      arr.push(val);
    }
    if (change > 0) arr[19] = Math.max(arr[18] + 5, 58);
    else arr[19] = Math.min(arr[18] - 5, 42);
    pts.current = arr;
  }
  const arr = pts.current;
  const w = 200, h = 34;
  const minV = Math.min(...arr), maxV = Math.max(...arr);
  const range = maxV - minV || 1;
  const coords = arr.map(
    (v, i) => `${(i / (arr.length - 1)) * w},${h - ((v - minV) / range) * (h - 4) - 2}`
  );
  const color = change >= 0 ? '#00ff88' : '#ff3a5c';
  const gid = `sg${seed}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${coords.join(' L ')} L ${w},${h} L 0,${h} Z`} fill={`url(#${gid})`} />
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
