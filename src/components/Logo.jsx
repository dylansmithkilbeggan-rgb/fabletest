import { Link } from 'react-router-dom'
import logo from '../assets/logo/logo.png'

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Faithfull Stickers home">
      <img className="logo-img" src={logo} alt="Faithfull Stickers" />
    </Link>
  )
}
