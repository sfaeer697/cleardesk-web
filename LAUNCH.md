# ClearDesk launch checklist

Work top to bottom. The installers are public and the Polar product exists in
production; what is left is Cloudflare, the domain, the purchase test and one
app rebuild.

## 0. Before spending money

- [ ] Confirm Polar can pay out to your country: **Settings → Payouts** (Stripe
      identity verification complete, not pending).
- [ ] Buy `getcleardesk.site` — Cloudflare Registrar is the least friction since
      the site is moving there.

## 1. Domain and email

- [ ] Register `getcleardesk.site`. If you buy it at Cloudflare Registrar it is
      added to your account with Cloudflare nameservers already set.
- [ ] If you bought it elsewhere, change its nameservers to the pair Cloudflare
      shows in **Overview → Nameservers**.
- [ ] Click the ICANN verification email if one arrives.
- [ ] Cloudflare → **Email → Email Routing** → enable, then add a custom address
      `support@getcleardesk.site` forwarding to your real inbox.
- [ ] Verify the destination address, then send a test email to the support
      address and confirm it arrives.

## 2. Polar (already done in production)

Recorded for reference — see `NOTES-polar.md` in the workspace root.

- [x] Organization, product and licence-key benefit exist in **production**.
- [x] Benefit: prefix `CLEARDESK`, 2 activations, no expiry, deactivation
      enabled, attached to ClearDesk Pro.
- [ ] Product **visibility → Hidden** (so Polar's storefront cannot sell at $19).
- [ ] Access token named `ClearDesk site`, scopes `orders:read` +
      `checkouts:write` only.

## 3. Cloudflare Pages project

Create a **new** Pages project rather than reusing anything from Vercel.

- [ ] Cloudflare dashboard → **Workers & Pages → Create → Pages →
      Connect to Git** → `sfaeer697/cleardesk-web`.
- [ ] Framework preset: **None**.
- [ ] Build command: leave empty.
- [ ] Build output directory: `public`.
- [ ] Node version: not needed (there is no build step).
- [ ] **Settings → Variables and Secrets**, for Production *and* Preview:

  ```text
  POLAR_ACCESS_TOKEN      <the OAT — click Encrypt>
  POLAR_ORGANIZATION_ID   295bfb69-68e5-4704-9842-9df2fe9cd087
  POLAR_PRODUCT_ID        73325a41-7ab0-4cdc-a9e9-9783f23cab88
  SITE_URL                https://getcleardesk.site
  POLAR_ENVIRONMENT       production
  ```

- [ ] Deploy, then **Deployments → Retry deployment** after any variable change.
- [ ] Open `https://<project>.pages.dev/api/pricing` and confirm
      `"live": true` and `"sold": 0`.
- [ ] Confirm the homepage loads with styles, both download buttons work, and
      `/thanks.html` renders.

## 4. Domain in Cloudflare

- [ ] Pages project → **Custom domains** → **Set up a domain** →
      `getcleardesk.site`.
- [ ] Add `www.getcleardesk.site` as well and redirect it to the apex under
      **Rules → Redirect Rules** (or use `www` as the primary and redirect the
      apex).
- [ ] Wait for the status to read **Active** and HTTPS to be issued.
- [ ] Confirm `https://getcleardesk.site/api/pricing` answers, not just the
      `pages.dev` hostname.

## 5. Purchase test

- [ ] Open the site: **Founding — $9**, **5 of 5 left**.
- [ ] Click **Buy** → Polar checkout at **$9**.
- [ ] Pay with a real card (production has no test cards).
- [ ] Polar → **Orders** → confirm the order and its `CLEARDESK_…` licence key.
- [ ] Reload the site after about a minute: **4 of 5 left**.
- [ ] Refund the order and confirm the seat returns (could take a minute).

## 6. Licensed app build

`license.rs` already contains the production public identifiers:

```rust
pub const ORGANIZATION_ID: &str = "295bfb69-68e5-4704-9842-9df2fe9cd087";
pub const BENEFIT_ID: &str = "f71236de-196e-4142-8a31-3c905a0e6d1d";
```

- [ ] Confirm `src/app/core/models.ts` has `BUY_URL = 'https://getcleardesk.site/#pricing'`.
- [ ] Bump the version in `package.json`, `src-tauri/tauri.conf.json`,
      `src-tauri/Cargo.toml`; refresh and commit `src-tauri/Cargo.lock`.
- [ ] Commit, tag, push:

  ```powershell
  git tag v0.1.4
  git push origin v0.1.4
  ```

- [ ] Wait for **Release installers** (Windows + macOS on `macos-15`).
- [ ] Confirm all three stable download URLs return 200.
- [ ] Install over the old version.

## 7. End-to-end test

- [ ] Free tier: one workspace, 50 items, second workspace blocked.
- [ ] Paste the key from the test purchase into **Settings → ClearDesk Pro**.
- [ ] Confirm Pro unlocks unlimited workspaces and items.
- [ ] Activate on a second computer. A third must fail the activation limit.
- [ ] Deactivate one computer and activate another.
- [ ] Confirm the packaged UI is styled, not bare HTML.

## 8. Decommission Vercel

Only after `getcleardesk.site` serves the new site.

- [ ] Delete `api/`, `vercel.json` and `vercel.json`'s shims from the repo, or
      keep `api/` if you want the old deployment to keep working.
- [ ] Delete the Vercel project so it stops auto-deploying on every push.
- [ ] Remove the `LEMONSQUEEZY_*` variables if the project still exists.

## Rules

- Never put the Polar access token in the desktop app or commit it.
- The desktop app only needs the public **Organization ID** and **Benefit ID**;
  Polar's customer-portal licence endpoints are unauthenticated by design.
- Keep Angular `inlineCritical` disabled; Tauri's CSP blocks its inline
  `onload` handler and the packaged app loses its styles.
- Set `SITE_URL` before the first real sale, otherwise the post-purchase
  redirect leaves the buyer on Polar.
- Cloudflare Pages does not cache Function responses at the edge; `/api/pricing`
  relies on a 60-second in-isolate cache plus a 30-second browser cache.
