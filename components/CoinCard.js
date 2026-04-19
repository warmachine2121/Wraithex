'use client';
import { useState, useEffect } from 'react';
import Sparkline from './Sparkline';

export function formatPrice(p) {
  if (p == null || isNaN(p)) return '$—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (p >= 1)    return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (p >= 0.0001) return '$' + p.toFixed(6);
  return '$' + p.toExponential(4);
}

export function formatLarge(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}

// Intensity bar fill: caps at 15% move = 100% bar
function ChangeBar({ change }) {
  const abs   = Math.abs(change ?? 0);
  const pct   = Math.min((abs / 15) * 100, 100);
  const isUp  = (change ?? 0) >= 0;
  const color = isUp ? '#00ff88' : '#ff3a5c';
  const label = abs < 0.1 ? 'FLAT' : abs < 1 ? 'LOW' : abs < 5 ? 'MED' : abs < 10 ? 'HIGH' : 'EXTREME';
  return (
    <div style={{ marginTop: 6, marginBottom: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: '#4a7a96', letterSpacing: '0.1em' }}>24H MOVE</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color, letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}88`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function CoinCard({ coin, data, prev, index, ghostMode }) {
  const [flash, setFlash] = useState(null);
  const isUp = (data?.change24h ?? 0) >= 0;

  useEffect(() => {
    if (!data || !prev) return;
    if (data.price > prev.price)      { setFlash('up');   setTimeout(() => setFlash(null), 700); }
    else if (data.price < prev.price) { setFlash('down'); setTimeout(() => setFlash(null), 700); }
  }, [data?.price]);

  const priceColor = flash === 'up' ? '#00ff88' : flash === 'down' ? '#ff3a5c' : ghostMode ? '#00ff88' : '#c8e0ee';
  const accent     = isUp ? '#00ff88' : '#ff3a5c';

  if (ghostMode) {
    // Ghost mode: raw terminal style, no decorations
    return (
      <div style={{ background: 'transparent', border: '1px solid rgba(0,255,136,0.1)', borderRadius: 2, padding: '10px 12px', fontFamily: "'Share Tech Mono', monospace" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: '0.75rem', color: '#00ff88', letterSpacing: '0.1em' }}>{coin.symbol}</span>
          <span style={{ fontSize: '0.6rem', color: isUp ? '#00ff88' : '#ff3a5c' }}>
            {data ? `${isUp ? '+' : ''}${data.change24h?.toFixed(2)}%` : '—'}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: priceColor, transition: 'color 0.3s', textShadow: flash ? `0 0 8px ${priceColor}` : 'none' }}>
          {data ? formatPrice(data.price) : '——'}
        </div>
        <Sparkline change={data?.change24h ?? 0} seed={index} />
      </div>
    );
  }

  return (
    <div style={{
      background: '#070d12',
      border: `1px solid ${isUp ? 'rgba(0,255,136,0.14)' : 'rgba(255,58,92,0.1)'}`,
      borderRadius: 3, padding: 16, position: 'relative', overflow: 'hidden',
      animation: `fadeIn 0.4s ease ${index * 0.03}s both`,
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, opacity: 0.4 }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${isUp ? 'rgba(0,255,136,0.04)' : 'rgba(255,58,92,0.04)'}, transparent 60%)`, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', border: '1px solid #0f2535', background: 'rgba(255,255,255,0.02)' }}>
            {coin.icon}
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.1rem', letterSpacing: '0.06em', color: '#d0e8f8', lineHeight: 1 }}>{coin.symbol}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#4a7a96', marginTop: 2 }}>{coin.name}</div>
          </div>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#4a7a96', border: '1px solid #1a3040', padding: '2px 5px', borderRadius: 2 }}>
          {data?.rank ? `#${data.rank}` : '—'}
        </div>
      </div>

      {/* Price */}
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.35rem', color: priceColor, marginBottom: 8, transition: 'color 0.4s, text-shadow 0.4s', textShadow: flash ? `0 0 14px ${priceColor}88` : 'none' }}>
        {data ? formatPrice(data.price) : <span style={{ color: '#1a3040' }}>$——.——</span>}
      </div>

      {/* Change badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: accent, background: isUp ? 'rgba(0,255,136,0.07)' : 'rgba(255,58,92,0.07)', border: `1px solid ${isUp ? 'rgba(0,255,136,0.18)' : 'rgba(255,58,92,0.18)'}`, padding: '2px 7px', borderRadius: 2 }}>
          {data ? `${isUp ? '▲' : '▼'} ${Math.abs(data.change24h).toFixed(2)}%` : '—'}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#4a7a96' }}>
          {data ? `VOL ${formatLarge(data.volume)}` : ''}
        </div>
      </div>

      {/* Intensity bar */}
      {data && <ChangeBar change={data.change24h} />}

      {/* Normalised sparkline */}
      <div style={{ marginTop: 8, marginBottom: 10 }}>
        <Sparkline change={data?.change24h ?? 0} seed={index} />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 10, borderTop: '1px solid #0d1e2a' }}>
        {[['CAP', formatLarge(data?.marketCap)], ['HI', formatPrice(data?.high24h)], ['LO', formatPrice(data?.low24h)]].map(([l, v]) => (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', color: '#4a7a96', letterSpacing: '0.1em', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#c8e0ee' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
