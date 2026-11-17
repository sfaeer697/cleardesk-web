# ClearDesk website

One-page landing site with live launch pricing, Polar checkout and public
installer downloads. Plain HTML/CSS/JS plus two Vercel Functions. No build step
and no dependencies.

This repository is **public**. The desktop app source lives in the private
`sfaeer697/cleardesk-app` repository. Installers are built there by GitHub
Actions and published to this repository's **Releases**, so buyers can download
without access to the source.

Working through the launch? Follow [`LAUNCH.md`](LAUNCH.md).

```
cleardesk-site/
├─ public/              The website (index.html, styles.css, site.js, thanks.html, img/)
│  ├─ robots.txt
│  └─ sitemap.xml
├─ api/
│  ├─ pricing.js        GET  /api/pricing  → live tier ladder (CDN-cached 30 s)
│  └─ checkout.js       POST /api/checkout → Polar checkout at today's price
├─ lib/
│  ├─ tiers.js          ← EDIT PRICES HERE (5 founding → 20 early → standard)
│  └─ polar.js          Polar API client (server-side only)
├─ vercel.json          Static output = public/, security headers
├─ package.json         No dependencies — nothing to npm install for the site
└─ .env.example         The environment variables
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
   * **Benefits → New Benefit → License Keys**: prefix `CLEARDESK`, activation
     limit **2**, no expiration.
3. Note the IDs from the dashboard or the API:
   * **Organization ID** — Settings → Organization. You need it for the app.
   * **Product ID** — in the product URL. The site and the app both use it.
   * **Benefit ID** — in the benefit URL. Optional but recommended for the app.
4. **Create an Organization Access Token** (OAT): Settings → Organization →
   Access Tokens. This is a secret; it goes only into Vercel.
5. While testing, either use the **sandbox** environment
   (https://sandbox.polar.sh, API `https://sandbox-api.polar.sh/v1`) or make a
   discounted test product in production.

Polar's licence endpoints used by the desktop app need **no token at all**, which
is why nothing secret ships inside ClearDesk:

```
POST https://api.polar.sh/v1/customer-portal/license-keys/activate
POST https://api.polar.sh/v1/customer-portal/license-keys/validate
POST https://api.polar.sh/v1/customer-portal/license-keys/deactivate
```

## Deploy to Vercel (with getcleardesk.online)

1. Push this repository to GitHub (`sfaeer697/cleardesk-web`, `main`).
2. Go to https://vercel.com → **Add New → Project** → import `cleardesk-web`.
   * Framework preset: **Other**. Leave the build command and install command empty.
   * Root directory: the repository root (where `vercel.json` is).
3. Add these under **Settings → Environment Variables** (Production and Preview):

| Variable | Value |
|---|---|
| `POLAR_ACCESS_TOKEN` | your Organization Access Token (secret) |
| `POLAR_ORGANIZATION_ID` | organization UUID |
| `POLAR_PRODUCT_ID` | product UUID |
| `SITE_URL` | `https://getcleardesk.online` (or the Vercel URL first) |
| `POLAR_ENVIRONMENT` | `sandbox` while testing, `production` for launch |

   Then click **Deployments → Redeploy** so the functions pick up the values.
4. **Custom domain:** Settings → Domains → add `getcleardesk.online` and
   `www.getcleardesk.online`. At your registrar, add the DNS records Vercel
   shows (usually an `A` record `@ → 76.76.21.21` and a `CNAME` record
   `www → cname.vercel-dns.com`). HTTPS is automatic.
5. Set `BUY_URL` in `cleardesk/src/app/core/models.ts` to
   `https://getcleardesk.online/#pricing` (already set).

Every `git push` to `main` redeploys automatically once the Vercel project is
connected.

### If the deployment returns 500 on every page

`X-Vercel-Error: FUNCTION_INVOCATION_FAILED` on `/` means Vercel is sending the
request to a serverless function that is failing at startup, not serving
`public/index.html`. Usually the project is stale or connected to the wrong
repository. Check, in order:

1. **Settings → General → Root Directory** is empty (repo root, where
   `vercel.json` is), and **Framework Preset** is **Other**.
2. **Build & Development Settings** has no build command and no install
   command. `vercel.json` already sets `outputDirectory` to `public`.
3. The project is connected to `sfaeer697/cleardesk-web` and the production
   deployment's commit is the latest `main`.
4. Add the environment variables, then **Deployments → Redeploy** (functions do
   not pick up new variables without a redeploy).
5. If the project has old rewrites or a stale build, create a fresh project from
   the same repository and move the domain to it.

## Test before launch

1. Open the site, check the ladder shows "5 of 5 left", and buy with Polar's
   test card `4242 4242 4242 4242` in sandbox mode.
2. Reload and check it shows "4 of 5 left". Paste the emailed key into the app
   and check it says Pro.
3. Refund the test order in Polar and check the seat comes back.
4. Switch `POLAR_ENVIRONMENT` to `production`, use production IDs and a
   production OAT, redeploy, then launch.

## Preview locally

```powershell
cd D:\Indie-Projects\cleardesk-v1\cleardesk-site
npx serve public          # design only: the pricing ladder uses the default (0 sold)
# with the real functions:
npm i -g vercel
vercel dev                # reads .env.local (copy it from .env.example)
```

## Things to decide before launch

These are placeholders in the copy. Change any of them:

* Prices $9 / $14 / $19 and the 5 / 20 seat counts (`lib/tiers.js` + `site.js` fallback)
* "Use it on 2 computers" (must match the activation limit on the Polar licence-key benefit)
* "14-day refund"
* "Made in Karachi" in the footer
* The support email (`support@getcleardesk.online`) if you use a different one
