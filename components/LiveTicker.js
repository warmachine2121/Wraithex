'use client';
import { useState, useEffect, useRef } from 'react';

function formatPrice(p) {
  if (p == null || isNaN(p)) return '—';
  if (p >= 1000) return '$' + p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (p >= 1) return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return '$' + p.toFixed(4);
}

function LivePricePill({ symbol, color = '#00d4ff' }) {
  const [price, setPrice]     = useState(null);
  const [flash, setFlash]     = useState(null); // 'up' | 'down' | null
  const [connected, setConnected] = useState(false);
  const prevPrice = useRef(null);
  const ws        = useRef(null);
  const reconnect = useRef(null);

  const pair = symbol === 'BTC' ? 'tBTCUSD' : 'tXMRUSD';

  const connect = () => {
    try {
      ws.current = new WebSocket('wss://api-pub.bitfinex.com/ws/2');

      ws.current.onopen = () => {
        setConnected(true);
        ws.current.send(JSON.stringify({
          event: 'subscribe',
          channel: 'ticker',
          symbol: pair,
        }));
      };

      ws.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        // Bitfinex ticker format: [chanId, [bid, bidSize, ask, askSize, dailyChange, dailyChangePct, lastPrice, ...]]
        if (Array.isArray(data) && Array.isArray(data[1]) && data[1].length > 6) {
          const newPrice = data[1][6]; // last price
          if (newPrice && newPrice > 0) {
            if (prevPrice.current !== null) {
              if (newPrice > prevPrice.current) {
                setFlash('up');
                setTimeout(() => setFlash(null), 600);
              } else if (newPrice < prevPrice.current) {
                setFlash('down');
                setTimeout(() => setFlash(null), 600);
              }
            }
            prevPrice.current = newPrice;
            setPrice(newPrice);
          }
        }
      };

      ws.current.onerror = () => {
        setConnected(false);
      };

      ws.current.onclose = () => {
        setConnected(false);
        // Reconnect after 3s
        reconnect.current = setTimeout(connect, 3000);
      };
    } catch (e) {
      setConnected(false);
      reconnect.current = setTimeout(connect, 3000);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnect.current);
      if (ws.current) ws.current.close();
    };
  }, []);

  const priceColor = flash === 'up' ? '#00ff88' : flash === 'down' ? '#ff3a5c' : color;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: '#070d12',
      border: `1px solid ${flash === 'up' ? 'rgba(0,255,136,0.3)' : flash === 'down' ? 'rgba(255,58,92,0.3)' : 'rgba(0,212,255,0.1)'}`,
      borderRadius: 3, padding: '6px 12px',
      transition: 'border-color 0.3s',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Flash bg */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: flash === 'up' ? 'rgba(0,255,136,0.06)' : 'rgba(255,58,92,0.06)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Live dot */}
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: connected ? '#00ff88' : '#ff3a5c',
        boxShadow: connected ? '0 0 6px #00ff88' : '0 0 6px #ff3a5c',
        animation: connected ? 'pulse 1s infinite' : 'none',
        flexShrink: 0,
      }} />

      {/* Symbol */}
      <span style={{
        fontFamily: "'Bebas Neue', cursive",
        fontSize: '0.95rem', letterSpacing: '0.1em',
        color: symbol === 'XMR' ? '#ff6600' : '#00d4ff',
        textShadow: symbol === 'XMR' ? '0 0 8px rgba(255,102,0,0.4)' : '0 0 8px rgba(0,212,255,0.3)',
      }}>{symbol}</span>

      {/* Price */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.9rem',
        color: priceColor,
        transition: 'color 0.3s, text-shadow 0.3s',
        textShadow: flash ? `0 0 10px ${priceColor}` : 'none',
        minWidth: symbol === 'BTC' ? 90 : 70,
      }}>
        {price ? formatPrice(price) : '—'}
      </span>

      {/* Flash arrow */}
      {flash && (
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '0.7rem',
          color: flash === 'up' ? '#00ff88' : '#ff3a5c',
        }}>{flash === 'up' ? '▲' : '▼'}</span>
      )}

      {/* ⚡ live badge */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.5rem', color: '#4a7a96',
        letterSpacing: '0.1em', marginLeft: 2,
      }}>⚡LIVE</span>
    </div>
  );
}

export default function LiveTicker({ staticCoins, marketData }) {
  const items = [...staticCoins, ...staticCoins];

  return (
    <div style={{ borderBottom: '1px solid #0f2535' }}>
      {/* Live WebSocket pills for BTC + XMR */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid #0a1820',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', letterSpacing: '0.15em' }}>
          ⚡ REAL-TIME
        </span>
        <LivePricePill symbol="BTC" />
        <LivePricePill symbol="XMR" />
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: '#1e3a50', letterSpacing: '0.1em', marginLeft: 'auto' }}>
          VIA BITFINEX // INDEPENDENT // NO KYC
        </span>
      </div>

      {/* Scrolling ticker for all coins */}
      <div style={{ background: 'rgba(0,212,255,0.02)', overflow: 'hidden', padding: '5px 0' }}>
        <div style={{ display: 'flex', gap: 40, animation: 'ticker 50s linear infinite', whiteSpace: 'nowrap' }}>
          {items.map((c, i) => {
            const d = marketData[c.id];
            const up = (d?.change24h ?? 0) >= 0;
            return (
              <span key={i} style={{ display: 'inline-flex', gap: 7, alignItems: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem' }}>
                <span style={{ color: c.id === 'monero' ? '#ff6600' : '#4a9ab5' }}>{c.symbol}</span>
                <span style={{ color: '#8ab0c4' }}>{d ? formatPrice(d.price) : '—'}</span>
                {d && <span style={{ color: up ? 'rgba(0,255,136,0.6)' : 'rgba(255,58,92,0.6)' }}>{up ? '+' : ''}{d.change24h.toFixed(2)}%</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
