import React, { useRef, useState, useEffect } from 'react';
import { EmitterConfig, Invoice, Client, Product, PortalUser, EmpresaTenant, Proforma } from '../types';
import { 
  User, Image, FileText, CheckCircle, ShieldCheck, Landmark, Palette, Check, Settings, 
  Building2, Shield, Calendar, Layers, Users, FileCheck2, AlertCircle, AlertTriangle, 
  Sparkles, CheckCircle2, DollarSign, TrendingUp, Clock, HelpCircle, ArrowRight
} from 'lucide-react';
import RideViewer from './RideViewer';
import { 
  saveEmitterLogoToSupabase, 
  getEmpresaByRuc, 
  fetchEmpresasFromSupabase, 
  fetchUsersFromSupabase, 
  fetchProformasFromSupabase 
} from '../lib/supabase';
import { REGIMENES } from '../sri/utils';

const TEMPLATES = [
  { id: 'oficial', name: 'Oficial SRI (Clásico)', desc: 'Diseño clásico estandarizado idéntico al PDF del SRI con columnas alternadas', color: 'from-gray-700 to-gray-800' },
  { id: 'vibrant_indigo', name: 'Índigo Moderno', desc: 'Esquema moderno con degradados y diseño de alta definición', color: 'from-indigo-600 to-indigo-800' },
  { id: 'emerald_premium', name: 'Esmeralda Premium', desc: 'Detalles corporativos sofisticados con marcas ejecutivas', color: 'from-emerald-600 to-emerald-800' },
  { id: 'carmesi_bento', name: 'Carmesí Bento', desc: 'Estructuración modular de paneles con temática colorida', color: 'from-rose-600 to-rose-800' },
  { id: 'carbono_minimal', name: 'Carbono Minimal', desc: 'Minimalismo y estética suiza de líneas limpias', color: 'from-zinc-800 to-zinc-950' },
  { id: 'nordic_amber', name: 'Ámbar Nórdico', desc: 'Minimalismo escandinavo con acentos cálidos y un acabado editorial sobresaliente', color: 'from-amber-500 to-amber-600' },
  { id: 'executive_blue', name: 'Azul Ejecutivo', desc: 'Precisión técnica helvética con azul profundo y un ordenado impecable', color: 'from-blue-700 to-blue-900' },
  { id: 'cyber_neon', name: 'Mint Tech Futurista', desc: 'Estilo neon-mint de alta definición tecnológica, idóneo para agencias, software y startups', color: 'from-emerald-450 to-teal-500 bg-linear-to-r' },
  { id: 'warm_editorial', name: 'Editorial Terracota', desc: 'Inspiración arquitectónica y galerías con finos acentos terracota y espaciado de alta costura', color: 'from-orange-600 to-amber-800' },
  { id: 'slate_lux', name: 'Pizarra de Lujo', desc: 'Estética de platino metálico y carbón mate para consultorías de prestigio y firmas corporativas', color: 'from-slate-700 to-slate-900' }
];

interface CompanyProfileProps {
  config: EmitterConfig;
  onSaveConfig: (updatedConfig: EmitterConfig) => void;
  currentUserEmail?: string;
  currentUser?: PortalUser | null;
  invoices?: Invoice[];
  creditNotes?: any[];
  onNavigateToSettings?: () => void;
}

