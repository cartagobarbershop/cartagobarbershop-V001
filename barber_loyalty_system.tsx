// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { sanitizePhone, sanitizeEmail } from './src/utils/sanitize';
import { validateData } from './src/utils/validation';
import { loadData as loadLocalData, saveData as saveLocalData } from './src/services/dataService';
import type { Data } from './src/core/types';
import { Calendar, Users, Scissors, DollarSign, Gift, Download, Settings, Plus, Search, X, Check, Clock, AlertCircle, TrendingUp, Edit2, Trash2, Save, QrCode, Bell, MessageSquare, Star, Award, ChevronRight, Filter, RefreshCw, Send, Eye, BarChart3, History as HistoryIcon, CreditCard, Phone, Menu, Sun, Moon } from 'lucide-react';
import ReactDOM from 'react-dom';
import LandingPage from './src/components/LandingPage';
import LoginPage from './src/components/LoginPage';

// Type definitions
interface Barber {
  id: number;
  name: string;
  chair_id: number;
  active: boolean;
  phone: string;
  specialty: string;
}

interface Service {
  code: string;
  display_name: string;
  price_cop: number;
  duration_mins: number;
  active: boolean;
}

interface Reward {
  id?: number;
  type?: 'CREDIT' | 'SERVICE';
  name?: string;
  value_cop?: number;
  service_code?: string;
  stamp_cost?: number;
  tier_restriction?: string | null;
  active?: boolean;
}

interface Customer {
  id?: number;
  phone?: string;
  name?: string;
  email?: string;
  opt_in_status?: boolean;
  created_at?: string;
  stamps_balance?: number;
  credit_balance?: number;
  tier?: 'BRONZE' | 'SILVER' | 'GOLD';
  last_visit?: string;
}

interface Order {
  id: number;
  customer_id: string;
  customer_name: string;
  barber_id: number;
  chair_id: number;
  appointment_id: number | null;
  subtotal: number;
  discount: number;
  credit_applied: number;
  reward_used: string | null;
  total_due: number;
  total_paid: number;
  status: string;
  mp_order_ref?: string;
  mp_payment_url?: string;
  created_at: string;
  services: string[];
  paid_at?: string;
}

interface Appointment {
  id?: number;
  customer_phone?: string;
  customer_name?: string;
  barber_id?: number;
  chair_id?: number;
  scheduled_at?: string;
  status?: string;
  payment_status?: string;
  source?: string;
  created_at?: string;
  services?: string[];
  notes?: string;
}

interface Tip {
  id: number;
  mp_tip_payment_id: string;
  order_id: number;
  barber_id: number;
  chair_id: number;
  customer_phone: string;
  amount: number;
  paid_at: string;
  status: string;
}

interface Notification {
  id: number;
  timestamp: string;
  read: boolean;
  type: string;
  title: string;
  message: string;
  barber_id?: number;
  customer_phone?: string;
}

interface LoyaltyLedger {
  id: number;
  customer_id: string;
  payment_id: string;
  order_id: number;
  delta_stamps: number;
  delta_credit_cop: number;
  reason: string;
  reward_id: number | null;
  created_at: string;
}

interface MessageTemplates {
  receipt: string;
  tip: string;
  reward_unlocked: string;
  reminder_24h: string;
  reminder_2h: string;
  fresh_cut: string;
  winback: string;
}

interface Settings {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  business_hours: { start: string; end: string };
  timezone: string;
  currency: string;
  tax_rate: number;
  mercadopago_public_key: string;
  mercadopago_access_token: string;
  mercadopago_webhook_url: string;
  mercadopago_test_mode: boolean;
  google_calendar_enabled: boolean;
  google_calendar_client_id: string;
  google_calendar_client_secret: string;
  public_walkin_url?: string;
  privacy_consent: boolean;
  green_api_instance_id: string;
  green_api_token: string;
  sheets_sync_enabled: boolean;
  sheets_web_app_url: string;
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  auto_reminders: boolean;
  fresh_cut_days_clean: number;
  fresh_cut_days_full: number;
  winback_days: number;
  social_links?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  permissions: {
    dashboard: { owner: boolean; barber: boolean; reception: boolean };
    walkin: { owner: boolean; barber: boolean; reception: boolean };
    appointments: { owner: boolean; barber: boolean; reception: boolean };
    customers: { owner: boolean; barber: boolean; reception: boolean };
    history: { owner: boolean; barber: boolean; reception: boolean };
    rewards: { owner: boolean; barber: boolean; reception: boolean };
    settings: { owner: boolean; barber: boolean; reception: boolean };
    exports: { owner: boolean; barber: boolean; reception: boolean };
  };
}

interface Style {
  id: string;
  name: string;
  desc: string;
  img: string;
  tag?: string;
  pair?: string;
}

// Integration stubs to prepare for Green API + Sheets
const sendWhatsApp = (phone: string, message: string) => {
  // Avoid leaking sensitive info in production logs
  console.log('[GreenAPI] sendWhatsApp ->', phone.replace(/.(?=.{4})/g, '*'));
};

const logIncomingMessage = (phone: string, message: string) => {
  console.log('[GreenAPI] incoming message', phone, message);
};

// Sheets sync layer (stubs for future Apps Script/Sheets bridge)
const syncToSheets = async (snapshot: Data) => {
  const url = snapshot.settings?.sheets_web_app_url;
  if (!snapshot.settings?.sheets_sync_enabled || !url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: redactSensitive(snapshot) })
    });
  } catch (err) {
    console.error('[Sheets] sync error', err);
  }
};

const loadFromSheets = async (url?: string): Promise<Data | null> => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    // Expect either { snapshot } or direct Data
    const incoming = (json && json.snapshot) ? json.snapshot as Data : json as Data;
    // Version guard: if absent or mismatched, discard
    if (!incoming || incoming.version !== initMockData().version) return null;
    return normalizeData(incoming);
  } catch (err) {
    console.error('[Sheets] load error', err);
    return null;
  }
};

const scheduleReminderHooks = (appointment: Appointment) => {
  console.log('[Reminders] schedule 24h/2h hooks for', appointment.customer_phone, appointment.scheduled_at);
};

// Redact sensitive keys before persisting/syncing
const redactSensitive = (snapshot: Data): Data => {
  const scrubbedSettings = {
    ...snapshot.settings,
    mercadopago_access_token: '',
    mercadopago_public_key: '',
    mercadopago_webhook_url: '',
    google_calendar_client_id: '',
    google_calendar_client_secret: '',
    green_api_instance_id: '',
    green_api_token: '',
    sheets_web_app_url: snapshot.settings.sheets_web_app_url // allow sync URL if desired
  };
  return { ...snapshot, settings: scrubbedSettings };
};

// QR Code Generator
const generateQRCode = (text: string): string => {
  const size = 200;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  return qr;
};

// Initialize comprehensive data structure
const initMockData = (): Data => ({
  version: 2,
  barbers: [
    { id: 1, name: 'Carlos Ruiz', chair_id: 1, active: true, phone: '3001234567', specialty: 'Cortes modernos' },
    { id: 2, name: 'Miguel Santos', chair_id: 2, active: true, phone: '3009876543', specialty: 'Barba y afeitado' },
    { id: 3, name: 'Juan Perez', chair_id: 3, active: true, phone: '3005555555', specialty: 'Disenos' }
  ],
  receptionists: [],
  services: [
    { code: 'FULL_HAIR_CUT', display_name: 'Corte completo', price_cop: 35000, duration_mins: 45, active: true },
    { code: 'CLEAN_CUT', display_name: 'Retoque / Corte limpio', price_cop: 25000, duration_mins: 30, active: true },
    { code: 'BEARD', display_name: 'Barba', price_cop: 15000, duration_mins: 20, active: true },
    { code: 'EYEBROWS', display_name: 'Cejas', price_cop: 8000, duration_mins: 10, active: true }
  ],
  rewards: [
    { id: 1, type: 'CREDIT', name: 'Credito $15.000', value_cop: 15000, stamp_cost: 8, tier_restriction: null, active: true },
    { id: 2, type: 'CREDIT', name: 'Credito $25.000', value_cop: 25000, stamp_cost: 10, tier_restriction: null, active: true },
    { id: 3, type: 'CREDIT', name: 'Credito $50.000', value_cop: 50000, stamp_cost: 14, tier_restriction: 'GOLD', active: true },
    { id: 4, type: 'CREDIT', name: 'Credito $75.000', value_cop: 75000, stamp_cost: 18, tier_restriction: 'GOLD', active: true },
    { id: 5, type: 'SERVICE', name: 'Barba Gratis', service_code: 'BEARD', stamp_cost: 6, tier_restriction: null, active: true },
    { id: 6, type: 'SERVICE', name: 'Corte Gratis', service_code: 'FULL_HAIR_CUT', stamp_cost: 12, tier_restriction: 'GOLD', active: true }
  ],
  customers: [],
  orders: [],
  appointments: [],
  tips: [],
  notifications: [],
  loyaltyLedger: [],
  hairStyles: [],
  beardStyles: [],
  messageTemplates: {
    receipt:
      'Gracias por visitarnos\\n\\nServicios:\\n{services}\\n\\nTotal pagado: \\${total}\\nSellos ganados: +{stamps}\\nSellos acumulados: {total_stamps}\\n\\nProxima recompensa:\\n{next_reward}',
    tip:
      'Quieres dejar propina a tu barbero? 100% va directo para {barber_name}.\\n\\nElige un monto:\\n• $5.000\\n• $10.000\\n• $15.000\\n• Otro valor',
    reward_unlocked: 'Felicidades! Has desbloqueado: {reward_name}\\nPuedes usarlo en tu proxima visita.',
    reminder_24h: 'Recordatorio: Tienes cita manana a las {time} con {barber_name}',
    reminder_2h: 'Tu cita es en 2 horas ({time}) con {barber_name}. Te esperamos!',
    fresh_cut: 'Ya va siendo hora de un retoque. Agenda tu proximo corte cuando quieras.',
    winback:
      'Te extranamos!\\nHace {days} dias que no te vemos.\\n\\nTenemos una sorpresa para ti en tu proxima visita.'
  },
  settings: {
    shop_name: 'Barberia Colombia',
    shop_address: 'Calle 123 #45-67, Bogota',
    shop_phone: '3001234567',
    business_hours: { start: '09:00', end: '19:00' },
    timezone: 'America/Bogota',
    currency: 'COP',
    tax_rate: 0,
    mercadopago_public_key: '',
    mercadopago_access_token: '',
    mercadopago_webhook_url: '',
    mercadopago_test_mode: true,
    google_calendar_enabled: false,
    google_calendar_client_id: '',
    google_calendar_client_secret: '',
    public_walkin_url: '',
    privacy_consent: true,
    green_api_instance_id: '',
    green_api_token: '',
    sheets_sync_enabled: false,
    sheets_web_app_url: '',
    whatsapp_enabled: true,
    sms_enabled: true,
    auto_reminders: true,
    fresh_cut_days_clean: 25,
    fresh_cut_days_full: 35,
    winback_days: 60,
    social_links: {
      instagram: '',
      facebook: '',
      tiktok: ''
    },
    permissions: {
      dashboard: { owner: true, barber: true, reception: true },
      walkin: { owner: true, barber: true, reception: true },
      appointments: { owner: true, barber: true, reception: true },
      customers: { owner: true, barber: false, reception: true },
      history: { owner: true, barber: false, reception: true },
      rewards: { owner: true, barber: false, reception: false },
      settings: { owner: true, barber: false, reception: false },
      exports: { owner: true, barber: false, reception: false }
    }
  }
});


// Merge stored data with defaults to avoid missing fields when schema evolves
const normalizeData = (stored: any): Data => {
  const defaults = initMockData();
  return {
    ...defaults,
    ...stored,
    version: defaults.version,
    barbers: stored?.barbers || defaults.barbers,
    receptionists: stored?.receptionists || defaults.receptionists,
    services: stored?.services || defaults.services,
    rewards: stored?.rewards || defaults.rewards,
    customers: stored?.customers || defaults.customers,
    orders: stored?.orders || defaults.orders,
    appointments: stored?.appointments || defaults.appointments,
    tips: stored?.tips || defaults.tips,
    notifications: stored?.notifications || defaults.notifications,
    loyaltyLedger: stored?.loyaltyLedger || defaults.loyaltyLedger,
    messageTemplates: { ...defaults.messageTemplates, ...(stored?.messageTemplates || {}) },
    settings: {
      ...defaults.settings,
      ...(stored?.settings || {}),
      permissions: { ...defaults.settings.permissions, ...(stored?.settings?.permissions || {}) }
    },
    hairStyles: stored?.hairStyles || defaults.hairStyles,
    beardStyles: stored?.beardStyles || defaults.beardStyles
  };
};

