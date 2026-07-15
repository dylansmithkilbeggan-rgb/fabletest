// Reads an image file and returns a downscaled data URL. Keeps huge phone
// photos from bloating in-memory state; PNG keeps transparency for sticker
// art, JPEG is smaller for photos.
export function readImageFileAsDataUrl(file, { maxPx = 900, format = 'image/jpeg' } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load image'))
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL(format, format === 'image/jpeg' ? 0.85 : undefined))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
