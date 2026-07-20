import { useEffect } from 'react'
import { formatPrice, formatSize } from '../utils/format.js'
import { getFinish } from '../utils/pricing.js'

export const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'production', label: 'In production' },
  { value: 'shipped', label: 'Shipped' },
]

function formatDateLong(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Full order view for the admin: complete shipping details plus every
// asset needed to actually produce the order — source images at real
// resolution, print sizes, borders, finish, and download links.
export default function AdminOrderDetail({ order, onClose, onStatusChange }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const { shipping } = order

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="order-modal" role="dialog" aria-label={`Order ${order.id}`}>
        <div className="order-modal-head">
          <div>
            <h2>Order {order.id}</h2>
            <p className="muted small">{formatDateLong(order.placedAt)}</p>
          </div>
          <div className="order-modal-actions">
            <select
              className={`status-select status-${order.status}`}
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Order status"
            >
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="order-modal-grid">
          <section className="card order-section">
            <h3>Ship to</h3>
            <p className="order-address">
              <strong>{shipping.name}</strong>
              <br />
              {shipping.address1}
              {shipping.address2 && (
                <>
                  <br />
                  {shipping.address2}
                </>
              )}
              <br />
              {shipping.city}, {shipping.postcode}
              <br />
              {shipping.country}
            </p>
            <p className="muted small">
              <a href={`mailto:${shipping.email}`} className="text-link">
                {shipping.email}
              </a>
            </p>
          </section>

          <section className="card order-section">
            <h3>Totals</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(order.totals.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{formatPrice(order.totals.total)}</span>
            </div>
          </section>
        </div>

        <h3 className="order-items-title">
          Items ({order.items.reduce((n, i) => n + i.qty, 0)})
        </h3>
        {order.items.map((item) => (
          <ItemDetail key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function ItemDetail({ item }) {
  return (
    <section className="card order-item">
      <div className="order-item-head">
        <div>
          <strong>{item.name}</strong> × {item.qty}
          <div className="muted small">{item.detail}</div>
        </div>
        <span className="price">{formatPrice(item.unitPrice * item.qty)}</span>
      </div>

      {item.type === 'custom-sheet' && item.design && (
        <>
          {item.design.finish && (
            <p className="muted small">Finish: {getFinish(item.design.finish).label}</p>
          )}
          <div className="order-assets">
            <figure className="asset asset-sheet">
              <img src={item.thumbnail} alt="Sheet layout" />
              <figcaption>
                A4 layout preview
                <a href={item.thumbnail} download={`${item.id}-sheet-layout.jpg`} className="text-link">
                  Download
                </a>
              </figcaption>
            </figure>
            {item.design.stickers.map((s, i) => (
              <figure key={i} className="asset">
                <img src={s.src} alt={`Sticker ${i + 1} artwork`} />
                <figcaption>
                  <strong>Sticker {i + 1}</strong>
                  <span>{formatSize(s.widthMm, s.heightMm)}</span>
                  <span>
                    border {s.borderMm} mm
                    {Math.round(s.rotation) !== 0 && ` · rotated ${Math.round(s.rotation)}°`}
                  </span>
                  <a href={s.src} download={`${item.id}-sticker-${i + 1}.png`} className="text-link">
                    Download
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      {item.type === 'custom-car' && item.commission && (
        <div className="order-assets">
          <figure className="asset asset-sheet">
            <img src={item.commission.photo} alt="Customer's car" />
            <figcaption>
              Customer photo
              <a href={item.commission.photo} download={`${item.id}-car-photo.jpg`} className="text-link">
                Download
              </a>
            </figcaption>
          </figure>
          <div className="commission-notes">
            {item.commission.plate && (
              <p>
                Plate text: <strong>{item.commission.plate}</strong>
              </p>
            )}
            {item.commission.notes ? (
              <p>
                Notes: <em>{item.commission.notes}</em>
              </p>
            ) : (
              <p className="muted small">No notes from the customer.</p>
            )}
          </div>
        </div>
      )}

      {(item.type === 'premade' || item.type === 'premade-sheet') && (
        <div className="order-assets">
          <figure className={item.type === 'premade-sheet' ? 'asset asset-sheet' : 'asset'}>
            <img src={item.thumbnail} alt={item.name} />
            <figcaption>
              <span>
                print {item.qty} × {item.detail}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  )
}
