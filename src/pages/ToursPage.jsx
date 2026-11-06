import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Map,
  MapPin,
  Clock,
  Users,
  MessageCircle,
  Search,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ToursPage() {
  const { formatPrice, openWhatsAppInquiry } = useApp();
  const [searchParams] = useSearchParams();

  const [packages, setPackages] = useState([]);
  const [category, setCategory] = useState('All');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const fetchPackages = () => {
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (destination) params.set('destination', destination);
    if (search) params.set('search', search);

    fetch(`/api/public/packages?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setPackages(d.packages || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPackages();
  }, [category]);

  const categories = [
    'All',
    'Safari & Wildlife',
    'Beach & Island',
    'City & Luxury',
    'Cultural & Heritage',
    'Honeymoon & Romance'
  ];

  return (
    <div className="pb-20 space-y-12">
      {/* Header */}
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
              <Map className="w-3.5 h-3.5" />
              Fixed & Custom Holiday Experiences
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
              Tours & Holiday Packages
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base">
              Browse our curated fixed-itinerary packages across East Africa, Dubai, Zanzibar, Türkiye, and South Africa—or build a 100% custom itinerary tailored to your exact travel dates.
            </p>
          </div>
          <div className="bg-emerald-900/80 border border-emerald-700 rounded-2xl p-6 max-w-sm space-y-3">
            <h3 className="text-lg font-serif-display font-bold text-amber-300">
              Want a Personalized Trip?
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Traveling with family, celebrating a honeymoon, or organizing a corporate retreat? Our travel planners design bespoke day-by-day itineraries.
            </p>
            <Link
              to="/custom-trip"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition"
            >
              <Compass className="w-4 h-4" />
              <span>Create Custom Travel Request</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  category === cat
                    ? 'bg-emerald-900 text-amber-300'
                    : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Filter by destination (e.g., Dubai, Zanzibar, Bwindi)..."
              className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keyword (e.g., Gorilla, Cruise, Balloon, Safari)..."
              className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
            />
            <button
              type="button"
              onClick={fetchPackages}
              className="py-2.5 px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Apply Search Filter</span>
            </button>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition flex flex-col"
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={pkg.hero_image}
                  alt={pkg.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-950/90 text-amber-300 text-xs font-semibold">
                  {pkg.category}
                </div>
                <div className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-white/95 text-emerald-950 font-bold text-sm shadow">
                  {formatPrice(pkg.price_per_person)} <span className="text-[11px] font-normal text-slate-500">/ person</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      {pkg.destination}, {pkg.country}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {pkg.duration_label}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {pkg.min_participants}–{pkg.max_participants} Guests
                    </span>
                  </div>

                  <h3 className="text-xl font-serif-display font-bold text-slate-900">
                    <Link to={`/tours/${pkg.slug}`} className="hover:text-emerald-800 transition">
                      {pkg.title}
                    </Link>
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-3">{pkg.description}</p>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {(pkg.activities || []).slice(0, 4).map((act) => (
                      <span
                        key={act}
                        className="px-2.5 py-0.5 rounded-md bg-stone-100 text-slate-700 text-[11px] font-medium"
                      >
                        ✓ {act}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center gap-2">
                  <Link
                    to={`/tours/${pkg.slug}`}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-800 font-semibold text-xs text-center"
                  >
                    View Itinerary
                  </Link>
                  <Link
                    to={`/tours/${pkg.slug}?book=true`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs text-center"
                  >
                    Request Booking
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppInquiry(
                        `Hello KOLA TOURS AND TRAVEL. I am interested in booking the ${pkg.title} holiday package.`
                      )
                    }
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    title="WhatsApp Inquiry"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

