import React, { useState } from 'react';
import { 
  Shield, Check, X, Sparkles, Layout, Palette, FolderTree, FileText, 
  Receipt, Percent, FileSpreadsheet, Package, Users, KeyRound, 
  CheckCircle2, AlertCircle, Save, Sliders, Layers, ChevronRight,
  ShieldCheck, Lock, ArrowRight, ToggleLeft, ToggleRight, FileCheck2,
  Code, Image as ImageIcon, Megaphone, Newspaper, Share2, Eye
} from 'lucide-react';
import { EmpresaTenant, TenantFeaturePermissions, TenantModulePermissions, CustomizerSubTabKey } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';

interface TenantPermissionsModalProps {
  empresa: EmpresaTenant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEmpresa: EmpresaTenant) => Promise<void>;
}

export const ALL_CUSTOMIZER_SUBTABS: {
  key: CustomizerSubTabKey;
  number: string;
  name: string;
  desc: string;
  color: string;
}[] = [
  {
    key: 'layout',
    number: '01',
    name: 'Menús & Grupos (TopBar, Agrupador y Modo Ramas)',
    desc: 'Arquitectura del TopBar, personalización de barras, agrupación de ítems y organizador jerárquico Drag & Drop.',
    color: 'blue',
  },
  {
    key: 'screens',
    number: '02',
    name: 'Editor de Pantallas & Componentes',
    desc: 'Personalizar títulos, bloques, visibilidad de tablas y tarjetas de métricas en cada pantalla del sistema.',
    color: 'purple',
  },
  {
    key: 'texts',
    number: '03',
    name: 'Nombres, Botones & Títulos (Diccionario Global)',
    desc: 'Sobrescribir microcopy de botones (Emitir Factura, Firmar XAdES-BES, etc.) y subtítulos fiscales.',
    color: 'amber',
  },
  {
    key: 'theme',
    number: '04',
    name: 'Tema & Colores (HEX)',
    desc: 'Selector de paleta de colores corporativos, gradientes de acento y colores directos en formato hexadecimal.',
    color: 'blue',
  },
  {
    key: 'containers',
    number: '05',
    name: 'Lienzo & Ancho de Contenedores',
    desc: 'Ajuste de densidad, márgenes globales y contenedores visuales para pantallas ultraanchas o compactas.',
    color: 'emerald',
  },
  {
    key: 'plans',
    number: '06',
    name: 'Planes de Facturación SRI',
    desc: 'Editor de tarjetas de suscripción, límites de emisión de comprobantes y precios mensuales/anuales.',
    color: 'amber',
  },
  {
    key: 'code',
    number: '07',
    name: 'Inyección de Código (CSS / JS)',
    desc: 'Inyección directa de hojas de estilo CSS personalizadas y scripts JS para la empresa.',
    color: 'indigo',
  },
  {
    key: 'identity',
    number: '08',
    name: 'Identidad & Logos',
    desc: 'Carga de logotipo corporativo en alta resolución y favicon oficial de la pestaña del navegador.',
    color: 'indigo',
  },
  {
    key: 'banners',
    number: '09',
    name: 'Banners & Anuncios',
    desc: 'Banners de alerta superior y avisos promocionales con temporizador y botón de acción.',
    color: 'sky',
  },
  {
    key: 'slides',
    number: '10',
    name: 'Carrusel de Login',
    desc: 'Diapositivas rotativas con imágenes y frases de bienvenida en la pantalla de inicio de sesión.',
    color: 'purple',
  },
  {
    key: 'news',
    number: '11',
    name: 'Novedades SRI',
    desc: 'Muro informativo de reformas tributarias, resoluciones del SRI y comunicados oficiales.',
    color: 'emerald',
  },
  {
    key: 'social',
    number: '12',
    name: 'Redes Sociales & Canales',
    desc: 'Canales de soporte, enlace de WhatsApp directo, web corporativa y perfiles sociales.',
    color: 'pink',
  },
  {
    key: 'modules',
    number: '13',
    name: 'Interruptores & Módulos Globales',
    desc: 'Encendido y apagado de módulos del sistema para los usuarios de la empresa.',
    color: 'teal',
  },
];

