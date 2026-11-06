import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Star,
  CheckCircle2,
  MessageCircle,
  Search,
  Sparkles,
  X,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function HotelsPage() {
  const { user, token, formatPrice, openWhatsAppInquiry } = useApp();
  const [searchParams] = useSearchParams();

  const [hotels, setHotels] = useState([]);
  const [destinationFilter, setDestinationFilter] = useState(searchParams.get('destination') || '');
  const [typeFilter, setTypeFilter] = useState('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [bookingForm, setBookingForm] = useState({
    destination: searchParams.get('destination') || '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    accommodationType: 'Luxury Hotel',
    budgetPerNight: '$200 – $400 / night',
    specialRequirements: '',
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    customer_nationality: user?.nationality || ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState(null);

  const loadHotels = () => {
    const params = new URLSearchParams();
    if (destinationFilter) params.set('destination', destinationFilter);
    if (typeFilter !== 'All') params.set('accommodation_type', typeFilter);
    if (maxPriceFilter) params.set('max_price', maxPriceFilter);

    fetch(`/api/public/hotels?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setHotels(d.hotels || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadHotels();
  }, [typeFilter]);

  const openHotelInquiry = (hotel, roomName = '') => {
    setSelectedHotel(hotel);
    setSelectedRoom(roomName || (hotel.room_types?.[0]?.name || 'Standard Room'));
    setBookingForm((prev) => ({
      ...prev,
      destination: `${hotel.name} (${hotel.destination}, ${hotel.country})`,
      accommodationType: hotel.accommodation_type,
      customer_name: user?.full_name || prev.customer_name,
      customer_email: user?.email || prev.customer_email,
      customer_phone: user?.phone || prev.customer_phone
    }));
    setSubmittedRef(null);
    setError('');
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const title = selectedHotel
        ? `Hotel Reservation Inquiry: ${selectedHotel.name} (${bookingForm.rooms} Room, ${bookingForm.guests} Guests)`
        : `Hotel Accommodation Search Inquiry: ${bookingForm.destination} (${bookingForm.rooms} Room)`;

      const payload = {
        service_type: 'hotel',
        title,
        related_entity_id: selectedHotel ? selectedHotel.id : null,
        customer_name: bookingForm.customer_name,
        customer_email: bookingForm.customer_email,
        customer_phone: bookingForm.customer_phone,
        customer_nationality: bookingForm.customer_nationality,
        details: {
          hotelName: selectedHotel ? selectedHotel.name : 'General Destination Hotel Request',
          destination: bookingForm.destination,
          preferredRoomType: selectedRoom || 'Best Available Room',
          checkInDate: bookingForm.checkIn,
          checkOutDate: bookingForm.checkOut,
          numberOfGuests: Number(bookingForm.guests),
          numberOfRooms: Number(bookingForm.rooms),
          preferredAccommodationType: bookingForm.accommodationType,
          indicativeBudget: bookingForm.budgetPerNight,
          specialRequirements: bookingForm.specialRequirements
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
      if (!res.ok) throw new Error(data.error || 'Failed to submit hotel inquiry.');
      setSubmittedRef(data.reference_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20 space-y-14">
      {/* Header */}
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5" />
            Curated Hotels, Beach Resorts & Safari Lodges
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
            Hotel Reservations & Accommodation Desk
          </h1>
          <p className="text-emerald-100/90 max-w-2xl text-sm sm:text-base">
            Explore our vetted partner hotels across East Africa, the Middle East, and Europe, or submit your exact destination, dates, and budget for a customized hotel quotation. All reservations remain pending until confirmed by our reservations desk.
          </p>

          {/* Filter Bar */}
          <div className="pt-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl text-slate-900 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end shadow-xl">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Destination or City</label>
              <input
                type="text"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                placeholder="e.g., Dubai, Zanzibar, Kampala, Mara..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Accommodation Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option value="All">All Accommodation Types</option>
                <option value="Luxury Hotel">Luxury Hotel</option>
                <option value="Beach Resort">Beach Resort</option>
                <option value="Safari Lodge">Safari Lodge</option>
                <option value="Boutique Hotel">Boutique Hotel</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Max Nightly Rate (USD)</label>
              <input
                type="number"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(e.target.value)}
                placeholder="e.g., 400"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={loadHotels}
              className="py-2.5 px-5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Filter Hotels</span>
            </button>
          </div>
        </div>
      </section>

      {/* Hotel Listings Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-serif-display font-bold text-slate-900">
            Featured Partner Properties ({hotels.length})
          </h2>
          <button
            type="button"
            onClick={() => {
              setSelectedHotel(null);
              document.getElementById('general-hotel-inquiry')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 cursor-pointer"
          >
            Looking for a specific hotel not listed below? Submit a custom hotel request →
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={hotel.hero_image}
                  alt={hotel.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-950/90 text-amber-300 text-xs font-semibold">
                    {hotel.accommodation_type}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500 text-emerald-950 text-xs font-bold inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-emerald-950" />
                    {hotel.star_rating}-Star
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-white/95 text-emerald-950 font-bold text-sm shadow">
                  From {formatPrice(hotel.indicative_price_usd)} <span className="text-[11px] font-normal text-slate-500">/ night</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{hotel.address} ({hotel.destination}, {hotel.country})</span>
                  </div>
                  <h3 className="text-xl font-serif-display font-bold text-slate-900">{hotel.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{hotel.description}</p>

                  {/* Facilities */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(hotel.facilities || []).map((fac) => (
                      <span
                        key={fac}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 text-slate-700 text-[11px] font-medium"
                      >
                        • {fac}
                      </span>
                    ))}
                  </div>

                  {/* Room Types Table */}
                  {hotel.room_types && hotel.room_types.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Available Room Categories & Indicative Rates
                      </span>
                      <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                        {hotel.room_types.map((rm) => (
                          <div key={rm.name} className="p-3 bg-stone-50/60 flex items-center justify-between gap-2 text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{rm.name}</p>
                              <p className="text-slate-500">{rm.capacity} • {rm.perks}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="block font-bold text-emerald-900">{formatPrice(rm.price_per_night)}/nt</span>
                              <button
                                type="button"
                                onClick={() => openHotelInquiry(hotel, rm.name)}
                                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                              >
                                Select Room
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openHotelInquiry(hotel)}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Booking Inquiry
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppInquiry(
                        `Hello KOLA TOURS AND TRAVEL. I would like to inquire about room availability and rates at ${hotel.name} (${hotel.destination}).`
                      )
                    }
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* General or Selected Hotel Reservation Inquiry Form */}
      <section id="general-hotel-inquiry" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-stone-200 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                {selectedHotel ? `Selected Property: ${selectedHotel.name}` : 'Custom Hotel Search & Reservation Desk'}
              </span>
              <h2 className="text-2xl font-serif-display font-bold text-slate-900 mt-1">
                {selectedHotel ? `Request Reservation at ${selectedHotel.name}` : 'Submit a Hotel Reservation Inquiry'}
              </h2>
            </div>
            {selectedHotel && (
              <button
                type="button"
                onClick={() => setSelectedHotel(null)}
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Switch to Any Destination Hotel</span>
              </button>
            )}
          </div>

          {submittedRef ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Hotel Reservation Inquiry Logged!</h3>
              <p className="text-sm text-slate-600">
                Your hotel reservation request is pending confirmation by our accommodation team. Reference Number:
              </p>
              <div className="inline-block px-5 py-2.5 rounded-xl bg-emerald-950 text-amber-300 font-mono text-lg font-bold">
                {submittedRef}
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  to={user ? '/dashboard' : `/track?ref=${submittedRef}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs"
                >
                  Track Hotel Inquiry Status
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmittedRef(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold"
                >
                  New Hotel Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-6">
              {error && <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 text-sm">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Destination or Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.destination}
                    onChange={(e) => setBookingForm({ ...bookingForm, destination: e.target.value })}
                    placeholder="e.g., Dubai Marina, Zanzibar Nungwi, Kampala..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Check-In Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Check-Out Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Number of Guests *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={bookingForm.guests}
                    onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Number of Rooms *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={bookingForm.rooms}
                    onChange={(e) => setBookingForm({ ...bookingForm, rooms: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Preferred Accommodation</label>
                  <select
                    value={bookingForm.accommodationType}
                    onChange={(e) => setBookingForm({ ...bookingForm, accommodationType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option>Luxury Hotel (5-Star)</option>
                    <option>Superior Hotel (4-Star)</option>
                    <option>Beach Resort</option>
                    <option>Safari Lodge / Tented Camp</option>
                    <option>Serviced Apartment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Indicative Nightly Budget</label>
                  <select
                    value={bookingForm.budgetPerNight}
                    onChange={(e) => setBookingForm({ ...bookingForm, budgetPerNight: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option>$100 – $200 / night</option>
                    <option>$200 – $400 / night</option>
                    <option>$400 – $700 / night</option>
                    <option>$700+ / night (Ultra-Luxury Villa/Suite)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Special Requirements (Meal plan, honeymoon setup, adjoining family rooms, airport pickup)
                </label>
                <textarea
                  rows={2}
                  value={bookingForm.specialRequirements}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialRequirements: e.target.value })}
                  placeholder="Let us know any room or board preferences..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customer_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={bookingForm.customer_email}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customer_phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
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
                  {submitting ? 'Submitting Inquiry...' : 'Submit Hotel Reservation Inquiry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

