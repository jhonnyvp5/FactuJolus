import React, { useState, useEffect, useRef } from 'react';
import { EmitterConfig, Client, Product, Invoice, CreditNote, PortalUser, EmpresaTenant } from './types';
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
import TenantManagement from './components/TenantManagement';
import { SupabaseExplorer } from './components/SupabaseExplorer';
import { logActivity } from './lib/activityLogger';
import { 
  fetchClientsFromSupabase, saveClientToSupabase, deleteClientFromSupabase,
  fetchProductsFromSupabase, saveProductToSupabase, deleteProductFromSupabase,
  fetchInvoicesFromSupabase, saveInvoiceToSupabase, deleteInvoiceFromSupabase,
  fetchCreditNotesFromSupabase, saveCreditNoteToSupabase, deleteCreditNoteFromSupabase,
  fetchProformasFromSupabase, saveProformaToSupabase,
  fetchEmitterConfigFromSupabase, saveEmitterConfigToSupabase,
  fetchEmpresasFromSupabase, getEmpresaByRuc,
  migrateLocalDataToSupabase, subscribeToSupabaseRealtime
} from './lib/supabase';
import { ShieldCheck, Send, Settings, History, Plus, Layers, ArrowLeftRight, FileCheck2, CloudLightning, Package, User, Users, Menu, X, FileText, Database, Building2 } from 'lucide-react';

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
  regimen: '',
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
  // Navigation tabs 'history' | 'new-invoice' | 'new-nc' | 'products' | 'profile' | 'settings' | 'users' | 'proformas' | 'clients' | 'tenants'
  const [activeTab, setActiveTab ] = useState<'history' | 'new-invoice' | 'new-nc' | 'products' | 'profile' | 'settings' | 'users' | 'proformas' | 'clients' | 'tenants'>('history');
  
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
  const [currentEmpresa, setCurrentEmpresa] = useState<EmpresaTenant | null>(null);

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

  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const lastActivityRef = useRef(Date.now());

  // 15-Minute Inactivity Auto-Logout
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
  useEffect(() => {
    if (!currentUser) return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

    const checkInterval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= INACTIVITY_TIMEOUT_MS) {
        logActivity(
          currentUser,
          'Cierre de Sesión por Inactividad',
          'La sesión se cerró automáticamente tras 15 minutos de inactividad.'
        );
        setCurrentUser(null);
        localStorage.removeItem('sri_portal_active_user');
        setInactivityNotice('Su sesión expiró por inactividad (15 min sin uso). Por favor, inicie sesión nuevamente.');
      }
    }, 10000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
      clearInterval(checkInterval);
    };
  }, [currentUser]);

  // Platform Automatic Update / Refresh Listener
  useEffect(() => {
    let initialScriptSignature: string | null = null;

    const checkPlatformUpdate = async () => {
      try {
        const response = await fetch(`/?_update=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const html = await response.text();
        const scripts = html.match(/<script[^>]*src=["']([^"']+)["']/g) || [];
        const signature = scripts.join('|');

        if (initialScriptSignature === null) {
          initialScriptSignature = signature;
        } else if (signature && signature !== initialScriptSignature) {
          console.log('[AutoUpdate] Nueva versión de plataforma detectada. Recargando...');
          window.location.reload();
        }
      } catch {
        // Network error ignored
      }
    };

    checkPlatformUpdate();
    const interval = setInterval(checkPlatformUpdate, 30000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPlatformUpdate();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const handleManualLogout = () => {
    if (currentUser) {
      logActivity(currentUser, 'Cierre de Sesión', 'Cierre de sesión voluntario realizado por el usuario.');
    }
    setCurrentUser(null);
    localStorage.removeItem('sri_portal_active_user');
    setActiveTab('history');
    setIsMobileMenuOpen(false);
  };
  useEffect(() => {
    const email = currentUser?.correo;
    const empresaRuc = currentUser?.empresaRuc;
    const empresaNombre = currentUser?.empresaNombre;

    const configKey = getUserStorageKey(STORAGE_KEYS.CONFIG, email);
    const clientsKey = getUserStorageKey(STORAGE_KEYS.CLIENTS, email);
    const productsKey = getUserStorageKey(STORAGE_KEYS.PRODUCTS, email);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, email);
    const creditNotesKey = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, email);

    // 1. Config
    const savedConfig = localStorage.getItem(configKey);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // If the user belongs to a specific empresa, ensure the cached config matches their empresa
        if (empresaRuc) {
          if (parsed.empresaRuc === empresaRuc || parsed.ruc === empresaRuc) {
            setConfig(parsed);
          } else {
            const cleanEmpresaConfig: EmitterConfig = {
              ...DEFAULT_CONFIG,
              ruc: empresaRuc,
              razonSocial: empresaNombre || '',
              nombreComercial: empresaNombre || '',
              empresaRuc: empresaRuc,
              empresaNombre: empresaNombre || '',
              correo: email || '',
              dirMatriz: '',
              dirEstablecimiento: '',
              ultimoSecuencialFactura: '000000001'
            };
            setConfig(cleanEmpresaConfig);
            localStorage.setItem(configKey, JSON.stringify(cleanEmpresaConfig));
          }
        } else {
          // If legacy hardcoded dummy data was present
          if (parsed.ruc === '1792451083001' || parsed.ruc === '0954594636001' || parsed.razonSocial === 'VALLE PLUA JHONNY ALEXIS') {
            setConfig(DEFAULT_CONFIG);
            localStorage.setItem(configKey, JSON.stringify(DEFAULT_CONFIG));
          } else {
            setConfig(parsed);
          }
        }
      } catch {
        setConfig(DEFAULT_CONFIG);
      }
    } else {
      const initialConfig: EmitterConfig = empresaRuc
        ? {
            ...DEFAULT_CONFIG,
            ruc: empresaRuc,
            razonSocial: empresaNombre || '',
            nombreComercial: empresaNombre || '',
            empresaRuc: empresaRuc,
            empresaNombre: empresaNombre || '',
            correo: email || '',
            dirMatriz: '',
            dirEstablecimiento: '',
            ultimoSecuencialFactura: '000000001'
          }
        : email
        ? { ...DEFAULT_CONFIG, correo: email }
        : DEFAULT_CONFIG;

      localStorage.setItem(configKey, JSON.stringify(initialConfig));
      setConfig(initialConfig);
    }

    // 2. Clients - Start empty for clean tenants without dummy data leakage
    const savedClients = localStorage.getItem(clientsKey);
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch {
        setClients([]);
      }
    } else {
      setClients([]);
    }

    // 3. Products - Start empty for clean tenants without dummy data leakage
    const savedProducts = localStorage.getItem(productsKey);
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch {
        setProducts([]);
      }
    } else {
      setProducts([]);
    }

    // 4. Invoices History
    const savedInvoices = localStorage.getItem(invoicesKey);
    if (savedInvoices) {
      try {
        const parsed: Invoice[] = JSON.parse(savedInvoices);
        const filtered = parsed.filter(inv => inv.id !== 'seed-inv-1');
        setInvoices(filtered);
      } catch {
        setInvoices([]);
      }
    } else {
      setInvoices([]);
    }

    // 5. Credit notes history
    const savedCreditNotes = localStorage.getItem(creditNotesKey);
    if (savedCreditNotes) {
      try {
        setCreditNotes(JSON.parse(savedCreditNotes));
      } catch {
        setCreditNotes([]);
      }
    } else {
      setCreditNotes([]);
    }
  }, [currentUser]);

  // Real-time synchronization with Supabase
  useEffect(() => {
    let isMounted = true;

    const syncWithSupabase = async () => {
      // 0. Empresa Tenant
      if (currentUser?.empresaRuc) {
        const emp = await getEmpresaByRuc(currentUser.empresaRuc);
        if (emp && isMounted) {
          setCurrentEmpresa(emp);
        }
      }

      // 1. Clients
      const dbClients = await fetchClientsFromSupabase(currentUser?.correo, currentUser?.role, currentUser?.empresaRuc);
      if (dbClients && isMounted) {
        setClients(dbClients);
        const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbClients));
      }

      // 2. Products
      const dbProducts = await fetchProductsFromSupabase(currentUser?.correo, currentUser?.role, currentUser?.empresaRuc);
      if (dbProducts && isMounted) {
        setProducts(dbProducts);
        const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbProducts));
      }

      // 3. Invoices
      const dbInvoices = await fetchInvoicesFromSupabase(currentUser?.correo, currentUser?.role, currentUser?.empresaRuc);
      if (dbInvoices && isMounted) {
        setInvoices(dbInvoices);
        const key = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbInvoices));
      }

      // 4. Credit Notes
      const dbCreditNotes = await fetchCreditNotesFromSupabase(currentUser?.correo, currentUser?.role, currentUser?.empresaRuc);
      if (dbCreditNotes && isMounted) {
        setCreditNotes(dbCreditNotes);
        const key = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbCreditNotes));
      }

      // 5. Config
      const dbConfig = await fetchEmitterConfigFromSupabase(currentUser?.empresaRuc, currentUser?.correo, currentUser?.role, currentUser?.empresaRuc);
      if (dbConfig && dbConfig.ruc && isMounted) {
        if (!currentUser?.empresaRuc || dbConfig.ruc === currentUser.empresaRuc || dbConfig.empresaRuc === currentUser.empresaRuc) {
          setConfig(dbConfig);
          const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
          localStorage.setItem(key, JSON.stringify(dbConfig));
        }
      } else if (!dbConfig && isMounted) {
        // If no config found in Supabase for this company, set clean initial state with company basics
        if (currentUser?.empresaRuc) {
          const cleanCompanyCfg: EmitterConfig = {
            ...DEFAULT_CONFIG,
            ruc: currentUser.empresaRuc,
            razonSocial: currentUser.empresaNombre || '',
            nombreComercial: currentUser.empresaNombre || '',
            empresaRuc: currentUser.empresaRuc,
            empresaNombre: currentUser.empresaNombre || '',
            correo: currentUser.correo || '',
            dirMatriz: '',
            dirEstablecimiento: '',
            ultimoSecuencialFactura: '000000001'
          };
          setConfig(cleanCompanyCfg);
          const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
          localStorage.setItem(key, JSON.stringify(cleanCompanyCfg));
        }
      }
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
  }, [currentUser?.correo, currentUser?.empresaRuc, currentUser?.role]);

    // Redirect to permitted tab for USER role or non-SUPERADMIN on restricted options
  useEffect(() => {
    if ((activeTab === 'supabase' || activeTab === 'tenants') && currentUser?.role?.toUpperCase() !== 'SUPERADMIN') {
      setActiveTab('history');
      return;
    }
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
    saveEmitterConfigToSupabase(newConfig, currentUser?.correo);
    if (currentUser) {
      logActivity(
        currentUser,
        'Modificación de Perfil/Firma',
        `Parámetros SRI actualizados. Razón Social: ${newConfig.razonSocial}, RUC: ${newConfig.ruc}`
      );
    }
  };

  const handleAddClient = (client: Client) => {
    const clientWithEmpresa: Client = {
      ...client,
      empresaRuc: currentUser?.empresaRuc || client.empresaRuc,
      empresaNombre: currentUser?.empresaNombre || client.empresaNombre
    };
    const updated = [clientWithEmpresa, ...clients];
    setClients(updated);
    const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
    localStorage.setItem(key, JSON.stringify(updated));
    saveClientToSupabase(clientWithEmpresa, currentUser?.correo);
  };

  const handleAddProduct = (product: Product) => {
    const productWithEmpresa: Product = {
      ...product,
      empresaRuc: currentUser?.empresaRuc || product.empresaRuc,
      empresaNombre: currentUser?.empresaNombre || product.empresaNombre
    };
    const updated = [productWithEmpresa, ...products];
    setProducts(updated);
    const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
    localStorage.setItem(key, JSON.stringify(updated));
    saveProductToSupabase(productWithEmpresa, currentUser?.correo);
  };

  const handleAddInvoice = (invoice: Invoice) => {
    // 1. Check Company Plan & Status Limit
    if (currentEmpresa) {
      if (currentEmpresa.estado === 'SUSPENDIDO') {
        alert(`❌ Emisión Bloqueada: La empresa "${currentEmpresa.razonSocial}" está SUSPENDIDA.\n\nPor favor contacte al SUPERADMIN para restablecer el servicio.`);
        return;
      }
      if (new Date(currentEmpresa.fechaExpiracion) < new Date()) {
        alert(`❌ Emisión Bloqueada: El plan de la empresa "${currentEmpresa.razonSocial}" expiró el ${currentEmpresa.fechaExpiracion}.\n\nContacte al SUPERADMIN para renovar el plan.`);
        return;
      }
      const totalDocuments = invoices.length + creditNotes.length;
      if (currentEmpresa.limiteComprobantes && totalDocuments >= currentEmpresa.limiteComprobantes) {
        alert(`❌ Límite de Plan Alcanzado: Ha emitido ${totalDocuments} de ${currentEmpresa.limiteComprobantes} comprobantes permitidos para "${currentEmpresa.razonSocial}".\n\nContacte al SUPERADMIN para ampliar el cupo.`);
        return;
      }
    }

    // Append the operator name and company context as developer/creator of the document
    const invoiceWithCreator: Invoice = {
      ...invoice,
      creadorNombre: currentUser ? (currentUser.nombre || currentUser.correo.split('@')[0].toUpperCase()) : 'ADMINISTRADOR',
      usuarioCorreo: currentUser?.correo,
      empresaRuc: currentUser?.empresaRuc || currentEmpresa?.ruc,
      empresaNombre: currentUser?.empresaNombre || currentEmpresa?.nombreComercial || currentEmpresa?.razonSocial || config.nombreComercial || config.razonSocial
    };
    const updated = [invoiceWithCreator, ...invoices];
    setInvoices(updated);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
    localStorage.setItem(invoicesKey, JSON.stringify(updated));
    saveInvoiceToSupabase(invoiceWithCreator, currentUser?.correo);

    // Log the event
    if (currentUser) {
      logActivity(
        currentUser,
        'Generación de Factura',
        `Factura #${invoice.secuencial} creada para ${invoice.cliente.nombre}. Total: ${invoice.resumenImpuestos.total.toFixed(2)}. Estado: ${invoice.estado}`
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
    saveEmitterConfigToSupabase(updatedConfig, currentUser?.correo);
  };

  const handleUpdateInvoice = (id: string, updatedParams: Partial<Invoice>) => {
    const updatedInvs = invoices.map(inv => {
      if (inv.id === id) {
        const newInv = { ...inv, ...updatedParams, usuarioCorreo: currentUser?.correo };
        saveInvoiceToSupabase(newInv, currentUser?.correo);
        return newInv;
      }
      return inv;
    });
    setInvoices(updatedInvs);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
    localStorage.setItem(invoicesKey, JSON.stringify(updatedInvs));
  };

  const handleAddCreditNote = (nc: CreditNote) => {
    // 1. Check Company Plan & Status Limit
    if (currentEmpresa) {
      if (currentEmpresa.estado === 'SUSPENDIDO') {
        alert(`❌ Emisión Bloqueada: La empresa "${currentEmpresa.razonSocial}" está SUSPENDIDA.\n\nPor favor contacte al SUPERADMIN para restablecer el servicio.`);
        return;
      }
      if (new Date(currentEmpresa.fechaExpiracion) < new Date()) {
        alert(`❌ Emisión Bloqueada: El plan de la empresa "${currentEmpresa.razonSocial}" expiró el ${currentEmpresa.fechaExpiracion}.\n\nContacte al SUPERADMIN para renovar el plan.`);
        return;
      }
      const totalDocuments = invoices.length + creditNotes.length;
      if (currentEmpresa.limiteComprobantes && totalDocuments >= currentEmpresa.limiteComprobantes) {
        alert(`❌ Límite de Plan Alcanzado: Ha emitido ${totalDocuments} de ${currentEmpresa.limiteComprobantes} comprobantes permitidos para "${currentEmpresa.razonSocial}".\n\nContacte al SUPERADMIN para ampliar el cupo.`);
        return;
      }
    }

    // Append the operator name and company context
    const ncWithCreator: CreditNote = {
      ...nc,
      creadorNombre: currentUser ? (currentUser.nombre || currentUser.correo.split('@')[0].toUpperCase()) : 'ADMINISTRADOR',
      usuarioCorreo: currentUser?.correo,
      empresaRuc: currentUser?.empresaRuc || currentEmpresa?.ruc,
      empresaNombre: currentUser?.empresaNombre || currentEmpresa?.nombreComercial || currentEmpresa?.razonSocial || config.nombreComercial || config.razonSocial
    };
    const updated = [ncWithCreator, ...creditNotes];
    setCreditNotes(updated);
    const cnKey = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
    localStorage.setItem(cnKey, JSON.stringify(updated));
    saveCreditNoteToSupabase(ncWithCreator, currentUser?.correo);

    // Log the event
    if (currentUser) {
      logActivity(
        currentUser,
        'Generación de Nota de Crédito',
        `Nota de Crédito #${nc.secuencial} creada para cliente ${nc.cliente.nombre}. Total: ${nc.resumenImpuestos.total.toFixed(2)}. Estado: ${nc.estado}`
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
          setInactivityNotice(null);
          setCurrentUser(user);
          localStorage.setItem('sri_portal_active_user', JSON.stringify(user));
        }}
        adminEmail={config.correo || 'jhonnyVP5@gmail.com'}
        inactivityNotice={inactivityNotice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/75 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 px-4 sm:px-6 py-3.5 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* LOGO & COMPANY NAME */}
          <div className="flex items-center gap-3 shrink-0">
            {/* BUTTON HAMBURGER MENU (LEFT SIDE) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition border border-gray-200 dark:border-zinc-800 cursor-pointer shrink-0"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* LOGO DE LA EMPRESA O ICONO PREDETERMINADO */}
            <div className="relative cursor-pointer group transition-transform duration-200 hover:scale-105 shrink-0 flex items-center">
              {config.logoB64 ? (
                <img
                  src={config.logoB64}
                  alt="Logo Empresa"
                  className="w-10 h-10 object-contain rounded-xl border border-gray-200 dark:border-zinc-700 bg-white p-0.5 shadow-2xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
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
              )}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wide text-gray-900 dark:text-white leading-tight uppercase flex items-center gap-1.5">
                {config.nombreComercial ? (
                  <span>{config.nombreComercial}</span>
                ) : currentUser?.empresaNombre ? (
                  <span>{currentUser.empresaNombre}</span>
                ) : (
                  <span>JOLUS <span className="text-sky-500 font-semibold">SERVICES</span></span>
                )}
              </h1>
              <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest leading-none block">
                Facturación Electrónica SRI
              </span>
            </div>
          </div>

          {/* DESKTOP HEADER ACTIONS (MIDDLE BANNER + USER SESSION) */}
          <div className="hidden lg:flex items-center gap-4">
            {/* ACTIVE TENANT / EMITTER PREVIEW BANNER */}
            <div className="flex items-center gap-3.5 text-xs font-mono bg-slate-50/90 dark:bg-zinc-800/80 p-2 px-4 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 dark:text-zinc-400 font-medium">RUC:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-100 tracking-wider">
                  {currentUser?.empresaRuc || config.ruc || '---'}
                </span>
              </div>
              
              <div className="h-4 border-l border-slate-200 dark:border-zinc-700" />
              
              <div className="font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-tight truncate max-w-[220px] xl:max-w-[320px]" title={currentUser?.empresaNombre || config.razonSocial || 'EMPRESA INQUILINO'}>
                {currentUser?.empresaNombre || config.razonSocial || 'EMPRESA INQUILINO'}
              </div>
              
              <div className="h-4 border-l border-slate-200 dark:border-zinc-700" />
              
              <div className={`font-bold flex items-center gap-1.5 text-[11px] whitespace-nowrap ${config.isDemoMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                <span className={`w-2 h-2 rounded-full ${config.isDemoMode ? 'bg-indigo-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span>● {config.isDemoMode ? 'SIMULADOR SRI' : 'CONEXIÓN SRI'}</span>
              </div>
            </div>

            {/* SESIÓN USUARIO (NOMBRE, CORREO DEBAJO Y BOTÓN SALIR) */}
            {currentUser && (
              <div className="flex items-center gap-3.5 bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 p-1.5 pl-3.5 pr-2.5 rounded-xl shadow-2xs text-xs">
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="block text-xs font-black uppercase text-slate-900 dark:text-zinc-100 tracking-tight truncate max-w-[150px]" title={currentUser.nombre || currentUser.correo}>
                      {currentUser.nombre || currentUser.correo.split('@')[0].toUpperCase()}
                    </span>
                    <span className={`inline-block font-mono text-[9px] font-black uppercase tracking-wider ${currentUser.role === 'SUPERADMIN' ? 'text-purple-600 dark:text-purple-400' : currentUser.role === 'ADMIN' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      • {currentUser.role}
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-slate-500 dark:text-zinc-400 font-medium truncate max-w-[180px] mt-0.5 leading-tight" title={currentUser.correo}>
                    {currentUser.correo}
                  </span>
                </div>
                
                <div className="h-6 border-l border-slate-200 dark:border-zinc-700" />
                
                <button
                  onClick={handleManualLogout}
                  className="px-3 py-1 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-lg border border-slate-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs"
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
            <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-zinc-850 mb-3 text-xs text-left shadow-2xs">
              <div className="font-bold text-gray-400 dark:text-zinc-500 text-[10px] uppercase mb-1">EMPRESA / INQUILINO:</div>
              <div className="font-extrabold text-gray-800 dark:text-white truncate" title={config.razonSocial || currentUser?.empresaNombre}>
                {config.razonSocial || currentUser?.empresaNombre || 'EMPRESA INQUILINO'}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono mt-0.5">
                RUC: {config.ruc || currentUser?.empresaRuc || '0000000000001'}
              </div>
              <div className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded-lg border border-emerald-100/40 dark:border-emerald-900/30">
                <span className={`w-2 h-2 rounded-full ${config.isDemoMode ? 'bg-indigo-500' : 'bg-emerald-500 animate-pulse'}`} />
                {config.isDemoMode ? 'SIMULADOR SRI' : 'CONEXIÓN SRI'}
              </div>
            </div>

            {/* USER REQUISITES IN MOBILE DRAWER */}
            {currentUser && (
              <div className="bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 mb-4 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9.5px] font-black text-slate-800 dark:text-zinc-200 uppercase tracking-tight truncate">
                    {currentUser.nombre || currentUser.correo.split('@')[0].toUpperCase()}
                  </span>
                  <span className="text-[9px] font-black uppercase font-mono text-amber-600 dark:text-amber-400">
                    • {currentUser.role}
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-500 dark:text-zinc-400 font-medium truncate">
                  {currentUser.correo}
                </div>
                {currentUser.empresaNombre && (
                  <div className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-bold truncate mt-1">
                    🏢 {currentUser.empresaNombre}
                  </div>
                )}
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

              {currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
                <button
                  onClick={() => {
                    setActiveTab('tenants');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer ${activeTab === 'tenants' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                >
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  Empresas / Inquilinos
                </button>
              )}

              {currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
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
                  onClick={handleManualLogout}
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
        
        {/* DESKTOP TABS NAVBAR (COMPACT, MODERN, MINIMALIST & TECH-FORWARD) */}
        <nav className="hidden lg:flex bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs max-w-7xl mx-auto print:hidden items-center justify-start xl:justify-center overflow-x-auto no-scrollbar gap-1 animate-fade-in scroll-smooth">
          
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('history')) && (
            <button
               onClick={() => setActiveTab('history')}
               className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'history' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Historial</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('new-invoice')) && (
            <button
              onClick={() => setActiveTab('new-invoice')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'new-invoice' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Emitir Factura</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('proformas')) && (
            <button
              onClick={() => setActiveTab('proformas')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'proformas' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Proforma</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('new-nc')) && (
            <button
              onClick={() => setActiveTab('new-nc')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'new-nc' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>Nota Crédito</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('products')) && (
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'products' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Productos</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('clients')) && (
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'clients' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Clientes</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('profile')) && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'profile' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Mi Perfil</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' || userPermissions.includes('settings')) && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'settings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Configuración</span>
            </button>
          )}

          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'users' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Usuarios</span>
            </button>
          )}

          {currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'tenants' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <Building2 className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>Empresas</span>
            </button>
          )}

          {currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
            <button
              onClick={() => setActiveTab('supabase')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${activeTab === 'supabase' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs shadow-indigo-500/20' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/60'}`}
            >
              <Database className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Supabase</span>
            </button>
          )}
          
        </nav>         

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
              currentUser={currentUser}
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
              currentUser={currentUser}
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
              currentUser={currentUser}
            />
          )}

          {activeTab === 'profile' && (
            <CompanyProfile
              config={config}
              onSaveConfig={handleSaveConfig}
              currentUserEmail={currentUser?.correo}
              currentUser={currentUser}
              invoices={invoices}
              creditNotes={creditNotes}
              onNavigateToSettings={() => setActiveTab('settings')}
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

          {activeTab === 'tenants' && currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
            <TenantManagement
              currentUser={currentUser}
            />
          )}

          {activeTab === 'supabase' && currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
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
