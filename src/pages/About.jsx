import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="container page about">
      <div className="page-head">
        <h1>About Faithfull Stickers</h1>
        <p className="muted">One maker, sharp blades, sticky output.</p>
      </div>

      <div className="about-body">
        <p>
          Faithfull Stickers is a one-person studio making custom die-cut stickers. Every sheet is
          printed, then finished by hand with a layer of clear or holographic vinyl laid over the
          top of the print — the stickers aren’t printed on vinyl, the vinyl goes on them. That
          overlay is what seals the design and gives it the glossy (or rainbow-shifting) finish.
        </p>
        <p>
          You can also order a sheet plain, without the vinyl layer, if you just want the printed
          stickers as they are. Either way, every sticker is cut along the actual outline of the
          artwork — that clean white edge that makes a sticker feel like a <em>sticker</em>.
        </p>
        <p>
          Pricing is simple: <strong>€5 for an A4 page</strong> without vinyl, or{' '}
          <strong>€7 with a clear or holographic vinyl finish</strong>. Premade shop stickers are{' '}
          <strong>50c each</strong>, minimum 5 stickers per order — mix and match designs.
        </p>
        <p>
          The name? A promise: your sticker will stay faithful to your design. Colors, curves and
          all.
        </p>
      </div>

      <div className="features-grid about-values">
        <div className="feature">
          <div className="feature-icon">🎨</div>
          <h3>Design-first</h3>
          <p>Your artwork drives everything — we just make it stick.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">✨</div>
          <h3>Hand-finished</h3>
          <p>Clear or holographic vinyl applied over every print, sealing it in.</p>
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
