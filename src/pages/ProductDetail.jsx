import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'
import { MIN_PREMADE_QTY } from '../utils/pricing.js'

// Full product page: big photo, extra angle shots, and add-to-cart.
export default function ProductDetail() {
  const { id } = useParams()
  const { products, addItem } = useStore()
  const [activeIdx, setActiveIdx] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  const product = products.find((p) => p.id === id)

  if (!product) {
    return (
      <div className="container page">
        <h1>Sticker not found</h1>
        <p className="muted">It may have been removed from the shop.</p>
        <Link to="/shop" className="btn btn-primary">
          Back to the shop
        </Link>
      </div>
    )
  }

  const isSheet = product.kind === 'sheet'
  const gallery = [product.image, ...(product.images ?? [])].filter(Boolean)
  const active = gallery[Math.min(activeIdx, gallery.length - 1)]

  function handleAdd() {
    addItem({
      productId: product.id,
      type: isSheet ? 'premade-sheet' : 'premade',
      name: product.name,
      detail: product.size,
      unitPrice: product.price,
      thumbnail: product.image,
      qty: 1,
    })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div className="container page">
      <Link to="/shop" className="text-link">
        ← Back to the shop
      </Link>
      <div className="product-detail">
        <div className="product-gallery">
          <div className="product-gallery-main">
            <img src={active} alt={product.name} />
          </div>
          {gallery.length > 1 && (
            <div className="product-gallery-thumbs">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className={i === Math.min(activeIdx, gallery.length - 1) ? 'active' : ''}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Photo ${i + 1} of ${product.name}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-info card">
          {product.tag && <span className="sticker-tag">{product.tag}</span>}
          <h1>{product.name}</h1>
          <p className="muted">{product.size}</p>
          <p className="product-price">
            <span className="price">{formatPrice(product.price)}</span>
            <span className="muted small">
              {isSheet ? ' per sheet' : ` each · min ${MIN_PREMADE_QTY} total per order`}
            </span>
          </p>
          <p className="muted">
            {isSheet
              ? 'A full A4 sheet of premade designs, die-cut and ready to peel.'
              : 'Die-cut around the artwork and finished with a clear vinyl seal. Mix any designs to reach the 5-sticker minimum.'}
          </p>
          <button
            type="button"
            className={`btn btn-primary btn-block ${justAdded ? 'added' : ''}`}
            onClick={handleAdd}
          >
            {justAdded ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
