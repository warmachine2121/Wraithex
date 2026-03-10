let cache     = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000;

const COIN_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'dogecoin', 'cardano', 'avalanche-2', 'chainlink', 'polkadot',
  'litecoin', 'shiba-inu', 'monero',
].join(',');

export async function GET() {
  const now = Date.now();

  if (cache && now - cacheTime < CACHE_TTL) {
    return Response.json({ success: true, data: cache, cached: true });
  }

  try {
    // Fetch crypto + gold in parallel
    const [cryptoRes, goldRes] = await Promise.allSettled([
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&per_page=20&page=1&price_change_percentage=24h`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
      ),
      fetch('https://metals.live/api/v1/latest', {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 },
      }),
    ]);

    // Crypto
    if (cryptoRes.status !== 'fulfilled' || !cryptoRes.value.ok)
      throw new Error('CoinGecko fetch failed');

    const rawCoins = await cryptoRes.value.json();
    const coins = rawCoins.map(c => ({
      id:         c.id,
      rank:       c.market_cap_rank,
      price:      c.current_price,
      change24h:  c.price_change_percentage_24h ?? 0,
      marketCap:  c.market_cap,
      volume:     c.total_volume,
      high24h:    c.high_24h,
      low24h:     c.low_24h,
    }));

    // Gold — graceful fallback if unavailable
    let gold = null;
    if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
      try {
        const goldData = await goldRes.value.json();
        // metals.live returns array of objects like [{ metal: 'gold', price: 1234.56, ... }]
        const goldEntry = Array.isArray(goldData)
          ? goldData.find(m => m.metal === 'gold' || m.name?.toLowerCase() === 'gold')
          : goldData.gold || goldData.XAU || null;

        if (goldEntry) {
          gold = {
            price:     goldEntry.price ?? goldEntry.usd ?? null,
            change24h: goldEntry.change_24h ?? goldEntry.chg_24h ?? 0,
            high24h:   goldEntry.high_24h ?? null,
            low24h:    goldEntry.low_24h ?? null,
          };
        }
      } catch (_) {}
    }

    const data = { coins, gold };
    cache     = data;
    cacheTime = now;

    return Response.json({
      success:   true,
      data,
      cached:    false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Price fetch error:', err.message);
    if (cache) {
      return Response.json({ success: true, data: cache, cached: true, stale: true });
    }
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
