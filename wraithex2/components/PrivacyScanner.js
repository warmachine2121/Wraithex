'use client';
import { useState } from 'react';

function detectChain(address) {
  const a = address.trim();
  if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(a) || /^bc1[a-zA-Z0-9]{6,87}$/.test(a)) return 'BTC';
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return 'ETH';
  if (/^T[a-zA-Z0-9]{33}$/.test(a)) return 'TRX';
  return null;
}

function riskScore(data) {
  let score = 0;
  score += Math.min(data.txCount / 5, 30);            // up to 30pts for tx volume
  score += Math.min(data.linkedAddrs / 2, 25);         // up to 25pts for linked addrs
  score += Math.min(data.totalValue * 0.001, 20);      // up to 20pts for value
  score += (data.tagged?.length ?? 0) * 10;            // 10pts per exchange tag
  score += data.tokens?.length ? 5 : 0;               // 5pts for token activity
  return Math.min(Math.round(score), 100);
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
        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, #00ff8855, ${color})`, borderRadius: 3, boxShadow: `0 0 10px ${color}66`, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight, mono = true }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #0a1820', gap: 12 }}>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#4a7a96', letterSpacing: '0.08em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: highlight || '#c8e0ee', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function RecentTxs({ txs, chain }) {
  if (!txs?.length) return null;
  const explorer = chain === 'BTC' ? 'https://mempool.space/tx/'
                 : chain === 'ETH' ? 'https://etherscan.io/tx/'
                 : 'https://tronscan.org/#/transaction/';
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#4a7a96', letterSpacing: '0.12em', marginBottom: 8 }}>RECENT TRANSACTIONS</div>
      {txs.map((tx, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #080f15', gap: 8, flexWrap: 'wrap' }}>
          <a href={`${explorer}${tx.txid}`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#00d4ff', textDecoration: 'none', letterSpacing: '0.04em' }}>
            {tx.txid.slice(0, 16)}...
          </a>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#c8e0ee' }}>
              {tx.value.toFixed(4)} {chain}
            </span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96' }}>{tx.time}</span>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: tx.confirmed ? '#00ff88' : '#ffd700' }}>
              {tx.confirmed ? '✓' : '⏳'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const EXAMPLE_ADDRS = {
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  ETH: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  TRX: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
};

export default function PrivacyScanner() {
  const [address, setAddress] = useState('');
  const [result,  setResult]  = useState(null);
  const [status,  setStatus]  = useState('idle');
  const [errMsg,  setErrMsg]  = useState('');

  const scan = async () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    const chain = detectChain(trimmed);
    if (!chain) {
      setStatus('error');
      setErrMsg('Unrecognised address format. Supports BTC (bc1/1/3), ETH (0x), TRX (T).');
      return;
    }
    setStatus('scanning');
    setResult(null);
    setErrMsg('');
    try {
      const res  = await fetch(`/api/scan?address=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json.data);
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setErrMsg(e.message);
    }
  };

  const reset = () => { setAddress(''); setResult(null); setStatus('idle'); setErrMsg(''); };
  const fmt   = n => typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '—';
  const fmtUSD = n => '$' + (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const risk  = result ? riskScore(result) : 0;
  const chainColor = result?.chain === 'BTC' ? '#f7931a' : result?.chain === 'ETH' ? '#627eea' : '#eb0029';

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
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.5rem', color: '#00ff88', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', padding: '2px 6px', borderRadius: 2, letterSpacing: '0.1em' }}>LIVE</span>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#4a7a96', letterSpacing: '0.15em' }}>
          PASTE A BTC / ETH / TRX ADDRESS — REAL ON-CHAIN EXPOSURE ANALYSIS
        </div>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          value={address}
          onChange={e => { setAddress(e.target.value); if (status !== 'idle') { setStatus('idle'); setErrMsg(''); } }}
          onKeyDown={e => e.key === 'Enter' && scan()}
          placeholder="bc1q...  or  0x...  or  T..."
          style={{ flex: 1, minWidth: 260, background: '#050a0e', border: '1px solid #1a3040', borderRadius: 2, padding: '10px 14px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem', color: '#c8e0ee', outline: 'none', letterSpacing: '0.06em' }}
        />
        <button onClick={scan} disabled={status === 'scanning'} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#ff3a5c', background: 'rgba(255,58,92,0.08)', border: '1px solid rgba(255,58,92,0.35)', padding: '10px 20px', cursor: status === 'scanning' ? 'not-allowed' : 'pointer', letterSpacing: '0.12em', borderRadius: 2, transition: 'all 0.2s', opacity: status === 'scanning' ? 0.6 : 1 }}>
          {status === 'scanning' ? '⟳ SCANNING...' : '⌕ SCAN'}
        </button>
        {result && <button onClick={reset} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#4a7a96', background: 'transparent', border: '1px solid #1a3040', padding: '10px 14px', cursor: 'pointer', letterSpacing: '0.1em', borderRadius: 2 }}>✕</button>}
      </div>

      {/* Example addresses */}
      {status === 'idle' && !result && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', alignSelf: 'center' }}>TRY:</span>
          {Object.entries(EXAMPLE_ADDRS).map(([chain, addr]) => (
            <button key={chain} onClick={() => setAddress(addr)} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#00d4ff', background: 'transparent', border: '1px solid #0f2535', padding: '3px 8px', cursor: 'pointer', letterSpacing: '0.08em', borderRadius: 2 }}>
              {chain} EXAMPLE
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#ff3a5c', padding: '10px 14px', background: 'rgba(255,58,92,0.05)', border: '1px solid rgba(255,58,92,0.2)', borderRadius: 2, marginBottom: 16, lineHeight: 1.6 }}>
          ⚠ {errMsg}
          {errMsg.includes('ETHERSCAN_API_KEY') && (
            <div style={{ marginTop: 8, color: '#ffd700' }}>
              → Get a free key at etherscan.io/apis → Add to Vercel: Settings → Environment Variables → ETHERSCAN_API_KEY
            </div>
          )}
        </div>
      )}

      {/* Scanning */}
      {status === 'scanning' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '24px 0' }}>
          <div style={{ width: 20, height: 20, border: '2px solid #1a3040', borderTopColor: '#ff3a5c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: '#ff3a5c', letterSpacing: '0.15em', marginBottom: 4 }}>SCANNING BLOCKCHAIN...</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96', letterSpacing: '0.1em' }}>QUERYING LIVE BLOCK EXPLORER DATA</div>
          </div>
        </div>
      )}

      {/* Results */}
      {status === 'done' && result && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>

          {/* Chain + address badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: '#050a0e', background: chainColor, padding: '3px 10px', borderRadius: 2, letterSpacing: '0.1em', fontWeight: 'bold' }}>
              {result.chain}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.55rem', color: '#4a7a96' }}>
              {address.slice(0, 16)}...{address.slice(-8)}
            </div>
          </div>

          <RiskMeter score={risk} />

          {/* On-chain exposure */}
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#ff3a5c', letterSpacing: '0.15em', marginBottom: 10 }}>⚠ ON-CHAIN EXPOSURE</div>
          <div style={{ marginBottom: 20 }}>
            <StatRow label="TRANSACTIONS VISIBLE"  value={fmt(result.txCount)}     highlight="#ff3a5c" />
            <StatRow label="LINKED ADDRESSES"       value={fmt(result.linkedAddrs)} highlight="#ff9500" />
            <StatRow label="CURRENT BALANCE"        value={`${result.balance?.toFixed(6)} ${result.chain}`} highlight="#ffd700" />
            <StatRow label="TOTAL VALUE PASSED"     value={`${result.totalValue?.toFixed(4)} ${result.chain}`} highlight="#ffd700" />
            <StatRow label="FIRST SEEN ON-CHAIN"    value={result.firstSeen} />
            {result.tagged?.length > 0 && (
              <StatRow label="EXCHANGE TAGS" value={result.tagged.join(', ')} highlight="#ff3a5c" />
            )}
            {result.tokens?.length > 0 && (
              <StatRow label="TOKEN ACTIVITY" value={result.tokens.join(', ')} highlight="#ff9500" />
            )}
            <StatRow label="SENDER IDENTITY"   value="FULLY VISIBLE ON-CHAIN"   highlight="#ff3a5c" />
            <StatRow label="AMOUNT HIDDEN"      value="$0.00 — EVERYTHING PUBLIC" highlight="#ff3a5c" />
          </div>

          {/* Recent txs */}
          <RecentTxs txs={result.recentTxs} chain={result.chain} />

          {/* XMR comparison */}
          <div style={{ background: 'rgba(255,102,0,0.06)', border: '1px solid rgba(255,102,0,0.2)', borderRadius: 3, padding: 16 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#ff6600', letterSpacing: '0.15em', marginBottom: 12 }}>
              🔒 THE SAME ACTIVITY IN MONERO (XMR)
            </div>
            <StatRow label="TRANSACTIONS VISIBLE" value="0"            highlight="#00ff88" />
            <StatRow label="LINKED ADDRESSES"     value="0"            highlight="#00ff88" />
            <StatRow label="BALANCE VISIBLE"      value="$0.00"        highlight="#00ff88" />
            <StatRow label="TOTAL VALUE EXPOSED"  value="$0.00"        highlight="#00ff88" />
            <StatRow label="SENDER IDENTITY"      value="UNTRACEABLE"  highlight="#00ff88" />
            <StatRow label="AMOUNT HIDDEN"        value="100% — ALWAYS" highlight="#00ff88" />
            <div style={{ marginTop: 12, padding: '10px 0', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: '#ff9944', lineHeight: 1.7 }}>
              With XMR, none of the above data would exist on any public ledger.<br />
              Ring signatures hide the sender. Stealth addresses hide the receiver.<br />
              RingCT hides every transaction amount. Every time. By default.
            </div>
          </div>
        </div>
      )}

      {/* Idle info */}
      {status === 'idle' && !result && (
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: '#1e3a50', letterSpacing: '0.08em', lineHeight: 1.9, marginTop: 8 }}>
          LIVE DATA SOURCES: BTC via mempool.space · ETH via Etherscan · TRX via Tronscan<br />
          SHOWS: Tx count · Linked addresses · Balance · Exchange tags · Risk score · Recent transactions
        </div>
      )}
    </div>
  );
}
