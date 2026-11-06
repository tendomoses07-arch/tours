import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CustomTripPage() {
  const { user, token, openWhatsAppInquiry } = useApp();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    preferredDestination: searchParams.get('destination') || '',
    departureLocation: 'Kampala / Entebbe, Uganda',
    travelDates: '',
    durationDays: '7 Days',
    numberOfTravelers: 2,
    budgetRange: '$1,500 – $3,000 per person',
    preferredAccommodation: '5-Star Luxury Hotels & Safari Lodges',
    preferredActivities: ['Wildlife Safari / Game Drives', 'Beach & Island Relaxation'],
    transportationPreferences: 'Private 4x4 Safari Land Cruiser + Return Flights',
    specialRequests: '',
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    customer_nationality: user?.nationality || ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState(null);

  const activityOptions = [
    'Mountain Gorilla Trekking',
    'Wildlife Safari / Game Drives',
    'Beach & Island Relaxation',
    'Luxury City & Shopping',
    'Cultural & Historical Heritage',
    'Honeymoon & Romantic Experiences',
    'Hot Air Balloon / Adventure Sports',
    'Corporate Conference / Retreat'
  ];

  const toggleActivity = (act) => {
    setForm((prev) => {
      const exists = prev.preferredActivities.includes(act);
      return {
        ...prev,
        preferredActivities: exists
          ? prev.preferredActivities.filter((a) => a !== act)
          : [...prev.preferredActivities, act]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        service_type: 'tour_custom',
        title: `Custom Trip Proposal: ${form.preferredDestination} (${form.durationDays}, ${form.numberOfTravelers} Travelers)`,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_nationality: form.customer_nationality,
        details: {
          preferredDestination: form.preferredDestination,
          departureLocation: form.departureLocation,
          travelDates: form.travelDates,
          durationDays: form.durationDays,
          numberOfTravelers: Number(form.numberOfTravelers),
          budgetRange: form.budgetRange,
          preferredAccommodation: form.preferredAccommodation,
          preferredActivities: form.preferredActivities,
          transportationPreferences: form.transportationPreferences,
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
      if (!res.ok) throw new Error(data.error || 'Failed to submit custom itinerary request.');
      setSubmittedRef(data.reference_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5" />
            Bespoke Travel Design
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
            Custom Travel Itinerary Planner
          </h1>
          <p className="text-emerald-100/90 max-w-2xl text-sm sm:text-base">
            Tell us where you dream of going, your travel dates, preferred accommodation tier, and favorite activities. Our travel architects will craft a personalized day-by-day itinerary and itemized quotation.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {submittedRef ? (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-emerald-200 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-700 mx-auto" />
            <h2 className="text-2xl font-serif-display font-bold text-slate-900">
              Custom Trip Request Received!
            </h2>
            <p className="text-sm text-slate-600">
              Our senior itinerary designers are now preparing your personalized proposal and quotation under Reference:
            </p>
            <div className="inline-block px-6 py-3 rounded-xl bg-emerald-950 text-amber-300 font-mono text-xl font-bold">
              {submittedRef}
            </div>
            <div className="pt-3 flex flex-wrap justify-center gap-3">
              <Link
                to={user ? '/dashboard' : `/track?ref=${submittedRef}`}
                className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs inline-flex items-center gap-2"
              >
                <span>View Custom Itinerary Status</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() =>
                  openWhatsAppInquiry(
                    `Hello KOLA TOURS AND TRAVEL. I submitted Custom Itinerary Request ${submittedRef} for ${form.preferredDestination}.`
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Trip Planner on WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-stone-200 space-y-8">
            {error && <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-sm">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preferred Destination(s) *
                </label>
                <input
                  type="text"
                  required
                  value={form.preferredDestination}
                  onChange={(e) => setForm({ ...form, preferredDestination: e.target.value })}
                  placeholder="e.g., Bwindi & Zanzibar, Dubai & Istanbul..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Departure Location *
                </label>
                <input
                  type="text"
                  required
                  value={form.departureLocation}
                  onChange={(e) => setForm({ ...form, departureLocation: e.target.value })}
                  placeholder="e.g., Kampala / Entebbe, London, Nairobi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preferred Travel Dates *
                </label>
                <input
                  type="text"
                  required
                  value={form.travelDates}
                  onChange={(e) => setForm({ ...form, travelDates: e.target.value })}
                  placeholder="e.g., Dec 15 – Dec 23, 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Trip Duration
                </label>
                <input
                  type="text"
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                  placeholder="e.g., 7 Days / 6 Nights"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Number of Travelers *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={form.numberOfTravelers}
                  onChange={(e) => setForm({ ...form, numberOfTravelers: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Budget Range (Per Person)
                </label>
                <select
                  value={form.budgetRange}
                  onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                >
                  <option>$600 – $1,500 per person</option>
                  <option>$1,500 – $3,000 per person</option>
                  <option>$3,000 – $5,500 per person</option>
                  <option>$5,500+ per person (VIP Ultra-Luxury)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Preferred Accommodation Style
                </label>
                <select
                  value={form.preferredAccommodation}
                  onChange={(e) => setForm({ ...form, preferredAccommodation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                >
                  <option>5-Star Luxury Hotels & Safari Lodges</option>
                  <option>4-Star Superior Boutique & Beach Resorts</option>
                  <option>3-Star Comfort Mid-Range</option>
                  <option>Private Villas / Family Apartments</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Transportation Preferences
                </label>
                <select
                  value={form.transportationPreferences}
                  onChange={(e) => setForm({ ...form, transportationPreferences: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                >
                  <option>Private 4x4 Safari Land Cruiser + Return Flights</option>
                  <option>Fly-In Safari (Domestic Bush Flights) + Luxury Chauffeur</option>
                  <option>International Flights + Private Airport Transfers Only</option>
                  <option>Executive Group Van / Coaster Coach</option>
                </select>
              </div>
            </div>

            {/* Preferred Activities Multi-select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Preferred Activities & Experiences (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map((act) => {
                  const active = form.preferredActivities.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => toggleActivity(act)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-emerald-900 text-amber-300 border-emerald-900'
                          : 'bg-stone-50 text-slate-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {active ? `✓ ${act}` : act}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Special Requests, Celebration Details, or Specific Sights
              </label>
              <textarea
                rows={3}
                value={form.specialRequests}
                onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                placeholder="Tell us about your dream itinerary, children's ages, dietary requirements, visa needs, or celebration..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            {/* Contact Info */}
            <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nationality</label>
                <input
                  type="text"
                  value={form.customer_nationality}
                  onChange={(e) => setForm({ ...form, customer_nationality: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm shadow-lg cursor-pointer"
              >
                {submitting ? 'Submitting Custom Request...' : 'Request Personalized Itinerary & Quotation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

