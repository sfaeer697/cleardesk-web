# ClearDesk website

One-page landing site with live launch pricing and Lemon Squeezy checkout.
Plain HTML/CSS/JS plus two Vercel Functions. There's no build step and no dependencies,
and the free Vercel Hobby plan is enough.

```
cleardesk-site/
├─ public/              The website (index.html, styles.css, site.js, thanks.html, img/)
├─ api/
│  ├─ pricing.js        GET  /api/pricing  → live tier ladder (CDN-cached 30 s)
│  └─ checkout.js       POST /api/checkout → Lemon Squeezy checkout at today's price
├─ lib/
│  ├─ tiers.js          ← EDIT PRICES HERE (5 founding → 20 early → standard)
│  └─ lemon.js          Lemon Squeezy API client (server-side only)
├─ vercel.json          Static output = public/, security headers
├─ package.json         No dependencies — nothing to npm install for the site
└─ .env.example         The 5 environment variables
```

## How the launch pricing works

| Tier | Buyers | Price (edit in `tiers.mjs`) |
|---|---|---|
| Founding | first 5 | $9 |
| Early | next 20 | $14 |
| Standard | everyone after | $19 |

1. The page calls `/api/pricing`. The function counts **paid, non-refunded**
   orders for your product in Lemon Squeezy and returns which tier is live and
   how many seats are left. The page fills in the ladder, the progress bars and
   every price on the page.
2. **Buy** calls `/api/checkout`. The function counts again (fresh, not cached),
   then creates a one-hour Lemon Squeezy checkout with `custom_price` set to the
   live tier. The price is decided on the server, so nobody can reuse an old
   cheap link after a tier sells out.
3. The checkout opens as a Lemon Squeezy overlay. After payment, Lemon Squeezy
   emails a **licence key** and redirects to `thanks.html`.
4. The buyer pastes the key into **ClearDesk → Settings → ClearDesk Pro**. The
   app activates it against the Lemon Squeezy License API (2 computers per key).

Refunds automatically drop out of the count, so a refunded Founding seat
becomes available again.

## Set up Lemon Squeezy (about 15 minutes)

1. **Create a store** at https://app.lemonsqueezy.com. Pakistan isn't on the
   payout list for every method, so check **Settings → Payouts** early. Wise or
   Payoneer usually work.
2. **Create the product** "ClearDesk Pro":
   * Pricing: single payment, **$19** (the standard price; checkouts override it per tier).
   * **Generate licence keys: on.** Activation limit **2**, never expires.
   * Optional: attach the installer as a downloadable file.
3. Note the IDs:
   * **Store ID**: Settings → Stores.
   * **Variant ID**: open the product → the variant's ⋯ menu → Copy ID.
   * **Product ID**: in the product URL. You need it for the app.
4. **API key**: Settings → API → create a key. Use a test-mode key while testing.
5. In the app, set `STORE_ID` and `PRODUCT_ID` in
   `cleardesk/src-tauri/src/license.rs` so keys from other products are rejected.

## Deploy to Vercel (with your own domain)

1. Put `cleardesk-site` on GitHub as its own repository.
2. Go to https://vercel.com → **Add New → Project** → import the repo.
   * Framework preset: **Other**. Leave the build command and install command empty.
   * Root directory: the repo root (where `vercel.json` is).
3. Add these under **Settings → Environment Variables** (Production and Preview):

| Variable | Value |
|---|---|
| `LEMONSQUEEZY_API_KEY` | your API key |
| `LEMONSQUEEZY_STORE_ID` | e.g. `12345` |
| `LEMONSQUEEZY_VARIANT_ID` | e.g. `67890` |
| `SITE_URL` | `https://yourdomain.com` |
| `LEMONSQUEEZY_TEST_MODE` | `true` while testing, delete for launch |

   Then click **Deployments → Redeploy** so the functions pick up the values.
4. **Custom domain:** Settings → Domains → add `yourdomain.com` and `www.yourdomain.com`.
   At your registrar, add the DNS records Vercel shows (usually an `A` record
   `@ → 76.76.21.21` and a `CNAME` record `www → cname.vercel-dns.com`). HTTPS is automatic.
5. Edit `public/site.js` → `CONFIG.downloads.windows` with the installer URL
   (GitHub Releases works well) and replace `[SUPPORT EMAIL]` in `index.html` and `site.js`.
6. In the app, set `BUY_URL` in `cleardesk/src/app/core/models.ts` to `https://yourdomain.com/#pricing`.

Every `git push` to `main` redeploys automatically.

## Test before launch

1. With test mode on, open the site, check the ladder shows "5 of 5 left", and
   buy with card `4242 4242 4242 4242`.
2. Reload and check it shows "4 of 5 left". Paste the emailed key into the app
   and check it says Pro.
3. Refund the test order in Lemon Squeezy and check the seat comes back.
4. Turn test mode off and launch.

## Preview locally

```powershell
cd D:\cleardesk-v1\cleardesk-site
npx serve public          # design only: the pricing ladder uses the default (0 sold)
# with the real functions:
npm i -g vercel
vercel dev                # reads .env.local (copy it from .env.example)
```

## Things to decide before launch

These are placeholders in the copy. Change any of them:

* Prices $9 / $14 / $19 and the 5 / 20 seat counts (`tiers.mjs` + `site.js` fallback)
* "Use it on 2 computers" (must match the activation limit in Lemon Squeezy)
* "14-day refund"
* "Made in Karachi" in the footer
* Your domain (`SITE_URL` in Vercel, `BUY_URL` in the app)
