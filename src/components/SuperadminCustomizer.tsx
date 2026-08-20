import React, { useState, useRef } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Megaphone,
  Newspaper,
  CreditCard,
  Share2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Check,
  ExternalLink,
  Upload,
  Eye,
  CheckCircle2,
  HelpCircle,
  Layers,
  Globe,
  MessageCircle,
  Phone,
  Mail,
  Zap,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCode,
  Download,
  AlertCircle,
  Copy,
  ChevronDown,
  Layout,
  Code
} from 'lucide-react';
import { usePlatformSettings, THEME_COLOR_MAP } from '../context/PlatformSettingsContext';
import { LoginSlideItem, BillingPlanItem, CustomNewsItem, PlatformCustomizationSettings } from '../types';
import { modalAlert } from '../context/ModalAlertContext';
import VisualLayoutBuilder from './customizer/VisualLayoutBuilder';
import VisualContainerBuilder from './customizer/VisualContainerBuilder';
import DynamicPlansManager from './customizer/DynamicPlansManager';
import CustomCodeEditor from './customizer/CustomCodeEditor';

interface SuperadminCustomizerProps {
  currentUserEmail?: string;
  onPreviewLogin?: () => void;
}

type SubTab = 'layout' | 'containers' | 'plans' | 'code' | 'theme' | 'identity' | 'banners' | 'slides' | 'news' | 'social' | 'modules';