const DEFAULT_MODULE_PERMS: TenantModulePermissions = {
  invoices: { enabled: true, canCreate: true, canExportRide: true, canSendEmail: true, canVoid: true },
  creditNotes: { enabled: true, canCreate: true, canExportRide: true },
  retentions: { enabled: true, canCreate: true, canExportRide: true },
  proformas: { enabled: true, canCreate: true, canConvertToInvoice: true, canExportPdf: true },
  products: { enabled: true, canCreate: true, canImportExport: true },
  clients: { enabled: true, canCreate: true, canSearchSri: true },
  users: { enabled: true, canManageRoles: true },
  sriSettings: { enabled: true, canUploadSignature: true, canChangeEnvironment: false },
};

const DEFAULT_FEATURE_PERMISSIONS: TenantFeaturePermissions = {
  allowedLayouts: ['topbar-classic', 'floating-island', 'compact-dock', 'sidebar-left', 'sidebar-right'],
  canCustomizeTheme: true,
  canCustomizeMenu: true,
  canUseGroups: true,
  allowedCustomizerSubtabs: ['layout'],
  modules: DEFAULT_MODULE_PERMS,
  customNotes: ''
};

export default function TenantPermissionsModal({ empresa, isOpen, onClose, onSave }: TenantPermissionsModalProps) {
  const initialPerms = empresa.featurePermissions || DEFAULT_FEATURE_PERMISSIONS;

  const [allowedLayouts, setAllowedLayouts] = useState<string[]>(
    initialPerms.allowedLayouts || ['topbar-classic', 'floating-island', 'compact-dock', 'sidebar-left', 'sidebar-right']
  );
  const [canCustomizeTheme, setCanCustomizeTheme] = useState<boolean>(initialPerms.canCustomizeTheme ?? true);
  const [canCustomizeMenu, setCanCustomizeMenu] = useState<boolean>(initialPerms.canCustomizeMenu ?? true);
  const [canUseGroups, setCanUseGroups] = useState<boolean>(initialPerms.canUseGroups ?? true);
  const [allowedCustomizerSubtabs, setAllowedCustomizerSubtabs] = useState<CustomizerSubTabKey[]>(
    initialPerms.allowedCustomizerSubtabs && initialPerms.allowedCustomizerSubtabs.length > 0
      ? initialPerms.allowedCustomizerSubtabs
      : ['layout']
  );
  const [customNotes, setCustomNotes] = useState<string>(initialPerms.customNotes || '');

  const [modules, setModules] = useState<TenantModulePermissions>(() => ({
    invoices: { ...DEFAULT_MODULE_PERMS.invoices, ...(initialPerms.modules?.invoices || {}) },
    creditNotes: { ...DEFAULT_MODULE_PERMS.creditNotes, ...(initialPerms.modules?.creditNotes || {}) },
    retentions: { ...DEFAULT_MODULE_PERMS.retentions, ...(initialPerms.modules?.retentions || {}) },
    proformas: { ...DEFAULT_MODULE_PERMS.proformas, ...(initialPerms.modules?.proformas || {}) },
    products: { ...DEFAULT_MODULE_PERMS.products, ...(initialPerms.modules?.products || {}) },
    clients: { ...DEFAULT_MODULE_PERMS.clients, ...(initialPerms.modules?.clients || {}) },
    users: { ...DEFAULT_MODULE_PERMS.users, ...(initialPerms.modules?.users || {}) },
    sriSettings: { ...DEFAULT_MODULE_PERMS.sriSettings, ...(initialPerms.modules?.sriSettings || {}) },
  }));

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'customizer' | 'layouts' | 'presets'>('customizer');

  if (!isOpen) return null;

  const toggleCustomizerSubTab = (subTabKey: CustomizerSubTabKey) => {
    if (subTabKey === 'layout') {
      modalAlert.info('Subopción Base', 'La subopción "1. Menús & Grupos" (TopBar, Agrupador y Modo Ramas) está siempre disponible para que el inquilino organice su navegación.');
      return;
    }

    if (allowedCustomizerSubtabs.includes(subTabKey)) {
      setAllowedCustomizerSubtabs(allowedCustomizerSubtabs.filter(k => k !== subTabKey));
    } else {
      setAllowedCustomizerSubtabs([...allowedCustomizerSubtabs, subTabKey]);
    }
  };

  const handleSetOnlyMenuTab = () => {
    setAllowedCustomizerSubtabs(['layout']);
    modalAlert.success('Restringido a Menús', 'El inquilino solo podrá acceder a "1. Menús & Grupos". Las otras 12 subopciones quedaron bloqueadas.');
  };

  const handleSetAllCustomizerTabs = () => {
    setAllowedCustomizerSubtabs([
      'layout', 'screens', 'texts', 'theme', 'containers', 'plans',
      'code', 'identity', 'banners', 'slides', 'news', 'social', 'modules'
    ]);
    modalAlert.success('Acceso Total Otorgado', 'Se habilitaron todas las 13 subopciones de Diseño & Plataforma para este inquilino.');
  };

  const toggleLayout = (layoutKey: string) => {
    if (allowedLayouts.includes(layoutKey)) {
      if (allowedLayouts.length === 1) {
        modalAlert.warning('Aviso', 'Debe permitir al menos un estilo de navegación para el inquilino.');
        return;
      }
      setAllowedLayouts(allowedLayouts.filter(l => l !== layoutKey));
    } else {
      setAllowedLayouts([...allowedLayouts, layoutKey]);
    }
  };

  const applyPreset = (preset: 'full' | 'basic' | 'quotesOnly' | 'readOnly') => {
    if (preset === 'full') {
      setAllowedLayouts(['topbar-classic', 'floating-island', 'compact-dock', 'sidebar-left', 'sidebar-right']);
      setCanCustomizeTheme(true);
      setCanCustomizeMenu(true);
      setCanUseGroups(true);
      setModules({
        invoices: { enabled: true, canCreate: true, canExportRide: true, canSendEmail: true, canVoid: true },
        creditNotes: { enabled: true, canCreate: true, canExportRide: true },
        retentions: { enabled: true, canCreate: true, canExportRide: true },
        proformas: { enabled: true, canCreate: true, canConvertToInvoice: true, canExportPdf: true },
        products: { enabled: true, canCreate: true, canImportExport: true },
        clients: { enabled: true, canCreate: true, canSearchSri: true },
        users: { enabled: true, canManageRoles: true },
        sriSettings: { enabled: true, canUploadSignature: true, canChangeEnvironment: true },
      });
    } else if (preset === 'basic') {
      setAllowedLayouts(['topbar-classic', 'floating-island']);
      setCanCustomizeTheme(false);
      setCanCustomizeMenu(false);
      setCanUseGroups(true);
      setModules({
        invoices: { enabled: true, canCreate: true, canExportRide: true, canSendEmail: true, canVoid: false },
        creditNotes: { enabled: false, canCreate: false, canExportRide: false },
        retentions: { enabled: false, canCreate: false, canExportRide: false },
        proformas: { enabled: true, canCreate: true, canConvertToInvoice: true, canExportPdf: true },
        products: { enabled: true, canCreate: true, canImportExport: false },
        clients: { enabled: true, canCreate: true, canSearchSri: true },
        users: { enabled: false, canManageRoles: false },
        sriSettings: { enabled: true, canUploadSignature: true, canChangeEnvironment: false },
      });
    } else if (preset === 'quotesOnly') {
      setAllowedLayouts(['topbar-classic', 'floating-island', 'compact-dock']);
      setCanCustomizeTheme(false);
      setCanCustomizeMenu(false);
      setCanUseGroups(false);
      setModules({
        invoices: { enabled: false, canCreate: false, canExportRide: false, canSendEmail: false, canVoid: false },
        creditNotes: { enabled: false, canCreate: false, canExportRide: false },
        retentions: { enabled: false, canCreate: false, canExportRide: false },
        proformas: { enabled: true, canCreate: true, canConvertToInvoice: false, canExportPdf: true },
        products: { enabled: true, canCreate: true, canImportExport: true },
        clients: { enabled: true, canCreate: true, canSearchSri: true },
        users: { enabled: false, canManageRoles: false },
        sriSettings: { enabled: false, canUploadSignature: false, canChangeEnvironment: false },
      });
    }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const updatedPermissions: TenantFeaturePermissions = {
        allowedLayouts: allowedLayouts as any,
        canCustomizeTheme,
        canCustomizeMenu,
        canUseGroups,
        allowedCustomizerSubtabs,
        modules,
        customNotes
      };

      const updatedEmpresa: EmpresaTenant = {
        ...empresa,
        featurePermissions: updatedPermissions
      };

      await onSave(updatedEmpresa);
      onClose();
    } catch (err: any) {
      modalAlert.error('Error', err?.message || 'No se pudieron guardar los permisos del inquilino.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Permisos y Funciones del Inquilino
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-medium">
                {empresa.razonSocial} • <span className="font-mono text-white">{empresa.ruc}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-zinc-850/50 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('customizer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'customizer'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Diseño & Subopciones</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${activeTab === 'customizer' ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'}`}>
                {allowedCustomizerSubtabs.length}/13
              </span>
            </button>

            <button
              onClick={() => setActiveTab('modules')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Módulos SRI
            </button>
            <button
              onClick={() => setActiveTab('layouts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'layouts'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Diseños de Menú
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Perfiles Rápidos
            </button>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold hidden lg:inline">
            Ajustes en vivo por empresa
          </span>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB: CUSTOMIZER SUBOPTIONS (DISEÑO & PLATAFORMA) */}
          {activeTab === 'customizer' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                      Regla de Acceso a "Diseño & Plataforma"
                    </h4>
                    <p className="text-xs text-purple-800/80 dark:text-purple-300/90 mt-0.5 leading-relaxed">
                      Por defecto, los inquilinos <strong className="font-black">solo pueden acceder a "1. Menús & Grupos"</strong> (TopBar, Agrupador y Modo Ramas con Drag & Drop). Las demás 12 subopciones permanecen bloqueadas a menos que las habilites aquí expresamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSetOnlyMenuTab}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer flex-1 sm:flex-none"
                    title="Restringir solo a Menús & Grupos"
                  >
                    Solo Menús (Defecto)
                  </button>
                  <button
                    type="button"
                    onClick={handleSetAllCustomizerTabs}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer shadow-xs flex-1 sm:flex-none"
                    title="Habilitar todas las 13 subopciones"
                  >
                    Habilitar Todo (13)
                  </button>
                </div>
              </div>

              {/* LIST OF 13 SUBTABS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {ALL_CUSTOMIZER_SUBTABS.map((subTab) => {
                  const isEnabled = allowedCustomizerSubtabs.includes(subTab.key);
                  const isBase = subTab.key === 'layout';

                  return (
                    <div
                      key={subTab.key}
                      onClick={() => !isBase && toggleCustomizerSubTab(subTab.key)}
                      className={`p-4 rounded-2xl border transition-all duration-150 flex items-start justify-between gap-3 cursor-pointer select-none ${
                        isBase
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/80 shadow-xs'
                          : isEnabled
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/70 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 opacity-65 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                          isBase 
                            ? 'bg-blue-600 text-white' 
                            : isEnabled 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                        }`}>
                          {subTab.number}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {subTab.name}
                            </span>
                            {isBase ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Básico (Activo)
                              </span>
                            ) : isEnabled ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-200/80 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                Habilitado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Bloqueado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
                            {subTab.desc}
                          </p>
                        </div>
                      </div>

                      {/* TOGGLE SWITCH */}
                      <div className="shrink-0 pt-0.5">
                        <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            disabled={isBase}
                            onChange={() => toggleCustomizerSubTab(subTab.key)}
                            className="sr-only peer"
                          />
                          <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                            isBase ? 'peer-checked:bg-blue-600 opacity-80 cursor-not-allowed' : 'peer-checked:bg-purple-600'
                          }`} />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: MODULES & SUBFUNCTIONS */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                  El SUPERADMIN puede activar o restringir selectivamente cada módulo tributario y sus funciones internas (emisión, descargas RIDE, reenvíos y anulaciones) para esta empresa inquilina.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. FACTURACIÓN ELECTRÓNICA */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  modules.invoices?.enabled 
                    ? 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-750">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white">Facturación Electrónica (01)</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">Emisión SRI oficial</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modules.invoices?.enabled ?? true}
                        onChange={(e) => setModules({
                          ...modules,
                          invoices: { ...(modules.invoices || {} as any), enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  {modules.invoices?.enabled && (
                    <div className="pt-3 space-y-2 text-xs">
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Crear y Emitir Facturas</span>
                        <input
                          type="checkbox"
                          checked={modules.invoices?.canCreate ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            invoices: { ...(modules.invoices || {} as any), canCreate: e.target.checked }
                          })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Descargar RIDE PDF y XML</span>
                        <input
                          type="checkbox"
                          checked={modules.invoices?.canExportRide ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            invoices: { ...(modules.invoices || {} as any), canExportRide: e.target.checked }
                          })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Envío Automático por Correo</span>
                        <input
                          type="checkbox"
                          checked={modules.invoices?.canSendEmail ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            invoices: { ...(modules.invoices || {} as any), canSendEmail: e.target.checked }
                          })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Anular Facturas Autorizadas</span>
                        <input
                          type="checkbox"
                          checked={modules.invoices?.canVoid ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            invoices: { ...(modules.invoices || {} as any), canVoid: e.target.checked }
                          })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 2. NOTAS DE CRÉDITO */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  modules.creditNotes?.enabled 
                    ? 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-750">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white">Notas de Crédito (04)</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">Anulaciones y descuentos</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modules.creditNotes?.enabled ?? true}
                        onChange={(e) => setModules({
                          ...modules,
                          creditNotes: { ...(modules.creditNotes || {} as any), enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                    </label>
                  </div>

                  {modules.creditNotes?.enabled && (
                    <div className="pt-3 space-y-2 text-xs">
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Crear Notas de Crédito</span>
                        <input
                          type="checkbox"
                          checked={modules.creditNotes?.canCreate ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            creditNotes: { ...(modules.creditNotes || {} as any), canCreate: e.target.checked }
                          })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Exportar RIDE PDF / XML</span>
                        <input
                          type="checkbox"
                          checked={modules.creditNotes?.canExportRide ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            creditNotes: { ...(modules.creditNotes || {} as any), canExportRide: e.target.checked }
                          })}
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 3. RETENCIONES */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  modules.retentions?.enabled 
                    ? 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-750">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white">Comprobantes de Retención (07)</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">Renta, IVA e ISD</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modules.retentions?.enabled ?? true}
                        onChange={(e) => setModules({
                          ...modules,
                          retentions: { ...(modules.retentions || {} as any), enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                    </label>
                  </div>

                  {modules.retentions?.enabled && (
                    <div className="pt-3 space-y-2 text-xs">
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Emitir Comprobantes de Retención</span>
                        <input
                          type="checkbox"
                          checked={modules.retentions?.canCreate ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            retentions: { ...(modules.retentions || {} as any), canCreate: e.target.checked }
                          })}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Descargar RIDE PDF / XML</span>
                        <input
                          type="checkbox"
                          checked={modules.retentions?.canExportRide ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            retentions: { ...(modules.retentions || {} as any), canExportRide: e.target.checked }
                          })}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 4. PROFORMAS Y COTIZACIONES */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  modules.proformas?.enabled 
                    ? 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-750">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white">Proformas y Cotizaciones</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">Presupuestos comerciales</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modules.proformas?.enabled ?? true}
                        onChange={(e) => setModules({
                          ...modules,
                          proformas: { ...(modules.proformas || {} as any), enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600" />
                    </label>
                  </div>

                  {modules.proformas?.enabled && (
                    <div className="pt-3 space-y-2 text-xs">
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Crear y Editar Proformas</span>
                        <input
                          type="checkbox"
                          checked={modules.proformas?.canCreate ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            proformas: { ...(modules.proformas || {} as any), canCreate: e.target.checked }
                          })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Convertir Directo a Factura SRI</span>
                        <input
                          type="checkbox"
                          checked={modules.proformas?.canConvertToInvoice ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            proformas: { ...(modules.proformas || {} as any), canConvertToInvoice: e.target.checked }
                          })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Exportar PDF con Plantillas</span>
                        <input
                          type="checkbox"
                          checked={modules.proformas?.canExportPdf ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            proformas: { ...(modules.proformas || {} as any), canExportPdf: e.target.checked }
                          })}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 5. PRODUCTOS / INVENTARIO */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  modules.products?.enabled 
                    ? 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-750">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white">Catálogo de Productos</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">Tarifas e IVA 15%</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modules.products?.enabled ?? true}
                        onChange={(e) => setModules({
                          ...modules,
                          products: { ...(modules.products || {} as any), enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  {modules.products?.enabled && (
                    <div className="pt-3 space-y-2 text-xs">
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Crear y Editar Ítems</span>
                        <input
                          type="checkbox"
                          checked={modules.products?.canCreate ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            products: { ...(modules.products || {} as any), canCreate: e.target.checked }
                          })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Importación Masiva Excel</span>
                        <input
                          type="checkbox"
                          checked={modules.products?.canImportExport ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            products: { ...(modules.products || {} as any), canImportExport: e.target.checked }
                          })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 6. CLIENTES */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  modules.clients?.enabled 
                    ? 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-750">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white">Directorio de Clientes</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">RUC, Cédula y Pasaporte</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modules.clients?.enabled ?? true}
                        onChange={(e) => setModules({
                          ...modules,
                          clients: { ...(modules.clients || {} as any), enabled: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600" />
                    </label>
                  </div>

                  {modules.clients?.enabled && (
                    <div className="pt-3 space-y-2 text-xs">
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Registrar Clientes Nuevos</span>
                        <input
                          type="checkbox"
                          checked={modules.clients?.canCreate ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            clients: { ...(modules.clients || {} as any), canCreate: e.target.checked }
                          })}
                          className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                        <span className="text-slate-700 dark:text-zinc-300 font-medium">Auto-Consulta RUC en SRI</span>
                        <input
                          type="checkbox"
                          checked={modules.clients?.canSearchSri ?? true}
                          onChange={(e) => setModules({
                            ...modules,
                            clients: { ...(modules.clients || {} as any), canSearchSri: e.target.checked }
                          })}
                          className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: LAYOUTS & NAVIGATION PERMISSIONS */}
          {activeTab === 'layouts' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                  Diseños de Barra y Menú Autorizados para el Inquilino
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4">
                  El inquilino solo podrá elegir y alternar entre los estilos de interfaz marcados a continuación:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    { key: 'topbar-classic', label: 'TopBar Clásico Fijo', desc: 'Barra fija superior con grupos y dropdowns', badge: 'Estándar' },
                    { key: 'floating-island', label: 'Isla Flotante Dinámica', desc: 'Barra centrada moderna tipo macOS Island', badge: 'Nuevo' },
                    { key: 'compact-dock', label: 'Dock Flotante', desc: 'Dock inferior con menús emergentes rápidos', badge: 'Moderno' },
                    { key: 'sidebar-left', label: 'Sidebar Izquierdo', desc: 'Menú lateral expandible a la izquierda', badge: 'Productividad' },
                    { key: 'sidebar-right', label: 'Sidebar Derecho', desc: 'Menú lateral posicionado a la derecha', badge: 'Alternativo' }
                  ].map(layout => {
                    const isSelected = allowedLayouts.includes(layout.key);
                    return (
                      <div
                        key={layout.key}
                        onClick={() => toggleLayout(layout.key)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="text-xs font-bold text-slate-800 dark:text-zinc-100">{layout.label}</div>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-transparent'
                          }`}>
                            ✓
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-2">{layout.desc}</p>
                        <span className="self-start text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                          {layout.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PRIVILEGES */}
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                  Privilegios de Personalización & Grupos de Menú
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700 cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-zinc-100">Permitir Agrupación de Ítems en Menú</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Habilita dropdowns interactivos como "Facturación SRI", "Comercial", etc.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={canUseGroups}
                      onChange={(e) => setCanUseGroups(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700 cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-zinc-100">Permitir Personalización de Paleta de Colores y Temas</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">El inquilino podrá ajustar colores primarios de su plataforma</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={canCustomizeTheme}
                      onChange={(e) => setCanCustomizeTheme(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-700 cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-zinc-100">Permitir Reorganizar Orden del Menú</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">Habilita arrastrar o cambiar el orden y visibilidad de las pestañas</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={canCustomizeMenu}
                      onChange={(e) => setCanCustomizeMenu(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-zinc-400">
                Aplica combinaciones rápidas de permisos pre-configuradas según el plan contratado por la empresa:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  onClick={() => applyPreset('full')}
                  className="p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-500 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block mb-1">Plan Enterprise</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-2">Habilitar Todo</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">Todos los módulos SRI activos, todos los diseños y personalización completa.</p>
                  </div>
                  <button className="mt-4 w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition">
                    Cargar Preset
                  </button>
                </div>

                <div 
                  onClick={() => applyPreset('basic')}
                  className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 hover:border-blue-500 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide block mb-1">Plan Pyme</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-2">Facturación Básica</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">Facturación + Proformas + Productos. Sin retenciones ni notas de crédito complejas.</p>
                  </div>
                  <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition">
                    Cargar Preset
                  </button>
                </div>

                <div 
                  onClick={() => applyPreset('quotesOnly')}
                  className="p-5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-850 hover:border-teal-500 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-wide block mb-1">Plan Comercial</span>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-2">Solo Cotizaciones</h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400">Solo proformas, clientes y catálogo de productos. Emisión SRI desactivada.</p>
                  </div>
                  <button className="mt-4 w-full py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition">
                    Cargar Preset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTES FIELD */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 mb-1">
              Notas internas del SUPERADMIN para este inquilino (Opcional):
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Ej: Plan Especial contratado por 1 año con soporte de retenciones..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100"
            />
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-zinc-850 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando Permisos...' : 'Guardar y Aplicar Permisos'}
          </button>
        </div>

      </div>
    </div>
  );
}
