// POST /api/checkout → { url } for a Lemon Squeezy checkout at the price of
// the tier that is live right now.
import { tierFor } from './_lib/tiers.mjs';
import { countSold, createCheckout, env } from './_lib/lemon.mjs';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const e = env();
  if (!e.ok) {
    return Response.json({ error: `Checkout is not configured yet (missing ${e.missing.join(', ')}).` }, { status: 503 });
  }
  try {
    // Count fresh here (not cached) so the last founding seat can't be sold twice from a stale cache.
    const sold = await countSold(e);
    const tier = tierFor(sold);
    const url = await createCheckout(e, tier);
    return Response.json({ url, tier: { id: tier.id, name: tier.name, price: tier.price, left: tier.left } });
  } catch (err) {
    console.error('checkout failed', err);
    return Response.json({ error: 'Could not start checkout. Please try again in a moment.' }, { status: 502 });
  }
};

export const config = { path: '/api/checkout' };
