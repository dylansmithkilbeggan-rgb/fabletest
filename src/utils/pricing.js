// Pricing model:
//  - A custom A4 sheet is a flat price per page, set by the finish:
//    plain (no vinyl) or sealed with clear / holographic vinyl laid over
//    the print.
//  - Premade stickers have fixed per-sticker prices (see data/products.js).
//  - Flat shipping, free above a threshold.

export const PRICES = {
  shippingFlat: 4.0,
  freeShippingThreshold: 30,
}

// Premade shop stickers have an order-wide minimum: at least this many
// stickers in total, mixing designs freely.
export const MIN_PREMADE_QTY = 5

// How many more premade stickers are needed to reach the order minimum.
// Zero when the cart has none at all, or already has enough.
export function premadeShortfall(items) {
  const count = items
    .filter((i) => i.type === 'premade')
    .reduce((n, i) => n + i.qty, 0)
  return count === 0 ? 0 : Math.max(0, MIN_PREMADE_QTY - count)
}

export const FINISHES = [
  { id: 'clear', label: 'Clear vinyl', price: 7.0, blurb: 'Glossy seal over the print' },
  { id: 'holo', label: 'Holographic vinyl', price: 7.0, blurb: 'Rainbow-shift seal' },
  { id: 'none', label: 'No vinyl', price: 5.0, blurb: 'Just the printed sheet' },
]

export function getFinish(finishId) {
  return FINISHES.find((f) => f.id === finishId) ?? FINISHES[0]
}

export function customSheetPrice(finishId) {
  return getFinish(finishId).price
}

export function cartTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
  const shipping =
    subtotal === 0 || subtotal >= PRICES.freeShippingThreshold ? 0 : PRICES.shippingFlat
  return { subtotal, shipping, total: subtotal + shipping }
}
