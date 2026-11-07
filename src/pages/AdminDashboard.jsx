import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Plane,
  Building2,
  Map,
  Compass,
  ShieldCheck,
  Briefcase,
  CreditCard,
  FileText,
  Settings,
  Database,
  Plus,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Trash2,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

const ALL_STATUSES = [
  'Submitted',
  'Under Review',
  'Awaiting Information',
  'Quotation Sent',
  'Awaiting Customer Approval',
  'Payment Pending',
  'Confirmed',
  'Completed',
  'Cancelled'
];

export default function AdminDashboard() {
  const { user, token, settings, refreshSettings } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeModule, setActiveModule] = useState(searchParams.get('tab') || 'overview');
  const [overview, setOverview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [payments, setPayments] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notice, setNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');

  // Filters
  const [reqSearch, setReqSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState('All');
  const [custSearch, setCustSearch] = useState('');

  // Modal for responding / updating status on a request
  const [editingRequest, setEditingRequest] = useState(null);
  const [reqUpdateForm, setReqUpdateForm] = useState({
    status: 'Under Review',
    admin_notes: '',
    admin_response: '',
    total_quoted_amount: 0
  });

  // Modal for creating Official Quotation / Custom Itinerary Proposal
  const [quotationTargetReq, setQuotationTargetReq] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    title: '',
    summary: '',
    line_items: [{ description: '', quantity: 1, unit_price: 500 }],
    itinerary_proposal: [{ day: 'Day 1', activity: '' }],
    taxes_fees: 0,
    currency: 'USD',
    valid_until: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    payment_instructions: 'Pay via MTN Mobile Money, Airtel Money, USD/UGX Bank Transfer, or Visa/Mastercard quoting your Reference Number.',
    terms_notes: 'Subject to airline and hotel availability at confirmation.'
  });

  // Modal for recording manual payment
  const [paymentTargetReq, setPaymentTargetReq] = useState(null);
  const [manualPayForm, setManualPayForm] = useState({
    amount: '',
    currency: 'USD',
    payment_method: 'MTN Mobile Money',
    transaction_reference: '',
    payer_name: '',
    notes: 'Verified by Admin Accounts Desk',
    auto_confirm_booking: true
  });

  // Forms for adding New Tour Package, Destination, Hotel, Blog, Settings
  const [newPkgForm, setNewPkgForm] = useState({
    title: '',
    destination: 'Dubai',
    country: 'United Arab Emirates',
    category: 'City & Luxury',
    duration_days: 5,
    duration_label: '5 Days / 4 Nights',
    price_per_person: 950,
    description: '',
    accommodation_details: '4-Star / 5-Star Partner Hotel with Daily Breakfast',
    transportation_details: 'Private Airport Transfers & Guided Touring Coach',
    activities_csv: 'Guided City Tour, Desert Safari & BBQ, Sunset Marina Cruise',
    included_csv: 'Hotel Accommodation, Daily Breakfast, Airport Transfers, Guided Excursions',
    excluded_csv: 'International Flights, Personal Expenses',
    hero_image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80'
  });

  const [newDestForm, setNewDestForm] = useState({
    name: '',
    country: '',
    region: 'East Africa',
    is_local: true,
    tagline: '',
    description: '',
    starting_from_usd: 550,
    image_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1000&q=80'
  });

  const [newHotelForm, setNewHotelForm] = useState({
    name: '',
    destination: '',
    country: '',
    address: '',
    star_rating: 5,
    accommodation_type: 'Luxury Hotel',
    indicative_price_usd: 250,
    description: '',
    facilities_csv: 'Free Wi-Fi, Swimming Pool, Spa & Gym, Airport Shuttle, Restaurant',
    hero_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
  });

  const [newBlogForm, setNewBlogForm] = useState({
    title: '',
    category: 'Destination Guide',
    excerpt: '',
    content: '',
    read_time: '5 min read',
    cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
  });

  const [newTestimonialForm, setNewTestimonialForm] = useState({
    customer_name: '',
    customer_role_location: 'Kampala, Uganda',
    service_used: 'Dubai Holiday Package',
    rating: 5,
    comment: ''
  });

  const [newFaqForm, setNewFaqForm] = useState({
    category: 'Bookings & Quotations',
    question: '',
    answer: '',
    sort_order: 1
  });

  const [settingsForm, setSettingsForm] = useState({ ...settings });

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  const showFeedback = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setNotice('');
    } else {
      setNotice(msg);
      setErrorMsg('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadPublicMedia = async (file, onUrlReady) => {
    if (!file) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin/upload-media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image upload failed.');
      setUploadedMediaUrl(data.imageUrl);
      if (onUrlReady) onUrlReady(data.imageUrl);
      showFeedback(`Image uploaded successfully: ${data.imageUrl}`);
    } catch (err) {
      showFeedback(err.message, true);
    } finally {
      setUploadingMedia(false);
    }
  };

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const loadAdminAll = useCallback(async () => {
    if (!token || !user || user.role !== 'admin') return;
    try {
      const [ovRes, reqRes, custRes, pkgRes, destRes, htlRes, payRes, testRes, blogRes, faqRes, bkpRes] = await Promise.all([
        fetch('/api/admin/overview', { headers: authHeaders() }),
        fetch('/api/admin/requests', { headers: authHeaders() }),
        fetch('/api/admin/customers', { headers: authHeaders() }),
        fetch('/api/public/packages'),
        fetch('/api/public/destinations'),
        fetch('/api/public/hotels'),
        fetch('/api/admin/payments', { headers: authHeaders() }),
        fetch('/api/admin/testimonials', { headers: authHeaders() }),
        fetch('/api/admin/blogs', { headers: authHeaders() }),
        fetch('/api/admin/faqs', { headers: authHeaders() }),
        fetch('/api/admin/backups', { headers: authHeaders() })
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (reqRes.ok) setRequests((await reqRes.json()).requests || []);
      if (custRes.ok) setCustomers((await custRes.json()).customers || []);
      if (pkgRes.ok) setPackages((await pkgRes.json()).packages || []);
      if (destRes.ok) setDestinations((await destRes.json()).destinations || []);
      if (htlRes.ok) setHotels((await htlRes.json()).hotels || []);
      if (payRes.ok) setPayments((await payRes.json()).payments || []);
      if (testRes.ok) setTestimonials((await testRes.json()).testimonials || []);
      if (blogRes.ok) setBlogs((await blogRes.json()).blogs || []);
      if (faqRes.ok) setFaqs((await faqRes.json()).faqs || []);
      if (bkpRes.ok) {
        const bData = await bkpRes.json();
        setBackups(bData.backups || []);
        setAuditLogs(bData.logs || []);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    }
  }, [token, user, authHeaders]);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadAdminAll();

    const intervalId = setInterval(() => {
      loadAdminAll();
    }, 15000);
    const onFocus = () => loadAdminAll();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [token, user, navigate, loadAdminAll, activeModule]);

  // Handlers
  const handleUpdateRequest = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    const res = await fetch(`/api/admin/requests/${editingRequest.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(reqUpdateForm)
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.message);
      setEditingRequest(null);
      loadAdminAll();
    }
  };

  const handleSendQuotation = async (e) => {
    e.preventDefault();
    if (!quotationTargetReq) return;
    const res = await fetch(`/api/admin/requests/${quotationTargetReq.id}/quotations`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(quoteForm)
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.message);
      setQuotationTargetReq(null);
      loadAdminAll();
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentTargetReq) return;
    const res = await fetch('/api/admin/payments', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...manualPayForm,
        request_id: paymentTargetReq.id
      })
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.message);
      setPaymentTargetReq(null);
      loadAdminAll();
    }
  };

  const handleVerifyPayment = async (paymentId, status) => {
    const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status, confirm_booking: status === 'Verified' })
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.message);
      loadAdminAll();
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    const payload = {
      ...newPkgForm,
      activities: newPkgForm.activities_csv.split(',').map((s) => s.trim()).filter(Boolean),
      included: newPkgForm.included_csv.split(',').map((s) => s.trim()).filter(Boolean),
      excluded: newPkgForm.excluded_csv.split(',').map((s) => s.trim()).filter(Boolean),
      itinerary: [
        { day: 1, title: 'Arrival & Welcome Transfer', description: 'VIP airport pickup and hotel check-in.', meals: 'Dinner', accommodation: newPkgForm.accommodation_details },
        { day: 2, title: 'Guided Signature Excursion', description: 'Full-day guided exploration of key highlights.', meals: 'Breakfast, Lunch', accommodation: newPkgForm.accommodation_details }
      ]
    };
    const res = await fetch('/api/admin/packages', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.message);
      setNewPkgForm({ ...newPkgForm, title: '', description: '' });
      loadAdminAll();
    }
  };

  const handleArchivePackage = async (id) => {
    const res = await fetch(`/api/admin/packages/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.ok) {
      setNotice('Package archived.');
      loadAdminAll();
    }
  };

  const handleCreateDestination = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/destinations', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(newDestForm)
    });
    if (res.ok) {
      setNotice('Destination added.');
      setNewDestForm({ ...newDestForm, name: '', country: '', tagline: '', description: '' });
      loadAdminAll();
    }
  };

  const handleDeleteDestination = async (id) => {
    await fetch(`/api/admin/destinations/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadAdminAll();
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/hotels', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...newHotelForm,
        facilities: newHotelForm.facilities_csv.split(',').map((s) => s.trim()).filter(Boolean)
      })
    });
    if (res.ok) {
      setNotice('Hotel listing added.');
      setNewHotelForm({ ...newHotelForm, name: '', description: '' });
      loadAdminAll();
    }
  };

  const handleDeleteHotel = async (id) => {
    await fetch(`/api/admin/hotels/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadAdminAll();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ settings: settingsForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');
      showFeedback(data.message || 'Homepage & system settings saved successfully.');
      refreshSettings();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleCreateBackup = async () => {
    const res = await fetch('/api/admin/backups', {
      method: 'POST',
      headers: authHeaders()
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.message);
      loadAdminAll();
    }
  };

  const handleDownloadDoc = async (docId, filename) => {
    const res = await fetch(`/api/requests/documents/${docId}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return alert('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // All 10 Required Admin Management Modules + Overview & Backups/Audit
  const modules = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'customers', label: '1. Customer Management', icon: Users },
    { id: 'flights', label: '2. Flight Management', icon: Plane },
    { id: 'hotels', label: '3. Hotel Management', icon: Building2 },
    { id: 'tours', label: '4. Tour & Destination Mgmt', icon: Map },
    { id: 'custom', label: '5. Custom Itinerary Mgmt', icon: Compass },
    { id: 'visa', label: '6. Visa & Passport Mgmt', icon: ShieldCheck },
    { id: 'bookings', label: '7. All Bookings & Requests', icon: Briefcase },
    { id: 'payments', label: '8. Payments & Receipts', icon: CreditCard },
    { id: 'content', label: '9. Website Content (CMS)', icon: FileText },
    { id: 'settings', label: '10. System & WhatsApp Settings', icon: Settings },
    { id: 'security', label: 'Backups & Audit Logs', icon: Database }
  ];

  // Filter requests based on active module or filter controls
  const getFilteredRequests = (forcedType = null) => {
    return requests.filter((r) => {
      if (forcedType && r.service_type !== forcedType) return false;
      if (reqStatusFilter !== 'All' && r.status !== reqStatusFilter) return false;
      if (reqSearch) {
        const q = reqSearch.toLowerCase();
        const match =
          r.reference_number.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_email.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  };

  const renderAdminRequestsTable = (list, sectionTitle) => (
    <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-serif-display font-bold text-slate-900">
          {sectionTitle} ({list.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={reqSearch}
            onChange={(e) => setReqSearch(e.target.value)}
            placeholder="Search Ref #, Customer, Title..."
            className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
          />
          <select
            value={reqStatusFilter}
            onChange={(e) => setReqStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
          >
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {list.map((req) => (
          <div key={req.id} className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-amber-300 font-mono text-xs font-bold">
                    {req.reference_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-stone-200 text-slate-700 text-[11px] font-bold uppercase">
                    {req.service_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    Customer: <strong>{req.customer_name}</strong> ({req.customer_email} • {req.customer_phone})
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">{req.title}</h3>
              </div>
              <StatusBadge status={req.status} />
            </div>

            {/* Structured Inquiry Payload */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 bg-white p-3.5 rounded-xl border border-stone-200 text-xs">
              {Object.entries(req.details || {}).map(([k, v]) => (
                <div key={k}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {k.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-slate-800 font-medium">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>

            {/* Uploaded Documents */}
            {req.documents && req.documents.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-emerald-900">Submitted Documents:</span>
                {req.documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleDownloadDoc(doc.id, doc.original_filename)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 hover:bg-emerald-50 text-emerald-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{doc.original_filename} ({doc.document_category})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Admin Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/80">
              <div className="text-xs text-slate-600">
                Quoted: <strong>${Number(req.total_quoted_amount || 0).toLocaleString()}</strong> • Verified Paid:{' '}
                <strong className="text-emerald-700">${Number(req.total_paid_amount || 0).toLocaleString()}</strong> • Quotations Sent:{' '}
                <strong>{req.quotations?.length || 0}</strong>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRequest(req);
                    setReqUpdateForm({
                      status: req.status,
                      admin_notes: req.admin_notes || '',
                      admin_response: req.admin_response || '',
                      total_quoted_amount: req.total_quoted_amount || 0
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  Update Status / Respond
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuotationTargetReq(req);
                    setQuoteForm((prev) => ({
                      ...prev,
                      title: `Official Quotation for ${req.title}`,
                      summary: `Prepared for ${req.customer_name} (${req.reference_number}).`,
                      line_items: [{ description: req.title, quantity: 1, unit_price: req.total_quoted_amount || 850 }]
                    }));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Prepare & Send Quotation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentTargetReq(req);
                    setManualPayForm((prev) => ({
                      ...prev,
                      amount: Math.max(0, Number(req.total_quoted_amount || 0) - Number(req.total_paid_amount || 0)) || 500,
                      payer_name: req.customer_name
                    }));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const stats = overview?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Centralized Travel Operations Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif-display font-bold mt-1">
            KOLA TOURS AND TRAVEL — Administration
          </h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            Signed in as {user?.full_name} ({user?.email}) • Role: Administrator
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              loadAdminAll();
              showFeedback('Admin console synced with latest customers and bookings.');
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-amber-300" />
            <span>Refresh Live Data</span>
          </button>
          <button
            type="button"
            onClick={handleCreateBackup}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>Snapshot DB Backup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('settings')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Configure WhatsApp & Settings</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-xs underline cursor-pointer">Dismiss</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} className="text-xs underline cursor-pointer">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="space-y-1.5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  activeModule === m.id
                    ? 'bg-emerald-900 text-amber-300 shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{m.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* OVERVIEW */}
          {activeModule === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Registered Customers', val: stats.totalCustomers || 0, color: 'text-slate-900', target: 'customers' },
                  { label: 'Total Booking Requests', val: stats.totalRequests || 0, color: 'text-emerald-900', target: 'requests' },
                  { label: 'Pending Inquiries', val: stats.pendingInquiries || 0, color: 'text-amber-600', target: 'requests' },
                  { label: 'Confirmed Bookings', val: stats.confirmedBookings || 0, color: 'text-emerald-700', target: 'requests' },
                  { label: 'Active Tour Packages', val: stats.totalPackages || 0, color: 'text-slate-900', target: 'tours' },
                  { label: 'Flight Inquiries', val: stats.totalFlightInquiries || 0, color: 'text-blue-800', target: 'flights' },
                  { label: 'Hotel Inquiries', val: stats.totalHotelInquiries || 0, color: 'text-indigo-800', target: 'hotels' },
                  { label: 'Visa & Passport Requests', val: stats.totalVisaRequests || 0, color: 'text-purple-800', target: 'visa' }
                ].map((card) => (
                  <button
                    key={card.label}
                    type="button"
                    onClick={() => setActiveModule(card.target)}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-emerald-800 hover:shadow-md transition text-left cursor-pointer"
                  >
                    <span className="text-xs text-slate-500 font-medium block">{card.label}</span>
                    <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.val}</p>
                  </button>
                ))}
              </div>

              {renderAdminRequestsTable(requests.slice(0, 8), 'Recent Customer Booking & Assistance Requests')}

              {/* Recently Registered Customers Preview on Overview */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-serif-display font-bold text-slate-900">
                      Recently Registered Customers ({customers.filter((c) => c.role === 'customer').length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Newest customer accounts created on the platform
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModule('customers')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    View All Customers
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-slate-600 uppercase">
                      <tr>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Email & Phone</th>
                        <th className="p-3">Nationality</th>
                        <th className="p-3">Bookings</th>
                        <th className="p-3">Registered On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {customers
                        .filter((c) => c.role === 'customer')
                        .slice(0, 6)
                        .map((c) => (
                          <tr key={c.id}>
                            <td className="p-3 font-bold text-slate-900">{c.full_name}</td>
                            <td className="p-3">
                              <div>{c.email}</div>
                              <div className="text-slate-400">{c.phone}</div>
                            </td>
                            <td className="p-3">{c.nationality || '—'}</td>
                            <td className="p-3 font-bold text-emerald-900">{c.request_count || 0}</td>
                            <td className="p-3 text-slate-500">{c.created_at}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 1. CUSTOMER MANAGEMENT */}
          {activeModule === 'customers' && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-serif-display font-bold text-slate-900">
                  Customer Accounts ({customers.length})
                </h2>
                <input
                  type="text"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  placeholder="Search customers by name, email, phone..."
                  className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs w-64"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-slate-600 uppercase">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Nationality</th>
                      <th className="p-3">Requests</th>
                      <th className="p-3">Role / Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {customers
                      .filter(
                        (c) =>
                          !custSearch ||
                          c.full_name.toLowerCase().includes(custSearch.toLowerCase()) ||
                          c.email.toLowerCase().includes(custSearch.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id}>
                          <td className="p-3 font-bold text-slate-900">{c.full_name}</td>
                          <td className="p-3">
                            <div>{c.email}</div>
                            <div className="text-slate-400">{c.phone}</div>
                          </td>
                          <td className="p-3">{c.nationality || '—'}</td>
                          <td className="p-3 font-bold">{c.request_count}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-stone-100 font-semibold">{c.role}</span>{' '}
                            <span className={`px-2 py-0.5 rounded font-semibold ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {c.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const nextStatus = c.status === 'active' ? 'suspended' : 'active';
                                  await fetch(`/api/admin/customers/${c.id}`, {
                                    method: 'PUT',
                                    headers: authHeaders(),
                                    body: JSON.stringify({ status: nextStatus })
                                  });
                                  loadAdminAll();
                                }}
                                className="px-2.5 py-1 rounded border border-stone-300 hover:bg-stone-100 font-semibold cursor-pointer"
                              >
                                {c.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. FLIGHT MANAGEMENT */}
          {activeModule === 'flights' &&
            renderAdminRequestsTable(getFilteredRequests('flight'), 'Flight Inquiries & Fare Quotations')}

          {/* 3. HOTEL MANAGEMENT */}
          {activeModule === 'hotels' && (
            <div className="space-y-8">
              {renderAdminRequestsTable(getFilteredRequests('hotel'), 'Hotel Reservation Inquiries')}

              <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Manage Partner Hotel Listings ({hotels.length})
                </h3>
                <form onSubmit={handleCreateHotel} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <input
                    type="text"
                    required
                    value={newHotelForm.name}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, name: e.target.value })}
                    placeholder="Hotel Name *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newHotelForm.destination}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, destination: e.target.value, country: e.target.value })}
                    placeholder="City / Destination *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="number"
                    required
                    value={newHotelForm.indicative_price_usd}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, indicative_price_usd: e.target.value })}
                    placeholder="Indicative Nightly Rate USD *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    value={newHotelForm.description}
                    onChange={(e) => setNewHotelForm({ ...newHotelForm, description: e.target.value })}
                    placeholder="Short Hotel Description..."
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    + Add Hotel Listing
                  </button>
                </form>

                <div className="divide-y divide-stone-100 text-xs">
                  {hotels.map((h) => (
                    <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-900">{h.name}</span> — {h.destination} (${h.indicative_price_usd}/nt)
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHotel(h.id)}
                        className="text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. TOUR & DESTINATION MANAGEMENT */}
          {activeModule === 'tours' && (
            <div className="space-y-8">
              {renderAdminRequestsTable(getFilteredRequests('tour_fixed'), 'Fixed Tour Package Booking Requests')}

              {/* Create Tour Package */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Create New Fixed Tour Package
                </h3>
                <form onSubmit={handleCreatePackage} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <input
                    type="text"
                    required
                    value={newPkgForm.title}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, title: e.target.value })}
                    placeholder="Package Title *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newPkgForm.destination}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, destination: e.target.value })}
                    placeholder="Destination *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="number"
                    required
                    value={newPkgForm.price_per_person}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, price_per_person: e.target.value })}
                    placeholder="Price per Person (USD) *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    value={newPkgForm.duration_label}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, duration_label: e.target.value })}
                    placeholder="Duration Label (e.g., 5 Days / 4 Nights)"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <select
                    value={newPkgForm.category}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, category: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  >
                    <option>Safari & Wildlife</option>
                    <option>Beach & Island</option>
                    <option>City & Luxury</option>
                    <option>Cultural & Heritage</option>
                    <option>Honeymoon & Romance</option>
                  </select>
                  <input
                    type="text"
                    value={newPkgForm.hero_image}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, hero_image: e.target.value })}
                    placeholder="Hero Image URL"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <textarea
                    rows={2}
                    required
                    value={newPkgForm.description}
                    onChange={(e) => setNewPkgForm({ ...newPkgForm, description: e.target.value })}
                    placeholder="Full Package Description *"
                    className="sm:col-span-3 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-3 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    + Publish Tour Package
                  </button>
                </form>

                <div className="divide-y divide-stone-100 text-xs">
                  {packages.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-900">{p.title}</span> • {p.destination} • {p.duration_label} •{' '}
                        <strong className="text-emerald-800">${p.price_per_person}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleArchivePackage(p.id)}
                        className="text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Archive
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manage Destinations */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Manage Featured Destinations ({destinations.length})
                </h3>
                <form onSubmit={handleCreateDestination} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <input
                    type="text"
                    required
                    value={newDestForm.name}
                    onChange={(e) => setNewDestForm({ ...newDestForm, name: e.target.value })}
                    placeholder="Destination Name *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newDestForm.country}
                    onChange={(e) => setNewDestForm({ ...newDestForm, country: e.target.value })}
                    placeholder="Country *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newDestForm.tagline}
                    onChange={(e) => setNewDestForm({ ...newDestForm, tagline: e.target.value })}
                    placeholder="Short Tagline *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    + Add Destination
                  </button>
                </form>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {destinations.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-lg border border-stone-200 flex items-center justify-between">
                      <span><strong>{d.name}</strong> ({d.country})</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteDestination(d.id)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. CUSTOM ITINERARY MANAGEMENT */}
          {activeModule === 'custom' &&
            renderAdminRequestsTable(getFilteredRequests('tour_custom'), 'Custom Travel Itinerary Requests')}

          {/* 6. VISA & PASSPORT MANAGEMENT */}
          {activeModule === 'visa' &&
            renderAdminRequestsTable(getFilteredRequests('visa_passport'), 'Visa & Passport Assistance Applications')}

          {/* 7. ALL BOOKINGS MANAGEMENT */}
          {activeModule === 'bookings' &&
            renderAdminRequestsTable(getFilteredRequests(null), 'All Platform Service Requests & Bookings')}

          {/* 8. PAYMENTS MANAGEMENT */}
          {activeModule === 'payments' && (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-5">
              <h2 className="text-xl font-serif-display font-bold text-slate-900">
                Payments, Verification & Receipts ({payments.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-slate-600 uppercase">
                    <tr>
                      <th className="p-3">Receipt #</th>
                      <th className="p-3">Booking Ref</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Method & Ref</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-mono font-bold text-emerald-900">{p.receipt_number}</td>
                        <td className="p-3 font-mono">{p.reference_number}</td>
                        <td className="p-3">{p.payer_name}</td>
                        <td className="p-3">
                          <div>{p.payment_method}</div>
                          <div className="font-mono text-slate-400">{p.transaction_reference}</div>
                        </td>
                        <td className="p-3 font-bold">
                          {p.currency} {Number(p.amount).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold ${
                              p.status === 'Verified'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {p.status !== 'Verified' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(p.id, 'Verified')}
                              className="px-2.5 py-1 rounded bg-emerald-800 text-amber-300 font-bold cursor-pointer"
                            >
                              Verify & Confirm
                            </button>
                          )}
                          {p.status === 'Pending Verification' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyPayment(p.id, 'Rejected')}
                              className="px-2.5 py-1 rounded border border-rose-300 text-rose-700 font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. WEBSITE CONTENT MANAGEMENT */}
          {activeModule === 'content' && (
            <div className="space-y-8">
              {/* Section A: Homepage Content, Hero Banner & Company Info */}
              <form
                onSubmit={handleSaveSettings}
                className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                      Homepage & Brand Content
                    </span>
                    <h2 className="text-xl font-serif-display font-bold text-slate-900 mt-0.5">
                      Edit Homepage Hero Banner, Headlines & Company Information
                    </h2>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs shadow cursor-pointer"
                  >
                    Save Homepage & Company Content
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Homepage Hero Headline
                    </label>
                    <input
                      type="text"
                      value={settingsForm.hero_headline || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_headline: e.target.value })}
                      placeholder="Explore the World. We Make Your Journey Easier."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Homepage Hero Sub-Headline / Introduction
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.hero_subheadline || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, hero_subheadline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Hero Banner Background Image (URL or Upload Image Below)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={settingsForm.hero_banner_image || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hero_banner_image: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                      />
                      <label className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-800 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                        <span>{uploadingMedia ? 'Uploading...' : 'Upload New Banner Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleUploadPublicMedia(e.target.files?.[0], (url) =>
                              setSettingsForm((prev) => ({ ...prev, hero_banner_image: url }))
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={settingsForm.company_name || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, company_name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Company Tagline</label>
                    <input
                      type="text"
                      value={settingsForm.company_tagline || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, company_tagline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      About Us / Footer Company Description
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.company_description || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, company_description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                </div>
              </form>

              {/* Section B: Media & Banner Image Uploader */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Upload Website Images & Media Library
                </h3>
                <p className="text-xs text-slate-500">
                  Upload photos for tour packages, destinations, hotels, or blog articles and copy the generated public URL.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs inline-flex items-center gap-2 cursor-pointer">
                    <span>{uploadingMedia ? 'Uploading Image...' : '+ Select & Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadPublicMedia(e.target.files?.[0])}
                    />
                  </label>
                  {uploadedMediaUrl && (
                    <div className="flex items-center gap-2 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200 text-xs">
                      <span className="font-mono text-emerald-900 font-semibold">{uploadedMediaUrl}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(uploadedMediaUrl);
                          showFeedback('Image URL copied to clipboard!');
                        }}
                        className="px-2 py-0.5 rounded bg-white border border-stone-300 font-bold text-[11px] cursor-pointer"
                      >
                        Copy URL
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section C: Travel Blog & Destination Guides Management */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Manage Travel Blog & Destination Guides ({blogs.length})
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch('/api/admin/blogs', {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify(newBlogForm)
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Failed to publish blog guide.');
                      showFeedback(data.message || 'Blog article published!');
                      setNewBlogForm({
                        title: '',
                        category: 'Destination Guide',
                        excerpt: '',
                        content: '',
                        read_time: '5 min read',
                        cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
                      });
                      loadAdminAll();
                    } catch (err) {
                      showFeedback(err.message, true);
                    }
                  }}
                  className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={newBlogForm.title}
                      onChange={(e) => setNewBlogForm({ ...newBlogForm, title: e.target.value })}
                      placeholder="Article Title *"
                      className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                    />
                    <input
                      type="text"
                      value={newBlogForm.category}
                      onChange={(e) => setNewBlogForm({ ...newBlogForm, category: e.target.value })}
                      placeholder="Category (e.g., Safari Guides, Visa Tips)"
                      className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newBlogForm.excerpt}
                      onChange={(e) => setNewBlogForm({ ...newBlogForm, excerpt: e.target.value })}
                      placeholder="Short Summary / Excerpt"
                      className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                    />
                    <input
                      type="text"
                      value={newBlogForm.cover_image}
                      onChange={(e) => setNewBlogForm({ ...newBlogForm, cover_image: e.target.value })}
                      placeholder="Cover Image URL"
                      className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={newBlogForm.content}
                    onChange={(e) => setNewBlogForm({ ...newBlogForm, content: e.target.value })}
                    placeholder="Full Article Content *"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    + Publish Blog Guide
                  </button>
                </form>

                {/* Existing Blog Articles List */}
                <div className="divide-y divide-stone-100 text-xs">
                  {blogs.map((b) => (
                    <div key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={b.cover_image} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block">{b.title}</span>
                          <span className="text-slate-500">{b.category} • {b.read_time} • Slug: /blog/{b.slug}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/blogs/${b.id}`, { method: 'DELETE', headers: authHeaders() });
                          if (res.ok) {
                            showFeedback('Blog article removed.');
                            loadAdminAll();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold shrink-0 cursor-pointer"
                      >
                        Delete Article
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section D: Customer Testimonials Management */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Manage Customer Testimonials ({testimonials.length})
                </h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch('/api/admin/testimonials', {
                        method: 'POST',
                        headers: authHeaders(),
                        body: JSON.stringify(newTestimonialForm)
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Failed to add testimonial.');
                      showFeedback(data.message || 'Testimonial added!');
                      setNewTestimonialForm({
                        customer_name: '',
                        customer_role_location: 'Kampala, Uganda',
                        service_used: 'Dubai Holiday Package',
                        rating: 5,
                        comment: ''
                      });
                      loadAdminAll();
                    } catch (err) {
                      showFeedback(err.message, true);
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <input
                    type="text"
                    required
                    value={newTestimonialForm.customer_name}
                    onChange={(e) => setNewTestimonialForm({ ...newTestimonialForm, customer_name: e.target.value })}
                    placeholder="Client Name *"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    value={newTestimonialForm.customer_role_location}
                    onChange={(e) => setNewTestimonialForm({ ...newTestimonialForm, customer_role_location: e.target.value })}
                    placeholder="Location (e.g., Kampala, Uganda)"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    value={newTestimonialForm.service_used}
                    onChange={(e) => setNewTestimonialForm({ ...newTestimonialForm, service_used: e.target.value })}
                    placeholder="Service / Package Used"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newTestimonialForm.comment}
                    onChange={(e) => setNewTestimonialForm({ ...newTestimonialForm, comment: e.target.value })}
                    placeholder="Client Review Quote *"
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    + Add Testimonial
                  </button>
                </form>

                <div className="divide-y divide-stone-100 text-xs">
                  {testimonials.map((t) => (
                    <div key={t.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="max-w-2xl">
                        <span className="font-bold text-slate-900">{t.customer_name}</span>{' '}
                        <span className="text-slate-500">({t.customer_role_location} • {t.service_used})</span>
                        <p className="text-slate-700 italic mt-0.5">“{t.comment}”</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/testimonials/${t.id}`, {
                              method: 'PUT',
                              headers: authHeaders(),
                              body: JSON.stringify({ is_approved: !t.is_approved })
                            });
                            showFeedback(t.is_approved ? 'Testimonial hidden.' : 'Testimonial approved.');
                            loadAdminAll();
                          }}
                          className={`px-2.5 py-1 rounded-lg border font-semibold cursor-pointer ${
                            t.is_approved
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          {t.is_approved ? 'Approved (Visible)' : 'Hidden (Click to Approve)'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/testimonials/${t.id}`, { method: 'DELETE', headers: authHeaders() });
                            showFeedback('Testimonial deleted.');
                            loadAdminAll();
                          }}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section E: Frequently Asked Questions (FAQ) Management */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Manage Frequently Asked Questions ({faqs.length})
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await fetch('/api/admin/faqs', {
                      method: 'POST',
                      headers: authHeaders(),
                      body: JSON.stringify(newFaqForm)
                    });
                    if (res.ok) {
                      showFeedback('New FAQ item published!');
                      setNewFaqForm({ ...newFaqForm, question: '', answer: '' });
                      loadAdminAll();
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <input
                    type="text"
                    value={newFaqForm.category}
                    onChange={(e) => setNewFaqForm({ ...newFaqForm, category: e.target.value })}
                    placeholder="Category (e.g., Bookings, Visas)"
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newFaqForm.question}
                    onChange={(e) => setNewFaqForm({ ...newFaqForm, question: e.target.value })}
                    placeholder="Question *"
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newFaqForm.answer}
                    onChange={(e) => setNewFaqForm({ ...newFaqForm, answer: e.target.value })}
                    placeholder="Answer *"
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    + Add FAQ
                  </button>
                </form>

                <div className="divide-y divide-stone-100 text-xs">
                  {faqs.map((f) => (
                    <div key={f.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700">{f.category}</span>
                        <p className="font-bold text-slate-900">{f.question}</p>
                        <p className="text-slate-600 mt-0.5">{f.answer}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/faqs/${f.id}`, { method: 'DELETE', headers: authHeaders() });
                          showFeedback('FAQ item deleted.');
                          loadAdminAll();
                        }}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold shrink-0 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. SYSTEM SETTINGS (Incl. Configurable WhatsApp Number) */}
          {activeModule === 'settings' && (
            <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 space-y-6">
              <div>
                <h2 className="text-xl font-serif-display font-bold text-slate-900">
                  System & WhatsApp Integration Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your official dedicated WhatsApp Business number, company contact information, hero banner, and Uganda payment instructions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-900">
                  Official WhatsApp Business Number (International Format e.g., +256772123456)
                </label>
                <input
                  type="text"
                  value={settingsForm.whatsapp_number || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-sm font-mono"
                />
                <p className="text-[11px] text-amber-800">
                  Leave as <code>WHATSAPP_NUMBER_PENDING_CONFIGURATION</code> until the dedicated number is supplied, or enter your active number (e.g., <code>256772000000</code>) to immediately activate live <code>wa.me</code> links site-wide.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={settingsForm.company_name || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, company_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Business Email</label>
                  <input
                    type="email"
                    value={settingsForm.business_email || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, business_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Support Phone Display</label>
                  <input
                    type="text"
                    value={settingsForm.support_phone || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, support_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">USD to UGX Exchange Rate</label>
                  <input
                    type="text"
                    value={settingsForm.ugx_exchange_rate || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, ugx_exchange_rate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={settingsForm.office_address || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, office_address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Homepage Hero Headline</label>
                  <input
                    type="text"
                    value={settingsForm.hero_headline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hero_headline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">MTN Mobile Money & Airtel Money Payment Instructions</label>
                  <input
                    type="text"
                    value={settingsForm.payment_mtn_momo_instructions || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, payment_mtn_momo_instructions: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm cursor-pointer"
              >
                Save All System Settings
              </button>
            </form>
          )}

          {/* BACKUPS & AUDIT LOGS */}
          {activeModule === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif-display font-bold text-slate-900">
                    Database Backups ({backups.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    className="px-4 py-2 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    + Create Snapshot Backup Now
                  </button>
                </div>
                <div className="divide-y divide-stone-100 text-xs">
                  {backups.map((b) => (
                    <div key={b.filename} className="py-2.5 flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-800">{b.filename}</span>
                      <span className="text-slate-500">{Math.round(b.sizeBytes / 1024)} KB • {b.createdAt.slice(0, 19)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-4">
                <h3 className="text-lg font-serif-display font-bold text-slate-900">
                  Security & Administrative Audit Logs
                </h3>
                <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono font-bold text-emerald-900">{log.action}</span> — {log.actor_email} ({log.actor_role}) →{' '}
                        <span className="font-semibold">{log.target_type}:{log.target_ref}</span> ({log.details})
                      </div>
                      <span className="text-slate-400 shrink-0">{log.created_at}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Update Request Status & Consultant Response */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateRequest}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200"
          >
            <h3 className="text-lg font-serif-display font-bold text-slate-900">
              Update Request {editingRequest.reference_number}
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Workflow Status</label>
              <select
                value={reqUpdateForm.status}
                onChange={(e) => setReqUpdateForm({ ...reqUpdateForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Response to Customer (Visible in Customer Dashboard & Email)
              </label>
              <textarea
                rows={3}
                value={reqUpdateForm.admin_response}
                onChange={(e) => setReqUpdateForm({ ...reqUpdateForm, admin_response: e.target.value })}
                placeholder="Write your update, document request, or booking confirmation instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Internal Admin Notes</label>
              <input
                type="text"
                value={reqUpdateForm.admin_notes}
                onChange={(e) => setReqUpdateForm({ ...reqUpdateForm, admin_notes: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold cursor-pointer"
              >
                Save & Notify Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Prepare & Send Official Quotation */}
      {quotationTargetReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSendQuotation}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-stone-200 my-auto"
          >
            <h3 className="text-lg font-serif-display font-bold text-slate-900">
              Create & Send Quotation for {quotationTargetReq.reference_number}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Quotation Title *</label>
                <input
                  type="text"
                  required
                  value={quoteForm.title}
                  onChange={(e) => setQuoteForm({ ...quoteForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Proposal Summary</label>
                <textarea
                  rows={2}
                  value={quoteForm.summary}
                  onChange={(e) => setQuoteForm({ ...quoteForm, summary: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Itemized Breakdown</label>
                <button
                  type="button"
                  onClick={() =>
                    setQuoteForm({
                      ...quoteForm,
                      line_items: [...quoteForm.line_items, { description: '', quantity: 1, unit_price: 100 }]
                    })
                  }
                  className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  + Add Line Item
                </button>
              </div>
              {quoteForm.line_items.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    required
                    value={li.description}
                    onChange={(e) => {
                      const next = [...quoteForm.line_items];
                      next[idx].description = e.target.value;
                      setQuoteForm({ ...quoteForm, line_items: next });
                    }}
                    placeholder="Item description"
                    className="col-span-7 px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    value={li.quantity}
                    onChange={(e) => {
                      const next = [...quoteForm.line_items];
                      next[idx].quantity = Number(e.target.value);
                      setQuoteForm({ ...quoteForm, line_items: next });
                    }}
                    placeholder="Qty"
                    className="col-span-2 px-2 py-1.5 rounded-lg border border-stone-300 text-xs"
                  />
                  <input
                    type="number"
                    value={li.unit_price}
                    onChange={(e) => {
                      const next = [...quoteForm.line_items];
                      next[idx].unit_price = Number(e.target.value);
                      setQuoteForm({ ...quoteForm, line_items: next });
                    }}
                    placeholder="Unit USD"
                    className="col-span-3 px-2 py-1.5 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuotationTargetReq(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold cursor-pointer"
              >
                Send Official Quotation to Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Record Payment */}
      {paymentTargetReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200"
          >
            <h3 className="text-lg font-serif-display font-bold text-slate-900">
              Record Verified Payment ({paymentTargetReq.reference_number})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Amount *</label>
                <input
                  type="number"
                  required
                  value={manualPayForm.amount}
                  onChange={(e) => setManualPayForm({ ...manualPayForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Method</label>
                <select
                  value={manualPayForm.payment_method}
                  onChange={(e) => setManualPayForm({ ...manualPayForm, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                >
                  <option>MTN Mobile Money</option>
                  <option>Airtel Money</option>
                  <option>Bank Transfer</option>
                  <option>Visa</option>
                  <option>Mastercard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Transaction Reference *</label>
              <input
                type="text"
                required
                value={manualPayForm.transaction_reference}
                onChange={(e) => setManualPayForm({ ...manualPayForm, transaction_reference: e.target.value })}
                placeholder="e.g., STANBIC-TXN-2026-991"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentTargetReq(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-900 text-amber-300 text-xs font-bold cursor-pointer"
              >
                Generate Receipt & Confirm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

