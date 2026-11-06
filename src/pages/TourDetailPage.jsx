import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Car,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TourDetailPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user, token, formatPrice, openWhatsAppInquiry } = useApp();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');

  const [form, setForm] = useState({
    preferredDates: '',
    travelersCount: 2,
    roomPreference: 'Double / Twin Sharing',
    includeFlights: 'Yes — Please quote return flights',
    departureCity: 'Entebbe (EBB)',
    specialRequests: '',
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    customer_nationality: user?.nationality || ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/packages/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.package) {
          setPkg(d.package);
          setActiveImage(d.package.hero_image);
          setForm((prev) => ({
            ...prev,
            preferredDates: d.package.available_dates?.[0] || '',
            customer_name: user?.full_name || prev.customer_name,
            customer_email: user?.email || prev.customer_email,
            customer_phone: user?.phone || prev.customer_phone
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [slug, user]);

  useEffect(() => {
    if (searchParams.get('book') === 'true' && pkg) {
      document.getElementById('tour-booking-form')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams, pkg]);

  const handleBookingRequest = async (e) => {
    e.preventDefault();
    if (!pkg) return;
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        service_type: 'tour_fixed',
        title: `${pkg.title} (${form.travelersCount} Travelers)`,
        related_entity_id: pkg.id,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_nationality: form.customer_nationality,
        details: {
          packageTitle: pkg.title,
          destination: `${pkg.destination}, ${pkg.country}`,
          duration: pkg.duration_label,
          indicativePricePerPersonUSD: pkg.price_per_person,
          preferredDates: form.preferredDates,
          travelersCount: Number(form.travelersCount),
          roomPreference: form.roomPreference,
          includeFlights: form.includeFlights,
          departureCity: form.departureCity,
          specialRequests: form.specialRequests
        }
      };

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit tour booking request.');
      setSubmittedRef(data.reference_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading tour itinerary & details...
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-serif-display font-bold text-slate-900">Tour Package Not Found</h2>
        <Link to="/tours" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tour Packages</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-12">
      {/* Hero Banner */}
      <section className="relative bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Link to="/tours" className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Tour Packages</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500 text-emerald-950 text-xs font-bold">
                  {pkg.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-900 border border-emerald-700 text-emerald-100 text-xs font-medium inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {pkg.destination}, {pkg.country}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-900 border border-emerald-700 text-emerald-100 text-xs font-medium inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {pkg.duration_label}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-900 border border-emerald-700 text-emerald-100 text-xs font-medium inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  {pkg.min_participants}–{pkg.max_participants} Participants
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">{pkg.title}</h1>
            </div>

            <div className="bg-emerald-900/90 border border-emerald-700 p-5 rounded-2xl shrink-0 text-right space-y-2">
              <span className="block text-xs text-emerald-200 uppercase tracking-wider">Starting Package Rate</span>
              <span className="block text-3xl font-serif-display font-bold text-amber-300">
                {formatPrice(pkg.price_per_person)}
              </span>
              <span className="block text-xs text-emerald-300">Per Person Sharing</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Columns: Gallery, Description, Daily Itinerary, Inclusions */}
        <div className="lg:col-span-2 space-y-10">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="h-80 sm:h-[420px] rounded-2xl overflow-hidden border border-stone-200 shadow-md">
              <img src={activeImage || pkg.hero_image} alt={pkg.title} className="w-full h-full object-cover" />
            </div>
            {pkg.gallery && pkg.gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {pkg.gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-28 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer ${
                      activeImage === imgUrl ? 'border-emerald-800' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Overview */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-4">
            <h2 className="text-2xl font-serif-display font-bold text-slate-900">Package Overview</h2>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{pkg.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Accommodation Details</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{pkg.accommodation_details}</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                  <Car className="w-4 h-4 text-amber-600" />
                  <span>Transportation Details</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{pkg.transportation_details}</p>
              </div>
            </div>
          </div>

          {/* Daily Itinerary */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-6">
            <h2 className="text-2xl font-serif-display font-bold text-slate-900">Day-by-Day Itinerary</h2>
            <div className="space-y-4">
              {(pkg.itinerary || []).map((dayObj) => (
                <div
                  key={dayObj.day}
                  className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-900 text-amber-300 text-xs font-bold">
                      Day {dayObj.day}: {dayObj.title}
                    </span>
                    {dayObj.meals && (
                      <span className="text-xs font-semibold text-slate-500">Meals: {dayObj.meals}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{dayObj.description}</p>
                  {dayObj.accommodation && (
                    <p className="text-xs text-emerald-800 font-medium">
                      Overnight: {dayObj.accommodation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Included & Excluded */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-3">
              <h3 className="text-lg font-serif-display font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Included Services</span>
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {(pkg.included || []).map((inc) => (
                  <li key={inc} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-3">
              <h3 className="text-lg font-serif-display font-bold text-rose-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>Excluded Services</span>
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {(pkg.excluded || []).map((exc) => (
                  <li key={exc} className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Booking Request Form & WhatsApp Button */}
        <div id="tour-booking-form" className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-lg sticky top-28 space-y-5">
            <div className="border-b border-stone-200 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Reserve This Experience
              </span>
              <h3 className="text-xl font-serif-display font-bold text-slate-900 mt-1">
                Request Package Booking
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Submit your preferred dates and group size. Our team prepares an official quotation before any payment is taken.
              </p>
            </div>

            {submittedRef ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <h4 className="font-bold text-slate-900">Booking Request Submitted!</h4>
                <p className="text-xs text-slate-600">Your unique Reference Number:</p>
                <div className="px-4 py-2 rounded-lg bg-emerald-950 text-amber-300 font-mono font-bold text-base">
                  {submittedRef}
                </div>
                <Link
                  to={user ? '/dashboard' : `/track?ref=${submittedRef}`}
                  className="block w-full py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs"
                >
                  View Request Status
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingRequest} className="space-y-4">
                {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">{error}</div>}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Available / Preferred Travel Dates *</label>
                  <select
                    value={form.preferredDates}
                    onChange={(e) => setForm({ ...form, preferredDates: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    {(pkg.available_dates || []).map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                    <option value="Custom Private Departure Dates">Custom Private Departure Dates (Specify Below)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Travelers *</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={form.travelersCount}
                      onChange={(e) => setForm({ ...form, travelersCount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Room Configuration</label>
                    <select
                      value={form.roomPreference}
                      onChange={(e) => setForm({ ...form, roomPreference: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    >
                      <option>Double / Twin Sharing</option>
                      <option>Single Occupancy Room</option>
                      <option>Family / Interconnecting</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Include Flights in Quotation?</label>
                  <select
                    value={form.includeFlights}
                    onChange={(e) => setForm({ ...form, includeFlights: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option>Yes — Please quote return flights</option>
                    <option>No — Land package only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.customer_email}
                    onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Special Requests / Custom Dates</label>
                  <textarea
                    rows={2}
                    value={form.specialRequests}
                    onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                    placeholder="Dietary needs, visa support, or preferred custom travel dates..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                  />
                </div>

                <div className="p-3 rounded-xl bg-stone-100 text-xs flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Indicative Estimate ({form.travelersCount} pax):</span>
                  <span className="font-bold text-emerald-950 text-sm">
                    {formatPrice(pkg.price_per_person * Number(form.travelersCount || 1))}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Booking Request'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() =>
                openWhatsAppInquiry(
                  `Hello KOLA TOURS AND TRAVEL. I am interested in booking the ${pkg.title} holiday package.`
                )
              }
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire About This Package on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

