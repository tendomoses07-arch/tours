import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Award,
  Globe2,
  Users,
  Search,
  BookOpen,
  HelpCircle,
  MessageCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

export function AboutPage() {
  const { settings, openWhatsAppInquiry } = useApp();
  return (
    <div className="pb-20 space-y-16">
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Our Story & Mission
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
            About KOLA TOURS AND TRAVEL
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base max-w-3xl leading-relaxed">
            Headquartered in Kampala, Uganda, KOLA TOURS AND TRAVEL is a full-service travel management company dedicated to making local East African safaris and international travel seamless, reliable, and deeply memorable.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-slate-900">
              Bridging East Africa & the World with Integrity
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Whether you are tracking endangered mountain gorillas in Bwindi Impenetrable Forest, unwinding on the coral shores of Zanzibar, flying your family to Dubai, or preparing a corporate visa application for London or Paris, our team combines local operational mastery with global travel connections.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              We operate on complete transparency: every inquiry receives a traceable reference number, an itemized official quotation, and personal guidance from an experienced travel consultant.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
              alt="Safari"
              className="rounded-2xl h-60 w-full object-cover shadow-md"
            />
            <img
              src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
              alt="International Travel"
              className="rounded-2xl h-60 w-full object-cover shadow-md mt-6"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: 'Ethical & Transparent Operations',
              desc: 'We never issue fake instant confirmations or unverified payment receipts. Every reservation follows a documented quotation and verification workflow.'
            },
            {
              icon: Globe2,
              title: 'Local Roots, Global Reach',
              desc: 'Direct ground operations across Uganda, Kenya, Tanzania, and Rwanda paired with vetted DMCs in Dubai, Türkiye, South Africa, and Europe.'
            },
            {
              icon: Users,
              title: 'Dedicated Account Managers',
              desc: 'Corporate organizations, NGOs, families, and solo adventurers receive personalized attention from inquiry to return home.'
            }
          ].map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-950 text-amber-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{v.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { settings, user, token, openWhatsAppInquiry } = useApp();
  const [form, setForm] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    subject: 'General Travel Consultation',
    message: ''
  });
  const [submittedRef, setSubmittedRef] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          service_type: 'consultation',
          title: `Travel Consultation: ${form.subject}`,
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          details: { subject: form.subject, message: form.message }
        })
      });
      const data = await res.json();
      if (res.ok) setSubmittedRef(data.reference_number);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20 space-y-12">
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            24/7 Traveler Support Desk
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
            Contact KOLA TOURS AND TRAVEL
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl">
            Visit our Kampala office, send us a consultation inquiry, or connect with our travel specialists on WhatsApp.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
            <h2 className="text-xl font-serif-display font-bold text-slate-900">Office & Direct Channels</h2>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <span>{settings.office_address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-800 shrink-0" />
                <span>{settings.support_phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-800 shrink-0" />
                <span>{settings.business_email}</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <span className="text-xs">{settings.office_hours}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openWhatsAppInquiry('Hello KOLA TOURS AND TRAVEL. I would like to speak with a travel consultant.')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </button>
          </div>

          {/* Embedded Google Map */}
          <div className="bg-white rounded-2xl overflow-hidden border border-stone-200 h-64">
            <iframe
              title="KOLA TOURS Kampala Office Map"
              src={settings.google_maps_embed}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-10 border border-stone-200 shadow-lg">
          <h2 className="text-2xl font-serif-display font-bold text-slate-900 mb-2">
            Send a Travel Consultation Request
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Your message is saved directly to our travel desk and generates a traceable inquiry reference number.
          </p>

          {submittedRef ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Consultation Inquiry Received!</h3>
              <div className="inline-block px-5 py-2 rounded-xl bg-emerald-950 text-amber-300 font-mono font-bold">
                {submittedRef}
              </div>
              <p className="text-xs text-slate-600">Our team will respond to your email and dashboard shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Consultation Topic *</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                >
                  <option>General Travel Consultation</option>
                  <option>Corporate & NGO Travel Account Partnership</option>
                  <option>Group / Family Holiday Planning</option>
                  <option>Flight & Visa Documentation Question</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can KOLA TOURS AND TRAVEL assist you?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm cursor-pointer"
              >
                {submitting ? 'Sending...' : 'Submit Consultation Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function BlogPage() {
  const { slug } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [singleBlog, setSingleBlog] = useState(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/public/blogs/${slug}`)
        .then((r) => r.json())
        .then((d) => setSingleBlog(d.blog || null));
    } else {
      fetch('/api/public/blogs')
        .then((r) => r.json())
        .then((d) => setBlogs(d.blogs || []));
    }
  }, [slug]);

  if (slug && singleBlog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-14 space-y-6">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Travel Guides</span>
        </Link>
        <span className="block text-xs font-bold uppercase text-amber-600">{singleBlog.category} • {singleBlog.read_time}</span>
        <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-slate-900">{singleBlog.title}</h1>
        <img src={singleBlog.cover_image} alt={singleBlog.title} className="w-full h-80 object-cover rounded-2xl" />
        <div className="bg-white p-8 rounded-2xl border border-stone-200 prose max-w-none whitespace-pre-line text-slate-700 leading-relaxed text-sm sm:text-base">
          {singleBlog.content}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-12">
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Insider Tips & Checklists
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
            Travel Blog & Destination Guides
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogs.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col">
            <img src={b.cover_image} alt={b.title} className="h-52 w-full object-cover" />
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-700 uppercase">{b.category} • {b.read_time}</span>
                <h3 className="text-lg font-serif-display font-bold text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{b.excerpt}</p>
              </div>
              <Link to={`/blog/${b.slug}`} className="text-xs font-bold text-emerald-900 inline-flex items-center gap-1 hover:underline">
                <span>Read Full Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  useEffect(() => {
    fetch('/api/public/faqs')
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs || []));
  }, []);

  return (
    <div className="pb-20 space-y-12">
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
            Frequently Asked Questions
          </h1>
          <p className="text-emerald-100/90 text-sm sm:text-base">
            Clear answers on how our booking request, quotation, payment, and visa assistance workflows operate.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {faqs.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl p-6 border border-stone-200 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{f.category}</span>
            <h3 className="text-base font-bold text-slate-900">{f.question}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{f.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrackRequestPage() {
  const { user, token } = useApp();
  const [searchParams] = useSearchParams();
  const [refInput, setRefInput] = useState(searchParams.get('ref') || 'KTT-TUR-2026-1042');
  const [emailInput, setEmailInput] = useState(user?.email || 'grace.nakato@example.com');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setResult(null);
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/requests/track/${encodeURIComponent(refInput)}?email=${encodeURIComponent(emailInput)}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request not found.');
      setResult(data.request);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-14 space-y-8">
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-lg space-y-5">
        <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-slate-900">
          Track Your Booking or Inquiry Reference
        </h1>
        <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Reference Number *</label>
            <input
              type="text"
              required
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="e.g., KTT-TUR-2026-1042"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Customer Email *</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
            />
          </div>
          <button
            type="submit"
            className="py-2.5 px-5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-sm cursor-pointer"
          >
            Track Status
          </button>
        </form>

        {error && <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-xs">{error}</div>}

        {result && (
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold bg-emerald-950 text-amber-300 px-2.5 py-1 rounded">
                  {result.reference_number}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{result.title}</h3>
              </div>
              <StatusBadge status={result.status} />
            </div>
            {result.admin_response && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-slate-800">
                <strong>Consultant Update:</strong> {result.admin_response}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState({ destinations: [], packages: [], hotels: [], blogs: [] });
  const { formatPrice } = useApp();

  useEffect(() => {
    if (!q) return;
    fetch(`/api/public/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setResults(d));
  }, [q]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-slate-900">
        Search Results for “{q}”
      </h1>

      {results.packages.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-emerald-900">Matching Tour Packages ({results.packages.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.packages.map((p) => (
              <Link
                key={p.id}
                to={`/tours/${p.slug}`}
                className="p-4 rounded-xl bg-white border border-stone-200 hover:shadow-md transition block"
              >
                <span className="text-xs font-bold text-emerald-700">{p.destination} • {p.duration_label}</span>
                <h3 className="font-bold text-slate-900 mt-1">{p.title}</h3>
                <p className="text-xs font-bold text-amber-600 mt-2">{formatPrice(p.price_per_person)} / person</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {results.hotels.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-emerald-900">Matching Hotels ({results.hotels.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.hotels.map((h) => (
              <Link
                key={h.id}
                to={`/hotels?destination=${encodeURIComponent(h.destination)}`}
                className="p-4 rounded-xl bg-white border border-stone-200 hover:shadow-md transition block"
              >
                <span className="text-xs font-bold text-emerald-700">{h.destination}, {h.country}</span>
                <h3 className="font-bold text-slate-900 mt-1">{h.name}</h3>
                <p className="text-xs font-bold text-amber-600 mt-2">From {formatPrice(h.indicative_price_usd)} / night</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {results.packages.length === 0 && results.hotels.length === 0 && (
        <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center space-y-3">
          <p className="text-sm text-slate-600">No direct matches found for “{q}”. We can design a custom trip to any destination worldwide!</p>
          <Link to={`/custom-trip?destination=${encodeURIComponent(q)}`} className="inline-block px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold">
            Request Custom Itinerary for {q}
          </Link>
        </div>
      )}
    </div>
  );
}

export function PrivacyTermsPage({ mode = 'privacy' }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-14 space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-stone-200 space-y-4">
        <h1 className="text-3xl font-serif-display font-bold text-slate-900">
          {mode === 'privacy'
            ? 'Privacy & Travel Document Security Policy'
            : 'Booking Terms, Quotations & Conditions'}
        </h1>
        {mode === 'privacy' ? (
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong>1. Protection of Sensitive Customer Documents:</strong> All passport bio-pages, national IDs, bank statements, and visa supporting documents uploaded to KOLA TOURS AND TRAVEL are stored in a non-public, access-controlled server directory and can only be downloaded by the authenticated customer or authorized KOLA TOURS documentation officers.
            </p>
            <p>
              <strong>2. Data Usage:</strong> Personal contact details, travel dates, and nationality information are used strictly to prepare quotations, process bookings with airlines/hotels, and provide visa/passport consultation.
            </p>
            <p>
              <strong>3. Audit Trail:</strong> All administrative actions and document downloads are logged with timestamps and actor identifiers in our security audit log.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong>1. Inquiry & Quotation Workflow:</strong> Submitting a flight, hotel, tour, or custom trip form generates an inquiry reference and does not automatically confirm a seat or room. Confirmations occur after quotation approval and verified payment.
            </p>
            <p>
              <strong>2. Visa & Passport Disclaimer:</strong> KOLA TOURS AND TRAVEL provides application guidance and document review only. Final visa approvals and passport issuance belong strictly to the relevant government authorities.
            </p>
            <p>
              <strong>3. Payments:</strong> Payments via MTN Mobile Money, Airtel Money, Bank Transfer, or Visa/Mastercard must be verified by our accounts desk before a Verified Receipt is issued.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <span className="text-6xl font-serif-display font-bold text-emerald-900">404</span>
        <h1 className="text-2xl font-serif-display font-bold text-slate-900">
          Destination Page Not Found
        </h1>
        <p className="text-sm text-slate-600">
          The page you are looking for may have moved or been updated. Let us guide you back to our main travel hub.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/" className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs">
            Return to Homepage
          </Link>
          <Link to="/tours" className="px-5 py-2.5 rounded-xl border border-stone-300 text-slate-700 font-bold text-xs">
            Explore Tour Packages
          </Link>
        </div>
      </div>
    </div>
  );
}

