// GET /api/pricing → the live launch ladder: which tier is on, seats left.
import { CURRENCY, ladder, tierFor } from '../lib/tiers.js';
import { countSold, env } from '../lib/lemon.js';

// Warm function instances reuse this, so we hit Lemon Squeezy at most once a minute.
let cache = { at: 0, sold: null };
const TTL = 60_000;

export async function GET() {
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
  return Response.json(
    { live, currency: CURRENCY, sold, current: tierFor(sold), tiers: ladder(sold) },
    // Vercel's CDN caches for 30 s and serves stale while refreshing.
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
  );
}
