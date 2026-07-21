import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function OrderConfirmation() {
  const { lastOrder } = useStore()
  const [params] = useSearchParams()
  const returnedOrderId = params.get('order')
  const stripeSession = params.get('session')

  // Coming back from Stripe: the in-memory order is gone (we left the site),
  // so verify the payment with the server and show a simple thank-you.
  if (!lastOrder && returnedOrderId) {
    return <StripeReturn orderId={returnedOrderId} session={stripeSession} />
  }

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

// Shown when the shopper returns from Stripe. Asks the server to confirm the
// payment really went through before saying "confirmed".
function StripeReturn({ orderId, session }) {
  const [status, setStatus] = useState('checking') // checking | paid | pending | error

  useEffect(() => {
    let cancelled = false
    if (!session) {
      setStatus('paid') // no session to check (e.g. direct link) — assume ok
      return
    }
    fetch(`/api/confirm-order?session=${encodeURIComponent(session)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setStatus(data.paid ? 'paid' : 'pending')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [session])

  return (
    <div className="container page confirmation">
      <div className="confirmation-hero">
        {status === 'checking' && (
          <>
            <div className="confirmation-check" aria-hidden="true">
              …
            </div>
            <h1>Confirming your payment…</h1>
            <p className="muted">One moment while we check everything went through.</p>
          </>
        )}
        {status === 'paid' && (
          <>
            <div className="confirmation-check" aria-hidden="true">
              ✓
            </div>
            <h1>Payment received — thank you!</h1>
            <p className="muted">
              Your order <strong>{orderId}</strong> is confirmed and a receipt has been emailed to
              you. We’ll get it printed and cut, and drop you a line when it ships.
            </p>
          </>
        )}
        {status === 'pending' && (
          <>
            <div className="confirmation-check confirmation-check-warn" aria-hidden="true">
              !
            </div>
            <h1>Payment not completed</h1>
            <p className="muted">
              It looks like the payment for <strong>{orderId}</strong> wasn’t finished. Nothing has
              been charged — you can try again from your cart.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="confirmation-check" aria-hidden="true">
              ✓
            </div>
            <h1>Thanks for your order!</h1>
            <p className="muted">
              Your order <strong>{orderId}</strong> is in. If anything looks off, just reply to your
              Stripe receipt and we’ll sort it.
            </p>
          </>
        )}
      </div>
      <div className="hero-actions confirmation-actions">
        <Link to="/shop" className="btn btn-primary">
          Back to the shop
        </Link>
        <Link to="/" className="btn btn-ghost">
          Home
        </Link>
      </div>
    </div>
  )
}
