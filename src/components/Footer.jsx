import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  CheckCircle2,
  Send,
  ShieldAlert,
  Copy,
  Check,
  X,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import BrandLogo from './BrandLogo';

export default function Footer() {
  const { settings, user, openWhatsAppInquiry, whatsappModal, setWhatsappModal } = useApp();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      const res = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      setNewsletterMsg(data.message || data.error);
      if (res.ok) setNewsletterEmail('');
    } catch {
      setNewsletterMsg('Unable to subscribe right now.');
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(whatsappModal.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawNum = String(settings.whatsapp_number || '').trim();
  const digitsOnly = rawNum.replace(/[^0-9]/g, '');
  const isWhatsappConfigured = digitsOnly.length >= 9 && !rawNum.includes('PENDING');

  return (
    <>
      <footer className="bg-[#0B1F45] text-slate-200 border-t border-white/10 no-print">
        {/* Newsletter Banner */}
        <div className="border-b border-white/10 bg-[#071531]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F28C28]">
                Travel Inspirations & Exclusive Fares
              </span>
              <h3 className="text-2xl font-serif-display font-bold text-white mt-1">
                Join the KOLA TOURS Explorer Circle
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Receive seasonal flight promotions, gorilla trekking permit alerts, and curated holiday packages directly to your inbox.
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="w-full lg:w-auto flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full sm:w-80 px-4 py-3 rounded-xl bg-[#0B1F45] border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#F28C28]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#F28C28] hover:bg-[#e07b18] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Subscribe</span>
              </button>
            </form>
          </div>
          {newsletterMsg && (
            <div className="max-w-7xl mx-auto px-4 pb-4 text-xs text-[#F28C28] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{newsletterMsg}</span>
            </div>
          )}
        </div>

        {/* Main Footer Columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <BrandLogo to="/" variant="footer" />
            <p className="text-sm text-slate-300 leading-relaxed">
              {settings.company_description}
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] text-[#F28C28] font-medium">
                MTN MoMo & Airtel Money Ready
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] text-slate-200 font-medium">
                Visa / Mastercard / Bank Transfer
              </span>
            </div>
          </div>

          {/* Col 2: Core Travel Services */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F28C28] mb-4">
              Our Travel Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/flights" className="text-slate-300 hover:text-white transition">Flight Ticket Inquiries & Reservations</Link></li>
              <li><Link to="/hotels" className="text-slate-300 hover:text-white transition">Luxury Hotel & Resort Bookings</Link></li>
              <li><Link to="/tours" className="text-slate-300 hover:text-white transition">Fixed Safari & Holiday Packages</Link></li>
              <li><Link to="/custom-trip" className="text-slate-300 hover:text-white transition">Custom Travel Itinerary Planner</Link></li>
              <li><Link to="/visa-passport" className="text-slate-300 hover:text-white transition">Visa & Passport Assistance</Link></li>
              <li><Link to="/transfers" className="text-slate-300 hover:text-white transition">Airport Transfers & Chauffeur Fleet</Link></li>
            </ul>
          </div>

          {/* Col 3: Quick Links & Policies */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F28C28] mb-4">
              Company & Resources
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-slate-300 hover:text-white transition">About KOLA TOURS AND TRAVEL</Link></li>
              <li><Link to="/blog" className="text-slate-300 hover:text-white transition">Travel Blog & Destination Guides</Link></li>
              <li><Link to="/faq" className="text-slate-300 hover:text-white transition">Frequently Asked Questions (FAQ)</Link></li>
              <li><Link to="/track" className="text-slate-300 hover:text-white transition">Track Booking Reference</Link></li>
              <li><Link to="/privacy-policy" className="text-slate-300 hover:text-white transition">Privacy & Document Security Policy</Link></li>
              <li><Link to="/terms" className="text-slate-300 hover:text-white transition">Booking Terms & Conditions</Link></li>
              <li><a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">XML Sitemap</a></li>
            </ul>
          </div>

          {/* Col 4: Contact & WhatsApp */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F28C28] mb-4">
              Head Office & Support
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F28C28] shrink-0 mt-1" />
                <span>{settings.office_address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span>{settings.support_phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#F28C28] shrink-0" />
                <a href={`mailto:${settings.business_email}`} className="hover:text-white">
                  {settings.business_email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#F28C28] shrink-0 mt-1" />
                <span className="text-xs text-slate-400">{settings.office_hours}</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => openWhatsAppInquiry('Hello KOLA TOURS AND TRAVEL. I would like to inquire about planning a trip.')}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#F28C28] hover:bg-[#e07b18] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Regulatory Notice */}
        <div className="border-t border-white/10 bg-[#071531] py-6 px-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} {settings.company_name}. All rights reserved.</p>
            <p className="text-center md:text-right max-w-xl">
              Note: All flight, hotel, and tour bookings remain subject to availability and formal quotation approval. Visa & passport issuance decisions belong solely to the respective government authorities.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <button
        type="button"
        onClick={() => openWhatsAppInquiry('Hello KOLA TOURS AND TRAVEL. I am visiting your website and would like travel assistance.')}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-full shadow-xl shadow-emerald-950/40 border border-emerald-400/40 transition transform hover:scale-105 cursor-pointer no-print"
        title="Contact KOLA TOURS on WhatsApp"
      >
        <MessageCircle className="w-5 h-5 fill-white/15" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline">WhatsApp Inquiry</span>
      </button>

      {/* Configurable WhatsApp Placeholder / Preview Modal */}
      {whatsappModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">WhatsApp Direct Inquiry</h3>
                  <p className="text-xs text-slate-500">KOLA TOURS AND TRAVEL Instant Messaging Bridge</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModal({ open: false, message: '' })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Dedicated WhatsApp Number Pending Configuration</p>
                <p className="mt-0.5 text-amber-800">
                  Current Setting: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">{settings.whatsapp_number}</code>.
                  In compliance with company policy, no fabricated phone number is hardcoded. Once the official WhatsApp number is entered in <strong>Admin Console → System Settings</strong>, all WhatsApp buttons automatically launch <code>wa.me</code> directly with your pre-populated message below.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Auto-Generated Inquiry Message
              </label>
              <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-sm text-slate-800 font-medium">
                “{whatsappModal.message}”
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={copyMessage}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Message Copied!' : 'Copy Inquiry Message'}</span>
              </button>

              <div className="flex items-center gap-2">
                {user && user.role === 'admin' && (
                  <Link
                    to="/admin?tab=settings"
                    onClick={() => setWhatsappModal({ open: false, message: '' })}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 text-xs font-bold"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configure Number in Admin</span>
                  </Link>
                )}
                {isWhatsappConfigured && (
                  <a
                    href={`https://wa.me/${digitsOnly}?text=${encodeURIComponent(whatsappModal.message)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    Continue to WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setWhatsappModal({ open: false, message: '' })}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

