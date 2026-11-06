import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plane,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Info,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function FlightsPage() {
  const { user, token, openWhatsAppInquiry } = useApp();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    tripType: 'Return',
    departureCity: 'Entebbe International Airport (EBB)',
    destinationCity: searchParams.get('to') || '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: 'Economy',
    preferredAirline: '',
    baggageNeeds: 'Standard Checked Baggage (2x23kg)',
    flexibleDates: 'Yes (±2 days for best fare)',
    additionalRequirements: '',
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    customer_nationality: user?.nationality || ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        service_type: 'flight',
        title: `${form.tripType} Flight: ${form.departureCity} → ${form.destinationCity} (${form.travelClass})`,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_nationality: form.customer_nationality,
        details: {
          tripType: form.tripType,
          departureCity: form.departureCity,
          destinationCity: form.destinationCity,
          departureDate: form.departureDate,
          returnDate: form.tripType === 'Return' ? form.returnDate : 'N/A (One-Way)',
          passengers: {
            adults: Number(form.adults),
            children: Number(form.children),
            infants: Number(form.infants),
            total: Number(form.adults) + Number(form.children) + Number(form.infants)
          },
          travelClass: form.travelClass,
          preferredAirline: form.preferredAirline || 'Any Best Routing / Fare',
          baggageNeeds: form.baggageNeeds,
          flexibleDates: form.flexibleDates,
          additionalRequirements: form.additionalRequirements
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
      if (!res.ok) throw new Error(data.error || 'Failed to submit flight inquiry.');
      setSubmittedRef(data.reference_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Page Header */}
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
              <Plane className="w-3.5 h-3.5" />
              International & Regional Ticketing Desk
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
              Flight Booking & Fare Quotation Desk
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base">
              Submit your flight routing and passenger details below. Our ticketing specialists check live airline fare classes, baggage rules, and transit visa requirements to send you an itemized flight quotation.
            </p>
          </div>
          <div className="bg-emerald-900/70 border border-emerald-700/80 rounded-2xl p-5 max-w-md text-xs text-emerald-100 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Info className="w-4 h-4 shrink-0" />
              <span>Transparent Airline Ticketing Policy</span>
            </div>
            <p className="leading-relaxed">
              We do not display fabricated instant ticket numbers. Submitting a flight inquiry generates a unique reference and notifies our reservations desk, who respond with verified flight options and official fare quotations before payment or ticket issuance.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {submittedRef ? (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-emerald-200 text-center max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-serif-display font-bold text-slate-900">
              Flight Inquiry Submitted Successfully!
            </h2>
            <p className="text-sm text-slate-600">
              Your flight reservation inquiry has been logged in our database and assigned Reference Number:
            </p>
            <div className="inline-block px-6 py-3 rounded-xl bg-emerald-950 text-amber-300 font-mono text-xl font-bold tracking-wider">
              {submittedRef}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our ticketing consultants are reviewing airline options for <strong>{form.departureCity} → {form.destinationCity}</strong> and will send your quotation shortly.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={user ? '/dashboard' : `/track?ref=${submittedRef}`}
                className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs inline-flex items-center gap-2"
              >
                <span>{user ? 'View in My Dashboard' : 'Track Request Status'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() =>
                  openWhatsAppInquiry(
                    `Hello KOLA TOURS AND TRAVEL. I just submitted Flight Inquiry ${submittedRef} (${form.departureCity} to ${form.destinationCity}) and would like to follow up.`
                  )
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Follow Up on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmittedRef(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Submit Another Flight Request
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-stone-200 space-y-8">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Trip Type Radio */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div className="flex flex-wrap gap-2">
                {['Return', 'One-Way', 'Multi-City / Corporate Group'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, tripType: t })}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                      form.tripType === t
                        ? 'bg-emerald-900 text-amber-300 shadow-sm'
                        : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                All major carriers supported: Uganda Airlines, Emirates, Qatar Airways, Kenya Airways, RwandAir, Ethiopian, Turkish Airlines, British Airways & KLM
              </span>
            </div>

            {/* Route & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Departure City or Airport *
                </label>
                <input
                  type="text"
                  required
                  value={form.departureCity}
                  onChange={(e) => setForm({ ...form, departureCity: e.target.value })}
                  placeholder="e.g., Entebbe (EBB)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Destination City or Airport *
                </label>
                <input
                  type="text"
                  required
                  value={form.destinationCity}
                  onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
                  placeholder="e.g., Dubai (DXB), London (LHR), Nairobi (NBO)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Departure Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.departureDate}
                  onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Return Date {form.tripType === 'Return' ? '*' : '(Optional)'}
                </label>
                <input
                  type="date"
                  required={form.tripType === 'Return'}
                  disabled={form.tripType === 'One-Way'}
                  value={form.returnDate}
                  onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm disabled:bg-stone-100"
                />
              </div>
            </div>

            {/* Passenger Categories & Cabin Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Adults (12+ yrs) *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={form.adults}
                  onChange={(e) => setForm({ ...form, adults: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Children (2–11 yrs)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={form.children}
                  onChange={(e) => setForm({ ...form, children: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Infants (&lt;2 yrs)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.infants}
                  onChange={(e) => setForm({ ...form, infants: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Travel Class *</label>
                <select
                  value={form.travelClass}
                  onChange={(e) => setForm({ ...form, travelClass: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                >
                  <option>Economy</option>
                  <option>Premium Economy</option>
                  <option>Business Class</option>
                  <option>First Class</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Preferred Airline (Optional)</label>
                <input
                  type="text"
                  value={form.preferredAirline}
                  onChange={(e) => setForm({ ...form, preferredAirline: e.target.value })}
                  placeholder="e.g., Emirates, Uganda Airlines"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
            </div>

            {/* Additional Requirements */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Additional Requirements (Wheelchair assistance, extra baggage, seat preference, visa hold itinerary)
              </label>
              <textarea
                rows={3}
                value={form.additionalRequirements}
                onChange={(e) => setForm({ ...form, additionalRequirements: e.target.value })}
                placeholder="Tell us any preferred flight times, layover preferences, or special requests..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>

            {/* Contact Details */}
            <div className="pt-4 border-t border-stone-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 mb-4">
                Passenger Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                    placeholder="Your full name"
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
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    placeholder="+256 7..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Passenger Nationality</label>
                  <input
                    type="text"
                    value={form.customer_nationality}
                    onChange={(e) => setForm({ ...form, customer_nationality: e.target.value })}
                    placeholder="e.g., Ugandan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() =>
                  openWhatsAppInquiry(
                    `Hello KOLA TOURS AND TRAVEL. I would like a flight quotation from ${form.departureCity || 'Entebbe'} to ${form.destinationCity || 'my destination'}.`
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 font-bold text-xs sm:text-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Inquire via WhatsApp Instead</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting Flight Inquiry...' : 'Submit Flight Inquiry & Get Quotation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

