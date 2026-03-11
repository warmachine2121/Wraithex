let cache     = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000;

const COIN_IDS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'dogecoin', 'cardano', 'avalanche-2', 'chainlink', 'polkadot',
  'litecoin', 'shiba-inu', 'monero',
].join(',');

async function fetchGold() {
  // Source 1: frankfurter.app - XAU/USD (gold per troy oz)
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=XAU&to=USD',
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      // Strip any trailing currency label e.g. "5170.11USD" -> 5170.11
      const raw   = data?.rates?.USD;
      const price = raw != null ? parseFloat(String(raw).replace(/[^0-9.]/g, '')) : NaN;
      if (!isNaN(price) && price > 100) {
        return { price, change24h: 0, high24h: null, low24h: null, source: 'frankfurter' };
      }
    }
  } catch (_) {}

  // Source 2: metals.live
  try {
    const res = await fetch(
      'https://metals.live/api/v1/latest',
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      const entry = Array.isArray(data)
        ? data.find(m => m.metal?.toLowerCase() === 'gold' || m.name?.toLowerCase() === 'gold')
        : data.gold ?? data.XAU ?? null;
      if (entry) {
        const price = parseFloat(String(entry.price ?? entry.usd ?? '').replace(/[^0-9.]/g, ''));
        if (!isNaN(price) && price > 100) {
          return {
            price,
            change24h: entry.change_24h ?? entry.chg_24h ?? 0,
            high24h:   entry.high_24h ?? null,
            low24h:    entry.low_24h ?? null,
            source:    'metals.live',
          };
        }
      }
    }
  } catch (_) {}

  // Source 3: hardcoded fallback so panel never breaks
  return { price: 3300, change24h: 0, high24h: null, low24h: null, source: 'fallback' };
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cacheTime < CACHE_TTL) {
    return Response.json({ success: true, data: cache, cached: true });
  }

  try {
    const [cryptoRes, goldResult] = await Promise.allSettled([
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&per_page=20&page=1&price_change_percentage=24h`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
      ),
      fetchGold(),
    ]);

    if (cryptoRes.status !== 'fulfilled' || !cryptoRes.value.ok)
      throw new Error('CoinGecko fetch failed');

    const rawCoins = await cryptoRes.value.json();
    const coins = rawCoins.map(c => ({
      id:        c.id,
      rank:      c.market_cap_rank,
      price:     c.current_price,
      change24h: c.price_change_percentage_24h ?? 0,
      marketCap: c.market_cap,
      volume:    c.total_volume,
      high24h:   c.high_24h,
      low24h:    c.low_24h,
    }));

    const gold = goldResult.status === 'fulfilled' ? goldResult.value : null;

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
