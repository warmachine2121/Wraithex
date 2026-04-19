// Privacy Leak Scanner API
// BTC: mempool.space (free, no key)
// ETH: Etherscan (free, needs ETHERSCAN_API_KEY env var)
// TRX: Tronscan (free, no key)

// ⚠️ Add ETHERSCAN_API_KEY to your Vercel environment variables
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || '';

function detectChain(address) {
  const a = address.trim();
  if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(a) || /^bc1[a-zA-Z0-9]{6,87}$/.test(a)) return 'BTC';
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return 'ETH';
  if (/^T[a-zA-Z0-9]{33}$/.test(a)) return 'TRX';
  return null;
}

// ── BTC via mempool.space ──────────────────────────────────────────────
async function scanBTC(address) {
  const [addrRes, txRes] = await Promise.all([
    fetch(`https://mempool.space/api/address/${address}`),
    fetch(`https://mempool.space/api/address/${address}/txs`),
  ]);

  if (!addrRes.ok) throw new Error('BTC address not found');

  const addr = await addrRes.json();
  const txs  = txRes.ok ? await txRes.json() : [];

  const txCount     = (addr.chain_stats?.tx_count ?? 0) + (addr.mempool_stats?.tx_count ?? 0);
  const received    = (addr.chain_stats?.funded_txo_sum ?? 0) + (addr.mempool_stats?.funded_txo_sum ?? 0);
  const spent       = (addr.chain_stats?.spent_txo_sum  ?? 0) + (addr.mempool_stats?.spent_txo_sum  ?? 0);
  const balanceSats = received - spent;
  const balanceBTC  = balanceSats / 1e8;

  // Unique addresses this addr interacted with (from recent txs)
  const linkedSet = new Set();
  txs.slice(0, 25).forEach(tx => {
    tx.vin?.forEach(v  => { if (v.prevout?.scriptpubkey_address && v.prevout.scriptpubkey_address !== address) linkedSet.add(v.prevout.scriptpubkey_address); });
    tx.vout?.forEach(v => { if (v.scriptpubkey_address && v.scriptpubkey_address !== address) linkedSet.add(v.scriptpubkey_address); });
  });

  // First seen
  const firstTx   = txs.length ? txs[txs.length - 1] : null;
  const firstSeen = firstTx?.status?.block_time
    ? new Date(firstTx.status.block_time * 1000).toISOString().split('T')[0]
    : 'Unknown';

  // Total value that passed through (received)
  const totalValueBTC = received / 1e8;

  return {
    chain:        'BTC',
    txCount,
    linkedAddrs:  linkedSet.size,
    balance:      balanceBTC,
    totalValue:   totalValueBTC,
    firstSeen,
    recentTxs:    txs.slice(0, 5).map(tx => ({
      txid:    tx.txid,
      value:   (tx.vout?.reduce((s, v) => s + (v.value ?? 0), 0) ?? 0) / 1e8,
      time:    tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString().split('T')[0] : 'Pending',
      confirmed: !!tx.status?.confirmed,
    })),
  };
}

