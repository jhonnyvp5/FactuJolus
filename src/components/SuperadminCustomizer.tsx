import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Download, 
  Upload, 
  Save, 
  Check, 
  ShieldCheck, 
  Sliders, 
  Palette, 
  Layout, 
  Megaphone, 
  Image as ImageIcon, 
  Share2, 
  Layers, 
  Newspaper, 
  CreditCard, 
  Code, 
  Globe, 
  Edit2, 
  FolderTree,
  Search,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Lock
} from 'lucide-react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { modalAlert } from '../context/ModalAlertContext';

// Extracted Sub-Components
import VisualLayoutBuilder from './customizer/VisualLayoutBuilder';
import { ScreenPageBuilder } from './customizer/ScreenPageBuilder';
import { TextDictionaryEditor } from './customizer/TextDictionaryEditor';
import { ThemeColorsBuilder } from './customizer/ThemeColorsBuilder';
import VisualContainerBuilder from './customizer/VisualContainerBuilder';
import DynamicPlansManager from './customizer/DynamicPlansManager';
import CustomCodeEditor from './customizer/CustomCodeEditor';
import { SriWebServiceEditor } from './customizer/SriWebServiceEditor';
import { BrandIdentityEditor } from './customizer/BrandIdentityEditor';
import { BannersPromosEditor } from './customizer/BannersPromosEditor';
import { LoginSlidesManager } from './customizer/LoginSlidesManager';
import { SriNewsManager } from './customizer/SriNewsManager';
import { SocialChannelsEditor } from './customizer/SocialChannelsEditor';
import { GlobalModulesToggles } from './customizer/GlobalModulesToggles';
import { exportPlatformSettingsJson, importPlatformSettingsJson } from '../lib/platformSettings';
import { UserRole } from '../types';

interface SuperadminCustomizerProps {
  currentUser?: any;
  currentUserRole?: string;
  currentUserEmail?: string;
  currentEmpresa?: any;
}

export type SubTab = 
  | 'layout' 
  | 'screens' 
  | 'texts' 
  | 'theme' 
  | 'containers' 
  | 'plans' 
  | 'code' 
  | 'sri-ws' 
  | 'identity' 
  | 'banners' 
  | 'slides' 
  | 'news' 
  | 'social' 
  | 'modules';

interface SubTabDefinition {
  key: SubTab;
  name: string;
  shortName: string;
  description: string;
  category: string;
  badge: string;
  icon: any;
  iconColor: string;
  activeBg: string;
  borderAccent: string;
}

