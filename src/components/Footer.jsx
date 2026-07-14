import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>
          © {new Date().getFullYear()} Faithfull Stickers — custom die-cut stickers, printed with
          love.
        </p>
        <nav className="footer-nav" aria-label="Footer">
          <Link to="/design">Designer</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
    </footer>
  )
}
