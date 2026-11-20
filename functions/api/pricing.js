// GET /api/pricing → the live launch ladder: which tier is on, seats left.
//
// Cloudflare Pages Function: `functions/api/pricing.js` maps to `/api/pricing`.
import { CURRENCY, ladder, tierFor } from '../../lib/tiers.js';
import { countSold, env } from '../../lib/polar.js';

// Isolates are reused between requests, so we hit Polar at most once a minute.
let cache = { at: 0, sold: null };
const TTL = 60_000;

export async function onRequestGet({ env: bindings }) {
  const e = env(bindings);
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
    // Browsers may keep it for 30 s; Pages does not cache Function responses
    // at the edge, so the in-isolate cache above is what protects Polar.
    { headers: { 'Cache-Control': 'public, max-age=30' } },
  );
}
