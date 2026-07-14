import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'
import audiExample from '../assets/hero/1-audi.png'
import gt86Example from '../assets/hero/2-gt86.png'

export const CAR_STICKER_SIZES = [
  { id: 'small', label: '10 cm wide', price: 9.5 },
  { id: 'medium', label: '15 cm wide', price: 13.5 },
  { id: 'large', label: '20 cm wide', price: 17.5 },
]

// Scale customer photos down before storing them in the cart — phone photos
// can be 10MB+ and the order only needs a working reference.
function readPhotoAsDataUrl(file, maxPx = 900) {
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
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function CustomCarSticker() {
  const { addItem } = useStore()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [plate, setPlate] = useState('')
  const [notes, setNotes] = useState('')
  const [sizeId, setSizeId] = useState('medium')
  const [error, setError] = useState(null)

  const size = CAR_STICKER_SIZES.find((s) => s.id === sizeId)

  async function handlePhoto(fileList) {
    const file = Array.from(fileList).find((f) => f.type.startsWith('image/'))
    if (!file) {
      setError('Please choose a photo (JPG or PNG).')
      return
    }
    setError(null)
    try {
      setPhoto(await readPhotoAsDataUrl(file))
    } catch {
      setError('That file could not be read as an image.')
    }
  }

  function handleAddToCart() {
    if (!photo) {
      setError('Add a photo of your car first.')
      return
    }
    addItem({
      type: 'custom-car',
      name: 'Custom car sticker',
      detail: `${size.label}${plate.trim() ? ` · plate “${plate.trim().toUpperCase()}”` : ''}`,
      unitPrice: size.price,
      thumbnail: photo,
      qty: 1,
      // Everything the artist needs to draw the commission.
      commission: { photo, plate: plate.trim().toUpperCase(), notes: notes.trim(), size: size.id },
    })
    navigate('/cart')
  }

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Your car, as a sticker</h1>
        <p className="muted">
          Send us a photo and we hand-draw your car as a cartoon-style die-cut sticker — plate
          text and all. Drawn, printed and shipped within 5 working days.
        </p>
      </div>

      <div className="car-examples" aria-hidden="true">
        <img src={audiExample} alt="" />
        <img src={gt86Example} alt="" />
        <p className="muted small">Real commissions we’ve drawn for customers.</p>
      </div>

      <div className="cart-layout">
        <section className="card form-section">
          <h2>1. Your car</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              handlePhoto(e.target.files)
              e.target.value = ''
            }}
          />
          <div
            className={`photo-drop ${photo ? 'has-photo' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handlePhoto(e.dataTransfer.files)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
            }}
          >
            {photo ? (
              <>
                <img src={photo} alt="Your car" />
                <span className="text-link">Change photo</span>
              </>
            ) : (
              <p>
                <strong>Drop a photo of your car here</strong>
                <br />
                <span className="muted small">
                  or click to browse. A clear three-quarter front view works best.
                </span>
              </p>
            )}
          </div>
          {error && <p className="field-error">{error}</p>}

          <div className="field" style={{ marginTop: '1rem' }}>
            <label htmlFor="plate">Plate text on the sticker (optional)</label>
            <input
              id="plate"
              type="text"
              maxLength={10}
              placeholder="e.g. JETT"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="notes">Anything we should know? (optional)</label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Lowered suspension, aftermarket wheels, skip the roof rack…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        <aside className="card form-section">
          <h2>2. Size &amp; price</h2>
          <div className="size-options">
            {CAR_STICKER_SIZES.map((s) => (
              <label key={s.id} className={`size-option ${s.id === sizeId ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="car-size"
                  value={s.id}
                  checked={s.id === sizeId}
                  onChange={() => setSizeId(s.id)}
                />
                <span>{s.label}</span>
                <strong>{formatPrice(s.price)}</strong>
              </label>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={handleAddToCart}>
            Add to cart — {formatPrice(size.price)}
          </button>
          <p className="muted small">
            We’ll email you the drawing to approve before anything gets printed.
          </p>
        </aside>
      </div>
    </div>
  )
}
