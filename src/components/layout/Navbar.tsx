import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Listings", path: "/listings" },
    { name: "AI Tools", path: "/ai-tools" },
    { name: "Realtor Dashboard", path: "/realtor-dashboard" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/src/assets/logo.svg" alt="Eaglesoak Realty AI" className="w-8 h-8" />
          <span className="text-xl font-bold text-primary">Eaglesoak Realty AI</span>
        </Link>

        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `font-medium hover:text-secondary transition ${
                  isActive ? "text-secondary" : "text-dark"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        <button
          onClick={toggleMenu}
          className="md:hidden text-dark focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-gray-100 animate-fadeIn">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className="block px-6 py-3 text-dark hover:bg-gray-50 hover:text-secondary"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
