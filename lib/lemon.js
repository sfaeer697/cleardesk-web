// Minimal Lemon Squeezy API client (JSON:API). Server-side only: the API key
// never reaches the browser.
const API = 'https://api.lemonsqueezy.com/v1';

export function env() {
  const e = {
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    storeId: process.env.LEMONSQUEEZY_STORE_ID,
    variantId: process.env.LEMONSQUEEZY_VARIANT_ID,
    siteUrl: (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')).replace(/\/$/, ''),
    testMode: process.env.LEMONSQUEEZY_TEST_MODE === 'true',
  };
  const missing = ['apiKey', 'storeId', 'variantId'].filter((k) => !e[k]);
  return { ...e, ok: missing.length === 0, missing };
}

async function call(path, { method = 'GET', body, apiKey }) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.errors?.[0]?.detail || `Lemon Squeezy ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

/**
 * Counts paid, non-refunded orders for our variant. Pages through orders
 * (100 per page). Fine for the launch phase — thousands of orders take a few
 * requests, and results are cached by the caller.
 */
export async function countSold({ apiKey, storeId, variantId, testMode }) {
  let sold = 0;
  let page = 1;
  for (;;) {
    const q = `/orders?filter[store_id]=${storeId}&page[size]=100&page[number]=${page}`;
    const json = await call(q, { apiKey });
    for (const o of json.data ?? []) {
      const a = o.attributes;
      const item = a.first_order_item;
      if (String(item?.variant_id) !== String(variantId)) continue;
      if (a.status !== 'paid') continue; // excludes refunded / pending / failed
      if (Boolean(a.test_mode) !== testMode) continue;
      sold += 1;
    }
    const last = json.meta?.page?.lastPage ?? 1;
    if (page >= last) break;
    page += 1;
  }
  return sold;
}

/**
 * Creates a one-hour checkout for the current tier using `custom_price`, so
 * the price is decided on the server and a cheaper link can't be reused
 * after a tier sells out.
 */
export async function createCheckout({ apiKey, storeId, variantId, siteUrl }, tier) {
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        custom_price: Math.round(tier.price * 100),
        product_options: {
          name: `ClearDesk — ${tier.name} licence`,
          enabled_variants: [Number(variantId)],
          redirect_url: siteUrl ? `${siteUrl}/thanks.html` : undefined,
          receipt_button_text: 'Download ClearDesk',
          receipt_link_url: siteUrl ? `${siteUrl}/#download` : undefined,
        },
        checkout_options: { embed: true, media: false, logo: true, dark: false, button_color: '#0F766E' },
        checkout_data: { custom: { tier: tier.id, tier_price: String(tier.price) } },
        expires_at: expires,
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  };
  const json = await call('/checkouts', { method: 'POST', body, apiKey });
  return json.data.attributes.url;
}
