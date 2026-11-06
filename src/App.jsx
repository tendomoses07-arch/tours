import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import FlightsPage from './pages/FlightsPage';
import HotelsPage from './pages/HotelsPage';
import ToursPage from './pages/ToursPage';
import TourDetailPage from './pages/TourDetailPage';
import CustomTripPage from './pages/CustomTripPage';
import VisaPassportPage from './pages/VisaPassportPage';
import TransfersPage from './pages/TransfersPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import {
  AboutPage,
  ContactPage,
  BlogPage,
  FaqPage,
  TrackRequestPage,
  SearchResultsPage,
  PrivacyTermsPage,
  NotFoundPage
} from './pages/StaticAndSupportPages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-stone-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/flights" element={<FlightsPage />} />
              <Route path="/hotels" element={<HotelsPage />} />
              <Route path="/tours" element={<ToursPage />} />
              <Route path="/tours/:slug" element={<TourDetailPage />} />
              <Route path="/custom-trip" element={<CustomTripPage />} />
              <Route path="/visa-passport" element={<VisaPassportPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/track" element={<TrackRequestPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/privacy-policy" element={<PrivacyTermsPage mode="privacy" />} />
              <Route path="/terms" element={<PrivacyTermsPage mode="terms" />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

