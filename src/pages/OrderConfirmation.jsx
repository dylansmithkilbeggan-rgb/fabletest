import { Link, Navigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function OrderConfirmation() {
  const { lastOrder } = useStore()

  if (!lastOrder) {
    return <Navigate to="/" replace />
  }

  const { id, shipping, items, totals } = lastOrder

  return (
    <div className="container page confirmation">
      <div className="confirmation-hero">
        <div className="confirmation-check" aria-hidden="true">
          ✓
        </div>
        <h1>Order confirmed!</h1>
        <p className="muted">
          Thanks, {shipping.name.split(' ')[0]}! Your order <strong>{id}</strong> is in. A
          confirmation email is on its way to <strong>{shipping.email}</strong>.
        </p>
      </div>

      <div className="cart-layout">
        <div className="card form-section">
          <h2>What you ordered</h2>
          <ul className="summary-items">
            {items.map((item) => (
              <li key={item.id}>
                <img src={item.thumbnail} alt="" className="summary-thumb" />
                <span className="summary-name">
                  {item.name} × {item.qty}
                </span>
                <span>{formatPrice(item.unitPrice * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>
        </div>

        <aside className="card form-section">
          <h2>Shipping to</h2>
          <p>
            {shipping.name}
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
          <div className="hero-actions">
            <Link to="/design" className="btn btn-primary">
              Design another sheet
            </Link>
            <Link to="/" className="btn btn-ghost">
              Back to home
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
