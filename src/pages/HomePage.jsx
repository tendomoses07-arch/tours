import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plane,
  Building2,
  Map,
  ShieldCheck,
  FileBadge,
  Compass,
  Car,
  ArrowRight,
  Star,
  CheckCircle2,
  Clock,
  Users,
  Globe2,
  HeartHandshake,
  MessageCircle,
  Sparkles,
  Calendar,
  MapPin,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const { settings, formatPrice, openWhatsAppInquiry } = useApp();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [activeRegion, setActiveRegion] = useState('All');
  const [heroService, setHeroService] = useState('tours');
  const [heroDestination, setHeroDestination] = useState('');
  const [heroTravelers, setHeroTravelers] = useState('2 Travelers');

  // Review modal state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customer_name: '',
    customer_role_location: '',
    service_used: 'Holiday & Safari Package',
    rating: 5,
    comment: ''
  });
  const [reviewNotice, setReviewNotice] = useState('');

  useEffect(() => {
    fetch('/api/public/destinations')
      .then((r) => r.json())
      .then((d) => setDestinations(d.destinations || []))
      .catch(() => {});

    fetch('/api/public/packages?featured=true')
      .then((r) => r.json())
      .then((d) => setPackages(d.packages || []))
      .catch(() => {});

    fetch('/api/public/testimonials')
      .then((r) => r.json())
      .then((d) => setTestimonials(d.testimonials || []))
      .catch(() => {});
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const q = heroDestination.trim();
    if (heroService === 'flights') {
      navigate(`/flights${q ? `?to=${encodeURIComponent(q)}` : ''}`);
    } else if (heroService === 'hotels') {
      navigate(`/hotels${q ? `?destination=${encodeURIComponent(q)}` : ''}`);
    } else if (heroService === 'custom') {
      navigate(`/custom-trip${q ? `?destination=${encodeURIComponent(q)}` : ''}`);
    } else if (heroService === 'visa') {
      navigate(`/visa-passport${q ? `?country=${encodeURIComponent(q)}` : ''}`);
    } else {
      navigate(`/tours${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/public/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      const data = await res.json();
      if (res.ok) {
        setReviewNotice(data.message);
        setReviewForm({ customer_name: '', customer_role_location: '', service_used: 'Holiday & Safari Package', rating: 5, comment: '' });
        const refreshed = await fetch('/api/public/testimonials').then((r) => r.json());
        setTestimonials(refreshed.testimonials || []);
        setTimeout(() => setShowReviewForm(false), 1500);
      }
    } catch {
      setReviewNotice('Unable to submit review right now.');
    }
  };

  const servicesList = [
    {
      title: 'Flight Bookings',
      desc: 'International & regional airline route planning, group fare quotations, and multi-city itinerary holds.',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
      link: '/flights',
      cta: 'Request Flight Quote',
      icon: Plane
    },
    {
      title: 'Hotel Reservations',
      desc: 'Handpicked 5-star city hotels, Indian Ocean beach resorts, and luxury safari lodges with negotiated corporate rates.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      link: '/hotels',
      cta: 'Explore Hotels',
      icon: Building2
    },
    {
      title: 'Tour Packages',
      desc: 'Curated local & international holidays from Bwindi Gorilla Trekking and Maasai Mara to Dubai, Zanzibar, and Istanbul.',
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      link: '/tours',
      cta: 'View Tour Packages',
      icon: Map
    },
    {
      title: 'Visa Assistance',
      desc: 'Expert tourist, business, student & transit visa guidance, document verification, and embassy appointment preparation.',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      link: '/visa-passport?type=visa',
      cta: 'Start Visa Inquiry',
      icon: ShieldCheck
    },
    {
      title: 'Passport Assistance',
      desc: 'Step-by-step passport application & renewal guidance, required document checklists, and submission support.',
      image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
      link: '/visa-passport?type=passport',
      cta: 'Passport Guidance',
      icon: FileBadge
    },
    {
      title: 'Custom Travel Planning',
      desc: 'Bespoke honeymoons, family holidays, and executive retreats designed around your exact dates, pace, and budget.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      link: '/custom-trip',
      cta: 'Build Custom Trip',
      icon: Compass
    },
    {
      title: 'Airport Transfers',
      desc: 'Punctual VIP airport meet-and-greet, executive SUVs, safari 4x4 Land Cruisers, and group coaster transport.',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
      link: '/transfers',
      cta: 'Book Airport Transfer',
      icon: Car
    }
  ];

  const filteredDestinations =
    activeRegion === 'All'
      ? destinations
      : destinations.filter((d) => d.region === activeRegion || (activeRegion === 'East Africa' && d.is_local));

  return (
    <div className="space-y-0">
      {/* HERO SECTION — Brand Navy Blue (#0B1F45) & Orange (#F28C28) Theme */}
      <section className="relative min-h-[640px] flex items-center bg-[#0B1F45] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('${settings.hero_banner_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85'}')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071531] via-[#0B1F45]/90 to-[#0B1F45]/55" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F28C28]/20 border border-[#F28C28]/45 text-[#F28C28] text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trusted Global &amp; East African Travel Partner</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-display font-bold leading-tight text-white">
              {settings.hero_headline || 'Explore the World. We Make Your Journey Easier.'}
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              {settings.hero_subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/tours"
                className="px-6 py-3.5 rounded-xl bg-[#F28C28] hover:bg-[#e07b18] text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-[#F28C28]/30 transition"
              >
                <span>Explore Tour Packages</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/custom-trip"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm backdrop-blur-sm transition"
              >
                Submit Travel Inquiry
              </Link>
              <button
                type="button"
                onClick={() => openWhatsAppInquiry('Hello KOLA TOURS AND TRAVEL. I would like help planning my upcoming trip.')}
                className="px-5 py-3.5 rounded-xl bg-[#15397a]/90 hover:bg-[#1d4b9c] border border-white/20 text-white font-semibold text-sm inline-flex items-center gap-2 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-[#F28C28]" />
                <span>WhatsApp Desk</span>
              </button>
            </div>
          </div>

          {/* Interactive Destination Search & Service Selector */}
          <div className="mt-12 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-stone-200 text-slate-900">
            <div className="flex flex-wrap gap-2 pb-4 border-b border-stone-200">
              {[
                { id: 'tours', label: 'Tour Packages', icon: Map },
                { id: 'flights', label: 'Flight Inquiries', icon: Plane },
                { id: 'hotels', label: 'Hotel Stays', icon: Building2 },
                { id: 'custom', label: 'Custom Itinerary', icon: Compass },
                { id: 'visa', label: 'Visa & Passport', icon: ShieldCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHeroService(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      heroService === tab.id
                        ? 'bg-[#0B1F45] text-[#F28C28] shadow-sm'
                        : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleHeroSearch} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Destination, Country, or Experience
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#F28C28] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={heroDestination}
                    onChange={(e) => setHeroDestination(e.target.value)}
                    placeholder="e.g., Dubai, Zanzibar, Bwindi Gorillas, London, Istanbul..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:border-[#0B1F45]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Travel Party / Class
                </label>
                <select
                  value={heroTravelers}
                  onChange={(e) => setHeroTravelers(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:border-[#0B1F45]"
                >
                  <option>Solo Traveler (1 Adult)</option>
                  <option>2 Travelers (Couple / Pair)</option>
                  <option>Family (3–6 Travelers)</option>
                  <option>Group / Corporate Delegation (7+)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-[#0B1F45] hover:bg-[#102c60] text-[#F28C28] font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search &amp; Proceed</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* C. EXPLORE OUR SERVICES (All 7 Required Services) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            End-to-End Travel Management
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-slate-900">
            Explore Our Comprehensive Services
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Every journey is backed by dedicated travel consultants, transparent quotation workflows, and 24/7 traveler support.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {servicesList.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.title}
                className={`group bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition flex flex-col ${
                  idx === 6 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={srv.image}
                    alt={srv.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center shadow-md">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                      {srv.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{srv.desc}</p>
                  </div>
                  <Link
                    to={srv.link}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-stone-100 group-hover:bg-emerald-900 text-slate-800 group-hover:text-amber-300 text-xs font-bold transition"
                  >
                    <span>{srv.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* D. FEATURED DESTINATIONS */}
      <section className="py-20 bg-stone-100/90 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Local & International Horizons
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-slate-900 mt-1">
                Featured Destinations
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-1">
                From Dubai, London, Paris, and Istanbul to Zanzibar, Nairobi, Mombasa, Kigali, Cape Town, and Bwindi.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'East Africa', 'Rest of Africa', 'Middle East', 'Europe'].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setActiveRegion(reg)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeRegion === reg
                      ? 'bg-emerald-900 text-amber-300 shadow-sm'
                      : 'bg-white text-slate-700 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => (
              <div
                key={dest.id}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 h-80 shadow-md hover:shadow-xl transition"
              >
                <img
                  src={dest.image_url}
                  alt={dest.name}
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-950/85 backdrop-blur-sm text-amber-300 text-xs font-semibold border border-amber-400/30">
                    {dest.country}
                  </span>
                  {dest.is_local ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-emerald-950 text-[11px] font-bold">
                      East Africa Regional
                    </span>
                  ) : null}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-serif-display font-bold">{dest.name}</h3>
                    <span className="text-xs bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-lg font-semibold">
                      From {formatPrice(dest.starting_from_usd)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-200 line-clamp-2">{dest.tagline}</p>
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      to={`/tours?destination=${encodeURIComponent(dest.name)}`}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
                    >
                      <span>Explore Packages</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/custom-trip?destination=${encodeURIComponent(dest.name)}`}
                      className="text-xs font-semibold text-white/80 hover:text-white underline underline-offset-4"
                    >
                      Custom Trip Quote
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E. FEATURED TOUR PACKAGES */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Handcrafted Experiences
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-slate-900 mt-1">
              Featured Tour & Holiday Packages
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-1">
              Complete itineraries with vetted accommodation, guided activities, and transparent per-person pricing.
            </p>
          </div>
          <Link
            to="/tours"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950"
          >
            <span>View All Tour Packages</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition flex flex-col"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={pkg.hero_image}
                  alt={pkg.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-950/90 text-amber-300 text-xs font-semibold">
                  {pkg.category}
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-sm text-emerald-950 font-bold text-sm shadow">
                  {formatPrice(pkg.price_per_person)} <span className="text-[11px] font-normal text-slate-500">/ person</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      {pkg.destination}, {pkg.country}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {pkg.duration_label}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif-display font-bold text-slate-900">
                    <Link to={`/tours/${pkg.slug}`} className="hover:text-emerald-800 transition">
                      {pkg.title}
                    </Link>
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-2">{pkg.description}</p>

                  {/* Included Activities pills */}
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {(pkg.activities || []).slice(0, 3).map((act) => (
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
                    className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 hover:bg-stone-100 text-slate-800 font-semibold text-xs text-center transition"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/tours/${pkg.slug}?book=true`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs text-center transition"
                  >
                    Request Booking
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppInquiry(
                        `Hello KOLA TOURS AND TRAVEL. I am interested in booking the ${pkg.title} (${pkg.duration_label}) package.`
                      )
                    }
                    title="Inquire via WhatsApp"
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* F. WHY CHOOSE US */}
      <section className="py-20 bg-[#0B1F45] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#F28C28]">
              The KOLA TOURS Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif-display font-bold">
              Why Travelers &amp; Organizations Choose Us
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              We combine deep regional knowledge in East Africa with international travel management standards.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: HeartHandshake,
                title: 'Personalized Quotations & Honest Advice',
                desc: 'No hidden fees or automated bait-and-switch pricing. Every request receives a human-verified quotation tailored to your preferences.'
              },
              {
                icon: ShieldCheck,
                title: 'Document Security & Visa Expertise',
                desc: 'Your passport copies and supporting documents are encrypted and strictly access-controlled for authorized consultants only.'
              },
              {
                icon: Globe2,
                title: 'Global Airline & Resort Network',
                desc: 'Direct partnerships across Uganda, Kenya, Tanzania, Rwanda, UAE, Türkiye, South Africa, the UK, and Schengen Europe.'
              },
              {
                icon: Users,
                title: '24/7 Traveler Concierge Desk',
                desc: 'From airport pickup changes to emergency flight rebooking, our Kampala support team is reachable around the clock.'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-6 rounded-2xl bg-[#071531]/80 border border-white/10 space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#F28C28]/20 border border-[#F28C28]/40 text-[#F28C28] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* G. TESTIMONIALS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Verified Traveler Stories
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-slate-900 mt-1">
              What Our Clients Say
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2.5 rounded-xl border border-emerald-800 text-emerald-900 hover:bg-emerald-50 text-xs font-bold cursor-pointer"
          >
            {showReviewForm ? 'Close Review Form' : '+ Share Your Travel Experience'}
          </button>
        </div>

        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="mt-6 p-6 rounded-2xl bg-white border border-stone-200 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={reviewForm.customer_name}
                onChange={(e) => setReviewForm({ ...reviewForm, customer_name: e.target.value })}
                placeholder="e.g., David K."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Country</label>
              <input
                type="text"
                value={reviewForm.customer_role_location}
                onChange={(e) => setReviewForm({ ...reviewForm, customer_role_location: e.target.value })}
                placeholder="e.g., Kampala, Uganda"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Used</label>
              <input
                type="text"
                value={reviewForm.service_used}
                onChange={(e) => setReviewForm({ ...reviewForm, service_used: e.target.value })}
                placeholder="e.g., Zanzibar Tour Package"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Review *</label>
              <input
                type="text"
                required
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share how KOLA TOURS helped with your journey..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-900 text-amber-300 font-bold text-sm cursor-pointer"
              >
                Publish Review
              </button>
            </div>
            {reviewNotice && <p className="md:col-span-3 text-xs text-emerald-700 font-semibold">{reviewNotice}</p>}
          </form>
        )}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {t.service_used}
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic">“{t.comment}”</p>
              </div>
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.customer_name}</p>
                  <p className="text-xs text-slate-500">{t.customer_role_location}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

