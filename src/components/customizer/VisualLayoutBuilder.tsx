import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Sidebar,
  Sliders,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  Globe,
  Sparkles,
  Layers,
  Maximize2,
  Square,
  Columns
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { CustomMenuItem } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';

const AVAILABLE_ICONS = [
  'FileText',
  'PlusCircle',
  'Receipt',
  'Coins',
  'FileSpreadsheet',
  'Package',
  'Users',
  'User',
  'Settings',
  'ShieldCheck',
  'Building2',
  'Palette',
  'Database',
  'BarChart3',
  'HelpCircle',
  'ShoppingBag',
  'Zap',
  'Globe',
  'Layers'
];

export default function VisualLayoutBuilder() {
  const { settings, updateSettings, themeClasses } = usePlatformSettings();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemFormData, setNewItemFormData] = useState<Partial<CustomMenuItem>>({
    label: '',
    key: '',
    iconName: 'Globe',
    visible: true,
    requiredRole: 'ALL',
    customUrl: '',
    openInNewTab: true,
    badge: ''
  });
  const [showNewItemModal, setShowNewItemModal] = useState(false);

  const menuItems = settings.customMenuItems || [];

  // Update layout mode
  const handleLayoutChange = (mode: 'topbar-classic' | 'sidebar-left' | 'sidebar-right' | 'compact-dock' | 'floating-island') => {
    updateSettings({ menuLayout: mode });
    modalAlert.success('Distribución Actualizada', `Se ha aplicado el diseño "${mode}" a la plataforma.`);
  };

  // Update content width
  const handleWidthChange = (width: 'contained-sm' | 'contained-lg' | 'full-width' | 'fluid') => {
    updateSettings({ contentLayoutWidth: width });
  };

  // Toggle item visibility
  const handleToggleVisibility = (id: string) => {
    const updated = menuItems.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    updateSettings({ customMenuItems: updated });
  };

  // Move item up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newItems = [...menuItems];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    // update orders
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    updateSettings({ customMenuItems: newItems });
  };

  // Move item down
  const handleMoveDown = (index: number) => {
    if (index >= menuItems.length - 1) return;
    const newItems = [...menuItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    // update orders
    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });
    updateSettings({ customMenuItems: newItems });
  };

  // Delete custom item
  const handleDeleteItem = (id: string) => {
    const updated = menuItems.filter(item => item.id !== id);
    updateSettings({ customMenuItems: updated });
    modalAlert.info('Elemento Eliminado', 'Se ha removido el elemento del menú.');
  };

  // Edit custom or default item
  const [editingItem, setEditingItem] = useState<CustomMenuItem | null>(null);

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = menuItems.map(it => it.id === editingItem.id ? editingItem : it);
    updateSettings({ customMenuItems: updated });
    setEditingItem(null);
    modalAlert.success('Menú Actualizado', 'Los cambios en la opción del menú se aplicaron correctamente.');
  };

  const handleResetMenuItems = () => {
    const confirmed = window.confirm('¿Restablecer el menú y el orden a los valores predeterminados?');
    if (!confirmed) return;
    updateSettings({
      customMenuItems: [
        { id: 'menu-history', key: 'history', label: 'Facturas & Notas', iconName: 'FileText', visible: true, order: 1, requiredRole: 'ALL' },
        { id: 'menu-invoice', key: 'new-invoice', label: 'Nueva Factura', iconName: 'PlusCircle', visible: true, order: 2, requiredRole: 'ALL' },
        { id: 'menu-nc', key: 'new-nc', label: 'Nota Crédito', iconName: 'Receipt', visible: true, order: 3, requiredRole: 'ALL' },
        { id: 'menu-retentions', key: 'retentions', label: 'Retenciones', iconName: 'Coins', visible: true, order: 4, requiredRole: 'ALL' },
        { id: 'menu-proformas', key: 'proformas', label: 'Proformas', iconName: 'FileSpreadsheet', visible: true, order: 5, requiredRole: 'ALL' },
        { id: 'menu-products', key: 'products', label: 'Productos', iconName: 'Package', visible: true, order: 6, requiredRole: 'ALL' },
        { id: 'menu-clients', key: 'clients', label: 'Clientes', iconName: 'Users', visible: true, order: 7, requiredRole: 'ALL' },
        { id: 'menu-profile', key: 'profile', label: 'Mi Perfil', iconName: 'User', visible: true, order: 8, requiredRole: 'ALL' },
        { id: 'menu-settings', key: 'settings', label: 'Configuración', iconName: 'Settings', visible: true, order: 9, requiredRole: 'ALL' },
        { id: 'menu-users', key: 'users', label: 'Usuarios', iconName: 'ShieldCheck', visible: true, order: 10, requiredRole: 'ADMIN' },
        { id: 'menu-tenants', key: 'tenants', label: 'Empresas', iconName: 'Building2', visible: true, order: 11, requiredRole: 'SUPERADMIN' },
        { id: 'menu-customizer', key: 'customizer', label: 'Diseño & Plataforma', iconName: 'Palette', visible: true, order: 12, requiredRole: 'SUPERADMIN' },
        { id: 'menu-supabase', key: 'supabase', label: 'Supabase', iconName: 'Database', visible: true, order: 13, requiredRole: 'SUPERADMIN' },
      ]
    });
    modalAlert.info('Menú Restaurado', 'Se ha restablecido la lista y orden original de las secciones.');
  };

  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemFormData.label?.trim()) {
      modalAlert.warning('Campo Requerido', 'Ingresa una etiqueta para el nuevo elemento del menú.');
      return;
    }

    const newItem: CustomMenuItem = {
      id: `custom-menu-${Date.now()}`,
      key: newItemFormData.key || `custom-link-${Date.now()}`,
      label: newItemFormData.label.trim(),
      iconName: newItemFormData.iconName || 'Globe',
      visible: true,
      order: menuItems.length + 1,
      isCustom: true,
      customUrl: newItemFormData.customUrl?.trim() || '',
      openInNewTab: newItemFormData.openInNewTab !== false,
      badge: newItemFormData.badge?.trim() || '',
      requiredRole: newItemFormData.requiredRole || 'ALL'
    };

    updateSettings({ customMenuItems: [...menuItems, newItem] });
    setShowNewItemModal(false);
    setNewItemFormData({
      label: '',
      key: '',
      iconName: 'Globe',
      visible: true,
      requiredRole: 'ALL',
      customUrl: '',
      openInNewTab: true,
      badge: ''
    });
    modalAlert.success('Elemento Añadido', 'El nuevo elemento fue agregado al menú.');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. SELECCIÓN DE ARQUITECTURA DE MENÚ */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Layout className="w-3.5 h-3.5" />
              <span>ESTRUCTURA & NAVEGACIÓN</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Arquitectura Visual y Posición de Secciones
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Selecciona la distribución estructural general de la plataforma tal cual como en Hostinger y Figma.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            Actual: <strong className="text-blue-600 capitalize">{settings.menuLayout || 'topbar-classic'}</strong>
          </span>
        </div>

        {/* LAYOUT CARDS SELECTOR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Option 1: TopBar Clásico */}
          <button
            type="button"
            onClick={() => handleLayoutChange('topbar-classic')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              settings.menuLayout === 'topbar-classic'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="space-y-2">
              <div className="w-full h-16 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1.5 flex flex-col gap-1">
                <div className="w-full h-3 bg-blue-500 rounded-sm" />
                <div className="w-full flex-1 bg-white dark:bg-zinc-700 rounded-sm" />
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>TopBar Clásico</span>
                {settings.menuLayout === 'topbar-classic' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Barra de navegación horizontal superior tradicional.
            </p>
          </button>

          {/* Option 2: Barra Lateral Izquierda (Hostinger Style) */}
          <button
            type="button"
            onClick={() => handleLayoutChange('sidebar-left')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              settings.menuLayout === 'sidebar-left'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="space-y-2">
              <div className="w-full h-16 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1.5 flex gap-1">
                <div className="w-1/3 h-full bg-blue-500 rounded-sm" />
                <div className="flex-1 h-full bg-white dark:bg-zinc-700 rounded-sm" />
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>Sidebar Izquierdo</span>
                {settings.menuLayout === 'sidebar-left' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Menú vertical estilo Hostinger / Dashboard moderno.
            </p>
          </button>

          {/* Option 3: Barra Lateral Derecha */}
          <button
            type="button"
            onClick={() => handleLayoutChange('sidebar-right')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              settings.menuLayout === 'sidebar-right'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="space-y-2">
              <div className="w-full h-16 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1.5 flex gap-1">
                <div className="flex-1 h-full bg-white dark:bg-zinc-700 rounded-sm" />
                <div className="w-1/3 h-full bg-blue-500 rounded-sm" />
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>Sidebar Derecho</span>
                {settings.menuLayout === 'sidebar-right' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Navegación en columna derecha para máxima visibilidad.
            </p>
          </button>

          {/* Option 4: Isla Flotante Superior (Figma Style) */}
          <button
            type="button"
            onClick={() => handleLayoutChange('floating-island')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              settings.menuLayout === 'floating-island'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="space-y-2">
              <div className="w-full h-16 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1.5 flex flex-col items-center justify-between">
                <div className="w-3/4 h-3 bg-blue-500 rounded-full shadow-xs" />
                <div className="w-full flex-1 bg-white dark:bg-zinc-700 rounded-sm mt-1" />
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>Isla Flotante</span>
                {settings.menuLayout === 'floating-island' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Píldora flotante centrada con efecto glassmorphism.
            </p>
          </button>

          {/* Option 5: Dock Flotante Inferior */}
          <button
            type="button"
            onClick={() => handleLayoutChange('compact-dock')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
              settings.menuLayout === 'compact-dock'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-md'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="space-y-2">
              <div className="w-full h-16 bg-slate-100 dark:bg-zinc-800 rounded-xl p-1.5 flex flex-col items-center justify-between">
                <div className="w-full flex-1 bg-white dark:bg-zinc-700 rounded-sm mb-1" />
                <div className="w-3/4 h-3 bg-blue-500 rounded-full shadow-xs" />
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                <span>Dock Flotante</span>
                {settings.menuLayout === 'compact-dock' && <Check className="w-4 h-4 text-blue-600" />}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">
              Barra dock inferior estilo macOS/iPadOS.
            </p>
          </button>

        </div>

        {/* 2. ANCHO DE CONTENIDO */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-xs text-slate-800 dark:text-zinc-200">
              Ancho del Contenedor de la Aplicación
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
              Controla la expansión horizontal de las tablas y formularios en pantallas grandes.
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleWidthChange('contained-lg')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                (settings.contentLayoutWidth || 'contained-lg') === 'contained-lg'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Estándar (max-w-7xl)
            </button>
            <button
              type="button"
              onClick={() => handleWidthChange('full-width')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settings.contentLayoutWidth === 'full-width'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ancho Completo (Full Width)
            </button>
            <button
              type="button"
              onClick={() => handleWidthChange('fluid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                settings.contentLayoutWidth === 'fluid'
                  ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Fluido (100% Pantalla)
            </button>
          </div>
        </div>

      </div>

      {/* 3. GESTOR DE OPCIONES DEL MENÚ (REORDENAR, OCULTAR Y CREAR) */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Menu className="w-3.5 h-3.5" />
              <span>OPCIONES DEL MENÚ</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Organizador y Distribución de Ítems del Menú
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Reordena las secciones, cambia nombres, oculta módulos innecesarios o crea nuevos accesos directos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetMenuItems}
              className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold transition cursor-pointer"
              title="Restablecer menú por defecto"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => setShowNewItemModal(true)}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Opción Personalizada</span>
            </button>
          </div>
        </div>

        {/* ITEMS LIST WITH REORDER & TOGGLE */}
        <div className="space-y-2.5">
          {menuItems.map((item, index) => (
            <div
              key={item.id || item.key}
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-200 ${
                item.visible !== false
                  ? 'bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800'
                  : 'bg-slate-100/40 dark:bg-zinc-900/30 border-dashed border-slate-300 dark:border-zinc-700 opacity-60'
              }`}
            >
              {/* Left: Position handle & Label */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-black flex items-center justify-center shrink-0">
                  {index + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      key: {item.key}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                    {item.isCustom && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase">
                        Personalizado
                      </span>
                    )}
                    {item.requiredRole && item.requiredRole !== 'ALL' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Rol: {item.requiredRole}
                      </span>
                    )}
                  </div>
                  {item.customUrl && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-sm">
                      🔗 {item.customUrl}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions (Edit, Move Up, Move Down, Toggle Visibility, Delete) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingItem({ ...item })}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                  title="Editar nombre e icono"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Mover arriba"
                >
                  <MoveUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === menuItems.length - 1}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Mover abajo"
                >
                  <MoveDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVisibility(item.id)}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    item.visible !== false
                      ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                  title={item.visible !== false ? 'Visible (clic para ocultar)' : 'Oculto (clic para mostrar)'}
                >
                  {item.visible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {item.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Eliminar elemento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL PARA EDITAR OPCIÓN DE MENÚ EXISTENTE */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Editar Opción de Menú
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Clave del sistema: <span className="font-mono font-bold text-blue-600">{editingItem.key}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Nombre / Etiqueta del Botón *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.label}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge / Placa (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: NUEVO, PRO, SRI"
                    value={editingItem.badge || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Visibilidad por Rol
                  </label>
                  <select
                    value={editingItem.requiredRole || 'ALL'}
                    onChange={(e) => setEditingItem({ ...editingItem, requiredRole: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  >
                    <option value="ALL">Todos los Usuarios</option>
                    <option value="ADMIN">Solo Administradores</option>
                    <option value="SUPERADMIN">Solo Superadmin</option>
                  </select>
                </div>
              </div>

              {editingItem.isCustom && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Enlace Externo o URL
                  </label>
                  <input
                    type="url"
                    value={editingItem.customUrl || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, customUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Crear Nueva Opción de Menú
              </h4>
              <button
                type="button"
                onClick={() => setShowNewItemModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Etiqueta / Nombre Visible *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Catálogo SRI, Soporte VIP, Manuales"
                  value={newItemFormData.label}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, label: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Enlace Externo o URL (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://mi-empresa.com/ayuda o https://sri.gob.ec"
                  value={newItemFormData.customUrl}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, customUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge / Placa (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="NUEVO, VIP"
                    value={newItemFormData.badge}
                    onChange={(e) => setNewItemFormData({ ...newItemFormData, badge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Visibilidad por Rol
                  </label>
                  <select
                    value={newItemFormData.requiredRole}
                    onChange={(e) => setNewItemFormData({ ...newItemFormData, requiredRole: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500"
                  >
                    <option value="ALL">Todos los Usuarios</option>
                    <option value="ADMIN">Solo Administradores</option>
                    <option value="SUPERADMIN">Solo Superadmin</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Crear Opción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
