// Launch pricing ladder. Edit prices here — the site and checkout both read it.
// `seats: null` = unlimited (regular price).
export const TIERS = [
  { id: 'founding', name: 'Founding', seats: 5, price: 9 },
  { id: 'early', name: 'Early', seats: 20, price: 14 },
  { id: 'standard', name: 'Standard', seats: null, price: 19 },
];

export const CURRENCY = 'USD';

/** Which tier applies after `sold` licences, and how many seats are left in it. */
export function tierFor(sold) {
  let start = 0;
  for (const t of TIERS) {
    if (t.seats === null || sold < start + t.seats) {
      const left = t.seats === null ? null : start + t.seats - sold;
      return { ...t, left, sold };
    }
    start += t.seats;
  }
  const last = TIERS[TIERS.length - 1];
  return { ...last, left: null, sold };
}

/** Public view of the whole ladder for the pricing section. */
export function ladder(sold) {
  let start = 0;
  return TIERS.map((t) => {
    const end = t.seats === null ? Infinity : start + t.seats;
    const state = sold >= end ? 'sold_out' : sold >= start ? 'current' : 'upcoming';
    const taken = t.seats === null ? null : Math.max(0, Math.min(t.seats, sold - start));
    const row = { id: t.id, name: t.name, price: t.price, seats: t.seats, taken, state };
    start = end;
    return row;
  });
}
