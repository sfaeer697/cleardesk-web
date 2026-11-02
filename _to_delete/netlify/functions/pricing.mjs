// GET /api/pricing → the live launch ladder: which tier is on, seats left.
import { CURRENCY, ladder, tierFor } from './_lib/tiers.mjs';
import { countSold, env } from './_lib/lemon.mjs';

let cache = { at: 0, sold: null };
const TTL = 60_000;

export default async () => {
  const e = env();
  let sold = 0;
  let live = false;
  if (e.ok) {
    try {
      if (cache.sold !== null && Date.now() - cache.at < TTL) sold = cache.sold;
      else {
        sold = await countSold(e);
        cache = { at: Date.now(), sold };
      }
      live = true;
    } catch (err) {
      console.error('pricing: could not count orders', err);
    }
  }
  const current = tierFor(sold);
  return Response.json(
    { live, currency: CURRENCY, sold, current, tiers: ladder(sold) },
    { headers: { 'Cache-Control': 'public, max-age=30' } },
  );
};

export const config = { path: '/api/pricing' };
