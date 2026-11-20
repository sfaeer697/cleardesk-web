# ClearDesk website

One-page landing site with live launch pricing, Polar checkout and public
installer downloads. Plain HTML/CSS/JS plus two Cloudflare Pages Functions. No
build step and no runtime dependencies.

This repository is **public**. The desktop app source lives in the private
`sfaeer697/cleardesk-app` repository. Installers are built there by GitHub
Actions and published to this repository's **Releases**, so buyers can download
without access to the source.

Working through the launch? Follow [`LAUNCH.md`](LAUNCH.md).

```
cleardesk-site/
├─ public/              The website (index.html, styles.css, site.js, thanks.html, img/)
│  ├─ _headers          Security and cache headers (Cloudflare Pages)
│  ├─ robots.txt
│  └─ sitemap.xml
├─ functions/
│  └─ api/
│     ├─ pricing.js     GET  /api/pricing  → live tier ladder
│     └─ checkout.js    POST /api/checkout → Polar checkout at today's price
├─ api/                 Legacy Vercel shims — delete after the Cloudflare cutover
├─ lib/
│  ├─ tiers.js          ← EDIT PRICES HERE (5 founding → 20 early → standard)
│  └─ polar.js          Polar API client (server-side only)
├─ wrangler.toml        project name, compatibility date, output directory
├─ package.json         wrangler as the only dev dependency
└─ .dev.vars.example    Environment variables for local development
```

## Download links

`public/site.js` points to stable asset names in this repository's latest
release:

```
https://github.com/sfaeer697/cleardesk-web/releases/latest/download/ClearDesk-Windows-x64-Setup.exe
https://github.com/sfaeer697/cleardesk-web/releases/latest/download/ClearDesk-Windows-x64.msi
https://github.com/sfaeer697/cleardesk-web/releases/latest/download/ClearDesk-macOS-universal.dmg
```

The app's **Release installers** workflow creates the release and uploads those
names whenever a `v*` tag is pushed to `cleardesk-app`. Because the names never
change, the website never needs editing for a new version.

The Mac build is unsigned, so the site's FAQ explains the one-time Gatekeeper
step. Add Apple signing and notarization later to remove it. Windows SmartScreen
will warn until the installer is code-signed.

## How the launch pricing works

| Tier | Buyers | Price (edit in `lib/tiers.js`) |
|---|---|---|
| Founding | first 5 | $9 |
| Early | next 20 | $14 |
| Standard | everyone after | $19 |

1. The page calls `/api/pricing`. The function counts **paid, non-refunded**
   orders for your product in Polar and returns which tier is live and how many
   seats are left. The page fills in the ladder, the progress bars and every
   price on the page.
2. **Buy** calls `/api/checkout`. The function counts again (fresh, not cached),
   then creates a Polar checkout with an ad-hoc fixed price equal to the live
   tier. The price is decided on the server, so nobody can reuse an old cheap
   link after a tier sells out.
3. After payment, Polar emails a **licence key** and redirects to `thanks.html`.
4. The buyer pastes the key into **ClearDesk → Settings → ClearDesk Pro**. The
   app activates it against Polar's public customer-portal licence API
   (activation limit 2).

Refunds automatically drop out of the count (`status=paid` excludes refunded and
partially refunded orders), so a refunded Founding seat becomes available again.

## Set up Polar

1. **Create an organization** at https://polar.sh. Polar is the merchant of
   record, so it handles sales tax and payouts. Check **Settings → Payouts**
   before going live.
2. **Create the product** "ClearDesk Pro":
   * One-time purchase, base price **$19** (checkouts override it per tier).
   * Visibility **Hidden**, so Polar's own storefront cannot undercut your
     launch price.
   * **Benefits → New Benefit → License Keys**: prefix `CLEARDESK`, activation
     limit **2**, no expiration, **deactivation via Polar enabled**. Attach it
     to the product — without it, buyers get no key.
