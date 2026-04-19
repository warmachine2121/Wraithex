let cache     = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000;

const COIN_IDS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'ripple', 'usd-coin', 'staked-ether', 'dogecoin', 'tron',
  'cardano', 'wrapped-bitcoin', 'avalanche-2', 'shiba-inu', 'chainlink',
  'polkadot', 'bitcoin-cash', 'leo-token', 'litecoin', 'near',
  'uniswap', 'wrapped-steth', 'kaspa', 'internet-computer', 'ethereum-classic',
  'monero', 'aptos', 'stellar', 'okb', 'aave',
  'crypto-com-chain', 'mantle', 'render-token', 'filecoin', 'cosmos',
  'hedera-hashgraph', 'arbitrum', 'vechain', 'immutable-x', 'optimism',
  'the-graph', 'algorand', 'thorchain', 'fantom', 'sei-network',
  'injective-protocol', 'sui', 'pepe', 'bonk', 'wormhole',
  'pax-gold',
].join(',');

export async function GET() {
  const now = Date.now();

  if (cache && now - cacheTime < CACHE_TTL) {
    return Response.json({ success: true, data: cache, cached: true });
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&per_page=60&page=1&price_change_percentage=24h`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );

    if (!res.ok) throw new Error('CoinGecko fetch failed');

    const rawCoins = await res.json();

    const paxg = rawCoins.find(c => c.id === 'pax-gold');
    const gold = paxg ? {
      price:     paxg.current_price,
      change24h: paxg.price_change_percentage_24h ?? 0,
      high24h:   paxg.high_24h,
      low24h:    paxg.low_24h,
      source:    'paxg',
    } : null;

    const coins = rawCoins
      .filter(c => c.id !== 'pax-gold')
      .map(c => ({
        id:        c.id,
        rank:      c.market_cap_rank,
        price:     c.current_price,
        change24h: c.price_change_percentage_24h ?? 0,
        marketCap: c.market_cap,
        volume:    c.total_volume,
        high24h:   c.high_24h,
        low24h:    c.low_24h,
      }));

    const data = { coins, gold };
    cache     = data;
    cacheTime = now;

    return Response.json({ success: true, data, cached: false, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Price fetch error:', err.message);
    if (cache) {
      return Response.json({ success: true, data: cache, cached: true, stale: true });
    }
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
