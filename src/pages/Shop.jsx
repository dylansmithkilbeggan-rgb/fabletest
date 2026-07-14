import { Link } from 'react-router-dom'
import { PRODUCTS } from '../data/products.js'
import StickerCard from '../components/StickerCard.jsx'

export default function Shop() {
  return (
    <div className="container page">
      <div className="page-head">
        <h1>Shop stickers</h1>
        <p className="muted">
          Ready-made designs, printed on matte vinyl. Want something of your own?{' '}
          <Link to="/design" className="text-link">
            Design a custom sheet
          </Link>
          .
        </p>
      </div>
      <div className="shop-grid">
        {PRODUCTS.map((p) => (
          <StickerCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
