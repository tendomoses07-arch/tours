import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Plane,
  Building2,
  Map,
  ShieldCheck,
  Car,
  Menu,
  X,
  LogOut,
  Search,
  LayoutDashboard,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const { user, logoutSession, currency, setCurrency, openWhatsAppInquiry } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/flights', label: 'Flights', icon: Plane },
    { to: '/hotels', label: 'Hotels', icon: Building2 },
    { to: '/tours', label: 'Tours & Packages', icon: Map },
    { to: '/visa-passport', label: 'Visa & Passport', icon: ShieldCheck },
    { to: '/transfers', label: 'Transfers', icon: Car },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B1F45] text-white border-b border-white/10 shadow-lg no-print">
      {/* Top utility bar */}
      <div className="bg-[#071531] border-b border-white/10 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-slate-200">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
              Uganda’s Premier International Travel &amp; Safari Specialists
            </span>
            <Link to="/track" className="text-[#F28C28] hover:text-amber-300 font-medium underline underline-offset-2">
              Track Booking Reference
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openWhatsAppInquiry('Hello KOLA TOURS AND TRAVEL. I would like to speak with a travel consultant.')}
              className="text-slate-200 hover:text-[#F28C28] flex items-center gap-1 cursor-pointer transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>WhatsApp Desk</span>
            </button>
            <div className="flex items-center bg-[#0B1F45] rounded-full p-0.5 border border-white/20">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                  currency === 'USD' ? 'bg-[#F28C28] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('UGX')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                  currency === 'UGX' ? 'bg-[#F28C28] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                UGX
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Left-Aligned Brand Logo */}
          <BrandLogo to="/" variant="header" className="shrink-0" />

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-white/10 text-[#F28C28] font-semibold'
                      : 'text-slate-100 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search Destinations, Tours & Guides"
              className="p-2.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-[#F28C28] text-sm font-semibold border border-white/15 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{user.role === 'admin' ? 'Admin Console' : 'My Dashboard'}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logoutSession();
                    navigate('/');
                  }}
                  title="Log Out"
                  className="p-2 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-white/10 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-100 hover:text-white hover:bg-white/10 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 rounded-lg text-sm font-medium border border-white/20 text-slate-100 hover:bg-white/10 transition"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              to="/custom-trip"
              className="ml-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#e07b18] text-white font-bold text-sm shadow-md transition"
            >
              Plan Your Trip
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-slate-200 hover:text-white"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-100 hover:bg-white/10"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="pb-4 pt-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations (Dubai, Zanzibar, Bwindi), tour packages, hotels, or visa guides..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-300/70 focus:outline-none focus:border-[#F28C28]"
              autoFocus
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F28C28] hover:bg-[#e07b18] text-white font-semibold text-sm rounded-xl cursor-pointer"
            >
              Search
            </button>
          </form>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#0B1F45] border-t border-white/15 px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-white/10 text-[#F28C28] font-semibold' : 'text-slate-100 hover:bg-white/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-white/15 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 text-[#F28C28] font-semibold text-center text-sm"
                >
                  {user.role === 'admin' ? 'Open Admin Dashboard' : 'My Customer Dashboard'}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logoutSession();
                    setMobileOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-2 px-4 rounded-xl border border-white/20 text-rose-300 text-sm font-medium"
                >
                  Log Out ({user.full_name})
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl border border-white/20 text-slate-100 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-white/10 text-white text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
            <Link
              to="/custom-trip"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3 rounded-xl bg-[#F28C28] text-white font-bold text-center text-sm shadow-md"
            >
              Plan Your Trip / Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
