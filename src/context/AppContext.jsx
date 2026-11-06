import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kola_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('kola_token') || '');
  const [settings, setSettings] = useState({
    company_name: 'KOLA TOURS AND TRAVEL',
    company_tagline: 'Explore the World. We Make Your Journey Easier.',
    whatsapp_number: 'WHATSAPP_NUMBER_PENDING_CONFIGURATION',
    business_email: 'info@kolatours.com',
    support_phone: '+256 (0) 700 000 000 (Configurable in Admin)',
    office_address: 'Plot 24 Kampala Road, Boulevard Suites, Floor 3, Kampala, Uganda',
    default_currency: 'USD',
    ugx_exchange_rate: '3750'
  });
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'UGX'
  const [whatsappModal, setWhatsappModal] = useState({ open: false, message: '' });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/public/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Invalid session');
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('kola_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        setToken('');
        setUser(null);
        localStorage.removeItem('kola_token');
        localStorage.removeItem('kola_user');
      });
  }, [token]);

  const loginSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('kola_token', newToken);
    localStorage.setItem('kola_user', JSON.stringify(newUser));
  };

  const logoutSession = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('kola_token');
    localStorage.removeItem('kola_user');
  };

  const formatPrice = (usdAmount) => {
    const num = Number(usdAmount || 0);
    if (currency === 'UGX') {
      const rate = Number(settings.ugx_exchange_rate || 3750);
      return `UGX ${Math.round(num * rate).toLocaleString()}`;
    }
    return `$${num.toLocaleString()}`;
  };

  // Triggers WhatsApp inquiry safely:
  // If a real numeric WhatsApp Business number is configured in Admin Settings, opens wa.me/<digits>?text=...
  // If the placeholder is still active (since the official number has not yet been provided), opens an interactive preview modal explaining the pre-filled message & how Admin configures the number.
  const openWhatsAppInquiry = (customMessage) => {
    const msg = customMessage || 'Hello KOLA TOURS AND TRAVEL. I would like to inquire about your travel services.';
    const rawNum = String(settings.whatsapp_number || '').trim();
    const digitsOnly = rawNum.replace(/[^0-9]/g, '');

    if (digitsOnly.length >= 9 && !rawNum.includes('PENDING')) {
      const url = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      setWhatsappModal({ open: true, message: msg });
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        token,
        settings,
        refreshSettings: fetchSettings,
        currency,
        setCurrency,
        formatPrice,
        loginSession,
        logoutSession,
        openWhatsAppInquiry,
        whatsappModal,
        setWhatsappModal
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