3. Note the IDs from the dashboard or the API:
   * **Organization ID** — Settings → Organization. You need it for the app.
   * **Product ID** — in the product URL. The site and the app both use it.
   * **Benefit ID** — in the benefit URL. Optional but recommended for the app.
4. **Create an Organization Access Token** (OAT) with only `orders:read` and
   `checkouts:write`. This is a secret; it goes only into Cloudflare.
5. Sandbox and production are separate environments
   (https://sandbox.polar.sh, API `https://sandbox-api.polar.sh/v1`). A sandbox
   token is rejected by the production API.

Polar's licence endpoints used by the desktop app need **no token at all**, which
is why nothing secret ships inside ClearDesk:

```
POST https://api.polar.sh/v1/customer-portal/license-keys/activate
POST https://api.polar.sh/v1/customer-portal/license-keys/validate
POST https://api.polar.sh/v1/customer-portal/license-keys/deactivate
```

## Deploy to Cloudflare Pages

1. Push this repository to GitHub (`sfaeer697/cleardesk-web`, `main`).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
   → select `cleardesk-web`.
3. Build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | **None** |
   | Build command | *(empty)* |
   | Build output directory | `public` |

   `functions/` is picked up automatically from the repository root, and
   `wrangler.toml` already records the output directory and compatibility date.
4. **Settings → Variables and Secrets** (add to both Production and Preview):

   | Variable | Value |
   |---|---|
   | `POLAR_ACCESS_TOKEN` | your OAT — click **Encrypt** so it is a secret |
   | `POLAR_ORGANIZATION_ID` | organization UUID |
   | `POLAR_PRODUCT_ID` | product UUID |
   | `SITE_URL` | `https://getcleardesk.site` |
   | `POLAR_ENVIRONMENT` | `production` (anything but `sandbox` uses `api.polar.sh`) |

5. **Deployments → Retry deployment** after changing a variable — Functions read
   bindings at deploy time.
6. **Custom domains → Set up a domain** → add `getcleardesk.site` and
   `www.getcleardesk.site`. If the domain is registered with Cloudflare, the DNS
   records are created for you; otherwise point the nameservers at Cloudflare.
   HTTPS is automatic.
7. **Email Routing** → add `support@getcleardesk.site` and forward it to your
   real inbox. Cloudflare verifies the destination address by email.

Every `git push` to `main` redeploys automatically once the Pages project is
connected.

### If `/api/pricing` returns 503 or the page shows `live: false`

1. **Settings → Variables and Secrets** has all three of `POLAR_ACCESS_TOKEN`,
   `POLAR_ORGANIZATION_ID`, `POLAR_PRODUCT_ID`, for the environment you are
   looking at (Production vs Preview).
2. The token has `orders:read`; without it Polar answers `403 insufficient_scope`.
3. The token matches the environment — a sandbox token fails on `api.polar.sh`.
4. You redeployed after adding the variables.

## Test before launch

1. Open the site, check the ladder shows "5 of 5 left", and buy with Polar's
   test card `4242 4242 4242 4242` (sandbox only; in production use a real card
   and refund it).
2. Reload and check it shows "4 of 5 left". Paste the emailed key into the app
   and check it says Pro.
3. Refund the test order in Polar and check the seat comes back.

## Preview locally

```powershell
cd D:\Indie-Projects\cleardesk-v1\cleardesk-site
npm install                 # installs wrangler
Copy-Item .dev.vars.example .dev.vars   # then paste the real token
npm run dev                 # http://localhost:8788, Functions included
```

Static-only preview without the Functions: `npm run preview` (the page falls
back to the hard-coded ladder).

## Things to decide before launch

These are placeholders in the copy. Change any of them:

* Prices $9 / $14 / $19 and the 5 / 20 seat counts (`lib/tiers.js` + `site.js` fallback)
* "Use it on 2 computers" (must match the activation limit on the Polar licence-key benefit)
* "14-day refund"
* "Made in Karachi" in the footer
* The support email (`support@getcleardesk.site`) if you use a different one
