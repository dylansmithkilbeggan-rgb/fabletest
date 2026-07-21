import { useEffect, useRef, useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'
import { readImageFileAsDataUrl } from '../utils/images.js'
import { supabase, supabaseEnabled } from '../lib/supabase.js'
import AdminOrderDetail, { ORDER_STATUS_OPTIONS } from './AdminOrderDetail.jsx'

// When Supabase is connected, admin access is a real login (Supabase Auth +
// row-level security — orders and stock writes are refused by the database
// itself without it). The simple password below only applies in offline /
// preview mode, where there's no real data to protect.
const FALLBACK_PASSWORD = '21135446'

// Fallback gate stays unlocked while the app is open; resets on refresh.
let sessionUnlocked = false

const TAG_OPTIONS = ['', 'New', 'Bestseller', 'Limited']

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Admin() {
  const [tab, setTab] = useState('orders')
  const auth = useAdminAuth()

  if (!auth.ready) {
    return (
      <div className="container page">
        <p className="muted admin-lock">Checking session…</p>
      </div>
    )
  }

  if (!auth.unlocked) {
    return supabaseEnabled ? <SupabaseLogin auth={auth} /> : <FallbackLogin auth={auth} />
  }

  return (
    <div className="container page">
      <div className="page-head admin-head">
        <div>
          <h1>Admin</h1>
          {auth.email && <p className="muted small">Signed in as {auth.email}</p>}
        </div>
        {supabaseEnabled && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={auth.signOut}>
            Sign out
          </button>
        )}
      </div>
      <div className="page-head">
        <div className="admin-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'orders'}
            className={`admin-tab ${tab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            Orders
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'stock'}
            className={`admin-tab ${tab === 'stock' ? 'active' : ''}`}
            onClick={() => setTab('stock')}
          >
            Stock
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'sections'}
            className={`admin-tab ${tab === 'sections' ? 'active' : ''}`}
            onClick={() => setTab('sections')}
          >
            Sections
          </button>
        </div>
      </div>
      {tab === 'orders' && <OrdersPanel />}
      {tab === 'stock' && <StockPanel />}
      {tab === 'sections' && <SectionsPanel />}
    </div>
  )
}

// Real auth when Supabase is connected; simple password gate otherwise.
function useAdminAuth() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!supabaseEnabled)
  const [legacyUnlocked, setLegacyUnlocked] = useState(sessionUnlocked)

  useEffect(() => {
    if (!supabaseEnabled) return
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        setReady(true)
      })
      .catch(() => setReady(true))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return {
    ready,
    unlocked: supabaseEnabled ? Boolean(session) : legacyUnlocked,
    email: session?.user?.email ?? null,
    unlockLegacy() {
      sessionUnlocked = true
      setLegacyUnlocked(true)
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error?.message ?? null
    },
    async signOut() {
      await supabase.auth.signOut()
    },
  }
}

function SupabaseLogin({ auth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const message = await auth.signIn(email.trim(), password)
    setBusy(false)
    if (message) setError(message)
  }

  return (
    <div className="container page">
      <form className="card form-section admin-lock" onSubmit={handleSubmit}>
        <h1>Admin sign in</h1>
        <p className="muted">This area is for the shop owner.</p>
        <div className="field">
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            autoFocus
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={`field ${error ? 'has-error' : ''}`}>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <span className="field-error">{error}</span>}
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function FallbackLogin({ auth }) {
  const [password, setPassword] = useState('')
  const [wrongPassword, setWrongPassword] = useState(false)

  function handleUnlock(e) {
    e.preventDefault()
    if (password === FALLBACK_PASSWORD) {
      auth.unlockLegacy()
    } else {
      setWrongPassword(true)
      setPassword('')
    }
  }

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

function OrdersPanel() {
  const { orders, setOrderStatus, clearOrders, persisted } = useStore()
  const [openOrderId, setOpenOrderId] = useState(null)

  function handleClearAll() {
    const ok = window.confirm(
      `Delete all ${orders.length} order${orders.length === 1 ? '' : 's'} permanently? ` +
        'This cannot be undone.',
    )
    if (ok) clearOrders()
  }
  const revenue = orders.reduce((sum, o) => sum + o.totals.total, 0)
  const openCount = orders.filter((o) => o.status !== 'shipped').length
  const openOrder = orders.find((o) => o.id === openOrderId) ?? null

  return (
    <>
      <p className="muted">
        {persisted
          ? 'All orders, stored in Supabase.'
          : 'Everything placed this session. Not connected to Supabase, so orders reset on refresh — add your keys to .env.local to persist them.'}
      </p>
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
                <tr
                  key={order.id}
                  className="order-row"
                  onClick={() => setOpenOrderId(order.id)}
                  title="Click to see the full order"
                >
                  <td>
                    <strong>{order.id}</strong>
                    <div className="muted small">{formatDate(order.placedAt)}</div>
                    <span className="text-link small">View details</span>
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
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className={`status-select status-${order.status}`}
                      value={order.status}
                      onChange={(e) => setOrderStatus(order.id, e.target.value)}
                      aria-label={`Status of order ${order.id}`}
                    >
                      {ORDER_STATUS_OPTIONS.map((s) => (
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
      {orders.length > 0 && (
        <div className="admin-danger-zone">
          <button type="button" className="btn btn-danger btn-sm" onClick={handleClearAll}>
            Clear all orders
          </button>
          <span className="muted small">
            Deletes every order permanently and resets the stats to zero.
          </span>
        </div>
      )}
      {openOrder && (
        <AdminOrderDetail
          order={openOrder}
          onClose={() => setOpenOrderId(null)}
          onStatusChange={(status) => setOrderStatus(openOrder.id, status)}
        />
      )}
    </>
  )
}

function StockPanel() {
  const { products, sections, addProduct, updateProduct, removeProduct, persisted } = useStore()

  return (
    <>
      <p className="muted">
        These are the stickers customers see in the shop. Changes apply immediately
        {persisted
          ? ' and are stored in Supabase.'
          : ' — but reset on refresh until Supabase is connected (add your keys to .env.local).'}
      </p>
      <AddProductForm onAdd={addProduct} sections={sections} />
      {[
        { kind: 'sheet', title: 'Premade A4 sheets' },
        { kind: 'sticker', title: 'Single stickers' },
      ].map(({ kind, title }) => {
        const group = products.filter((p) => (p.kind ?? 'sticker') === kind)
        if (group.length === 0) return null
        return (
          <div key={kind}>
            <h2 className="stock-group-title">{title}</h2>
            <div className="stock-list">
              {group.map((p) => (
                <StockRow
                  key={p.id}
                  product={p}
                  sections={sections}
                  onChange={(patch) => updateProduct(p.id, patch)}
                  onRemove={() => removeProduct(p.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}

function SectionsPanel() {
  const { sections, products, addSection, updateSection, removeSection, persisted } = useStore()

  function handleRemove(section) {
    const count = products.filter((p) => p.section === section.id).length
    const tail =
      count > 0
        ? ` Its ${count} sticker${count === 1 ? '' : 's'} will move back to the normal shop lists.`
        : ''
    if (window.confirm(`Delete the “${section.title}” section?${tail}`)) {
      removeSection(section.id)
    }
  }

  return (
    <>
      <p className="muted">
        Sections are collections on the shop — like a collab. Make one here, then pick it as the
        “Section” on any sticker in the Stock tab to file it under that heading.
        {persisted ? '' : ' Not connected to Supabase, so these reset on refresh.'}
      </p>
      <AddSectionForm onAdd={addSection} />
      {sections.length === 0 ? (
        <div className="card admin-empty">
          <p>
            <strong>No sections yet.</strong>
          </p>
          <p className="muted">Add one above to group stickers into a collection.</p>
        </div>
      ) : (
        <div className="stock-list">
          {sections.map((section) => {
            const count = products.filter((p) => p.section === section.id).length
            return (
              <div key={section.id} className="card stock-row section-row">
                <div className="field section-title-field">
                  <label htmlFor={`section-title-${section.id}`}>Section name</label>
                  <input
                    id={`section-title-${section.id}`}
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                  />
                </div>
                <div className="field section-blurb-field">
                  <label htmlFor={`section-blurb-${section.id}`}>Description (optional)</label>
                  <input
                    id={`section-blurb-${section.id}`}
                    value={section.blurb ?? ''}
                    onChange={(e) => updateSection(section.id, { blurb: e.target.value })}
                    placeholder="Shown under the heading in the shop"
                  />
                </div>
                <label className="section-home-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(section.showOnHome)}
                    onChange={(e) => updateSection(section.id, { showOnHome: e.target.checked })}
                  />
                  Show on home page
                </label>
                <span className="muted small section-count">
                  {count} sticker{count === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(section)}
                >
                  Delete
                </button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function AddSectionForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [blurb, setBlurb] = useState('')
  const [showOnHome, setShowOnHome] = useState(true)
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Give the section a name.')
      return
    }
    onAdd({ title: title.trim(), blurb: blurb.trim(), showOnHome })
    setTitle('')
    setBlurb('')
    setShowOnHome(true)
    setError(null)
  }

  return (
    <form className="card stock-add" onSubmit={handleSubmit}>
      <h2>Add a section</h2>
      <div className="stock-add-grid section-add-grid">
        <div className="field">
          <label htmlFor="new-section-title">Section name</label>
          <input
            id="new-section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Faithfull Stickers × Weronika"
          />
        </div>
        <div className="field">
          <label htmlFor="new-section-blurb">Description (optional)</label>
          <input
            id="new-section-blurb"
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="A short line shown under the heading"
          />
        </div>
        <label className="section-home-toggle">
          <input
            type="checkbox"
            checked={showOnHome}
            onChange={(e) => setShowOnHome(e.target.checked)}
          />
          Show on home page
        </label>
        <button type="submit" className="btn btn-primary">
          Add section
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  )
}

function AddProductForm({ onAdd, sections }) {
  const fileInputRef = useRef(null)
  const [image, setImage] = useState(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('sticker')
  const [price, setPrice] = useState('0.50')
  const [size, setSize] = useState('7 cm die-cut')
  const [keywords, setKeywords] = useState('')
  const [section, setSection] = useState('')
  const [error, setError] = useState(null)

  function handleKind(nextKind) {
    setKind(nextKind)
    // Sensible defaults per type; still editable before adding.
    if (nextKind === 'sheet') {
      setPrice('5.00')
      setSize('A4 sheet')
    } else {
      setPrice('0.50')
      setSize('7 cm die-cut')
    }
  }

  async function handlePhoto(fileList) {
    const file = Array.from(fileList).find((f) => f.type.startsWith('image/'))
    if (!file) return
    setError(null)
    try {
      // PNG keeps transparency so die-cut sticker art floats on the card.
      setImage(await readImageFileAsDataUrl(file, { maxPx: 600, format: 'image/png' }))
    } catch {
      setError('That file could not be read as an image.')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!image || !name.trim()) {
      setError('A photo and a name are required.')
      return
    }
    const parsedPrice = Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Enter a valid price.')
      return
    }
    onAdd({
      name: name.trim(),
      price: parsedPrice,
      size: size.trim(),
      image,
      tag: 'New',
      kind,
      keywords: keywords.trim(),
      section,
    })
    setImage(null)
    setName('')
    setKeywords('')
    setSection('')
    setPrice(kind === 'sheet' ? '5.00' : '0.50')
    setError(null)
  }

  return (
    <form className="card stock-add" onSubmit={handleSubmit}>
      <h2>Add to the shop</h2>
      <div className="stock-add-grid">
        <div className="field">
          <label htmlFor="new-kind">Type</label>
          <select id="new-kind" value={kind} onChange={(e) => handleKind(e.target.value)}>
            <option value="sticker">Single sticker</option>
            <option value="sheet">Premade A4 sheet</option>
          </select>
        </div>
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
        <button
          type="button"
          className="stock-photo-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          {image ? <img src={image} alt="New sticker" /> : <span>+ Photo</span>}
        </button>
        <div className="field">
          <label htmlFor="new-name">Name</label>
          <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Retro Wave" />
        </div>
        <div className="field">
          <label htmlFor="new-price">Price (€)</label>
          <input id="new-price" type="number" min="0" step="0.25" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="new-size">Size / description</label>
          <input id="new-size" value={size} onChange={(e) => setSize(e.target.value)} />
        </div>
        {sections.length > 0 && (
          <div className="field stock-section">
            <label htmlFor="new-section">Section</label>
            <select id="new-section" value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">No section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field stock-keywords">
          <label htmlFor="new-keywords">Search tags (comma separated)</label>
          <input
            id="new-keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. dark, moon, halloween"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add to shop
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  )
}

function StockRow({ product, sections, onChange, onRemove }) {
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const images = product.images ?? []

  async function handlePhoto(fileList) {
    const file = Array.from(fileList).find((f) => f.type.startsWith('image/'))
    if (!file) return
    try {
      onChange({ image: await readImageFileAsDataUrl(file, { maxPx: 600, format: 'image/png' }) })
    } catch {
      // keep the old photo if the file is unreadable
    }
  }

  async function handleGalleryPhotos(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    const added = []
    for (const file of files) {
      try {
        added.push(await readImageFileAsDataUrl(file, { maxPx: 600, format: 'image/png' }))
      } catch {
        // skip unreadable files
      }
    }
    if (added.length > 0) onChange({ images: [...images, ...added] })
  }

  return (
    <div className="card stock-row">
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
      <button
        type="button"
        className="stock-photo-btn"
        onClick={() => fileInputRef.current?.click()}
        title="Change photo"
      >
        <img src={product.image} alt={product.name} />
        <span className="stock-photo-hint">Change</span>
      </button>
      <div className="field">
        <label htmlFor={`name-${product.id}`}>Name</label>
        <input
          id={`name-${product.id}`}
          value={product.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`price-${product.id}`}>Price (€)</label>
        <input
          id={`price-${product.id}`}
          type="number"
          min="0"
          step="0.25"
          value={product.price}
          onChange={(e) => onChange({ price: Math.max(0, Number(e.target.value) || 0) })}
        />
      </div>
      <div className="field">
        <label htmlFor={`size-${product.id}`}>Size / description</label>
        <input
          id={`size-${product.id}`}
          value={product.size}
          onChange={(e) => onChange({ size: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`tag-${product.id}`}>Tag</label>
        <select
          id={`tag-${product.id}`}
          value={product.tag ?? ''}
          onChange={(e) => onChange({ tag: e.target.value || null })}
        >
          {TAG_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t || 'None'}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`kind-${product.id}`}>Type</label>
        <select
          id={`kind-${product.id}`}
          value={product.kind ?? 'sticker'}
          onChange={(e) => onChange({ kind: e.target.value })}
        >
          <option value="sticker">Single sticker</option>
          <option value="sheet">A4 sheet</option>
        </select>
      </div>
      {sections.length > 0 && (
        <div className="field stock-section">
          <label htmlFor={`section-${product.id}`}>Section</label>
          <select
            id={`section-${product.id}`}
            value={product.section ?? ''}
            onChange={(e) => onChange({ section: e.target.value })}
          >
            <option value="">No section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
        Remove
      </button>
      <div className="field stock-keywords">
        <label htmlFor={`keywords-${product.id}`}>Search tags (comma separated)</label>
        <input
          id={`keywords-${product.id}`}
          value={product.keywords ?? ''}
          onChange={(e) => onChange({ keywords: e.target.value })}
          placeholder="e.g. dark, moon, halloween"
        />
      </div>
      <div className="stock-gallery">
        <span className="muted small">Extra photos (shown on the sticker’s page):</span>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleGalleryPhotos(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="stock-gallery-thumbs">
          {images.map((src, i) => (
            <span key={i} className="stock-gallery-thumb">
              <img src={src} alt={`Extra photo ${i + 1}`} />
              <button
                type="button"
                aria-label={`Remove extra photo ${i + 1}`}
                onClick={() => onChange({ images: images.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            className="stock-gallery-add"
            onClick={() => galleryInputRef.current?.click()}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}
