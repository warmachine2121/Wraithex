# CRYPTEX 🔥
### Live Cryptocurrency Dashboard — Free, No API Key Required

Real-time crypto prices using the free CoinGecko API.  
**$0 cost** — no Anthropic API, no paid services, nothing.

---

## 🚀 Deploy Free in 5 Minutes

### Step 1 — Put the code on GitHub
1. Go to [github.com](https://github.com) → sign up free
2. Click **+** → **New repository** → name it `cryptex` → **Create**
3. Upload all files from this folder (drag & drop works)

### Step 2 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. Click **Add New Project** → import your `cryptex` repo
3. Click **Deploy** — no env variables needed! 🎉

Your site is live at `https://cryptex-yourname.vercel.app` in ~2 minutes.

### Optional: Custom Domain (~$10/yr)
- Buy at [namecheap.com](https://namecheap.com)
- In Vercel → your project → **Domains** → add it

---

## 💻 Run Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## 💰 Cost Breakdown

| Service     | Cost       |
|-------------|------------|
| CoinGecko   | FREE       |
| Vercel host | FREE       |
| Domain      | ~$10/yr (optional) |
| **Total**   | **$0**     |

The server caches prices for 60 seconds, so even with thousands of
visitors you only hit CoinGecko ~60 times per hour.

---

## 📁 Project Structure

```
cryptex/
├── app/
│   ├── layout.js            # Root layout + fonts
│   ├── page.js              # Home page
│   ├── globals.css          # Animations + global styles
│   └── api/prices/
│       └── route.js         # Server-side proxy + cache
├── components/
│   ├── Dashboard.js         # Main UI
│   ├── CoinCard.js          # Coin cards
│   └── Sparkline.js         # Mini charts
└── package.json
```

---

## ⚙️ Customize

**Add coins** — edit `COINS` array in `components/Dashboard.js`  
**Change refresh rate** — edit `setInterval(fetchData, 60000)` in Dashboard.js  
**Change colors:**
- Cyan: `#00d4ff`
- Green (up): `#00ff88`
- Red (down): `#ff3a5c`
- Background: `#050a0e`

---

## 🐦 Twitter Tips
- Screenshot the full dashboard for posts
- Best times: 8–10am EST or 6–8pm EST
- Tags: #crypto #bitcoin #BTC #cryptotrading #web3
