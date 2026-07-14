import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'

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
  const { items, totals, placeOrder } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (items.length === 0 && !submitting) {
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    // Simulate a payment + order API round-trip. Swap this block for a real
    // Stripe PaymentIntent confirmation + POST /orders later.
    await new Promise((resolve) => setTimeout(resolve, 800))
    placeOrder({ ...form })
    navigate('/confirmation')
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
              <span className="badge">Test mode</span>
            </div>
            <p className="muted small">
              Payments are mocked in this prototype — no card is charged. This section is laid out
              to be replaced by Stripe Elements.
            </p>
            <Field label="Card number" id="card" value="4242 4242 4242 4242" readOnly />
            <div className="form-row">
              <Field label="Expiry" id="expiry" value="12 / 34" readOnly />
              <Field label="CVC" id="cvc" value="123" readOnly />
            </div>
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
