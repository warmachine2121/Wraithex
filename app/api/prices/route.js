let cache     = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000;

// PAXG (pax-gold) is included here - it tracks gold price 1:1 per troy oz
const COIN_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'dogecoin', 'cardano', 'avalanche-2', 'chainlink', 'polkadot',
  'litecoin', 'shiba-inu', 'monero', 'pax-gold',
].join(',');

export async function GET() {
  const now = Date.now();

  if (cache && now - cacheTime < CACHE_TTL) {
    return Response.json({ success: true, data: cache, cached: true });
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&per_page=20&page=1&price_change_percentage=24h`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );

    if (!res.ok) throw new Error('CoinGecko fetch failed');

    const rawCoins = await res.json();

    // Separate PAXG out as gold data
    const paxg = rawCoins.find(c => c.id === 'pax-gold');
    const gold = paxg ? {
      price:     paxg.current_price,
      change24h: paxg.price_change_percentage_24h ?? 0,
      high24h:   paxg.high_24h,
      low24h:    paxg.low_24h,
      source:    'paxg',
    } : null;

    // All coins except PAXG for the main grid
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
