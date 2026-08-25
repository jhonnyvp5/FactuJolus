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
import RetentionManager from './components/RetentionManager';
import SuperadminCustomizer from './components/SuperadminCustomizer';
import DynamicContainerRenderer from './components/customContainers/DynamicContainerRenderer';
import { DynamicPlatformNavigation } from './components/navigation/DynamicPlatformNavigation';
import { usePlatformSettings } from './context/PlatformSettingsContext';
import { logActivity } from './lib/activityLogger';
import { modalAlert } from './context/ModalAlertContext';
import { 
  fetchClientsFromSupabase, saveClientToSupabase, deleteClientFromSupabase,
  fetchProductsFromSupabase, saveProductToSupabase, deleteProductFromSupabase,
  fetchInvoicesFromSupabase, saveInvoiceToSupabase, deleteInvoiceFromSupabase,
  fetchCreditNotesFromSupabase, saveCreditNoteToSupabase, deleteCreditNoteFromSupabase,
  fetchProformasFromSupabase, saveProformaToSupabase,
  fetchEmitterConfigFromSupabase, saveEmitterConfigToSupabase,
  fetchEmpresasFromSupabase, getEmpresaByRuc, getEmpresaForUser,
  migrateLocalDataToSupabase, subscribeToSupabaseRealtime
} from './lib/supabase';
import { ShieldCheck, Send, Settings, History, Plus, Layers, ArrowLeftRight, FileCheck2, CloudLightning, Package, User, Users, Menu, X, FileText, Database, Building2, RefreshCw, Palette, Sparkles, Megaphone } from 'lucide-react';

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
  const { settings, themeClasses, applyTenantMenuSettings } = usePlatformSettings();

  // Navigation tabs 'history' | 'new-invoice' | 'new-nc' | 'retentions' | 'products' | 'profile' | 'settings' | 'users' | 'proformas' | 'clients' | 'tenants' | 'supabase' | 'customizer'
  const [activeTab, setActiveTab ] = useState<'history' | 'new-invoice' | 'new-nc' | 'retentions' | 'products' | 'profile' | 'settings' | 'users' | 'proformas' | 'clients' | 'tenants' | 'supabase' | 'customizer'>('history');
  
  // Dynamic USER role permissions state
  const [userPermissions, setUserPermissions] = useState<string[]>(() => {
    const saved = localStorage.getItem('sri_portal_user_permissions');
    return saved ? JSON.parse(saved) : ['history', 'new-invoice', 'retentions', 'products', 'proformas', 'clients'];
  });

  // User Session Management
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => {
    const saved = localStorage.getItem('sri_portal_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.correo?.toLowerCase() === 'jhonnyvp5@gmail.com') {
          parsed.role = 'SUPERADMIN';
          if (!parsed.empresaRuc || parsed.empresaRuc === '0954594636001') {
            parsed.empresaRuc = '0952227858001';
            parsed.empresaNombre = 'ORIONNX';
          }
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
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
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
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
    let isReloading = false;

    const checkPlatformUpdate = async () => {
      if (isReloading) return;
      try {
        const response = await fetch(`/?_update=${Date.now()}`, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (!response.ok) return;
        const html = await response.text();
        if (!html || html.length < 200 || !html.includes('root')) return;

        const scripts = html.match(/<script[^>]*src=["']([^"']+)["']/g) || [];
        const signature = scripts.join('|');

        if (initialScriptSignature === null) {
          initialScriptSignature = signature;
        } else if (signature && signature !== initialScriptSignature) {
          console.log('[AutoUpdate] Nueva versión de plataforma detectada. Aplicando actualización...');
          isReloading = true;
          setIsApplyingUpdate(true);

          // Save active session data to localStorage before updating
          if (currentUser) {
            localStorage.setItem('sri_portal_active_user', JSON.stringify(currentUser));
          }

          // Small pause for user feedback and server bundle stabilization
          setTimeout(() => {
            window.location.replace(window.location.pathname + '?_v=' + Date.now());
          }, 450);
        }
      } catch {
        // Network error ignored
      }
    };

    checkPlatformUpdate();
    const interval = setInterval(checkPlatformUpdate, 20000);

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
  }, [currentUser]);

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
      let emp: EmpresaTenant | null = null;
      const currentRuc = currentUser?.empresaRuc;
      if (currentRuc) {
        emp = await getEmpresaByRuc(currentRuc);
      }
      if (!emp && currentUser?.correo) {
        emp = await getEmpresaForUser(currentUser.correo, currentRuc);
        if (emp && isMounted) {
          const updatedUser: PortalUser = {
            ...currentUser,
            empresaRuc: emp.ruc,
            empresaNombre: emp.nombreComercial || emp.razonSocial
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('sri_portal_active_user', JSON.stringify(updatedUser));
        }
      }

      if (emp && isMounted) {
        setCurrentEmpresa(emp);
        if (currentUser?.role?.toUpperCase() !== 'SUPERADMIN' && currentUser?.correo?.toLowerCase() !== 'jhonnyvp5@gmail.com') {
          if (emp.estado === 'SUSPENDIDO' || new Date(emp.fechaExpiracion) < new Date()) {
            setInactivityNotice(`El servicio de la empresa "${emp.nombreComercial || emp.razonSocial}" expiró el ${emp.fechaExpiracion} o está suspendido. Por favor contacte al Administrador.`);
            setCurrentUser(null);
            localStorage.removeItem('sri_portal_active_user');
          }
        }
      }

      const activeEmpresaRuc = emp?.ruc || currentUser?.empresaRuc;
      const activeEmpresaNombre = emp?.nombreComercial || emp?.razonSocial || currentUser?.empresaNombre;

      if (activeEmpresaRuc) {
        applyTenantMenuSettings(activeEmpresaRuc);
      }

      // 1. Clients
      const dbClients = await fetchClientsFromSupabase(currentUser?.correo, currentUser?.role, activeEmpresaRuc);
      if (dbClients && isMounted) {
        setClients(dbClients);
        const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbClients));
      }

      // 2. Products
      const dbProducts = await fetchProductsFromSupabase(currentUser?.correo, currentUser?.role, activeEmpresaRuc);
      if (dbProducts && isMounted) {
        setProducts(dbProducts);
        const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbProducts));
      }

      // 3. Invoices
      const dbInvoices = await fetchInvoicesFromSupabase(currentUser?.correo, currentUser?.role, activeEmpresaRuc);
      if (dbInvoices && isMounted) {
        setInvoices(dbInvoices);
        const key = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbInvoices));
      }

      // 4. Credit Notes
      const dbCreditNotes = await fetchCreditNotesFromSupabase(currentUser?.correo, currentUser?.role, activeEmpresaRuc);
      if (dbCreditNotes && isMounted) {
        setCreditNotes(dbCreditNotes);
        const key = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
        localStorage.setItem(key, JSON.stringify(dbCreditNotes));
      }

      // 5. Config
      const dbConfig = await fetchEmitterConfigFromSupabase(activeEmpresaRuc, currentUser?.correo, currentUser?.role, activeEmpresaRuc);
      if (dbConfig && dbConfig.ruc && isMounted) {
        if (!activeEmpresaRuc || dbConfig.ruc === activeEmpresaRuc || dbConfig.empresaRuc === activeEmpresaRuc) {
          setConfig(dbConfig);
          const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
          localStorage.setItem(key, JSON.stringify(dbConfig));
        }
      } else if (!dbConfig && isMounted) {
        // If no config found in Supabase for this company, set clean initial state with company basics
        if (activeEmpresaRuc) {
          const cleanCompanyCfg: EmitterConfig = {
            ...DEFAULT_CONFIG,
            ruc: activeEmpresaRuc,
            razonSocial: activeEmpresaNombre || '',
            nombreComercial: activeEmpresaNombre || '',
            empresaRuc: activeEmpresaRuc,
            empresaNombre: activeEmpresaNombre || '',
            correo: currentUser?.correo || emp?.adminCorreo || '',
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
        modalAlert.error('Emisión Bloqueada', `La empresa "${currentEmpresa.razonSocial}" está SUSPENDIDA.\nPor favor contacte al SUPERADMIN para restablecer el servicio.`);
        return;
      }
      if (new Date(currentEmpresa.fechaExpiracion) < new Date()) {
        modalAlert.error('Plan Expirado', `El plan de la empresa "${currentEmpresa.razonSocial}" expiró el ${currentEmpresa.fechaExpiracion}.\nContacte al SUPERADMIN para renovar el plan.`);
        return;
      }
      const totalDocuments = invoices.length + creditNotes.length;
      if (currentEmpresa.limiteComprobantes && totalDocuments >= currentEmpresa.limiteComprobantes) {
        modalAlert.warning('Límite de Plan Alcanzado', `Ha emitido ${totalDocuments} de ${currentEmpresa.limiteComprobantes} comprobantes permitidos para "${currentEmpresa.razonSocial}".\nContacte al SUPERADMIN para ampliar el cupo.`);
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
    
    // Check if an invoice with the same ID or same secuencial already exists in state
    const existingIndex = invoices.findIndex(i => i.id === invoice.id || (i.secuencial === invoice.secuencial && i.estado === 'Borrador'));
    let updated: Invoice[];
    if (existingIndex >= 0) {
      updated = [...invoices];
      updated[existingIndex] = invoiceWithCreator;
    } else {
      updated = [invoiceWithCreator, ...invoices];
    }
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
        modalAlert.error('Emisión Bloqueada', `La empresa "${currentEmpresa.razonSocial}" está SUSPENDIDA.\nPor favor contacte al SUPERADMIN para restablecer el servicio.`);
        return;
      }
      if (new Date(currentEmpresa.fechaExpiracion) < new Date()) {
        modalAlert.error('Plan Expirado', `El plan de la empresa "${currentEmpresa.razonSocial}" expiró el ${currentEmpresa.fechaExpiracion}.\nContacte al SUPERADMIN para renovar el plan.`);
        return;
      }
      const totalDocuments = invoices.length + creditNotes.length;
      if (currentEmpresa.limiteComprobantes && totalDocuments >= currentEmpresa.limiteComprobantes) {
        modalAlert.warning('Límite de Plan Alcanzado', `Ha emitido ${totalDocuments} de ${currentEmpresa.limiteComprobantes} comprobantes permitidos para "${currentEmpresa.razonSocial}".\nContacte al SUPERADMIN para ampliar el cupo.`);
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

    // Check if a credit note with the same ID or same secuencial already exists in state
    const existingIndex = creditNotes.findIndex(c => c.id === nc.id || (c.secuencial === nc.secuencial && c.estado === 'Borrador'));
    let updated: CreditNote[];
    if (existingIndex >= 0) {
      updated = [...creditNotes];
      updated[existingIndex] = ncWithCreator;
    } else {
      updated = [ncWithCreator, ...creditNotes];
    }
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

  const handleDeleteInvoice = (id: string, secuencial?: string, claveAcceso?: string) => {
    const inv = invoices.find(i => i.id === id);
    const targetSeq = secuencial || inv?.secuencial;
    const targetClave = claveAcceso || inv?.claveAcceso;
    const filtered = invoices.filter(i => i.id !== id);
    setInvoices(filtered);
    const invoicesKey = getUserStorageKey(STORAGE_KEYS.INVOICES, currentUser?.correo);
    localStorage.setItem(invoicesKey, JSON.stringify(filtered));
    deleteInvoiceFromSupabase(
      id,
      targetSeq,
      targetClave,
      config.codEstablecimiento || '001',
      config.codPuntoEmision || '001'
    );
    if (currentUser && targetSeq) {
      logActivity(
        currentUser,
        'Eliminación de Factura',
        `Factura #${targetSeq} eliminada del sistema junto con sus archivos PDF y XMLs en Storage.`
      );
    }
  };

  const handleDeleteCreditNote = (id: string, secuencial?: string, claveAcceso?: string) => {
    const nc = creditNotes.find(n => n.id === id);
    const targetSeq = secuencial || nc?.secuencial;
    const targetClave = claveAcceso || nc?.claveAcceso;
    const filtered = creditNotes.filter(n => n.id !== id);
    setCreditNotes(filtered);
    const cnKey = getUserStorageKey(STORAGE_KEYS.CREDIT_NOTES, currentUser?.correo);
    localStorage.setItem(cnKey, JSON.stringify(filtered));
    deleteCreditNoteFromSupabase(
      id,
      targetSeq,
      targetClave,
      config.codEstablecimiento || '001',
      config.codPuntoEmision || '001'
    );
    if (currentUser && targetSeq) {
      logActivity(
        currentUser,
        'Eliminación de Nota de Crédito',
        `Nota de Crédito #${targetSeq} eliminada del sistema junto con sus archivos PDF y XMLs en Storage.`
      );
    }
  };

  const handleSelectCompany = async (emp: EmpresaTenant) => {
    setCurrentEmpresa(emp);
    if (currentUser) {
      const updatedUser: PortalUser = {
        ...currentUser,
        empresaRuc: emp.ruc,
        empresaNombre: emp.nombreComercial || emp.razonSocial
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('sri_portal_active_user', JSON.stringify(updatedUser));
    }
    const dbConfig = await fetchEmitterConfigFromSupabase(emp.ruc, currentUser?.correo, currentUser?.role, emp.ruc);
    if (dbConfig && (dbConfig.ruc === emp.ruc || dbConfig.empresaRuc === emp.ruc)) {
      setConfig(dbConfig);
      const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
      localStorage.setItem(key, JSON.stringify(dbConfig));
    } else {
      const cleanEmpConfig: EmitterConfig = {
        ...DEFAULT_CONFIG,
        ruc: emp.ruc,
        razonSocial: emp.razonSocial,
        nombreComercial: emp.nombreComercial || emp.razonSocial,
        empresaRuc: emp.ruc,
        empresaNombre: emp.nombreComercial || emp.razonSocial,
        correo: currentUser?.correo || emp.adminCorreo || '',
        dirMatriz: '',
        dirEstablecimiento: '',
        ultimoSecuencialFactura: '000000001'
      };
      setConfig(cleanEmpConfig);
      const key = getUserStorageKey(STORAGE_KEYS.CONFIG, currentUser?.correo);
      localStorage.setItem(key, JSON.stringify(cleanEmpConfig));
    }
    setActiveTab('new-invoice');
  };

  if (!currentUser) {
    return (
      <>
        {isApplyingUpdate && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400/30 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
            <div className="text-xs font-bold">
              Nueva versión detectada. Actualizando aplicación automáticamente...
            </div>
          </div>
        )}
        <LoginForm
          onLoginSuccess={async (user) => {
            setInactivityNotice(null);
            let finalUser = user.correo?.toLowerCase() === 'jhonnyvp5@gmail.com' 
              ? { ...user, role: 'SUPERADMIN' as const, nombre: user.nombre || 'Jhonny Vargas' } 
              : user;
            if (!finalUser.empresaRuc) {
              const emp = await getEmpresaForUser(finalUser.correo, finalUser.empresaRuc);
              if (emp) {
                finalUser = {
                  ...finalUser,
                  empresaRuc: emp.ruc,
                  empresaNombre: emp.nombreComercial || emp.razonSocial
                };
              } else if (finalUser.correo?.toLowerCase() === 'jhonnyvp5@gmail.com') {
                finalUser = {
                  ...finalUser,
                  empresaRuc: '0952227858001',
                  empresaNombre: 'ORIONNX'
                };
              }
            }
            setCurrentUser(finalUser);
            localStorage.setItem('sri_portal_active_user', JSON.stringify(finalUser));
          }}
          adminEmail={'jhonnyvp5@gmail.com'}
          inactivityNotice={inactivityNotice}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/75 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 relative">
      {/* Injected Custom CSS from Superadmin Customizer */}
      {settings.customCss && (
        <style id="sri-custom-injected-css">
          {settings.customCss}
        </style>
      )}

      {isApplyingUpdate && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400/30 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
          <div className="text-xs font-bold">
            Nueva versión detectada. Actualizando aplicación automáticamente...
          </div>
        </div>
      )}
      
      {/* GLOBAL ANNOUNCEMENT BANNER (CONFIGURED BY SUPERADMIN) */}
      {settings.topBanner?.enabled && settings.topBanner.message && (
        <div className={`w-full py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors ${
          settings.topBanner.badgeColor === 'amber'
            ? 'bg-amber-500 text-amber-950 border-b border-amber-600/30'
            : settings.topBanner.badgeColor === 'rose'
            ? 'bg-red-600 text-white border-b border-red-700'
            : settings.topBanner.badgeColor === 'emerald'
            ? 'bg-emerald-600 text-white border-b border-emerald-700'
            : 'bg-blue-600 text-white border-b border-blue-700'
        }`}>
          <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
          {settings.topBanner.badgeText && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/20 text-white tracking-wider">
              {settings.topBanner.badgeText}
            </span>
          )}
          <span>{settings.topBanner.message}</span>
          {settings.topBanner.linkText && settings.topBanner.linkUrl && (
            <a
              href={settings.topBanner.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 ml-2 hover:opacity-80 font-bold"
            >
              {settings.topBanner.linkText}
            </a>
          )}
        </div>
      )}

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
                {currentEmpresa?.nombreComercial ? (
                  <span>{currentEmpresa.nombreComercial}</span>
                ) : config.nombreComercial ? (
                  <span>{config.nombreComercial}</span>
                ) : currentUser?.empresaNombre ? (
                  <span>{currentUser.empresaNombre}</span>
                ) : currentEmpresa?.razonSocial ? (
                  <span>{currentEmpresa.razonSocial}</span>
                ) : config.razonSocial ? (
                  <span>{config.razonSocial}</span>
                ) : (
                  <span>ORIONNX <span className="text-sky-500 font-semibold">SERVICES</span></span>
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
          
          <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-white dark:bg-zinc-900 shadow-2xl p-5 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto transform transition-transform duration-200 ease-out">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  {currentEmpresa?.nombreComercial || config.nombreComercial || currentUser?.empresaNombre || config.razonSocial || 'ORIONNX'}
                </span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 px-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DYNAMIC EMITTER IDENTIFIER IN MOBILE DRAWER */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 mb-3 text-xs text-left shadow-2xs">
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

            {/* DYNAMIC MENU TABS IN MOBILE DRAWER */}
            <div className="flex-1">
              <DynamicPlatformNavigation
                isMobileDrawer={true}
                activeTab={activeTab}
                onSelectTab={(tab) => setActiveTab(tab as any)}
                currentUser={currentUser}
                userPermissions={userPermissions}
                onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
              />
            </div>

            {/* EXIT BUTTON IN DRAWER */}
            {currentUser && (
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-4">
                <button
                  onClick={handleManualLogout}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-bold rounded-xl border border-red-200 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  Cerrar Sesión Activa
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CORE HUB LAYOUT WRAPPER SUPPORTING SIDEBAR / TOPBAR / ISLAND MODES */}
      <div className={`flex-1 flex flex-col lg:flex-row ${settings.menuLayout === 'sidebar-right' ? 'lg:flex-row-reverse' : ''} w-full min-h-0`}>
        
        {/* DESKTOP SIDEBAR (WHEN MENU LAYOUT IS SIDEBAR-LEFT OR SIDEBAR-RIGHT) */}
        {(settings.menuLayout === 'sidebar-left' || settings.menuLayout === 'sidebar-right') && (
          <aside className={`hidden lg:flex flex-col w-64 xl:w-72 shrink-0 bg-white dark:bg-zinc-900 ${settings.menuLayout === 'sidebar-right' ? 'border-l' : 'border-r'} border-slate-200 dark:border-zinc-800 p-4 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto z-30 shadow-xs`}>
            {/* Sidebar header */}
            <div className="pb-3 mb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest pl-1 mb-1">Menú del Sistema</div>
            </div>

            {/* Dynamic Navigation inside Sidebar */}
            <div className="flex-1">
              <DynamicPlatformNavigation
                layoutMode="sidebar-left"
                activeTab={activeTab}
                onSelectTab={(tab) => setActiveTab(tab as any)}
                currentUser={currentUser}
                userPermissions={userPermissions}
              />
            </div>
          </aside>
        )}

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* TOPBAR / FLOATING ISLAND / COMPACT DOCK NAVIGATION (WHEN NOT SIDEBAR) - AUTO-HIDES ON MOBILE & TABLET (< lg) */}
          {settings.menuLayout !== 'sidebar-left' && settings.menuLayout !== 'sidebar-right' && (
            <div className={`hidden lg:block sticky top-[64px] sm:top-[68px] z-30 transition-all ${
              settings.menuLayout === 'topbar-classic'
                ? 'bg-slate-100/90 dark:bg-zinc-950/90 backdrop-blur-md py-2.5 border-b border-slate-200/50 dark:border-zinc-800/50 shadow-xs'
                : settings.menuLayout === 'floating-island'
                ? 'py-3 pointer-events-none'
                : 'py-2'
            } ${
              settings.contentLayoutWidth === 'fluid'
                ? 'w-full px-2 sm:px-4'
                : settings.contentLayoutWidth === 'full-width'
                ? 'max-w-[1650px] w-full mx-auto px-4 sm:px-6'
                : settings.contentLayoutWidth === 'contained-sm'
                ? 'max-w-5xl w-full mx-auto px-4 sm:px-6'
                : 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8'
            }`}>
              <div className="pointer-events-auto">
                <DynamicPlatformNavigation
                  layoutMode={settings.menuLayout || 'topbar-classic'}
                  activeTab={activeTab}
                  onSelectTab={(tab) => setActiveTab(tab as any)}
                  currentUser={currentUser}
                  userPermissions={userPermissions}
                />
              </div>
            </div>
          )}

          {/* CORE HUB LAYOUT CONTENT CONTAINER */}
          <main className={`flex-1 ${
            settings.contentLayoutWidth === 'fluid'
              ? 'w-full px-2 sm:px-4'
              : settings.contentLayoutWidth === 'full-width'
              ? 'max-w-[1650px] w-full mx-auto px-4 sm:px-6'
              : settings.contentLayoutWidth === 'contained-sm'
              ? 'max-w-5xl w-full mx-auto px-4 sm:px-6'
              : 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8'
          } p-4 sm:p-6 lg:p-8 space-y-6`}>
            {/* TAB PORTALS */}
            <div className="transition-opacity duration-200">
              {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Dynamic Containers / Widgets configured in Diseño & Plataforma */}
              <DynamicContainerRenderer
                location="dashboard"
                onNavigateTab={(tab) => setActiveTab(tab as any)}
              />

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
            </div>
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

          {activeTab === 'retentions' && (
            <RetentionManager
              config={config}
              clients={clients}
              invoices={invoices}
              currentUser={currentUser}
              currentEmpresa={currentEmpresa}
              onAddClient={handleAddClient}
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
                const prodToDelete = products.find(p => p.id === id);
                const updated = products.filter(p => p.id !== id);
                setProducts(updated);
                const key = getUserStorageKey(STORAGE_KEYS.PRODUCTS, currentUser?.correo);
                localStorage.setItem(key, JSON.stringify(updated));
                if (prodToDelete) {
                  deleteProductFromSupabase(prodToDelete.id, prodToDelete.codigo);
                } else {
                  deleteProductFromSupabase(id);
                }
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
                const clientToDelete = clients.find(c => c.id === id);
                const updated = clients.filter(c => c.id !== id);
                setClients(updated);
                const key = getUserStorageKey(STORAGE_KEYS.CLIENTS, currentUser?.correo);
                localStorage.setItem(key, JSON.stringify(updated));
                if (clientToDelete) {
                  deleteClientFromSupabase(clientToDelete.id, clientToDelete.identificacion);
                } else {
                  deleteClientFromSupabase(id);
                }
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
              onCompanySelected={handleSelectCompany}
            />
          )}

          {activeTab === 'supabase' && currentUser?.role?.toUpperCase() === 'SUPERADMIN' && (
            <SupabaseExplorer />
          )}

          {activeTab === 'customizer' && (
            <SuperadminCustomizer 
              currentUserEmail={currentUser?.correo}
              currentUser={currentUser}
              currentUserRole={currentUser?.role}
              currentEmpresa={currentEmpresa}
            />
          )}
        </div>

      </main>

        </div>
      </div>

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
          <p>© 2026 ORIONNX • Sistema Tributario SRI</p>
          <p className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            XAdES-BES Firmado y Conexiones Offline Oficial de Ecuador SRI habilitadas.
          </p>
        </div>
      </footer>

    </div>
  );
}
