'use client';
import { useState, useEffect } from 'react';
import CoinCard, { formatPrice, formatLarge } from './CoinCard';
import LiveTicker from './LiveTicker';

const COINS = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',   icon: '₿' },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',  icon: 'Ξ' },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana',    icon: '◎' },
  { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',       icon: 'B' },
  { id: 'ripple',      symbol: 'XRP',  name: 'XRP',       icon: '✕' },
  { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin',  icon: 'Ð' },
  { id: 'cardano',     symbol: 'ADA',  name: 'Cardano',   icon: '₳' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', icon: '▲' },
  { id: 'chainlink',   symbol: 'LINK', name: 'Chainlink', icon: '⬡' },
  { id: 'polkadot',    symbol: 'DOT',  name: 'Polkadot',  icon: '●' },
  { id: 'litecoin',    symbol: 'LTC',  name: 'Litecoin',  icon: 'Ł' },
  { id: 'shiba-inu',   symbol: 'SHIB', name: 'Shiba Inu', icon: '🐕' },
  { id: 'monero',      symbol: 'XMR',  name: 'Monero',    icon: '🔒' },
];

// ⚠️ REPLACE WITH YOUR REAL XMR WALLET ADDRESS
const XMR_ADDRESS = 'YOUR_XMR_WALLET_ADDRESS_HERE';

const PRIVACY_DATA = {
  monero:  { name: 'Monero',   symbol: 'XMR', icon: '🔒', color: '#ff6600', features: [{ label: 'Ring Signatures', score: 10, desc: 'Sender is completely untraceable' }, { label: 'Stealth Addresses', score: 10, desc: 'One-time addresses, no wallet linking' }, { label: 'Hidden Amounts', score: 10, desc: 'RingCT hides all transaction amounts' }, { label: 'Fungibility', score: 10, desc: 'Every XMR identical — no tainted coins' }, { label: 'Default Privacy', score: 10, desc: 'Privacy ON for every tx, always' }] },
  bitcoin: { name: 'Bitcoin',  symbol: 'BTC', icon: '₿',  color: '#f7931a', features: [{ label: 'Ring Signatures', score: 0, desc: 'None — all senders visible on-chain' }, { label: 'Stealth Addresses', score: 2, desc: 'None — addresses are public and reusable' }, { label: 'Hidden Amounts', score: 0, desc: 'All amounts fully visible on-chain' }, { label: 'Fungibility', score: 3, desc: 'Tainted coins blacklisted by exchanges' }, { label: 'Default Privacy', score: 2, desc: 'Opt-in only via mixers — not built-in' }] },
  ethereum:{ name: 'Ethereum', symbol: 'ETH', icon: 'Ξ',  color: '#627eea', features: [{ label: 'Ring Signatures', score: 0, desc: 'None — all transactions public' }, { label: 'Stealth Addresses', score: 1, desc: 'EIP-5564 proposed, not adopted' }, { label: 'Hidden Amounts', score: 0, desc: 'All amounts and contracts public' }, { label: 'Fungibility', score: 2, desc: 'OFAC addresses blocked by validators' }, { label: 'Default Privacy', score: 1, desc: 'No native privacy — Tornado Cash sanctioned' }] },
  zcash:   { name: 'Zcash',    symbol: 'ZEC', icon: 'Z',  color: '#f4b728', features: [{ label: 'Ring Signatures', score: 9, desc: 'zk-SNARKs in shielded transactions' }, { label: 'Stealth Addresses', score: 8, desc: 'Available via z-addresses' }, { label: 'Hidden Amounts', score: 7, desc: 'Hidden in shielded txs only' }, { label: 'Fungibility', score: 4, desc: 'Only ~20% of txs are shielded' }, { label: 'Default Privacy', score: 3, desc: 'Opt-in only — most use transparent addrs' }] },
};

const GOLD_PRIVACY = [
  { label: 'Traceability',    score: 6, desc: 'Physical gold hard to trace if handled carefully' },
  { label: 'Portability',     score: 2, desc: '$1M in gold weighs ~18kg — very hard to move' },
  { label: 'Seizure Resist',  score: 3, desc: 'US govt banned gold ownership in 1933 (EO 6102)' },
  { label: 'Fungibility',     score: 8, desc: 'Gold is largely fungible but serial numbers exist' },
  { label: 'Default Privacy', score: 5, desc: 'Private if cash purchase, tracked if bank involved' },
];

const XMR_VS_GOLD = [
  { label: 'Traceability',    score: 10, desc: 'Completely untraceable by design' },
  { label: 'Portability',     score: 10, desc: '$1M in XMR fits in your head — 25 words' },
  { label: 'Seizure Resist',  score: 10, desc: 'Cannot be seized — no physical form' },
  { label: 'Fungibility',     score: 10, desc: 'Every XMR identical — mathematically proven' },
  { label: 'Default Privacy', score: 10, desc: 'Privacy ON by default, every single transaction' },
];

const scoreColor = s => s >= 8 ? '#00ff88' : s >= 5 ? '#ffd700' : s >= 2 ? '#ff9500' : '#ff3a5c';

function PrivacyBar({ score }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ width: 9, height: 7, borderRadius: 1, background: i < score ? scoreColor(score) : '#1a3040', boxShadow: i < score ? `0 0 4px ${scoreColor(score)}55` : 'none' }} />
      ))}
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: scoreColor(score), marginLeft: 5 }}>{score}/10</span>
    </div>
  );
}

function DonationModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(XMR_ADDRESS); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: '#070d12', border: '1px solid rgba(255,102,0,0.4)', borderRadius: 6, padding: 32, maxWidth: 480, width: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: '2px solid rgba(255,102,0,0.6)', borderLeft: '2px solid rgba(255,102,0,0.6)' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: '2px solid rgba(255,102,0,0.4)', borderRight: '2px solid rgba(255,102,0,0.4)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, rgba(255,102,0,0.05), transparent 60%)', pointerEvents: 'none', borderRadius: 6 }} />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔒</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.8rem', letterSpacing: '0.1em', color: '#ff6600', textShadow: '0 0 20px rgba(255,102,0,0.5)' }}>SUPPORT WRAITHEX</div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#4a7a96', letterSpacing: '0.15em', marginTop: 4 }}>DONATE WITH MONERO — 100% PRIVATE</div>
        </div>
        <div style={{ background: 'rgba(255,102,0,0.05)', border: '1px solid rgba(255,102,0,0.15)', borderRadius: 4, padding: '10px 14px', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#ff9944', lineHeight: 1.6 }}>
            Your donation is completely untraceable. No one can see who sent it, how much, or when. True financial privacy.
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#4a7a96', letterSpacing: '0.12em', marginBottom: 8 }}>XMR WALLET ADDRESS</div>
          <div style={{ background: '#050a0e', border: '1px solid #1a3040', borderRadius: 3, padding: '10px 12px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#c8e0ee', wordBreak: 'break-all', lineHeight: 1.6 }}>{XMR_ADDRESS}</div>
        </div>
        <button onClick={copy} style={{ width: '100%', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: copied ? '#050a0e' : '#ff6600', background: copied ? '#ff6600' : 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.4)', padding: '12px', cursor: 'pointer', letterSpacing: '0.15em', borderRadius: 3, transition: 'all 0.2s', marginBottom: 12 }}>
          {copied ? '✓ COPIED TO CLIPBOARD' : '⎘ COPY ADDRESS'}
        </button>
        <button onClick={onClose} style={{ width: '100%', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#4a7a96', background: 'transparent', border: '1px solid #1a3040', padding: '8px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 3 }}>CLOSE</button>
        <div style={{ textAlign: 'center', marginTop: 14, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#1e3a50', letterSpacing: '0.1em' }}>EVERY DONATION KEEPS WRAITHEX FREE FOR EVERYONE</div>
      </div>
    </div>
  );
}

function GoldPanel({ goldData, xmrData }) {
  const [tab, setTab] = useState('price'); // price | privacy

  const goldPrice = goldData?.price;
  const xmrPrice  = xmrData?.price;
  const btcPrice  = null; // passed separately if needed

  return (
    <div style={{ background: '#070d12', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 4, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(255,215,0,0.04), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '2px solid rgba(255,215,0,0.4)', borderRight: '2px solid rgba(255,215,0,0.4)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '2px solid rgba(255,102,0,0.3)', borderLeft: '2px solid rgba(255,102,0,0.3)' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.4rem' }}>🥇</span>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.6rem', letterSpacing: '0.1em', color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.4)' }}>GOLD VS CRYPTO</span>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#4a7a96', letterSpacing: '0.15em' }}>STORE OF VALUE COMPARISON — LIVE DATA</div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[['PRICE', 'price'], ['PRIVACY', 'privacy']].map(([label, val]) => (
            <button key={val} onClick={() => setTab(val)} style={{
              fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem',
              color: tab === val ? '#050a0e' : '#4a7a96',
              background: tab === val ? '#ffd700' : 'transparent',
              border: `1px solid ${tab === val ? '#ffd700' : '#1a3040'}`,
              padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2, transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {tab === 'price' && (
        <div>
          {/* Price cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: '🥇 GOLD (XAU)', price: goldPrice, change: goldData?.change24h, color: '#ffd700', sub: 'per troy oz' },
              { label: '🔒 MONERO (XMR)', price: xmrPrice, change: xmrData?.change24h, color: '#ff6600', sub: 'per coin' },
            ].map(({ label, price, change, color, sub }) => (
              <div key={label} style={{ background: '#050a0e', border: `1px solid ${color}22`, borderRadius: 3, padding: '14px' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#4a7a96', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.2rem', color, marginBottom: 4, textShadow: `0 0 10px ${color}44` }}>
                  {price ? formatPrice(price) : '—'}
                </div>
                {change != null && (
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: change >= 0 ? '#00ff88' : '#ff3a5c' }}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% 24H
                  </div>
                )}
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#1e3a50', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Comparison stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { label: 'PORTABILITY', gold: '18kg per $1M', xmr: '25 words in your head', winner: 'xmr' },
              { label: 'DIVISIBILITY', gold: 'Hard to split physically', xmr: '12 decimal places', winner: 'xmr' },
              { label: 'VERIFIABILITY', gold: 'Requires acid test / assay', xmr: 'Cryptographically instant', winner: 'xmr' },
              { label: 'HISTORY', gold: '5,000+ years as money', xmr: 'Since 2014', winner: 'gold' },
            ].map(({ label, gold, xmr, winner }) => (
              <div key={label} style={{ background: '#050a0e', border: '1px solid #0f2535', borderRadius: 3, padding: '12px' }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', letterSpacing: '0.12em', marginBottom: 8 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem' }}>🥇</span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: winner === 'gold' ? '#ffd700' : '#4a7a96' }}>{gold}</span>
                    {winner === 'gold' && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: '#ffd700' }}>✓</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem' }}>🔒</span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: winner === 'xmr' ? '#ff6600' : '#4a7a96' }}>{xmr}</span>
                    {winner === 'xmr' && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: '#ff6600' }}>✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)', borderRadius: 3 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#ffd700', letterSpacing: '0.08em' }}>
              🥇 Gold you can carry in your head. XMR is the digital equivalent of gold — but unseizable, untraceable, and infinitely portable.
            </span>
          </div>
        </div>
      )}

      {tab === 'privacy' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#4a7a96', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #0f2535', letterSpacing: '0.1em', width: '28%' }}>FEATURE</th>
                <th style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.1rem', color: '#ffd700', textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid #0f2535', letterSpacing: '0.1em', textShadow: '0 0 12px rgba(255,215,0,0.3)' }}>🥇 GOLD</th>
                <th style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.1rem', color: '#ff6600', textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid #0f2535', letterSpacing: '0.1em', textShadow: '0 0 12px rgba(255,102,0,0.3)' }}>🔒 XMR</th>
              </tr>
            </thead>
            <tbody>
              {GOLD_PRIVACY.map((feat, i) => (
                <tr key={feat.label} style={{ borderBottom: '1px solid #0a1820' }}>
                  <td style={{ padding: '12px', verticalAlign: 'top' }}>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#c8e0ee', marginBottom: 3 }}>{feat.label}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                    <PrivacyBar score={feat.score} />
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', marginTop: 5, lineHeight: 1.4, textAlign: 'left' }}>{feat.desc}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                    <PrivacyBar score={XMR_VS_GOLD[i].score} />
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', marginTop: 5, lineHeight: 1.4, textAlign: 'left' }}>{XMR_VS_GOLD[i].desc}</div>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '14px 12px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#c8e0ee' }}>OVERALL</td>
                {[GOLD_PRIVACY, XMR_VS_GOLD].map((data, i) => {
                  const total = data.reduce((s, f) => s + f.score, 0);
                  const pct   = Math.round((total / (data.length * 10)) * 100);
                  const color = i === 0 ? '#ffd700' : '#ff6600';
                  return (
                    <td key={i} style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', color, textShadow: `0 0 16px ${color}55`, lineHeight: 1 }}>{pct}%</div>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', marginTop: 2 }}>{total}/{data.length * 10} pts</div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PrivacyPanel({ xmrData }) {
  const [selected, setSelected] = useState(['monero', 'bitcoin']);
  const toggle = id => {
    if (selected.includes(id)) { if (selected.length > 1) setSelected(selected.filter(s => s !== id)); }
    else { if (selected.length < 3) setSelected([...selected, id]); }
  };
  const coins = selected.map(id => PRIVACY_DATA[id]).filter(Boolean);

  return (
    <div style={{ background: '#070d12', border: '1px solid rgba(255,102,0,0.25)', borderRadius: 4, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(255,102,0,0.06), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '2px solid rgba(255,102,0,0.5)', borderLeft: '2px solid rgba(255,102,0,0.5)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.4rem' }}>🔒</span>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.6rem', letterSpacing: '0.1em', color: '#ff6600', textShadow: '0 0 20px rgba(255,102,0,0.5)' }}>PRIVACY COMPARISON</span>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#4a7a96', letterSpacing: '0.15em' }}>XMR VS THE MARKET — TECHNICAL ANALYSIS</div>
        </div>
        {xmrData && (
          <div style={{ background: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.25)', borderRadius: 4, padding: '10px 16px', textAlign: 'right' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#ff6600', letterSpacing: '0.15em', marginBottom: 3 }}>XMR LIVE PRICE</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.3rem', color: '#ff9944' }}>{formatPrice(xmrData.price)}</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: xmrData.change24h >= 0 ? '#00ff88' : '#ff3a5c', marginTop: 2 }}>
              {xmrData.change24h >= 0 ? '▲' : '▼'} {Math.abs(xmrData.change24h).toFixed(2)}% 24H
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#4a7a96', letterSpacing: '0.1em' }}>COMPARE:</span>
        {Object.entries(PRIVACY_DATA).map(([id, coin]) => (
          <button key={id} onClick={() => toggle(id)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: selected.includes(id) ? coin.color : '#4a7a96', background: selected.includes(id) ? `${coin.color}15` : 'transparent', border: `1px solid ${selected.includes(id) ? coin.color : '#1a3040'}`, padding: '4px 10px', borderRadius: 2, cursor: 'pointer', boxShadow: selected.includes(id) ? `0 0 8px ${coin.color}33` : 'none', transition: 'all 0.2s' }}>{coin.icon} {coin.symbol}</button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#4a7a96', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #0f2535', letterSpacing: '0.1em', width: '28%' }}>FEATURE</th>
              {coins.map(coin => (
                <th key={coin.symbol} style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.1rem', color: coin.color, textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid #0f2535', letterSpacing: '0.1em', textShadow: `0 0 12px ${coin.color}44` }}>{coin.icon} {coin.symbol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRIVACY_DATA.monero.features.map((feat, fi) => (
              <tr key={feat.label} style={{ borderBottom: '1px solid #0a1820' }}>
                <td style={{ padding: '12px', verticalAlign: 'top' }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#c8e0ee', marginBottom: 3 }}>{feat.label}</div>
                </td>
                {coins.map(coin => {
                  const f = coin.features[fi];
                  return (
                    <td key={coin.symbol} style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top' }}>
                      <PrivacyBar score={f.score} />
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', marginTop: 5, lineHeight: 1.4, textAlign: 'left' }}>{f.desc}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '14px 12px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#c8e0ee' }}>OVERALL</td>
              {coins.map(coin => {
                const total = coin.features.reduce((s, f) => s + f.score, 0);
                const pct   = Math.round((total / (coin.features.length * 10)) * 100);
                return (
                  <td key={coin.symbol} style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', color: scoreColor(total / coin.features.length), textShadow: `0 0 16px ${scoreColor(total / coin.features.length)}66`, lineHeight: 1 }}>{pct}%</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', marginTop: 2 }}>{total}/{coin.features.length * 10} pts</div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,102,0,0.05)', border: '1px solid rgba(255,102,0,0.15)', borderRadius: 3 }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#ff6600', letterSpacing: '0.1em' }}>🔒 XMR — Privacy is not optional, it is the default. The only truly fungible, untraceable cryptocurrency.</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [marketData, setMarketData]     = useState({});
  const [goldData, setGoldData]         = useState(null);
  const [prevData, setPrevData]         = useState({});
  const [status, setStatus]             = useState('loading');
  const [lastUpdate, setLastUpdate]     = useState(null);
  const [errorMsg, setErrorMsg]         = useState('');
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const [sort, setSort]                 = useState('rank');
  const [showPrivacy, setShowPrivacy]   = useState(true);
  const [showGold, setShowGold]         = useState(true);
  const [showDonate, setShowDonate]     = useState(false);

  const fetchData = async () => {
    setStatus(prev => prev === 'live' ? 'live' : 'loading');
    try {
      const res  = await fetch('/api/prices');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'API error');
      setPrevData(marketData);
      const nd = {};
      json.data.coins.forEach(c => { nd[c.id] = c; });
      setMarketData(nd);
      if (json.data.gold) setGoldData(json.data.gold);
      setLastUpdate(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setStatus('live');
      setErrorMsg('');
    } catch (e) {
      setStatus(prev => prev === 'live' ? 'live' : 'error');
      setErrorMsg(e.message);
    }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 60000); return () => clearInterval(t); }, []);

  const visibleCoins = COINS
    .filter(c => {
      const d = marketData[c.id];
      const q = search.toLowerCase();
      if (q && !c.symbol.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      if (filter === 'gainers' && (d?.change24h ?? 0) < 0) return false;
      if (filter === 'losers'  && (d?.change24h ?? 0) >= 0) return false;
      return true;
    })
    .sort((a, b) => {
      const da = marketData[a.id], db = marketData[b.id];
      if (!da || !db) return 0;
      if (sort === 'price')  return db.price - da.price;
      if (sort === 'change') return db.change24h - da.change24h;
      if (sort === 'mcap')   return db.marketCap - da.marketCap;
      return (da.rank || 99) - (db.rank || 99);
    });

  const totalMcap = Object.values(marketData).reduce((s, c) => s + (c.marketCap || 0), 0);
  const btcMcap   = marketData['bitcoin']?.marketCap;
  const btcDom    = btcMcap && totalMcap ? ((btcMcap / totalMcap) * 100).toFixed(1) : null;
  const dotColor  = status === 'live' ? '#00ff88' : status === 'error' ? '#ff3a5c' : '#ffd700';
  const hasData   = Object.keys(marketData).length > 0;
  const btn = active => ({ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: active ? '#050a0e' : '#4a7a96', background: active ? '#00d4ff' : 'transparent', border: `1px solid ${active ? '#00d4ff' : '#1a3040'}`, padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.08em', borderRadius: 2, transition: 'all 0.15s' });

  return (
    <div style={{ background: '#050a0e', minHeight: '100vh', backgroundImage: 'radial-gradient(ellipse at 15% 0%, rgba(0,212,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(0,255,136,0.03) 0%, transparent 50%)' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 998, background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)' }} />
      {showDonate && <DonationModal onClose={() => setShowDonate(false)} />}

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #0f2535', background: 'rgba(5,10,14,0.97)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '2rem', letterSpacing: '0.18em', lineHeight: 1 }}>
            <span style={{ color: '#00d4ff', textShadow: '0 0 24px rgba(0,212,255,0.6)' }}>WRAITH</span>
            <span style={{ color: '#00ff88', textShadow: '0 0 24px rgba(0,255,136,0.6)' }}>EX</span>
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', color: '#4a7a96', letterSpacing: '0.2em', marginTop: 1 }}>MOVE LIKE A WRAITH. LEAVE NO TRACE.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {totalMcap > 0 && (
            <div style={{ display: 'flex', gap: 20 }}>
              {[['TOTAL MCAP', formatLarge(totalMcap)], ['BTC DOM', btcDom ? btcDom + '%' : '—']].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.52rem', color: '#4a7a96', letterSpacing: '0.12em' }}>{l}</div>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.78rem', color: '#00d4ff' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowDonate(true)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#ff6600', background: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.35)', padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2, boxShadow: '0 0 10px rgba(255,102,0,0.15)', transition: 'all 0.2s' }}>🔒 DONATE XMR</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}`, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: dotColor, letterSpacing: '0.1em' }}>{status === 'live' ? 'LIVE' : status === 'error' ? 'ERROR' : 'LOADING'}</span>
          </div>
          {lastUpdate && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#4a7a96' }}>{lastUpdate}</span>}
        </div>
      </header>

      {/* Live Ticker */}
      <LiveTicker staticCoins={COINS} marketData={marketData} />

      <main style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Panel toggles */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setShowGold(p => !p)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: showGold ? '#ffd700' : '#4a7a96', background: showGold ? 'rgba(255,215,0,0.08)' : 'transparent', border: `1px solid ${showGold ? 'rgba(255,215,0,0.35)' : '#1a3040'}`, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2, transition: 'all 0.2s' }}>🥇 {showGold ? 'HIDE' : 'SHOW'} GOLD PANEL</button>
          <button onClick={() => setShowPrivacy(p => !p)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: showPrivacy ? '#ff6600' : '#4a7a96', background: showPrivacy ? 'rgba(255,102,0,0.08)' : 'transparent', border: `1px solid ${showPrivacy ? 'rgba(255,102,0,0.4)' : '#1a3040'}`, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2, transition: 'all 0.2s' }}>🔒 {showPrivacy ? 'HIDE' : 'SHOW'} PRIVACY PANEL</button>
        </div>

        {showGold    && <GoldPanel goldData={goldData} xmrData={marketData['monero']} />}
        {showPrivacy && <PrivacyPanel xmrData={marketData['monero']} />}

        {/* Search + Filter + Sort */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#4a7a96' }}>⌕</span>
            <input type="text" placeholder="SEARCH COIN..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', background: '#070d12', border: '1px solid #1a3040', borderRadius: 2, padding: '7px 10px 7px 28px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#c8e0ee', outline: 'none', letterSpacing: '0.1em' }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['ALL', 'all'], ['▲ GAINERS', 'gainers'], ['▼ LOSERS', 'losers']].map(([label, val]) => (
              <button key={val} onClick={() => setFilter(val)} style={btn(filter === val)}>{label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', alignSelf: 'center' }}>SORT:</span>
            {[['RANK', 'rank'], ['PRICE', 'price'], ['24H%', 'change'], ['MCAP', 'mcap']].map(([label, val]) => (
              <button key={val} onClick={() => setSort(val)} style={btn(sort === val)}>{label}</button>
            ))}
          </div>
          <button onClick={fetchData} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#00d4ff', background: 'transparent', border: '1px solid #0f2535', padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2, marginLeft: 'auto' }}>↻ REFRESH</button>
        </div>

        {hasData && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#4a7a96', marginBottom: 12, letterSpacing: '0.1em' }}>SHOWING {visibleCoins.length} OF {COINS.length} ASSETS{search && ` — QUERY: "${search.toUpperCase()}"`}</div>}

        {!hasData && status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 16 }}>
            <div style={{ width: 32, height: 32, border: '2px solid #1a3040', borderTopColor: '#00d4ff', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#4a7a96', letterSpacing: '0.2em' }}>FETCHING LIVE MARKET DATA...</span>
          </div>
        )}

        {!hasData && status === 'error' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.9rem', color: '#ff3a5c', marginBottom: 8 }}>⚠ FEED ERROR</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#4a7a96', marginBottom: 20 }}>{errorMsg}</div>
            <button onClick={fetchData} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#00d4ff', background: 'transparent', border: '1px solid #0f2535', padding: '8px 18px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2 }}>↻ RETRY</button>
          </div>
        )}

        {hasData && visibleCoins.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#4a7a96', letterSpacing: '0.15em' }}>NO COINS MATCH YOUR FILTER</div>}

        {hasData && visibleCoins.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {visibleCoins.map((coin, i) => (
              <CoinCard key={coin.id} coin={coin} data={marketData[coin.id]} prev={prevData[coin.id]} index={i} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid #0a1820', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#1e3a50', letterSpacing: '0.15em' }}>WRAITHEX // CRYPTO: COINGECKO // GOLD: METALS.LIVE // LIVE: BITFINEX // PRIVACY FIRST</div>
          <button onClick={() => setShowDonate(true)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: 'rgba(255,102,0,0.4)', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>🔒 SUPPORT WITH XMR</button>
        </div>
      </main>
    </div>
  );
}
