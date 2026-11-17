// Minimal Polar API client. Server-side only: the access token never reaches
// the browser.
const PRODUCTION = 'https://api.polar.sh/v1';
const SANDBOX = 'https://sandbox-api.polar.sh/v1';

export function env() {
  const sandbox = process.env.POLAR_ENVIRONMENT === 'sandbox';
  const e = {
    apiBase: sandbox ? SANDBOX : PRODUCTION,
    token: process.env.POLAR_ACCESS_TOKEN,
    orgId: process.env.POLAR_ORGANIZATION_ID,
    productId: process.env.POLAR_PRODUCT_ID,
    siteUrl: (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')).replace(/\/$/, ''),
    sandbox,
  };
  const missing = ['token', 'orgId', 'productId'].filter((k) => !e[k]);
  return { ...e, ok: missing.length === 0, missing };
}

async function call(path, { method = 'GET', body, token, apiBase }) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.detail || json?.error || `Polar ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

/**
 * Counts paid, non-refunded orders for our product. Polar filters by status,
 * so refunded and partially refunded orders are excluded server-side.
 * Pages through results (100 per page).
 */
export async function countSold({ apiBase, token, orgId, productId }) {
  let sold = 0;
  let page = 1;
  for (;;) {
    const q = `/orders/?organization_id=${orgId}&product_id=${productId}&status=paid&page=${page}&limit=100`;
    const json = await call(q, { token, apiBase });
    sold += (json.items ?? []).length;
    const max = json.pagination?.max_page ?? 1;
    if (page >= max) break;
    page += 1;
  }
  return sold;
}

/**
 * Creates a checkout for the current tier. The price is decided on the server
 * as an ad-hoc fixed price, so a cheaper link cannot be reused after a tier
 * sells out.
 */
export async function createCheckout({ apiBase, token, productId, siteUrl }, tier) {
  const body = {
    products: [productId],
    prices: {
      [productId]: [
        {
          amount_type: 'fixed',
          price_amount: Math.round(tier.price * 100),
          price_currency: 'usd',
        },
      ],
    },
    success_url: siteUrl ? `${siteUrl}/thanks.html` : undefined,
    return_url: siteUrl ? `${siteUrl}/#pricing` : undefined,
    metadata: { tier: tier.id, tier_price: String(tier.price) },
  };
  const json = await call('/checkouts/', { method: 'POST', body, token, apiBase });
  return json.url;
}
