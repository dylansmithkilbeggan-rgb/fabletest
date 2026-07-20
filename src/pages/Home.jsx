import { Link } from 'react-router-dom'
import { PRODUCTS } from '../data/products.js'
import StickerCard from '../components/StickerCard.jsx'
import { useStore } from '../context/StoreContext.jsx'

// Drop your own sticker photos into src/assets/hero/ (png/jpg/webp/svg) and
// they replace the placeholder SVGs below automatically — sorted by filename,
// first five are shown.
const heroUploads = Object.entries(
  import.meta.glob('../assets/hero/*.{png,jpg,jpeg,webp,svg}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

const HERO_STICKERS = ['sunny', 'bolt', 'cat', 'rainbow', 'ghost']

export default function Home() {
  const { products } = useStore()
  const heroImages =
    heroUploads.length > 0
      ? heroUploads.slice(0, 5)
      : HERO_STICKERS.map((id) => PRODUCTS.find((p) => p.id === id).image)

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">Custom die-cut stickers</span>
            <h1>
              Your art, cut to shape,
              <br />
              <span className="text-accent">stuck everywhere.</span>
            </h1>
            <p>
              Upload your designs, lay out a full A4 sheet exactly how you want it, and we’ll
              print it, seal it with clear or holographic vinyl, and cut every curve by hand.
            </p>
            <div className="hero-actions">
              <Link to="/design" className="btn btn-primary btn-lg">
                Start designing
              </Link>
              <Link to="/shop" className="btn btn-ghost btn-lg">
                Browse the shop
              </Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            {heroImages.map((src, i) => (
              <div key={src} className={`hero-sticker hero-sticker-${i + 1}`}>
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container features-grid">
          <div className="feature">
            <div className="feature-icon">✂️</div>
            <h3>Die-cut to shape</h3>
            <p>Every sticker gets a clean white border that follows the outline of your art — no boring rectangles.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📄</div>
            <h3>Full A4 sheets</h3>
            <p>Mix as many designs as you like on one sheet. Drag, resize and rotate until it’s perfect.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">✨</div>
            <h3>Pick your finish</h3>
            <p>Plain or glossy print, or sealed with a layer of clear or holographic vinyl — one flat price per sheet.</p>
          </div>
        </div>
      </section>

      <section className="home-shop">
        <div className="container">
          <div className="section-head">
            <h2>Fresh from the shop</h2>
            <Link to="/shop" className="text-link">
              See all designs →
            </Link>
          </div>
          <div className="shop-grid">
            {products.slice(0, 4).map((p) => (
              <StickerCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <h2>Got a design in mind?</h2>
          <p>Open the sticker designer and build your own A4 sheet in minutes.</p>
          <Link to="/design" className="btn btn-inverse btn-lg">
            Design your sheet
          </Link>
        </div>
      </section>
    </>
  )
}