const ALL_SUBTAB_DEFINITIONS: SubTabDefinition[] = [
  {
    key: 'layout',
    name: '1. Estructura & Menú (Organizador de Ramas)',
    shortName: '1. Estructura Menú',
    description: 'Árbol jerárquico de navegación, ramas, módulos principales, sub-menús e iconos estilo Figma/Hostinger.',
    category: 'Estructura & Navegación',
    badge: 'Figma & Hostinger',
    icon: Layout,
    iconColor: 'text-indigo-400',
    activeBg: 'bg-indigo-600',
    borderAccent: 'border-indigo-500/40 hover:border-indigo-500/80',
  },
  {
    key: 'screens',
    name: '2. Editor de Pantallas & Componentes',
    shortName: '2. Pantallas & Bloques',
    description: 'Configura componentes por pantalla, layouts, anchos de bloque, orden y visibilidad.',
    category: 'Vistas & Lienzos',
    badge: 'Bloques UI',
    icon: Sliders,
    iconColor: 'text-purple-400',
    activeBg: 'bg-purple-600',
    borderAccent: 'border-purple-500/40 hover:border-purple-500/80',
  },
  {
    key: 'texts',
    name: '3. Nombres, Botones & Títulos (Diccionario Global)',
    shortName: '3. Textos & Botones',
    description: 'Renombra cualquier botón, título de encabezado, pestaña, formulario o etiqueta del sistema.',
    category: 'Textos & Idioma',
    badge: 'Textos & Etiquetas',
    icon: Edit2,
    iconColor: 'text-amber-400',
    activeBg: 'bg-amber-600',
    borderAccent: 'border-amber-500/40 hover:border-amber-500/80',
  },
  {
    key: 'theme',
    name: '4. Tema, Paleta de Colores & Estilo',
    shortName: '4. Paleta & Colores',
    description: 'Personaliza colores primarios, gradientes, bordes, radios, tipografías y sombras.',
    category: 'Aspecto Visual',
    badge: 'Colores & Dark Mode',
    icon: Palette,
    iconColor: 'text-emerald-400',
    activeBg: 'bg-emerald-600',
    borderAccent: 'border-emerald-500/40 hover:border-emerald-500/80',
  },
  {
    key: 'containers',
    name: '5. Lienzo & Contenedores Personalizados',
    shortName: '5. Lienzo & Bento',
    description: 'Define contenedores tipo Bento Box, anchos máximos, rellenos y fondos modulares.',
    category: 'Vistas & Lienzos',
    badge: 'Anchos & Bento',
    icon: Layers,
    iconColor: 'text-cyan-400',
    activeBg: 'bg-cyan-600',
    borderAccent: 'border-cyan-500/40 hover:border-cyan-500/80',
  },
  {
    key: 'plans',
    name: '6. Planes de Facturación & Suscripciones',
    shortName: '6. Planes Comerciales',
    description: 'Crea y edita planes mensuales y anuales, límites de facturación y contratación vía WhatsApp.',
    category: 'Comercial & Monetización',
    badge: 'Precios & WhatsApp',
    icon: CreditCard,
    iconColor: 'text-amber-400',
    activeBg: 'bg-amber-600',
    borderAccent: 'border-amber-500/40 hover:border-amber-500/80',
  },
  {
    key: 'code',
    name: '7. Inyección de Código (CSS / JS / HTML)',
    shortName: '7. Inyección Código',
    description: 'Inyecta hojas de estilo personalizadas, snippets de seguimiento o scripts externos de forma segura.',
    category: 'Desarrollador & Avanzado',
    badge: 'Estilos & Scripts',
    icon: Code,
    iconColor: 'text-blue-400',
    activeBg: 'bg-blue-600',
    borderAccent: 'border-blue-500/40 hover:border-blue-500/80',
  },
  {
    key: 'sri-ws',
    name: '8. Web Services SRI (URLs Pruebas & Producción)',
    shortName: '8. Web Services SRI',
    description: 'Configura endpoints SOAP de Recepción y Autorización de Comprobantes Electrónicos SRI.',
    category: 'Integración SRI',
    badge: 'SRI Oficial',
    icon: Globe,
    iconColor: 'text-teal-400',
    activeBg: 'bg-teal-600',
    borderAccent: 'border-teal-500/40 hover:border-teal-500/80',
  },
  {
    key: 'identity',
    name: '9. Identidad Visual & Logotipos',
    shortName: '9. Marca & Logos',
    description: 'Sube el logotipo principal, favicon, nombre de la plataforma, eslogan y pie de página.',
    category: 'Marca & Login',
    badge: 'Marca & Favicon',
    icon: ImageIcon,
    iconColor: 'text-indigo-400',
    activeBg: 'bg-indigo-600',
    borderAccent: 'border-indigo-500/40 hover:border-indigo-500/80',
  },
  {
    key: 'banners',
    name: '10. Banners & Anuncios Informativos',
    shortName: '10. Banners & Avisos',
    description: 'Barra superior flotante con comunicados tributarios y banners promocionales con gradientes.',
    category: 'Comunicación & Avisos',
    badge: 'Barra Superior & Promos',
    icon: Megaphone,
    iconColor: 'text-sky-400',
    activeBg: 'bg-sky-600',
    borderAccent: 'border-sky-500/40 hover:border-sky-500/80',
  },
  {
    key: 'slides',
    name: '11. Carrusel de la Pantalla de Login',
    shortName: '11. Slides de Login',
    description: 'Fotografías publicitarias, lemas y descripciones visuales para la pantalla de acceso.',
    category: 'Marca & Login',
    badge: 'Slides & Lemas',
    icon: Sliders,
    iconColor: 'text-purple-400',
    activeBg: 'bg-purple-600',
    borderAccent: 'border-purple-500/40 hover:border-purple-500/80',
  },
  {
    key: 'news',
    name: '12. Novedades & Resoluciones del SRI',
    shortName: '12. Noticias SRI',
    description: 'Publicador de noticias y comunicados oficiales sobre IVA, retenciones y facturación electrónica.',
    category: 'Comunicación & Avisos',
    badge: 'Noticias Tributarias',
    icon: Newspaper,
    iconColor: 'text-emerald-400',
    activeBg: 'bg-emerald-600',
    borderAccent: 'border-emerald-500/40 hover:border-emerald-500/80',
  },
  {
    key: 'social',
    name: '13. Redes Sociales & Canales de Contacto',
    shortName: '13. Redes & Soporte',
    description: 'Canales oficiales: WhatsApp, Instagram, Facebook, TikTok, LinkedIn, teléfono y soporte.',
    category: 'Comunicación & Avisos',
    badge: 'Canales Oficiales',
    icon: Share2,
    iconColor: 'text-pink-400',
    activeBg: 'bg-pink-600',
    borderAccent: 'border-pink-500/40 hover:border-pink-500/80',
  },
  {
    key: 'modules',
    name: '14. Interruptores & Módulos Globales',
    shortName: '14. Módulos & Toggles',
    description: 'Interruptores maestros para encender o apagar widgets, botones de planes y simuladores.',
    category: 'Configuración Global',
    badge: 'Visibilidad & Toggles',
    icon: Layers,
    iconColor: 'text-teal-400',
    activeBg: 'bg-teal-600',
    borderAccent: 'border-teal-500/40 hover:border-teal-500/80',
  },
];

