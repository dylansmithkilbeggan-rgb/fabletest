// Simple default pricing model:
//  - A custom A4 sheet costs a flat base price which includes one design,
//    plus a small fee for each extra image placed on the sheet.
//  - Premade stickers have fixed per-sticker prices (see data/products.js).
//  - Flat shipping, free above a threshold.

export const PRICES = {
  customSheetBase: 6.5,
  customSheetPerExtraImage: 1.0,
  shippingFlat: 4.0,
  freeShippingThreshold: 30,
}

export function customSheetPrice(imageCount) {
  if (imageCount <= 0) return 0
  return PRICES.customSheetBase + (imageCount - 1) * PRICES.customSheetPerExtraImage
}

export function cartTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
  const shipping =
    subtotal === 0 || subtotal >= PRICES.freeShippingThreshold ? 0 : PRICES.shippingFlat
  return { subtotal, shipping, total: subtotal + shipping }
}
