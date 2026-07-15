export function formatPrice(value) {
  return `€${value.toFixed(2)}`
}

// Physical size readout for the designer — stickers are a real-world product.
export function formatSize(widthMm, heightMm) {
  const cm = (v) => (v / 10).toFixed(1)
  const inch = (v) => (v / 25.4).toFixed(1)
  return `${cm(widthMm)} × ${cm(heightMm)} cm · ${inch(widthMm)} × ${inch(heightMm)} in`
}