export default function SuperadminCustomizer({
  currentUser,
  currentUserRole = 'superadmin',
  currentUserEmail = '',
  currentEmpresa
}: SuperadminCustomizerProps) {
  const { settings, updateSettings, resetToDefaults } = usePlatformSettings();

  const isSuperadmin = currentUserRole === 'superadmin' || currentUserRole === 'SUPERADMIN' || currentUserEmail?.toLowerCase() === 'jhonnyvp5@gmail.com';

  // Tenants only have access to 'layout' (Estructura & Menú) by default, unless SUPERADMIN has explicitly enabled more sections in currentEmpresa.featurePermissions.allowedCustomizerSubtabs
  const tenantAllowedSubtabs: SubTab[] = (currentEmpresa?.featurePermissions?.allowedCustomizerSubtabs && currentEmpresa.featurePermissions.allowedCustomizerSubtabs.length > 0)
    ? (currentEmpresa.featurePermissions.allowedCustomizerSubtabs as SubTab[])
    : ['layout'];

  const allowedSubTabsList: SubTab[] = isSuperadmin 
    ? ALL_SUBTAB_DEFINITIONS.map(d => d.key)
    : tenantAllowedSubtabs;

  const visibleSubTabDefs = ALL_SUBTAB_DEFINITIONS.filter(def => allowedSubTabsList.includes(def.key));

  // Accordion state: In tenant mode, open 'layout' by default for immediate convenience
  const [openAccordions, setOpenAccordions] = useState<Set<SubTab>>(() => {
    if (!isSuperadmin) {
      return new Set(['layout']);
    }
    return new Set();
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAccordion = (key: SubTab) => {
    setOpenAccordions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenAccordions(new Set(visibleSubTabDefs.map(d => d.key)));
  };

  const collapseAll = () => {
    setOpenAccordions(new Set());
  };

  const handleQuickJump = (key: SubTab) => {
    setOpenAccordions(prev => new Set(prev).add(key));
    setIsDropdownOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`customizer-accordion-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const isSubTabVisible = (key: SubTab) => {
    if (!allowedSubTabsList.includes(key)) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const def = ALL_SUBTAB_DEFINITIONS.find(d => d.key === key);
    if (!def) return false;
    return (
      def.name.toLowerCase().includes(q) ||
      def.shortName.toLowerCase().includes(q) ||
      def.description.toLowerCase().includes(q) ||
      def.category.toLowerCase().includes(q) ||
      def.badge.toLowerCase().includes(q)
    );
  };

  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const jsonStr = exportPlatformSettingsJson(settings);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diseno-plataforma-sri-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      modalAlert.success('Configuración Exportada', 'Diseño y configuración exportados correctamente.');
    } catch (e) {
      modalAlert.error('Error al Exportar', 'No se pudo exportar la configuración.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const imported = importPlatformSettingsJson(jsonContent);
        if (imported) {
          updateSettings(imported);
          modalAlert.success('Diseño Restaurado', '¡Configuración de diseño restaurada con éxito!');
        } else {
          modalAlert.error('Formato Inválido', 'El archivo no tiene el formato JSON válido.');
        }
      } catch (err) {
        modalAlert.error('Error de Lectura', 'Error al leer el archivo de configuración.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    modalAlert.confirm(
      '¿Restaurar Diseño de Fábrica?',
      'Esta acción restablecerá los logotipos, textos, colores y estructura al diseño estándar original de ORIONNX.',
      async () => {
        await resetToDefaults();
        modalAlert.success('Restauración Completa', 'Diseño restaurado al estado original.');
      },
      true,
      'Sí, Restaurar',
      'Cancelar'
    );
  };

  const renderSubTabComponent = (key: SubTab) => {
    switch (key) {
      case 'layout':
        return (
          <VisualLayoutBuilder 
            currentUser={currentUser}
            currentUserRole={currentUserRole as UserRole}
            currentUserEmail={currentUserEmail}
            currentEmpresa={currentEmpresa}
          />
        );
      case 'screens':
        return <ScreenPageBuilder />;
      case 'texts':
        return <TextDictionaryEditor />;
      case 'theme':
        return <ThemeColorsBuilder />;
      case 'containers':
        return <VisualContainerBuilder />;
      case 'plans':
        return <DynamicPlansManager />;
      case 'code':
        return <CustomCodeEditor />;
      case 'sri-ws':
        return (
          <SriWebServiceEditor 
            isSuperadmin={isSuperadmin}
            currentUserRole={currentUserRole as UserRole}
            currentUser={currentUser}
          />
        );
      case 'identity':
        return <BrandIdentityEditor />;
      case 'banners':
        return <BannersPromosEditor />;
      case 'slides':
        return <LoginSlidesManager />;
      case 'news':
        return <SriNewsManager />;
      case 'social':
        return <SocialChannelsEditor />;
      case 'modules':
        return <GlobalModulesToggles />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative">
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Personalizador Global de Marca & Plataforma • SRI Ecuador</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-amber-400" />
              <span>Diseño & Plataforma Multi-Inquilino</span>
            </h2>

            <p className="text-sm text-slate-300">
              Modifica la identidad visual, menús jerárquicos estilo Hostinger, colores, diccionarios de textos, banners, 
              slides publicitarios de bienvenida y credenciales SRI en modo acordeón organizado.
            </p>
          </div>

          {/* ACTION BUTTONS (EXPORT / IMPORT / RESET) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-xs"
              title="Exportar configuración a archivo JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exportar JSON</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-xs"
              title="Restablecer valores originales"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar</span>
            </button>
          </div>
        </div>

        {/* QUICK JUMP DROPDOWN SELECTOR (GROUPED) */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-20">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Acceso Rápido:
            </span>

            {/* GROUPED DROPDOWN MENU */}
            <div className="relative" ref={dropdownRef}>
              {visibleSubTabDefs.length <= 1 ? (
                /* INQUILINO CON SOLO 1 OPCIÓN HABILITADA: BOTÓN BLOQUEADO / READ-ONLY */
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 bg-slate-800/70 text-slate-300 border border-slate-700/70 cursor-not-allowed select-none shadow-sm opacity-90"
                  title="Sección única asignada a tu perfil de inquilino"
                >
                  <FolderTree className="w-4 h-4 text-amber-400" />
                  <span>1. Estructura & Menú (Organizador de Ramas)</span>
                  <Lock className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>
              ) : (
                /* SUPERADMIN O MÚLTIPLES OPCIONES HABILITADAS: DESPLEGABLE INTERACTIVO */
                <>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer border shadow-md backdrop-blur-md ${
                      isDropdownOpen
                        ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/40'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Explorar Secciones ({visibleSubTabDefs.length} disponibles)</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : 'text-slate-300'}`} />
                  </button>

                  {/* DROPDOWN POPOVER */}
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 z-50 w-[320px] sm:w-[440px] bg-slate-900/98 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl p-2.5 max-h-[75vh] overflow-y-auto ring-1 ring-white/15 divide-y divide-slate-800">
                      <div className="px-3 py-2 text-[10px] font-black text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                        <span>SECCIONES DE PERSONALIZACIÓN</span>
                        <span className="bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-700/60 text-[9.5px] text-indigo-300 font-bold">
                          {visibleSubTabDefs.length} disponibles
                        </span>
                      </div>

                      {/* CATEGORIZED ITEMS */}
                      {Array.from(new Set(visibleSubTabDefs.map(d => d.category))).map(category => {
                        const categoryItems = visibleSubTabDefs.filter(d => d.category === category);
                        return (
                          <div key={category} className="py-2 first:pt-1 last:pb-1">
                            <div className="px-3 py-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                              {category}
                            </div>
                            <div className="space-y-1 mt-1">
                              {categoryItems.map(subTab => {
                                const IconComp = subTab.icon;
                                const isOpen = openAccordions.has(subTab.key);

                                return (
                                  <button
                                    key={subTab.key}
                                    type="button"
                                    onClick={() => handleQuickJump(subTab.key)}
                                    className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-3 cursor-pointer group ${
                                      isOpen
                                        ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                                        : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'
                                      }`}>
                                        <IconComp className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : subTab.iconColor}`} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold truncate">
                                          {subTab.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate">
                                          {subTab.description}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase ${
                                        isOpen
                                          ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                                      }`}>
                                        {subTab.badge}
                                      </span>
                                      {isOpen && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* PERMISSION BADGE & EXPAND / COLLAPSE BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            {isSuperadmin ? (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-[10.5px] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Superadmin (14 Secciones)</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/30 text-amber-300 text-[10.5px] font-bold flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {visibleSubTabDefs.length === 1 
                    ? 'Inquilino: Estructura & Menú' 
                    : `Inquilino (${visibleSubTabDefs.length} Habilitadas)`}
                </span>
              </span>
            )}

            <button
              onClick={expandAll}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              title="Abrir todos los acordeones"
            >
              <Maximize2 className="w-3 h-3 text-indigo-400" />
              <span>Expandir</span>
            </button>

            <button
              onClick={collapseAll}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              title="Cerrar todos los acordeones"
            >
              <Minimize2 className="w-3 h-3 text-slate-400" />
              <span>Colapsar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACCORDION TOOLBAR (FILTER & EXPAND/COLLAPSE ALL) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar opciones de diseño y configuración..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap hidden md:inline">
            {openAccordions.size} de {visibleSubTabDefs.length} abiertas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Desplegar Todo</span>
          </button>

          <button
            onClick={collapseAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Colapsar Todo</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 14 COMPLETE ACCORDION SECTIONS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {visibleSubTabDefs.filter(def => isSubTabVisible(def.key)).map((def) => {
          const isOpen = openAccordions.has(def.key);
          const IconComp = def.icon;

          return (
            <div
              key={def.key}
              id={`customizer-accordion-${def.key}`}
              className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isOpen
                  ? 'border-indigo-500/50 dark:border-indigo-500/40 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* ACCORDION HEADER (CLICK TO EXPAND / COLLAPSE) */}
              <button
                type="button"
                onClick={() => toggleAccordion(def.key)}
                className={`w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                  isOpen 
                    ? 'bg-slate-50/80 dark:bg-zinc-850/80 border-b border-slate-200/80 dark:border-zinc-800' 
                    : 'hover:bg-slate-50/50 dark:hover:bg-zinc-850/40'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isOpen ? def.activeBg : 'bg-slate-100 dark:bg-zinc-800'
                  }`}>
                    <IconComp className={`w-5 h-5 ${isOpen ? 'text-white' : def.iconColor}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {def.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isOpen 
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' 
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}>
                        {def.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5 hidden sm:block">
                      {def.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 hidden md:inline">
                    {isOpen ? 'Ocultar módulo' : 'Configurar módulo'}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isOpen ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                  }`}>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* ACCORDION CONTENT (RENDERED WHEN OPEN) */}
              {isOpen && (
                <div className="p-4 sm:p-6 bg-slate-50/30 dark:bg-zinc-900/40 animate-fadeIn">
                  {renderSubTabComponent(def.key)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
