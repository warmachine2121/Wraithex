'use client';
import { useState } from 'react';

// Detect chain from address format
function detectChain(address) {
  const a = address.trim();
  if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(a) || /^bc1[a-z0-9]{6,87}$/.test(a)) return 'BTC';
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return 'ETH';
  if (/^T[a-zA-Z0-9]{33}$/.test(a)) return 'TRX';
  return null;
}

// Simulated exposure analysis — real version would call a block explorer API
// For now generates deterministic results from address string for demo
function analyseAddress(address, chain) {
  // Hash the address into a seed for deterministic fake-but-realistic results
  let seed = 0;
  for (let i = 0; i < address.length; i++) seed = (seed * 31 + address.charCodeAt(i)) & 0xffffffff;
  const s = Math.abs(seed);

  const txCount       = 10 + (s % 480);
  const uniqueAddrs   = Math.floor(txCount * (0.4 + (s % 100) / 200));
  const totalValueUSD = 1000 + (s % 2000000);
  const firstSeen     = `${2016 + (s % 8)}-${String(1 + (s % 12)).padStart(2,'0')}-${String(1 + (s % 28)).padStart(2,'0')}`;
  const exchangeTags  = ['Binance', 'Coinbase', 'Kraken', 'Bybit', 'OKX'];
  const taggedCount   = s % 4;
  const tagged        = exchangeTags.slice(0, taggedCount);
  const riskScore     = Math.min(Math.floor((txCount / 5) + (taggedCount * 15) + (uniqueAddrs / 3)), 100);

  return { txCount, uniqueAddrs, totalValueUSD, firstSeen, tagged, riskScore, chain };
}

