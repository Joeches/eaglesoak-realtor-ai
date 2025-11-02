// src/components/layout/Navbar.tsx
import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar(): JSX.Element {
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <svg className="w-9 h-9 text-teal-600" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2L2 7v6c0 5 4.5 9 10 9s10-4 10-9V7l-10-5z" fill="currentColor" />
          </svg>
          <span className="font-semibold text-lg">EaglesOak Realty AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <NavLink to="/listings" className={({ isActive }) => isActive ? "text-teal-600 font-medium" : "text-slate-700 hover:text-teal-600"}>
            Listings
          </NavLink>
          <NavLink to="/ai-tools" className={({ isActive }) => isActive ? "text-teal-600 font-medium" : "text-slate-700 hover:text-teal-600"}>
            AI Tools
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? "text-teal-600 font-medium" : "text-slate-700 hover:text-teal-600"}>
            About
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "text-teal-600 font-medium" : "text-slate-700 hover:text-teal-600"}>
            Contact
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hidden md:inline-block bg-teal-600 text-white px-3 py-1 rounded-md text-sm shadow-sm">Dashboard</Link>
          <Link to="/auth" className="text-sm text-slate-600 hover:text-slate-900">Sign in</Link>
        </div>
      </div>
    </header>
  );
}

