// src/pages/Home.tsx
import React from "react";
import { Link } from "react-router-dom";

type SampleProp = {
  id: string;
  title: string;
  price: number;
  currency?: string;
  district: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  investment_index?: number;
  market_sentiment?: number;
};

const SAMPLE_PROPS: SampleProp[] = [
  {
    id: "sample-asokoro-1",
    title: "Panoramic 3-Bed Duplex — Asokoro Heights",
    price: 180000000,
    currency: "NGN",
    district: "Asokoro",
    city: "Abuja",
    bedrooms: 3,
    bathrooms: 4,
    sqft: 2200,
    image: "/assets/hero/abuja_villa.jpg",
    investment_index: 8.4,
    market_sentiment: 0.74
  },
  {
    id: "sample-wuse-1",
    title: "Modern 2-Bed Apartment — Wuse II SmartBlock",
    price: 95000000,
    currency: "NGN",
    district: "Wuse II",
    city: "Abuja",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 900,
    image: "/assets/hero/maitama_tower.jpg",
    investment_index: 7.1,
    market_sentiment: 0.63
  },
  {
    id: "sample-gwarinpa-1",
    title: "Family 4-Bed Semi-Detached — Gwarinpa Greenview",
    price: 210000000,
    currency: "NGN",
    district: "Gwarinpa",
    city: "Abuja",
    bedrooms: 4,
    bathrooms: 5,
    sqft: 3200,
    image: "/assets/hero/gwarinpa_estate.jpg",
    investment_index: 8.8,
    market_sentiment: 0.8
  }
];

function formatPrice(n: number, currency = "NGN") {
  return `${currency} ${Intl.NumberFormat("en-NG").format(n)}`;
}

export default function Home(): JSX.Element {
  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="bg-gradient-to-r from-white to-slate-50 rounded-lg p-8 shadow-sm">
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">EaglesOak Realty AI — Discover smarter property matches</h1>
            <p className="mt-3 text-slate-600 max-w-xl">
              Per-property AI advisors, market sentinel intelligence, and smart investment signals — built for Abuja, ready for the world.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/listings" className="bg-teal-600 text-white px-4 py-2 rounded-md shadow">Browse Listings</Link>
              <Link to="/ai-tools" className="px-4 py-2 rounded-md border border-slate-200 text-slate-700">Explore AI Tools</Link>
            </div>
          </div>

          <div className="mt-6 md:mt-0 grid grid-cols-1 gap-4 w-full md:w-96">
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-xs text-slate-500">Market Snapshot — Abuja</div>
              <div className="mt-2 flex items-baseline gap-3">
                <div className="text-2xl font-semibold">+6.3%</div>
                <div className="text-sm text-slate-500">price uplift (last 3 months)</div>
              </div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-xs text-slate-500">Top Neighbourhood</div>
              <div className="mt-2 font-medium">Asokoro • Demand Index 8.3</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED 3 PROPS */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Featured — Abuja</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {SAMPLE_PROPS.map((p) => (
            <article key={p.id} className="bg-white rounded-lg overflow-hidden shadow">
              <img src={p.image} alt={p.title} className="w-full h-44 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{p.district}, {p.city}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-teal-600 font-bold">{formatPrice(p.price, p.currency)}</div>
                    <div className="text-xs text-slate-500">{p.bedrooms} bd • {p.bathrooms} ba • {p.sqft} sqft</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Link to={`/property/${p.id}`} className="inline-block bg-slate-800 text-white px-3 py-1 rounded-sm text-sm">View</Link>
                  <div className="text-xs text-slate-500">Investment Index: <span className="font-semibold">{p.investment_index}</span></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* QUICK CTA */}
      <section className="bg-white p-6 rounded shadow-sm">
        <h3 className="text-lg font-semibold">Want your property AI-indexed?</h3>
        <p className="text-slate-600 mt-2">Realtors: create a free account and upload your listing — AI will auto-generate metadata and chat context.</p>
        <div className="mt-4">
          <Link to="/dashboard" className="bg-teal-600 text-white px-4 py-2 rounded-md">Go to Dashboard</Link>
        </div>
      </section>
    </div>
  );
}

