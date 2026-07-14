import { useEffect, useRef, useState } from 'react'
import { renderStickerCanvas } from '../utils/stickerRender.js'
import { formatSize } from '../utils/format.js'

const MIN_MM = 10
const MAX_MM = 280

const clampMm = (v) => Math.min(MAX_MM, Math.max(MIN_MM, v))

// One sticker on the sheet: renders the die-cut canvas and owns its own
// drag / resize / rotate pointer interactions. All geometry is in mm;
// `scale` converts mm to on-screen px.
export default function StickerNode({
  sticker,
  scale,
  selected,
  previewMode,
  clientToMm,
  onSelect,
  onDrag,
  onDragEnd,
  onChange,
}) {
  const canvasRef = useRef(null)
  const [interacting, setInteracting] = useState(false)

  const { xMm, yMm, widthMm, heightMm, rotation, borderMm } = sticker

  useEffect(() => {
    const image = sticker.image
    const el = canvasRef.current
    if (!image || !el) return
    // rAF-throttled redraw so live resizes stay smooth.
    const raf = requestAnimationFrame(() => {
      const internalW = Math.min(512, Math.max(64, image.naturalWidth || 512))
      const internalH = Math.max(1, Math.round(internalW * (heightMm / widthMm)))
      const borderPx = (borderMm / widthMm) * internalW
      const rendered = renderStickerCanvas(image, internalW, internalH, borderPx)
      el.width = rendered.width
      el.height = rendered.height
      el.getContext('2d').drawImage(rendered, 0, 0)
    })
    return () => cancelAnimationFrame(raf)
  }, [sticker.image, borderMm, widthMm, heightMm])

  function track(onMove) {
    setInteracting(true)
    const move = (ev) => onMove(ev)
    const up = () => {
      setInteracting(false)
      onDragEnd()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  function startDrag(e) {
    if (previewMode) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    onSelect(sticker.id)
    const start = clientToMm(e.clientX, e.clientY)
    const offset = { x: start.x - xMm, y: start.y - yMm }
    track((ev) => {
      const p = clientToMm(ev.clientX, ev.clientY)
      onDrag(sticker.id, p.x - offset.x, p.y - offset.y)
    })
  }

  function startResize(e) {
    e.stopPropagation()
    e.preventDefault()
    onSelect(sticker.id)
    const center = { x: xMm, y: yMm }
    const start = clientToMm(e.clientX, e.clientY)
    const startDist = Math.hypot(start.x - center.x, start.y - center.y) || 1
    const startW = widthMm
    const startH = heightMm
    const rad = (rotation * Math.PI) / 180
    const locked = sticker.aspectLocked
    track((ev) => {
      const p = clientToMm(ev.clientX, ev.clientY)
      if (locked) {
        const factor = (Math.hypot(p.x - center.x, p.y - center.y) || 1) / startDist
        let w = clampMm(startW * factor)
        let h = w * (startH / startW)
        if (h > MAX_MM || h < MIN_MM) {
          h = clampMm(h)
          w = h * (startW / startH)
        }
        onChange({ widthMm: w, heightMm: h })
      } else {
        // Pointer position in the sticker's local (unrotated) frame gives
        // each axis independently.
        const dx = p.x - center.x
        const dy = p.y - center.y
        const lx = dx * Math.cos(-rad) - dy * Math.sin(-rad)
        const ly = dx * Math.sin(-rad) + dy * Math.cos(-rad)
        onChange({
          widthMm: clampMm(Math.abs(lx) * 2 - borderMm * 2),
          heightMm: clampMm(Math.abs(ly) * 2 - borderMm * 2),
        })
      }
    })
  }

  function startRotate(e) {
    e.stopPropagation()
    e.preventDefault()
    onSelect(sticker.id)
    const center = { x: xMm, y: yMm }
    track((ev) => {
      const p = clientToMm(ev.clientX, ev.clientY)
      let deg = (Math.atan2(p.y - center.y, p.x - center.x) * 180) / Math.PI + 90
      const snapped = Math.round(deg / 15) * 15
      if (Math.abs(deg - snapped) < 4) deg = snapped
      onChange({ rotation: ((deg % 360) + 360) % 360 })
    })
  }

  const outerW = (widthMm + borderMm * 2) * scale
  const outerH = (heightMm + borderMm * 2) * scale
  const showControls = selected && !previewMode

  return (
    <div
      className={`sticker-node ${showControls ? 'selected' : ''} ${previewMode ? 'is-preview' : ''}`}
      style={{
        left: xMm * scale,
        top: yMm * scale,
        width: outerW,
        height: outerH,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        zIndex: selected ? 20 : 10,
      }}
      onPointerDown={startDrag}
    >
      <canvas ref={canvasRef} className="sticker-node-canvas" />
      {showControls && (
        <>
          <div className="sticker-outline" />
          {['nw', 'ne', 'sw', 'se'].map((corner) => (
            <div
              key={corner}
              className={`handle handle-${corner}`}
              onPointerDown={startResize}
              title={sticker.aspectLocked ? 'Drag to resize' : 'Drag to resize (aspect unlocked)'}
            />
          ))}
          <div className="rotate-stem" />
          <div className="handle handle-rotate" onPointerDown={startRotate} title="Drag to rotate" />
          <div className={`size-label ${interacting ? 'active' : ''}`}>
            {formatSize(widthMm, heightMm)}
          </div>
        </>
      )}
    </div>
  )
}
