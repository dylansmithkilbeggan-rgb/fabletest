// Canvas helpers for rendering die-cut stickers: an image surrounded by a
// contour border that hugs the alpha silhouette of the artwork (a rectangle
// with softly rounded corners for fully opaque images).

export const A4 = { widthMm: 210, heightMm: 297 }

export function renderStickerCanvas(image, widthPx, heightPx, borderPx, borderColor = '#ffffff') {
  const w = Math.max(1, Math.round(widthPx))
  const h = Math.max(1, Math.round(heightPx))
  const pad = Math.ceil(Math.max(0, borderPx))
  const canvas = document.createElement('canvas')
  canvas.width = w + pad * 2
  canvas.height = h + pad * 2
  const ctx = canvas.getContext('2d')

  if (pad > 0) {
    // Solid-color silhouette of the image, taken from its alpha channel.
    const sil = document.createElement('canvas')
    sil.width = w
    sil.height = h
    const sctx = sil.getContext('2d')
    sctx.drawImage(image, 0, 0, w, h)
    sctx.globalCompositeOperation = 'source-in'
    sctx.fillStyle = borderColor
    sctx.fillRect(0, 0, w, h)

    // Approximate morphological dilation by stamping the silhouette around
    // rings of decreasing radius, so the border comes out solid.
    const ringStep = Math.max(1, pad / 4)
    for (let r = pad; r > 0; r -= ringStep) {
      const n = Math.min(64, Math.max(12, Math.ceil(Math.PI * r)))
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        ctx.drawImage(sil, pad + Math.cos(a) * r, pad + Math.sin(a) * r)
      }
    }
    ctx.drawImage(sil, pad, pad)
  }

  ctx.drawImage(image, pad, pad, w, h)
  return canvas
}

// Flattens a full sheet layout into one canvas — used for cart thumbnails
// and as the exact print preview data captured with an order.
export function renderSheetCanvas(stickers, pxPerMm) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(A4.widthMm * pxPerMm)
  canvas.height = Math.round(A4.heightMm * pxPerMm)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const s of stickers) {
    if (!s.image) continue
    const rendered = renderStickerCanvas(
      s.image,
      s.widthMm * pxPerMm,
      s.heightMm * pxPerMm,
      s.borderMm * pxPerMm,
    )
    ctx.save()
    ctx.translate(s.xMm * pxPerMm, s.yMm * pxPerMm)
    ctx.rotate((s.rotation * Math.PI) / 180)
    ctx.drawImage(rendered, -rendered.width / 2, -rendered.height / 2)
    ctx.restore()
  }
  return canvas
}
