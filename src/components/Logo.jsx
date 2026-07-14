import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Faithfull Stickers home">
      <svg className="logo-mark" viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <g transform="rotate(-6 32 32)">
          <rect x="5" y="5" width="54" height="54" rx="16" fill="var(--accent)" />
          <path d="M59 33 A26 26 0 0 1 33 59 L59 59 Z" fill="var(--accent-strong)" opacity="0.5" />
          <text
            x="32"
            y="45"
            fontFamily="inherit"
            fontSize="34"
            fontWeight="800"
            fill="#fff"
            textAnchor="middle"
          >
            F
          </text>
        </g>
      </svg>
      <span className="logo-text">
        Faithfull <span className="logo-accent">Stickers</span>
      </span>
    </Link>
  )
}