export default function CompanyProfile({ 
  config, 
  onSaveConfig, 
  currentUserEmail, 
  currentUser, 
  invoices = [], 
  creditNotes = [], 
  onNavigateToSettings 
}: CompanyProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logoB64 || null);
  const [showModelPreview, setShowModelPreview] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Plan & Multi-tenancy State
  const [empresaTenant, setEmpresaTenant] = useState<EmpresaTenant | null>(null);
  const [companyUsers, setCompanyUsers] = useState<PortalUser[]>([]);
  const [proformasCount, setProformasCount] = useState<number>(0);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);

  const getUserStorageKey = (baseKey: string) => {
    if (!currentUserEmail) return baseKey;
    const safeEmail = currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${baseKey}_user_${safeEmail}`;
  };

  const [activeTemplate, setActiveTemplate] = useState<string>(() => {
    return localStorage.getItem(getUserStorageKey('sri_ride_selected_template')) || 'oficial';
  });

  // Sync state if config changes
  useEffect(() => {
    setLogoPreview(config.logoB64 || null);
  }, [config.logoB64]);

  // Sync activeTemplate when user changes
  useEffect(() => {
    setActiveTemplate(localStorage.getItem(getUserStorageKey('sri_ride_selected_template')) || 'oficial');
  }, [currentUserEmail]);

  // Fetch plan & company metrics
  useEffect(() => {
    let isMounted = true;
    const loadPlanDetails = async () => {
      setLoadingPlan(true);
      try {
        const empRuc = currentUser?.empresaRuc || config.empresaRuc || config.ruc;
        let tenantData: EmpresaTenant | null = null;

        if (empRuc) {
          tenantData = await getEmpresaByRuc(empRuc);
        }

        if (!tenantData && currentUser?.role?.toUpperCase() === 'SUPERADMIN') {
          const allEmp = await fetchEmpresasFromSupabase();
          if (allEmp.length > 0) {
            tenantData = allEmp[0];
          }
        }

        // Fetch users for this company
        const usersList = await fetchUsersFromSupabase(
          currentUser?.correo, 
          currentUser?.role, 
          empRuc || currentUser?.empresaRuc
        );

        // Fetch proformas count
        const proformas = await fetchProformasFromSupabase(
          currentUser?.correo, 
          currentUser?.role, 
          empRuc || currentUser?.empresaRuc
        );

        if (isMounted) {
          setEmpresaTenant(tenantData);
          if (usersList) setCompanyUsers(usersList);
          if (proformas) setProformasCount(proformas.length);
        }
      } catch (err) {
        console.warn('Error cargando información de plan y empresa:', err);
      } finally {
        if (isMounted) setLoadingPlan(false);
      }
    };

    loadPlanDetails();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.empresaRuc, currentUser?.correo, currentUser?.role, config.ruc]);

  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    localStorage.setItem(getUserStorageKey('sri_ride_selected_template'), templateId);
  };

  // Handle file logo load
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande (máximo 2MB). Elige una imagen pequeña (.png, .jpg).');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Formato inválido. Elige un archivo de tipo imagen (.png, .jpeg, .jpg).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setLogoPreview(b64);
      const updated = {
        ...config,
        logoB64: b64,
        empresaRuc: config.empresaRuc || currentUser?.empresaRuc || config.ruc,
        empresaNombre: config.empresaNombre || currentUser?.empresaNombre || config.nombreComercial || config.razonSocial
      };
      onSaveConfig(updated);
      await saveEmitterLogoToSupabase(config.ruc || currentUser?.empresaRuc || '', b64, currentUser?.correo);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.onerror = () => {
      setUploadError('Error decodificando el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    const updated = {
      ...config,
      logoB64: undefined,
      empresaRuc: config.empresaRuc || currentUser?.empresaRuc || config.ruc,
      empresaNombre: config.empresaNombre || currentUser?.empresaNombre || config.nombreComercial || config.razonSocial
    };
    onSaveConfig(updated);
    await saveEmitterLogoToSupabase(config.ruc || currentUser?.empresaRuc || '', '', currentUser?.correo);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate a mock invoice structure for visualizing the "Modelo de Factura RIDE"
  const getMockInvoiceModel = (): Invoice => {
    const mockClient: Client = {
      id: 'c-mock',
      tipoIdentificacion: '05',
      identificacion: '1725619391',
      nombre: 'JUAN PÉREZ (CLIENTE MODELO DE PRUEBA)',
      direccion: 'Av. de los Shyris N34-102 y Portugal, Quito',
      telefono: '0995001000',
      correo: 'juan.perez@example.com'
    };

    const mockProduct1: Product = { id: 'p-m1', codigo: 'SOF-01', nombre: 'Servicio de Facturación Electrónica Integrada', precio: 80.00, ivaTipo: '4', descuentoDefault: 10 };
    const mockProduct2: Product = { id: 'p-m2', codigo: 'SOP-02', nombre: 'Soporte de Integración de Sistemas Especiales', precio: 20.00, ivaTipo: '0', descuentoDefault: 0 };

    return {
      id: 'mock-model-invoice',
      secuencial: '000000999',
      fechaEmision: new Date().toISOString().substring(0, 10),
      cliente: mockClient,
      detalles: [
        {
          id: 'dm-1',
          producto: mockProduct1,
          cantidad: 1,
          descuento: 10,
          subtotal: 70.00,
          ivaCalculado: 10.50, // 15% of 70
          total: 80.50
        },
        {
          id: 'dm-2',
          producto: mockProduct2,
          cantidad: 2,
          descuento: 0,
          subtotal: 40.00,
          ivaCalculado: 0.00,
          total: 40.00
        }
      ],
      formaPago: '20',
      plazo: 15,
      unidadTiempo: 'dias',
      claveAcceso: '1006202601' + config.ruc + config.ambiente + '0010010000009991234567812',
      estado: 'Autorizado',
      fechaAutorizacion: new Date().toISOString(),
      numeroAutorizacion: '1006202601' + config.ruc + config.ambiente + '0010010000009991234567812',
      mensajesSRI: [{ mensaje: 'AUTORIZADO', tipo: 'INFORMATIVO' }],
      infoAdicional: [
        { id: 'ia-1', nombre: 'Email', valor: 'example@example.com' },
        { id: 'ia-2', nombre: 'Observación', valor: 'Este es un comprobante modelo interactivo de visualización RIDE' }
      ],
      resumenImpuestos: {
        base0: 40.00,
        baseIva: 70.00,
        valorIva: 10.50,
        subtotal: 110.00,
        descuento: 10.00,
        total: 120.50
      }
    };
  };

  // Metrics Calculations
  const totalFacturas = invoices.length;
  const totalFacturasMonto = invoices.reduce((acc, inv) => acc + (inv.resumenImpuestos?.total || 0), 0);
  const totalNotasCredito = creditNotes.length;
  const totalNotasCreditoMonto = creditNotes.reduce((acc, nc) => acc + (nc.resumenImpuestos?.total || 0), 0);
  const totalProformas = proformasCount;
  const totalOtros = 0; // Notas de venta u otros comprobantes

  const totalComprobantesEmitidos = (empresaTenant?.comprobantesEmitidos !== undefined && empresaTenant.comprobantesEmitidos > 0)
    ? Math.max(empresaTenant.comprobantesEmitidos, totalFacturas + totalNotasCredito + totalProformas)
    : (totalFacturas + totalNotasCredito + totalProformas);

  const limiteComprobantes = empresaTenant?.limiteComprobantes || 100;
  const percentComprobantes = Math.min(100, Math.round((totalComprobantesEmitidos / limiteComprobantes) * 100));

  const totalUsuariosRegistrados = companyUsers.length > 0 
    ? companyUsers.length 
    : (empresaTenant?.usuariosRegistrados || 1);

  const limiteUsuarios = empresaTenant?.limiteUsuarios || 3;
  const percentUsuarios = Math.min(100, Math.round((totalUsuariosRegistrados / limiteUsuarios) * 100));

  // Determine expiration and status
  const fechaExpiracion = empresaTenant?.fechaExpiracion || '2027-12-31';
  const isExpired = new Date(fechaExpiracion) < new Date();
  const estadoPlan = isExpired ? 'VENCIDO' : (empresaTenant?.estado || 'ACTIVO');

  // Company Names: Commercial Name has absolute priority
  const displayNombreComercial = empresaTenant?.nombreComercial || config.nombreComercial || currentUser?.empresaNombre || empresaTenant?.razonSocial || config.razonSocial || 'EMPRESA INQUILINO';
  const displayRazonSocial = empresaTenant?.razonSocial || config.razonSocial || 'Razón Social No Especificada';
  const displayRuc = empresaTenant?.ruc || config.ruc || currentUser?.empresaRuc || '0000000000001';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in" id="company-profile-box">
      
      {/* HEADER BAR */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
            <User className="text-indigo-600 w-5.5 h-5.5" />
            Mi Perfil & Plan de Suscripción
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Información de la empresa, contabilidad detallada de comprobantes emitidos, usuarios asignados y personalización de RIDE.
          </p>
        </div>

        {/* Commercial Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-bold">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate max-w-[220px]" title={displayNombreComercial}>
            {displayNombreComercial}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TARJETA DE EMPRESA Y PLAN CONTRATADO (MOVIDA DESDE "EMPRESA" A "MI PERFIL") */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden" id="tenant-plan-card">
        
        {/* Top Banner / Plan Header */}
        <div className={`p-6 border-b ${
          estadoPlan === 'SUSPENDIDO' || isExpired 
            ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40' 
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-zinc-800'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  Plan Empresarial SRI Multi-Inquilino
                </span>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  estadoPlan === 'ACTIVO' && !isExpired
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                }`}>
                  {isExpired ? 'VENCIDO' : estadoPlan}
                </span>

                {currentUser?.role && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/10 text-zinc-200">
                    Rol: {currentUser.role}
                  </span>
                )}
              </div>

              {/* Primary Name: NOMBRE COMERCIAL */}
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-400 shrink-0" />
                <span>{displayNombreComercial}</span>
              </h3>

              {/* Subtitle with Razón Social & RUC */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 dark:text-zinc-300">
                <span>Razón Social Legal: <strong className="font-semibold text-white">{displayRazonSocial}</strong></span>
                <span>• RUC: <strong className="font-mono text-indigo-300">{displayRuc}</strong></span>
                {empresaTenant?.adminCorreo && (
                  <span>• Admin: <strong className="text-zinc-200">{empresaTenant.adminCorreo}</strong></span>
                )}
              </div>
            </div>

            {/* Expiration & Contract Validity Info */}
            <div className="bg-white/10 dark:bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-zinc-300 block">Vigencia del Plan</span>
              <div className="text-sm font-black font-mono mt-0.5 text-white flex items-center justify-end gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-300" />
                <span>{fechaExpiracion}</span>
              </div>
              <span className={`text-[10px] font-semibold block mt-0.5 ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isExpired ? '⚠️ Plan caducado' : '● Servicio activo y habilitado'}
              </span>
            </div>

          </div>
        </div>

        {/* Content Body: Accounting of Invoices, Notes, Proformas and Users */}
        <div className="p-6 space-y-6">
          
          {/* 1. SECCIÓN DE CONTABILIDAD Y EMISIÓN DE COMPROBANTES */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Contabilidad de Comprobantes Emitidos ({displayNombreComercial})
                </h4>
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                Consumo: <strong className="font-bold text-indigo-600 dark:text-indigo-400">{totalComprobantesEmitidos}</strong> de <strong className="font-bold">{limiteComprobantes}</strong> comprobantes contratados ({percentComprobantes}%)
              </span>
            </div>

            {/* Quota Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-zinc-700">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  percentComprobantes >= 90 
                    ? 'bg-rose-500' 
                    : percentComprobantes >= 70 
                    ? 'bg-amber-500' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                style={{ width: `${percentComprobantes}%` }}
              />
            </div>

            {/* Detailed Accounting Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              
              {/* Facturas */}
              <div className="bg-slate-50 dark:bg-zinc-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  📄 Facturas SRI
                </span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {totalFacturas}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ${totalFacturasMonto.toFixed(2)}
                </div>
              </div>

              {/* Notas de Crédito */}
              <div className="bg-slate-50 dark:bg-zinc-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  🔄 Notas de Crédito
                </span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {totalNotasCredito}
                </div>
                <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  -${totalNotasCreditoMonto.toFixed(2)}
                </div>
              </div>

              {/* Proformas */}
              <div className="bg-slate-50 dark:bg-zinc-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  📑 Proformas Cotizadas
                </span>
                <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {totalProformas}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Cotizaciones activas
                </div>
              </div>

              {/* Otros Comprobantes / Cupo Restante */}
              <div className="bg-slate-50 dark:bg-zinc-850 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  ⚡ Cupo Disponible
                </span>
                <div className="text-lg font-black text-gray-900 dark:text-white font-mono">
                  {Math.max(0, limiteComprobantes - totalComprobantesEmitidos)}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Comprobantes restantes
                </div>
              </div>

            </div>
          </div>

          {/* 2. SECCIÓN DE USUARIOS REGISTRADOS PARA ESTA EMPRESA */}
          <div className="border-t border-gray-100 dark:border-zinc-800 pt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Usuarios Registrados para {displayNombreComercial}
                </h4>
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                Ocupación: <strong className="font-bold text-indigo-600 dark:text-indigo-400">{totalUsuariosRegistrados}</strong> de <strong className="font-bold">{limiteUsuarios}</strong> usuarios permitidos ({percentUsuarios}%)
              </span>
            </div>

            {/* Registered Users Badges / Table */}
            {companyUsers.length === 0 ? (
              <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded-xl text-xs text-gray-500 text-center">
                1 usuario administrador activo ({currentUser?.correo || 'Usuario principal'})
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {companyUsers.map((usr) => (
                  <div 
                    key={usr.id || usr.correo}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-850 border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="truncate">
                      <div className="font-bold text-gray-900 dark:text-white truncate">
                        {usr.nombre || usr.correo.split('@')[0].toUpperCase()}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono truncate">
                        {usr.correo}
                      </div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate mt-0.5">
                        🏢 {displayNombreComercial}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                      usr.role === 'SUPERADMIN' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' 
                        : usr.role === 'ADMIN' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' 
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}>
                      {usr.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN DEL EMISOR TRIBUTARIO Y LOGOTIPO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LOGO ACTIONS BOX */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-800 pb-2 text-sm flex items-center gap-1.5">
              <Image className="w-4 h-4 text-indigo-600" />
              Logotipo Comercial ({displayNombreComercial})
            </h3>

            <div className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-gray-50/50 dark:bg-zinc-950/20 text-center relative overflow-hidden group">
              {logoPreview ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <img
                    src={logoPreview}
                    alt="Uploaded Logo Preview"
                    className="max-h-24 max-w-[80%] object-contain rounded-lg drop-shadow-sm transition"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[10px] text-red-500 hover:text-red-700 font-semibold underline cursor-pointer"
                  >
                    Quitar logotipo de la base
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 text-gray-400">
                  <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                    📷
                  </div>
                  <p className="text-[11px] font-semibold text-gray-600 dark:text-zinc-400">Sin logotipo comercial</p>
                  <p className="text-[9px] text-gray-400">Soporta formatos .jpg, .jpeg o .png (Máx 2MB)</p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="file-emit-logo"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition text-center text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                📥 Cargar Logo de Empresa
              </button>
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-500 font-medium bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100/50">
                ⚠️ {uploadError}
              </p>
            )}

            {uploadSuccess && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100/50 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> ¡Logotipo sincronizado!
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            <span className="text-[10px] text-gray-400 block leading-relaxed">
              El logotipo cargado se incrusta en el RIDE con el nombre comercial <strong className="text-gray-700 dark:text-zinc-300 font-semibold">{displayNombreComercial}</strong>.
            </span>
          </div>
        </div>

        {/* PROFILE VISUALIZATION TABLE & MODEL RIDE INVOICE TRIGGER */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 md:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-zinc-800 pb-2">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                <Landmark className="w-4.5 h-4.5 text-indigo-600" />
                Ficha del Emisor autorizada por el SRI
              </h3>
              {onNavigateToSettings && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN') && (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-400 rounded-lg transition flex items-center gap-1 cursor-pointer border border-indigo-200/50 dark:border-indigo-800/50"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Editar Emisor / Firma P12
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans leading-relaxed">
              
              {/* Nombre Comercial */}
              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 sm:col-span-2">
                <span className="text-indigo-500 dark:text-indigo-400 block font-bold text-[10px] uppercase">Nombre Comercial Principal</span>
                <span className="font-black text-gray-900 dark:text-white text-base">
                  {displayNombreComercial}
                </span>
              </div>

              {/* RUC */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">RUC / Identificación tributaria</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {displayRuc}
                </span>
              </div>

              {/* Régimen */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Régimen Impositivo</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {config.regimen ? (
                    REGIMENES.find(r => r.code === config.regimen)?.label || config.regimen.replace(/_/g, ' ')
                  ) : <em className="text-gray-400 font-normal italic">Sin registrar</em>}
                </span>
              </div>

              {/* Razón Social */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 sm:col-span-2">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Razón Social Legal</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {displayRazonSocial}
                </span>
              </div>

              {/* Dirección */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 sm:col-span-2">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Dirección Matriz / Oficinas</span>
                <span className="text-gray-700 dark:text-zinc-300">
                  {config.dirMatriz || <em className="text-gray-400 font-normal italic">Sin registrar</em>}
                </span>
              </div>

              {/* Punto de emisión */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Punto de Emisión configurado</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {config.codEstablecimiento || '001'}-{config.codPuntoEmision || '001'}
                </span>
              </div>

              {/* Obligado Contabilidad */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Obligado a llevar Contabilidad</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {config.obligadoContabilidad ? 'SÍ' : 'NO'}
                </span>
              </div>

              {/* Correo */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Correo Electrónico Emisor</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {config.correo || <em className="text-gray-400 font-normal italic">Sin registrar</em>}
                </span>
              </div>

              {/* Siguiente Secuencial */}
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Siguiente Secuencial Factura</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {config.ultimoSecuencialFactura || '000000001'}
                </span>
              </div>
            </div>
          </div>

          {/* VISUAL MODELO FACTURA ACTION */}
          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                  Visualizador de Documentos Electrónicos
                </h4>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Visualiza el formato RIDE de prueba que recibirán tus clientes usando el diseño: <strong className="text-indigo-600 dark:text-indigo-400">{TEMPLATES.find(t => t.id === activeTemplate)?.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModelPreview(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Visualizar RIDE Seleccionado ({TEMPLATES.find(t => t.id === activeTemplate)?.name})
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SECCIÓN DETALLADA DE SELECCIÓN DE DISEÑO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6" id="ride-design-selector-box">
        <div>
          <h3 className="text-lg font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
            <Palette className="text-indigo-600 w-5.5 h-5.5" />
            Configurar y Seleccionar Diseño de Factura RIDE
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Selecciona el diseño visual definitivo para tus comprobantes autorizados. El estilo escogido se reflejará instantáneamente en todas las facturas y notas de crédito en PDF, descargas de correo, y soportes físicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => {
            const isSelected = activeTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`group relative p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between h-40 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/20'
                    : 'border-gray-150 bg-white hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950/25 dark:hover:bg-zinc-900'
                }`}
              >
                {/* Visual palette indicators */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-xs text-gray-950 dark:text-gray-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition uppercase tracking-wide text-left">
                      {tmpl.name}
                    </span>
                    {isSelected ? (
                      <span className="bg-indigo-600 text-white p-1 rounded-full text-xs flex items-center justify-center w-5 h-5">
                        <Check className="w-3 h-3 font-bold" />
                      </span>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-zinc-700 hover:border-indigo-400 transition" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-400 leading-snug text-left">
                    {tmpl.desc}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-1.5">
                    {/* Visual representative bullets */}
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${tmpl.color}`} />
                    <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-zinc-700" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'
                  }`}>
                    {isSelected ? '✓ Activo' : 'Hacer Activo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL POPUP RIDE FOR MODEL PREVIEW */}
      {showModelPreview && (
        <RideViewer
          document={getMockInvoiceModel()}
          config={config}
          onClose={() => setShowModelPreview(false)}
        />
      )}

    </div>
  );
}
