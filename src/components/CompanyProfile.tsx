import React, { useRef, useState, useEffect } from 'react';
import { EmitterConfig, Invoice, Client, Product, PortalUser, EmpresaTenant, Proforma } from '../types';
import { 
  User, Image, FileText, CheckCircle, ShieldCheck, Landmark, Palette, Check, Settings, 
  Building2, Shield, Calendar, Layers, Users, FileCheck2, AlertCircle, AlertTriangle, 
  Sparkles, CheckCircle2, DollarSign, TrendingUp, Clock, HelpCircle, ArrowRight, PieChart as PieIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import RideViewer from './RideViewer';
import { 
  saveEmitterLogoToSupabase, 
  getEmpresaByRuc, 
  getEmpresaForUser,
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

        if (!tenantData) {
          tenantData = await getEmpresaForUser(currentUser?.correo, empRuc);
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
  const cupoDisponible = Math.max(0, limiteComprobantes - totalComprobantesEmitidos);
  const percentComprobantes = Math.min(100, Math.round((totalComprobantesEmitidos / limiteComprobantes) * 100));

  const totalUsuariosRegistrados = companyUsers.length > 0 
    ? companyUsers.length 
    : (empresaTenant?.usuariosRegistrados || 1);

  const limiteUsuarios = empresaTenant?.limiteUsuarios || 3;
  const percentUsuarios = Math.min(100, Math.round((totalUsuariosRegistrados / limiteUsuarios) * 100));

  // Determine expiration and status
  const fechaExpiracion = empresaTenant?.fechaExpiracion || '2027-07-30';

  // Calculate Days Remaining Countdown
  const calculateDaysRemaining = (expDateStr: string) => {
    if (!expDateStr) return 0;
    try {
      const parts = expDateStr.split('-');
      let targetDate: Date;
      if (parts.length === 3) {
        targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59);
      } else {
        targetDate = new Date(expDateStr);
      }
      const now = new Date();
      const diffTime = targetDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const diasRestantes = calculateDaysRemaining(fechaExpiracion);
  const isExpired = diasRestantes <= 0;
  const estadoPlan = isExpired ? 'VENCIDO' : (empresaTenant?.estado || 'ACTIVO');

  // Company Names: Commercial Name has absolute priority from Configuración del Emisor
  const displayNombreComercial = config.nombreComercial || empresaTenant?.nombreComercial || currentUser?.empresaNombre || config.razonSocial || empresaTenant?.razonSocial || 'EMPRESA INQUILINO';
  const displayRazonSocial = config.razonSocial || empresaTenant?.razonSocial || 'Razón Social No Especificada';
  const displayRuc = config.ruc || empresaTenant?.ruc || currentUser?.empresaRuc || '0000000000001';
  const displayAdmin = config.correo || empresaTenant?.adminCorreo || currentUser?.correo || 'admin@sri.gob.ec';

  // Ring/Donut Chart Data for Quota Breakdown
  const chartData = [
    { name: 'Facturas SRI', value: totalFacturas, color: '#4f46e5' },
    { name: 'Notas de Crédito', value: totalNotasCredito, color: '#f43f5e' },
    { name: 'Proformas Cotizadas', value: totalProformas, color: '#06b6d4' },
    { name: 'Cupo Disponible', value: cupoDisponible, color: '#e2e8f0' }
  ].filter(item => item.value > 0);

  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Cupo Disponible', value: limiteComprobantes, color: '#e2e8f0' }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in" id="company-profile-box">
      
      {/* ========================================================================= */}
      {/* CONTENEDOR MAESTRO UNIFICADO: MI PERFIL, PLAN, CONTABILIDAD, EMISOR & RIDE */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800">
        
        {/* 1. CABECERA PRINCIPAL DEL PANEL */}
        <div className="p-6 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-950 dark:text-gray-50 flex items-center gap-2">
              <User className="text-indigo-600 w-6 h-6" />
              Mi Perfil & Plan de Suscripción
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Información de la empresa, contabilidad detallada de comprobantes emitidos, usuarios asignados y personalización de RIDE.
            </p>
          </div>

          {/* Commercial Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-bold shrink-0 self-start md:self-auto">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate max-w-[220px]" title={displayNombreComercial}>
              {displayNombreComercial}
            </span>
          </div>
        </div>

        {/* 2. BANNER DEL PLAN EMPRESARIAL CON VIGENCIA Y CONTADOR DE DÍAS RESTANTES */}
        <div className={`p-6 ${
          estadoPlan === 'SUSPENDIDO' || isExpired 
            ? 'bg-amber-50/70 border-b border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40' 
            : 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            
            <div className="space-y-2">
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
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
                <Building2 className="w-7 h-7 text-indigo-400 shrink-0" />
                <span className="truncate">{displayNombreComercial}</span>
              </h3>

              {/* Subtitle with Razón Social & RUC */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                <span>Razón Social Legal: <strong className="font-semibold text-white">{displayRazonSocial}</strong></span>
                <span>• RUC: <strong className="font-mono text-indigo-300">{displayRuc}</strong></span>
                <span>• Admin: <strong className="text-zinc-200">{displayAdmin}</strong></span>
              </div>
            </div>

            {/* Expiration & Contract Validity Info with Countdown of Days Remaining */}
            <div className="bg-white/10 dark:bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-left lg:text-right shrink-0 min-w-[240px] shadow-lg">
              <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block">
                Vigencia del Plan
              </span>
              
              {/* Expiration Date */}
              <div className="text-base font-black font-mono mt-1 text-white flex items-center lg:justify-end gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-indigo-300 shrink-0" />
                <span>{fechaExpiracion}</span>
              </div>

              {/* Contador de días restante para vencer el plan */}
              <div className="mt-2 flex items-center lg:justify-end">
                {isExpired ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/40 text-xs font-black">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                    <span>0 días restantes (Plan Vencido)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-black">
                    <Clock className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                    <span>{diasRestantes} {diasRestantes === 1 ? 'día restante' : 'días restantes'}</span>
                  </div>
                )}
              </div>

              <span className={`text-[10px] font-semibold block mt-1.5 ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isExpired ? '⚠️ Servicio requiere renovación' : '● Servicio activo y habilitado'}
              </span>
            </div>

          </div>
        </div>

        {/* 3. SECCIÓN DE CONTABILIDAD CON GRÁFICO DE ANILLO (DONUT) Y TARJETAS MÉTRICAS */}
        <div className="p-6 space-y-6 bg-slate-50/40 dark:bg-zinc-900/50">
          
          {/* Section Header */}
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
          <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-zinc-700">
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

          {/* Grid Unificado: Gráfico de Anillo Donut + 4 Tarjetas de Métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* GRÁFICO DE ANILLO (DONUT CHART) */}
            <div className="lg:col-span-4 bg-white dark:bg-zinc-850 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col items-center justify-center relative">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Distribución de Cupo
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md">
                  {percentComprobantes}% emitido
                </span>
              </div>

              {/* Chart Container */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <RechartsTooltip 
                      formatter={(val: any, name: any) => [`${val} comprobantes`, name]}
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        borderColor: '#27272a', 
                        borderRadius: '12px', 
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Pie
                      data={displayChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {displayChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Badge inside the Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 leading-none">
                    Emitidos
                  </span>
                  <span className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                    {totalComprobantesEmitidos}/{limiteComprobantes}
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {cupoDisponible} disp.
                  </span>
                </div>
              </div>

              {/* Ring Chart Legend */}
              <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 text-[10px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                  <span className="text-gray-600 dark:text-zinc-400 truncate">Facturas ({totalFacturas})</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-gray-600 dark:text-zinc-400 truncate">N. Crédito ({totalNotasCredito})</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                  <span className="text-gray-600 dark:text-zinc-400 truncate">Proformas ({totalProformas})</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700 shrink-0" />
                  <span className="text-gray-600 dark:text-zinc-400 truncate">Disponible ({cupoDisponible})</span>
                </div>
              </div>
            </div>

            {/* 4 DETAILED ACCOUNTING CARDS */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Facturas */}
              <div className="bg-white dark:bg-zinc-850 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    📄 Facturas SRI
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md">
                    Autorizadas
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                    {totalFacturas}
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${totalFacturasMonto.toFixed(2)} USD
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                  Comprobantes principales emitidos al SRI
                </p>
              </div>

              {/* Notas de Crédito */}
              <div className="bg-white dark:bg-zinc-850 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    🔄 Notas de Crédito
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-md">
                    Modificaciones
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                    {totalNotasCredito}
                  </div>
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    -${totalNotasCreditoMonto.toFixed(2)} USD
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                  Anulaciones o correcciones tributarias
                </p>
              </div>

              {/* Proformas */}
              <div className="bg-white dark:bg-zinc-850 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-cyan-300 dark:hover:border-cyan-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    📑 Proformas Cotizadas
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-md">
                    Presupuestos
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {totalProformas}
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-zinc-400 mt-0.5">
                    Cotizaciones comerciales activas
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                  Documentos comerciales previos a factura
                </p>
              </div>

              {/* Cupo Disponible */}
              <div className="bg-white dark:bg-zinc-850 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    ⚡ Cupo Disponible
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md">
                    Saldo Restante
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-2xl font-black text-gray-900 dark:text-white font-mono">
                    {cupoDisponible}
                  </div>
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Comprobantes habilitados
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                  Capacidad restante según plan contratado
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* 4. SECCIÓN DE USUARIOS REGISTRADOS DE LA EMPRESA */}
        <div className="p-6 space-y-4 bg-white dark:bg-zinc-900">
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

          {/* Registered Users Badges / List */}
          {companyUsers.length === 0 ? (
            <div className="p-3 bg-gray-50 dark:bg-zinc-850 rounded-xl text-xs text-gray-500 text-center">
              1 usuario administrador activo ({currentUser?.correo || 'Usuario principal'})
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

        {/* 5. SECCIÓN DEL EMISOR TRIBUTARIO Y LOGOTIPO */}
        <div className="p-6 bg-slate-50/40 dark:bg-zinc-900/50 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200/70 dark:border-zinc-800 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" />
              Ficha del Emisor SRI & Logotipo Comercial
            </h3>
            {onNavigateToSettings && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN') && (
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-400 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-indigo-200/50 dark:border-indigo-800/50"
              >
                <Settings className="w-3.5 h-3.5" />
                Editar en Configuración
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LOGO ACTIONS BOX */}
            <div className="lg:col-span-4 bg-white dark:bg-zinc-850 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-indigo-600" />
                  Logotipo Comercial
                </span>

                <div className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] bg-gray-50/50 dark:bg-zinc-950/20 text-center relative overflow-hidden group">
                  {logoPreview ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
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
                        Quitar logotipo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-gray-400">
                      <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                        📷
                      </div>
                      <p className="text-[11px] font-semibold text-gray-600 dark:text-zinc-400">Sin logotipo comercial</p>
                      <p className="text-[9px] text-gray-400">Formatos .jpg, .jpeg o .png (Máx 2MB)</p>
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
                  Incrustado en el RIDE para <strong className="text-gray-700 dark:text-zinc-300 font-semibold">{displayNombreComercial}</strong>.
                </span>
              </div>
            </div>

            {/* FICHA DETALLADA DEL EMISOR */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-850 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 flex flex-col justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* Nombre Comercial */}
                <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 sm:col-span-2">
                  <span className="text-indigo-500 dark:text-indigo-400 block font-bold text-[10px] uppercase">Nombre Comercial Principal</span>
                  <span className="font-black text-gray-900 dark:text-white text-base">
                    {displayNombreComercial}
                  </span>
                </div>

                {/* RUC */}
                <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">RUC / Identificación</span>
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

                {/* Dirección Matriz */}
                <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800 sm:col-span-2">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Dirección Matriz</span>
                  <span className="text-gray-700 dark:text-zinc-300">
                    {config.dirMatriz || <em className="text-gray-400 font-normal italic">Sin registrar</em>}
                  </span>
                </div>

                {/* Punto de emisión y Establecimiento */}
                <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Establecimiento & Punto de Emisión</span>
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

                {/* Ambiente SRI */}
                <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Ambiente SRI Conectado</span>
                  <span className={`font-bold text-xs ${config.ambiente === '2' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {config.ambiente === '2' ? 'Producción (Ambiente 2)' : 'Pruebas / Sandbox (Ambiente 1)'}
                  </span>
                </div>

                {/* Firma Electrónica */}
                <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-200/60 dark:border-zinc-800">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Firma Digital P12 / Token</span>
                  <span className={`font-semibold text-xs truncate block ${config.p12FirmaB64 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} title={config.p12Nombre}>
                    {config.p12FirmaB64 ? (config.p12Nombre ? `✓ ${config.p12Nombre}` : '✓ Certificado P12 Cargado') : '⚠️ Firma no cargada'}
                  </span>
                </div>
              </div>

              {/* Botón de Previsualización RIDE */}
              <div className="pt-4 mt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Plantilla RIDE activa: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{TEMPLATES.find(t => t.id === activeTemplate)?.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowModelPreview(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Ver Ejemplo RIDE
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 6. SECCIÓN DE CONFIGURACIÓN Y SELECCIÓN DE DISEÑO RIDE */}
        <div className="p-6 bg-white dark:bg-zinc-900 space-y-5" id="ride-design-selector-box">
          <div>
            <h3 className="text-base font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
              <Palette className="text-indigo-600 w-5 h-5" />
              Configurar y Seleccionar Diseño de Factura RIDE
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Selecciona el diseño visual definitivo para tus comprobantes autorizados. El estilo escogido se reflejará instantáneamente en todas las facturas y notas de crédito en PDF.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {TEMPLATES.map((tmpl) => {
              const isSelected = activeTemplate === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`group relative p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between h-36 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/30'
                      : 'border-gray-200/80 bg-white hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950/25 dark:hover:bg-zinc-900'
                  }`}
                >
                  {/* Visual palette indicators */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-xs text-gray-950 dark:text-gray-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition uppercase tracking-wide text-left">
                        {tmpl.name}
                      </span>
                      {isSelected ? (
                        <span className="bg-indigo-600 text-white p-1 rounded-full text-xs flex items-center justify-center w-5 h-5">
                          <Check className="w-3 h-3 font-bold" />
                        </span>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-zinc-700 hover:border-indigo-400 transition" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-400 leading-snug text-left line-clamp-2">
                      {tmpl.desc}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100/60 dark:border-zinc-800/60">
                    <div className="flex gap-1.5">
                      <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${tmpl.color}`} />
                      <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-zinc-700" />
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
