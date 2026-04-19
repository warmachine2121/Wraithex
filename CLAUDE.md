# WRAITHEX — Claude Handoff Document

> Move like a wraith. Leave no trace.

This document gives Claude full context on the WRAITHEX project so any new session can pick up exactly where we left off.

---

## What Is WRAITHEX

A live cryptocurrency market dashboard built privacy-first. Free to run, $0 cost, zero trackers. The core identity is Monero (XMR) as the gold standard of financial privacy — every feature reinforces this narrative.

**Live at:** `wraithex.vercel.app` (pending custom domain `wraithex.xyz`)  
**GitHub repo:** `wraithex`  
**Stack:** Next.js 14, Vercel (free), CoinGecko free API, Bitfinex WebSocket, Etherscan free API

---

## File Structure

```
wraithex2/
├── app/
│   ├── layout.js              # Meta tags, Google Fonts, SEO
│   ├── page.js                # Entry point — renders <Dashboard />
│   ├── globals.css            # Animations: ticker, fadeIn, pulse, spin
│   └── api/
│       ├── prices/
│       │   └── route.js       # Server-side price fetch (crypto + gold)
│       └── scan/
│           └── route.js       # Privacy Leak Scanner API (BTC/ETH/TRX)
└── components/
    ├── Dashboard.js           # Main UI — all panels, state, layout
    ├── CoinCard.js            # Individual coin card + intensity bar
    ├── Sparkline.js           # Normalised % sparkline with intensity colour
    ├── LiveTicker.js          # Bitfinex WebSocket real-time BTC + XMR ticker
    └── PrivacyScanner.js      # Privacy Leak Scanner UI component
```

---

## Design System

### Colours
```
Background:     #050a0e
Panel bg:       #070d12
Cyan accent:    #00d4ff
Green:          #00ff88
Red:            #ff3a5c
XMR orange:     #ff6600
Gold:           #ffd700
Text primary:   #c8e0ee
Text muted:     #4a7a96
Border:         #0f2535 / #1a3040
```

### Fonts (Google Fonts)
- `Bebas Neue` — headers, symbols, large numbers
- `Share Tech Mono` — all data, labels, terminal text
- `Rajdhani` — body (rarely used directly)

### Visual Style
- Dark terminal / cyberpunk aesthetic
- Scanline overlay (CSS repeating-linear-gradient fixed overlay)
- Corner accents on panels (CSS absolute positioned borders)
- Radial gradient glows on panels
- Price flash animations (green/red on price change)

---

## Data Sources

| Data | Source | Key needed |
|------|--------|-----------|
| Crypto prices (50 coins) | CoinGecko free API | No |
| Gold price | PAXG via CoinGecko (pax-gold coin ID) | No |
| BTC/XMR live ticker | Bitfinex WebSocket `wss://api-pub.bitfinex.com/ws/2` | No |
| BTC address scan | mempool.space API | No |
| ETH address scan | Etherscan API | Yes — `ETHERSCAN_API_KEY` |
| TRX address scan | Tronscan API | No |

### Environment Variables (Vercel)
```
ETHERSCAN_API_KEY=your_key_here
```
Get free key at: etherscan.io/apis

---

## Coin List (50 coins)

Full list in `Dashboard.js` COINS array and `route.js` COIN_IDS. Includes:
BTC, ETH, USDT, BNB, SOL, XRP, USDC, stETH, DOGE, TRX, ADA, WBTC, AVAX, SHIB, LINK, DOT, BCH, LEO, LTC, NEAR, UNI, wstETH, KAS, ICP, ETC, **XMR**, APT, XLM, OKB, AAVE, CRO, MNT, RENDER, FIL, ATOM, HBAR, ARB, VET, IMX, OP, GRT, ALGO, RUNE, FTM, SEI, INJ, SUI, PEPE, BONK, W

