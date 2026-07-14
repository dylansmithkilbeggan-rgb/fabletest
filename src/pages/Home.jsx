import { Link } from 'react-router-dom'
import { PRODUCTS } from '../data/products.js'
import StickerCard from '../components/StickerCard.jsx'

const HERO_STICKERS = ['sunny', 'bolt', 'cat', 'rainbow', 'ghost']

export default function Home() {
  const heroProducts = HERO_STICKERS.map((id) => PRODUCTS.find((p) => p.id === id))

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
              print, cut and ship it. Waterproof vinyl, borders that hug every curve.
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
            {heroProducts.map((p, i) => (
              <div key={p.id} className={`hero-sticker hero-sticker-${i + 1}`}>
                <img src={p.image} alt="" />
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
            <div className="feature-icon">🚚</div>
            <h3>Printed &amp; shipped fast</h3>
            <p>Durable matte vinyl, printed within 2 working days. Free shipping on orders over $30.</p>
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
            {PRODUCTS.slice(0, 4).map((p) => (
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
