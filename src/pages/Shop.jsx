import { useState } from 'react'
import { Link } from 'react-router-dom'
import StickerCard from '../components/StickerCard.jsx'
import { CAR_STICKER_SIZES } from './CustomCarSticker.jsx'
import { formatPrice } from '../utils/format.js'
import { useStore } from '../context/StoreContext.jsx'
import carExample from '../assets/hero/2-gt86.png'

export default function Shop() {
  const { products, sections } = useStore()
  const [query, setQuery] = useState('')

  // A product only counts as "in a section" if that section still exists;
  // everything else falls into the default sheet / single-sticker lists.
  const liveSectionIds = new Set(sections.map((s) => s.id))
  const inSection = (p) => p.section && liveSectionIds.has(p.section)

  const unsectioned = products.filter((p) => !inSection(p))
  const stickers = unsectioned.filter((p) => p.kind !== 'sheet')
  const sheets = unsectioned.filter((p) => p.kind === 'sheet')

  const q = query.trim().toLowerCase()
  const matches = q
    ? stickers.filter((p) =>
        `${p.name} ${p.size} ${p.tag ?? ''} ${p.keywords ?? ''}`.toLowerCase().includes(q),
      )
    : stickers

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

      {sections.map((section) => {
        const items = products.filter((p) => p.section === section.id)
        if (items.length === 0) return null
        return (
          <section key={section.id} className="shop-section shop-section-collab">
            <div className="section-head">
              <h2>{section.title}</h2>
              {section.blurb && <p className="muted">{section.blurb}</p>}
            </div>
            <div className="shop-grid">
              {items.map((p) => (
                <StickerCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )
      })}

      {sheets.length > 0 && (
        <section className="shop-section">
          <div className="section-head">
            <h2>Premade sheets</h2>
            <p className="muted">Full A4 sheets of our designs — €5 a sheet, no minimum.</p>
          </div>
          <div className="shop-grid">
            {sheets.map((p) => (
              <StickerCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <section className="shop-section">
        <div className="section-head shop-search-head">
          <h2>Single stickers</h2>
          <input
            type="search"
            className="shop-search"
            placeholder="Search stickers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search single stickers"
          />
        </div>
        {q && matches.length === 0 && (
          <p className="muted">No stickers match “{query.trim()}”.</p>
        )}
        <div className="shop-grid">
        {(!q || 'your car drawn custom hand-drawn'.includes(q)) && (
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
        )}
          {matches.map((p) => (
            <StickerCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
