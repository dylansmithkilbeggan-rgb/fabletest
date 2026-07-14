import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="container page about">
      <div className="page-head">
        <h1>About Faithfull Stickers</h1>
        <p className="muted">Small studio, sharp blades, sticky output.</p>
      </div>

      <div className="about-body">
        <p>
          Faithfull Stickers started with a cheap cutting plotter, a kitchen table, and the firm
          belief that every laptop, water bottle and guitar case deserves better decoration. Today
          we print and die-cut custom vinyl stickers for artists, small businesses and anyone with
          a design and a surface to cover.
        </p>
        <p>
          Everything is printed on durable matte vinyl that survives rain, dishwashers and questionable
          life choices. Our die-cutting follows the actual outline of your artwork — that clean white
          edge that makes a sticker feel like a <em>sticker</em>.
        </p>
        <p>
          The name? A promise: your print will stay faithful to your design. Colors, curves and all.
        </p>
      </div>

      <div className="features-grid about-values">
        <div className="feature">
          <div className="feature-icon">🎨</div>
          <h3>Design-first</h3>
          <p>Your artwork drives everything — we just make it stick.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🌧️</div>
          <h3>Built to last</h3>
          <p>Waterproof, scratch-resistant matte vinyl on every order.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">📦</div>
          <h3>Small-batch friendly</h3>
          <p>Order a single A4 sheet or a hundred — same care either way.</p>
        </div>
      </div>

      <div className="cta-band">
        <div className="cta-inner">
          <h2>Let’s make something sticky</h2>
          <Link to="/design" className="btn btn-inverse btn-lg">
            Open the designer
          </Link>
        </div>
      </div>
    </div>
  )
}
