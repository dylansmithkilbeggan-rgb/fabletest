import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'

// Prototype gate only: the check runs in the browser, so it keeps casual
// visitors out but is NOT real security. A backend must own auth before
// this page shows real customer data in production.
const ADMIN_PASSWORD = '21135446'

// Stays unlocked while the app is open; resets on refresh.
let sessionUnlocked = false

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'production', label: 'In production' },
  { value: 'shipped', label: 'Shipped' },
]

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Admin() {
  const { orders, setOrderStatus } = useStore()
  const [unlocked, setUnlocked] = useState(sessionUnlocked)
  const [password, setPassword] = useState('')
  const [wrongPassword, setWrongPassword] = useState(false)

  function handleUnlock(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionUnlocked = true
      setUnlocked(true)
    } else {
      setWrongPassword(true)
      setPassword('')
    }
  }

  if (!unlocked) {
    return (
      <div className="container page">
        <form className="card form-section admin-lock" onSubmit={handleUnlock}>
          <h1>Admin</h1>
          <p className="muted">This area is for the shop owner.</p>
          <div className={`field ${wrongPassword ? 'has-error' : ''}`}>
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              autoFocus
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value)
                setWrongPassword(false)
              }}
            />
            {wrongPassword && <span className="field-error">Wrong password, try again.</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Unlock
          </button>
        </form>
      </div>
    )
  }

  const revenue = orders.reduce((sum, o) => sum + o.totals.total, 0)
  const openCount = orders.filter((o) => o.status !== 'shipped').length

  return (
    <div className="container page">
      <div className="page-head">
        <h1>Orders</h1>
        <p className="muted">
          Everything placed this session. Orders live in memory in this prototype — a backend
          would persist them.
        </p>
      </div>

      <div className="admin-stats">
        <div className="card stat">
          <span className="stat-value">{orders.length}</span>
          <span className="muted small">Orders</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{openCount}</span>
          <span className="muted small">Open</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{formatPrice(revenue)}</span>
          <span className="muted small">Revenue</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card admin-empty">
          <p>
            <strong>No orders yet.</strong>
          </p>
          <p className="muted">
            Place a test order through the shop or designer and it will show up here.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                    <div className="muted small">{formatDate(order.placedAt)}</div>
                  </td>
                  <td>
                    {order.shipping.name}
                    <div className="muted small">{order.shipping.email}</div>
                    <div className="muted small">
                      {order.shipping.city}, {order.shipping.country}
                    </div>
                  </td>
                  <td>
                    <ul className="admin-items">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <img src={item.thumbnail} alt="" />
                          <span>
                            {item.name} × {item.qty}
                            <span className="muted small"> — {item.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="admin-total">{formatPrice(order.totals.total)}</td>
                  <td>
                    <select
                      className={`status-select status-${order.status}`}
                      value={order.status}
                      onChange={(e) => setOrderStatus(order.id, e.target.value)}
                      aria-label={`Status of order ${order.id}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