export default function SuperadminCustomizer({ currentUserEmail, onPreviewLogin }: SuperadminCustomizerProps) {
  const { settings, updateSettings, saveSettingsToCloud, resetToDefaults, isSaving, themeClasses } = usePlatformSettings();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('layout');
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideImageInputRef = useRef<HTMLInputElement>(null);

  // Temporary slide creation/editing state
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideFormData, setSlideFormData] = useState<Partial<LoginSlideItem>>({
    url: '',
    tagline: '',
    alt: '',
    subtitle: '',
    active: true
  });

  // Temporary news creation/editing state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsFormData, setNewsFormData] = useState<Partial<CustomNewsItem>>({
    title: '',
    summary: '',
    category: 'Facturación Electrónica',
    badgeColor: 'blue',
    date: '15 de Agosto 2026',
    url: 'https://www.sri.gob.ec',
    isHighlight: false,
    source: 'SRI Ecuador',
    active: true
  });

  // Temporary billing plan creation/editing state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [planFormData, setPlanFormData] = useState<Partial<BillingPlanItem>>({
    name: '',
    tagline: '',
    priceMonthly: 14.99,
    priceYearly: 149.99,
    invoiceLimit: 300,
    userLimit: 2,
    features: ['Comprobantes Electrónicos', 'Firma XAdES-BES', 'Soporte WhatsApp'],
    isPopular: false,
    isRecommended: false,
    badge: '',
    buttonText: 'Contratar Plan',
    active: true,
    colorScheme: 'indigo',
    whatsappMessage: 'Hola, solicito información para contratar este plan de Facturación SRI.'
  });

  // Handle Logo Upload (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        modalAlert.warning('Imagen muy grande', 'El logotipo debe ser menor a 2MB para optimizar el rendimiento.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        updateSettings({ logoUrl: base64 });
        modalAlert.success('Logotipo Cargado', 'El logotipo de la plataforma se actualizó en la vista previa.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Favicon Upload
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        updateSettings({ faviconUrl: base64 });
        modalAlert.success('Favicon Actualizado', 'El icono de la pestaña del navegador se actualizó.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Slide Image Upload
  const handleSlideImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setSlideFormData(prev => ({ ...prev, url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save / Update Slide
  const handleSaveSlide = () => {
    if (!slideFormData.url || !slideFormData.tagline) {
      modalAlert.warning('Campos Incompletos', 'Debe ingresar la URL o imagen y el lema principal del slide.');
      return;
    }

    if (editingSlideId) {
      updateSettings(prev => ({
        loginSlides: prev.loginSlides.map(s => s.id === editingSlideId ? { ...s, ...(slideFormData as LoginSlideItem) } : s)
      }));
      setEditingSlideId(null);
    } else {
      const newSlide: LoginSlideItem = {
        id: `slide-${Date.now()}`,
        url: slideFormData.url || '',
        tagline: slideFormData.tagline || '',
        alt: slideFormData.alt || slideFormData.tagline || 'Slide Promocional',
        subtitle: slideFormData.subtitle || '',
        active: slideFormData.active ?? true
      };
      updateSettings(prev => ({
        loginSlides: [...prev.loginSlides, newSlide]
      }));
    }

    setSlideFormData({ url: '', tagline: '', alt: '', subtitle: '', active: true });
    modalAlert.success('Slide Guardado', 'El carrusel de inicio ha sido actualizado.');
  };

  const handleDeleteSlide = (id: string) => {
    if (settings.loginSlides.length <= 1) {
      modalAlert.warning('Acción Denegada', 'Debe existir al menos un slide en el carrusel.');
      return;
    }
    updateSettings(prev => ({
      loginSlides: prev.loginSlides.filter(s => s.id !== id)
    }));
  };

  // Save / Update News
  const handleSaveNews = () => {
    if (!newsFormData.title || !newsFormData.summary) {
      modalAlert.warning('Campos Incompletos', 'Debe ingresar el título y el resumen de la noticia.');
      return;
    }

    if (editingNewsId) {
      updateSettings(prev => ({
        customNews: prev.customNews.map(n => n.id === editingNewsId ? { ...n, ...(newsFormData as CustomNewsItem) } : n)
      }));
      setEditingNewsId(null);
    } else {
      const newNews: CustomNewsItem = {
        id: `news-${Date.now()}`,
        title: newsFormData.title || '',
        summary: newsFormData.summary || '',
        category: newsFormData.category || 'Tributario',
        badgeColor: newsFormData.badgeColor || 'blue',
        date: newsFormData.date || 'Hoy',
        publishedAt: new Date().toISOString(),
        url: newsFormData.url || 'https://www.sri.gob.ec',
        isHighlight: newsFormData.isHighlight ?? false,
        source: newsFormData.source || 'SRI Ecuador',
        active: true
      };
      updateSettings(prev => ({
        customNews: [newNews, ...prev.customNews]
      }));
    }

    setNewsFormData({
      title: '',
      summary: '',
      category: 'Facturación Electrónica',
      badgeColor: 'blue',
      date: '15 de Agosto 2026',
      url: 'https://www.sri.gob.ec',
      isHighlight: false,
      source: 'SRI Ecuador',
      active: true
    });
    modalAlert.success('Noticia Guardada', 'La noticia se actualizó en el portal.');
  };

  const handleDeleteNews = (id: string) => {
    updateSettings(prev => ({
      customNews: prev.customNews.filter(n => n.id !== id)
    }));
  };

  // Save / Update Billing Plan
  const handleSavePlan = () => {
    if (!planFormData.name || planFormData.priceMonthly === undefined) {
      modalAlert.warning('Campos Incompletos', 'Debe ingresar el nombre del plan y su precio mensual.');
      return;
    }

    if (editingPlanId) {
      updateSettings(prev => ({
        billingPlans: prev.billingPlans.map(p => p.id === editingPlanId ? { ...p, ...(planFormData as BillingPlanItem) } : p)
      }));
      setEditingPlanId(null);
    } else {
      const newPlan: BillingPlanItem = {
        id: `plan-${Date.now()}`,
        name: planFormData.name || 'Nuevo Plan',
        tagline: planFormData.tagline || '',
        priceMonthly: Number(planFormData.priceMonthly) || 0,
        priceYearly: Number(planFormData.priceYearly) || 0,
        invoiceLimit: Number(planFormData.invoiceLimit) || 0,
        userLimit: Number(planFormData.userLimit) || 1,
        features: planFormData.features && planFormData.features.length > 0 ? planFormData.features : ['Comprobantes SRI'],
        isPopular: planFormData.isPopular ?? false,
        isRecommended: planFormData.isRecommended ?? false,
        badge: planFormData.badge || '',
        buttonText: planFormData.buttonText || 'Contratar',
        active: planFormData.active ?? true,
        colorScheme: planFormData.colorScheme || 'indigo',
        whatsappMessage: planFormData.whatsappMessage || ''
      };
      updateSettings(prev => ({
        billingPlans: [...prev.billingPlans, newPlan]
      }));
    }

    setPlanFormData({
      name: '',
      tagline: '',
      priceMonthly: 14.99,
      priceYearly: 149.99,
      invoiceLimit: 300,
      userLimit: 2,
      features: ['Comprobantes Electrónicos', 'Firma XAdES-BES', 'Soporte WhatsApp'],
      isPopular: false,
      isRecommended: false,
      badge: '',
      buttonText: 'Contratar Plan',
      active: true,
      colorScheme: 'indigo',
      whatsappMessage: 'Hola, solicito información para contratar este plan de Facturación SRI.'
    });
    modalAlert.success('Plan Guardado', 'El plan de facturación fue actualizado exitosamente.');
  };

  const handleDeletePlan = (id: string) => {
    if (settings.billingPlans.length <= 1) {
      modalAlert.warning('Acción Denegada', 'Debe existir al menos un plan en la plataforma.');
      return;
    }
    updateSettings(prev => ({
      billingPlans: prev.billingPlans.filter(p => p.id !== id)
    }));
  };

  // Export JSON Settings
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orionnx_platform_settings_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    modalAlert.info('Configuración Exportada', 'Archivo JSON generado para respaldo.');
  };

  // Import JSON Settings
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        try {
          const parsed = JSON.parse(uploadEvent.target?.result as string);
          if (parsed && parsed.platformName) {
            updateSettings(parsed);
            modalAlert.success('Configuración Importada', 'Se aplicó la configuración importada desde el archivo JSON.');
          } else {
            modalAlert.error('Archivo Inválido', 'El archivo no contiene un formato de configuración válido.');
          }
        } catch {
          modalAlert.error('Error JSON', 'No se pudo parsear el archivo JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SUPERADMIN TOP HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        {/* Glow / Ambient background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SUPERADMIN MASTER CONTROL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Personalización & Marca de la Plataforma
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Personaliza el diseño global, paleta de colores, logotipo, banners de anuncios, carrusel de bienvenida, noticias del SRI, planes de suscripción y redes sociales para toda la plataforma de facturación.
            </p>
          </div>

          {/* MASTER ACTIONS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => saveSettingsToCloud(currentUserEmail)}
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar y Aplicar Todo'}</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Descargar copia de seguridad en JSON"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>

            <label className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Importar</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={resetToDefaults}
              className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 font-semibold text-xs rounded-xl border border-red-800/50 transition flex items-center gap-1.5 cursor-pointer"
              title="Restablecer todos los valores por defecto"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Fábrica</span>
            </button>
          </div>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 mt-8 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('layout')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'layout'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layout className="w-4 h-4 text-cyan-400" />
            <span>1. Estructura & Menú (Figma/Hostinger)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('containers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'containers'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>2. Lienzo & Contenedores</span>
          </button>

          <button
            onClick={() => setActiveSubTab('plans')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'plans'
                ? 'bg-amber-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>3. Planes de Facturación (Dinámico)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'code'
                ? 'bg-indigo-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-4 h-4 text-indigo-400" />
            <span>4. Inyección de Código (CSS / JS)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('theme')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'theme'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4 text-blue-400" />
            <span>5. Tema & Colores</span>
          </button>

          <button
            onClick={() => setActiveSubTab('identity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'identity'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            <span>6. Identidad & Logos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('banners')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'banners'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Megaphone className="w-4 h-4 text-sky-400" />
            <span>7. Banners & Anuncios</span>
          </button>

          <button
            onClick={() => setActiveSubTab('slides')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'slides'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>8. Carrusel de Login</span>
          </button>

          <button
            onClick={() => setActiveSubTab('news')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'news'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Newspaper className="w-4 h-4 text-emerald-400" />
            <span>9. Novedades SRI</span>
          </button>

          <button
            onClick={() => setActiveSubTab('social')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'social'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Share2 className="w-4 h-4 text-pink-400" />
            <span>10. Redes Sociales</span>
          </button>

          <button
            onClick={() => setActiveSubTab('modules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'modules'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>11. Interruptores</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB: ESTRUCTURA & MENÚ (FIGMA / HOSTINGER) */}
      {/* ========================================================================= */}
      {activeSubTab === 'layout' && <VisualLayoutBuilder />}

      {/* ========================================================================= */}
      {/* SUB-TAB: LIENZO & CONTENEDORES */}
      {/* ========================================================================= */}
      {activeSubTab === 'containers' && <VisualContainerBuilder />}

      {/* ========================================================================= */}
      {/* SUB-TAB: PLANES DE FACTURACIÓN (GESTOR DINÁMICO) */}
      {/* ========================================================================= */}
      {activeSubTab === 'plans' && <DynamicPlansManager />}

      {/* ========================================================================= */}
      {/* SUB-TAB: INYECCIÓN DE CÓDIGO (CSS / JS / HTML) */}
      {/* ========================================================================= */}
      {activeSubTab === 'code' && <CustomCodeEditor />}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TEMA, COLORES & ESTILO */}
      {/* ========================================================================= */}
      {activeSubTab === 'theme' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Paleta de Color Primario</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Selecciona el tono de marca que dominará los botones principales, badges activos y elementos destacados.
              </p>
            </div>

            {/* COLOR PRESETS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { name: 'blue', label: 'Azul SRI', hex: '#2563eb', bg: 'bg-blue-600' },
                { name: 'indigo', label: 'Índigo Orionnx', hex: '#4f46e5', bg: 'bg-indigo-600' },
                { name: 'purple', label: 'Púrpura Real', hex: '#9333ea', bg: 'bg-purple-600' },
                { name: 'emerald', label: 'Esmeralda Fiscal', hex: '#059669', bg: 'bg-emerald-600' },
                { name: 'teal', label: 'Verde Azulado', hex: '#0d9488', bg: 'bg-teal-600' },
                { name: 'cyan', label: 'Cyan Tecnológico', hex: '#0891b2', bg: 'bg-cyan-600' },
                { name: 'amber', label: 'Ámbar Comercial', hex: '#d97706', bg: 'bg-amber-600' },
                { name: 'rose', label: 'Rosa Magenta', hex: '#e11d48', bg: 'bg-rose-600' },
                { name: 'slate', label: 'Gris Grafito', hex: '#1e293b', bg: 'bg-slate-800' },
              ].map(color => (
                <button
                  key={color.name}
                  onClick={() => updateSettings({ primaryColorName: color.name as any, customPrimaryHex: color.hex })}
                  className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-2 cursor-pointer ${
                    settings.primaryColorName === color.name
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-6 h-6 rounded-full ${color.bg} shadow-sm flex items-center justify-center text-white`}>
                      {settings.primaryColorName === color.name && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{color.hex}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{color.label}</span>
                </button>
              ))}
            </div>

            {/* GRADIENT ACCENT SELECTOR */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Gradiente de Acento para Encabezados y Botones
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'blue-indigo', label: 'Azul & Índigo (Clásico)', class: 'from-blue-600 via-indigo-600 to-sky-500' },
                  { id: 'purple-indigo', label: 'Púrpura & Fucsia', class: 'from-purple-600 via-fuchsia-600 to-indigo-500' },
                  { id: 'emerald-teal', label: 'Esmeralda & Cyan', class: 'from-emerald-600 via-teal-600 to-cyan-500' },
                  { id: 'amber-orange', label: 'Ámbar & Naranja', class: 'from-amber-600 via-orange-600 to-red-500' },
                  { id: 'rose-pink', label: 'Rosa & Púrpura', class: 'from-rose-600 via-pink-600 to-purple-500' },
                  { id: 'cyber-dark', label: 'Cyber Slate', class: 'from-slate-900 via-zinc-800 to-neutral-800' }
                ].map(grad => (
                  <button
                    key={grad.id}
                    onClick={() => updateSettings({ accentGradient: grad.id as any })}
                    className={`p-3 rounded-2xl border transition-all text-left space-y-2 cursor-pointer ${
                      settings.accentGradient === grad.id
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className={`h-6 rounded-lg bg-gradient-to-r ${grad.class} shadow-xs flex items-center justify-end px-2`}>
                      {settings.accentGradient === grad.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-zinc-200">{grad.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* HEADER STYLE & CARD RADIUS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                  Estilo de Barra Superior (Header)
                </label>
                <select
                  value={settings.headerStyle}
                  onChange={(e) => updateSettings({ headerStyle: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-100"
                >
                  <option value="modern-white">Blanco Moderno con Sombra Suave</option>
                  <option value="gradient-glass">Glassmorphism Translúcido</option>
                  <option value="dark-slate">Oscuro Ejecutivo (Slate / Zinc)</option>
                  <option value="minimal-clean">Minimalista sin Bordes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
                  Redondeo de Tarjetas & Botones (Border Radius)
                </label>
                <select
                  value={settings.borderRadiusStyle}
                  onChange={(e) => updateSettings({ borderRadiusStyle: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-100"
                >
                  <option value="sm">Discreto (8px / sm)</option>
                  <option value="md">Estándar (12px / md)</option>
                  <option value="lg">Moderno (16px / lg)</option>
                  <option value="xl">Ultra Moderno (24px / xl)</option>
                </select>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW CARD */}
          <div className="bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Vista Previa en Vivo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                EN TIEMPO REAL
              </span>
            </div>

            {/* Mock Header */}
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                    O
                  </div>
                )}
                <div>
                  <div className="text-xs font-black uppercase">{settings.platformName || 'ORIONNX'}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">{settings.platformTagline || 'Facturación SRI'}</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono font-bold">
                RUC ACTIVO
              </span>
            </div>

            {/* Mock Nav Tab Active */}
            <div className="p-2 bg-slate-100 dark:bg-zinc-850 rounded-2xl flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm bg-gradient-to-r ${themeClasses.primaryGradient}`}>
                Historial Comprobantes
              </div>
              <div className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500">
                Emitir Factura
              </div>
            </div>

            {/* Mock Action Button */}
            <div className="space-y-2">
              <div className={`w-full py-2.5 rounded-xl text-xs font-bold text-white text-center shadow-md bg-gradient-to-r ${themeClasses.primaryGradient}`}>
                Botón Principal de Acción
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Los cambios se aplican automáticamente a botones, barras de navegación y acentos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: IDENTIDAD & LOGOTIPOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Identidad Visual & Textos de Marca</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Define el nombre comercial, logotipo principal de la plataforma y textos institucionales.
              </p>
            </div>

            {/* LOGO UPLOAD & PREVIEW */}
            <div className="p-5 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-4">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Logotipo Principal de la Plataforma
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-dashed border-slate-300 dark:border-zinc-700 flex items-center justify-center p-2 shrink-0 shadow-xs relative group overflow-hidden">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo Plataforma"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[9px] font-bold block">Sin Logo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Logotipo (PNG / SVG / JPG)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {settings.logoUrl && (
                      <button
                        onClick={() => updateSettings({ logoUrl: '' })}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900/30 transition cursor-pointer"
                      >
                        Quitar Logo
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recomendado: Imagen con fondo transparente (PNG o SVG) de 400x120px o formato cuadrado de 256x256px.
                  </p>
                </div>
              </div>
            </div>

            {/* BRAND TITLES & HEADINGS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Nombre de la Plataforma
                </label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => updateSettings({ platformName: e.target.value })}
                  placeholder="Ej: ORIONNX SERVICES"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Eslogan / Subtítulo del Header
                </label>
                <input
                  type="text"
                  value={settings.platformTagline}
                  onChange={(e) => updateSettings({ platformTagline: e.target.value })}
                  placeholder="Ej: Facturación Electrónica SRI"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Insignia Oficial / Badge Institucional
                </label>
                <input
                  type="text"
                  value={settings.systemBadge}
                  onChange={(e) => updateSettings({ systemBadge: e.target.value })}
                  placeholder="Ej: Emisión Oficial Ecuador • Estándar XAdES-BES"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Título de Bienvenida (Login)
                </label>
                <input
                  type="text"
                  value={settings.loginWelcomeHeading}
                  onChange={(e) => updateSettings({ loginWelcomeHeading: e.target.value })}
                  placeholder="Ej: Facturación Electrónica Inteligente"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Subtítulo de Bienvenida (Login)
                </label>
                <input
                  type="text"
                  value={settings.loginWelcomeSubheading}
                  onChange={(e) => updateSettings({ loginWelcomeSubheading: e.target.value })}
                  placeholder="Ej: Accede a la plataforma líder para emisión..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Texto de Copyright (Pie de Página)
                </label>
                <input
                  type="text"
                  value={settings.footerCopyright}
                  onChange={(e) => updateSettings({ footerCopyright: e.target.value })}
                  placeholder="Ej: © 2026 ORIONNX • Sistema Tributario SRI"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Texto Legal de Firma XAdES-BES
                </label>
                <input
                  type="text"
                  value={settings.footerLegalText}
                  onChange={(e) => updateSettings({ footerLegalText: e.target.value })}
                  placeholder="Ej: XAdES-BES Firmado y Conexiones Offline Oficial de Ecuador SRI habilitadas."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* FAVICON & QUICK PREVIEW */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                <span>Favicon del Navegador</span>
              </h4>
              <p className="text-xs text-slate-400">
                Icono que se muestra en la pestaña del navegador para todos los usuarios.
              </p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center p-1 shrink-0">
                  {settings.faviconUrl ? (
                    <img src={settings.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-xs font-mono font-bold text-slate-400">ICO</span>
                  )}
                </div>

                <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cargar Favicon</span>
                  <input
                    type="file"
                    accept="image/x-icon,image/png"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* LIVE FOOTER PREVIEW */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Previsualización Pie de Página
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-2xl text-[11px] text-slate-500 dark:text-zinc-400 space-y-1">
                <div className="font-bold text-slate-800 dark:text-zinc-200">{settings.footerCopyright}</div>
                <div className="flex items-center gap-1 text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{settings.footerLegalText}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BANNERS & ANUNCIOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          {/* TOP ANNOUNCEMENT BAR */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Barra Superior de Anuncios (Top Announcement Bar)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Mensaje flotante visible en la parte superior para avisos tributarios importantes o comunicados.
                  </p>
                </div>
              </div>

              {/* TOGGLE SWITCH */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.topBanner.enabled}
                  onChange={(e) => updateSettings({
                    topBanner: { ...settings.topBanner, enabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {settings.topBanner.enabled ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>

            {settings.topBanner.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Texto del Badge / Etiqueta
                  </label>
                  <input
                    type="text"
                    value={settings.topBanner.badgeText}
                    onChange={(e) => updateSettings({
                      topBanner: { ...settings.topBanner, badgeText: e.target.value }
                    })}
                    placeholder="Ej: NOVEDAD SRI"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Mensaje del Anuncio
                  </label>
                  <input
                    type="text"
                    value={settings.topBanner.message}
                    onChange={(e) => updateSettings({
                      topBanner: { ...settings.topBanner, message: e.target.value }
                    })}
                    placeholder="Ej: Sistema actualizado con esquema XAdES-BES 2.1..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Texto del Enlace (Opcional)
                  </label>
                  <input
                    type="text"
                    value={settings.topBanner.linkText || ''}
                    onChange={(e) => updateSettings({
                      topBanner: { ...settings.topBanner, linkText: e.target.value }
                    })}
                    placeholder="Ej: Ver Noticias SRI"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    URL del Enlace (Opcional)
                  </label>
                  <input
                    type="text"
                    value={settings.topBanner.linkUrl || ''}
                    onChange={(e) => updateSettings({
                      topBanner: { ...settings.topBanner, linkUrl: e.target.value }
                    })}
                    placeholder="Ej: https://sri.gob.ec o #news"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={settings.topBanner.isDismissible}
                      onChange={(e) => updateSettings({
                        topBanner: { ...settings.topBanner, isDismissible: e.target.checked }
                      })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Permitir al usuario cerrar el banner (X)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* PROMOTIONAL / DISCOUNT BANNER */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Banner Promocional de Planes & Ofertas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Banner destacado para promocionar suscripciones anuales, descuentos y novedades.
                  </p>
                </div>
              </div>

              {/* TOGGLE SWITCH */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.promoBanner.enabled}
                  onChange={(e) => updateSettings({
                    promoBanner: { ...settings.promoBanner, enabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {settings.promoBanner.enabled ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>

            {settings.promoBanner.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Título Promocional
                  </label>
                  <input
                    type="text"
                    value={settings.promoBanner.title}
                    onChange={(e) => updateSettings({
                      promoBanner: { ...settings.promoBanner, title: e.target.value }
                    })}
                    placeholder="Ej: ¡Potencia tu negocio con facturación ilimitada!"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Etiqueta de Descuento
                  </label>
                  <input
                    type="text"
                    value={settings.promoBanner.discountText || ''}
                    onChange={(e) => updateSettings({
                      promoBanner: { ...settings.promoBanner, discountText: e.target.value }
                    })}
                    placeholder="Ej: 30% OFF en Plan Anual"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Subtítulo / Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={settings.promoBanner.subtitle}
                    onChange={(e) => updateSettings({
                      promoBanner: { ...settings.promoBanner, subtitle: e.target.value }
                    })}
                    placeholder="Ej: Activa tu plan corporativo con soporte preferencial..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={settings.promoBanner.buttonText}
                    onChange={(e) => updateSettings({
                      promoBanner: { ...settings.promoBanner, buttonText: e.target.value }
                    })}
                    placeholder="Ej: Ver Planes Disponibles"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                    Gradiente Visual
                  </label>
                  <select
                    value={settings.promoBanner.gradientTheme}
                    onChange={(e) => updateSettings({
                      promoBanner: { ...settings.promoBanner, gradientTheme: e.target.value as any }
                    })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  >
                    <option value="blue-indigo">Azul & Índigo</option>
                    <option value="purple-indigo">Púrpura & Violeta</option>
                    <option value="emerald-teal">Esmeralda & Turquesa</option>
                    <option value="amber-orange">Ámbar & Dorado</option>
                    <option value="cyber-dark">Cyber Dark</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CARRUSEL DE LOGIN */}
      {/* ========================================================================= */}
      {activeSubTab === 'slides' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Diapositivas del Carrusel de Inicio / Login</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Gestiona las imágenes de fondo, lemas y mensajes que ven los usuarios al ingresar a la plataforma.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingSlideId(null);
                  setSlideFormData({ url: '', tagline: '', alt: '', subtitle: '', active: true });
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Slide</span>
              </button>
            </div>

            {/* FORM FOR ADDING / EDITING SLIDE */}
            <div className="p-5 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/30 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
                {editingSlideId ? 'Editar Diapositiva' : 'Nueva Diapositiva'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    URL de la Imagen (o sube un archivo abajo)
                  </label>
                  <input
                    type="text"
                    value={slideFormData.url || ''}
                    onChange={(e) => setSlideFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div className="flex items-end">
                  <label className="w-full px-4 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-zinc-700 transition cursor-pointer flex items-center justify-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Subir desde mi PC</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlideImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Lema / Título Principal (Tagline)
                  </label>
                  <input
                    type="text"
                    value={slideFormData.tagline || ''}
                    onChange={(e) => setSlideFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Ej: Emisión Rápida & Firma XAdES-BES"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Subtítulo / Descripción
                  </label>
                  <input
                    type="text"
                    value={slideFormData.subtitle || ''}
                    onChange={(e) => setSlideFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Ej: Validación inmediata ante el SRI..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Descripción Accesible (Alt Text)
                  </label>
                  <input
                    type="text"
                    value={slideFormData.alt || ''}
                    onChange={(e) => setSlideFormData(prev => ({ ...prev, alt: e.target.value }))}
                    placeholder="Ej: Asesora Profesional SRI"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingSlideId && (
                  <button
                    onClick={() => {
                      setEditingSlideId(null);
                      setSlideFormData({ url: '', tagline: '', alt: '', subtitle: '', active: true });
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSaveSlide}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  {editingSlideId ? 'Actualizar Diapositiva' : 'Guardar Diapositiva'}
                </button>
              </div>
            </div>

            {/* LIST OF CURRENT SLIDES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {settings.loginSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="group relative bg-white dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                >
                  <div className="relative h-36 bg-slate-900 overflow-hidden">
                    <img
                      src={slide.url}
                      alt={slide.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                      Slide #{index + 1}
                    </span>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                        {slide.tagline}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                        {slide.subtitle || slide.alt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          setEditingSlideId(slide.id);
                          setSlideFormData(slide);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: NOVEDADES & NOTICIAS SRI */}
      {/* ========================================================================= */}
      {activeSubTab === 'news' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Gestor de Noticias y Comunicados Tributarios SRI</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Publica y edita las noticias tributarias que aparecen en la barra de noticias del login y en el portal general.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingNewsId(null);
                  setNewsFormData({
                    title: '',
                    summary: '',
                    category: 'Facturación Electrónica',
                    badgeColor: 'blue',
                    date: '15 de Agosto 2026',
                    url: 'https://www.sri.gob.ec',
                    isHighlight: false,
                    source: 'SRI Ecuador',
                    active: true
                  });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Noticia</span>
              </button>
            </div>

            {/* FORM FOR ADDING / EDITING NEWS */}
            <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                {editingNewsId ? 'Editar Noticia / Comunicado' : 'Crear Nueva Noticia SRI'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Título de la Noticia
                  </label>
                  <input
                    type="text"
                    value={newsFormData.title || ''}
                    onChange={(e) => setNewsFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Actualización de Esquema XAdES-BES SRI 2026"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={newsFormData.category || ''}
                    onChange={(e) => setNewsFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ej: Facturación Electrónica / IVA 15%"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Resumen Informativo
                  </label>
                  <textarea
                    rows={2}
                    value={newsFormData.summary || ''}
                    onChange={(e) => setNewsFormData(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Breve resumen explicativo del cambio normativo..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Fecha de Publicación
                  </label>
                  <input
                    type="text"
                    value={newsFormData.date || ''}
                    onChange={(e) => setNewsFormData(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="Ej: 15 de Agosto 2026"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Enlace Externo (URL)
                  </label>
                  <input
                    type="text"
                    value={newsFormData.url || ''}
                    onChange={(e) => setNewsFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://www.sri.gob.ec/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Fuente Oficial
                  </label>
                  <input
                    type="text"
                    value={newsFormData.source || ''}
                    onChange={(e) => setNewsFormData(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="Ej: SRI Dirección General"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={newsFormData.isHighlight || false}
                      onChange={(e) => setNewsFormData(prev => ({ ...prev, isHighlight: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Fijar como Destacada ⭐</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingNewsId && (
                  <button
                    onClick={() => {
                      setEditingNewsId(null);
                      setNewsFormData({
                        title: '',
                        summary: '',
                        category: 'Facturación Electrónica',
                        badgeColor: 'blue',
                        date: '15 de Agosto 2026',
                        url: 'https://www.sri.gob.ec',
                        isHighlight: false,
                        source: 'SRI Ecuador',
                        active: true
                      });
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSaveNews}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  {editingNewsId ? 'Actualizar Noticia' : 'Publicar Noticia'}
                </button>
              </div>
            </div>

            {/* LIST OF ACTIVE NEWS */}
            <div className="space-y-3">
              {settings.customNews.map((newsItem) => (
                <div
                  key={newsItem.id}
                  className="p-4 bg-white dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        {newsItem.category}
                      </span>
                      {newsItem.isHighlight && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          ⭐ DESTACADA
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {newsItem.date} • {newsItem.source}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {newsItem.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                      {newsItem.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingNewsId(newsItem.id);
                        setNewsFormData(newsItem);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Editar Noticia"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteNews(newsItem.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Eliminar Noticia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 6: PLANES DE FACTURACIÓN */}
      {/* ========================================================================= */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Planes Comerciales de Facturación & Suscripción</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Configura los paquetes de comprobantes, precios y botones de contratación por WhatsApp para tus clientes.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPlanId(null);
                  setPlanFormData({
                    name: '',
                    tagline: '',
                    priceMonthly: 14.99,
                    priceYearly: 149.99,
                    invoiceLimit: 300,
                    userLimit: 2,
                    features: ['Comprobantes Electrónicos', 'Firma XAdES-BES', 'Soporte WhatsApp'],
                    isPopular: false,
                    isRecommended: false,
                    badge: '',
                    buttonText: 'Contratar Plan',
                    active: true,
                    colorScheme: 'indigo',
                    whatsappMessage: 'Hola, solicito información para contratar este plan de Facturación SRI.'
                  });
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Plan</span>
              </button>
            </div>

            {/* FORM FOR ADDING / EDITING PLAN */}
            <div className="p-5 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                {editingPlanId ? 'Editar Plan Comercial' : 'Nuevo Plan de Facturación'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Nombre del Plan
                  </label>
                  <input
                    type="text"
                    value={planFormData.name || ''}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Plan Emprendedor / Pyme Pro"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Precio Mensual ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={planFormData.priceMonthly ?? 0}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, priceMonthly: parseFloat(e.target.value) || 0 }))}
                    placeholder="9.99"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Precio Anual ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={planFormData.priceYearly ?? 0}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, priceYearly: parseFloat(e.target.value) || 0 }))}
                    placeholder="89.99"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Límite Comprobantes (0 = Ilimitado)
                  </label>
                  <input
                    type="number"
                    value={planFormData.invoiceLimit ?? 100}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, invoiceLimit: parseInt(e.target.value, 10) || 0 }))}
                    placeholder="100"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Lema / Subtítulo del Plan
                  </label>
                  <input
                    type="text"
                    value={planFormData.tagline || ''}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Ej: Para profesionales y pequeños negocios RIMPE."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Insignia / Badge
                  </label>
                  <input
                    type="text"
                    value={planFormData.badge || ''}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="Ej: MÁS POPULAR / RECOMENDADO"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Color del Plan
                  </label>
                  <select
                    value={planFormData.colorScheme}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, colorScheme: e.target.value as any }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
                  >
                    <option value="blue">Azul</option>
                    <option value="indigo">Índigo</option>
                    <option value="purple">Púrpura</option>
                    <option value="emerald">Esmeralda</option>
                    <option value="amber">Ámbar</option>
                    <option value="rose">Rosa</option>
                  </select>
                </div>

                {/* FEATURES LIST BUILDER */}
                <div className="sm:col-span-2 md:col-span-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Características Incluidas (Bullets)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      placeholder="Ej: Firma electrónica XAdES-BES incluida"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newFeatureText.trim()) {
                            setPlanFormData(prev => ({
                              ...prev,
                              features: [...(prev.features || []), newFeatureText.trim()]
                            }));
                            setNewFeatureText('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newFeatureText.trim()) {
                          setPlanFormData(prev => ({
                            ...prev,
                            features: [...(prev.features || []), newFeatureText.trim()]
                          }));
                          setNewFeatureText('');
                        }
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(planFormData.features || []).map((feat, fIdx) => (
                      <span
                        key={fIdx}
                        className="px-3 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanFormData(prev => ({
                              ...prev,
                              features: (prev.features || []).filter((_, idx) => idx !== fIdx)
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 ml-1 cursor-pointer font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Mensaje Personalizado de WhatsApp para Contratación
                  </label>
                  <input
                    type="text"
                    value={planFormData.whatsappMessage || ''}
                    onChange={(e) => setPlanFormData(prev => ({ ...prev, whatsappMessage: e.target.value }))}
                    placeholder="Ej: Hola, solicito información para contratar el Plan Pyme Pro ($19.99/mes)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingPlanId && (
                  <button
                    onClick={() => {
                      setEditingPlanId(null);
                      setPlanFormData({
                        name: '',
                        tagline: '',
                        priceMonthly: 14.99,
                        priceYearly: 149.99,
                        invoiceLimit: 300,
                        userLimit: 2,
                        features: ['Comprobantes Electrónicos', 'Firma XAdES-BES', 'Soporte WhatsApp'],
                        isPopular: false,
                        isRecommended: false,
                        badge: '',
                        buttonText: 'Contratar Plan',
                        active: true,
                        colorScheme: 'indigo',
                        whatsappMessage: 'Hola, solicito información para contratar este plan de Facturación SRI.'
                      });
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSavePlan}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  {editingPlanId ? 'Actualizar Plan' : 'Guardar Plan'}
                </button>
              </div>
            </div>

            {/* PREVIEW OF ALL BILLING PLANS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {settings.billingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-zinc-850 rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition-all ${
                    plan.isPopular || plan.isRecommended
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-[1.02]'
                      : 'border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        ${plan.priceMonthly.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">/ mes</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        (${plan.priceYearly.toFixed(2)}/año)
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl text-xs space-y-1 font-semibold">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Cupo Comprobantes:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {plan.invoiceLimit === 0 ? 'Ilimitados 🚀' : `${plan.invoiceLimit} / mes`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Usuarios Permitidos:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {plan.userLimit === 0 ? 'Ilimitados' : `${plan.userLimit} usuarios`}
                        </span>
                      </div>
                    </div>

                    {/* FEATURES BULLETS */}
                    <div className="space-y-2 pt-2">
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 space-y-2 border-t border-slate-100 dark:border-zinc-800 mt-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setEditingPlanId(plan.id);
                          setPlanFormData(plan);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 7: REDES SOCIALES & CONTACTO */}
      {/* ========================================================================= */}
      {activeSubTab === 'social' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span>Enlaces de Redes Sociales & Soporte Corporativo</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Configura los canales de atención y redes sociales que se visualizarán en el pie de página y en la pantalla de bienvenida.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp de Ventas / Soporte</span>
              </label>
              <input
                type="text"
                value={settings.socialLinks.whatsapp || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, whatsapp: e.target.value }
                })}
                placeholder="https://wa.me/593995831920"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Facebook</span>
              </label>
              <input
                type="text"
                value={settings.socialLinks.facebook || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-pink-500" />
                <span>Instagram</span>
              </label>
              <input
                type="text"
                value={settings.socialLinks.instagram || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-slate-900 dark:text-white" />
                <span>TikTok</span>
              </label>
              <input
                type="text"
                value={settings.socialLinks.tiktok || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, tiktok: e.target.value }
                })}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-500" />
                <span>LinkedIn</span>
              </label>
              <input
                type="text"
                value={settings.socialLinks.linkedin || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, linkedin: e.target.value }
                })}
                placeholder="https://linkedin.com/company/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-500" />
                <span>Sitio Web Corporativo</span>
              </label>
              <input
                type="text"
                value={settings.socialLinks.website || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, website: e.target.value }
                })}
                placeholder="https://orionnx.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-amber-500" />
                <span>Correo de Contacto / Soporte</span>
              </label>
              <input
                type="email"
                value={settings.socialLinks.email || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, email: e.target.value }
                })}
                placeholder="contacto@orionnx.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>Teléfono de Atención</span>
              </label>
              <input
                type="text"
                value={settings.socialLinks.phone || ''}
                onChange={(e) => updateSettings({
                  socialLinks: { ...settings.socialLinks, phone: e.target.value }
                })}
                placeholder="+593 99 583 1920"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 8: MÓDULOS & INTERRUPTORES */}
      {/* ========================================================================= */}
      {activeSubTab === 'modules' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Interruptores de Visibilidad de Componentes</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Enciende o apaga componentes y botones en las distintas pantallas de la plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'showSriNewsInLogin', label: 'Mostrar Widget de Noticias en la Pantalla de Login', desc: 'Permite a los visitantes ver las noticias y resoluciones SRI actualizadas.' },
              { key: 'showPlansInLogin', label: 'Mostrar Botón de "Planes de Facturación" en Login', desc: 'Abre el modal interactivo con los planes y precios para nuevos clientes.' },
              { key: 'showPlansInApp', label: 'Mostrar Botón de "Planes" en el Menú Superior para Inquilinos', desc: 'Permite a los usuarios consultar mejoras de plan dentro de la plataforma.' },
              { key: 'showTopAnnouncementBar', label: 'Mostrar Barra de Anuncio Superior', desc: 'Muestra la barra superior fija con el mensaje oficial configurado.' },
              { key: 'showPromotionalBanner', label: 'Mostrar Banner Promocional de Descuentos', desc: 'Habilita el banner con ofertas en el área de trabajo.' },
              { key: 'showSocialLinksInFooter', label: 'Mostrar Enlaces de Redes Sociales en el Pie de Página', desc: 'Iconos directos a WhatsApp, Instagram, Facebook y soporte.' },
              { key: 'showSocialLinksInLogin', label: 'Mostrar Enlaces de Redes Sociales en la Pantalla de Login', desc: 'Acceso directo a canales de contacto antes de iniciar sesión.' },
              { key: 'showSimulatorIndicator', label: 'Mostrar Indicador de Conexión SRI / Modo Simulador', desc: 'Insignia de estado verde/azul en el encabezado.' },
            ].map(moduleItem => (
              <div
                key={moduleItem.key}
                className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {moduleItem.label}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {moduleItem.desc}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={(settings.modules as any)[moduleItem.key] ?? true}
                    onChange={(e) => updateSettings({
                      modules: { ...settings.modules, [moduleItem.key]: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