const BarberiaApp = () => {
  const [data, setData] = useState<Data>(initMockData());
  const [currentView, setCurrentView] = useState('dashboard');
  const [userRole, setUserRole] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'OWNER';
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [publicTarget, setPublicTarget] = useState<string | null>(null);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState<Customer | null>(null);
  const [currentClientPhone, setCurrentClientPhone] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('currentClientPhone')) || '';
  });
  const [currentBarberId, setCurrentBarberId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem('currentBarberId');
    return val ? Number(val) : null;
  });
  const [previewBarberId, setPreviewBarberId] = useState<number | null>(null);
  const [previewClientPhone, setPreviewClientPhone] = useState<string>('');
  const [appState, setAppState] = useState<'LANDING' | 'LOGIN' | 'AUTHENTICATED'>(() => {
    return (typeof window !== 'undefined' && (localStorage.getItem('appState') as any)) || 'LANDING';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
  });
  const [clientProfileTab, setClientProfileTab] = useState<'perfil' | 'citas'>('perfil');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (_e) { }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('currentClientPhone', currentClientPhone);
      localStorage.setItem('currentBarberId', currentBarberId ? currentBarberId.toString() : '');
      localStorage.setItem('appState', appState);
      localStorage.setItem('isAuthenticated', isAuthenticated.toString());
    }
  }, [userRole, currentClientPhone, currentBarberId, appState, isAuthenticated]);

  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error: any, info: any) {
      console.error('ErrorBoundary caught', error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="p-6 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2">Algo salió mal</h2>
            <p className="text-sm text-gray-600">Por favor recarga la página o limpia datos locales en Configuración.</p>
          </div>
        );
      }
      return this.props.children;
    }
  }
  const canAccess = (moduleKey: keyof Settings['permissions']) => {
    const perms = data.settings.permissions;
    const roleKey = userRole === 'OWNER' ? 'owner' : userRole === 'BARBER' ? 'barber' : userRole === 'RECEPTION' ? 'reception' : 'reception';
    return perms?.[moduleKey]?.[roleKey] ?? false;
  };
  const handleRoleChange = (role: string) => {
    setUserRole(role);
    setSelectedCustomerModal(null);
    if (role === 'CLIENT') {
      setCurrentClientPhone('');
      setCurrentView('walkin');
    } else {
      // pick first accessible view
      if (canAccess('dashboard')) setCurrentView('dashboard');
      else if (canAccess('walkin')) setCurrentView('walkin');
      else if (canAccess('appointments')) setCurrentView('appointments');
      else if (canAccess('customers')) setCurrentView('customers');
      else setCurrentView('dashboard');
    }
  };

  const handleLogin = (role: string, identifier: string) => {
    setUserRole(role);
    if (role === 'CLIENT') {
      const cleanPhone = sanitizePhone(identifier);
      if (cleanPhone) {
        const existing = data.customers.find(c => c.phone === cleanPhone);
        if (!existing) {
          const newCustomer: Customer = {
            id: Date.now(),
            phone: cleanPhone,
            name: cleanPhone,
            email: '',
            opt_in_status: true,
            created_at: new Date().toISOString(),
            stamps_balance: 0,
            credit_balance: 0,
            tier: 'BRONZE'
          };
          saveData(prev => ({ ...prev, customers: [newCustomer, ...prev.customers] }));
        }
      }
      setCurrentClientPhone(cleanPhone || identifier);
      setCurrentView('client_profile');
    } else if (role === 'BARBER') {
      const barber = data.barbers.find(b => b.name.toLowerCase().includes(identifier.toLowerCase()) || b.id.toString() === identifier);
      if (barber) setCurrentBarberId(barber.id);
      setCurrentView('dashboard');
    } else {
      setCurrentView('dashboard');
    }
    setIsAuthenticated(true);
    setAppState('AUTHENTICATED');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAppState('LANDING');
    setCurrentClientPhone('');
    setCurrentBarberId(null);
    setUserRole('OWNER');
    if (typeof window !== "undefined") {
      localStorage.removeItem('userRole');
      localStorage.removeItem('currentClientPhone');
      localStorage.removeItem('currentBarberId');
      localStorage.removeItem('appState');
      localStorage.setItem('isAuthenticated', 'false');
    }
  };
  useEffect(() => {
    if (userRole === 'BARBER' && !currentBarberId && data.barbers.length > 0) {
      const firstActive = data.barbers.find(b => b.active) || data.barbers[0];
      setCurrentBarberId(firstActive?.id || null);
    }
    if (userRole === 'CLIENT' && !currentClientPhone) {
      setCurrentView('walkin');
    }
  }, [userRole, currentClientPhone, currentBarberId, data.barbers]);

  // Scoped data per role or owner/reception preview
  const effectiveBarberId = userRole === 'BARBER' ? currentBarberId : previewBarberId;
  const effectiveClientPhone = userRole === 'CLIENT' ? currentClientPhone : previewClientPhone;

  const scopedBarbers = React.useMemo(() => {
    if (effectiveBarberId) return data.barbers.filter(b => b.id === effectiveBarberId);
    return data.barbers;
  }, [data.barbers, effectiveBarberId]);

  const scopedCustomers = React.useMemo(() => {
    if (userRole === 'CLIENT' && !effectiveClientPhone) return [];
    if (effectiveClientPhone) {
      return data.customers.filter(c => c.phone === effectiveClientPhone);
    }
    return data.customers;
  }, [data.customers, effectiveClientPhone, userRole]);

  const scopedOrders = React.useMemo(() => {
    if (userRole === 'CLIENT' && !effectiveClientPhone) return [];
    if (effectiveBarberId) return data.orders.filter(o => o.barber_id === effectiveBarberId);
    if (effectiveClientPhone) return data.orders.filter(o => o.customer_id === effectiveClientPhone);
    return data.orders;
  }, [data.orders, effectiveBarberId, effectiveClientPhone, userRole]);

  const scopedAppointments = React.useMemo(() => {
    if (userRole === 'CLIENT' && !effectiveClientPhone) return [];
    if (effectiveBarberId) return data.appointments.filter(a => a.barber_id === effectiveBarberId);
    if (effectiveClientPhone) return data.appointments.filter(a => a.customer_phone === effectiveClientPhone);
    return data.appointments;
  }, [data.appointments, effectiveBarberId, effectiveClientPhone, userRole]);

  const scopedTips = React.useMemo(() => {
    if (userRole === 'CLIENT' && !effectiveClientPhone) return [];
    if (effectiveBarberId) return data.tips.filter(t => t.barber_id === effectiveBarberId);
    if (effectiveClientPhone) return data.tips.filter(t => t.customer_phone === effectiveClientPhone);
    return data.tips;
  }, [data.tips, effectiveBarberId, effectiveClientPhone, userRole]);

  const scopedLedger = React.useMemo(() => {
    if (userRole === 'CLIENT' && !effectiveClientPhone) return [];
    if (effectiveClientPhone) {
      return data.loyaltyLedger.filter(l => l.customer_id === effectiveClientPhone);
    }
    return data.loyaltyLedger;
  }, [data.loyaltyLedger, effectiveClientPhone, userRole]);
  const openCustomerModal = (phone: string) => {
    const cleanPhone = sanitizePhone(phone);
    const customer = data.customers.find(c => c.phone === cleanPhone);
    if (customer) {
      setSelectedCustomerModal(customer);
      return;
    }
    // Fallback: create a temporary view-only profile if not found
    setSelectedCustomerModal({
      id: Date.now(),
      phone,
      name: phone,
      email: '',
      opt_in_status: true,
      created_at: new Date().toISOString(),
      stamps_balance: 0,
      credit_balance: 0,
      tier: 'BRONZE'
    } as Customer);
  };
  const closeCustomerModal = () => setSelectedCustomerModal(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        let base: Data = loadLocalData(initMockData);
        const validLocal = validateData(base);
        setData(validLocal ? validLocal : initMockData());
        const remote = await loadFromSheets(base.settings?.sheets_web_app_url);
        if (remote) {
          setData(normalizeData(remote));
        }
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        if (viewParam === 'walkin_public') {
          setUserRole('CLIENT');
          setPublicTarget('walkin');
          setCurrentView('walkin');
          setNavOpen(false);
        } else if (viewParam === 'walkin') {
          setCurrentView('walkin');
        } else if (viewParam === 'styles') {
          setCurrentView('styles');
        }
        if (window.location.hash) {
          const hashView = window.location.hash.replace('#', '');
          if (hashView) setCurrentView(hashView);
        }
      } catch (error) {
        console.log('No previous data, using defaults');
      }
    };
    loadData();
  }, []);

  const persistData = (next: Data) => {
    const normalized = normalizeData(next);
    try {
      saveLocalData(redactSensitive(normalized));
      syncToSheets(normalized);
    } catch (error) {
      console.error('Error saving:', error);
    }
    return normalized;
  };

  const saveData = (updater: Data | ((prev: Data) => Data)) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: Data) => Data)(prev) : updater;
      return persistData(next);
    });
  };

  const saveRewardsDirect = (rewards: Reward[]) => {
    const normalized = persistData({ ...data, rewards });
    setData(normalized);
    return true;
  };

  // Notification system (silent UI-friendly)
  const addNotification = (notification: any) => {
    const newNotif = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    saveData(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications]
    }));
  };
  const showToast = (message: string) => addNotification({ type: 'info', title: 'Aviso', message });

  // Calculate customer tier
  const getCustomerTier = (customerId: string): 'BRONZE' | 'SILVER' | 'GOLD' => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentOrders = scopedOrders.filter((o: Order) =>
      o.customer_id === customerId &&
      o.status === 'PAID' &&
      new Date(o.created_at) > ninetyDaysAgo
    );
    const visits = recentOrders.length;
    if (visits >= 6) return 'GOLD';
    if (visits >= 3) return 'SILVER';
    return 'BRONZE';
  };

  // Calculate next reward
  const getNextReward = (stamps: number): Reward | null => {
    const availableRewards = data.rewards
      .filter((r: Reward) => r.active && r.stamp_cost > stamps)
      .sort((a: Reward, b: Reward) => a.stamp_cost - b.stamp_cost);
    return availableRewards[0] || null;
  };

  const getServicesTotal = (services: string[]) => {
    return services.reduce((sum, code) => {
      const svc = data.services.find(s => s.code === code);
      return sum + (svc ? svc.price_cop : 0);
    }, 0);
  };

  const getStampsFromServices = (services: string[]) => {
    let stamps = 0;
    const hasHaircut = services.some(s => s === 'FULL_HAIR_CUT' || s === 'CLEAN_CUT');
    const hasBeard = services.includes('BEARD');
    if (hasHaircut) stamps += 1;
    if (hasBeard && hasHaircut) stamps += 1;
    return stamps;
  };

  // Google Calendar integration simulation
  const syncToGoogleCalendar = (appointment: any) => {
    const event = {
      summary: `Barbería - ${appointment.customer_phone}`,
      description: `Cliente: ${appointment.customer_phone}\nBarbero: ${data.barbers.find(b => b.id === appointment.barber_id)?.name}\nSilla: ${appointment.chair_id}`,
      start: { dateTime: appointment.scheduled_at },
      end: { dateTime: new Date(new Date(appointment.scheduled_at).getTime() + 45 * 60000).toISOString() }
    };

    // In production: Use Google Calendar API
    console.log('Syncing to Google Calendar:', event);
    addNotification({
      type: 'calendar_sync',
      title: 'Cita sincronizada',
      message: `Cita agregada a Google Calendar`
    });
  };

  // Send WhatsApp/SMS
  const sendMessage = (phone: string, message: string, type = 'whatsapp') => {
    if (!data.settings.privacy_consent) {
      addNotification({
        type: 'privacy_block',
        title: 'Consentimiento requerido',
        message: `No se envió mensaje a ${phone} porque no hay consentimiento de comunicación`
      });
      return;
    }
    if (type === 'whatsapp') {
      sendWhatsApp(phone, message);
    } else {
      console.log(`Sending ${type} to ${phone}:`, message);
    }
    addNotification({
      type: 'message_sent',
      title: `${type.toUpperCase()} enviado`,
      message: `Mensaje enviado a ${phone}`
    });
  };

  // Honor settings for messaging with SMS fallback
  const sendAutomatedMessage = (phone: string, message: string) => {
    if (data.settings.whatsapp_enabled) {
      sendMessage(phone, message, 'whatsapp');
      return;
    }
    if (data.settings.sms_enabled) {
      sendMessage(phone, message, 'sms');
      return;
    }
    addNotification({
      type: 'message_blocked',
      title: 'Notificaciones desactivadas',
      message: `No se envió mensaje a ${phone} porque WhatsApp y SMS están desactivados`
    });
  };

  const handleConfirmReply = (phone: string) => {
    const updatedAppointments = data.appointments.map(a =>
      a.customer_phone === phone && (a.status === 'PENDING' || a.status === 'SCHEDULED') ? { ...a, status: 'CONFIRMED' } : a
    );
    saveData({ ...data, appointments: updatedAppointments });
    sendAutomatedMessage(phone, 'Gracias! Tu cita está confirmada.');
  };

  const filteredNotifications = React.useMemo(() => {
    if (userRole === 'OWNER') return data.notifications;
    if (userRole === 'BARBER' && currentBarberId) {
      return data.notifications.filter(n => n.barber_id ? n.barber_id === currentBarberId : true);
    }
    if (userRole === 'CLIENT' && currentClientPhone) {
      return data.notifications.filter(n => n.customer_phone ? n.customer_phone === currentClientPhone : true);
    }
    if (userRole === 'RECEPTION') {
      return data.notifications.filter(n => !n.barber_id && !n.customer_phone);
    }
    return data.notifications;
  }, [data.notifications, userRole, currentBarberId, currentClientPhone]);

  const clearNotifications = () => {
    if (userRole !== 'OWNER') return;
    saveData(prev => ({ ...prev, notifications: [] }));
  };

  // Mark notifications as read when panel opens
  useEffect(() => {
    if (showNotifications && filteredNotifications.some(n => !n.read)) {
      setData(prev => {
        const updated = {
          ...prev,
          notifications: prev.notifications.map(n => filteredNotifications.find(fn => fn.id === n.id) ? { ...n, read: true } : n)
        };
        return persistData(updated);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNotifications]);

  const NavBar = () => (
    <div className={`sticky top-0 z-30 backdrop-blur border-b shadow-lg p-4 ${theme === 'light' ? 'bg-white/90 border-slate-200 text-slate-900' : 'bg-slate-900/95 border-slate-800 text-white'}`}>
      <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 md:flex-none">
          <Scissors className={`w-6 h-6 ${theme === 'light' ? 'text-blue-500' : 'text-blue-400'}`} />
          <h1 className="text-xl font-bold">{data.settings.shop_name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
          <button
            className={`md:hidden p-2 rounded border ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'}`}
            aria-label="Abrir navegación"
            onClick={() => setNavOpen(!navOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded border ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'}`}
            aria-label="Ver notificaciones"
          >
            <Bell className="w-5 h-5" />
            {filteredNotifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {filteredNotifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`p-2 rounded border ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'}`}
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-300" />}
          </button>
          {userRole === 'OWNER' && (
            <select
              value={userRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className={`px-3 py-2 rounded text-sm border w-full sm:w-auto ${theme === 'light' ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-800 text-white border-slate-700'}`}
              aria-label="Seleccionar rol de usuario"
              id="navbar-role"
              name="navbar-role"
            >
              <option value="OWNER">👑 Owner</option>
              <option value="BARBER">✂️ Barbero</option>
              <option value="RECEPTION">📋 Recepción</option>
              <option value="CLIENT">🙋 Cliente</option>
            </select>
          )}
          {userRole === 'BARBER' && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded text-sm border font-bold ${theme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-blue-900/30 text-blue-300 border-blue-800'}`}>
              <Scissors className="w-4 h-4" />
              <span>{data.barbers.find(b => b.id === currentBarberId)?.name || 'Barbero'}</span>
            </div>
          )}
          {(userRole === 'OWNER' || userRole === 'RECEPTION') && (
            <>
              <select
                value={previewBarberId || ''}
                onChange={(e) => setPreviewBarberId(e.target.value ? Number(e.target.value) : null)}
                className={`px-3 py-2 rounded text-sm border w-full sm:w-auto ${theme === 'light' ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-800 text-white border-slate-700'}`}
                aria-label="Previsualizar como barbero"
                id="navbar-preview-barber"
                name="navbar-preview-barber"
              >
                <option value="">Ver todos los barberos</option>
                {data.barbers.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                value={previewClientPhone}
                onChange={(e) => setPreviewClientPhone(e.target.value)}
                className={`px-3 py-2 rounded text-sm border w-full sm:w-auto ${theme === 'light' ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-800 text-white border-slate-700'}`}
                aria-label="Previsualizar como cliente"
                id="navbar-preview-client"
                name="navbar-preview-client"
              >
                <option value="">Ver todos los clientes</option>
                {data.customers.map(c => (
                  <option key={c.phone} value={c.phone}>{c.name || c.phone}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>
      <div className={`mobile-stack gap-2 overflow-x-auto pb-2 flex flex-wrap md:flex-nowrap ${navOpen ? 'flex' : 'hidden md:flex'}`}>
        {userRole !== 'CLIENT' && canAccess('dashboard') && <NavButton icon={<TrendingUp />} label="Dashboard" view="dashboard" />}
        {canAccess('walkin') && <NavButton icon={<Plus />} label="Walk-in" view="walkin" />}
        {userRole !== 'CLIENT' && canAccess('appointments') && <NavButton icon={<Calendar />} label="Citas" view="appointments" />}
        {userRole !== 'CLIENT' && canAccess('customers') && <NavButton icon={<Users />} label="Clientes" view="customers" />}
        {userRole !== 'CLIENT' && canAccess('history') && <NavButton icon={<HistoryIcon />} label="Historial" view="history" />}
        {userRole === 'CLIENT' && currentClientPhone && <NavButton icon={<Users />} label="Perfil" view="client_profile" />}
        <NavButton icon={<Scissors />} label="Estilos" view="styles" />
        {userRole === 'OWNER' && canAccess('rewards') && <NavButton icon={<Gift />} label="Recompensas" view="rewards" />}
        {userRole === 'OWNER' && canAccess('settings') && <NavButton icon={<Settings />} label="Configuración" view="settings" />}
        {userRole === 'OWNER' && canAccess('exports') && <NavButton icon={<Download />} label="Exportar" view="exports" />}
        {userRole === 'OWNER' && canAccess('exports') && <NavButton icon={<BarChart3 />} label="Reportes" view="reports" />}
      </div>

      {showNotifications && (
        <div className={`notif-panel ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-100'}`}>
          <div className={`p-4 border-b flex justify-between items-center font-bold ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
            <span>Notificaciones</span>
            {userRole === 'OWNER' && (
              <button className="text-xs px-2 py-1 rounded border" onClick={clearNotifications}>Limpiar</button>
            )}
          </div>
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No hay notificaciones</div>
          ) : (
            filteredNotifications.slice(0, 10).map(notif => (
              <div key={notif.id} className={`p-4 border-b ${theme === 'light' ? 'border-slate-200 hover:bg-slate-50' : 'border-white/10 hover:bg-white/5'} ${!notif.read ? 'bg-blue-500/10' : ''}`}>
                <div className="font-medium text-sm">{notif.title}</div>
                <div className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{notif.message}</div>
                <div className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(notif.timestamp).toLocaleString('es-CO')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const NavButton = ({ icon, label, view }: { icon: any; label: any; view: any }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`nav-button ${currentView === view
        ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
        : theme === 'light'
          ? 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-100'
          : 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
        }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );

  const CustomerDetailModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
    const orders = data.orders.filter(o => o.customer_id === customer.phone && o.status === 'PAID');
    const totalSpent = orders.reduce((sum, o) => sum + o.total_paid, 0);
    const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0;
    const ledger = data.loyaltyLedger.filter(l => l.customer_id === customer.phone);
    const nextReward = getNextReward(customer.stamps_balance);

    const notifyCustomer = () => {
      const msg = data.messageTemplates.reminder_24h.replace('{time}', '').replace('{barber_name}', 'tu barbero');
      sendAutomatedMessage(customer.phone, msg);
      onClose();
    };

    const goToAppointments = () => {
      setCurrentView('appointments');
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <h3 className="text-2xl font-bold">{customer.name || customer.phone}</h3>
                  <p className="text-gray-600">{customer.phone}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar ficha de cliente">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Sellos</div>
                <div className="text-2xl font-bold">⭐ {customer.stamps_balance || 0}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Crédito</div>
                <div className="text-2xl font-bold">${(customer.credit_balance || 0).toLocaleString()}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Visitas</div>
                <div className="text-2xl font-bold">{orders.length}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Tier</div>
                <div className="text-2xl font-bold">{getCustomerTier(customer.phone)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">Acciones rápidas</h4>
                  <span className="text-xs text-gray-500">Cliente activo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <button
                    onClick={notifyCustomer}
                    className="flex items-center justify-center gap-2 bg-blue-50 text-blue-800 px-3 py-2 rounded border border-blue-100 hover:bg-blue-100"
                  >
                    <Send className="w-4 h-4" />
                    Notificar
                  </button>
                  <button
                    onClick={goToAppointments}
                    className="flex items-center justify-center gap-2 bg-green-50 text-green-800 px-3 py-2 rounded border border-green-100 hover:bg-green-100"
                  >
                    <Calendar className="w-4 h-4" />
                    Programar
                  </button>
                  <button
                    onClick={goToAppointments}
                    className="flex items-center justify-center gap-2 bg-yellow-50 text-yellow-800 px-3 py-2 rounded border border-yellow-100 hover:bg-yellow-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reprogramar
                  </button>
                  <button
                    onClick={goToAppointments}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-800 px-3 py-2 rounded border border-red-100 hover:bg-red-100"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={goToAppointments}
                    className="flex items-center justify-center gap-2 bg-gray-50 text-gray-800 px-3 py-2 rounded border border-gray-200 hover:bg-gray-100 col-span-1 sm:col-span-2"
                  >
                    <Clock className="w-4 h-4" />
                    Ver citas del cliente
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border shadow-sm p-4">
                <h4 className="font-bold mb-2">Estadísticas</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total gastado:</span>
                    <span className="font-medium">${totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ticket promedio:</span>
                    <span className="font-medium">${Math.round(avgTicket).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Primera visita:</span>
                    <span className="font-medium">{customer.created_at ? new Date(customer.created_at).toLocaleDateString('es-CO') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Próxima recompensa:</span>
                    <span className="font-medium">{nextReward ? `${nextReward.name} (${nextReward.stamp_cost} sellos)` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h4 className="font-bold mb-2">Historial de Loyalty</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {ledger.length === 0 ? (
                  <p className="text-gray-500 text-sm">Sin movimientos</p>
                ) : (
                  ledger.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded text-sm">
                      <div>
                        <div className="font-medium capitalize">{entry.reason}</div>
                        <div className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString('es-CO')}</div>
                      </div>
                      <div className="text-right">
                        {entry.delta_stamps !== 0 && (
                          <div className={entry.delta_stamps > 0 ? 'text-green-600' : 'text-red-600'}>
                            {entry.delta_stamps > 0 ? '+' : ''}{entry.delta_stamps} sellos
                          </div>
                        )}
                        {entry.delta_credit_cop !== 0 && (
                          <div className={entry.delta_credit_cop > 0 ? 'text-green-600' : 'text-red-600'}>
                            {entry.delta_credit_cop > 0 ? '+' : ''}${entry.delta_credit_cop.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h4 className="font-bold mb-2">Últimas Visitas</h4>
              <div className="space-y-2">
                {orders.length === 0 && <p className="text-gray-500 text-sm">Sin visitas</p>}
                {orders.slice(-5).reverse().map(order => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between">
                      <span>{new Date(order.created_at).toLocaleDateString('es-CO')}</span>
                      <span className="font-medium">${order.total_paid.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.services.map(s => data.services.find(sv => sv.code === s)?.display_name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const day = selectedDate || new Date().toISOString().split('T')[0];
    const monthPrefix = day.substring(0, 7);
    const isSameDay = (iso?: string) => iso ? iso.slice(0, 10) === day : false;
    const isSameMonth = (iso?: string) => iso ? iso.slice(0, 7) === monthPrefix : false;

    const dayOrdersAll = scopedOrders.filter(o => isSameDay(o.created_at));
    const monthOrdersAll = scopedOrders.filter(o => isSameMonth(o.created_at));
    const dayOrdersPaid = dayOrdersAll.filter(o => o.status === 'PAID');
    const monthOrdersPaid = monthOrdersAll.filter(o => o.status === 'PAID');

    const dayRevenue = dayOrdersPaid.reduce((sum, o) => sum + o.total_paid, 0);
    const monthRevenue = monthOrdersPaid.reduce((sum, o) => sum + o.total_paid, 0);

    const dayTips = scopedTips.filter(t => isSameDay(t.paid_at) && t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);
    const monthTips = scopedTips.filter(t => isSameMonth(t.paid_at) && t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);

    const dayAppts = scopedAppointments.filter(a => isSameDay(a.scheduled_at));
    const avgTicket = dayOrdersPaid.length > 0 ? dayRevenue / dayOrdersPaid.length : 0;

    // Service breakdown
    const serviceStats: { [key: string]: number } = {};
    dayOrdersPaid.forEach((order: Order) => {
      order.services.forEach((service: string) => {
        serviceStats[service] = (serviceStats[service] || 0) + 1;
      });
    });

    return (
      <div className="space-y-6">
        <div className="panel bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">¡Bienvenido a {data.settings.shop_name}!</h2>
              <p className="text-blue-100 mt-1 font-medium opacity-90">Gestión de lealtad y sistema de citas</p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
              <Calendar className="w-5 h-5 text-blue-200" />
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-200">Hoy es</div>
                <div className="text-sm font-bold">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Resumen de Operaciones</h2>
            <label className="text-sm text-slate-300" htmlFor="dashboard-date">Fecha</label>
            <input
              id="dashboard-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded bg-slate-800 text-slate-100 border-white/10"
              aria-label="Seleccionar fecha del dashboard"
              name="dashboard_date"
            />
          </div>
        </div>

        <div className="stat-grid">
          <StatCard icon={<DollarSign />} label="Ventas del día" value={`$${dayRevenue.toLocaleString()}`} subvalue={`Mes: $${monthRevenue.toLocaleString()}`} color="green" theme={theme} />
          <StatCard icon={<Scissors />} label="Servicios del día" value={dayOrdersPaid.length} subvalue={`Mes: ${monthOrdersPaid.length}`} color="blue" theme={theme} />
          <StatCard icon={<Gift />} label="Propinas del día" value={`$${dayTips.toLocaleString()}`} subvalue={`Mes: $${monthTips.toLocaleString()}`} color="purple" theme={theme} />
          <StatCard icon={<Calendar />} label="Citas del día" value={dayAppts.length} subvalue={`Ticket prom: $${Math.round(avgTicket).toLocaleString()}`} color="orange" theme={theme} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Rendimiento por Barbero (Hoy)
            </h3>
            <div className="space-y-3">
              {scopedBarbers.map(barber => {
                const barberOrders = dayOrdersPaid.filter(o => o.barber_id === barber.id);
                const barberRevenue = barberOrders.reduce((sum, o) => sum + o.total_paid, 0);
                const barberTips = scopedTips.filter(t => t.barber_id === barber.id && t.paid_at?.startsWith(day) && t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div key={barber.id} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors">
                    <div>
                      <div className="font-medium">{barber.name}</div>
                      <div className="text-sm text-slate-300">Silla {barber.chair_id} • {barberOrders.length} servicios</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${barberRevenue.toLocaleString()}</div>
                      <div className="text-sm text-green-400">+${barberTips.toLocaleString()} propinas</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Servicios Populares (Hoy)
            </h3>
            <div className="space-y-3">
              {Object.entries(serviceStats).length === 0 && <p className="text-sm text-slate-300">Sin ventas en la fecha seleccionada</p>}
              {Object.entries(serviceStats).map(([serviceCode, count]) => {
                const service = data.services.find(s => s.code === serviceCode);
                const percentage = dayOrdersPaid.length > 0 ? (count / dayOrdersPaid.length) * 100 : 0;
                const progressClass = `progress-fill progress-${Math.min(100, Math.max(0, Math.round(percentage / 5) * 5))}`;
                return (
                  <div key={serviceCode}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{service?.display_name}</span>
                      <span>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className={progressClass} role="presentation" aria-hidden="true"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Próximas Citas
          </h3>
          <div className="space-y-2">
            {scopedAppointments
              .filter(a => new Date(a.scheduled_at) > new Date() && a.status === 'SCHEDULED')
              .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
              .slice(0, 5)
              .map(appt => {
                const barber = scopedBarbers.find(b => b.id === appt.barber_id);
                const time = new Date(appt.scheduled_at).toLocaleString('es-CO', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div key={appt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{time}</div>
                      <div className="text-sm text-gray-500">{appt.customer_phone} • {barber?.name}</div>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${appt.payment_status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {appt.payment_status === 'PAID' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  const ClientProfile = ({ initialTab }: { initialTab: 'perfil' | 'citas' }) => {
    const profile = currentClientPhone ? data.customers.find(c => c.phone === currentClientPhone) : null;
    const [profileDraft, setProfileDraft] = useState({ name: profile?.name || '', phone: profile?.phone || '', email: profile?.email || '' });
    const [apptForm, setApptForm] = useState({ barber_id: '', services: [] as string[], date: '', time: '', notes: '' });
    const [editingApptId, setEditingApptId] = useState<number | null>(null);
    const [tipDrafts, setTipDrafts] = useState<Record<number, string>>({});
    const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [clientTab, setClientTab] = useState<'perfil' | 'citas'>(initialTab);
    const scrollToCitas = () => {
      const el = document.getElementById('client-citas-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    const deleteClientData = () => {
      if (userRole !== 'OWNER') return showToast('Solo Owner puede borrar datos');
      if (!confirm('¿Eliminar al cliente y todos sus datos?')) return;
      const phone = profile.phone;
      saveData(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.phone !== phone),
        orders: prev.orders.filter(o => o.customer_id !== phone),
        appointments: prev.appointments.filter(a => a.customer_phone !== phone),
        tips: prev.tips.filter(t => t.customer_phone !== phone),
        loyaltyLedger: prev.loyaltyLedger.filter(l => l.customer_id !== phone)
      }));
      setCurrentClientPhone('');
      showToast('Datos del cliente eliminados');
    };

    useEffect(() => {
      if (profile) {
        setProfileDraft({ name: profile.name || '', phone: profile.phone, email: profile.email || '' });
      }
    }, [profile?.phone]);

    useEffect(() => {
      setClientTab(initialTab);
    }, [initialTab]);

    if (!profile) {
      return (
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">
            No hay perfil asignado aún.
          </div>
        </div>
      );
    }

    const orders = scopedOrders.filter(o => o.customer_id === profile.phone).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const appointments = scopedAppointments.filter(a => a.customer_phone === profile.phone).sort((a, b) => new Date(b.scheduled_at || '').getTime() - new Date(a.scheduled_at || '').getTime());
    const nextReward = getNextReward(profile.stamps_balance);
    const totalSpent = orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.total_paid, 0);
    const redeemableRewards = data.rewards.filter(r => r.active && r.stamp_cost <= profile.stamps_balance);

    const redeemReward = (reward: Reward) => {
      const updatedCustomers = data.customers.map(c => c.phone === profile.phone ? { ...c, stamps_balance: c.stamps_balance - reward.stamp_cost } : c);
      const ledgerEntry = {
        id: Date.now(),
        customer_id: profile.phone,
        payment_id: '',
        order_id: 0,
        delta_stamps: -reward.stamp_cost,
        delta_credit_cop: 0,
        reason: 'redeem',
        reward_id: reward.id,
        created_at: new Date().toISOString()
      };
      saveData({ ...data, customers: updatedCustomers, loyaltyLedger: [...data.loyaltyLedger, ledgerEntry] });
      showToast(`Recompensa canjeada: ${reward.name}`);
    };

    const saveProfile = () => {
      const cleanPhone = sanitizePhone(profileDraft.phone);
      if (!/^[0-9]{7,}$/.test(cleanPhone)) {
        showToast('Ingresa un teléfono válido (solo números, mínimo 7 dígitos)');
        return;
      }
      const cleanEmail = profileDraft.email ? sanitizeEmail(profileDraft.email) : '';
      if (cleanEmail && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(cleanEmail)) {
        showToast('Ingresa un email válido');
        return;
      }
      const updatedCustomers = data.customers.map(c => c.id === profile.id ? { ...c, ...profileDraft, phone: cleanPhone, email: cleanEmail } : c);
      const updatedOrders = data.orders.map(o => o.customer_id === profile.phone ? { ...o, customer_id: cleanPhone, customer_name: profileDraft.name || cleanPhone } : o);
      const updatedAppointments = data.appointments.map(a => a.customer_phone === profile.phone ? { ...a, customer_phone: cleanPhone, customer_name: profileDraft.name || cleanPhone } : a);
      const updatedLedger = data.loyaltyLedger.map(l => l.customer_id === profile.phone ? { ...l, customer_id: cleanPhone } : l);
      const updatedTips = data.tips.map(t => t.customer_phone === profile.phone ? { ...t, customer_phone: cleanPhone } : t);
      saveData({ ...data, customers: updatedCustomers, orders: updatedOrders, appointments: updatedAppointments, loyaltyLedger: updatedLedger, tips: updatedTips });
      setCurrentClientPhone(cleanPhone);
      showToast('Perfil actualizado');
    };

    const latestAppointment = appointments[0];

    const quickNotify = () => {
      sendAutomatedMessage(profile.phone, 'Hola, este es un aviso rápido de tu barbero. 🚀');
      showToast('Notificación enviada');
    };

    const clientCheckout = (appt: Appointment) => {
      const total = (appt.services || []).reduce((sum, code) => {
        const svc = data.services.find(s => s.code === code);
        return sum + (svc?.price_cop || 0);
      }, 0);
      const payUrl = `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=CLIENT-${appt.id}-${Date.now()}&amount=${total}&customer=${appt.customer_phone}`;
      const updatedAppointments = data.appointments.map(a => a.id === appt.id ? { ...a, payment_status: 'PENDING' } : a);
      saveData({ ...data, appointments: updatedAppointments });
      window.open(payUrl, '_blank', 'noopener,noreferrer');
      showToast('Abriendo pago en Mercado Pago...');
    };

    const clientCancel = (appt: Appointment) => {
      const updatedAppointments = data.appointments.map(a => a.id === appt.id ? { ...a, status: 'CANCELLED', payment_status: 'CANCELLED' } : a);
      const updatedOrders = data.orders.map(o => o.appointment_id === appt.id ? { ...o, status: 'CANCELLED' } : o);
      saveData({ ...data, appointments: updatedAppointments, orders: updatedOrders });
      showToast('Cita cancelada (y orden vinculada, si existía)');
    };

    const clientReschedule = (appt: Appointment) => {
      const newDate = prompt('Nueva fecha (YYYY-MM-DD):', (appt.scheduled_at || '').substring(0, 10));
      const newTime = prompt('Nueva hora (HH:MM):', new Date(appt.scheduled_at || '').toISOString().substring(11, 16));
      if (!newDate || !newTime) {
        showToast('Reprogramación cancelada');
        return;
      }
      const newScheduled = `${newDate}T${newTime}:00`;
      const updatedAppointments = data.appointments.map(a => a.id === appt.id ? { ...a, scheduled_at: newScheduled, status: 'SCHEDULED' } : a);
      saveData({ ...data, appointments: updatedAppointments });
      showToast('Cita reprogramada');
    };

    const quickNewAppt = () => {
      setClientTab('citas');
      scrollToCitas();
    };

    const quickReprogram = () => {
      if (!latestAppointment) {
        showToast('No hay citas para reprogramar');
        return;
      }
      setClientTab('citas');
      scrollToCitas();
      setEditingApptId(latestAppointment.id);
      const d = new Date(latestAppointment.scheduled_at);
      setApptForm({
        barber_id: String(latestAppointment.barber_id),
        services: [...latestAppointment.services],
        date: d.toISOString().split('T')[0],
        time: d.toTimeString().slice(0, 5),
        notes: latestAppointment.notes
      });
    };

    const quickCancel = () => {
      if (!latestAppointment) {
        showToast('No hay citas para cancelar');
        return;
      }
      const updated = data.appointments.map(a => a.id === latestAppointment.id ? { ...a, status: 'CANCELLED', payment_status: 'CANCELLED' } : a);
      saveData({ ...data, appointments: updated });
      showToast('Cita cancelada');
    };

    const quickViewCitas = () => {
      setClientTab('citas');
      scrollToCitas();
    };

    const toggleService = (code: string) => {
      setApptForm(prev => ({
        ...prev,
        services: prev.services.includes(code) ? prev.services.filter(s => s !== code) : [...prev.services, code]
      }));
    };

    const submitAppointment = () => {
      if (!apptForm.barber_id || !apptForm.date || !apptForm.time || apptForm.services.length === 0) {
        showToast('Selecciona barbero, fecha, hora y al menos un servicio');
        return;
      }
      const barber = data.barbers.find(b => b.id === Number(apptForm.barber_id));
      const scheduledAt = `${apptForm.date}T${apptForm.time}:00`;
      const slotDate = new Date(scheduledAt);
      if (slotDate.getTime() < Date.now() - 60000) {
        showToast('La cita no puede ser en el pasado');
        return;
      }
      const conflict = data.appointments.some(a =>
        a.barber_id === Number(apptForm.barber_id) &&
        a.id !== editingApptId &&
        a.status !== 'CANCELLED' &&
        Math.abs(new Date(a.scheduled_at).getTime() - slotDate.getTime()) < 30 * 60 * 1000
      );
      if (conflict) {
        showToast('Ese barbero ya tiene una cita en ese horario');
        return;
      }
      if (editingApptId) {
        const updated = data.appointments.map(a => a.id === editingApptId ? { ...a, barber_id: Number(apptForm.barber_id), chair_id: barber?.chair_id || a.chair_id, services: apptForm.services, notes: apptForm.notes, scheduled_at: scheduledAt, status: 'SCHEDULED' } : a);
        saveData({ ...data, appointments: updated });
        setEditingApptId(null);
      } else {
        const newAppt: Appointment = {
          id: Date.now(),
          customer_phone: profile.phone,
          customer_name: profileDraft.name || profile.phone,
          barber_id: Number(apptForm.barber_id),
          chair_id: barber?.chair_id || 0,
          scheduled_at: scheduledAt,
          status: 'SCHEDULED',
          payment_status: 'PENDING',
          source: 'client',
          created_at: new Date().toISOString(),
          services: apptForm.services,
          notes: apptForm.notes
        };
        saveData(prev => ({ ...prev, appointments: [...prev.appointments, newAppt] }));
        const confirmMsg = `✅ Cita agendada\n${new Date(scheduledAt).toLocaleString('es-CO')} con ${barber?.name || ''}`;
        sendAutomatedMessage(profile.phone, confirmMsg);
        scheduleReminderHooks(newAppt);
      }
      setApptForm({ barber_id: '', services: [], date: '', time: '', notes: '' });
      showToast('Cita guardada');
    };

    const cancelAppointment = (id: number) => {
      const updated = data.appointments.map(a => a.id === id ? { ...a, status: 'CANCELLED', payment_status: 'CANCELLED' } : a);
      saveData({ ...data, appointments: updated });
    };

    const startPayAppointment = (appt: Appointment) => {
      const total = getServicesTotal(appt.services);
      const url = `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=CLIENT-${appt.id}-${Date.now()}&amount=${total}&customer=${appt.customer_phone}`;
      setCheckoutAppt(appt);
      setCheckoutUrl(url);
    };

    const markPaid = () => {
      if (!checkoutAppt) return;
      const cleanPhone = sanitizePhone(checkoutAppt.customer_phone);
      const stampsEarned = getStampsFromServices(checkoutAppt.services);
      const total = getServicesTotal(checkoutAppt.services);
      const orderId = Date.now();
      const existingOrder = data.orders.find(o => o.appointment_id === checkoutAppt.id);
      const paidOrder = existingOrder ? { ...existingOrder, status: 'PAID', total_paid: total, paid_at: new Date().toISOString() } : {
        id: orderId,
        customer_id: cleanPhone,
        customer_name: checkoutAppt.customer_name || cleanPhone,
        barber_id: checkoutAppt.barber_id,
        chair_id: checkoutAppt.chair_id,
        appointment_id: checkoutAppt.id,
        subtotal: total,
        discount: 0,
        credit_applied: 0,
        reward_used: null,
        total_due: total,
        total_paid: total,
        status: 'PAID',
        mp_order_ref: `CLIENT-${checkoutAppt.id}`,
        mp_payment_url: checkoutUrl,
        created_at: checkoutAppt.created_at || new Date().toISOString(),
        services: checkoutAppt.services,
        paid_at: new Date().toISOString()
      };

      const updatedCustomers = data.customers.map(c => {
        if (c.phone === cleanPhone) {
          const newStamps = (c.stamps_balance || 0) + stampsEarned;
          const tier = getCustomerTier(c.phone);
          return { ...c, stamps_balance: newStamps, tier, last_visit: new Date().toISOString() };
        }
        return c;
      });

      const updatedAppointments = data.appointments.map(a => a.id === checkoutAppt.id ? { ...a, payment_status: 'PAID', status: 'COMPLETED' } : a);
      const updatedOrders = existingOrder
        ? data.orders.map(o => o.id === existingOrder.id ? paidOrder : o)
        : [...data.orders, paidOrder];

      const ledgerEntry = {
        id: Date.now(),
        customer_id: cleanPhone,
        payment_id: paidOrder.mp_order_ref,
        order_id: paidOrder.id,
        delta_stamps: stampsEarned,
        delta_credit_cop: 0,
        reason: 'earn',
        reward_id: null,
        created_at: new Date().toISOString()
      };

      saveData({ ...data, appointments: updatedAppointments, orders: updatedOrders, customers: updatedCustomers, loyaltyLedger: [...data.loyaltyLedger, ledgerEntry] });
      setCheckoutAppt(null);
      setCheckoutUrl('');

      const servicesList = checkoutAppt.services.map(code => data.services.find(s => s.code === code)?.display_name || code).join(', ');
      const receiptMsg = data.messageTemplates.receipt
        .replace('{services}', servicesList || 'Servicios')
        .replace('{total}', total.toString())
        .replace('{stamps}', stampsEarned.toString())
        .replace('{total_stamps}', (updatedCustomers.find(c => c.phone === cleanPhone)?.stamps_balance || 0).toString())
        .replace('{next_reward}', getNextReward((updatedCustomers.find(c => c.phone === cleanPhone)?.stamps_balance || 0))?.name || 'Aún no');
      sendAutomatedMessage(cleanPhone, receiptMsg);
      const tipMsg = data.messageTemplates.tip.replace('{barber_name}', data.barbers.find(b => b.id === checkoutAppt.barber_id)?.name || 'tu barbero');
      setTimeout(() => sendAutomatedMessage(cleanPhone, tipMsg), 1200);
    };

    const addTip = (orderId: number, barberId: number, chairId: number) => {
      const raw = tipDrafts[orderId] || '0';
      const amount = Number(raw);
      if (isNaN(amount) || amount <= 0) {
        showToast('Ingresa un valor de propina válido');
        return;
      }
      const newTip: Tip = {
        id: Date.now(),
        mp_tip_payment_id: `TIP-${Date.now()}`,
        order_id: orderId,
        barber_id: barberId,
        chair_id: chairId,
        customer_phone: profile.phone,
        amount,
        paid_at: new Date().toISOString(),
        status: 'PAID'
      };
      saveData({ ...data, tips: [newTip, ...data.tips] });
      setTipDrafts(prev => ({ ...prev, [orderId]: '' }));
    };

    const paidOrders = orders.filter(o => o.status === 'PAID');

    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold mb-2">Perfil del Cliente</h2>
          <p className="text-sm text-gray-600">Resumen de tu cuenta, citas, pagos y recompensas.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setClientTab('perfil')}
              className={`px-4 py-2 rounded border text-sm ${clientTab === 'perfil' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              id="client-tab-perfil"
              name="client_tab_perfil"
            >
              Perfil
            </button>
            <button
              onClick={() => { setClientTab('citas'); scrollToCitas(); }}
              className={`px-4 py-2 rounded border text-sm ${clientTab === 'citas' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              id="client-tab-citas"
              name="client_tab_citas"
            >
              Citas
            </button>
            {userRole === 'OWNER' && (
              <button
                onClick={deleteClientData}
                className="px-4 py-2 rounded border text-sm bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                id="client-delete-data"
                name="client_delete_data"
              >
                Borrar datos del cliente
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`bg-white rounded-lg shadow p-4 space-y-3 ${clientTab === 'perfil' ? '' : 'hidden'}`}>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Teléfono</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="sr-only" htmlFor="client-phone">Teléfono</label>
                <input
                  id="client-phone"
                  name="client_phone"
                  value={profileDraft.phone}
                  onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  aria-label="Teléfono del cliente"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="client-name">Nombre</label>
                <input
                  id="client-name"
                  name="client_name"
                  value={profileDraft.name}
                  onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  aria-label="Nombre del cliente"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="client-email">Email</label>
                <input
                  id="client-email"
                  name="client_email"
                  value={profileDraft.email}
                  onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  aria-label="Email del cliente"
                  placeholder="Email (opcional)"
                />
              </div>
            </div>
            <button onClick={saveProfile} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto">
              Guardar cambios
            </button>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-xs text-gray-500">Sellos</div>
                <div className="text-xl font-bold">⭐ {profile.stamps_balance}</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="text-xs text-gray-500">Crédito</div>
                <div className="text-xl font-bold">${profile.credit_balance.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="text-xs text-gray-500">Total gastado</div>
                <div className="text-xl font-bold">${totalSpent.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <div className="text-xs text-gray-500">Tier</div>
                <div className="text-xl font-bold">{getCustomerTier(profile.phone)}</div>
              </div>
            </div>
            {nextReward && (
              <div className="text-sm text-gray-700">
                Próxima recompensa: <span className="font-semibold">{nextReward.name}</span> (faltan {Math.max(nextReward.stamp_cost - profile.stamps_balance, 0)} sellos)
              </div>
            )}
          </div>

          <div id="client-citas-section" className={`bg-white rounded-lg shadow p-4 space-y-4 ${clientTab === 'citas' ? '' : 'hidden'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Nueva cita / Reprogramar</h3>
              {editingApptId && (
                <button onClick={() => { setEditingApptId(null); setApptForm({ barber_id: '', services: [], date: '', time: '', notes: '' }); }} className="text-sm text-gray-600 hover:underline">
                  Cancelar edición
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="client-appt-barber">Barbero</label>
                <select
                  id="client-appt-barber"
                  name="client_appt_barber"
                  value={apptForm.barber_id}
                  onChange={(e) => setApptForm({ ...apptForm, barber_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Seleccionar...</option>
                  {data.barbers.map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Silla {b.chair_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="client-appt-date">Fecha</label>
                <input
                  id="client-appt-date"
                  name="client_appt_date"
                  type="date"
                  value={apptForm.date}
                  onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="client-appt-time">Hora</label>
                <input
                  id="client-appt-time"
                  name="client_appt_time"
                  type="time"
                  value={apptForm.time}
                  onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  id="client-appt-notes"
                  name="client_appt_notes"
                  value={apptForm.notes}
                  onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                  placeholder="Preferencias o detalles"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.services.filter(s => s.active).map(service => (
                <label key={service.code} className={`flex items-center gap-3 p-3 border rounded cursor-pointer ${apptForm.services.includes(service.code) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="checkbox"
                    id={`client-service-${service.code}`}
                    name="client_services"
                    checked={apptForm.services.includes(service.code)}
                    onChange={() => toggleService(service.code)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{service.display_name}</div>
                    <div className="text-xs text-gray-500">{service.duration_mins} min</div>
                  </div>
                  <div className="font-semibold text-sm">${service.price_cop.toLocaleString()}</div>
                </label>
              ))}
            </div>
            <button onClick={submitAppointment} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {editingApptId ? 'Actualizar cita' : 'Crear cita'}
            </button>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${clientTab === 'citas' ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Citas</h3>
                <span className="text-xs text-gray-500">Próximas y pasadas</span>
              </div>
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-sm">No tienes citas registradas.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {appointments.slice(0, 10).map(appt => {
                    const barber = data.barbers.find(b => b.id === appt.barber_id);
                    const servicesLabel = appt.services?.map(s => data.services.find(sv => sv.code === s)?.display_name || s).join(', ') || '—';
                    return (
                      <div key={appt.id} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">{new Date(appt.scheduled_at).toLocaleString('es-CO')}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${appt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : appt.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">Barbero: {barber?.name || 'Pendiente'}</div>
                        <div className="text-xs text-gray-600">Servicios: {servicesLabel}</div>
                        <div className="flex flex-wrap gap-2 text-xs mt-2">
                          {appt.status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => {
                                  setClientTab('citas');
                                  scrollToCitas();
                                  // prefill form for reprogram
                                  setEditingApptId(appt.id);
                                  const d = new Date(appt.scheduled_at || appt.created_at || Date.now());
                                  setApptForm({
                                    barber_id: String(appt.barber_id || ''),
                                    services: appt.services || [],
                                    date: d.toISOString().substring(0, 10),
                                    time: d.toISOString().substring(11, 16),
                                    notes: appt.notes || ''
                                  });
                                }}
                                className="flex-1 min-w-[120px] bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm hover:bg-yellow-200"
                              >
                                Reprogramar
                              </button>
                              <button onClick={() => clientCancel(appt)} className="flex-1 min-w-[120px] bg-red-100 text-red-800 px-3 py-2 rounded text-sm hover:bg-red-200">Cancelar</button>
                              {appt.payment_status !== 'PAID' && (
                                <button onClick={() => clientCheckout(appt)} className="flex-1 min-w-[120px] bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">Check-out</button>
                              )}
                            </>
                          )}
                          {appt.status === 'CANCELLED' && (
                            <span className="px-2 py-1 rounded bg-red-100 text-red-800">Cancelada</span>
                          )}
                          {appt.status === 'COMPLETED' && (
                            <span className="px-2 py-1 rounded bg-green-100 text-green-800">Pagada</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2"><HistoryIcon className="w-4 h-4" /> Historial de pagos</h3>
                <span className="text-xs text-gray-500">Últimas órdenes</span>
              </div>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay pagos registrados.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {orders.slice(0, 10).map(order => (
                    <div key={order.id} className="p-3 border rounded-lg bg-gray-50 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{new Date(order.created_at).toLocaleString('es-CO')}</span>
                        <span className="font-semibold">${order.total_paid.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {order.services.map(s => data.services.find(sv => sv.code === s)?.display_name).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500">Estado: {order.status}</div>
                      {order.status === 'PAID' && (
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <label className="sr-only" htmlFor={`tip-${order.id}`}>Propina</label>
                          <input
                            id={`tip-${order.id}`}
                            name={`tip-${order.id}`}
                            type="number"
                            value={tipDrafts[order.id] || ''}
                            onChange={(e) => setTipDrafts(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="w-24 px-2 py-1 border rounded"
                            placeholder="$"
                          />
                          <button onClick={() => addTip(order.id, order.barber_id, order.chair_id)} className="px-3 py-1 rounded bg-green-100 text-green-800">
                            Agregar propina
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2"><Gift className="w-4 h-4" /> Recompensas</h3>
              <span className="text-xs text-gray-500">Progreso</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sellos acumulados</span>
                <span className="font-semibold">{profile.stamps_balance}</span>
              </div>
              {nextReward ? (
                <div className="flex justify-between">
                  <span>Siguiente recompensa</span>
                  <span className="font-semibold">{nextReward.name} ({nextReward.stamp_cost} sellos)</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No hay recompensas próximas.</div>
              )}
              {redeemableRewards.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold mb-1" htmlFor="client-redeem-reward">Canjear recompensa</label>
                  <div className="flex flex-wrap gap-2">
                    {redeemableRewards.map(r => (
                      <button
                        key={r.id}
                        id={`client-redeem-${r.id}`}
                        name="client_redeem_reward"
                        onClick={() => redeemReward(r)}
                        className="px-3 py-2 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                      >
                        {r.name} ({r.stamp_cost} sellos)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {checkoutAppt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Pago pendiente</h3>
                  <p className="text-sm text-gray-600">{checkoutAppt.customer_name || checkoutAppt.customer_phone}</p>
                </div>
                <button onClick={() => { setCheckoutAppt(null); setCheckoutUrl(''); }} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar pago">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  ${getServicesTotal(checkoutAppt.services).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Escanea el QR para pagar con Mercado Pago</p>
                <div className="flex justify-center">
                  <img src={generateQRCode(checkoutUrl || 'https://www.mercadopago.com.co')} alt="QR Pago" className="w-40 h-40" />
                </div>
                <a href={checkoutUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">
                  Abrir formulario de pago
                </a>
              </div>
              <div className="flex gap-2">
                <button onClick={markPaid} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                  Marcar como pagado
                </button>
                <button onClick={() => { setCheckoutAppt(null); setCheckoutUrl(''); }} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const StatCard = ({ icon, label, value, subvalue = '', color, theme: t }: { icon: any; label: string; value: any; subvalue?: string; color: string; theme?: 'light' | 'dark' }) => {
    const colorClasses =
      t === 'light'
        ? {
          green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
          blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
          purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
          orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' }
        }[color] || { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-900' }
        : { bg: 'glass-card', border: 'border-white/10', text: 'text-slate-100' };

    return (
      <div className={`${colorClasses.bg} border ${colorClasses.border} rounded-lg p-4 transition-transform hover:scale-105`}>
        <div className={`${colorClasses.text} mb-2`}>{icon}</div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm opacity-80 font-medium">{label}</div>
        {subvalue && <div className="text-xs opacity-60 mt-1">{subvalue}</div>}
      </div>
    );
  };

  const WalkIn = () => {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [customer, setCustomer] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedBarberId, setSelectedBarberId] = useState(null);
    const [selectedReward, setSelectedReward] = useState(null);
    const [orderCreated, setOrderCreated] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [pendingApptId, setPendingApptId] = useState<number | null>(null);

    const searchCustomer = () => {
      const clean = sanitizePhone(phone);
      if (!clean) {
        showToast('Por favor ingresa un número de teléfono');
        return;
      }
      const found = data.customers.find(c => c.phone === clean);
      if (found) {
        setCustomer(found);
        setCustomerName(found.name);
      } else {
        setCustomer({ phone: clean, name: '', stamps_balance: 0, credit_balance: 0 });
        setCustomerName('');
      }
      // Bind this phone to the session when the user is a CLIENT so profile/appointments stay scoped
      if (userRole === 'CLIENT') {
        setCurrentClientPhone(clean);
        setClientProfileTab('citas');
        setCurrentView('client_profile');
      }
      setStep(2);
    };

    const toggleService = (serviceCode) => {
      setSelectedServices(prev =>
        prev.includes(serviceCode)
          ? prev.filter(s => s !== serviceCode)
          : [...prev, serviceCode]
      );
    };

    const calculateOrder = () => {
      let subtotal = 0;
      selectedServices.forEach(code => {
        const service = data.services.find(s => s.code === code);
        subtotal += service.price_cop;
      });

      let discount = 0;
      if (selectedReward) {
        const reward = data.rewards.find(r => r.id === selectedReward);
        if (reward.type === 'CREDIT') {
          discount = reward.value_cop;
        } else if (reward.type === 'SERVICE') {
          const service = data.services.find(s => s.code === reward.service_code);
          discount = service?.price_cop || 0;
        }
      }

      const creditApplied = Math.min(customer.credit_balance || 0, subtotal - discount);
      const total = Math.max(0, subtotal - discount - creditApplied);

      return { subtotal, discount, creditApplied, total };
    };

    const availableRewards = () => {
      if (!customer) return [];
      const tier = getCustomerTier(customer.phone);
      return data.rewards.filter(r =>
        r.active &&
        r.stamp_cost <= (customer.stamps_balance || 0) &&
        (!r.tier_restriction || r.tier_restriction === tier)
      );
    };

    const createOrder = () => {
      const cleanPhone = sanitizePhone(phone);
      const { subtotal, discount, creditApplied, total } = calculateOrder();
      const barber = data.barbers.find(b => b.id === selectedBarberId);

      const nowIso = new Date().toISOString();
      const newApptId = Date.now();
      const newAppt = {
        id: newApptId,
        customer_phone: cleanPhone,
        customer_name: customerName || cleanPhone,
        barber_id: selectedBarberId,
        chair_id: barber?.chair_id || 0,
        scheduled_at: nowIso,
        status: 'PENDING',
        payment_status: total > 0 ? 'PENDING' : 'PAID',
        source: 'WALKIN',
        created_at: nowIso,
        services: selectedServices,
        notes: ''
      };

      const newOrder = {
        id: Date.now() + 1,
        customer_id: cleanPhone,
        customer_name: customerName || cleanPhone,
        barber_id: selectedBarberId,
        chair_id: barber?.chair_id || 0,
        appointment_id: newApptId,
        subtotal,
        discount,
        credit_applied: creditApplied,
        reward_used: selectedReward,
        total_due: total,
        total_paid: 0,
        status: total > 0 ? 'PENDING' : 'PAID',
        mp_order_ref: `MP-${Date.now()}`,
        mp_payment_url: `https://mercadopago.com.co/checkout/v1/payment/${Date.now()}`,
        created_at: nowIso,
        services: selectedServices
      };

      let updatedCustomers = [...data.customers];
      const existingCustomer = data.customers.find(c => c.phone === cleanPhone);

      if (!existingCustomer) {
        updatedCustomers.push({
          id: Date.now(),
          phone: cleanPhone,
          name: customerName || cleanPhone,
          opt_in_status: true,
          created_at: new Date().toISOString(),
          stamps_balance: 0,
          credit_balance: 0,
          tier: 'BRONZE'
        });
      } else if (customerName && customerName !== existingCustomer.name) {
        updatedCustomers = updatedCustomers.map(c =>
          c.phone === cleanPhone ? { ...c, name: customerName } : c
        );
      }

      // Apply credit and reward
      if (creditApplied > 0 || selectedReward) {
        updatedCustomers = updatedCustomers.map(c => {
          if (c.phone === cleanPhone) {
            let newBalance = (c.credit_balance || 0) - creditApplied;
            let newStamps = c.stamps_balance || 0;
            if (selectedReward) {
              const reward = data.rewards.find(r => r.id === selectedReward);
              newStamps -= reward.stamp_cost;
            }
            return { ...c, credit_balance: newBalance, stamps_balance: newStamps };
          }
          return c;
        });
      }

      const newData = {
        ...data,
        customers: updatedCustomers,
        orders: [...data.orders, newOrder],
        appointments: [...data.appointments, newAppt]
      };

      saveData(newData);
      setOrderCreated(newOrder);
      setPendingApptId(newApptId);
      setStep(4);
    };

    const simulatePayment = () => {
      const paidOrder = {
        ...orderCreated,
        status: 'PAID',
        total_paid: orderCreated.total_due,
        paid_at: new Date().toISOString()
      };

      // Calculate stamps earned
      let stampsEarned = 0;
      const hasHaircut = selectedServices.some(s => s === 'FULL_HAIR_CUT' || s === 'CLEAN_CUT');
      const hasBeard = selectedServices.includes('BEARD');

      if (hasHaircut) stampsEarned += 1;
      if (hasBeard && hasHaircut) stampsEarned += 1;

      // Update customer
      const updatedCustomers = data.customers.map(c => {
        if (c.phone === phone) {
          const newStamps = (c.stamps_balance || 0) + stampsEarned;
          const tier = getCustomerTier(phone);
          return { ...c, stamps_balance: newStamps, tier, last_visit: new Date().toISOString() };
        }
        return c;
      });

      const updatedOrders = data.orders.map(o => o.id === orderCreated.id ? paidOrder : o);
      const updatedAppointments = data.appointments.map(a => a.id === paidOrder.appointment_id
        ? { ...a, payment_status: 'PAID', status: 'COMPLETED' }
        : a);

      // Add loyalty ledger entry
      const ledgerEntry = {
        id: Date.now(),
        customer_id: phone,
        payment_id: paidOrder.mp_order_ref,
        order_id: paidOrder.id,
        delta_stamps: stampsEarned,
        delta_credit_cop: 0,
        reason: 'earn',
        reward_id: null,
        created_at: new Date().toISOString()
      };

      // Check if reward unlocked
      const customer = updatedCustomers.find(c => c.phone === phone);
      const nextReward = getNextReward(customer.stamps_balance - stampsEarned);
      const unlockedReward = nextReward && customer.stamps_balance >= nextReward.stamp_cost;

      const newData = {
        ...data,
        customers: updatedCustomers,
        orders: updatedOrders,
        appointments: updatedAppointments,
        loyaltyLedger: [...data.loyaltyLedger, ledgerEntry]
      };

      saveData(newData);

      // Send notifications
      const servicesList = selectedServices.map(s => {
        const svc = data.services.find(sv => sv.code === s);
        return `• ${svc.display_name}`;
      }).join('\n');

      const receiptMsg = data.messageTemplates.receipt
        .replace('{services}', servicesList)
        .replace('{total}', paidOrder.total_paid.toLocaleString())
        .replace('{stamps}', String(stampsEarned))
        .replace('{total_stamps}', String(customer.stamps_balance))
        .replace('{next_reward}', nextReward ? `${nextReward.name} (${nextReward.stamp_cost - customer.stamps_balance} sellos más)` : 'Ninguna');

      sendAutomatedMessage(phone, receiptMsg);

      // Send tip request
      const barber = data.barbers.find(b => b.id === selectedBarberId);
      const tipMsg = data.messageTemplates.tip.replace('{barber_name}', barber?.name || 'tu barbero');
      setTimeout(() => sendAutomatedMessage(phone, tipMsg), 2000);

      if (unlockedReward) {
        const rewardMsg = data.messageTemplates.reward_unlocked.replace('{reward_name}', nextReward.name);
        setTimeout(() => sendAutomatedMessage(phone, rewardMsg), 4000);
      }

      showToast(`Pago aprobado. Total: ${paidOrder.total_paid.toLocaleString()} | Sellos +${stampsEarned}`);

      // Reset form
      setStep(1);
      setPhone('');
      setCustomer(null);
      setCustomerName('');
      setSelectedServices([]);
      setSelectedBarberId(null);
      setSelectedReward(null);
      setOrderCreated(null);
      setShowQR(false);
    };

    const { subtotal, discount, creditApplied, total } = customer && selectedServices.length > 0 ? calculateOrder() : { subtotal: 0, discount: 0, creditApplied: 0, total: 0 };

    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?view=walkin_public` : '';

    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="w-8 h-8" />
            Nuevo Walk-in
          </h2>
          {publicUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
                <span className="text-sm font-semibold">Link público</span>
                <input
                  className="w-48 sm:w-64 px-2 py-1 border rounded text-xs"
                  readOnly
                  value={data.settings.public_walkin_url || publicUrl}
                  onFocus={(e) => e.target.select()}
                  aria-label="URL pública walk-in"
                />
                <button
                  className="btn btn-primary px-3 py-1 text-xs"
                  onClick={() => navigator.clipboard.writeText(data.settings.public_walkin_url || publicUrl)}
                >
                  Copiar
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
                <span className="text-sm font-semibold">QR</span>
                <img
                  src={generateQRCode(data.settings.public_walkin_url || publicUrl)}
                  alt="QR Walk-in"
                  className="w-14 h-14 rounded border"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 1: Customer Search */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-medium mb-2">Teléfono del cliente</label>
            <div className="flex flex-col gap-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
                placeholder="3001234567"
                className="w-full px-4 py-3 border rounded-lg text-lg"
                id="walkin-phone"
                name="walkin_phone"
                autoFocus
              />
              <button
                onClick={searchCustomer}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Search className="w-5 h-5" />
                Buscar
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Services & Barber */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">Cliente: {customer.phone}</h3>
                  {!customer.name && (
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre del cliente (opcional)"
                      className="mt-2 px-3 py-2 border rounded w-full"
                      id="walkin-name"
                      name="walkin_name"
                    />
                  )}
                </div>
                <div className="text-right text-sm bg-gray-50 p-3 rounded">
                  <div className="flex items-center gap-2 justify-end">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{customer.stamps_balance || 0} sellos</span>
                  </div>
                  <div className="text-green-600 font-medium mt-1">
                    💰 ${(customer.credit_balance || 0).toLocaleString()} crédito
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getCustomerTier(customer.phone)} tier
                  </div>
                </div>
              </div>

              <label className="block text-sm font-medium mb-2">Barbero y Silla</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {data.barbers.filter(b => b.active).map(barber => (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarberId(barber.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${selectedBarberId === barber.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="font-bold">{barber.name}</div>
                    <div className="text-sm text-gray-600">Silla {barber.chair_id}</div>
                    <div className="text-xs text-gray-500 mt-1">{barber.specialty}</div>
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium mb-2">Servicios</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.services.filter(s => s.active).map(service => (
                  <label key={service.code} className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedServices.includes(service.code)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.code)}
                      onChange={() => toggleService(service.code)}
                      id={`walkin-service-${service.code}`}
                      name="walkin_services"
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{service.display_name}</div>
                      <div className="text-sm text-gray-500">{service.duration_mins} min</div>
                    </div>
                    <div className="font-bold text-lg">${service.price_cop.toLocaleString()}</div>
                  </label>
                ))}
              </div>

              {availableRewards().length > 0 && (
                <>
                  <label className="block text-sm font-medium mb-2 mt-4" htmlFor="reward-select">Aplicar Recompensa (opcional)</label>
                  <select
                    id="reward-select"
                    name="reward_select"
                    value={selectedReward || ''}
                    onChange={(e) => setSelectedReward(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-2 border rounded-lg"
                    aria-label="Aplicar recompensa"
                  >
                    <option value="">No aplicar recompensa</option>
                    {availableRewards().map(reward => (
                      <option key={reward.id} value={reward.id}>
                        {reward.name} ({reward.stamp_cost} sellos)
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {selectedServices.length > 0 && selectedBarberId && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">Resumen del Pago</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Descuento (Recompensa):</span>
                      <span className="font-medium">-${discount.toLocaleString()}</span>
                    </div>
                  )}
                  {creditApplied > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Crédito aplicado:</span>
                      <span className="font-medium">-${creditApplied.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t-2">
                    <span>Total a pagar:</span>
                    <span className="text-blue-600">${total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                    Volver
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedBarberId || selectedServices.length === 0) {
                        showToast('Selecciona barbero y al menos un servicio antes de continuar');
                        setStep(1);
                        return;
                      }
                      setStep(3);
                    }}
                    disabled={!selectedBarberId || selectedServices.length === 0 || total <= 0}
                    className={`flex-1 py-3 rounded-lg transition-colors font-medium ${!selectedBarberId || selectedServices.length === 0 || total <= 0
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    Continuar al Pago
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">¿Confirmar orden?</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="text-sm space-y-1">
                <div><strong>Cliente:</strong> {customerName || phone}</div>
                <div><strong>Barbero:</strong> {data.barbers.find(b => b.id === selectedBarberId)?.name}</div>
                <div><strong>Servicios:</strong> {selectedServices.map(s => data.services.find(sv => sv.code === s)?.display_name).join(', ')}</div>
                <div><strong>Total:</strong> ${total.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-200 py-3 rounded-lg hover:bg-gray-300 transition-colors">
                Volver
              </button>
              <button onClick={createOrder} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5" />
                Crear QR de Pago
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment QR */}
        {step === 4 && orderCreated && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="mb-4">
              <img
                src={generateQRCode(orderCreated.mp_payment_url)}
                alt="QR Code"
                className="w-64 h-64 mx-auto border-4 border-gray-200 rounded-lg"
              />
            </div>
            <h3 className="text-2xl font-bold mb-2">Escanea para pagar</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">${orderCreated.total_due.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mb-6">
              <div>Ref: {orderCreated.mp_order_ref}</div>
              <div className="mt-2 text-xs">
                <a href={orderCreated.mp_payment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {orderCreated.mp_payment_url}
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600">
              <Clock className="w-4 h-4 animate-pulse" />
              Esperando pago...
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (!orderCreated?.mp_payment_url) {
                    showToast('No hay URL de pago disponible');
                    return;
                  }
                  window.open(orderCreated.mp_payment_url, '_blank', 'noopener,noreferrer');
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Abrir pago en Mercado Pago
              </button>
              <button onClick={simulatePayment} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Simular Pago Aprobado
              </button>
              <button onClick={() => { setStep(1); setOrderCreated(null); setPendingApptId(null); }} className="w-full bg-gray-200 py-3 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                Cancelar Orden
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Appointments = ({ onOpenCustomer }: { onOpenCustomer: (phone: string) => void }) => {
    const [showForm, setShowForm] = useState(false);
    const [showCheckout, setShowCheckout] = useState(null);
    const [editingApptId, setEditingApptId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
      customer_phone: '',
      customer_name: '',
      barber_id: '',
      scheduled_date: '',
      scheduled_time: '',
      services: [],
      notes: ''
    });
    const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState('');

    const toggleService = (serviceCode) => {
      setFormData(prev => ({
        ...prev,
        services: prev.services.includes(serviceCode)
          ? prev.services.filter(s => s !== serviceCode)
          : [...prev.services, serviceCode]
      }));
    };

    const getAppointmentTotal = (services: string[]) => {
      return services.reduce((sum, code) => {
        const svc = data.services.find(s => s.code === code);
        return sum + (svc ? svc.price_cop : 0);
      }, 0);
    };

    const clientCheckout = (appt: Appointment) => {
      const total = getAppointmentTotal(appt.services || []);
      const payUrl = `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=CLIENT-${appt.id}-${Date.now()}&amount=${total}&customer=${appt.customer_phone}`;
      window.open(payUrl, '_blank', 'noopener,noreferrer');
    };

    const clientCancel = (appt: Appointment) => {
      const updatedAppointments = data.appointments.map(a => a.id === appt.id ? { ...a, status: 'CANCELLED', payment_status: 'CANCELLED' } : a);
      saveData({ ...data, appointments: updatedAppointments });
      showToast('Cita cancelada');
    };

    const clientReschedule = (appt: Appointment) => {
      showToast('Para reprogramar, contacta a recepción');
    };

    const startCheckout = (appt: Appointment) => {
      const total = getAppointmentTotal(appt.services);
      const mockPaymentUrl = `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=APP-${appt.id}-${Date.now()}&amount=${total}&customer=${appt.customer_phone}`;
      setCheckoutAppt(appt);
      setCheckoutUrl(mockPaymentUrl);
    };

    const markCheckoutPaid = () => {
      if (!checkoutAppt) return;
      const total = getAppointmentTotal(checkoutAppt.services);
      const stampsEarned = getStampsFromServices(checkoutAppt.services);
      const cleanPhone = sanitizePhone(checkoutAppt.customer_phone);
      const existingCustomer = data.customers.find(c => c.phone === cleanPhone);
      const customerRecord: Customer = existingCustomer || {
        id: Date.now(),
        phone: cleanPhone,
        name: checkoutAppt.customer_name || cleanPhone,
        email: '',
        opt_in_status: true,
        created_at: new Date().toISOString(),
        stamps_balance: 0,
        credit_balance: 0,
        tier: 'BRONZE'
      };

      const updatedCustomer = {
        ...customerRecord,
        stamps_balance: (customerRecord.stamps_balance || 0) + stampsEarned,
        tier: getCustomerTier(customerRecord.phone),
        last_visit: new Date().toISOString()
      };

      const updatedCustomers = existingCustomer
        ? data.customers.map(c => c.phone === updatedCustomer.phone ? updatedCustomer : c)
        : [updatedCustomer, ...data.customers];

      const order: Order = {
        id: Date.now(),
        customer_id: updatedCustomer.phone,
        customer_name: updatedCustomer.name || updatedCustomer.phone,
        barber_id: checkoutAppt.barber_id,
        chair_id: checkoutAppt.chair_id,
        appointment_id: checkoutAppt.id,
        subtotal: total,
        discount: 0,
        credit_applied: 0,
        reward_used: null,
        total_due: total,
        total_paid: total,
        status: 'PAID',
        mp_order_ref: `APP-${checkoutAppt.id}`,
        mp_payment_url: checkoutUrl,
        created_at: checkoutAppt.created_at || new Date().toISOString(),
        services: checkoutAppt.services,
        paid_at: new Date().toISOString()
      };

      const updatedAppointments = data.appointments.map(a =>
        a.id === checkoutAppt.id ? { ...a, payment_status: 'PAID', status: 'COMPLETED' } : a
      );

      const ledgerEntry: LoyaltyLedger = {
        id: Date.now(),
        customer_id: updatedCustomer.phone,
        payment_id: order.mp_order_ref,
        order_id: order.id,
        delta_stamps: stampsEarned,
        delta_credit_cop: 0,
        reason: 'earn',
        reward_id: null,
        created_at: new Date().toISOString()
      };

      saveData({ ...data, appointments: updatedAppointments, orders: [...data.orders, order], customers: updatedCustomers, loyaltyLedger: [...data.loyaltyLedger, ledgerEntry] });
      setCheckoutAppt(null);
      setCheckoutUrl('');

      const receiptMsg = data.messageTemplates.receipt
        .replace('{services}', checkoutAppt.services.map(code => data.services.find(s => s.code === code)?.display_name || code).join(', '))
        .replace('{total}', total.toString())
        .replace('{stamps}', stampsEarned.toString())
        .replace('{total_stamps}', updatedCustomer.stamps_balance.toString())
        .replace('{next_reward}', getNextReward(updatedCustomer.stamps_balance)?.name || 'Aún no');
      sendAutomatedMessage(updatedCustomer.phone, receiptMsg);
    };

    const createAppointment = () => {
      if (!formData.customer_phone || !formData.barber_id || !formData.scheduled_date || !formData.scheduled_time) {
        showToast('Por favor completa todos los campos requeridos');
        return;
      }

      const barber = data.barbers.find(b => b.id === Number(formData.barber_id));
      const scheduledAt = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      const slotDate = new Date(scheduledAt);
      if (slotDate.getTime() < Date.now() - 60000) {
        showToast('La cita no puede ser en el pasado');
        return;
      }
      const conflict = data.appointments.some(a =>
        a.barber_id === Number(formData.barber_id) &&
        a.id !== editingApptId &&
        a.status !== 'CANCELLED' &&
        Math.abs(new Date(a.scheduled_at).getTime() - slotDate.getTime()) < 30 * 60 * 1000
      );
      if (conflict) {
        showToast('Ese barbero ya tiene una cita en ese horario');
        return;
      }

      if (editingApptId) {
        const updatedAppt = {
          id: editingApptId,
          customer_phone: formData.customer_phone,
          customer_name: formData.customer_name,
          barber_id: Number(formData.barber_id),
          chair_id: barber.chair_id,
          scheduled_at: scheduledAt,
          status: 'SCHEDULED',
          payment_status: 'PENDING',
          source: 'web',
          created_at: data.appointments.find(a => a.id === editingApptId)?.created_at || new Date().toISOString(),
          services: formData.services,
          notes: formData.notes
        };
        saveData(prev => ({
          ...prev,
          appointments: prev.appointments.map(a => a.id === editingApptId ? updatedAppt : a)
        }));
        showToast('Cita actualizada');
      } else {
        const newAppt = {
          id: Date.now(),
          customer_phone: formData.customer_phone,
          customer_name: formData.customer_name,
          barber_id: Number(formData.barber_id),
          chair_id: barber.chair_id,
          scheduled_at: scheduledAt,
          status: 'SCHEDULED',
          payment_status: 'PENDING',
          source: 'web',
          created_at: new Date().toISOString(),
          services: formData.services,
          notes: formData.notes
        };

        if (data.settings.google_calendar_enabled) {
          syncToGoogleCalendar(newAppt);
        } else {
          addNotification({
            type: 'calendar_disabled',
            title: 'Calendar desactivado',
            message: 'Activa Google Calendar en Configuración para sincronizar citas.'
          });
        }

        const confirmMsg = `✅ Cita confirmada\n\nFecha: ${new Date(scheduledAt).toLocaleString('es-CO')}\nBarbero: ${barber.name}\nSilla: ${barber.chair_id}\n\nTe recordaremos 24h y 2h antes.`;
        sendAutomatedMessage(formData.customer_phone, confirmMsg);
        scheduleReminderHooks(newAppt);

        saveData(prev => ({
          ...prev,
          appointments: [...prev.appointments, newAppt]
        }));
        showToast('Cita creada y sincronizada');
      }

      setEditingApptId(null);
      setShowForm(false);
      setFormData({ customer_phone: '', customer_name: '', barber_id: '', scheduled_date: '', scheduled_time: '', services: [], notes: '' });
    };

    const todayAppts = scopedAppointments.filter(a => {
      const apptDate = new Date(a.scheduled_at).toISOString().split('T')[0];
      return apptDate === selectedDate;
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    const startEditAppt = (appt: Appointment) => {
      setShowForm(true);
      setEditingApptId(appt.id);
      const d = new Date(appt.scheduled_at);
      setFormData({
        customer_phone: appt.customer_phone,
        customer_name: appt.customer_name,
        barber_id: String(appt.barber_id),
        scheduled_date: d.toISOString().split('T')[0],
        scheduled_time: d.toTimeString().slice(0, 5),
        services: [...appt.services],
        notes: appt.notes || ''
      });
    };

    const cancelAppt = (appt: Appointment) => {
      saveData(prev => ({
        ...prev,
        appointments: prev.appointments.map(a => a.id === appt.id ? { ...a, status: 'CANCELLED', payment_status: 'CANCELLED' } : a)
      }));
      showToast('Cita cancelada');
    };

    const sendReminders = () => {
      const now = new Date();
      scopedAppointments.filter(a => a.status === 'SCHEDULED').forEach(appt => {
        const apptTime = new Date(appt.scheduled_at);
        const hoursDiff = (apptTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const barber = scopedBarbers.find(b => b.id === appt.barber_id);

        if (hoursDiff > 23 && hoursDiff < 25) {
          const msg = data.messageTemplates.reminder_24h
            .replace('{time}', apptTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))
            .replace('{barber_name}', barber.name);
          sendAutomatedMessage(appt.customer_phone, msg);
        } else if (hoursDiff > 1.5 && hoursDiff < 2.5) {
          const msg = data.messageTemplates.reminder_2h
            .replace('{time}', apptTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }))
            .replace('{barber_name}', barber.name);
          sendAutomatedMessage(appt.customer_phone, msg);
        }
      });
      showToast('✓ Recordatorios enviados');
    };

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Agenda de Citas</h2>
            <label className="text-sm text-gray-600" htmlFor="appointments-date">Fecha</label>
            <input
              id="appointments-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-2 px-4 py-2 border rounded"
              aria-label="Seleccionar fecha de citas"
              name="appointments_date"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={sendReminders} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Enviar Recordatorios
            </button>
            <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nueva Cita
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Nueva Cita</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appt-phone">Teléfono Cliente *</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="3001234567"
                  id="appt-phone"
                  name="appt_phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appt-name">Nombre Cliente</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Juan Pérez"
                  id="appt-name"
                  name="appt_name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appt-barber">Barbero *</label>
                <select
                  value={formData.barber_id}
                  onChange={(e) => setFormData({ ...formData, barber_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  aria-label="Seleccionar barbero"
                  id="appt-barber"
                  name="appt_barber"
                >
                  <option value="">Seleccionar...</option>
                  {(userRole === 'BARBER' && currentBarberId ? data.barbers.filter(b => b.id === currentBarberId) : data.barbers).map(b => (
                    <option key={b.id} value={b.id}>{b.name} (Silla {b.chair_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appointment-date">Fecha *</label>
                <input
                  id="appointment-date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  min={new Date().toISOString().split('T')[0]}
                  aria-label="Fecha de la cita"
                  name="appointment_date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="appointment-time">Hora *</label>
                <input
                  id="appointment-time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  aria-label="Hora de la cita"
                  name="appointment_time"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  id="appointment-notes"
                  name="appointment_notes"
                  rows={2}
                  placeholder="Notas especiales..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={createAppointment} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Crear Cita
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {todayAppts.length === 0 ? (
            <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay citas programadas para esta fecha</p>
            </div>
          ) : (
            todayAppts.map(appt => {
              const barber = scopedBarbers.find(b => b.id === appt.barber_id);
              const time = new Date(appt.scheduled_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

              const statusLabel = appt.status === 'CANCELLED'
                ? 'Cancelada'
                : appt.payment_status === 'PAID'
                  ? '✓ Pagado'
                  : 'Pendiente';
              const statusClass = appt.status === 'CANCELLED'
                ? 'bg-red-100 text-red-800'
                : appt.payment_status === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800';

              return (
                <div key={appt.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-2xl font-bold text-blue-600">{time}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <button
                        onClick={() => onOpenCustomer(appt.customer_phone)}
                        className="font-medium text-left text-blue-700 hover:underline"
                        aria-label={`Ver ficha de ${appt.customer_name || appt.customer_phone}`}
                      >
                        {appt.customer_name || appt.customer_phone}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{barber?.name} • Silla {appt.chair_id}</span>
                    </div>
                    {appt.services && appt.services.length > 0 && (
                      <div className="text-gray-600 text-xs mt-1">
                        Servicios: {appt.services.map(s => data.services.find(sv => sv.code === s)?.display_name).join(', ')}
                      </div>
                    )}
                    {appt.notes && (
                      <div className="text-gray-600 text-xs mt-2 p-2 bg-gray-50 rounded">
                        {appt.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => startEditAppt(appt)}
                      className="flex-1 min-w-[120px] bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm hover:bg-yellow-200"
                    >
                      Reprogramar
                    </button>
                    <button
                      onClick={() => cancelAppt(appt)}
                      className="flex-1 min-w-[120px] bg-red-100 text-red-800 px-3 py-2 rounded text-sm hover:bg-red-200"
                    >
                      Cancelar
                    </button>
                    {appt.payment_status !== 'PAID' && appt.status !== 'CANCELLED' && (
                      <button
                        onClick={() => startCheckout(appt)}
                        className="flex-1 min-w-[120px] bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Check-out
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {checkoutAppt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Cobro pendiente</h3>
                  <p className="text-sm text-gray-600">{checkoutAppt.customer_name || checkoutAppt.customer_phone}</p>
                </div>
                <button
                  onClick={() => { setCheckoutAppt(null); setCheckoutUrl(''); }}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Cerrar cobro pendiente"
                  title="Cerrar cobro pendiente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  ${getAppointmentTotal(checkoutAppt.services).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Escanea el QR para pagar con Mercado Pago</p>
                <div className="flex justify-center">
                  <img src={generateQRCode(checkoutUrl || 'https://www.mercadopago.com.co')} alt="QR Pago" className="w-40 h-40" />
                </div>
                <a href={checkoutUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm underline">
                  Abrir formulario de pago
                </a>
              </div>
              <div className="flex gap-2">
                <button onClick={markCheckoutPaid} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                  Marcar como pagado
                </button>
                <button onClick={() => { setCheckoutAppt(null); setCheckoutUrl(''); }} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Customers = ({ onOpenCustomer }: { onOpenCustomer: (phone: string) => void }) => {
    const [search, setSearch] = useState('');
    const [filterTier, setFilterTier] = useState('ALL');
    const [customerForm, setCustomerForm] = useState({ phone: '', name: '', email: '' });
    const [editingId, setEditingId] = useState<number | null>(null);

    const filtered = data.customers.filter(c => {
      const matchesSearch = c.phone.includes(search) || c.name?.toLowerCase().includes(search.toLowerCase());
      const tier = getCustomerTier(c.phone);
      const matchesTier = filterTier === 'ALL' || tier === filterTier;
      return matchesSearch && matchesTier;
    });
    const deleteCustomer = (customer: Customer) => {
      if (userRole !== 'OWNER') return;
      if (!window.confirm(`Eliminar cliente ${customer.name || customer.phone}? Esta acción no se puede deshacer.`)) return;
      const updatedCustomers = data.customers.filter(c => c.id !== customer.id);
      saveData({ ...data, customers: updatedCustomers });
      if (selectedCustomerModal?.id === customer.id) {
        setSelectedCustomerModal(null);
      }
    };

    const addCustomer = () => {
      if (!search || search.trim().length < 7) {
        showToast('Ingresa un teléfono válido para crear el cliente');
        return;
      }
      const exists = data.customers.find(c => c.phone === search);
      if (exists) {
        showToast('Ya existe un cliente con ese teléfono');
        return;
      }
      const newCustomer: Customer = {
        id: Date.now(),
        phone: search,
        name: 'Nuevo Cliente',
        opt_in_status: true,
        created_at: new Date().toISOString(),
        stamps_balance: 0,
        credit_balance: 0,
        tier: 'BRONZE'
      };
      saveData({ ...data, customers: [newCustomer, ...data.customers] });
      setSearch('');
    };

    const addOrUpdateCustomer = () => {
      const phone = customerForm.phone.trim();
      const name = customerForm.name.trim();
      const email = customerForm.email.trim();

      if (!/^[0-9]{7,}$/.test(phone)) {
        showToast('Ingresa un teléfono válido (solo números, mínimo 7 dígitos)');
        return;
      }
      if (!name) {
        showToast('Ingresa el nombre del cliente');
        return;
      }

      if (editingId !== null) {
        const existsWithPhone = data.customers.some(c => c.phone === phone && c.id !== editingId);
        if (existsWithPhone) {
          showToast('Ya existe otro cliente con ese teléfono');
          return;
        }
        const updated = data.customers.map(c =>
          c.id === editingId ? { ...c, phone, name, email } : c
        );
        saveData({ ...data, customers: updated });
      } else {
        if (data.customers.some(c => c.phone === phone)) {
          showToast('Ya existe un cliente con ese teléfono');
          return;
        }
        const newCustomer: Customer = {
          id: Date.now(),
          phone,
          name,
          email: email || '',
          opt_in_status: true,
          created_at: new Date().toISOString(),
          stamps_balance: 0,
          credit_balance: 0,
          tier: 'BRONZE'
        };
        saveData({ ...data, customers: [newCustomer, ...data.customers] });
      }
      setCustomerForm({ phone: '', name: '', email: '' });
      setEditingId(null);
    };

    const startEditCustomer = (customer: Customer) => {
      setEditingId(customer.id);
      setCustomerForm({ phone: customer.phone, name: customer.name, email: customer.email || '' });
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Clientes</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <label className="sr-only" htmlFor="customer-phone">Teléfono</label>
          <input
            type="text"
            placeholder="Teléfono..."
            value={customerForm.phone}
            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
            id="customer-phone"
            name="customer_phone"
            className="px-4 py-2 border rounded-lg"
          />
          <label className="sr-only" htmlFor="customer-name">Nombre</label>
          <input
            type="text"
            placeholder="Nombre..."
            value={customerForm.name}
            onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
            id="customer-name"
            name="customer_name"
            className="px-4 py-2 border rounded-lg"
          />
          <label className="sr-only" htmlFor="customer-email">Email</label>
          <input
            type="email"
            placeholder="Email (opcional)"
            value={customerForm.email}
            onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
            id="customer-email"
            name="customer_email"
            className="px-4 py-2 border rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={addOrUpdateCustomer}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingId ? 'Guardar cambios' : 'Añadir cliente'}
            </button>
            {editingId && (
              <button
                onClick={() => { setEditingId(null); setCustomerForm({ phone: '', name: '', email: '' }); }}
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-4 flex-wrap sm:flex-nowrap">
          <label className="sr-only" htmlFor="customer-search">Buscar cliente</label>
          <input
            type="text"
            placeholder="Buscar por teléfono o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="customer-search"
            name="customer_search"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 border rounded-lg"
            aria-label="Filtrar por tier"
            id="customer-tier-filter"
            name="customer-tier-filter"
          >
            <option value="ALL">Todos los tiers</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
            <option value="BRONZE">Bronze</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sellos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crédito</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(customer => {
                  const visits = data.orders.filter(o => o.customer_id === customer.phone && o.status === 'PAID').length;
                  const tier = getCustomerTier(customer.phone);
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onOpenCustomer(customer.phone)}
                          className="font-medium text-left text-blue-700 hover:underline"
                          aria-label={`Ver tarjeta de ${customer.name || customer.phone}`}
                        >
                          {customer.name || customer.phone}
                        </button>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                        {customer.email && <div className="text-xs text-gray-500">{customer.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                          tier === 'SILVER' ? 'bg-gray-200 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                          {tier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          ⭐ {customer.stamps_balance || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-medium">
                          ${(customer.credit_balance || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">{visits}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onOpenCustomer(customer.phone)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                        <button
                          onClick={() => startEditCustomer(customer)}
                          className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => setCurrentView('appointments')}
                          className="text-gray-600 hover:text-gray-800 flex items-center gap-1 mt-1"
                        >
                          <Calendar className="w-4 h-4" />
                          Citas
                        </button>
                        {userRole === 'OWNER' && (
                          <button
                            onClick={() => deleteCustomer(customer)}
                            className="text-red-600 hover:text-red-700 flex items-center gap-1 mt-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  const History = ({ onOpenCustomer }: { onOpenCustomer: (phone: string) => void }) => {
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = scopedOrders
      .filter(o => {
        if (filter === 'ALL') return true;
        return o.status === filter;
      })
      .filter(o => {
        if (!searchTerm) return true;
        return o.customer_id.includes(searchTerm) || o.mp_order_ref.includes(searchTerm);
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="p-2 sm:p-3 max-w-4xl w-full mx-auto space-y-3 mt-4 mb-10 bg-gray-50 rounded-lg border border-gray-200">
        <div className="bg-gray-900 text-white rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-lg font-bold">Historial de Órdenes</h2>
              <p className="text-xs text-gray-200/80">Busca y filtra órdenes recientes.</p>
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <label className="sr-only" htmlFor="history-search">Buscar órdenes</label>
              <input
                type="text"
                placeholder="Teléfono o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="history-search"
                name="history_search"
                className="w-full sm:flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm"
              />
              <label className="sr-only" htmlFor="history-filter">Filtrar estado</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                id="history-filter"
                name="history_filter"
                className="px-3 py-2 rounded-lg w-full sm:w-auto min-w-[140px] bg-white text-gray-900 text-sm"
                aria-label="Filtrar por estado"
              >
                <option value="ALL">Todos</option>
                <option value="PAID">Pagado</option>
                <option value="PENDING">Pendiente</option>
                <option value="FAILED">Fallido</option>
                <option value="REFUNDED">Reembolsado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-2 md:hidden">
          {filtered.slice(0, 20).map(order => {
            const barber = scopedBarbers.find(b => b.id === order.barber_id);
            return (
              <div key={order.id} className="bg-white rounded-lg shadow border border-gray-100 p-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{new Date(order.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</span>
                  <span className="font-semibold text-gray-900">${order.total_paid.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => onOpenCustomer(order.customer_id)}
                  className="text-sm font-medium text-left text-blue-700 hover:underline"
                  aria-label={`Ver ficha de ${order.customer_name || order.customer_id}`}
                >
                  {order.customer_name || order.customer_id}
                </button>
                <div className="text-xs text-gray-500">{barber?.name || 'Sin barbero asignado'}</div>
                <div className="text-xs text-gray-600">
                  {order.services.map(s => data.services.find(sv => sv.code === s)?.display_name).join(', ')}
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                  order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                  }`}>
                  {order.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Fecha</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Cliente</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Barbero</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Servicios</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 50).map(order => {
                  const barber = scopedBarbers.find(b => b.id === order.barber_id);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString('es-CO', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-3 min-w-[160px]">
                        <button
                          onClick={() => onOpenCustomer(order.customer_id)}
                          className="font-medium text-left text-blue-700 hover:underline"
                          aria-label={`Ver ficha de ${order.customer_name || order.customer_id}`}
                        >
                          {order.customer_name || order.customer_id}
                        </button>
                        <div className="text-xs text-gray-500">{order.customer_id}</div>
                      </td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{barber?.name}</td>
                      <td className="px-3 py-3 text-sm">
                        {order.services.map(s => data.services.find(sv => sv.code === s)?.display_name).join(', ')}
                      </td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">${order.total_paid.toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const RewardsManager = (): JSX.Element => {
    const emptyReward: Reward = {
      id: 0,
      type: 'CREDIT',
      name: '',
      value_cop: 0,
      service_code: '',
      stamp_cost: 1,
      tier_restriction: null,
      active: true
    };
    const [editing, setEditing] = useState<number | null>(null);
    const [formData, setFormData] = useState<Reward>(emptyReward);
    const [newReward, setNewReward] = useState<Reward>({ ...emptyReward });

    const normalizeReward = (r: Reward): Reward => ({
      id: r.id,
      type: r.type || 'CREDIT',
      name: r.name || '',
      value_cop: r.type === 'CREDIT' ? (Number(r.value_cop) || 0) : 0,
      service_code: r.type === 'SERVICE' ? (r.service_code || '') : '',
      stamp_cost: Math.max(1, Number(r.stamp_cost) || 1),
      tier_restriction: r.tier_restriction || null,
      active: r.active !== false
    });

    const startEdit = (reward: Reward) => {
      setEditing(reward.id);
      setFormData(normalizeReward(reward));
    };

    const saveReward = () => {
      if (editing === null) {
        showToast('Selecciona una recompensa para editar');
        return;
      }
      const cleanStamp = Math.max(1, Math.floor(Number(formData.stamp_cost) || 0));
      const cleanValue = Math.floor(Number(formData.value_cop) || 0);
      if (!formData.name || cleanStamp <= 0) {
        showToast('Nombre y costo en sellos son obligatorios');
        return;
      }
      if (formData.type === 'CREDIT' && (!cleanValue || cleanValue <= 0)) {
        showToast('Ingresa un valor de crédito válido');
        return;
      }
      if (formData.type === 'SERVICE' && !formData.service_code) {
        showToast('Selecciona un servicio');
        return;
      }
      const updatedRewards = data.rewards.map(r =>
        r.id === editing
          ? {
            ...formData,
            stamp_cost: cleanStamp,
            value_cop: formData.type === 'CREDIT' ? cleanValue : 0,
            service_code: formData.type === 'SERVICE' ? formData.service_code : ''
          }
          : r
      );
      const ok = saveRewardsDirect(updatedRewards);
      if (ok) {
        setEditing(null);
        setFormData(emptyReward);
        addNotification({
          type: 'reward_updated',
          title: 'Recompensa actualizada',
          message: `${formData.name} ha sido actualizada`
        });
      } else {
        showToast('Error al guardar la recompensa. Intenta de nuevo.');
      }
    };

    const addReward = () => {
      const cleanStamp = Math.max(1, Math.floor(Number(newReward.stamp_cost) || 0));
      const cleanValue = Math.floor(Number(newReward.value_cop) || 0);
      if (!newReward.name || newReward.stamp_cost <= 0) {
        showToast('Nombre y costo en sellos son obligatorios');
        return;
      }
      if (newReward.type === 'CREDIT' && (!cleanValue || cleanValue <= 0)) {
        showToast('Ingresa un valor de crédito válido');
        return;
      }
      if (newReward.type === 'SERVICE' && !newReward.service_code) {
        showToast('Selecciona un servicio');
        return;
      }
      const rewardToAdd = {
        ...newReward,
        id: Date.now(),
        stamp_cost: cleanStamp,
        value_cop: newReward.type === 'CREDIT' ? cleanValue : 0,
        service_code: newReward.type === 'SERVICE' ? newReward.service_code : ''
      };
      const ok = saveRewardsDirect([rewardToAdd, ...data.rewards]);
      if (ok) {
        setNewReward({ ...emptyReward });
        setEditing(null);
        addNotification({
          type: 'reward_added',
          title: 'Recompensa creada',
          message: `${rewardToAdd.name} fue agregada`
        });
      } else {
        showToast('Error al crear la recompensa. Intenta de nuevo.');
      }
    };

    const deleteReward = (id: number) => {
      if (!confirm('¿Eliminar esta recompensa?')) return;
      const ok = saveRewardsDirect(data.rewards.filter(r => r.id !== id));
      if (ok) {
        addNotification({
          type: 'reward_deleted',
          title: 'Recompensa eliminada',
          message: 'Recompensa eliminada correctamente'
        });
      } else {
        showToast('Error al eliminar la recompensa. Intenta de nuevo.');
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Administrar Recompensas</h2>
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3">Agregar nueva recompensa</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="new-reward-name">Nombre</label>
              <input
                id="new-reward-name"
                name="new_reward_name"
                value={newReward.name}
                onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Ej: Crédito $20.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="new-reward-type">Tipo</label>
              <select
                id="new-reward-type"
                name="new_reward_type"
                value={newReward.type}
                onChange={(e) => setNewReward({ ...newReward, type: e.target.value as 'CREDIT' | 'SERVICE', service_code: '', value_cop: 0 })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="CREDIT">CREDIT</option>
                <option value="SERVICE">SERVICE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="new-reward-stamps">Costo (sellos)</label>
              <input
                id="new-reward-stamps"
                name="new_reward_stamps"
                type="number"
                min={1}
                value={newReward.stamp_cost}
                onChange={(e) => setNewReward({ ...newReward, stamp_cost: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            {newReward.type === 'CREDIT' ? (
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="new-reward-value">Valor (COP)</label>
                <input
                  id="new-reward-value"
                  name="new_reward_value"
                  type="number"
                  min={0}
                  value={newReward.value_cop}
                  onChange={(e) => setNewReward({ ...newReward, value_cop: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="new-reward-service">Servicio</label>
                <select
                  id="new-reward-service"
                  name="new_reward_service"
                  value={newReward.service_code}
                  onChange={(e) => setNewReward({ ...newReward, service_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Selecciona servicio</option>
                  {data.services.map(s => (
                    <option key={s.code} value={s.code}>{s.display_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="new-reward-tier">Tier</label>
              <select
                id="new-reward-tier"
                name="new_reward_tier"
                value={newReward.tier_restriction || ''}
                onChange={(e) => setNewReward({ ...newReward, tier_restriction: e.target.value || null })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Todos</option>
                <option value="SILVER">Silver+</option>
                <option value="GOLD">Gold</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button className="btn btn-primary" onClick={addReward}>Agregar</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recompensa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo (sellos)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rewards.map(reward => (
                  <tr key={reward.id} className="hover:bg-gray-50">
                    {editing === reward.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            aria-label="Nombre de recompensa"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-2 py-1 border rounded"
                            id={`reward-name-${reward.id}`}
                            name="reward_name"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({
                              ...formData,
                              type: e.target.value as 'CREDIT' | 'SERVICE',
                              value_cop: e.target.value === 'CREDIT' ? (formData.value_cop || 0) : 0,
                              service_code: e.target.value === 'SERVICE' ? formData.service_code : ''
                            })}
                            className="px-2 py-1 border rounded text-sm"
                            aria-label="Tipo de recompensa"
                          >
                            <option value="CREDIT">CREDIT</option>
                            <option value="SERVICE">SERVICE</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {formData.type === 'CREDIT' ? (
                            <input
                              aria-label="Valor de crédito"
                              type="number"
                              value={formData.value_cop}
                              onChange={(e) => setFormData({ ...formData, value_cop: Number(e.target.value) })}
                              onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              inputMode="numeric"
                              className="w-24 px-2 py-1 border rounded"
                              id={`reward-value-${reward.id}`}
                              name="reward_value"
                            />
                          ) : (
                            <select
                              aria-label="Servicio asociado"
                              value={formData.service_code || ''}
                              onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                              className="px-2 py-1 border rounded text-sm"
                              id={`reward-service-${reward.id}`}
                              name="reward_service"
                            >
                              <option value="">Selecciona servicio</option>
                              {data.services.map(s => (
                                <option key={s.code} value={s.code}>{s.display_name}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            aria-label="Costo en sellos"
                            type="number"
                            min={1}
                            value={formData.stamp_cost}
                            onChange={(e) => setFormData({ ...formData, stamp_cost: Number(e.target.value) })}
                            className="w-20 px-2 py-1 border rounded"
                            id={`reward-stamps-${reward.id}`}
                            name="reward_stamp_cost"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={formData.tier_restriction || ''}
                            onChange={(e) => setFormData({ ...formData, tier_restriction: e.target.value || null })}
                            className="px-2 py-1 border rounded text-sm"
                            aria-label="Restricción de tier"
                            id={`reward-tier-${reward.id}`}
                            name="reward_tier"
                          >
                            <option value="">Todos</option>
                            <option value="SILVER">Silver+</option>
                            <option value="GOLD">Gold</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={formData.active ? 'true' : 'false'}
                            onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                            className="px-2 py-1 border rounded text-sm"
                            id={`reward-active-${reward.id}`}
                            name="reward_active"
                            aria-label="Estado de recompensa"
                          >
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={saveReward} className="text-green-600 hover:text-green-700" aria-label="Guardar recompensa">
                              <Save className="w-5 h-5" />
                            </button>
                            <button onClick={() => setEditing(null)} className="text-gray-600 hover:text-gray-700" aria-label="Cancelar edición">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium">{reward.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${reward.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {reward.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {reward.type === 'CREDIT' ? `${reward.value_cop.toLocaleString()}` : reward.service_code}
                        </td>
                        <td className="px-6 py-4">⭐ {reward.stamp_cost}</td>
                        <td className="px-6 py-4 text-sm">{reward.tier_restriction || 'Todos'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${reward.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {reward.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3 items-center">
                            <button onClick={() => startEdit(reward)} className="text-blue-600 hover:text-blue-700" aria-label="Editar recompensa">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteReward(reward.id)} className="text-red-600 hover:text-red-700" aria-label="Eliminar recompensa">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    const [settings, setSettings] = useState(data.settings);
    const [templates, setTemplates] = useState(data.messageTemplates);
    const defaultPermissions = data.settings.permissions || {
      dashboard: { owner: true, barber: true, reception: true },
      walkin: { owner: true, barber: true, reception: true },
      appointments: { owner: true, barber: true, reception: true },
      customers: { owner: true, barber: false, reception: true },
      history: { owner: true, barber: false, reception: true },
      rewards: { owner: true, barber: false, reception: false },
      settings: { owner: true, barber: false, reception: false },
      exports: { owner: true, barber: false, reception: false }
    };
    const [permissions, setPermissions] = useState(defaultPermissions);
    const [barbersState, setBarbersState] = useState(data.barbers);
    const [receptionists, setReceptionists] = useState(data.receptionists || []);
    const [barberForm, setBarberForm] = useState({ id: 0, name: '', phone: '', chair_id: 1, specialty: '', active: true });
    const [receptionForm, setReceptionForm] = useState({ id: 0, name: '', phone: '', active: true });
    const [editingBarberId, setEditingBarberId] = useState<number | null>(null);
    const [editingReceptionId, setEditingReceptionId] = useState<number | null>(null);

    const togglePermission = (moduleKey: string, role: 'owner' | 'barber' | 'reception') => {
      setPermissions(prev => ({
        ...prev,
        [moduleKey]: { ...prev[moduleKey], [role]: !prev[moduleKey][role] }
      }));
    };

    const saveSettings = () => {
      saveData({
        ...data,
        barbers: barbersState,
        receptionists,
        settings: { ...settings, permissions },
        messageTemplates: templates
      });
      showToast('✓ Configuración guardada');
    };

    const clearLocalData = () => {
      localStorage.removeItem('barber-shop-data');
      setData(initMockData());
      showToast('Datos locales borrados. Recarga la app.');
      window.location.reload();
    };
    useEffect(() => {
      document.title = settings.shop_name || 'Barbershop';
    }, [settings.shop_name]);
    const [logoPreview, setLogoPreview] = useState(settings.public_walkin_url || '/barbershop_logo.png');
    const [faviconPreview, setFaviconPreview] = useState('/barbershop_icon.ico');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const url = evt.target?.result as string;
        setLogoPreview(url);
        setSettings({ ...settings, public_walkin_url: url });
      };
      reader.readAsDataURL(file);
    };

    const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const url = evt.target?.result as string;
        setFaviconPreview(url);
      };
      reader.readAsDataURL(file);
    };


    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Configuración</h2>

        <div className="space-y-6">
          <div className="panel">
            <h3 className="text-lg font-bold mb-4">Información del Negocio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="settings-name">Nombre</label>
                <input
                  id="settings-name"
                  name="settings_name"
                  value={settings.shop_name}
                  onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  aria-label="Nombre del negocio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="settings-phone">Teléfono</label>
                <input
                  id="settings-phone"
                  name="settings_phone"
                  value={settings.shop_phone}
                  onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  aria-label="Teléfono del negocio"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1" htmlFor="settings-address">Dirección</label>
                <input
                  id="settings-address"
                  name="settings_address"
                  value={settings.shop_address}
                  onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  aria-label="Dirección del negocio"
                />
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-bold mb-4">Integraciones</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Instagram</label>
                  <input
                    id="social-instagram"
                    name="social_instagram"
                    value={settings.social_links?.instagram || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        social_links: { ...(prev.social_links || {}), instagram: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://instagram.com/tu-barberia"
                    aria-label="URL de Instagram"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Facebook</label>
                  <input
                    id="social-facebook"
                    name="social_facebook"
                    value={settings.social_links?.facebook || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        social_links: { ...(prev.social_links || {}), facebook: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://facebook.com/tu-barberia"
                    aria-label="URL de Facebook"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium">TikTok</label>
                  <input
                    id="social-tiktok"
                    name="social_tiktok"
                    value={settings.social_links?.tiktok || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        social_links: { ...(prev.social_links || {}), tiktok: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 border rounded"
                    placeholder="https://tiktok.com/@tu-barberia"
                    aria-label="URL de TikTok"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Logo de la app</label>
                  <div className="flex items-center gap-3">
                    <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded border object-cover" />
                    <input type="file" accept="image/*" onChange={handleLogoUpload} aria-label="Subir logo" />
                  </div>
                  <p className="text-xs text-gray-500">Se usará en menús, QR y metadatos.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Favicon</label>
                  <div className="flex items-center gap-3">
                    <img src={faviconPreview} alt="Favicon preview" className="w-10 h-10 rounded border object-cover" />
                    <input type="file" accept="image/x-icon,image/png" onChange={handleFaviconUpload} aria-label="Subir favicon" />
                  </div>
                  <p className="text-xs text-gray-500">Se usará para la pestaña del navegador.</p>
                </div>
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.google_calendar_enabled}
                  onChange={(e) => setSettings({ ...settings, google_calendar_enabled: e.target.checked })}
                  className="w-5 h-5"
                  id="settings-google-calendar"
                  name="settings_google_calendar"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>Google Calendar</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${settings.google_calendar_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {settings.google_calendar_enabled ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Sincronizar citas automáticamente</div>
                </div>
              </label>
              {settings.google_calendar_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="gc-client-id">Client ID</label>
                    <input
                      id="gc-client-id"
                      name="google_calendar_client_id"
                      value={settings.google_calendar_client_id}
                      onChange={(e) => setSettings({ ...settings, google_calendar_client_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="xxxx.apps.googleusercontent.com"
                      aria-label="Google Calendar Client ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="gc-client-secret">Client Secret</label>
                    <input
                      id="gc-client-secret"
                      name="google_calendar_client_secret"
                      value={settings.google_calendar_client_secret}
                      onChange={(e) => setSettings({ ...settings, google_calendar_client_secret: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="••••••"
                      aria-label="Google Calendar Client Secret"
                    />
                  </div>
                  <p className="text-xs text-gray-500 md:col-span-2">Usa las credenciales de tu proyecto de Google Cloud. Si necesitas ayuda con OAuth, puedo guiarte.</p>
                </div>
              )}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.whatsapp_enabled}
                  onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })}
                  className="w-5 h-5"
                  id="settings-whatsapp"
                  name="settings_whatsapp"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>WhatsApp Business</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${settings.whatsapp_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {settings.whatsapp_enabled ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Notificaciones via WhatsApp</div>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.sms_enabled}
                  onChange={(e) => setSettings({ ...settings, sms_enabled: e.target.checked })}
                  className="w-5 h-5"
                  id="settings-sms"
                  name="settings_sms"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    <span>SMS Fallback</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${settings.sms_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {settings.sms_enabled ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Enviar SMS si WhatsApp falla</div>
                </div>
              </label>
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <span>Mercado Pago</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${(settings.mercadopago_public_key && settings.mercadopago_access_token && settings.mercadopago_webhook_url) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {(settings.mercadopago_public_key && settings.mercadopago_access_token && settings.mercadopago_webhook_url) ? 'Conectado' : 'Desconectado'}
                      </span>
                      {settings.mercadopago_test_mode && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Sandbox
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Pagos en línea y QR desde la app</div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.mercadopago_test_mode}
                      onChange={(e) => setSettings({ ...settings, mercadopago_test_mode: e.target.checked })}
                      className="w-4 h-4"
                      id="mp-test-mode"
                      name="mp_test_mode"
                    />
                    Modo sandbox
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="mp-public-key">Public Key</label>
                    <input
                      id="mp-public-key"
                      name="mp_public_key"
                      value={settings.mercadopago_public_key}
                      onChange={(e) => setSettings({ ...settings, mercadopago_public_key: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="APP_USR-xxxx"
                      aria-label="Mercado Pago Public Key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="mp-access-token">Access Token</label>
                    <input
                      id="mp-access-token"
                      name="mp_access_token"
                      value={settings.mercadopago_access_token}
                      onChange={(e) => setSettings({ ...settings, mercadopago_access_token: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="APP_USR-xxxx"
                      aria-label="Mercado Pago Access Token"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" htmlFor="mp-webhook">Webhook URL</label>
                    <input
                      id="mp-webhook"
                      name="mp_webhook_url"
                      value={settings.mercadopago_webhook_url}
                      onChange={(e) => setSettings({ ...settings, mercadopago_webhook_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="https://tu-dominio.com/api/mp-webhook"
                      aria-label="Mercado Pago Webhook URL"
                    />
                  </div>
                  <p className="text-xs text-gray-500 md:col-span-2">Guarda las llaves de producción y sandbox según necesites. El webhook permitirá actualizar órdenes y propinas automáticamente.</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
                  <span className="text-sm font-semibold">Link público Walk-in</span>
                  <input
                    className="w-48 sm:w-64 px-2 py-1 border rounded text-xs"
                    value={settings.public_walkin_url || `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname + '?view=walkin_public' : ''}`}
                    onChange={(e) => setSettings({ ...settings, public_walkin_url: e.target.value })}
                    aria-label="URL pública walk-in"
                  />
                  <button
                    className="btn btn-primary px-3 py-1 text-xs"
                    onClick={() => navigator.clipboard.writeText(settings.public_walkin_url || `${window.location.origin}${window.location.pathname}?view=walkin_public`)}
                  >
                    Copiar
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
                  <span className="text-sm font-semibold">Consentimiento comunicaciones</span>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.privacy_consent}
                      onChange={(e) => setSettings({ ...settings, privacy_consent: e.target.checked })}
                      className="w-4 h-4"
                      aria-label="Consentimiento de datos"
                    />
                    {settings.privacy_consent ? 'Permitido' : 'Bloqueado'}
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
                  <div className="md:col-span-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <span>GREEN API (WhatsApp)</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${(settings.green_api_instance_id && settings.green_api_token) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {(settings.green_api_instance_id && settings.green_api_token) ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">Instancia + Token</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="green-instance">ID_INSTANCE</label>
                    <input
                      id="green-instance"
                      name="green_api_instance_id"
                      value={settings.green_api_instance_id}
                      onChange={(e) => setSettings({ ...settings, green_api_instance_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="1101123456"
                      aria-label="GREEN API ID_INSTANCE"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="green-token">API_TOKEN_INSTANCE</label>
                    <input
                      id="green-token"
                      name="green_api_token"
                      value={settings.green_api_token}
                      onChange={(e) => setSettings({ ...settings, green_api_token: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="d75b72a4d3..."
                      aria-label="GREEN API token"
                    />
                  </div>
                  <p className="text-xs text-gray-500 md:col-span-2">Copia los valores desde tu consola de GREEN API. Úsalos también en el archivo code.gs si necesitas mensajería desde Apps Script.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
                  <div className="md:col-span-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                      <span>Sincronización con Google Sheets</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${settings.sheets_sync_enabled && settings.sheets_web_app_url ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                        {settings.sheets_sync_enabled && settings.sheets_web_app_url ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.sheets_sync_enabled}
                        onChange={(e) => setSettings({ ...settings, sheets_sync_enabled: e.target.checked })}
                        className="w-4 h-4"
                        id="sheets-sync"
                        name="sheets_sync_enabled"
                      />
                      Habilitar
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" htmlFor="sheets-webapp">Webhook / Web App URL</label>
                    <input
                      id="sheets-webapp"
                      name="sheets_web_app_url"
                      value={settings.sheets_web_app_url}
                      onChange={(e) => setSettings({ ...settings, sheets_web_app_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      aria-label="URL del Web App de Apps Script/Sheets"
                    />
                    <p className="text-xs text-gray-500 mt-1">Usa la URL desplegada de code.gs como Web App (acceso: Anyone). GREEN API puede apuntar aquí para registrar mensajes entrantes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-bold mb-4">Recordatorios Automáticos</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="settings-fresh-clean">Retoque (días)</label>
                  <input
                    id="settings-fresh-clean"
                    type="number"
                    value={settings.fresh_cut_days_clean}
                    onChange={(e) => setSettings({ ...settings, fresh_cut_days_clean: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded"
                    aria-label="Días para recordatorio de retoque"
                    name="settings_fresh_cut_days_clean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="settings-fresh-full">Corte completo (días)</label>
                  <input
                    id="settings-fresh-full"
                    type="number"
                    value={settings.fresh_cut_days_full}
                    onChange={(e) => setSettings({ ...settings, fresh_cut_days_full: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded"
                    aria-label="Días para recordatorio de corte completo"
                    name="settings_fresh_cut_days_full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="settings-winback">Win-back (días)</label>
                  <input
                    id="settings-winback"
                    type="number"
                    value={settings.winback_days}
                    onChange={(e) => setSettings({ ...settings, winback_days: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded"
                    aria-label="Días para win-back"
                    name="settings_winback_days"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-bold mb-4">Plantillas de Mensajes</h3>
            <div className="space-y-4">
              {Object.entries(templates).map(([key, value]) => {
                const templateId = `template-${key}`;
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1 capitalize" htmlFor={templateId}>{key.replace(/_/g, ' ')}</label>
                    <textarea
                      id={templateId}
                      value={String(value ?? '')}
                      onChange={(e) => setTemplates({ ...templates, [key]: e.target.value })}
                      className="w-full px-4 py-2 border rounded text-sm font-mono"
                      rows={4}
                      aria-label={`Plantilla ${key.replace(/_/g, ' ')}`}
                      name={templateId}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {userRole === 'OWNER' && (
            <div className="panel space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Gestión de Equipo</h3>
                <p className="text-xs text-gray-500">Solo Owner puede crear/editar/eliminar barberos y recepción.</p>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn btn-primary text-sm" onClick={saveSettings}>Guardar Configuración</button>
                <button className="btn text-sm" onClick={clearLocalData}>Borrar datos locales</button>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Barberos</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input id="barber-name" name="barber_name" value={barberForm.name} onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })} placeholder="Nombre" className="px-3 py-2 border rounded" />
                  <input id="barber-phone" name="barber_phone" value={barberForm.phone} onChange={(e) => setBarberForm({ ...barberForm, phone: e.target.value })} placeholder="Teléfono" className="px-3 py-2 border rounded" />
                  <input id="barber-chair" name="barber_chair" type="number" value={barberForm.chair_id} onChange={(e) => setBarberForm({ ...barberForm, chair_id: Number(e.target.value) })} placeholder="Silla" className="px-3 py-2 border rounded" />
                  <input id="barber-specialty" name="barber_specialty" value={barberForm.specialty} onChange={(e) => setBarberForm({ ...barberForm, specialty: e.target.value })} placeholder="Especialidad" className="px-3 py-2 border rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={barberForm.active} onChange={(e) => setBarberForm({ ...barberForm, active: e.target.checked })} className="w-4 h-4" />
                    Activo
                  </label>
                  <button
                    onClick={() => {
                      if (!barberForm.name || !barberForm.phone) { showToast('Nombre y teléfono son requeridos'); return; }
                      if (editingBarberId) {
                        setBarbersState(barbersState.map(b => b.id === editingBarberId ? { ...barberForm, id: editingBarberId } : b));
                        setEditingBarberId(null);
                      } else {
                        setBarbersState([...barbersState, { ...barberForm, id: Date.now() }]);
                      }
                      setBarberForm({ id: 0, name: '', phone: '', chair_id: 1, specialty: '', active: true });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    {editingBarberId ? 'Guardar barbero' : 'Añadir barbero'}
                  </button>
                </div>

                <div className="border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Teléfono</th>
                        <th className="px-3 py-2 text-left">Silla</th>
                        <th className="px-3 py-2 text-left">Activo</th>
                        <th className="px-3 py-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {barbersState.map(b => (
                        <tr key={b.id}>
                          <td className="px-3 py-2">{b.name}</td>
                          <td className="px-3 py-2">{b.phone}</td>
                          <td className="px-3 py-2">{b.chair_id}</td>
                          <td className="px-3 py-2">{b.active ? 'Sí' : 'No'}</td>
                          <td className="px-3 py-2 space-x-2">
                            <button onClick={() => { setEditingBarberId(b.id); setBarberForm(b); }} className="text-blue-600 text-xs">Editar</button>
                            <button onClick={() => setBarbersState(barbersState.filter(x => x.id !== b.id))} className="text-red-600 text-xs">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Recepción</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input id="reception-name" name="reception_name" value={receptionForm.name} onChange={(e) => setReceptionForm({ ...receptionForm, name: e.target.value })} placeholder="Nombre" className="px-3 py-2 border rounded" />
                  <input id="reception-phone" name="reception_phone" value={receptionForm.phone} onChange={(e) => setReceptionForm({ ...receptionForm, phone: e.target.value })} placeholder="Teléfono" className="px-3 py-2 border rounded" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={receptionForm.active} onChange={(e) => setReceptionForm({ ...receptionForm, active: e.target.checked })} className="w-4 h-4" />
                    Activo
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!receptionForm.name || !receptionForm.phone) { showToast('Nombre y teléfono son requeridos'); return; }
                      if (editingReceptionId) {
                        setReceptionists(receptionists.map(r => r.id === editingReceptionId ? { ...receptionForm, id: editingReceptionId } : r));
                        setEditingReceptionId(null);
                      } else {
                        setReceptionists([...receptionists, { ...receptionForm, id: Date.now() }]);
                      }
                      setReceptionForm({ id: 0, name: '', phone: '', active: true });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    {editingReceptionId ? 'Guardar usuario' : 'Añadir usuario'}
                  </button>
                </div>
                <div className="border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Teléfono</th>
                        <th className="px-3 py-2 text-left">Activo</th>
                        <th className="px-3 py-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {receptionists.map(r => (
                        <tr key={r.id}>
                          <td className="px-3 py-2">{r.name}</td>
                          <td className="px-3 py-2">{r.phone}</td>
                          <td className="px-3 py-2">{r.active ? 'Sí' : 'No'}</td>
                          <td className="px-3 py-2 space-x-2">
                            <button onClick={() => { setEditingReceptionId(r.id); setReceptionForm(r); }} className="text-blue-600 text-xs">Editar</button>
                            <button onClick={() => setReceptionists(receptionists.filter(x => x.id !== r.id))} className="text-red-600 text-xs">Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {userRole === 'OWNER' && (
            <div className="panel">
              <h3 className="text-lg font-bold mb-4">Matriz de Permisos</h3>
              <p className="text-sm text-gray-600 mb-3">
                Referencia rápida de qué roles pueden ver y administrar cada módulo. Edita las casillas para otorgar o quitar acceso.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Módulo</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Barbero</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Recepción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { key: 'dashboard', label: 'Dashboard' },
                      { key: 'walkin', label: 'Walk-in / Caja' },
                      { key: 'appointments', label: 'Citas' },
                      { key: 'customers', label: 'Clientes' },
                      { key: 'history', label: 'Historial' },
                      { key: 'rewards', label: 'Recompensas' },
                      { key: 'settings', label: 'Configuración' },
                      { key: 'exports', label: 'Exportar / Reportes' },
                    ].map(row => (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-800">{row.label}</td>
                        {(['owner', 'barber', 'reception'] as const).map(role => (
                          <td key={role} className="px-4 py-2">
                            <input
                              type="checkbox"
                              id={`perm-${row.key}-${role}`}
                              name={`perm-${row.key}-${role}`}
                              checked={!!permissions[row.key]?.[role]}
                              onChange={() => togglePermission(row.key, role)}
                              className="w-5 h-5"
                              aria-label={`${row.label} para ${role}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button onClick={saveSettings} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
            Guardar Configuración
          </button>
        </div>
      </div>
    );
  };

  const Exports = () => {
    const downloadCSV = (filename, data) => {
      const csv = data.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    };

    const exportOrders = () => {
      const headers = ['order_id', 'mp_payment_id', 'created_at', 'paid_at', 'status', 'customer_phone', 'customer_name', 'barber_id', 'chair_id', 'subtotal', 'discount', 'credit_applied', 'total_paid', 'services'];
      const rows = data.orders.map(o => [
        o.id, o.mp_order_ref, o.created_at, o.paid_at || '', o.status, o.customer_id, o.customer_name || '', o.barber_id, o.chair_id, o.subtotal, o.discount, o.credit_applied, o.total_paid, o.services.join('|')
      ]);
      downloadCSV('orders.csv', [headers, ...rows]);
      addNotification({ type: 'export', title: 'Exportación completada', message: 'orders.csv descargado' });
    };

    const exportCustomers = () => {
      const headers = ['customer_id', 'phone', 'name', 'tier', 'stamps_balance', 'credit_balance', 'first_visit', 'last_visit', 'total_visits', 'opt_in_status'];
      const rows = data.customers.map(c => {
        const visits = data.orders.filter(o => o.customer_id === c.phone && o.status === 'PAID').length;
        const tier = getCustomerTier(c.phone);
        return [
          c.id, c.phone, c.name, tier, c.stamps_balance || 0, c.credit_balance || 0, c.created_at, c.last_visit || '', visits, c.opt_in_status
        ];
      });
      downloadCSV('customers.csv', [headers, ...rows]);
      addNotification({ type: 'export', title: 'Exportación completada', message: 'customers.csv descargado' });
    };

    const exportLoyaltyLedger = () => {
      const headers = ['ledger_id', 'timestamp', 'customer_id', 'payment_id', 'order_id', 'delta_stamps', 'delta_credit_cop', 'reason', 'reward_id'];
      const rows = data.loyaltyLedger.map(l => [
        l.id, l.created_at, l.customer_id, l.payment_id || '', l.order_id || '', l.delta_stamps, l.delta_credit_cop, l.reason, l.reward_id || ''
      ]);
      downloadCSV('loyalty_ledger.csv', [headers, ...rows]);
      addNotification({ type: 'export', title: 'Exportación completada', message: 'loyalty_ledger.csv descargado' });
    };

    const exportTips = () => {
      const headers = ['tip_id', 'mp_tip_payment_id', 'original_order_id', 'barber_id', 'chair_id', 'customer_phone', 'tip_amount', 'paid_at', 'status'];
      const rows = data.tips.map(t => [
        t.id, t.mp_tip_payment_id || '', t.order_id, t.barber_id, t.chair_id, t.customer_phone, t.amount, t.paid_at, t.status
      ]);
      downloadCSV('tips.csv', [headers, ...rows]);
      addNotification({ type: 'export', title: 'Exportación completada', message: 'tips.csv descargado' });
    };

    const exportAppointments = () => {
      const headers = ['appointment_id', 'customer_phone', 'customer_name', 'barber_id', 'chair_id', 'scheduled_at', 'status', 'payment_status', 'source', 'notes'];
      const rows = data.appointments.map(a => [
        a.id, a.customer_phone, a.customer_name || '', a.barber_id, a.chair_id, a.scheduled_at, a.status, a.payment_status, a.source, a.notes || ''
      ]);
      downloadCSV('appointments.csv', [headers, ...rows]);
      addNotification({ type: 'export', title: 'Exportación completada', message: 'appointments.csv descargado' });
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Exportar Datos (CSV)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ExportCard
            title="Ordenes/Pagos"
            description={`${data.orders.length} registros`}
            icon={<DollarSign />}
            onClick={exportOrders}
          />
          <ExportCard
            title="Clientes"
            description={`${scopedCustomers.length} registros`}
            icon={<Users />}
            onClick={exportCustomers}
          />
          <ExportCard
            title="Loyalty Ledger"
            description={`${scopedLedger.length} registros`}
            icon={<HistoryIcon />}
            onClick={exportLoyaltyLedger}
          />
          <ExportCard
            title="Propinas"
            description={`${scopedTips.length} registros`}
            icon={<Gift />}
            onClick={exportTips}
          />
          <ExportCard
            title="Citas"
            description={`${scopedAppointments.length} registros`}
            icon={<Calendar />}
            onClick={exportAppointments}
          />
        </div>
      </div>
    );
  };

  const ExportCard = ({ title, description, icon, onClick }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="text-blue-600 mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <button onClick={onClick} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors">
        <Download className="w-5 h-5" />
        Descargar CSV
      </button>
    </div>
  );

  const Reports = () => {
    const [reportStart, setReportStart] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    });
    const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);
    const startDate = new Date(reportStart);
    const endDate = new Date(reportEnd);
    endDate.setHours(23, 59, 59, 999);

    const inRange = (iso?: string) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d >= startDate && d <= endDate;
    };

    const ordersInRange = scopedOrders.filter(o => inRange(o.created_at));
    const paidOrders = ordersInRange.filter(o => o.status === 'PAID');
    const pendingOrders = ordersInRange.filter(o => o.status !== 'PAID');

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_paid, 0);
    const pendingValue = pendingOrders.reduce((sum, o) => sum + (o.total_due || 0), 0);
    const totalTips = scopedTips.filter(t =>
      t.status === 'PAID' && inRange(t.paid_at)
    ).reduce((sum, t) => sum + t.amount, 0);

    const serviceBreakdown: { [key: string]: { count: number; revenue: number } } = {};
    paidOrders.forEach((order: Order) => {
      order.services.forEach((service: string) => {
        if (!serviceBreakdown[service]) {
          serviceBreakdown[service] = { count: 0, revenue: 0 };
        }
        const svc = data.services.find((s: Service) => s.code === service);
        serviceBreakdown[service].count += 1;
        serviceBreakdown[service].revenue += svc?.price_cop || order.total_paid || 0;
      });
    });

    const barberStats = scopedBarbers.map(barber => {
      const barberOrders = ordersInRange.filter(o => o.barber_id === barber.id);
      const revenue = barberOrders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.total_paid, 0);
      const pending = barberOrders.filter(o => o.status !== 'PAID').reduce((sum, o) => sum + (o.total_due || 0), 0);
      const tips = scopedTips.filter(t =>
        t.barber_id === barber.id && t.status === 'PAID' && inRange(t.paid_at)
      ).reduce((sum, t) => sum + t.amount, 0);
      return { barber, orders: barberOrders.length, revenue, pending, tips };
    });

    const repeatCustomers = scopedCustomers.filter(c => {
      const customerOrders = paidOrders.filter(o => o.customer_id === c.phone);
      return customerOrders.length > 1;
    }).length;

    const repeatRate = scopedCustomers.length > 0 ? (repeatCustomers / scopedCustomers.length * 100).toFixed(1) : 0;

    return (
      <div className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-2xl font-bold">Reportes</h2>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs text-gray-600" htmlFor="report-start">Desde</label>
              <input id="report-start" name="report_start" type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} className="px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-xs text-gray-600" htmlFor="report-end">Hasta</label>
              <input id="report-end" name="report_end" type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} className="px-3 py-2 border rounded" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<DollarSign />} label="Ingresos cobrados" value={`$${totalRevenue.toLocaleString()}`} subvalue={`Pendiente: $${pendingValue.toLocaleString()}`} color="green" />
          <StatCard icon={<Gift />} label="Propinas Totales" value={`$${totalTips.toLocaleString()}`} color="purple" />
          <StatCard icon={<Scissors />} label="Servicios (todas)" value={ordersInRange.length} subvalue={`Pagadas: ${paidOrders.length}`} color="blue" />
          <StatCard icon={<Users />} label="Clientes Repetidos" value={`${repeatRate}%`} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Servicios Más Vendidos</h3>
            <div className="space-y-3">
              {Object.entries(serviceBreakdown)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([code, stats]) => {
                  const service = data.services.find(s => s.code === code);
                  return (
                    <div key={code} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{service?.display_name}</div>
                        <div className="text-sm text-gray-500">{stats.count} ventas</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${stats.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Performance por Barbero</h3>
            <div className="space-y-3">
              {barberStats
                .sort((a, b) => b.revenue - a.revenue)
                .map(stat => (
                  <div key={stat.barber.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{stat.barber.name}</div>
                      <div className="text-sm text-gray-500">{stat.orders} servicios</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${stat.revenue.toLocaleString()}</div>
                      <div className="text-sm text-green-600">+${stat.tips.toLocaleString()} tips</div>
                      {stat.pending > 0 && <div className="text-xs text-yellow-700">Pendiente: ${stat.pending.toLocaleString()}</div>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Métricas de Loyalty</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Sellos Otorgados</div>
              <div className="text-2xl font-bold">
                {data.loyaltyLedger.filter(l => l.reason === 'earn' && inRange(l.created_at)).reduce((sum, l) => sum + l.delta_stamps, 0)}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-sm text-gray-600">Créditos Otorgados</div>
              <div className="text-2xl font-bold">
                ${data.loyaltyLedger.filter(l => l.delta_credit_cop > 0 && inRange(l.created_at)).reduce((sum, l) => sum + l.delta_credit_cop, 0).toLocaleString()}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-sm text-gray-600">Recompensas Canjeadas</div>
              <div className="text-2xl font-bold">
                {data.loyaltyLedger.filter(l => l.reason === 'redeem' && inRange(l.created_at)).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StyleGallery = () => {
    const fallbackImg = '/barbershop_logo.png';
    const imgFor = (id: string) => {
      const isBeard = id.toUpperCase().startsWith('B-');
      // Hair styles remain lowercase filenames (hc-01.jpg), beard styles use uppercase (B-01.jpg)
      return isBeard
        ? `/img_styles/${id.toUpperCase()}.jpg`
        : `/img_styles/${id.toLowerCase()}.jpg`;
    };
    const initialHair = [
      { id: 'HC-01', name: 'Textured Crop', desc: 'Corte corto con textura para mayor volumen.', img: imgFor('HC-01'), tag: 'corto' },
      { id: 'HC-02', name: 'Buzz Cut', desc: 'Laterales rebajados y un poco más de largo arriba.', img: imgFor('HC-02'), tag: 'corto' },
      { id: 'HC-03', name: 'Classic Leading Man', desc: 'Side part o textura peinada para un look profesional.', img: imgFor('HC-03'), tag: 'medio' },
      { id: 'HC-04', name: 'Textured Volume', desc: 'Corte para que el cabello se levante con poco producto.', img: imgFor('HC-04'), tag: 'medio' },
      { id: 'HC-05', name: 'Full Shave', desc: 'Rasurado completo para un look limpio.', img: imgFor('HC-05'), tag: 'corto' },
      { id: 'HC-06', name: 'Grown-Out Fade', desc: 'Fade con laterales ligeramente más largos.', img: imgFor('HC-06'), tag: 'medio' },
      { id: 'HC-07', name: 'Styled Quiff', desc: 'Laterales cortos y copete peinado hacia arriba.', img: imgFor('HC-07'), tag: 'medio' },
      { id: 'HC-08', name: 'Natural Waves', desc: 'Más largo arriba para resaltar ondas naturales.', img: imgFor('HC-08'), tag: 'medio' },
      { id: 'HC-09', name: 'Close Crop', desc: 'Muy corto, un paso sobre el rasurado.', img: imgFor('HC-09'), tag: 'corto' },
      { id: 'HC-10', name: 'Layered Length', desc: 'Largo hasta hombros con capas.', img: imgFor('HC-10'), tag: 'largo' },
      { id: 'HC-11', name: 'Slicked Back', desc: 'Media melena peinada hacia atrás con crema.', img: imgFor('HC-11'), tag: 'medio' },
      { id: 'HC-12', name: 'Styled Waves', desc: 'Uso de textura natural para volumen.', img: imgFor('HC-12'), tag: 'medio' },
      { id: 'HC-13', name: 'Internal Length', desc: 'Capas internas para cuerpo y volumen.', img: imgFor('HC-13'), tag: 'medio' },
      { id: 'HC-14', name: 'Short Texture', desc: 'Laterales ceñidos, textura natural arriba.', img: imgFor('HC-14'), tag: 'corto' },
      { id: 'HC-18', name: 'Crew Cut', desc: 'Corte corto inspirado en estilo militar.', img: imgFor('HC-18'), tag: 'corto' },
      { id: 'HC-30', name: 'Loose Pompadour', desc: 'Volumen arriba con vibe rock & roll.', img: imgFor('HC-30'), tag: 'largo' },
      { id: 'HC-32', name: 'Short & Natural', desc: 'Corto y de bajo mantenimiento con hidratación.', img: imgFor('HC-32'), tag: 'corto' },
      { id: 'HC-38', name: 'Long & Tousled', desc: 'Largo manejable, look casual y juvenil.', img: imgFor('HC-38'), tag: 'largo' },
    ];

    const initialBeard = [
      { id: 'B-01', name: 'Barba recortada', desc: 'Pulida y profesional.', pair: 'Crew Cut (HC-18)', img: imgFor('B-01') },
      { id: 'B-02', name: 'Barba corta', desc: 'Enmarca rostro y mandíbula.', pair: 'Pompadour (HC-30)', img: imgFor('B-02') },
      { id: 'B-03', name: 'Barba completa', desc: 'Equilibra el corte y aporta madurez.', pair: 'Mature Fade (HC-23)', img: imgFor('B-03') },
      { id: 'B-04', name: 'Barba larga', desc: 'Líneas marcadas, look trendy.', pair: 'Faded Lineup (HC-37)', img: imgFor('B-04') },
      { id: 'B-05', name: 'Barba cuidada', desc: 'Mantiene el largo prolijo.', pair: 'Long & Tousled (HC-38)', img: imgFor('B-05') },
    ];
    const [hairStyles, setHairStyles] = useState(initialHair);
    const [beardStyles, setBeardStyles] = useState(initialBeard);

    const [hairFilter, setHairFilter] = useState<'todos' | 'corto' | 'medio' | 'largo'>('todos');
    const [search, setSearch] = useState('');

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [pendingImageTarget, setPendingImageTarget] = useState<{ id: string; type: 'hair' | 'beard' } | null>(null);

    const updateImage = (id: string, type: 'hair' | 'beard') => {
      if (userRole !== 'OWNER') return;
      const nextRaw = prompt('Pega la URL de la nueva imagen');
      const next = nextRaw?.trim();
      if (!next) return;
      const candidate = `${next}${next.includes('?') ? '&' : '?'}v=${Date.now()}`;
      if (type === 'hair') {
        setHairStyles(prev => prev.map(s => s.id === id ? { ...s, img: candidate } : s));
      } else {
        setBeardStyles(prev => prev.map(s => s.id === id ? { ...s, img: candidate } : s));
      }
      showToast('Imagen actualizada (se mostrará si la URL es accesible)');
    };

    const triggerUpload = (id: string, type: 'hair' | 'beard') => {
      if (userRole !== 'OWNER') return;
      setPendingImageTarget({ id, type });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
      }
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !pendingImageTarget) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (pendingImageTarget.type === 'hair') {
          setHairStyles(prev => prev.map(s => s.id === pendingImageTarget.id ? { ...s, img: dataUrl } : s));
        } else {
          setBeardStyles(prev => prev.map(s => s.id === pendingImageTarget.id ? { ...s, img: dataUrl } : s));
        }
        setPendingImageTarget(null);
        showToast('Imagen cargada desde tu dispositivo (persistirá en localStorage)');
      };
      reader.onerror = () => showToast('No se pudo leer el archivo. Intenta de nuevo.');
      reader.readAsDataURL(file);
    };

    const filteredHair = hairStyles.filter(s => (hairFilter === 'todos' || s.tag === hairFilter) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase())));

    return (
      <div className="p-6 space-y-6">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelected}
          aria-label="Subir imagen de estilo"
        />
        <div>
          <h2 className="text-2xl font-bold mb-2">Catálogo de Estilos</h2>
          <p className="text-sm text-gray-600">Inspírate y guarda la referencia para tu próxima cita (cabello y barba).</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Cortes de Cabello</h3>
              <p className="text-xs text-gray-500">Filtra por largo o busca palabras clave.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded text-sm"
                placeholder="Buscar estilo..."
                aria-label="Buscar estilo"
              />
              <select
                value={hairFilter}
                onChange={(e) => setHairFilter(e.target.value as any)}
                className="px-3 py-2 border rounded text-sm"
                aria-label="Filtrar por largo"
              >
                <option value="todos">Todos</option>
                <option value="corto">Corto</option>
                <option value="medio">Medio</option>
                <option value="largo">Largo</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHair.map(style => (
              <div key={style.id} className="border rounded-lg p-3 flex gap-3 hover:shadow-sm transition-shadow bg-gradient-to-br from-slate-50 to-white">
                <img
                  src={style.img}
                  alt={style.name}
                  onError={(e) => {
                    // Avoid overriding local uploads (blob:/data:)
                    const src = e.currentTarget.src || '';
                    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
                      e.currentTarget.src = fallbackImg;
                    }
                  }}
                  className="w-24 h-24 object-cover rounded border bg-slate-100 flex-shrink-0 cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={() => triggerUpload(style.id, 'hair')}
                  title={userRole === 'OWNER' ? 'Click para subir imagen desde tu dispositivo' : undefined}
                />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-orange-500">{style.id} • {style.tag}</div>
                  <div className="font-bold text-blue-700">{style.name}</div>
                  <div className="text-sm text-gray-600">{style.desc}</div>
                  <div className="text-xs text-gray-500">Guarda el ID para tu cita.</div>
                  {userRole === 'OWNER' && (
                    <div className="flex gap-2 text-[11px] text-blue-600">
                      <button className="underline" onClick={() => updateImage(style.id, 'hair')}>Cambiar por URL</button>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">o haz click en la imagen para subir</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredHair.length === 0 && (
              <div className="col-span-full text-sm text-gray-500">No encontramos estilos con ese filtro.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Estilos de Barba</h3>
            <span className="text-xs text-gray-500">Combínalos con tu corte</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beardStyles.map(style => (
              <div key={style.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow space-y-2 bg-gradient-to-br from-slate-50 to-white flex gap-3">
                <img
                  src={style.img}
                  alt={style.name}
                  onError={(e) => {
                    const src = e.currentTarget.src || '';
                    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
                      e.currentTarget.src = fallbackImg;
                    }
                  }}
                  className="w-20 h-20 object-cover rounded border bg-slate-100 flex-shrink-0 cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={() => triggerUpload(style.id, 'beard')}
                  title={userRole === 'OWNER' ? 'Click para subir imagen desde tu dispositivo' : undefined}
                />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-orange-500">{style.id}</div>
                  <div className="font-bold text-blue-700">{style.name}</div>
                  <div className="text-sm text-gray-600">{style.desc}</div>
                  <div className="text-xs text-gray-500">Ideal con: {style.pair}</div>
                  {userRole === 'OWNER' && (
                    <div className="flex gap-2 text-[11px] text-blue-600">
                      <button className="underline" onClick={() => updateImage(style.id, 'beard')}>Cambiar por URL</button>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">o haz click en la imagen para subir</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (appState === 'LANDING') {
    return (
      <div className="animate-in fade-in duration-700">
        <LandingPage
          onLogin={() => setAppState('LOGIN')}
          onJoin={() => setAppState('LOGIN')}
          socialLinks={data.settings.social_links}
        />
      </div>
    );
  }

  if (appState === 'LOGIN') {
    return (
      <div className="animate-in fade-in duration-500">
        <LoginPage onBack={() => setAppState('LANDING')} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <ErrorBoundary>
        <div className="app-shell flex flex-col min-h-screen">
          <header className="shadow-sm">
            <NavBar />
            <div className="bg-slate-100 px-4 py-1 flex justify-end">
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold text-slate-500 hover:text-red-600 uppercase tracking-widest transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </header>
          <main className="flex-1 w-full">
            <div className="container-app py-6 sm:py-8 space-y-6">
              {currentView === 'dashboard' && userRole !== 'CLIENT' && canAccess('dashboard') && <Dashboard />}
              {currentView === 'walkin' && canAccess('walkin') && <WalkIn />}
              {currentView === 'appointments' && userRole !== 'CLIENT' && canAccess('appointments') && <Appointments onOpenCustomer={openCustomerModal} />}
              {currentView === 'customers' && userRole !== 'CLIENT' && canAccess('customers') && <Customers onOpenCustomer={openCustomerModal} />}
              {currentView === 'history' && userRole !== 'CLIENT' && canAccess('history') && <History onOpenCustomer={openCustomerModal} />}
              {currentView === 'client_profile' && userRole === 'CLIENT' && currentClientPhone && (
                <ClientProfile initialTab={clientProfileTab} />
              )}
              {currentView === 'styles' && <StyleGallery />}
              {currentView === 'rewards' && userRole === 'OWNER' && canAccess('rewards') && <RewardsManager />}
              {currentView === 'settings' && userRole === 'OWNER' && canAccess('settings') && <SettingsView />}
              {currentView === 'exports' && userRole === 'OWNER' && canAccess('exports') && <Exports />}
              {currentView === 'reports' && userRole === 'OWNER' && canAccess('exports') && <Reports />}
            </div>
          </main>
          {selectedCustomerModal && (
            <CustomerDetailModal customer={selectedCustomerModal} onClose={closeCustomerModal} />
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default BarberiaApp;
