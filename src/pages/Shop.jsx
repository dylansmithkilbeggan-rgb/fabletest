import { Link } from 'react-router-dom'
import StickerCard from '../components/StickerCard.jsx'
import { CAR_STICKER_SIZES } from './CustomCarSticker.jsx'
import { formatPrice } from '../utils/format.js'
import { useStore } from '../context/StoreContext.jsx'
import carExample from '../assets/hero/2-gt86.png'

export default function Shop() {
  const { products } = useStore()
  return (
    <div className="container page">
      <div className="page-head">
        <h1>Shop stickers</h1>
        <p className="muted">
          Ready-made designs, finished with a clear vinyl seal — 50c each, minimum 5 stickers per
          order. Mix and match any designs you like.
          Want something of your own?{' '}
          <Link to="/design" className="text-link">
            Design a custom sheet
          </Link>
          .
        </p>
      </div>
      <div className="shop-grid">
        <Link to="/car-sticker" className="sticker-card car-card">
          <span className="sticker-tag">Custom</span>
          <div className="sticker-card-art">
            <img src={carExample} alt="Example of a hand-drawn car sticker" loading="lazy" />
          </div>
          <div className="sticker-card-body">
            <div>
              <h3>Your car, drawn</h3>
              <p className="muted">Hand-drawn from your photo</p>
            </div>
            <div className="sticker-card-buy">
              <span className="price">from {formatPrice(CAR_STICKER_SIZES[0].price)}</span>
              <span className="btn btn-primary btn-sm">Start yours</span>
            </div>
          </div>
        </Link>
        {products.map((p) => (
          <StickerCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
