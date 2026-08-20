import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Code,
  Sparkles,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Copy,
  LayoutGrid,
  CreditCard,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  Play,
  Monitor
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { CustomContainerWidget } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';

const WIDGET_TYPE_INFO: Record<string, { label: string; icon: any; description: string }> = {
  'hero-banner': {
    label: 'Hero Banner Corporativo',
    icon: Sparkles,
    description: 'Cabecera destacada con título, subtítulo, botón CTA y degradados.'
  },
  'stat-metrics': {
    label: 'Tarjetas de Métricas & KPIs',
    icon: LayoutGrid,
    description: 'Cuadrícula de estadísticas clave, indicadores del SRI y estado del sistema.'
  },
  'custom-html-code': {
    label: 'Bloque de Código Personalizado',
    icon: Code,
    description: 'Ejecuta código HTML, CSS, Tailwind o JS personalizado en vivo.'
  },
  'quick-actions': {
    label: 'Accesos Rápidos (Quick Actions)',
    icon: Zap,
    description: 'Botones de acción inmediata para emitir facturas, retenciones y catálogos.'
  },
  'plans-catalog': {
    label: 'Catálogo Embebido de Planes SRI',
    icon: CreditCard,
    description: 'Sección embebida con los planes de facturación y contratación inmediata.'
  },
  'iframe-embed': {
    label: 'Iframe / Dashboard Externo',
    icon: Globe,
    description: 'Embebe dashboards de Looker Studio, PowerBI, videos o páginas externas.'
  }
};

