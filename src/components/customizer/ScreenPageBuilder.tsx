import React, { useState } from 'react';
import {
  Layers,
  Edit3,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Plus,
  Trash2,
  HelpCircle,
  FileText,
  PlusCircle,
  Receipt,
  Coins,
  FileSpreadsheet,
  Package,
  Users,
  User,
  Settings as SettingsIcon,
  ShieldCheck,
  Building2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { ScreenCustomizationConfig, ScreenSectionItem, ScreenCustomBlock } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';

const SCREENS_LIST: Array<{ id: string; name: string; icon: any; defaultTitle: string; defaultSubtitle: string }> = [
  { id: 'history', name: 'Facturas & Historial SRI', icon: FileText, defaultTitle: 'Historial de Facturas & Notas', defaultSubtitle: 'Comprobantes autorizados en línea por el SRI con acceso directo a RIDE y XML.' },
  { id: 'new-invoice', name: 'Emisión de Factura', icon: PlusCircle, defaultTitle: 'Emisión de Factura Electrónica', defaultSubtitle: 'Formulario oficial de facturación con validación de RUC/Cédula y cálculo de IVA.' },
  { id: 'new-nc', name: 'Notas de Crédito', icon: Receipt, defaultTitle: 'Nota de Crédito Electrónica', defaultSubtitle: 'Anulación o ajuste de montos de comprobantes autorizados previamente.' },
  { id: 'retentions', name: 'Retenciones SRI', icon: Coins, defaultTitle: 'Gestor de Retenciones SRI', defaultSubtitle: 'Emisión y control de comprobantes de retención en la fuente de IVA e Impuesto a la Renta.' },
  { id: 'proformas', name: 'Proformas / Cotizaciones', icon: FileSpreadsheet, defaultTitle: 'Cotizaciones y Proformas Comerciales', defaultSubtitle: 'Presupuestos para clientes con conversión a factura en 1 clic.' },
  { id: 'products', name: 'Catálogo de Productos', icon: Package, defaultTitle: 'Catálogo de Productos y Servicios', defaultSubtitle: 'Inventario, listas de precios, impuestos IVA diferenciados y códigos.' },
  { id: 'clients', name: 'Directorio de Clientes', icon: Users, defaultTitle: 'Directorio de Clientes', defaultSubtitle: 'Base de datos de compradores con validación de identificación ecuatoriana.' },
  { id: 'profile', name: 'Mi Perfil & Firma SRI', icon: User, defaultTitle: 'Mi Perfil de Emisor & Firma Electrónica', defaultSubtitle: 'Gestión de certificado digital .P12, contraseña de firma y datos de emisor.' },
  { id: 'settings', name: 'Configuración Tributaria', icon: SettingsIcon, defaultTitle: 'Configuración de la Empresa & Parámetros SRI', defaultSubtitle: 'Puntos de emisión, establecimientos, secuencias y modo Ambiente (Pruebas / Producción).' },
  { id: 'users', name: 'Control de Usuarios & Roles', icon: ShieldCheck, defaultTitle: 'Administración de Usuarios y Permisos', defaultSubtitle: 'Gestión de accesos, roles (Operador, Admin, Superadmin) y estados.' },
  { id: 'tenants', name: 'Multi-Empresas (Tenants)', icon: Building2, defaultTitle: 'Gestor Multi-Empresa & Sucursales', defaultSubtitle: 'Administración centralizada de todas las razones sociales autorizadas.' },
];

export function ScreenPageBuilder() {
  const { settings, updateSettings } = usePlatformSettings();
  const [selectedScreenId, setSelectedScreenId] = useState<string>('history');
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [newBlockData, setNewBlockData] = useState<{ title: string; type: ScreenCustomBlock['type']; content: string; columnSpan: 'full' | 'half'; accentColor: string }>({
    title: '',
    type: 'notice',
    content: '',
    columnSpan: 'full',
    accentColor: '#2563eb'
  });

  const screenConfigs = settings.screenCustomizations || {};
  const currentScreenConfig: ScreenCustomizationConfig = screenConfigs[selectedScreenId] || {
    screenId: selectedScreenId,
    title: SCREENS_LIST.find(s => s.id === selectedScreenId)?.defaultTitle || '',
    subtitle: SCREENS_LIST.find(s => s.id === selectedScreenId)?.defaultSubtitle || '',
    badge: 'SRI ECUADOR',
    sections: [],
    customBlocks: []
  };

  const handleUpdateScreenConfig = (partial: Partial<ScreenCustomizationConfig>) => {
    const updatedScreens = {
      ...screenConfigs,
      [selectedScreenId]: {
        ...currentScreenConfig,
        ...partial
      }
    };
    updateSettings({ screenCustomizations: updatedScreens });
  };

  // Section toggle and move
  const sections = currentScreenConfig.sections || [];
  const handleToggleSection = (sectionId: string) => {
    const nextSections = sections.map(sec => sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec);
    handleUpdateScreenConfig({ sections: nextSections });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    const reordered = next.map((item, idx) => ({ ...item, order: idx + 1 }));
    handleUpdateScreenConfig({ sections: reordered });
  };

  // Custom Blocks management
  const customBlocks = currentScreenConfig.customBlocks || [];
  const handleAddCustomBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockData.title.trim()) {
      modalAlert.warning('Campo Requerido', 'Ingresa el título del bloque.');
      return;
    }
    const block: ScreenCustomBlock = {
      id: `block-${Date.now()}`,
      title: newBlockData.title,
      type: newBlockData.type,
      content: newBlockData.content,
      columnSpan: newBlockData.columnSpan,
      accentColor: newBlockData.accentColor,
      order: customBlocks.length + 1,
      visible: true
    };
    handleUpdateScreenConfig({ customBlocks: [...customBlocks, block] });
    setShowAddBlockModal(false);
    setNewBlockData({
      title: '',
      type: 'notice',
      content: '',
      columnSpan: 'full',
      accentColor: '#2563eb'
    });
    modalAlert.success('Componente Creado', 'El nuevo bloque ha sido agregado a esta pantalla.');
  };

  const handleDeleteBlock = (blockId: string) => {
    handleUpdateScreenConfig({ customBlocks: customBlocks.filter(b => b.id !== blockId) });
  };

  const handleToggleBlock = (blockId: string) => {
    handleUpdateScreenConfig({
      customBlocks: customBlocks.map(b => b.id === blockId ? { ...b, visible: !b.visible } : b)
    });
  };

  const selectedScreenMeta = SCREENS_LIST.find(s => s.id === selectedScreenId) || SCREENS_LIST[0];
  const IconComponent = selectedScreenMeta.icon;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Editor Total de Pantallas & Componentes</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Personaliza Cada Pantalla del Menú
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Modifica títulos, subtítulos, banners informativos, reorganiza secciones internas o añade nuevos bloques y widgets personalizados a cualquier pantalla.
          </p>
        </div>
      </div>

      {/* Grid: Screen Selector + Screen Detail Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Screen Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 px-2">
            Seleccionar Pantalla a Modificar
          </h4>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {SCREENS_LIST.map((sc) => {
              const ScIcon = sc.icon;
              const isSelected = sc.id === selectedScreenId;
              const hasCustom = !!screenConfigs[sc.id];
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setSelectedScreenId(sc.id)}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/25 scale-[1.01]'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}>
                      <ScIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {sc.name}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        id: {sc.id}
                      </div>
                    </div>
                  </div>
                  {hasCustom && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                      Editado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card of the Selected Screen */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Configurando: {selectedScreenMeta.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Personaliza los textos de cabecera, avisos y secciones activas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleUpdateScreenConfig({
                    title: selectedScreenMeta.defaultTitle,
                    subtitle: selectedScreenMeta.defaultSubtitle,
                    badge: 'SRI ECUADOR',
                    bannerAlert: undefined,
                  });
                  modalAlert.info('Cabecera Restaurada', 'Se restablecieron los textos predeterminados de esta pantalla.');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                Restablecer Textos
              </button>
            </div>

            {/* Title & Subtitle Form */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Título Principal de la Pantalla
                  </label>
                  <input
                    type="text"
                    value={currentScreenConfig.title ?? selectedScreenMeta.defaultTitle}
                    onChange={(e) => handleUpdateScreenConfig({ title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge / Placa Superior
                  </label>
                  <input
                    type="text"
                    placeholder="SRI ECUADOR, OFICIAL"
                    value={currentScreenConfig.badge || ''}
                    onChange={(e) => handleUpdateScreenConfig({ badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Subtítulo / Descripción
                </label>
                <textarea
                  rows={2}
                  value={currentScreenConfig.subtitle ?? selectedScreenMeta.defaultSubtitle}
                  onChange={(e) => handleUpdateScreenConfig({ subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              {/* Banner Alert Config */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      Banner de Aviso Superior para esta Pantalla
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentScreenConfig.bannerAlert?.enabled ?? false}
                      onChange={(e) =>
                        handleUpdateScreenConfig({
                          bannerAlert: {
                            enabled: e.target.checked,
                            type: currentScreenConfig.bannerAlert?.type || 'info',
                            message: currentScreenConfig.bannerAlert?.message || 'Aviso informativo para los usuarios en esta sección.',
                            linkText: currentScreenConfig.bannerAlert?.linkText || '',
                            linkUrl: currentScreenConfig.bannerAlert?.linkUrl || ''
                          }
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {currentScreenConfig.bannerAlert?.enabled && (
                  <div className="space-y-2.5 pt-2 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Mensaje de aviso..."
                          value={currentScreenConfig.bannerAlert.message}
                          onChange={(e) =>
                            handleUpdateScreenConfig({
                              bannerAlert: {
                                ...currentScreenConfig.bannerAlert!,
                                message: e.target.value
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <select
                          value={currentScreenConfig.bannerAlert.type}
                          onChange={(e) =>
                            handleUpdateScreenConfig({
                              bannerAlert: {
                                ...currentScreenConfig.bannerAlert!,
                                type: e.target.value as any
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                        >
                          <option value="info">Azul (Info)</option>
                          <option value="success">Verde (Éxito)</option>
                          <option value="warning">Ámbar (Aviso)</option>
                          <option value="purple">Púrpura (VIP)</option>
                          <option value="rose">Rojo (Alerta)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Screen Sub-Sections Control */}
          {sections.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Módulos y Secciones Internas
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Mueve el orden o activa/desactiva submódulos dentro de esta pantalla
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                      sec.visible
                        ? 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700'
                        : 'bg-slate-100/50 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-zinc-700 font-black flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {sec.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                        title="Mover arriba"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                        title="Mover abajo"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSection(sec.id)}
                        className={`p-1 rounded-lg cursor-pointer ${sec.visible ? 'text-emerald-600' : 'text-slate-400'}`}
                        title={sec.visible ? 'Visible' : 'Oculto'}
                      >
                        {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Screen Blocks / Widgets */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Bloques y Contenedores Personalizados en esta Pantalla
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Agrega cajas de ayuda, avisos de soporte o bloques HTML
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddBlockModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Bloque</span>
              </button>
            </div>

            {customBlocks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-400 text-xs">
                No hay bloques personalizados creados para esta pantalla aún. Haz clic en "Añadir Bloque" para crear uno.
              </div>
            ) : (
              <div className="space-y-2">
                {customBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{block.title}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {block.type}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-zinc-400 text-[11px] line-clamp-1 mt-0.5">
                        {block.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleBlock(block.id)}
                        className={`p-1.5 rounded-lg cursor-pointer ${block.visible ? 'text-emerald-600' : 'text-slate-400'}`}
                      >
                        {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL TO ADD CUSTOM BLOCK */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Añadir Bloque a {selectedScreenMeta.name}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddBlockModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomBlock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Título del Bloque *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Guía de Emisión Rápida, Números de Asistencia SRI"
                  value={newBlockData.title}
                  onChange={(e) => setNewBlockData({ ...newBlockData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Tipo de Componente
                  </label>
                  <select
                    value={newBlockData.type}
                    onChange={(e) => setNewBlockData({ ...newBlockData, type: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  >
                    <option value="notice">Aviso / Caja Informativa</option>
                    <option value="html">Código HTML / Widget</option>
                    <option value="faq">Preguntas Frecuentes</option>
                    <option value="actions">Botones de Acción Rápida</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Ancho en Pantalla
                  </label>
                  <select
                    value={newBlockData.columnSpan}
                    onChange={(e) => setNewBlockData({ ...newBlockData, columnSpan: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  >
                    <option value="full">Ancho Completo (100%)</option>
                    <option value="half">Mitad (50%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Contenido del Bloque (Texto o HTML)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe el texto, instrucciones o código HTML que se mostrará dentro de este contenedor..."
                  value={newBlockData.content}
                  onChange={(e) => setNewBlockData({ ...newBlockData, content: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500 font-mono text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Insertar Bloque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