// ── ETH via Etherscan ──────────────────────────────────────────────────
async function scanETH(address) {
  if (!ETHERSCAN_KEY) throw new Error('ETHERSCAN_API_KEY not set — add it to Vercel environment variables');

  const base = 'https://api.etherscan.io/api';

  const [balRes, txRes, tokenRes] = await Promise.all([
    fetch(`${base}?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_KEY}`),
    fetch(`${base}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_KEY}`),
    fetch(`${base}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ETHERSCAN_KEY}`),
  ]);

  if (!balRes.ok) throw new Error('ETH address lookup failed');

  const balData   = await balRes.json();
  const txData    = txRes.ok  ? await txRes.json()   : { result: [] };
  const tokenData = tokenRes.ok ? await tokenRes.json() : { result: [] };

  if (balData.status === '0' && balData.message?.includes('Invalid')) throw new Error('Invalid ETH address');

  const balanceWei = BigInt(balData.result ?? '0');
  const balanceETH = Number(balanceWei) / 1e18;

  const txs = Array.isArray(txData.result) ? txData.result : [];
  const txCount = txs.length;

  // Unique addresses interacted with
  const linkedSet = new Set();
  txs.forEach(tx => {
    if (tx.from && tx.from.toLowerCase() !== address.toLowerCase()) linkedSet.add(tx.from);
    if (tx.to   && tx.to.toLowerCase()   !== address.toLowerCase()) linkedSet.add(tx.to);
  });

  const firstTx   = txs[0];
  const firstSeen = firstTx?.timeStamp
    ? new Date(parseInt(firstTx.timeStamp) * 1000).toISOString().split('T')[0]
    : 'Unknown';

  // Total ETH received
  const totalReceived = txs
    .filter(tx => tx.to?.toLowerCase() === address.toLowerCase())
    .reduce((s, tx) => s + Number(tx.value) / 1e18, 0);

  // Token types
  const tokens = [...new Set((Array.isArray(tokenData.result) ? tokenData.result : []).map(t => t.tokenSymbol))].slice(0, 8);

  // Known exchange addresses (simplified)
  const KNOWN_EXCHANGES = {
    '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance',
    '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': 'Coinbase',
    '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase',
    '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
    '0x0d0707963952f2fba59dd06f2b425ace40b492fe': 'Gate.io',
  };
  const tagged = [...new Set(
    txs.flatMap(tx => [
      KNOWN_EXCHANGES[tx.from?.toLowerCase()],
      KNOWN_EXCHANGES[tx.to?.toLowerCase()],
    ]).filter(Boolean)
  )];

  return {
    chain:       'ETH',
    txCount,
    linkedAddrs: linkedSet.size,
    balance:     balanceETH,
    totalValue:  totalReceived,
    firstSeen,
    tokens,
    tagged,
    recentTxs: txs.slice(-5).reverse().map(tx => ({
      txid:      tx.hash,
      value:     Number(tx.value) / 1e18,
      time:      new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0],
      confirmed: tx.txreceipt_status === '1',
    })),
  };
}

// ── TRX via Tronscan ───────────────────────────────────────────────────
async function scanTRX(address) {
  const [acctRes, txRes] = await Promise.all([
    fetch(`https://apilist.tronscanapi.com/api/accountv2?address=${address}`),
    fetch(`https://apilist.tronscanapi.com/api/transaction?address=${address}&limit=20&start=0`),
  ]);

  if (!acctRes.ok) throw new Error('TRX address not found');

  const acct = await acctRes.json();
  const txData = txRes.ok ? await txRes.json() : { data: [] };

  const balanceTRX = (acct.balance ?? 0) / 1e6;
  const txCount    = acct.totalTransactionCount ?? 0;
  const firstSeen  = acct.date_created
    ? new Date(acct.date_created).toISOString().split('T')[0]
    : 'Unknown';

  const txs = txData.data ?? [];
  const linkedSet = new Set();
  txs.forEach(tx => {
    const from = tx.contractData?.owner_address;
    const to   = tx.contractData?.to_address;
    if (from && from !== address) linkedSet.add(from);
    if (to   && to   !== address) linkedSet.add(to);
  });

  return {
    chain:       'TRX',
    txCount,
    linkedAddrs: linkedSet.size,
    balance:     balanceTRX,
    totalValue:  (acct.totalReceivedTrx ?? 0) / 1e6,
    firstSeen,
    tagged:      [],
    recentTxs: txs.slice(0, 5).map(tx => ({
      txid:      tx.hash,
      value:     (tx.contractData?.amount ?? 0) / 1e6,
      time:      tx.timestamp ? new Date(tx.timestamp).toISOString().split('T')[0] : '—',
      confirmed: true,
    })),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address')?.trim();

  if (!address) {
    return Response.json({ success: false, error: 'No address provided' }, { status: 400 });
  }

  const chain = detectChain(address);
  if (!chain) {
    return Response.json({ success: false, error: 'Unrecognised address format. Supports BTC, ETH, TRX.' }, { status: 400 });
  }

  try {
    let data;
    if (chain === 'BTC') data = await scanBTC(address);
    if (chain === 'ETH') data = await scanETH(address);
    if (chain === 'TRX') data = await scanTRX(address);
    return Response.json({ success: true, data });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