XMR is always highlighted in orange (#ff6600) throughout the UI.

---

## Features Built

### Live Price Dashboard
- 50 coins via CoinGecko (60s server-side cache)
- Search by name/symbol
- Filter: All / Gainers / Losers
- Sort: Rank / Price / 24H% / Market Cap
- Auto-refresh every 60 seconds
- Total market cap + BTC dominance in header

### Coin Cards
- Price flash animation (green/red) on every data refresh
- 24H % change badge
- Intensity bar — fills based on move size, labels: FLAT/LOW/MED/HIGH/EXTREME
- Normalised sparkline — all coins on same % axis, colour intensity based on magnitude
- Market cap, 24H high/low stats
- Ghost Mode variant — stripped terminal style

### Live Ticker (Bitfinex WebSocket)
- Real-time BTC and XMR prices tick on every trade
- Green/red flash on price direction change
- Auto-reconnects on disconnect
- Scrolling ticker bar below for all 50 coins (60s refresh)
- Footer label: `VIA BITFINEX // INDEPENDENT // NO KYC`

### Gold vs Crypto Panel
- Live gold price via PAXG (pax-gold CoinGecko ID)
- Two tabs: PRICE and PRIVACY
- PRICE tab: gold vs XMR live prices, portability/divisibility/verifiability/history comparison
- PRIVACY tab: gold vs XMR scored across 5 features with progress bars
- Tagline: "Gold you can carry in your head"

### Privacy Comparison Panel
- XMR vs BTC, ETH, ZEC across 5 technical privacy features
- Interactive — select up to 3 coins to compare
- Progress bars with colour-coded scores
- Overall % score per coin
- Live XMR price shown in panel header

### Privacy Leak Scanner
- Paste any BTC, ETH, or TRX address
- Live blockchain data: tx count, linked addresses, balance, total value, exchange tags, risk score
- Clickable recent transactions linking to block explorer
- Side-by-side XMR comparison showing everything as zero
- Risk score 0–100 with colour-coded meter
- Example addresses provided for demo
- BTC and TRX work immediately, ETH needs ETHERSCAN_API_KEY env var

### Ghost Mode
- Toggle turns site black, pure terminal green
- Coin grid goes dense (minmax 160px vs 240px)
- Coin cards stripped to minimal terminal layout
- Screenshot aesthetic

### XMR Donation Button
- Header button + footer link
- Modal with copy-to-clipboard wallet address
- Wallet address: replace `YOUR_XMR_WALLET_ADDRESS_HERE` in `Dashboard.js` line ~12

---

## Key Variables to Update

In `components/Dashboard.js`:
```js
// Line ~12
const XMR_ADDRESS = 'YOUR_XMR_WALLET_ADDRESS_HERE';
```

---

## Deployment

1. Push to GitHub repo named `wraithex`
2. Import to Vercel — no root directory setting needed
3. Add env var: `ETHERSCAN_API_KEY`
4. Deploy — auto-deploys on every push

### Custom Domain
- Buy `wraithex.xyz` on Namecheap (~$3/yr)
- Add in Vercel: Settings → Domains → Add `wraithex.xyz`

---

## Brand

- **Name:** WRAITHEX
- **Tagline:** Move like a wraith. Leave no trace.
- **Identity:** Privacy-first crypto dashboard. XMR is the hero coin.
- **Tone:** Terminal, serious, anti-surveillance
- **Twitter strategy:** #buildinpublic, tag @monero @coingecko @vercel
- **Best hook:** "BTC scores 7/50 privacy. XMR scores 50/50."

---

## Planned / Next Features (discussed but not built yet)

- **Wraith Score** — single 0-100 privacy/decentralisation score on every coin card
- **Surveillance Index** — live counter of transparent chain volume vs private chain volume today
- **XMR vs Inflation** — XMR price vs USD purchasing power since 2014
- **Fear & Greed Index** — free API, single number, high screenshot value
- **Top 100 coins** — expand from 50
- **Price Alerts** — browser notifications, no backend needed
- **Monero Network Stats** — live XMR hashrate, ring size, tx count
- **Portfolio Tracker** — daily return driver, premium XMR paywall candidate

---

## Monetisation Plan

1. XMR donation button (built)
2. Privacy guides as PDFs — sold for XMR
3. Custom dashboard builds for clients — paid in XMR
4. Privacy consulting — per hour in XMR
5. Sponsored privacy panel (Monero/Zcash projects)
6. WRAITHEX Pro — price alerts, portfolio tracker, paid in XMR
7. Newsletter with XMR sponsorships

---

## Tech Notes

- `route.js` uses in-memory caching (60s TTL) — resets on Vercel cold starts
- Bitfinex WebSocket runs client-side, auto-reconnects every 3s on drop
- PAXG is fetched in the same CoinGecko call as all other coins, filtered out server-side for gold panel
- `per_page=60` in CoinGecko call to ensure all 51 IDs return (50 coins + PAXG)
- Sparklines are seeded pseudo-random (deterministic per coin) — not real historical data
- Privacy Scanner ETH exchange detection uses a small hardcoded map of known exchange addresses

---

## Session History Summary

Built from scratch across multiple sessions:
1. Basic crypto ticker with CoinGecko
2. Rebranded CRYPTEX → WRAITHEX
3. Added XMR privacy comparison panel
4. Added Bitfinex WebSocket live ticker (BTC + XMR)
5. Added Gold vs Crypto panel with PAXG price
6. Expanded to top 50 coins
7. Built normalised sparklines with intensity colouring
8. Built Privacy Leak Scanner (live blockchain data)
9. Built Ghost Mode

