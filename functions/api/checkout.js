// POST /api/checkout → { url } for a Polar checkout at the price of the tier
// that is live right now.
//
// Cloudflare Pages Function: `functions/api/checkout.js` maps to `/api/checkout`.
import { tierFor } from '../../lib/tiers.js';
import { countSold, createCheckout, env } from '../../lib/polar.js';

export async function onRequestPost({ env: bindings }) {
  const e = env(bindings);
  if (!e.ok) {
    return Response.json(
      { error: `Checkout is not configured yet (missing ${e.missing.join(', ')}).` },
      { status: 503 },
    );
  }
  try {
    // Count fresh (no cache) so the last founding seat can't be sold twice from stale data.
    const sold = await countSold(e);
    const tier = tierFor(sold);
    const url = await createCheckout(e, tier);
    return Response.json(
      { url, tier: { id: tier.id, name: tier.name, price: tier.price, left: tier.left } },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (err) {
    console.error('checkout failed', err);
    return Response.json({ error: 'Could not start checkout. Please try again in a moment.' }, { status: 502 });
  }
}