function RiskMeter({ score }) {
  const color = score < 30 ? '#00ff88' : score < 60 ? '#ffd700' : score < 80 ? '#ff9500' : '#ff3a5c';
  const label = score < 30 ? 'LOW' : score < 60 ? 'MODERATE' : score < 80 ? 'HIGH' : 'CRITICAL';
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#4a7a96', letterSpacing: '0.12em' }}>EXPOSURE RISK</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color, letterSpacing: '0.1em' }}>{label} — {score}/100</span>
      </div>
      <div style={{ height: 6, background: '#0a1820', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, #00ff88, ${color})`, borderRadius: 3, boxShadow: `0 0 10px ${color}66`, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0a1820' }}>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#4a7a96', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: highlight || '#c8e0ee' }}>{value}</span>
    </div>
  );
}

export default function PrivacyScanner() {
  const [address, setAddress] = useState('');
  const [result,  setResult]  = useState(null);
  const [status,  setStatus]  = useState('idle'); // idle | scanning | done | error
  const [errMsg,  setErrMsg]  = useState('');

  const scan = () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    const chain = detectChain(trimmed);
    if (!chain) {
      setStatus('error');
      setErrMsg('Unrecognised address format. Supports BTC, ETH, TRX.');
      return;
    }
    setStatus('scanning');
    setResult(null);
    // Simulate async scan
    setTimeout(() => {
      const data = analyseAddress(trimmed, chain);
      setResult(data);
      setStatus('done');
    }, 1400);
  };

  const reset = () => { setAddress(''); setResult(null); setStatus('idle'); setErrMsg(''); };

  const formatUSD = n => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div style={{ background: '#070d12', border: '1px solid rgba(255,58,92,0.2)', borderRadius: 4, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(255,58,92,0.04), transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '2px solid rgba(255,58,92,0.4)', borderRight: '2px solid rgba(255,58,92,0.4)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '2px solid rgba(255,102,0,0.3)', borderLeft: '2px solid rgba(255,102,0,0.3)' }} />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: '1.4rem' }}>🔍</span>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1.6rem', letterSpacing: '0.1em', color: '#ff3a5c', textShadow: '0 0 20px rgba(255,58,92,0.4)' }}>PRIVACY LEAK SCANNER</span>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#4a7a96', letterSpacing: '0.15em' }}>
          PASTE A BTC / ETH / TRX ADDRESS — SEE EXACTLY HOW EXPOSED IT IS
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={address}
          onChange={e => { setAddress(e.target.value); setStatus('idle'); setErrMsg(''); }}
          onKeyDown={e => e.key === 'Enter' && scan()}
          placeholder="bc1q... or 0x... or T..."
          style={{ flex: 1, minWidth: 260, background: '#050a0e', border: '1px solid #1a3040', borderRadius: 2, padding: '10px 14px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#c8e0ee', outline: 'none', letterSpacing: '0.08em' }}
        />
        <button onClick={scan} disabled={status === 'scanning'} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#ff3a5c', background: 'rgba(255,58,92,0.08)', border: '1px solid rgba(255,58,92,0.35)', padding: '10px 20px', cursor: 'pointer', letterSpacing: '0.12em', borderRadius: 2, transition: 'all 0.2s' }}>
          {status === 'scanning' ? '⟳ SCANNING...' : '⌕ SCAN'}
        </button>
        {result && <button onClick={reset} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#4a7a96', background: 'transparent', border: '1px solid #1a3040', padding: '10px 14px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2 }}>✕ CLEAR</button>}
      </div>

      {/* Error */}
      {status === 'error' && (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#ff3a5c', padding: '8px 12px', background: 'rgba(255,58,92,0.05)', border: '1px solid rgba(255,58,92,0.2)', borderRadius: 2, marginBottom: 16 }}>
          ⚠ {errMsg}
        </div>
      )}

      {/* Scanning animation */}
      {status === 'scanning' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
          <div style={{ width: 20, height: 20, border: '2px solid #1a3040', borderTopColor: '#ff3a5c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#4a7a96', letterSpacing: '0.15em' }}>
            SCANNING BLOCKCHAIN... MAPPING EXPOSURE...
          </div>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Chain badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#050a0e', background: result.chain === 'BTC' ? '#f7931a' : result.chain === 'ETH' ? '#627eea' : '#eb0029', padding: '3px 10px', borderRadius: 2, letterSpacing: '0.1em' }}>
              {result.chain}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', letterSpacing: '0.1em' }}>
              {address.slice(0, 12)}...{address.slice(-6)}
            </div>
          </div>

          <RiskMeter score={result.riskScore} />

          {/* Stats grid */}
          <div style={{ marginBottom: 20 }}>
            <StatRow label="TRANSACTIONS VISIBLE" value={result.txCount.toLocaleString()} highlight="#ff3a5c" />
            <StatRow label="LINKED ADDRESSES" value={result.uniqueAddrs.toLocaleString()} highlight="#ff9500" />
            <StatRow label="TOTAL VALUE EXPOSED" value={formatUSD(result.totalValueUSD)} highlight="#ffd700" />
            <StatRow label="FIRST SEEN ON-CHAIN" value={result.firstSeen} />
            <StatRow
              label="EXCHANGE TAGS"
              value={result.tagged.length ? result.tagged.join(', ') : 'None detected'}
              highlight={result.tagged.length ? '#ff3a5c' : '#00ff88'}
            />
            <StatRow label="AMOUNT HIDDEN" value="$0.00" highlight="#ff3a5c" />
            <StatRow label="SENDER IDENTITY" value="FULLY VISIBLE" highlight="#ff3a5c" />
          </div>

          {/* XMR comparison */}
          <div style={{ background: 'rgba(255,102,0,0.06)', border: '1px solid rgba(255,102,0,0.2)', borderRadius: 3, padding: 16 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#ff6600', letterSpacing: '0.15em', marginBottom: 12 }}>
              🔒 THE SAME ACTIVITY IN MONERO (XMR)
            </div>
            <StatRow label="TRANSACTIONS VISIBLE" value="0" highlight="#00ff88" />
            <StatRow label="LINKED ADDRESSES" value="0" highlight="#00ff88" />
            <StatRow label="TOTAL VALUE EXPOSED" value="$0.00" highlight="#00ff88" />
            <StatRow label="SENDER IDENTITY" value="UNTRACEABLE" highlight="#00ff88" />
            <StatRow label="AMOUNT HIDDEN" value="100%" highlight="#00ff88" />
            <div style={{ marginTop: 12, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#ff6600', lineHeight: 1.6 }}>
              With XMR, none of the above data would exist on any public ledger. Ring signatures, stealth addresses, and RingCT make every transaction invisible by default.
            </div>
          </div>
        </div>
      )}

      {/* Idle hint */}
      {status === 'idle' && !result && (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#1e3a50', letterSpacing: '0.1em', lineHeight: 1.8 }}>
          SUPPORTS: Bitcoin (BTC) · Ethereum (ETH) · TRON (TRX)<br />
          SHOWS: Transaction count · Linked addresses · Value exposed · Exchange tags · Risk score<br />
          NOTE: Scan results are illustrative — connect a block explorer API for live data
        </div>
      )}
    </div>
  );
}
