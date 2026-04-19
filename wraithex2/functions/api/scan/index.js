// Cloudflare Pages Function — replaces Next.js /api/scan route

function detectChain(address) {
  const a = address.trim();
  if (/^(1|3)[a-zA-Z0-9]{24,33}$/.test(a) || /^bc1[a-zA-Z0-9]{6,87}$/.test(a)) return 'BTC';
  if (/^0x[a-fA-F0-9]{40}$/.test(a)) return 'ETH';
  if (/^T[a-zA-Z0-9]{33}$/.test(a)) return 'TRX';
  return null;
}

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
  const balanceBTC  = (received - spent) / 1e8;
  const linkedSet   = new Set();
  txs.slice(0, 25).forEach(tx => {
    tx.vin?.forEach(v  => { if (v.prevout?.scriptpubkey_address && v.prevout.scriptpubkey_address !== address) linkedSet.add(v.prevout.scriptpubkey_address); });
    tx.vout?.forEach(v => { if (v.scriptpubkey_address && v.scriptpubkey_address !== address) linkedSet.add(v.scriptpubkey_address); });
  });
  const firstTx   = txs.length ? txs[txs.length - 1] : null;
  const firstSeen = firstTx?.status?.block_time ? new Date(firstTx.status.block_time * 1000).toISOString().split('T')[0] : 'Unknown';
  return {
    chain: 'BTC', txCount, linkedAddrs: linkedSet.size,
    balance: balanceBTC, totalValue: received / 1e8, firstSeen,
    recentTxs: txs.slice(0, 5).map(tx => ({
      txid: tx.txid,
      value: (tx.vout?.reduce((s, v) => s + (v.value ?? 0), 0) ?? 0) / 1e8,
      time: tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString().split('T')[0] : 'Pending',
      confirmed: !!tx.status?.confirmed,
    })),
  };
}

async function scanETH(address, apiKey) {
  if (!apiKey) throw new Error('ETHERSCAN_API_KEY not set — add it to Cloudflare Pages environment variables');
  const base = 'https://api.etherscan.io/api';
  const [balRes, txRes] = await Promise.all([
    fetch(`${base}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`),
    fetch(`${base}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`),
  ]);
  if (!balRes.ok) throw new Error('ETH address lookup failed');
  const balData = await balRes.json();
  const txData  = txRes.ok ? await txRes.json() : { result: [] };
  const balanceETH = Number(BigInt(balData.result ?? '0')) / 1e18;
  const txs = Array.isArray(txData.result) ? txData.result : [];
  const linkedSet = new Set();
  txs.forEach(tx => {
    if (tx.from && tx.from.toLowerCase() !== address.toLowerCase()) linkedSet.add(tx.from);
    if (tx.to   && tx.to.toLowerCase()   !== address.toLowerCase()) linkedSet.add(tx.to);
  });
  const firstTx   = txs[0];
  const firstSeen = firstTx?.timeStamp ? new Date(parseInt(firstTx.timeStamp) * 1000).toISOString().split('T')[0] : 'Unknown';
  const totalReceived = txs.filter(tx => tx.to?.toLowerCase() === address.toLowerCase()).reduce((s, tx) => s + Number(tx.value) / 1e18, 0);
  return {
    chain: 'ETH', txCount: txs.length, linkedAddrs: linkedSet.size,
    balance: balanceETH, totalValue: totalReceived, firstSeen, tagged: [],
    recentTxs: txs.slice(-5).reverse().map(tx => ({
      txid: tx.hash, value: Number(tx.value) / 1e18,
      time: new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0],
      confirmed: tx.txreceipt_status === '1',
    })),
  };
}

async function scanTRX(address) {
  const [acctRes, txRes] = await Promise.all([
    fetch(`https://apilist.tronscanapi.com/api/accountv2?address=${address}`),
    fetch(`https://apilist.tronscanapi.com/api/transaction?address=${address}&limit=20&start=0`),
  ]);
  if (!acctRes.ok) throw new Error('TRX address not found');
  const acct   = await acctRes.json();
  const txData = txRes.ok ? await txRes.json() : { data: [] };
  const txs    = txData.data ?? [];
  const linkedSet = new Set();
  txs.forEach(tx => {
    const from = tx.contractData?.owner_address;
    const to   = tx.contractData?.to_address;
    if (from && from !== address) linkedSet.add(from);
    if (to   && to   !== address) linkedSet.add(to);
  });
  return {
    chain: 'TRX', txCount: acct.totalTransactionCount ?? 0, linkedAddrs: linkedSet.size,
    balance: (acct.balance ?? 0) / 1e6, totalValue: (acct.totalReceivedTrx ?? 0) / 1e6,
    firstSeen: acct.date_created ? new Date(acct.date_created).toISOString().split('T')[0] : 'Unknown',
    tagged: [],
    recentTxs: txs.slice(0, 5).map(tx => ({
      txid: tx.hash, value: (tx.contractData?.amount ?? 0) / 1e6,
      time: tx.timestamp ? new Date(tx.timestamp).toISOString().split('T')[0] : '—',
      confirmed: true,
    })),
  };
}

export async function onRequest(context) {
  const url     = new URL(context.request.url);
  const address = url.searchParams.get('address')?.trim();

  if (!address) {
    return new Response(JSON.stringify({ success: false, error: 'No address provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const chain = detectChain(address);
  if (!chain) {
    return new Response(JSON.stringify({ success: false, error: 'Unrecognised address format. Supports BTC, ETH, TRX.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    let data;
    const ethKey = context.env.ETHERSCAN_API_KEY;
    if (chain === 'BTC') data = await scanBTC(address);
    if (chain === 'ETH') data = await scanETH(address, ethKey);
    if (chain === 'TRX') data = await scanTRX(address);
    return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
