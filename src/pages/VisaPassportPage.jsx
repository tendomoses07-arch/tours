import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  FileBadge,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Lock,
  MessageCircle,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function VisaPassportPage() {
  const { user, token, openWhatsAppInquiry } = useApp();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('type') === 'passport' ? 'Passport Assistance' : 'Visa Assistance';
  const [category, setCategory] = useState(initialTab);

  const [form, setForm] = useState({
    assistanceType: initialTab === 'Passport Assistance' ? 'Passport Application Guidance' : 'Tourist Visa Assistance',
    destinationCountry: searchParams.get('country') || 'United Arab Emirates (Dubai)',
    nationality: user?.nationality || 'Ugandan',
    intendedTravelDate: '',
    durationOfStay: '14 Days',
    travelPurpose: '',
    hasValidPassport: 'Yes (Valid 6+ Months)',
    document_category: 'Passport Bio Page / Supporting Document',
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || ''
  });

  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState(null);

  const visaTypes = [
    {
      title: 'Tourist Visa Assistance',
      desc: 'Document checklist preparation, hotel/flight reservation holds, cover letter drafting, and consular appointment scheduling.'
    },
    {
      title: 'Business Visa Assistance',
      desc: 'Corporate invitation verification, chamber/company registration review, and priority embassy submission guidance.'
    },
    {
      title: 'Student Visa Guidance',
      desc: 'University CAS/admission letter checklist, financial sponsorship proof formatting, and visa interview preparation.'
    },
    {
      title: 'Transit Visa Guidance',
      desc: 'Multi-airline layover visa requirements assessment for UK, Schengen, UAE, and Middle Eastern hubs.'
    },
    {
      title: 'General Visa Consultation',
      desc: 'One-on-one case assessment including prior refusal review and multi-country travel documentation planning.'
    }
  ];

  const passportTypes = [
    {
      title: 'Passport Application Guidance',
      desc: 'First-time Ugandan & regional e-Passport online portal guidance, national ID verification checklist, and fee payment assistance.'
    },
    {
      title: 'Passport Renewal Guidance',
      desc: 'Expired or full-page passport renewal workflow, damaged/lost passport affidavit checklist, and biometric appointment scheduling.'
    },
    {
      title: 'Required Document Information',
      desc: 'Detailed verification of birth/citizenship records, recommender requirements, and minor/child consent documentation.'
    },
    {
      title: 'Application Process Guidance',
      desc: 'Step-by-step tracking and preparation before appearing at the Directorate of Citizenship and Immigration Control.'
    }
  ];

  const handleCategorySwitch = (newCat) => {
    setCategory(newCat);
    setForm((prev) => ({
      ...prev,
      assistanceType:
        newCat === 'Passport Assistance' ? 'Passport Application Guidance' : 'Tourist Visa Assistance',
      destinationCountry: newCat === 'Passport Assistance' ? 'Uganda (e-Passport Directorate)' : prev.destinationCountry
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('service_type', 'visa_passport');
      formData.append(
        'title',
        `${category}: ${form.assistanceType} — ${form.destinationCountry}`
      );
      formData.append('customer_name', form.customer_name);
      formData.append('customer_email', form.customer_email);
      formData.append('customer_phone', form.customer_phone);
      formData.append('customer_nationality', form.nationality);
      formData.append('document_category', form.document_category);
      formData.append(
        'details',
        JSON.stringify({
          category,
          assistanceType: form.assistanceType,
          destinationCountry: form.destinationCountry,
          nationality: form.nationality,
          intendedTravelDate: form.intendedTravelDate,
          durationOfStay: form.durationOfStay,
          travelPurpose: form.travelPurpose,
          hasValidPassport: form.hasValidPassport,
          uploadedFilesCount: files.length
        })
      );

      for (const file of files) {
        formData.append('documents', file);
      }

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit visa/passport inquiry.');
      setSubmittedRef(data.reference_number);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20 space-y-12">
      {/* Header */}
      <section className="bg-emerald-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Immigration & Travel Documentation Desk
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif-display font-bold">
              Visa & Passport Application Assistance
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base">
              Navigate complex embassy checklists, visa application forms, travel insurance, flight/hotel itinerary holds, and passport renewal steps with confidence.
            </p>
          </div>

          {/* Mandatory Regulatory Disclaimer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-400/50 text-amber-100 flex items-start gap-3.5 max-w-4xl">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-amber-300">
                Important Official Disclaimer Regarding Visas & Passports
              </p>
              <p className="leading-relaxed">
                KOLA TOURS AND TRAVEL is an independent travel management and documentation consultancy. <strong>We do not issue passports and cannot guarantee visa approvals.</strong> Final decisions regarding visa issuance, processing timelines, and passport issuance belong strictly and exclusively to the relevant government immigration authorities, embassies, and consulates.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Service Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visa Assistance Column */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-serif-display font-bold text-slate-900">Visa Assistance Services</h2>
                <p className="text-xs text-slate-500">UAE, UK, Schengen, USA, Canada, Türkiye, South Africa, China & East Africa</p>
              </div>
            </div>
            <div className="divide-y divide-stone-100">
              {visaTypes.map((v) => (
                <div key={v.title} className="py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{v.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{v.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleCategorySwitch('Visa Assistance');
                      setForm((prev) => ({ ...prev, assistanceType: v.title }));
                      document.getElementById('visa-inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-emerald-900 hover:text-amber-300 text-xs font-bold shrink-0 transition cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Passport Assistance Column */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-emerald-950 flex items-center justify-center">
                <FileBadge className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-serif-display font-bold text-slate-900">Passport Assistance & Guidance</h2>
                <p className="text-xs text-slate-500">New Applications, Renewals, Checklists & Appointment Guidance</p>
              </div>
            </div>
            <div className="divide-y divide-stone-100">
              {passportTypes.map((p) => (
                <div key={p.title} className="py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{p.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleCategorySwitch('Passport Assistance');
                      setForm((prev) => ({ ...prev, assistanceType: p.title }));
                      document.getElementById('visa-inquiry-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-emerald-900 hover:text-amber-300 text-xs font-bold shrink-0 transition cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submission & Document Upload Form */}
        <div id="visa-inquiry-form" className="bg-white rounded-2xl p-6 sm:p-10 border border-stone-200 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Confidential Documentation Portal
              </span>
              <h2 className="text-2xl font-serif-display font-bold text-slate-900 mt-1">
                Submit a {category} Inquiry
              </h2>
            </div>
            <div className="flex gap-2">
              {['Visa Assistance', 'Passport Assistance'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleCategorySwitch(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    category === tab ? 'bg-emerald-900 text-amber-300' : 'bg-stone-100 text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {submittedRef ? (
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">
                {category} Request Logged Successfully!
              </h3>
              <p className="text-sm text-slate-600">
                Your inquiry and any uploaded supporting documents have been encrypted and assigned Reference Number:
              </p>
              <div className="inline-block px-6 py-2.5 rounded-xl bg-emerald-950 text-amber-300 font-mono text-lg font-bold">
                {submittedRef}
              </div>
              <div className="pt-3 flex flex-wrap justify-center gap-3">
                <Link
                  to={user ? '/dashboard' : `/track?ref=${submittedRef}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-900 text-amber-300 font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <span>View Application Assistance Status</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmittedRef(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-4 rounded-xl bg-rose-50 text-rose-800 text-sm">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Type of Assistance Required *</label>
                  <select
                    value={form.assistanceType}
                    onChange={(e) => setForm({ ...form, assistanceType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    {category === 'Visa Assistance'
                      ? visaTypes.map((v) => <option key={v.title}>{v.title}</option>)
                      : passportTypes.map((p) => <option key={p.title}>{p.title}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {category === 'Visa Assistance' ? 'Destination Country *' : 'Issuing Country / Authority *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.destinationCountry}
                    onChange={(e) => setForm({ ...form, destinationCountry: e.target.value })}
                    placeholder="e.g., United Kingdom, UAE, Schengen (France), USA..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Applicant Nationality *</label>
                  <input
                    type="text"
                    required
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    placeholder="e.g., Ugandan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Intended Travel Date</label>
                  <input
                    type="date"
                    value={form.intendedTravelDate}
                    onChange={(e) => setForm({ ...form, intendedTravelDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Intended Duration of Stay</label>
                  <input
                    type="text"
                    value={form.durationOfStay}
                    onChange={(e) => setForm({ ...form, durationOfStay: e.target.value })}
                    placeholder="e.g., 14 Days / 6 Months"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Current Passport Status</label>
                  <select
                    value={form.hasValidPassport}
                    onChange={(e) => setForm({ ...form, hasValidPassport: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm bg-white"
                  >
                    <option>Yes (Valid 6+ Months)</option>
                    <option>Expiring within 6 Months (Needs Renewal)</option>
                    <option>Applying for First-Time Passport</option>
                    <option>Lost / Damaged Passport</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Describe Your Travel Purpose & Case Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.travelPurpose}
                  onChange={(e) => setForm({ ...form, travelPurpose: e.target.value })}
                  placeholder="Describe your purpose of travel (tourism, business conference, academic study, family visit), employment status, and any questions for our visa specialists..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              {/* Secure Document Upload Box */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    <span>Secure Supporting Document Upload (Optional)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">PDF, JPG, PNG, DOCX up to 10MB</span>
                </div>
                <p className="text-xs text-slate-600">
                  Uploaded passport bio-pages, invitation letters, or bank statements are stored outside public web directories and can only be accessed by you and authorized KOLA TOURS documentation officers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Document Category</label>
                    <select
                      value={form.document_category}
                      onChange={(e) => setForm({ ...form, document_category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    >
                      <option>Passport Bio Page</option>
                      <option>Invitation / Admission Letter</option>
                      <option>Bank Statement / Financial Proof</option>
                      <option>National ID / Birth Certificate</option>
                      <option>Supporting Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Select File(s)</label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      onChange={(e) => setFiles(Array.from(e.target.files || []))}
                      className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-900 file:text-amber-300 hover:file:bg-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Applicant Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Full Name (As in Passport) *</label>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone / WhatsApp Number *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsAppInquiry(
                      `Hello KOLA TOURS AND TRAVEL. I need ${form.assistanceType} for ${form.destinationCountry}.`
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-700 text-emerald-800 font-bold text-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask Visa Desk on WhatsApp</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 font-bold text-sm shadow-lg cursor-pointer"
                >
                  {submitting ? 'Encrypting & Submitting...' : `Submit ${category} Inquiry`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

