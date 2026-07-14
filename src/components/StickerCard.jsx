import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { formatPrice } from '../utils/format.js'

export default function StickerCard({ product }) {
  const { addItem } = useStore()
  const [justAdded, setJustAdded] = useState(false)

  function handleAdd() {
    addItem({
      productId: product.id,
      type: 'premade',
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
    <article className="sticker-card">
      {product.tag && <span className="sticker-tag">{product.tag}</span>}
      <div className="sticker-card-art">
        <img src={product.image} alt={`${product.name} sticker`} loading="lazy" />
      </div>
      <div className="sticker-card-body">
        <div>
          <h3>{product.name}</h3>
          <p className="muted">{product.size}</p>
        </div>
        <div className="sticker-card-buy">
          <span className="price">{formatPrice(product.price)}</span>
          <button type="button" className={`btn btn-primary btn-sm ${justAdded ? 'added' : ''}`} onClick={handleAdd}>
            {justAdded ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