export default function VisualContainerBuilder() {
  const { settings, updateSettings } = usePlatformSettings();
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTypeForNew, setSelectedTypeForNew] = useState<CustomContainerWidget['type']>('hero-banner');

  const containers = settings.customContainers || [];

  // Toggle visibility
  const handleToggleVisibility = (id: string) => {
    const updated = containers.map(c =>
      c.id === id ? { ...c, visible: !c.visible } : c
    );
    updateSettings({ customContainers: updated });
  };

  // Move up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newContainers = [...containers];
    const temp = newContainers[index];
    newContainers[index] = newContainers[index - 1];
    newContainers[index - 1] = temp;
    newContainers.forEach((c, idx) => { c.order = idx + 1; });
    updateSettings({ customContainers: newContainers });
  };

  // Move down
  const handleMoveDown = (index: number) => {
    if (index >= containers.length - 1) return;
    const newContainers = [...containers];
    const temp = newContainers[index];
    newContainers[index] = newContainers[index + 1];
    newContainers[index + 1] = temp;
    newContainers.forEach((c, idx) => { c.order = idx + 1; });
    updateSettings({ customContainers: newContainers });
  };

  // Duplicate container
  const handleDuplicate = (container: CustomContainerWidget) => {
    const cloned: CustomContainerWidget = {
      ...container,
      id: `container-${Date.now()}`,
      title: `${container.title} (Copia)`,
      order: containers.length + 1
    };
    updateSettings({ customContainers: [...containers, cloned] });
    modalAlert.success('Contenedor Duplicado', `Se creó una copia de "${container.title}".`);
  };

  // Delete container
  const handleDelete = (id: string) => {
    modalAlert.confirm(
      '¿Eliminar Contenedor?',
      'Esta acción eliminará el contenedor seleccionado de la interfaz visual.',
      () => {
        const updated = containers.filter(c => c.id !== id);
        updateSettings({ customContainers: updated });
        if (editingWidgetId === id) setEditingWidgetId(null);
        modalAlert.info('Contenedor Eliminado', 'El contenedor fue eliminado con éxito.');
      }
    );
  };

  // Add new widget
  const handleCreateNewContainer = () => {
    let newWidget: CustomContainerWidget;

    if (selectedTypeForNew === 'hero-banner') {
      newWidget = {
        id: `container-${Date.now()}`,
        title: 'Nuevo Banner Destacado',
        type: 'hero-banner',
        columnSpan: 'col-12',
        order: containers.length + 1,
        visible: true,
        showInDashboard: true,
        showInLogin: false,
        style: {
          bgType: 'gradient',
          gradient: 'from-slate-900 via-indigo-950 to-blue-900',
          textColor: '#ffffff',
          borderRadius: '3xl',
          shadow: 'xl',
          padding: 'lg'
        },
        content: {
          heroBadge: 'NOVEDAD',
          heroTitle: 'Facturación Electrónica Segura y Rápida',
          heroSubtitle: 'Emite facturas y comprobantes autorizados con firma XAdES-BES en segundos.',
          heroButtonText: 'Comenzar Ahora',
          heroButtonUrl: '#new-invoice'
        }
      };
    } else if (selectedTypeForNew === 'stat-metrics') {
      newWidget = {
        id: `container-${Date.now()}`,
        title: 'Métricas & Estadísticas',
        type: 'stat-metrics',
        columnSpan: 'col-12',
        order: containers.length + 1,
        visible: true,
        showInDashboard: true,
        showInLogin: false,
        style: {
          bgType: 'card',
          borderRadius: '2xl',
          shadow: 'sm',
          padding: 'md'
        },
        content: {
          metrics: [
            { id: 'm-1', label: 'Comprobantes Emitidos', value: '1,450+', subtext: 'Este mes', iconName: 'FileText', color: '#3b82f6', trend: '+12% vs mes anterior' },
            { id: 'm-2', label: 'Autorizaciones SRI', value: '99.8%', subtext: 'Tiempo real', iconName: 'ShieldCheck', color: '#10b981', trend: 'Sin rechazos' },
            { id: 'm-3', label: 'Clientes Activos', value: '320', subtext: 'En catálogo', iconName: 'Users', color: '#8b5cf6', trend: 'Directorio sincronizado' },
            { id: 'm-4', label: 'Esquema Tributario', value: 'XAdES-BES', subtext: 'Norma SRI 2026', iconName: 'Coins', color: '#f59e0b', trend: 'Vigente' }
          ]
        }
      };
    } else if (selectedTypeForNew === 'custom-html-code') {
      newWidget = {
        id: `container-${Date.now()}`,
        title: 'Bloque de Código Personalizado',
        type: 'custom-html-code',
        columnSpan: 'col-12',
        order: containers.length + 1,
        visible: true,
        showInDashboard: true,
        showInLogin: false,
        style: {
          bgType: 'card',
          borderRadius: '2xl',
          shadow: 'md',
          padding: 'md'
        },
        content: {
          htmlCode: `<div class="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
  <div>
    <h3 class="text-xl font-bold">✨ Bloque HTML Personalizado</h3>
    <p class="text-xs text-blue-100 mt-1">Puedes escribir código HTML, clases de Tailwind CSS y widgets dinámicos aquí.</p>
  </div>
  <button onclick="alert('¡Código interactivo funcionando!')" class="px-4 py-2 bg-white text-blue-700 font-bold rounded-xl text-xs shadow hover:bg-blue-50 transition cursor-pointer">
    Probar Acción
  </button>
</div>`
        }
      };
    } else if (selectedTypeForNew === 'quick-actions') {
      newWidget = {
        id: `container-${Date.now()}`,
        title: 'Accesos Rápidos de Facturación',
        type: 'quick-actions',
        columnSpan: 'col-12',
        order: containers.length + 1,
        visible: true,
        showInDashboard: true,
        showInLogin: false,
        style: {
          bgType: 'card',
          borderRadius: '2xl',
          shadow: 'sm',
          padding: 'md'
        },
        content: {
          quickActions: [
            { id: 'qa-1', label: 'Emitir Factura', actionTab: 'new-invoice', iconName: 'PlusCircle', color: '#2563eb' },
            { id: 'qa-2', label: 'Nota de Crédito', actionTab: 'new-nc', iconName: 'Receipt', color: '#dc2626' },
            { id: 'qa-3', label: 'Retención SRI', actionTab: 'retentions', iconName: 'Coins', color: '#059669' },
            { id: 'qa-4', label: 'Proforma', actionTab: 'proformas', iconName: 'FileSpreadsheet', color: '#7c3aed' },
          ]
        }
      };
    } else if (selectedTypeForNew === 'plans-catalog') {
      newWidget = {
        id: `container-${Date.now()}`,
        title: 'Catálogo de Planes SRI',
        type: 'plans-catalog',
        columnSpan: 'col-12',
        order: containers.length + 1,
        visible: true,
        showInDashboard: true,
        showInLogin: false,
        style: {
          bgType: 'solid',
          bgColor: '#ffffff',
          borderRadius: '3xl',
          shadow: 'md',
          padding: 'lg'
        },
        content: {
          heroTitle: 'Nuestros Planes de Facturación',
          heroSubtitle: 'Soluciones a tu medida para emisión electrónica en Ecuador.'
        }
      };
    } else {
      // iframe
      newWidget = {
        id: `container-${Date.now()}`,
        title: 'Iframe / Dashboard Embebido',
        type: 'iframe-embed',
        columnSpan: 'col-12',
        order: containers.length + 1,
        visible: true,
        showInDashboard: true,
        showInLogin: false,
        style: {
          bgType: 'card',
          borderRadius: '2xl',
          shadow: 'md',
          padding: 'sm'
        },
        content: {
          iframeUrl: 'https://www.sri.gob.ec',
          iframeHeight: 400
        }
      };
    }

    updateSettings({ customContainers: [...containers, newWidget] });
    setShowAddModal(false);
    setEditingWidgetId(newWidget.id);
    modalAlert.success('Contenedor Creado', `Se ha agregado "${newWidget.title}" a tu lienzo visual.`);
  };

  // Update specific widget in list
  const handleUpdateWidget = (id: string, updates: Partial<CustomContainerWidget>) => {
    const updated = containers.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    updateSettings({ customContainers: updated });
  };

  const editingWidget = containers.find(c => c.id === editingWidgetId);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>CONSTRUCTOR VISUAL DE CONTENEDORES (FIGMA & HOSTINGER STYLE)</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Diseño de Bloques, Contenedores y Código en Vivo
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Crea contenedores dinámicos, reorganiza secciones, inserta banners, KPIs o inyecta código HTML/CSS/JS personalizado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Contenedor</span>
          </button>
        </div>

        {/* CONTAINER BLOCKS LIST (FIGMA-STYLE STACK) */}
        <div className="space-y-4">
          <div className="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
            Contenedores en el Lienzo ({containers.length}):
          </div>

          {containers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-zinc-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 space-y-3">
              <Layers className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="font-bold text-slate-800 dark:text-zinc-200 text-sm">No hay contenedores creados</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Haz clic en "+ Crear Nuevo Contenedor" para agregar banners, métricas o código a la plataforma.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {containers.map((c, index) => {
                const info = WIDGET_TYPE_INFO[c.type] || WIDGET_TYPE_INFO['hero-banner'];
                const IconComponent = info.icon;
                const isSelected = editingWidgetId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 shadow-md'
                        : c.visible !== false
                        ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                        : 'bg-slate-100/60 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-700 opacity-60'
                    }`}
                  >
                    <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                      {/* Left: Drag Handle, Icon, Title, Type */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>

                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              {c.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 uppercase">
                              {info.label}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                              {c.columnSpan}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            {c.showInDashboard ? '✅ Visible en Dashboard' : '❌ Oculto en Dashboard'} • {c.showInLogin ? '✅ Visible en Login' : '❌ Oculto en Login'}
                          </div>
                        </div>
                      </div>

                      {/* Right: Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="Mover arriba"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === containers.length - 1}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="Mover abajo"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(c.id)}
                          className={`p-1.5 rounded-xl transition cursor-pointer ${
                            c.visible !== false
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          }`}
                          title={c.visible !== false ? 'Visible' : 'Oculto'}
                        >
                          {c.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(c)}
                          className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                          title="Duplicar contenedor"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingWidgetId(isSelected ? null : c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'Cerrar Editor' : 'Configurar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED LIVE CONFIGURATION PANEL */}
                    {isSelected && (
                      <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-t border-blue-200 dark:border-blue-900/40 space-y-6 text-xs animate-fade-in">
                        
                        {/* Title & Layout Config */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                              Título del Contenedor
                            </label>
                            <input
                              type="text"
                              value={c.title}
                              onChange={(e) => handleUpdateWidget(c.id, { title: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                              Ancho de Columna (Grid Span)
                            </label>
                            <select
                              value={c.columnSpan}
                              onChange={(e) => handleUpdateWidget(c.id, { columnSpan: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                            >
                              <option value="col-12">100% (Ancho Completo - col-12)</option>
                              <option value="col-8">66% (2/3 de Pantalla - col-8)</option>
                              <option value="col-6">50% (Media Pantalla - col-6)</option>
                              <option value="col-4">33% (1/3 de Pantalla - col-4)</option>
                              <option value="col-3">25% (1/4 de Pantalla - col-3)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                              Estilo de Fondo
                            </label>
                            <select
                              value={c.style?.bgType || 'card'}
                              onChange={(e) => handleUpdateWidget(c.id, {
                                style: { ...c.style, bgType: e.target.value as any }
                              })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                            >
                              <option value="card">Tarjeta Blanca / Slate Estándar</option>
                              <option value="gradient">Degradado Moderno</option>
                              <option value="solid">Color Sólido Personalizado</option>
                              <option value="glass">Efecto Glassmorphism / Vidrio</option>
                            </select>
                          </div>
                        </div>

                        {/* SPECIFIC FIELDS FOR CODE RUNNER / HERO / IFRAME */}
                        {c.type === 'custom-html-code' && (
                          <div className="space-y-3 p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs border border-slate-800">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Code className="w-4 h-4 text-emerald-400" />
                                <span>Editor de Código en Vivo (HTML / CSS / Tailwind)</span>
                              </span>
                              <span className="text-emerald-400 font-bold">● Ejecución en Tiempo Real</span>
                            </div>

                            <textarea
                              rows={8}
                              value={c.content?.htmlCode || ''}
                              onChange={(e) => handleUpdateWidget(c.id, {
                                content: { ...c.content, htmlCode: e.target.value }
                              })}
                              placeholder="<div>Escribe tu código HTML o Tailwind aquí...</div>"
                              className="w-full bg-slate-900 text-emerald-300 p-3 rounded-xl border border-slate-700 font-mono text-xs focus:outline-emerald-500"
                            />

                            {/* Live mini sandbox */}
                            <div className="pt-2">
                              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                Vista Previa del Código:
                              </div>
                              <div
                                className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-900 font-sans"
                                dangerouslySetInnerHTML={{ __html: c.content?.htmlCode || '<em>Sin código</em>' }}
                              />
                            </div>
                          </div>
                        )}

                        {c.type === 'hero-banner' && (
                          <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                            <div className="font-bold text-slate-800 dark:text-white">
                              Contenido del Hero Banner
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                                  Título Principal
                                </label>
                                <input
                                  type="text"
                                  value={c.content?.heroTitle || ''}
                                  onChange={(e) => handleUpdateWidget(c.id, {
                                    content: { ...c.content, heroTitle: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                                  Placa / Badge Superior
                                </label>
                                <input
                                  type="text"
                                  value={c.content?.heroBadge || ''}
                                  onChange={(e) => handleUpdateWidget(c.id, {
                                    content: { ...c.content, heroBadge: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                                  Subtítulo Descriptivo
                                </label>
                                <textarea
                                  rows={2}
                                  value={c.content?.heroSubtitle || ''}
                                  onChange={(e) => handleUpdateWidget(c.id, {
                                    content: { ...c.content, heroSubtitle: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                                  Texto del Botón CTA
                                </label>
                                <input
                                  type="text"
                                  value={c.content?.heroButtonText || ''}
                                  onChange={(e) => handleUpdateWidget(c.id, {
                                    content: { ...c.content, heroButtonText: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                                  Enlace / Acción del Botón
                                </label>
                                <input
                                  type="text"
                                  value={c.content?.heroButtonUrl || ''}
                                  onChange={(e) => handleUpdateWidget(c.id, {
                                    content: { ...c.content, heroButtonUrl: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {c.type === 'iframe-embed' && (
                          <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700">
                            <div className="font-bold text-slate-800 dark:text-white">
                              Configuración de Iframe / Dashboard Externo
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                                  URL del Iframe
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://lookerstudio.google.com/embed/..."
                                  value={c.content?.iframeUrl || ''}
                                  onChange={(e) => handleUpdateWidget(c.id, {
                                    content: { ...c.content, iframeUrl: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-slate-600 dark:text-zinc-400 mb-1">
                                  Altura en Pixeles (px)
                                </label>
                                <input
                                  type="number"
                                  min={200}
                                  max={1200}
                                  value={c.content?.iframeHeight || 400}
                                  onChange={(e) => handleUpdateWidget(c.id, {
                                    content: { ...c.content, iframeHeight: parseInt(e.target.value) || 400 }
                                  })}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Visibility Checkboxes */}
                        <div className="flex items-center gap-6 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-zinc-300">
                            <input
                              type="checkbox"
                              checked={c.showInDashboard !== false}
                              onChange={(e) => handleUpdateWidget(c.id, { showInDashboard: e.target.checked })}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span>Mostrar en el Panel Principal (Dashboard)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-zinc-300">
                            <input
                              type="checkbox"
                              checked={c.showInLogin === true}
                              onChange={(e) => handleUpdateWidget(c.id, { showInLogin: e.target.checked })}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span>Mostrar en la Pantalla de Login</span>
                          </label>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA AGREGAR NUEVO TIPO DE CONTENEDOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Selecciona el Tipo de Contenedor a Crear
                </h4>
                <p className="text-xs text-slate-500">
                  Elige entre bloques prediseñados estilo Figma o añade contenedores con código personalizado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(WIDGET_TYPE_INFO).map(([key, info]) => {
                const IconComponent = info.icon;
                const isSelected = selectedTypeForNew === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTypeForNew(key as any)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {info.label}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateNewContainer}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar al Lienzo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
