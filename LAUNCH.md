# ClearDesk launch checklist

Work top to bottom. The installers are already public; this checklist is about
the domain, the website, payments and the licensed app build.

## 0. Before spending money

- [ ] Confirm Lemon Squeezy can pay out to your country:
      **Settings → Payouts**. If it cannot, choose another merchant of record
      before buying the domain.
- [ ] Decide on the Vercel plan. Hobby is for non-commercial projects; a paid
      product should use Pro.
- [ ] Confirm `getcleardesk.online` is available at your registrar.

## 1. Domain and email

- [ ] Buy `getcleardesk.online` at Namecheap.
- [ ] Click the ICANN verification email if one arrives.
- [ ] Set up `support@getcleardesk.online` forwarding to your real inbox:
      **Domain List → Manage → Email Forwarding**.
- [ ] Send a test email to the support address and confirm it arrives.

## 2. Vercel project

Create a **fresh** project. Do not reuse the old broken
`cleardesk-site.vercel.app` deployment.

- [ ] Vercel → **Add New → Project** → import `sfaeer697/cleardesk-web`.
- [ ] Framework preset: **Other**.
- [ ] Root directory: repository root.
- [ ] Build command: empty.
- [ ] Output directory: `public`.
- [ ] Install command: empty.
- [ ] Node.js version: 22.x.
- [ ] Add environment variables (Production, Preview, Development):

  ```text
  LEMONSQUEEZY_API_KEY=...
  LEMONSQUEEZY_STORE_ID=...
  LEMONSQUEEZY_VARIANT_ID=...
  SITE_URL=https://getcleardesk.online
  LEMONSQUEEZY_TEST_MODE=true
  ```

- [ ] Deploy. Then **Deployments → Redeploy** after changing any variable.
- [ ] Open `/api/pricing` and confirm it returns JSON.
- [ ] Confirm the homepage loads with styles and both download buttons work.

## 3. Domain in Vercel

- [ ] **Settings → Domains** → add `getcleardesk.online` and
      `www.getcleardesk.online`.
- [ ] At Namecheap → **Advanced DNS**, add the records Vercel shows. Commonly:

  | Type | Host | Value |
  |---|---|---|
  | A | `@` | `76.76.21.21` |
  | CNAME | `www` | `cname.vercel-dns.com` |

- [ ] Delete Namecheap's parking/redirect records for `@` and `www`.
- [ ] Wait for Vercel to show **Valid Configuration** and issue HTTPS.

## 4. Lemon Squeezy

- [ ] Create the store, currency USD.
- [ ] Complete **Settings → Payouts** and the tax form.
- [ ] Create product **ClearDesk Pro**, single payment, **$19**.
- [ ] Enable licence keys: activation limit **2**, no expiry.
- [ ] Switch the store to **Test mode**.
- [ ] Collect Store ID, Product ID, Variant ID and a test API key.
- [ ] Put the Store ID and Variant ID plus API key in Vercel.
- [ ] Redeploy, then buy with card `4242 4242 4242 4242`.
- [ ] Confirm the test order and licence key exist in Lemon Squeezy.

## 5. Licensed app build

- [ ] Set `STORE_ID` and `PRODUCT_ID` in
      `cleardesk/src-tauri/src/license.rs`.
- [ ] Bump the version in `package.json`, `src-tauri/tauri.conf.json`,
      `src-tauri/Cargo.toml`; refresh and commit `src-tauri/Cargo.lock`.
- [ ] Commit, tag, push:

  ```powershell
  git tag v0.1.3
  git push origin v0.1.3
  ```

- [ ] Wait for **Release installers** to finish.
- [ ] Download the new installers and install over the old version.

## 6. End-to-end test

- [ ] Free tier: one workspace, 50 items, second workspace blocked.
- [ ] Buy with the test card; paste the key into **Settings → ClearDesk Pro**.
- [ ] Confirm Pro unlocks unlimited workspaces and items.
- [ ] Activate on a second computer. A third must fail the activation limit.
- [ ] Deactivate one computer and activate another.
- [ ] Refund the test order. Revocation can take up to 7 days by design.
- [ ] Confirm the packaged UI is styled, not bare HTML.

## 7. Go live

- [ ] Turn Lemon Squeezy **Test mode off**.
- [ ] Re-check live Store/Product/Variant IDs; update Vercel if they differ.
- [ ] Switch Vercel to the live API key and remove `LEMONSQUEEZY_TEST_MODE`.
- [ ] Redeploy.
- [ ] Confirm `/api/pricing` returns live data.
- [ ] Make one real purchase, verify activation, then refund it.
- [ ] Confirm the payout appears in Lemon Squeezy.
- [ ] Announce.

## Rules

- Never put the Lemon Squeezy API key in the desktop app or commit it.
- Never ship `STORE_ID = 0` / `PRODUCT_ID = 0`; that accepts any licence key.
- Keep Angular `inlineCritical` disabled; Tauri's CSP blocks its inline
  `onload` handler and the packaged app loses its styles.
