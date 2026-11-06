import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, CheckCircle2, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TransfersPage() {
  const { user, token, formatPrice, openWhatsAppInquiry } = useApp();

  const [form, setForm] = useState({
    transferType: 'Airport Pickup (Entebbe EBB → Kampala / Hotel)',
    vehicleCategory: 'Executive SUV (Toyota Prado / Land Cruiser V8)',
    pickupLocation: 'Entebbe International Airport (EBB)',
    dropoffLocation: 'Kampala City Hotel / Residence',
    pickupDate: '',
    pickupTime: '14:00',
    flightNumber: '',
    passengers: 2,
    luggageCount: 2,
    specialNotes: '',
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState(null);

  const fleet = [
    {
      name: 'Executive Sedan / Saloon',
      capacity: '1–3 Passengers + 2 Suitcases',
      price: 55,
      desc: 'Ideal for solo business travelers and airport pickups between Entebbe (EBB) and Kampala.',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Executive SUV (Toyota Prado / Land Cruiser)',
      capacity: '1–4 Passengers + 4 Suitcases',
      price: 95,
      desc: 'VIP diplomatic & executive transfer with bottled water, Wi-Fi hotspot, and uniformed chauffeur.',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: '4x4 Safari Land Cruiser (Extended)',
      capacity: 'Up to 7 Passengers + Safari Luggage',
      price: 165,
      desc: 'Pop-up roof 4x4 safari jeep with cooler box and inverter—built for national parks and upcountry transfers.',
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Executive Safari Van / Coaster Bus',
      capacity: '8–25 Passengers + Group Luggage',
      price: 190,
      desc: 'Air-conditioned group shuttle for delegations, weddings, conferences, and group airport transfers.',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        service_type: 'transfer',
        title: `Airport / Ground Transfer: ${form.pickupLocation} → ${form.dropoffLocation} (${form.vehicleCategory})`,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        details: {
          transferType: form.transferType,
          vehicleCategory: form.vehicleCategory,
          pickupLocation: form.pickupLocation,
          dropoffLocation: form.dropoffLocation,
          pickupDate: form.pickupDate,
          pickupTime: form.pickupTime,
          flightNumber: form.flightNumber || 'Not specified',
          passengers: Number(form.passengers),
          luggageCount: Number(form.luggageCount),
          specialNotes: form.specialNotes
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
      if (!res.ok) throw new Error(data.error || 'Failed to submit transfer booking.');
      setSubmittedRef(data.reference_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20 space-y-12">
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Car className="w-3.5 h-3.5" />
            VIP Meet & Greet • Chauffeur Services
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
            Airport Transfers & Ground Transportation
          </h1>
          <p className="text-emerald-100/90 max-w-2xl text-sm sm:text-base">
            Reliable, flight-tracked airport pickups at Entebbe (EBB), Nairobi (NBO), Kigali (KGL), Zanzibar (ZNZ), and Dubai (DXB), plus private 4x4 safari vehicles and executive chauffeur hire.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Fleet Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fleet.map((v) => (
            <div key={v.name} className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col">
              <img src={v.image} alt={v.name} className="h-44 w-full object-cover" />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">{v.capacity}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{v.name}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{v.desc}</p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">From {formatPrice(v.price)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, vehicleCategory: v.name }));
                      document.getElementById('transfer-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-900 text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    Select Vehicle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Form */}
        <div id="transfer-form" className="bg-white rounded-2xl p-6 sm:p-10 border border-stone-200 shadow-xl">
          <h2 className="text-2xl font-serif-display font-bold text-slate-900 mb-6">
            Book an Airport Transfer or Chauffeur Vehicle
          </h2>

          {submittedRef ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Transfer Request Logged!</h3>
              <div className="inline-block px-5 py-2.5 rounded-xl bg-emerald-950 text-amber-300 font-mono text-lg font-bold">
                {submittedRef}
              </div>
              <div className="pt-2">
                <Link
                  to={user ? '/dashboard' : `/track?ref=${submittedRef}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs"
                >
                  Track Transfer Booking
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-sm">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Transfer Service Type *</label>
                  <select
                    value={form.transferType}
                    onChange={(e) => setForm({ ...form, transferType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option>Airport Pickup (Entebbe EBB → Kampala / Hotel)</option>
                    <option>Airport Drop-Off (Kampala → Entebbe EBB)</option>
                    <option>Full-Day Chauffeur Car Hire</option>
                    <option>Inter-City / National Park Transfer</option>
                    <option>International Hub Airport Transfer (Dubai / Nairobi / Kigali)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Preferred Vehicle *</label>
                  <select
                    value={form.vehicleCategory}
                    onChange={(e) => setForm({ ...form, vehicleCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {fleet.map((f) => <option key={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Flight Number (For Airport Pickup)</label>
                  <input
                    type="text"
                    value={form.flightNumber}
                    onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
                    placeholder="e.g., EK 729 / UR 203"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pick-Up Location *</label>
                  <input
                    type="text"
                    required
                    value={form.pickupLocation}
                    onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Drop-Off Location *</label>
                  <input
                    type="text"
                    required
                    value={form.dropoffLocation}
                    onChange={(e) => setForm({ ...form, dropoffLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={form.pickupDate}
                      onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Time *</label>
                    <input
                      type="time"
                      required
                      value={form.pickupTime}
                      onChange={(e) => setForm({ ...form, pickupTime: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Full Name *</label>
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
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Request Transfer Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

