# ClearDesk launch checklist

Work top to bottom. The installers are already public; this checklist is about
the website, payments, the licensed app build and the domain.

## 0. Before spending money

- [ ] Confirm Polar can pay out to your country: **Settings → Payouts**.
- [ ] Decide on the Vercel plan. Hobby is for non-commercial projects; a paid
      product should use Pro.
- [ ] Confirm `getcleardesk.online` is available at your registrar.

## 1. Domain and email

- [ ] Buy `getcleardesk.online` at Namecheap.
- [ ] Click the ICANN verification email if one arrives.
- [ ] Set up `support@getcleardesk.online` forwarding to your real inbox:
      **Domain List → Manage → Email Forwarding**.
- [ ] Send a test email to the support address and confirm it arrives.

## 2. Polar, sandbox first

Polar has a separate **sandbox** environment at https://sandbox.polar.sh. Data,
tokens and organizations there are isolated from production. Use it for the
first end-to-end test, then repeat in production.

- [ ] Create the organization in sandbox.
- [ ] **Benefits → New Benefit → License Keys**: prefix `CLEARDESK`,
      activation limit **2**, no expiration.
- [ ] Create product **ClearDesk Pro**, one-time, base price **$19**, attach the
      licence-key benefit.
- [ ] Collect the **Organization ID**, **Product ID** and **Benefit ID**.
- [ ] Create an **Organization Access Token** in sandbox.

## 3. Vercel project

Create a **fresh** project. Do not reuse the old broken deployment.

- [ ] Vercel → **Add New → Project** → import `sfaeer697/cleardesk-web`.
- [ ] Framework preset: **Other**.
- [ ] Root directory: repository root.
- [ ] Build command: empty.
- [ ] Output directory: `public`.
- [ ] Install command: empty.
- [ ] Node.js version: 22.x.
- [ ] Add environment variables (Production, Preview, Development):

  ```text
  POLAR_ACCESS_TOKEN=...
  POLAR_ORGANIZATION_ID=...
  POLAR_PRODUCT_ID=...
  SITE_URL=https://your-project.vercel.app
  POLAR_ENVIRONMENT=sandbox
  ```

- [ ] Deploy. Then **Deployments → Redeploy** after changing any variable.
- [ ] Open `/api/pricing` and confirm it returns `"live": true`.
- [ ] Confirm the homepage loads with styles and both download buttons work.

## 4. Domain in Vercel

- [ ] **Settings → Domains** → add `getcleardesk.online` and
      `www.getcleardesk.online`.
- [ ] At Namecheap → **Advanced DNS**, add the records Vercel shows. Commonly:

  | Type | Host | Value |
  |---|---|---|
  | A | `@` | `76.76.21.21` |
  | CNAME | `www` | `cname.vercel-dns.com` |

- [ ] Delete Namecheap's parking/redirect records for `@` and `www`.
- [ ] Wait for Vercel to show **Valid Configuration** and issue HTTPS.

## 5. Sandbox purchase test

- [ ] Open the site. The pricing section should show **Founding — $9** and
      **5 of 5 left**.
- [ ] Click **Buy**. Polar checkout should open at **$9**.
- [ ] Pay with card `4242 4242 4242 4242`.
- [ ] In Polar sandbox → **Orders**, confirm the order and its licence key.
- [ ] Reload the site after about a minute. It should show **4 of 5 left**.
- [ ] Refund the order and confirm the seat returns.

## 6. Licensed app build

Set the public identifiers (they are not secrets):

```text
cleardesk/src-tauri/src/license.rs
```

```rust
pub const ORGANIZATION_ID: &str = "your-org-uuid";
pub const BENEFIT_ID: &str = "your-licence-benefit-uuid"; // recommended
```

- [ ] Bump the version in `package.json`, `src-tauri/tauri.conf.json`,
      `src-tauri/Cargo.toml`; refresh and commit `src-tauri/Cargo.lock`.
- [ ] Commit, tag, push:

  ```powershell
  git tag v0.1.3
  git push origin v0.1.3
  ```

- [ ] Wait for **Release installers** to finish.
- [ ] Download the new installers and install over the old version.

## 7. End-to-end test

- [ ] Free tier: one workspace, 50 items, second workspace blocked.
- [ ] Buy with the test card; paste the key into **Settings → ClearDesk Pro**.
- [ ] Confirm Pro unlocks unlimited workspaces and items.
- [ ] Activate on a second computer. A third must fail the activation limit.
- [ ] Deactivate one computer and activate another.
- [ ] Refund the test order.
- [ ] Confirm the packaged UI is styled, not bare HTML.

## 8. Go live

- [ ] Switch the dashboard from sandbox to **production**.
- [ ] Create the product and licence-key benefit in production.
- [ ] Collect the production **Organization ID**, **Product ID**, **Benefit ID**.
- [ ] Create a production **Organization Access Token**.
- [ ] Vercel: replace all values, set `POLAR_ENVIRONMENT=production`, redeploy.
- [ ] `license.rs`: set the **production** `ORGANIZATION_ID` and `BENEFIT_ID`.
      Build and release the updated version.
- [ ] Confirm `/api/pricing` returns `"live": true` with production data.
- [ ] Make one real purchase, verify activation, then refund it.
- [ ] Confirm the payout appears in Polar.
- [ ] Announce.

## Rules

- Never put the Polar access token in the desktop app or commit it.
- The desktop app only needs the public **Organization ID** and **Benefit ID**;
  Polar's customer-portal licence endpoints are unauthenticated by design.
- Keep Angular `inlineCritical` disabled; Tauri's CSP blocks its inline
  `onload` handler and the packaged app loses its styles.
- Set `SITE_URL=https://getcleardesk.online` only after DNS resolves, otherwise
  the post-purchase redirect breaks.
