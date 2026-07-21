import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'
import { premadeShortfall } from '../utils/pricing.js'

const REQUIRED_FIELDS = ['name', 'email', 'address1', 'city', 'postcode', 'country']

const EMPTY_FORM = {
  name: '',
  email: '',
  address1: '',
  address2: '',
  city: '',
  postcode: '',
  country: '',
}

export default function Checkout() {
  const { items, totals, placeOrder, beginCheckout, clearCart, persisted } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [payError, setPayError] = useState(null)

  if ((items.length === 0 || premadeShortfall(items) > 0) && !submitting) {
    return <Navigate to="/cart" replace />
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const next = {}
    for (const key of REQUIRED_FIELDS) {
      if (!form[key].trim()) next[key] = 'Required'
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  // Offline preview / no backend: keep the mock so the prototype still runs.
  function placeMockOrder() {
    placeOrder({ ...form })
    navigate('/confirmation')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setPayError(null)

    if (!persisted) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      placeMockOrder()
      return
    }

    const orderId = `FS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          email: form.email.trim(),
          origin: window.location.origin,
          shipping: totals.shipping,
          items: items.map((i) => ({ name: i.name, unitPrice: i.unitPrice, qty: i.qty })),
        }),
      })

      if (res.ok) {
        const { url } = await res.json()
        if (url) {
          // Save the order as pending, then hand off to Stripe's payment page.
          beginCheckout({ ...form }, orderId)
          clearCart()
          window.location.href = url
          return
        }
      }

      // Stripe keys not added yet → behave like the prototype for now.
      if (res.status === 501) {
        placeMockOrder()
        return
      }

      throw new Error(`checkout failed (${res.status})`)
    } catch (err) {
      console.warn('Checkout error:', err)
      setPayError('Sorry — we couldn’t start the payment. Please try again in a moment.')
      setSubmitting(false)
    }
  }

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
        <div className="checkout-form">
          <section className="card form-section">
            <h2>Contact &amp; shipping</h2>
            <Field label="Full name" id="name" value={form.name} error={errors.name} onChange={(v) => setField('name', v)} autoComplete="name" />
            <Field label="Email" id="email" type="email" value={form.email} error={errors.email} onChange={(v) => setField('email', v)} autoComplete="email" />
            <Field label="Address line 1" id="address1" value={form.address1} error={errors.address1} onChange={(v) => setField('address1', v)} autoComplete="address-line1" />
            <Field label="Address line 2 (optional)" id="address2" value={form.address2} onChange={(v) => setField('address2', v)} autoComplete="address-line2" />
            <div className="form-row">
              <Field label="City" id="city" value={form.city} error={errors.city} onChange={(v) => setField('city', v)} autoComplete="address-level2" />
              <Field label="Postcode / ZIP" id="postcode" value={form.postcode} error={errors.postcode} onChange={(v) => setField('postcode', v)} autoComplete="postal-code" />
            </div>
            <Field label="Country" id="country" value={form.country} error={errors.country} onChange={(v) => setField('country', v)} autoComplete="country-name" />
          </section>

          <section className="card form-section">
            <div className="payment-head">
              <h2>Payment</h2>
              <span className="badge">🔒 Secure</span>
            </div>
            <p className="muted small">
              {persisted
                ? 'When you press Pay, you’ll go to our secure Stripe payment page to enter your card — Faithfull Stickers never sees your card details. You’ll come straight back here once it’s done.'
                : 'Preview mode — no card is charged. Connect Stripe to take real payments.'}
            </p>
            {payError && <p className="field-error">{payError}</p>}
          </section>
        </div>

        <aside className="cart-summary card">
          <h2>Order summary</h2>
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
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Placing order…' : `Pay ${formatPrice(totals.total)}`}
          </button>
        </aside>
      </form>
    </div>
  )
}

function Field({ label, id, value, onChange, error, type = 'text', readOnly = false, autoComplete }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        autoComplete={autoComplete}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
