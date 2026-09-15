import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 space-x-4">
      <Link to="/" className="hover:text-gray-900">Home</Link>
      <Link to="/about" className="hover:text-gray-900">About</Link>
    </nav>
  )
}
