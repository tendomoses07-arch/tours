import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Plane,
  Building2,
  Map,
  Compass,
  ShieldCheck,
  FileSpreadsheet,
  Bell,
  UserCog,
  Download,
  CheckCircle2,
  XCircle,
  Upload,
  CreditCard,
  Printer,
  MessageCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';
import BrandLogo from '../components/BrandLogo';

export default function CustomerDashboard() {
  const { user, setUser, token, formatPrice, openWhatsAppInquiry } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [printableQuotation, setPrintableQuotation] = useState(null);

  // Payment submission modal state
  const [paymentModalReq, setPaymentModalReq] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'USD',
    payment_method: 'MTN Mobile Money',
    transaction_reference: '',
    payer_name: user?.full_name || '',
    payer_phone_or_account: user?.phone || '',
    notes: ''
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    passport_number: user?.passport_number || '',
    address: user?.address || ''
  });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  const loadMyData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/requests/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadMyData();
  }, [token, navigate, loadMyData]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        nationality: user.nationality || '',
        passport_number: user.passport_number || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleQuotationDecision = async (quotationId, decision) => {
    const notes = window.prompt(
      decision === 'Accepted'
        ? 'Optional note for your travel consultant upon accepting this quotation:'
        : 'Please share what you would like revised or adjusted in this quotation:',
      ''
    );
    if (notes === null) return;

    try {
      const res = await fetch(`/api/requests/quotations/${quotationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision, notes })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        loadMyData();
      }
    } catch {
      setActionMessage('Unable to submit quotation response.');
    }
  };

  const handleDocUpload = async (requestId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_category', 'Additional Customer Upload');
    try {
      const res = await fetch(`/api/requests/${requestId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        loadMyData();
      }
    } catch {
      setActionMessage('Failed to upload document.');
    }
  };

  const handleDownloadProtectedDoc = async (docId, filename) => {
    try {
      const res = await fetch(`/api/requests/documents/${docId}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unauthorized download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Unable to download document.');
    }
  };

  const handlePaymentProofSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModalReq) return;
    try {
      const res = await fetch(`/api/requests/${paymentModalReq.id}/payments/submit-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        setPaymentModalReq(null);
        loadMyData();
      }
    } catch {
      setActionMessage('Failed to submit payment reference.');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('kola_user', JSON.stringify(data.user));
        setActionMessage(data.message);
      }
    } catch {
      setActionMessage('Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwordForm)
      });
      const data = await res.json();
      setActionMessage(data.message || data.error);
      if (res.ok) setPasswordForm({ current_password: '', new_password: '' });
    } catch {
      setActionMessage('Failed to update password.');
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verifyCode })
      });
      const data = await res.json();
      setActionMessage(data.message || data.error);
      if (res.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('kola_user', JSON.stringify(data.user));
      }
    } catch {
      setActionMessage('Verification failed.');
    }
  };

  // All 10 Required Customer Dashboard Tabs
  const tabs = [
    { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
    { id: 'bookings', label: '2. My Bookings (All)', icon: Briefcase, count: requests.length },
    { id: 'flights', label: '3. My Flight Requests', icon: Plane, count: requests.filter((r) => r.service_type === 'flight').length },
    { id: 'hotels', label: '4. My Hotel Requests', icon: Building2, count: requests.filter((r) => r.service_type === 'hotel').length },
    { id: 'tours', label: '5. My Tour Requests', icon: Map, count: requests.filter((r) => r.service_type === 'tour_fixed').length },
    { id: 'custom', label: '6. My Custom Itineraries', icon: Compass, count: requests.filter((r) => r.service_type === 'tour_custom').length },
    { id: 'visa', label: '7. Visa & Passport Requests', icon: ShieldCheck, count: requests.filter((r) => r.service_type === 'visa_passport').length },
    { id: 'quotations', label: '8. Quotations & Proposals', icon: FileSpreadsheet, count: requests.reduce((acc, r) => acc + (r.quotations?.length || 0), 0) },
    { id: 'notifications', label: '9. Notifications', icon: Bell, count: notifications.filter((n) => !n.is_read).length },
    { id: 'profile', label: '10. Profile Settings', icon: UserCog }
  ];

  const allQuotations = requests.flatMap((r) =>
    (r.quotations || []).map((q) => ({ ...q, request: r }))
  );

  const filterRequestsForTab = () => {
    if (activeTab === 'flights') return requests.filter((r) => r.service_type === 'flight');
    if (activeTab === 'hotels') return requests.filter((r) => r.service_type === 'hotel');
    if (activeTab === 'tours') return requests.filter((r) => r.service_type === 'tour_fixed');
    if (activeTab === 'custom') return requests.filter((r) => r.service_type === 'tour_custom');
    if (activeTab === 'visa') return requests.filter((r) => r.service_type === 'visa_passport');
    return requests;
  };

  const renderRequestCards = (list) => {
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 space-y-3">
          <p className="text-slate-600 text-sm">No travel requests found in this category yet.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/tours" className="px-4 py-2 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold">
              Explore Tour Packages
            </Link>
            <Link to="/flights" className="px-4 py-2 rounded-xl border border-stone-300 text-slate-700 text-xs font-bold">
              Request Flight Quote
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {list.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-950 text-amber-300 font-mono text-xs font-bold">
                    {req.reference_number}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {req.service_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">• Submitted {req.created_at?.slice(0, 10)}</span>
                </div>
                <h3 className="text-lg font-serif-display font-bold text-slate-900 mt-1.5">{req.title}</h3>
              </div>
              <StatusBadge status={req.status} />
            </div>

            {/* Request Details Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-xs">
              {Object.entries(req.details || {}).map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-400 font-semibold uppercase block text-[10px]">
                    {k.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-slate-800 font-medium">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>

            {/* Consultant Response */}
            {req.admin_response && (
              <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Official Response from KOLA TOURS Consultant
                </span>
                <p className="text-sm text-slate-800 leading-relaxed">{req.admin_response}</p>
              </div>
            )}

            {/* Quotations attached to this request */}
            {req.quotations && req.quotations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Official Quotations & Travel Proposals ({req.quotations.length})
                </h4>
                {req.quotations.map((q) => (
                  <div key={q.id} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-950 bg-amber-300 px-2.5 py-0.5 rounded">
                          {q.quotation_number}
                        </span>
                        <span className="ml-2 text-sm font-bold text-slate-900">{q.title}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-emerald-950">
                          {q.currency} {Number(q.total_amount).toLocaleString()}
                        </span>
                        <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-amber-300 text-slate-700">
                          Decision: {q.customer_decision}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700">{q.summary}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPrintableQuotation({ ...q, request: req })}
                        className="px-3.5 py-2 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print / Download Itinerary & Quotation</span>
                      </button>

                      {q.customer_decision === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuotationDecision(q.id, 'Accepted')}
                            className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept Quotation</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuotationDecision(q.id, 'Declined')}
                            className="px-3.5 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Request Revision / Decline</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payments & Balance Tracker */}
            {(req.total_quoted_amount > 0 || (req.payments && req.payments.length > 0)) && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block">Quoted Total</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ${Number(req.total_quoted_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Verified Paid</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      ${Number(req.total_paid_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Outstanding Balance</span>
                    <span className="font-bold text-amber-700 text-sm">
                      ${Math.max(0, Number(req.total_quoted_amount || 0) - Number(req.total_paid_amount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentModalReq(req);
                    setPaymentForm((prev) => ({
                      ...prev,
                      amount: Math.max(0, Number(req.total_quoted_amount || 0) - Number(req.total_paid_amount || 0)) || ''
                    }));
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Submit Payment Reference</span>
                </button>
              </div>
            )}

            {/* Uploaded Documents */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  Protected Documents ({req.documents?.length || 0}):
                </span>
                {(req.documents || []).map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleDownloadProtectedDoc(doc.id, doc.original_filename)}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 text-emerald-900 font-medium inline-flex items-center gap-1 border border-stone-200 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{doc.original_filename}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-slate-700 font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Supporting Document</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDocUpload(req.id, e.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    openWhatsAppInquiry(
                      `Hello KOLA TOURS AND TRAVEL. I am inquiring about my booking request ${req.reference_number} (${req.title}).`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg no-print">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Personal Travel Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif-display font-bold mt-1">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
            {user?.email} • {user?.phone || 'Phone not set'} • Status: {user?.email_verified ? 'Verified Account' : 'Email Unverified'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/custom-trip"
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-emerald-950 font-bold text-xs"
          >
            + Plan Custom Trip
          </Link>
          <Link
            to="/flights"
            className="px-4 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-xs"
          >
            + New Flight Request
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between no-print">
          <span>{actionMessage}</span>
          <button type="button" onClick={() => setActionMessage('')} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 no-print">
        {/* Sidebar Navigation (10 Modules) */}
        <aside className="space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-900 text-amber-300 shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      activeTab === tab.id ? 'bg-amber-400 text-emerald-950' : 'bg-stone-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500">Loading your travel records...</div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <span className="text-xs text-slate-500">Total Requests</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{requests.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <span className="text-xs text-slate-500">Quotations Ready</span>
                  <p className="text-2xl font-bold text-purple-800 mt-1">{allQuotations.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <span className="text-xs text-slate-500">Confirmed Bookings</span>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">
                    {requests.filter((r) => r.status === 'Confirmed' || r.status === 'Completed').length}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-stone-200">
                  <span className="text-xs text-slate-500">Unread Alerts</span>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {notifications.filter((n) => !n.is_read).length}
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-serif-display font-bold text-slate-900">Recent Bookings & Inquiries</h2>
              {renderRequestCards(requests.slice(0, 5))}
            </div>
          ) : ['bookings', 'flights', 'hotels', 'tours', 'custom', 'visa'].includes(activeTab) ? (
            renderRequestCards(filterRequestsForTab())
          ) : activeTab === 'quotations' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-serif-display font-bold text-slate-900">
                My Quotations & Personalized Travel Proposals
              </h2>
              {allQuotations.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-sm text-slate-500">
                  No quotations have been issued yet. Once our consultants review your inquiry, your itemized quotation will appear here.
                </div>
              ) : (
                allQuotations.map((q) => (
                  <div key={q.id} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold bg-emerald-950 text-amber-300 px-2.5 py-1 rounded">
                          {q.quotation_number}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          For Request: <strong>{q.request.reference_number}</strong> • Valid Until: {q.valid_until}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">{q.title}</h3>
                      </div>
                      <div className="text-right">
                        <span className="block text-xl font-bold text-emerald-900">
                          {q.currency} {Number(q.total_amount).toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Status: {q.customer_decision}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600">{q.summary}</p>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto border border-stone-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-slate-600 uppercase">
                          <tr>
                            <th className="p-3">Service Description</th>
                            <th className="p-3">Qty</th>
                            <th className="p-3">Unit Rate</th>
                            <th className="p-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {(q.line_items || []).map((item, i) => (
                            <tr key={i}>
                              <td className="p-3 font-medium text-slate-800">{item.description}</td>
                              <td className="p-3">{item.quantity}</td>
                              <td className="p-3">${Number(item.unit_price).toLocaleString()}</td>
                              <td className="p-3 text-right font-bold">${Number(item.total).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPrintableQuotation(q)}
                        className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Open Printable Quotation / Itinerary</span>
                      </button>
                      {q.customer_decision === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuotationDecision(q.id, 'Accepted')}
                            className="px-4 py-2 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs cursor-pointer"
                          >
                            Accept Quotation
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuotationDecision(q.id, 'Declined')}
                            className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 font-bold text-xs cursor-pointer"
                          >
                            Decline / Request Changes
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'notifications' ? (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <h2 className="text-xl font-serif-display font-bold text-slate-900">My Notifications</h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">You have no notifications yet.</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-3.5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[11px] text-slate-400">{n.created_at}</span>
                      </div>
                      {n.related_request_ref && (
                        <span className="px-2.5 py-1 rounded bg-stone-100 font-mono text-xs font-semibold text-slate-700">
                          {n.related_request_ref}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Tab 10: Profile Settings */
            <div className="space-y-6">
              <form onSubmit={handleProfileSave} className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h2 className="text-xl font-serif-display font-bold text-slate-900">Personal Profile Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={profileForm.nationality}
                      onChange={(e) => setProfileForm({ ...profileForm, nationality: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Passport Number (Optional)</label>
                    <input
                      type="text"
                      value={profileForm.passport_number}
                      onChange={(e) => setProfileForm({ ...profileForm, passport_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Residential / Billing Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </form>

              {!user?.email_verified && (
                <form onSubmit={handleVerifyEmail} className="bg-amber-50 rounded-2xl p-6 border border-amber-200 space-y-3">
                  <h3 className="text-sm font-bold text-amber-900">Verify Your Email Address</h3>
                  <p className="text-xs text-amber-800">
                    Enter the verification code sent to your notifications or email upon registration.
                  </p>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      required
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="Verification Code"
                      className="flex-1 px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-mono uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                </form>
              )}

              <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif-display font-bold text-slate-900">Change Account Password</h3>
                  <button
                    type="button"
                    onClick={() => setShowPasswords((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        required
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => !prev)}
                        aria-label={showPasswords ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">New Password (Min 8 chars) *</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => !prev)}
                        aria-label={showPasswords ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Payment Reference Submission Modal */}
      {paymentModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <form
            onSubmit={handlePaymentProofSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200"
          >
            <h3 className="text-lg font-serif-display font-bold text-slate-900">
              Submit Payment Reference ({paymentModalReq.reference_number})
            </h3>
            <p className="text-xs text-slate-500">
              Note: Payments remain in <strong>Pending Verification</strong> status until verified by our accounts desk.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amount Paid *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Currency</label>
                <select
                  value={paymentForm.currency}
                  onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
                >
                  <option>USD</option>
                  <option>UGX</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method *</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white"
              >
                <option>MTN Mobile Money</option>
                <option>Airtel Money</option>
                <option>Bank Transfer</option>
                <option>Visa</option>
                <option>Mastercard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Transaction ID / Bank Reference *</label>
              <input
                type="text"
                required
                value={paymentForm.transaction_reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                placeholder="e.g., MOMO-TXN-8849201"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalReq(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold cursor-pointer"
              >
                Submit for Verification
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Official Quotation & Itinerary View */}
      {printableQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 overflow-y-auto p-4 sm:p-10 flex justify-center">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 my-auto">
            <div className="flex items-start justify-between border-b border-stone-200 pb-6">
              <div className="bg-[#0B1F45] px-4 py-2.5 rounded-xl">
                <BrandLogo to={null} variant="compact" />
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold bg-[#0B1F45] text-[#F28C28] px-3 py-1 rounded">
                  {printableQuotation.quotation_number}
                </span>
                <p className="text-xs text-slate-500 mt-1">Valid Until: {printableQuotation.valid_until}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{printableQuotation.title}</h3>
              <p className="text-xs text-slate-600">{printableQuotation.summary}</p>
            </div>

            {printableQuotation.itinerary_proposal && printableQuotation.itinerary_proposal.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Proposed Schedule / Flight & Tour Routing
                </h4>
                <div className="space-y-2">
                  {printableQuotation.itinerary_proposal.map((step, i) => (
                    <div key={i} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <strong className="text-emerald-950">{step.day}:</strong>{' '}
                      <span className="text-slate-700">{step.activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <table className="w-full text-left text-xs border border-stone-200">
              <thead className="bg-stone-100">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Qty</th>
                  <th className="p-2.5">Unit Price</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {(printableQuotation.line_items || []).map((li, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5">{li.description}</td>
                    <td className="p-2.5">{li.quantity}</td>
                    <td className="p-2.5">${Number(li.unit_price).toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold">${Number(li.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-950 text-white font-bold">
                <tr>
                  <td colSpan={3} className="p-3 text-right">Total Quotation Amount:</td>
                  <td className="p-3 text-right text-amber-300 text-sm">
                    {printableQuotation.currency} {Number(printableQuotation.total_amount).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">Payment & Confirmation Instructions:</p>
              <p className="text-slate-600">{printableQuotation.payment_instructions}</p>
              {printableQuotation.terms_notes && (
                <p className="text-slate-500 pt-1">Terms: {printableQuotation.terms_notes}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintableQuotation(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

