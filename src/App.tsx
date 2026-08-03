import React, { useState, useEffect } from 'react';
import { EmitterConfig, Client, Product, Invoice, CreditNote, PortalUser } from './types';
import SettingsForm from './components/SettingsForm';
import InvoiceForm from './components/InvoiceForm';
import CreditNoteForm from './components/CreditNoteForm';
import HistoryList from './components/HistoryList';
import RideViewer from './components/RideViewer';
import ProductCatalog from './components/ProductCatalog';
import CompanyProfile from './components/CompanyProfile';
import LoginForm from './components/LoginForm';
import UserManagement from './components/UserManagement';
import ProformaForm from './components/ProformaForm';
import ClientCatalog from './components/ClientCatalog';
import { SupabaseExplorer } from './components/SupabaseExplorer';
import { logActivity } from './lib/activityLogger';
import { 
  fetchClientsFromSupabase, saveClientToSupabase, deleteClientFromSupabase,
  fetchProductsFromSupabase, saveProductToSupabase, deleteProductFromSupabase,
  fetchInvoicesFromSupabase, saveInvoiceToSupabase, deleteInvoiceFromSupabase,
  fetchCreditNotesFromSupabase, saveCreditNoteToSupabase, deleteCreditNoteFromSupabase,
  fetchProformasFromSupabase, saveProformaToSupabase,
  fetchEmitterConfigFromSupabase, saveEmitterConfigToSupabase,
  migrateLocalDataToSupabase, subscribeToSupabaseRealtime
} from './lib/supabase';
import { ShieldCheck, Send, Settings, History, Plus, Layers, ArrowLeftRight, FileCheck2, CloudLightning, Package, User, Users, Menu, X, FileText, Database } from 'lucide-react';

const STORAGE_KEYS = {
  CONFIG: 'sri_emitter_config',
  CLIENTS: 'sri_clients_catalog',
  PRODUCTS: 'sri_products_catalog',
  INVOICES: 'sri_invoices_history',
  CREDIT_NOTES: 'sri_credit_notes_history',
};

// Initial Core Seed Data - Empty by default, fetched from emisor_config table in Supabase
const DEFAULT_CONFIG: EmitterConfig = {
  ruc: '',
  razonSocial: '',
  nombreComercial: '',
  dirMatriz: '',
  dirEstablecimiento: '',
  codEstablecimiento: '001',
  codPuntoEmision: '001',
  obligadoContabilidad: true,
  regimen: 'RIMPE_EMPRENDEDOR',
  ambiente: '1', // Pruebas
  isDemoMode: true,
  correo: '',
  telefono: '',
  ultimoSecuencialFactura: '000000001',
};

const SEED_CLIENTS: Client[] = [
  {
    id: 'c-1',
    tipoIdentificacion: '04', // RUC
    identificacion: '1725619391001',
    nombre: 'JERALDINE SHADIRA VALLE PLUA',
    direccion: 'Quito Centro, Edificio Bicentenario Piso 4',
    telefono: '0995831920',
    correo: 'jeraldine.valle@digital.ec'
  },
  {
    id: 'c-2',
    tipoIdentificacion: '05', // Cédula
    identificacion: '1712398472',
    nombre: 'ALEXANDER FABRICIO LOPEZ CHAZO',
    direccion: 'Cumbayá - Av. Interoceánica Km 8',
    telefono: '0228941293',
    correo: 'alex.lopez@partner.com'
  }
];

const SEED_PRODUCTS: Product[] = [
  { id: 'p-1', codigo: 'SOF-01', nombre: 'Desarrollo de Software Customizado (Enterprise)', precio: 1500.00, ivaTipo: '4', descuentoDefault: 100 },
  { id: 'p-2', codigo: 'CLOUD-HOST', nombre: 'Licencia Servidor Cloud Dedicado (Mensual)', precio: 180.00, ivaTipo: '4', descuentoDefault: 0 },
  { id: 'p-3', codigo: 'TRAIN-02', nombre: 'Capacitación en Ciberseguridad y DevOps (Hora)', precio: 75.00, ivaTipo: '0', descuentoDefault: 0 }
];

