// src/App.tsx
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";

// Pages (lazy load for faster initial payload if you add more pages)
import Home from "./pages/Home";
const About = React.lazy(() => import("./pages/About").catch(() => ({ default: () => <div>About (placeholder)</div> })));
const Contact = React.lazy(() => import("./pages/Contact").catch(() => ({ default: () => <div>Contact (placeholder)</div> })));
const Listings = React.lazy(() => import("./pages/Listings").catch(() => ({ default: () => <div>Listings (placeholder)</div> })));
const RealtorDashboard = React.lazy(() => import("./pages/RealtorDashboard").catch(() => ({ default: () => <div>Dashboard (placeholder)</div> })));
const PropertyPage = React.lazy(() => import("./pages/PropertyPage").catch(() => ({ default: () => <div>Property (placeholder)</div> })));

export default function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-center py-10">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/dashboard" element={<RealtorDashboard />} />
            <Route path="/property/:id" element={<PropertyPage />} />
            <Route path="*" element={<div className="text-center py-20">404 — Page not found</div>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

