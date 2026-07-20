import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { A4, renderSheetCanvas } from '../utils/stickerRender.js'
import { customSheetPrice, getFinish, FINISHES } from '../utils/pricing.js'
import { formatPrice, formatSize } from '../utils/format.js'
import StickerNode from './StickerNode.jsx'

const SNAP_MM = 2
const DEFAULT_BORDER_MM = 3

let stickerSeq = 1

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

function makeSticker(image, src, index) {
  const natW = image.naturalWidth || 300
  const natH = image.naturalHeight || 300
  let widthMm = 70
  let heightMm = widthMm * (natH / natW)
  if (heightMm > 90) {
    heightMm = 90
    widthMm = heightMm * (natW / natH)
  }
  const cascade = (index % 4) * 12
  return {
    id: `s-${stickerSeq++}`,
    src,
    image,
    xMm: A4.widthMm / 2 - 18 + cascade,
    yMm: A4.heightMm / 2 - 18 + cascade,
    widthMm,
    heightMm,
    rotation: 0,
    borderMm: DEFAULT_BORDER_MM,
    aspectLocked: true,
  }
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export default function DesignerPage() {
  const { items, addItem, updateItem } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const [stickers, setStickers] = useState([])
  const [finish, setFinish] = useState('none')
  const [selectedId, setSelectedId] = useState(null)
  const [guides, setGuides] = useState({ v: null, h: null })
  const [previewMode, setPreviewMode] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)
  const sheetRef = useRef(null)
  const [scale, setScale] = useState(2)

  const editItemId = location.state?.editItemId ?? null
  const editItem = items.find((i) => i.id === editItemId && i.type === 'custom-sheet')

  // px-per-mm follows the rendered sheet width so the layout is responsive.
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / A4.widthMm)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // When arriving via "Edit design" from the cart, rebuild the sheet from
  // the stored layout.
  useEffect(() => {
    if (!editItem) return
    let cancelled = false
    Promise.all(
      editItem.design.stickers.map(async (s) => ({
        ...s,
        id: `s-${stickerSeq++}`,
        image: await loadImage(s.src),
      })),
    ).then((loaded) => {
      if (!cancelled) {
        setStickers(loaded)
        setFinish(editItem.design.finish ?? 'none')
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editItemId])

  const clientToMm = useCallback((clientX, clientY) => {
    const rect = sheetRef.current.getBoundingClientRect()
    const pxPerMm = rect.width / A4.widthMm
    return { x: (clientX - rect.left) / pxPerMm, y: (clientY - rect.top) / pxPerMm }
  }, [])

  function updateSticker(id, patch) {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function removeSticker(id) {
    setStickers((prev) => prev.filter((s) => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function duplicateSticker(id) {
    const source = stickers.find((s) => s.id === id)
    if (!source) return
    const copy = {
      ...source,
      id: `s-${stickerSeq++}`,
      xMm: clamp(source.xMm + 12, 0, A4.widthMm),
      yMm: clamp(source.yMm + 12, 0, A4.heightMm),
    }
    setStickers((prev) => [...prev, copy])
    setSelectedId(copy.id)
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) {
      setUploadError('Please choose image files (PNG with transparency works best).')
      return
    }
    setUploadError(null)
    try {
      const startIndex = stickers.length
      const loaded = await Promise.all(
        files.map(async (file, i) => {
          const src = await readFileAsDataUrl(file)
          const image = await loadImage(src)
          return makeSticker(image, src, startIndex + i)
        }),
      )
      setStickers((prev) => [...prev, ...loaded])
      setSelectedId(loaded[loaded.length - 1].id)
    } catch {
      setUploadError('One of the files could not be read as an image.')
    }
  }

  // Drag with snapping against the sheet center and other stickers' centers.
  function handleDrag(id, x, y) {
    const others = stickers.filter((s) => s.id !== id)
    let gv = null
    let gh = null
    for (const t of [A4.widthMm / 2, ...others.map((s) => s.xMm)]) {
      if (Math.abs(x - t) <= SNAP_MM) {
        x = t
        gv = t
        break
      }
    }
    for (const t of [A4.heightMm / 2, ...others.map((s) => s.yMm)]) {
      if (Math.abs(y - t) <= SNAP_MM) {
        y = t
        gh = t
        break
      }
    }
    setGuides({ v: gv, h: gh })
    updateSticker(id, {
      xMm: clamp(x, 0, A4.widthMm),
      yMm: clamp(y, 0, A4.heightMm),
    })
  }

  const clearGuides = useCallback(() => setGuides({ v: null, h: null }), [])

  function handleSheetPointerDown(e) {
    if (e.target === e.currentTarget) setSelectedId(null)
  }

  function handleAddToCart() {
    if (stickers.length === 0) return
    const thumbnail = renderSheetCanvas(stickers, 1.4).toDataURL('image/jpeg', 0.85)
    const payload = {
      type: 'custom-sheet',
      name: 'Custom A4 sticker sheet',
      detail: `${stickers.length} sticker${stickers.length === 1 ? '' : 's'} · ${getFinish(finish).label.toLowerCase()}`,
      unitPrice: customSheetPrice(finish),
      thumbnail,
      // Full layout capture — enough for a backend to reproduce the print.
      design: {
        sheet: 'A4',
        finish,
        stickers: stickers.map(({ image, ...rest }) => rest),
      },
    }
    if (editItem) {
      updateItem(editItem.id, payload)
    } else {
      addItem({ ...payload, qty: 1 })
    }
    navigate('/cart')
  }

  const selected = stickers.find((s) => s.id === selectedId) ?? null
  const price = customSheetPrice(finish)

  return (
    <div className="container page designer-page">
      <div className="page-head">
        <h1>{editItem ? 'Edit your sticker sheet' : 'Design your sticker sheet'}</h1>
        <p className="muted">
          Upload images, arrange them on an A4 sheet, and tune the die-cut border. What you see is
          what we print.
        </p>
      </div>

      <div className="designer-layout">
        <div className="sheet-area">
          <div className="sheet-toolbar">
            <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
              + Add images
            </button>
            <label className="toggle">
              <input
                type="checkbox"
                checked={previewMode}
                onChange={(e) => {
                  setPreviewMode(e.target.checked)
                  if (e.target.checked) setSelectedId(null)
                }}
              />
              <span>Print preview</span>
            </label>
            <span className="muted small sheet-dims">A4 · 21.0 × 29.7 cm</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />

          <div
            ref={sheetRef}
            className={`sheet ${previewMode ? 'preview' : ''}`}
            onPointerDown={handleSheetPointerDown}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              addFiles(e.dataTransfer.files)
            }}
          >
            {stickers.length === 0 && (
              <div className="sheet-empty">
                <p>
                  <strong>Drop images here</strong>
                  <br />
                  or use “Add images” above.
                </p>
                <p className="muted small">PNGs with transparent backgrounds get the best die-cut borders.</p>
              </div>
            )}
            {guides.v !== null && <div className="guide guide-v" style={{ left: guides.v * scale }} />}
            {guides.h !== null && <div className="guide guide-h" style={{ top: guides.h * scale }} />}
            {stickers.map((sticker) => (
              <StickerNode
                key={sticker.id}
                sticker={sticker}
                scale={scale}
                selected={sticker.id === selectedId}
                previewMode={previewMode}
                clientToMm={clientToMm}
                onSelect={setSelectedId}
                onDrag={handleDrag}
                onDragEnd={clearGuides}
                onChange={(patch) => updateSticker(sticker.id, patch)}
              />
            ))}
          </div>
          {uploadError && <p className="field-error">{uploadError}</p>}
        </div>

        <aside className="designer-sidebar">
          <section className="card panel">
            <h2>Selected sticker</h2>
            {selected ? (
              <>
                <p className="size-readout">{formatSize(selected.widthMm, selected.heightMm)}</p>
                <div className="control">
                  <label htmlFor="border-slider">
                    Die-cut border <span className="muted">{selected.borderMm.toFixed(1)} mm</span>
                  </label>
                  <input
                    id="border-slider"
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selected.borderMm}
                    onChange={(e) => updateSticker(selected.id, { borderMm: Number(e.target.value) })}
                  />
                </div>
                <div className="control">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={selected.aspectLocked}
                      onChange={(e) => updateSticker(selected.id, { aspectLocked: e.target.checked })}
                    />
                    <span>Lock aspect ratio</span>
                  </label>
                </div>
                <div className="control control-row">
                  <span className="muted small">Rotation: {Math.round(selected.rotation)}°</span>
                  {selected.rotation !== 0 && (
                    <button type="button" className="text-link as-button" onClick={() => updateSticker(selected.id, { rotation: 0 })}>
                      Reset
                    </button>
                  )}
                </div>
                <div className="panel-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => duplicateSticker(selected.id)}>
                    Duplicate
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSticker(selected.id)}>
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">
                {stickers.length === 0
                  ? 'Add an image to get started.'
                  : 'Click a sticker on the sheet to edit it.'}
              </p>
            )}
          </section>

          <section className="card panel">
            <h2>This sheet</h2>
            <div className="summary-row">
              <span>Images on sheet</span>
              <span>{stickers.length}</span>
            </div>
            <div className="control">
              <label>Finish</label>
              <p className="muted small">
                Priced per sheet — fit as many stickers on it as you like.
              </p>
              <div className="size-options">
                {FINISHES.map((f) => (
                  <label key={f.id} className={`size-option ${f.id === finish ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="sheet-finish"
                      value={f.id}
                      checked={f.id === finish}
                      onChange={() => setFinish(f.id)}
                    />
                    <span>
                      {f.label}
                      <span className="muted small finish-blurb">{f.blurb}</span>
                    </span>
                    <strong>{formatPrice(f.price)}</strong>
                  </label>
                ))}
              </div>
            </div>
            <div className="summary-row summary-total">
              <span>Sheet price</span>
              <span>{stickers.length > 0 ? formatPrice(price) : '—'}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={stickers.length === 0}
              onClick={handleAddToCart}
            >
              {editItem ? 'Update item in cart' : 'Add sheet to cart'}
            </button>
            <p className="muted small">
              Tip: drag corners to resize, the top handle to rotate. Sizes shown are real print
              sizes.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
