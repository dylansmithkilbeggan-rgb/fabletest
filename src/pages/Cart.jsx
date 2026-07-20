import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'
import { MIN_PREMADE_QTY, PRICES, premadeShortfall } from '../utils/pricing.js'

export default function Cart() {
  const { items, totals, setQty, removeItem } = useStore()
  const navigate = useNavigate()
  const shortfall = premadeShortfall(items)

  if (items.length === 0) {
    return (
      <div className="container page cart-empty">
        <h1>Your cart is empty</h1>
        <p className="muted">Nothing here yet — let’s fix that.</p>
        <div className="hero-actions">
          <Link to="/design" className="btn btn-primary">
            Design a custom sheet
          </Link>
          <Link to="/shop" className="btn btn-ghost">
            Browse the shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container page">
      <h1>Your cart</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => (
            <li key={item.id} className="cart-item card">
              <div className="cart-thumb">
                <img src={item.thumbnail} alt={item.name} />
              </div>
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="muted">{item.detail}</p>
                <p className="muted">{formatPrice(item.unitPrice)} each</p>
                {item.type === 'custom-sheet' && (
                  <button
                    type="button"
                    className="text-link as-button"
                    onClick={() => navigate('/design', { state: { editItemId: item.id } })}
                  >
                    Edit design
                  </button>
                )}
              </div>
              <div className="cart-item-actions">
                <div className="qty-stepper" aria-label={`Quantity of ${item.name}`}>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, item.qty - 1)}
                    disabled={item.qty <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => setQty(item.id, item.qty + 1)} aria-label="Increase quantity">
                    +
                  </button>
                </div>
                <span className="price">{formatPrice(item.unitPrice * item.qty)}</span>
                <button type="button" className="remove-btn" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="cart-summary card">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</span>
          </div>
          {totals.shipping > 0 && (
            <p className="muted small">
              Free shipping on orders over {formatPrice(PRICES.freeShippingThreshold)}.
            </p>
          )}
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
          {shortfall > 0 && (
            <p className="cart-warning small">
              Premade stickers are a minimum of {MIN_PREMADE_QTY} per order (any mix of designs) —
              add {shortfall} more to check out.
            </p>
          )}
          {shortfall > 0 ? (
            <button type="button" className="btn btn-primary btn-block" disabled>
              Checkout
            </button>
          ) : (
            <Link to="/checkout" className="btn btn-primary btn-block">
              Checkout
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}