export default function App() {
  // Navigation tabs 'history' | 'new-invoice' | 'new-nc' | 'products' | 'profile' | 'settings' | 'users' | 'proformas' | 'clients'
  const [activeTab, setActiveTab ] = useState<'history' | 'new-invoice' | 'new-nc' | 'products' | 'profile' | 'settings' | 'users' | 'proformas' | 'clients'>('history');
  
  // Dynamic USER role permissions state
  const [userPermissions, setUserPermissions] = useState<string[]>(() => {
    const saved = localStorage.getItem('sri_portal_user_permissions');
    return saved ? JSON.parse(saved) : ['history', 'new-invoice', 'products', 'proformas', 'clients'];
  });

  // User Session Management
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => {
    const saved = localStorage.getItem('sri_portal_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  // State variables loaded from LocalStorage
  const [config, setConfig] = useState<EmitterConfig>(DEFAULT_CONFIG);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

  // Helper to generate user-specific localStorage keys
  const getUserStorageKey = (baseKey: string, userEmail?: string) => {
    if (!userEmail) return baseKey;
    const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${baseKey}_user_${safeEmail}`;
  };

  // Ride viewer modal active document state
  const [activeRideDoc, setActiveRideDoc] = useState<Invoice | CreditNote | null>(null);

  // Responsive mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize and load seed data
  useEffect(() => {
    const email = currentUser?.correo;
    const configKey = getUserStorageKey(STORAGE_KEYS.CONFIG, email);
    const clientsKey = getUserStorageKey(STORAGE_KEYS.CLIENTS, email);
    const productsKey = getUserStorageKey(STORAGE_KEYS.PRODUCTS, email);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, email);
    const creditNotesKey = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, email);

    // 1. Config
    const savedConfig = localStorage.getItem(configKey);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Clean up legacy example hardcoded data if present
      if (parsed.ruc === '1792451083001' || parsed.razonSocial === 'VALLE PLUA JHONNY ALEXIS') {
        setConfig(DEFAULT_CONFIG);
        localStorage.setItem(configKey, JSON.stringify(DEFAULT_CONFIG));
      } else {
        setConfig(parsed);
      }
    } else {
      const initialConfig = email ? { ...DEFAULT_CONFIG, correo: email } : DEFAULT_CONFIG;
      localStorage.setItem(configKey, JSON.stringify(initialConfig));
      setConfig(initialConfig);
    }

    // 2. Clients
    const savedClients = localStorage.getItem(clientsKey);
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    } else {
      localStorage.setItem(clientsKey, JSON.stringify(SEED_CLIENTS));
      setClients(SEED_CLIENTS);
    }

    // 3. Products
    const savedProducts = localStorage.getItem(productsKey);
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      localStorage.setItem(productsKey, JSON.stringify(SEED_PRODUCTS));
      setProducts(SEED_PRODUCTS);
    }

    // 4. Invoices History
    const savedInvoices = localStorage.getItem(invoicesKey);
    if (savedInvoices) {
      const parsed: Invoice[] = JSON.parse(savedInvoices);
      const filtered = parsed.filter(inv => inv.id !== 'seed-inv-1');
      if (filtered.length !== parsed.length) {
        localStorage.setItem(invoicesKey, JSON.stringify(filtered));
      }
      setInvoices(filtered);
    } else {
      localStorage.setItem(invoicesKey, JSON.stringify([]));
      setInvoices([]);
    }

    // 5. Credit notes history
    const savedCreditNotes = localStorage.getItem(creditNotesKey);
    if (savedCreditNotes) {
      setCreditNotes(JSON.parse(savedCreditNotes));
    } else {
      localStorage.setItem(creditNotesKey, JSON.stringify([]));
      setCreditNotes([]);
    }
  }, [currentUser]);

  // Real-time synchronization with Supabase
  useEffect(() => {
    let isMounted = true;

    const syncWithSupabase = async () => {
      // 1. Clients
      const dbClients = await fetchClientsFromSupabase();
      if (dbClients && dbClients.length > 0 && isMounted) {
        setClients(dbClients);
        const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbClients));
      }

      // 2. Products
      const dbProducts = await fetchProductsFromSupabase();
      if (dbProducts && dbProducts.length > 0 && isMounted) {
        setProducts(dbProducts);
        const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbProducts));
      }

      // 3. Invoices
      const dbInvoices = await fetchInvoicesFromSupabase();
      if (dbInvoices && isMounted) {
        setInvoices(dbInvoices);
        const key = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbInvoices));
      }

      // 4. Credit Notes
      const dbCreditNotes = await fetchCreditNotesFromSupabase();
      if (dbCreditNotes && isMounted) {
        setCreditNotes(dbCreditNotes);
        const key = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbCreditNotes));
      }

      // 5. Config
      const dbConfig = await fetchEmitterConfigFromSupabase();
      if (dbConfig && isMounted) {
        setConfig(prev => ({ ...prev, ...dbConfig }));
        const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify({ ...config, ...dbConfig }));
      } else if (!dbConfig && isMounted) {
        // If no record exists in emisor_config, ensure hardcoded sample data isn't shown
        setConfig(prev => {
          if (prev.ruc === '1792451083001' || prev.razonSocial === 'VALLE PLUA JHONNY ALEXIS') {
            const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
            localStorage.setItem(key, JSON.stringify(DEFAULT_CONFIG));
            return DEFAULT_CONFIG;
          }
          return prev;
        });
      }

      // Auto migrate local items to Supabase
      migrateLocalDataToSupabase({
        clients,
        products,
        invoices,
        creditNotes,
        config
      });
    };

    syncWithSupabase();

    // Subscribe to Realtime Postgres changes
    const unsubscribe = subscribeToSupabaseRealtime(() => {
      syncWithSupabase();
    });

    // Polling interval fallback every 8 seconds
    const interval = setInterval(syncWithSupabase, 8000);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [currentUser?.correo]);

  // Redirect to permitted tab for USER role if they land on or click a restricted option
  useEffect(() => {
    if (currentUser?.role === 'USER') {
      const isAllowed = userPermissions.includes(activeTab);
      if (!isAllowed) {
        // Find the first tab that is allowed, or default to 'history'
        const firstAllowed = userPermissions.length > 0 ? (userPermissions[0] as typeof activeTab) : 'history';
        setActiveTab(firstAllowed);
      }
    }
  }, [currentUser, activeTab, userPermissions]);

  // Update storage & state handlers
  const handleSaveConfig = (newConfig: EmitterConfig) => {
    setConfig(newConfig);
    const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
    localStorage.setItem(key, JSON.stringify(newConfig));
    saveEmitterConfigToSupabase(newConfig);
    if (currentUser) {
      logActivity(
        currentUser,
        'Modificación de Perfil/Firma',
        `Parámetros SRI actualizados. Razón Social: ${newConfig.razonSocial}, RUC: ${newConfig.ruc}`
      );
    }
  };

  const handleAddClient = (client: Client) => {
    const updated = [client, ...clients];
    setClients(updated);
    const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
    localStorage.setItem(key, JSON.stringify(updated));
    saveClientToSupabase(client);
  };

  const handleAddProduct = (product: Product) => {
    const updated = [product, ...products];
    setProducts(updated);
    const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
    localStorage.setItem(key, JSON.stringify(updated));
    saveProductToSupabase(product);
  };

  const handleAddInvoice = (invoice: Invoice) => {
    // Append the operator name as developer/creator of the document
    const invoiceWithCreator: Invoice = {
      ...invoice,
      creadorNombre: currentUser ? (currentUser.nombre || currentUser.correo.split('@')[0].toUpperCase()) : 'ADMINISTRADOR'
    };
    const updated = [invoiceWithCreator, ...invoices];
    setInvoices(updated);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
    localStorage.setItem(invoicesKey, JSON.stringify(updated));
    saveInvoiceToSupabase(invoiceWithCreator);

    // Log the event
    if (currentUser) {
      logActivity(
        currentUser,
        'Generación de Factura',
        `Factura #${invoice.secuencial} creada para ${invoice.cliente.nombre}. Total: $${invoice.resumenImpuestos.total.toFixed(2)}. Estado: ${invoice.estado}`
      );
    }

    // Also update config sequential automatically
    const seqNum = parseInt(invoice.secuencial, 10);
    const highestSeqKey = getUserStorageKey('sri_highest_secuencial', currentUser?.correo);
    localStorage.setItem(highestSeqKey, String(seqNum));
    const nextSeqStr = String(seqNum + 1).padStart(9, '0');
    
    const updatedConfig = {
      ...config,
      ultimoSecuencialFactura: nextSeqStr
    };
    setConfig(updatedConfig);
    const configKey = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
    localStorage.setItem(configKey, JSON.stringify(updatedConfig));
    saveEmitterConfigToSupabase(updatedConfig);
  };

  const handleUpdateInvoice = (id: string, updatedParams: Partial<Invoice>) => {
    const updatedInvs = invoices.map(inv => {
      if (inv.id === id) {
        const newInv = { ...inv, ...updatedParams };
        saveInvoiceToSupabase(newInv);
        return newInv;
      }
      return inv;
    });
    setInvoices(updatedInvs);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
    localStorage.setItem(invoicesKey, JSON.stringify(updatedInvs));
  };

  const handleAddCreditNote = (nc: CreditNote) => {
    // Append the operator name as developer/creator of the document
    const ncWithCreator: CreditNote = {
      ...nc,
      creadorNombre: currentUser ? (currentUser.nombre || currentUser.correo.split('@')[0].toUpperCase()) : 'ADMINISTRADOR'
    };
    const updated = [ncWithCreator, ...creditNotes];
    setCreditNotes(updated);
    const cnKey = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
    localStorage.setItem(cnKey, JSON.stringify(updated));
    saveCreditNoteToSupabase(ncWithCreator);

    // Log the event
    if (currentUser) {
      logActivity(
        currentUser,
        'Generación de Nota de Crédito',
        `Nota de Crédito #${nc.secuencial} creada para cliente ${nc.cliente.nombre}. Total: $${nc.resumenImpuestos.total.toFixed(2)}. Estado: ${nc.estado}`
      );
    }
  };

  const handleUpdateCreditNote = (id: string, updatedParams: Partial<CreditNote>) => {
    const updatedNCs = creditNotes.map(nc => {
      if (nc.id === id) {
        const newNC = { ...nc, ...updatedParams };
        saveCreditNoteToSupabase(newNC);
        return newNC;
      }
      return nc;
    });
    setCreditNotes(updatedNCs);
    const cnKey = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
    localStorage.setItem(cnKey, JSON.stringify(updatedNCs));
  };

  const handleDeleteInvoice = (id: string) => {
    const filtered = invoices.filter(i => i.id !== id);
    setInvoices(filtered);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
    localStorage.setItem(invoicesKey, JSON.stringify(filtered));
    deleteInvoiceFromSupabase(id);
  };

  const handleDeleteCreditNote = (id: string) => {
    const filtered = creditNotes.filter(n => n.id !== id);
    setCreditNotes(filtered);
    const cnKey = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
    localStorage.setItem(cnKey, JSON.stringify(filtered));
    deleteCreditNoteFromSupabase(id);
  };

  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('sri_portal_active_user', JSON.stringify(user));
        }}
        adminEmail={config.correo || 'jhonnyVP5@gmail.com'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/75 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 px-4 sm:px-6 py-4 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer group transition-transform duration-300 hover:scale-105 shrink-0">
              <svg viewBox="0 0 100 100" className="w-9 h-9 animate-[spin_50s_linear_infinite]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="headerBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="35%" stopColor="#d8f2ff" />
                    <stop offset="70%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0060d0" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="#030d1a" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.4" />
                <path d="M50 14 C25 18 16 45 35 65 C41 71 52 74 62 70 C72 66 79 55 77 44 C75 33 65 24 54 26 C43 28 35 38 38 49 C40 57 48 62 55 59 C61 56 63 48 59 43 C55 39 49 40 48 45 C47 48 50 51 52 50" stroke="url(#headerBlueGrad)" strokeWidth="6" strokeLinecap="round" />
                <path d="M50 20 C32 24 25 45 39 60 C49 71 66 69 74 55 C79 45 74 32 61 28 C50 24 40 32 41 44 C42 51 49 55 54 52 C58 50 59 44 56 41 C53 38 49 40 49 43" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
                <circle cx="50" cy="50" r="4" fill="#0ea5e9" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm sm:text-md font-black tracking-widest text-gray-900 dark:text-white leading-tight uppercase">
                JOLUS <span className="text-indigo-600 font-medium">SERVICES</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none block">
                Facturación Electrónica SRI
              </span>
            </div>
          </div>

          {/* DESKTOP HEADER ACTIONS (HIDDEN ON TABLET/MOBILE) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* ACTIVE EMITTER PREVIEW BANNER */}
            <div className="flex items-center gap-4 text-xs font-mono bg-gray-50 dark:bg-zinc-850 p-2 px-4 rounded-xl border border-gray-100 dark:border-zinc-800">
              <div>
                <span className="text-gray-400">RUC:</span> <span className="font-bold text-gray-800 dark:text-zinc-200">{config.ruc}</span>
              </div>
              <div className="h-4 border-l border-gray-200 dark:border-zinc-700" />
              <div className="truncate max-w-[150px] sm:max-w-[200px] font-bold" title={config.razonSocial}>
                {config.razonSocial}
              </div>
              <div className="h-4 border-l border-gray-200 dark:border-zinc-700" />
              <div className={`font-semibold flex items-center gap-1 ${config.isDemoMode ? 'text-indigo-600' : 'text-emerald-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.isDemoMode ? 'bg-indigo-600' : 'bg-emerald-600 animate-pulse'}`} />
                {config.isDemoMode ? 'SIMULADOR' : 'CONEXIÓN SRI'}
              </div>
            </div>

            {/* SESIÓN USUARIO */}
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100/45 dark:border-indigo-900/30 p-1.5 pl-3.5 pr-2.5 rounded-xl text-xs">
                <div className="text-left leading-tight">
                  <span className="block text-[10.5px] font-extrabold text-gray-800 dark:text-zinc-200 truncate max-w-[120px]" title={currentUser.correo}>
                    {currentUser.correo.split('@')[0].toUpperCase()}
                  </span>
                  <span className={`inline-block font-mono text-[9px] font-black uppercase tracking-wider rounded-sm ${currentUser.role === 'ADMIN' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    • {currentUser.role}
                  </span>
                </div>
                <div className="h-5 border-l border-indigo-200/40 dark:border-indigo-900/40" />
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('sri_portal_active_user');
                    // Reset tab to history on logout
                    setActiveTab('history');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-red-50 hover:text-red-605 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 font-bold text-[10.5px] rounded-lg border border-gray-200/50 dark:border-zinc-700 transition cursor-pointer"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            )}
          </div>

          {/* MOBILE & TABLET HEADER CONTROLS */}
          <div className="flex lg:hidden items-center gap-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded bg-gray-50 dark:bg-zinc-850 ${config.isDemoMode ? 'text-indigo-600 border border-indigo-150' : 'text-emerald-500 border border-emerald-500/20 animate-pulse'}`}>
              ● {config.isDemoMode ? 'SIM' : 'SRI'}
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition border border-gray-150 dark:border-zinc-805 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE MENU NAV DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden animate-fade-in duration-200">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200" onClick={() => setIsMobileMenuOpen(false)} />
          
          <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-white dark:bg-zinc-905 bg-gray-50 dark:bg-zinc-900 shadow-2xl p-5 border-r border-gray-200 dark:border-zinc-850 overflow-y-auto transform transition-transform duration-200 ease-out">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">JOLUS <span className="text-indigo-600 font-medium">SERVICES</span></span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 px-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DYNAMIC EMITTER IDENTIFIER IN MOBILE DRAWER */}
            <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-850 mb-4 text-xs text-left shadow-2xs">
              <div className="font-bold text-gray-400 dark:text-zinc-500 text-[10px] uppercase mb-1">EMISOR CONFIGURADO:</div>
              <div className="font-extrabold text-gray-800 dark:text-white truncate" title={config.razonSocial}>{config.razonSocial}</div>
              <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono mt-0.5">RUC: {config.ruc}</div>
              <div className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/20 p-1.5 rounded-lg border border-indigo-100/30 dark:border-indigo-900/30">
                <span className={`w-1.5 h-1.5 rounded-full ${config.isDemoMode ? 'bg-indigo-600' : 'bg-emerald-500 animate-ping'}`} />
                {config.isDemoMode ? 'Modo Pruebas / Simulación' : 'Modo Operativo Producción'}
              </div>
            </div>

            {/* USER REQUISITES IN MOBILE DRAWER */}
            {currentUser && (
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/30 dark:border-indigo-900/10 mb-5 text-left">
                <div className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Usuario Activo</div>
                <div className="font-bold text-gray-700 dark:text-zinc-300 truncate text-xs">{currentUser.nombre || currentUser.correo}</div>
                <div className="text-[9px] font-bold text-gray-500 dark:text-zinc-500 font-mono uppercase mt-0.5">Rol asignado: {currentUser.role}</div>
              </div>
            )}

            {/* REDISTRIBUTED NAVIGATION TABS */}
            <div className="flex flex-col gap-1.5 flex-grow">
              <div className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest pl-2 mb-1">Navegación del Portal</div>
              
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('history')) && (
                <button
                  onClick={() => {
                    setActiveTab('history');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <History className="w-4 h-4" />
                  Historial de RIDE
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('new-invoice')) && (
                <button
                  onClick={() => {
                    setActiveTab('new-invoice');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'new-invoice' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <Plus className="w-4 h-4" />
                  Emitir Factura
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('proformas')) && (
                <button
                  onClick={() => {
                    setActiveTab('proformas');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'proformas' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <FileText className="w-4 h-4" />
                  Generar Proforma
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('new-nc')) && (
                <button
                  onClick={() => {
                    setActiveTab('new-nc');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'new-nc' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Nota de Crédito
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('products')) && (
                <button
                  onClick={() => {
                    setActiveTab('products');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <Package className="w-4 h-4" />
                  Catálogo Productos
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('clients')) && (
                <button
                  onClick={() => {
                    setActiveTab('clients');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <Users className="w-4 h-4" />
                  Catálogo Clientes
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('profile')) && (
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <User className="w-4 h-4" />
                  Mi Perfil
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('settings')) && (
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <Settings className="w-4 h-4" />
                  Configuración SRI
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN') && (
                <button
                  onClick={() => {
                    setActiveTab('users');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <Users className="w-4 h-4" />
                  Gestión Usuarios
                </button>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('settings')) && (
                <button
                  onClick={() => {
                    setActiveTab('supabase');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'supabase' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <Database className="w-4 h-4 text-emerald-500" />
                  Base de Datos Supabase
                </button>
              )}
            </div>

            {/* EXIT BUTTON IN DRAWER */}
            {currentUser && (
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-6">
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    localStorage.removeItem('sri_portal_active_user');
                    setActiveTab('history');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-bold rounded-xl border border-red-200 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  Cerrar Sesión Activa
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CORE HUB LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* DESKTOP TABS NAVBAR (HIDDEN ON TABLET/MOBILE IN FAVOR OF COLLAPSIBLE SIDE DRAWER) */}
        <div className="hidden lg:flex flex-wrap bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-gray-100 dark:border-zinc-850 shadow-xs max-w-6xl mx-auto print:hidden gap-1 justify-center animate-fade-in">
          
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('history')) && (
            <button
               onClick={() => setActiveTab('history')}
               className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <History className="w-3.5 h-3.5" />
              Historial
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('new-invoice')) && (
            <button
              onClick={() => setActiveTab('new-invoice')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'new-invoice' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Emitir Factura
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('proformas')) && (
            <button
              onClick={() => setActiveTab('proformas')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'proformas' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Generar Proforma
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('new-nc')) && (
            <button
              onClick={() => setActiveTab('new-nc')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'new-nc' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Nota de Crédito
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('products')) && (
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <Package className="w-3.5 h-3.5" />
              Productos
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('clients')) && (
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Clientes
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('profile')) && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <User className="w-3.5 h-3.5" />
              Mi Perfil
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('settings')) && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              Configuración SRI
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Gestión Usuarios
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('settings')) && (
            <button
              onClick={() => setActiveTab('supabase')}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'supabase' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              Base de Datos Supabase
            </button>
          )}
          
        </div>         

        {/* TAB PORTALS */}
        <div className="transition-opacity duration-200">
          {activeTab === 'history' && (
            <HistoryList
              config={config}
              invoices={invoices}
              creditNotes={creditNotes}
              onUpdateInvoice={handleUpdateInvoice}
              onUpdateCreditNote={handleUpdateCreditNote}
              onDeleteInvoice={handleDeleteInvoice}
              onDeleteCreditNote={handleDeleteCreditNote}
              onOpenRide={(doc) => setActiveRideDoc(doc)}
            />
          )}

          {activeTab === 'new-invoice' && (
            <InvoiceForm
              config={config}
              clients={clients}
              products={products}
              onAddInvoice={handleAddInvoice}
              onAddClient={handleAddClient}
              onAddProduct={handleAddProduct}
              onNavigateToHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'new-nc' && (
            <CreditNoteForm
              config={config}
              clients={clients}
              invoices={invoices}
              onAddCreditNote={handleAddCreditNote}
              onNavigateToHistory={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'proformas' && (
            <ProformaForm
              config={config}
              clients={clients}
              products={products}
              onAddActivityLog={(action, details) => {
                if (currentUser) {
                  logActivity(currentUser, action, details);
                }
              }}
              onAddClient={handleAddClient}
              onAddProduct={handleAddProduct}
              currentUserEmail={currentUser?.correo}
            />
          )}

          {activeTab === 'products' && (
            <ProductCatalog
              products={products}
              onAddProduct={handleAddProduct}
              onDeleteProduct={(id) => {
                const updated = products.filter(p => p.id !== id);
                setProducts(updated);
                const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
                localStorage.setItem(key, JSON.stringify(updated));
              }}
              onSetProducts={(newProds) => {
                setProducts(newProds);
                const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
                localStorage.setItem(key, JSON.stringify(newProds));
              }}
            />
          )}

          {activeTab === 'clients' && (
            <ClientCatalog
              clients={clients}
              onAddClient={handleAddClient}
              onDeleteClient={(id) => {
                const updated = clients.filter(c => c.id !== id);
                setClients(updated);
                const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
                localStorage.setItem(key, JSON.stringify(updated));
              }}
              onSetClients={(newClients) => {
                setClients(newClients);
                const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
                localStorage.setItem(key, JSON.stringify(newClients));
              }}
            />
          )}

          {activeTab === 'profile' && (
            <CompanyProfile
              config={config}
              onSaveConfig={handleSaveConfig}
              currentUserEmail={currentUser?.correo}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsForm
              config={config}
              onSave={handleSaveConfig}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'users' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN') && (
            <UserManagement
              currentUser={currentUser}
              userPermissions={userPermissions}
              onUpdatePermissions={(newPerms) => {
                setUserPermissions(newPerms);
                localStorage.setItem('sri_portal_user_permissions', JSON.stringify(newPerms));
              }}
            />
          )}

          {activeTab === 'supabase' && (
            <SupabaseExplorer />
          )}
        </div>

      </main>

      {/* RIDE PRINTABLE PREVIEW IF ACTIVE */}
      {activeRideDoc && (
        <RideViewer
          document={activeRideDoc}
          config={config}
          onClose={() => setActiveRideDoc(null)}
        />
      )}

      {/* FOOTER BAR (HIDDEN IN PRINT) */}
      <footer className="bg-white border-t border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 px-6 py-4 mt-auto text-center text-xs text-gray-400 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} SRI Integrador de Facturas y Notas de Crédito Ecuador - J&V Soluciones.</p>
          <p className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            XAdES-BES Firmado y Conexiones Offline Oficial de Ecuador SRI habilitadas.
          </p>
        </div>
      </footer>

    </div>
  );
}
