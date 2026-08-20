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
  Columns,
  Folder,
  FolderPlus,
  FolderEdit,
  Tag,
  ChevronDown,
  Info
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { CustomMenuItem, MenuGroup } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';
import { renderMenuIcon } from '../navigation/DynamicPlatformNavigation';

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
  'Layers',
  'Folder'
];

export default function VisualLayoutBuilder() {
  const { settings, updateSettings, themeClasses } = usePlatformSettings();
  
  // State for menu items
  const [newItemFormData, setNewItemFormData] = useState<Partial<CustomMenuItem>>({
    label: '',
    key: '',
    iconName: 'Globe',
    visible: true,
    requiredRole: 'ALL',
    customUrl: '',
    openInNewTab: true,
    badge: '',
    groupId: ''
  });
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomMenuItem | null>(null);

  // State for menu groups
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
  const [newGroupFormData, setNewGroupFormData] = useState<Partial<MenuGroup>>({
    name: '',
    iconName: 'Folder',
    order: 1,
    visible: true,
    color: 'blue'
  });

  // Filter state for menu organizer
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');

  const menuItems = settings.customMenuItems || [];
  const menuGroups: MenuGroup[] = settings.menuGroups && settings.menuGroups.length > 0
    ? settings.menuGroups
    : [
        { id: 'group-facturacion', name: 'Facturación SRI', iconName: 'FileText', order: 1, visible: true },
        { id: 'group-catalogos', name: 'Catálogos', iconName: 'Package', order: 2, visible: true },
        { id: 'group-admin', name: 'Administración', iconName: 'ShieldCheck', order: 3, visible: true },
      ];

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

  // Quick group assignment
  const handleAssignGroup = (itemId: string, groupId: string) => {
    const updated = menuItems.map(item =>
      item.id === itemId ? { ...item, groupId: groupId === 'NONE' ? undefined : groupId } : item
    );
    updateSettings({ customMenuItems: updated });
    modalAlert.success('Grupo Asignado', 'La opción de menú fue reasignada al grupo correspondiente.');
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

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = menuItems.map(it => it.id === editingItem.id ? {
      ...editingItem,
      groupId: editingItem.groupId === 'NONE' ? undefined : editingItem.groupId
    } : it);
    updateSettings({ customMenuItems: updated });
    setEditingItem(null);
    modalAlert.success('Menú Actualizado', 'Los cambios en la opción del menú se aplicaron correctamente.');
  };

  // GROUP OPERATIONS
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupFormData.name?.trim()) {
      modalAlert.warning('Campo Requerido', 'Ingresa un nombre para el nuevo grupo.');
      return;
    }

    const newGroup: MenuGroup = {
      id: `group-${Date.now()}`,
      name: newGroupFormData.name.trim(),
      iconName: newGroupFormData.iconName || 'Folder',
      order: menuGroups.length + 1,
      visible: true,
      color: newGroupFormData.color || 'blue'
    };

    updateSettings({ menuGroups: [...menuGroups, newGroup] });
    setShowNewGroupModal(false);
    setNewGroupFormData({
      name: '',
      iconName: 'Folder',
      order: 1,
      visible: true,
      color: 'blue'
    });
    modalAlert.success('Grupo Creado', `Se creó el grupo "${newGroup.name}". Ahora puedes agrupar opciones dentro de él.`);
  };

  const handleSaveEditedGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    const updated = menuGroups.map(g => g.id === editingGroup.id ? editingGroup : g);
    updateSettings({ menuGroups: updated });
    setEditingGroup(null);
    modalAlert.success('Grupo Actualizado', 'Los datos del grupo se guardaron.');
  };

  const handleDeleteGroup = (groupId: string) => {
    const grp = menuGroups.find(g => g.id === groupId);
    if (!grp) return;

    // Unassign items in this group
    const updatedItems = menuItems.map(it => it.groupId === groupId ? { ...it, groupId: undefined } : it);
    const updatedGroups = menuGroups.filter(g => g.id !== groupId);

    updateSettings({
      menuGroups: updatedGroups,
      customMenuItems: updatedItems
    });
    modalAlert.info('Grupo Eliminado', `El grupo "${grp.name}" fue eliminado. Las opciones ahora están en la barra principal.`);
  };

  const handleResetMenuItems = () => {
    const confirmed = window.confirm('¿Restablecer el menú, grupos y el orden a los valores predeterminados?');
    if (!confirmed) return;
    updateSettings({
      menuGroups: [
        { id: 'group-facturacion', name: 'Facturación SRI', iconName: 'FileText', order: 1, visible: true },
        { id: 'group-catalogos', name: 'Catálogos', iconName: 'Package', order: 2, visible: true },
        { id: 'group-admin', name: 'Administración', iconName: 'ShieldCheck', order: 3, visible: true },
      ],
      customMenuItems: [
        { id: 'menu-history', key: 'history', label: 'Facturas & Notas', iconName: 'FileText', visible: true, order: 1, requiredRole: 'ALL', groupId: 'group-facturacion' },
        { id: 'menu-invoice', key: 'new-invoice', label: 'Nueva Factura', iconName: 'PlusCircle', visible: true, order: 2, requiredRole: 'ALL', groupId: 'group-facturacion' },
        { id: 'menu-nc', key: 'new-nc', label: 'Nota Crédito', iconName: 'Receipt', visible: true, order: 3, requiredRole: 'ALL', groupId: 'group-facturacion' },
        { id: 'menu-retentions', key: 'retentions', label: 'Retenciones', iconName: 'Coins', visible: true, order: 4, requiredRole: 'ALL', groupId: 'group-facturacion' },
        { id: 'menu-proformas', key: 'proformas', label: 'Proformas', iconName: 'FileSpreadsheet', visible: true, order: 5, requiredRole: 'ALL', groupId: 'group-facturacion' },
        { id: 'menu-products', key: 'products', label: 'Productos', iconName: 'Package', visible: true, order: 6, requiredRole: 'ALL', groupId: 'group-catalogos' },
        { id: 'menu-clients', key: 'clients', label: 'Clientes', iconName: 'Users', visible: true, order: 7, requiredRole: 'ALL', groupId: 'group-catalogos' },
        { id: 'menu-profile', key: 'profile', label: 'Mi Perfil', iconName: 'User', visible: true, order: 8, requiredRole: 'ALL' },
        { id: 'menu-settings', key: 'settings', label: 'Configuración', iconName: 'Settings', visible: true, order: 9, requiredRole: 'ALL' },
        { id: 'menu-users', key: 'users', label: 'Usuarios', iconName: 'ShieldCheck', visible: true, order: 10, requiredRole: 'ADMIN', groupId: 'group-admin' },
        { id: 'menu-tenants', key: 'tenants', label: 'Empresas', iconName: 'Building2', visible: true, order: 11, requiredRole: 'SUPERADMIN', groupId: 'group-admin' },
        { id: 'menu-customizer', key: 'customizer', label: 'Diseño & Plataforma', iconName: 'Palette', visible: true, order: 12, requiredRole: 'SUPERADMIN', groupId: 'group-admin' },
        { id: 'menu-supabase', key: 'supabase', label: 'Supabase', iconName: 'Database', visible: true, order: 13, requiredRole: 'SUPERADMIN', groupId: 'group-admin' },
      ]
    });
    modalAlert.info('Menú Restaurado', 'Se ha restablecido la lista, grupos y orden original de las secciones.');
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
      requiredRole: newItemFormData.requiredRole || 'ALL',
      groupId: newItemFormData.groupId === 'NONE' || !newItemFormData.groupId ? undefined : newItemFormData.groupId
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
      badge: '',
      groupId: ''
    });
    modalAlert.success('Elemento Añadido', 'El nuevo elemento fue agregado al menú.');
  };

  // Filtered menu items for display in table
  const displayedItems = menuItems.filter(item => {
    if (selectedGroupFilter === 'ALL') return true;
    if (selectedGroupFilter === 'NONE') return !item.groupId;
    return item.groupId === selectedGroupFilter;
  });

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
              Arquitectura Visual del Sistema
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Escoge cómo se distribuye la barra de herramientas, menús desplegables e islas interactivas.
            </p>
          </div>

          <div className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold">
            Actual: <span className="text-blue-600 dark:text-blue-400 font-mono">{settings.menuLayout || 'topbar-classic'}</span>
          </div>
        </div>

        {/* LAYOUT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* TOPBAR CLÁSICO (STICKY) */}
          <div
            onClick={() => handleLayoutChange('topbar-classic')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              settings.menuLayout === 'topbar-classic'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md shadow-blue-500/10'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div>
              <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 p-2 mb-3 flex flex-col gap-1.5 border border-slate-200/50 dark:border-zinc-700/50">
                <div className="h-4 w-full bg-blue-500 rounded-md shrink-0 flex items-center justify-between px-2">
                  <div className="h-1.5 w-6 bg-white/80 rounded-full" />
                  <div className="flex gap-1">
                    <div className="h-1.5 w-3 bg-white/80 rounded-full" />
                    <div className="h-1.5 w-3 bg-white/80 rounded-full" />
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-zinc-700 rounded-sm" />
                <div className="h-4 w-full bg-slate-200/60 dark:bg-zinc-700/60 rounded-md" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>TopBar Clásico</span>
                {settings.menuLayout === 'topbar-classic' && <Check className="w-4 h-4 text-blue-600" />}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Fijo (Sticky) en la parte superior. Al scrollear permanece visible con submenús por grupos.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {settings.menuLayout === 'topbar-classic' ? 'Activo' : 'Seleccionar'}
            </div>
          </div>

          {/* ISLA FLOTANTE */}
          <div
            onClick={() => handleLayoutChange('floating-island')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              settings.menuLayout === 'floating-island'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md shadow-blue-500/10'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div>
              <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 p-2 mb-3 flex flex-col justify-between items-center border border-slate-200/50 dark:border-zinc-700/50">
                <div className="h-2 w-full bg-slate-200 dark:bg-zinc-700 rounded-sm" />
                <div className="h-5 w-4/5 bg-blue-500 rounded-full shadow-sm flex items-center justify-center gap-1 px-2">
                  <div className="h-1.5 w-3 bg-white rounded-full" />
                  <div className="h-1.5 w-3 bg-white rounded-full" />
                  <div className="h-1.5 w-3 bg-white rounded-full" />
                </div>
                <div className="h-3 w-full bg-slate-200/50 dark:bg-zinc-700/50 rounded-sm" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Isla Flotante</span>
                {settings.menuLayout === 'floating-island' && <Check className="w-4 h-4 text-blue-600" />}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Barra flotante centrada de estilo Figma/macOS con acceso completo a todas las opciones y grupos.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {settings.menuLayout === 'floating-island' ? 'Activo' : 'Seleccionar'}
            </div>
          </div>

          {/* DOCK FLOTANTE */}
          <div
            onClick={() => handleLayoutChange('compact-dock')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              settings.menuLayout === 'compact-dock'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md shadow-blue-500/10'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div>
              <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 p-2 mb-3 flex flex-col justify-between border border-slate-200/50 dark:border-zinc-700/50">
                <div className="h-7 w-full bg-slate-200/70 dark:bg-zinc-700/70 rounded-md" />
                <div className="h-4 w-3/4 mx-auto bg-slate-900 dark:bg-zinc-950 rounded-full flex items-center justify-center gap-1">
                  <div className="h-1.5 w-2 bg-blue-400 rounded-full" />
                  <div className="h-1.5 w-2 bg-slate-400 rounded-full" />
                  <div className="h-1.5 w-2 bg-slate-400 rounded-full" />
                </div>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Dock Flotante</span>
                {settings.menuLayout === 'compact-dock' && <Check className="w-4 h-4 text-blue-600" />}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Dock inferior estilo macOS con popovers ascendentes hacia arriba.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {settings.menuLayout === 'compact-dock' ? 'Activo' : 'Seleccionar'}
            </div>
          </div>

          {/* SIDEBAR IZQUIERDA */}
          <div
            onClick={() => handleLayoutChange('sidebar-left')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              settings.menuLayout === 'sidebar-left'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md shadow-blue-500/10'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div>
              <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 p-2 mb-3 flex gap-2 border border-slate-200/50 dark:border-zinc-700/50">
                <div className="h-full w-1/3 bg-blue-500 rounded-md flex flex-col gap-1 p-1">
                  <div className="h-1.5 w-full bg-white/80 rounded-full" />
                  <div className="h-1.5 w-3/4 bg-white/60 rounded-full" />
                  <div className="h-1.5 w-4/5 bg-white/60 rounded-full" />
                </div>
                <div className="h-full w-2/3 flex flex-col gap-1.5">
                  <div className="h-3 w-full bg-slate-200 dark:bg-zinc-700 rounded-sm" />
                  <div className="h-6 w-full bg-slate-200/60 dark:bg-zinc-700/60 rounded-md" />
                </div>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Sidebar Izquierda</span>
                {settings.menuLayout === 'sidebar-left' && <Check className="w-4 h-4 text-blue-600" />}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Panel lateral clásico con acordeones para cada grupo de módulos.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {settings.menuLayout === 'sidebar-left' ? 'Activo' : 'Seleccionar'}
            </div>
          </div>

          {/* SIDEBAR DERECHA */}
          <div
            onClick={() => handleLayoutChange('sidebar-right')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              settings.menuLayout === 'sidebar-right'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md shadow-blue-500/10'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div>
              <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 p-2 mb-3 flex gap-2 border border-slate-200/50 dark:border-zinc-700/50">
                <div className="h-full w-2/3 flex flex-col gap-1.5">
                  <div className="h-3 w-full bg-slate-200 dark:bg-zinc-700 rounded-sm" />
                  <div className="h-6 w-full bg-slate-200/60 dark:bg-zinc-700/60 rounded-md" />
                </div>
                <div className="h-full w-1/3 bg-blue-500 rounded-md flex flex-col gap-1 p-1">
                  <div className="h-1.5 w-full bg-white/80 rounded-full" />
                  <div className="h-1.5 w-3/4 bg-white/60 rounded-full" />
                  <div className="h-1.5 w-4/5 bg-white/60 rounded-full" />
                </div>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Sidebar Derecha</span>
                {settings.menuLayout === 'sidebar-right' && <Check className="w-4 h-4 text-blue-600" />}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Panel lateral a la derecha, ideal para monitores panorámicos.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {settings.menuLayout === 'sidebar-right' ? 'Activo' : 'Seleccionar'}
            </div>
          </div>

        </div>

        {/* 2. ANCHO DE CONTENIDO */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Ancho del Contenedor Principal
            </h4>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">
              {settings.contentLayoutWidth || 'contained-lg'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'contained-sm', label: 'Estrecho (max 5xl)', desc: 'Ideal para lectura' },
              { id: 'contained-lg', label: 'Estándar (max 7xl)', desc: 'Recomendado' },
              { id: 'full-width', label: 'Extendido (1650px)', desc: 'Pantallas grandes' },
              { id: 'fluid', label: 'Fluido (100% Ancho)', desc: 'Ocupa toda la ventana' }
            ].map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => handleWidthChange(w.id as any)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  settings.contentLayoutWidth === w.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="text-xs font-bold">{w.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">{w.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: GESTIÓN DE GRUPOS DE MENÚ (MENÚ DROPDOWNS / CARPETAS) */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Folder className="w-3.5 h-3.5" />
              <span>GRUPOS & SUBMENÚS</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Grupos y Menús Desplegables
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Crea grupos en el TopBar o barra de navegación. Al hacer clic en el grupo, se desplegarán las opciones asociadas a él.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewGroupModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer transition active:scale-95 shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Crear Nuevo Grupo</span>
          </button>
        </div>

        {/* LISTA DE GRUPOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {menuGroups.map(grp => {
            const count = menuItems.filter(it => it.groupId === grp.id).length;
            return (
              <div
                key={grp.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    {renderMenuIcon(grp.iconName || 'folder', undefined, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {grp.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {count} {count === 1 ? 'opción asignada' : 'opciones asignadas'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingGroup({ ...grp })}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                    title="Editar grupo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(grp.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition cursor-pointer"
                    title="Eliminar grupo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ORGANIZADOR Y DISTRIBUCIÓN DE ÍTEMS DEL MENÚ */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sliders className="w-3.5 h-3.5" />
              <span>OPCIONES DEL MENÚ</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Organizador y Distribución de Ítems del Menú
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Reordena las secciones, asigna cada opción a su grupo (Facturación, Catálogos, etc.) o déjala como botón individual. Los cambios se reflejan inmediatamente en la barra de menú.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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

        {/* FILTRADO POR GRUPO PARA FACILITAR ORGANIZACIÓN */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-500 dark:text-zinc-400 shrink-0">Filtrar vista:</span>
          <button
            type="button"
            onClick={() => setSelectedGroupFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${
              selectedGroupFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
            }`}
          >
            Todos ({menuItems.length})
          </button>
          {menuGroups.map(grp => (
            <button
              key={grp.id}
              type="button"
              onClick={() => setSelectedGroupFilter(grp.id)}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${
                selectedGroupFilter === grp.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
              }`}
            >
              {grp.name} ({menuItems.filter(it => it.groupId === grp.id).length})
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedGroupFilter('NONE')}
            className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${
              selectedGroupFilter === 'NONE'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
            }`}
          >
            Sin Grupo ({menuItems.filter(it => !it.groupId).length})
          </button>
        </div>

        {/* ITEMS LIST WITH REORDER, GROUP SELECT & TOGGLE */}
        <div className="space-y-2.5">
          {displayedItems.map((item, index) => {
            const currentGroup = menuGroups.find(g => g.id === item.groupId);
            return (
              <div
                key={item.id || item.key}
                className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 ${
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

                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    {renderMenuIcon(item.iconName, item.key, 'w-4 h-4')}
                  </div>

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
                    </div>
                    {item.customUrl && (
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-sm">
                        🔗 {item.customUrl}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle & Right: Group Assignment Selector & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-zinc-800">
                  {/* Quick Group Assignment */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 hidden md:inline">Grupo:</span>
                    <select
                      value={item.groupId || 'NONE'}
                      onChange={(e) => handleAssignGroup(item.id, e.target.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border font-bold cursor-pointer transition ${
                        item.groupId
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                          : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      <option value="NONE">Sin Grupo (Botón suelto)</option>
                      {menuGroups.map(g => (
                        <option key={g.id} value={g.id}>📁 {g.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Actions (Edit, Move Up, Move Down, Toggle Visibility, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...item })}
                      className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                      title="Editar nombre, grupo e icono"
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
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL PARA CREAR NUEVO GRUPO */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Crear Nuevo Grupo de Menú
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Aparecerá en el TopBar y al darle clic saldrán sus opciones asociadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewGroupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Facturación SRI, Catálogos, Tesorería, Reportería"
                  value={newGroupFormData.name}
                  onChange={(e) => setNewGroupFormData({ ...newGroupFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Icono del Grupo
                </label>
                <select
                  value={newGroupFormData.iconName || 'Folder'}
                  onChange={(e) => setNewGroupFormData({ ...newGroupFormData, iconName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-purple-500"
                >
                  {AVAILABLE_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR GRUPO */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Editar Grupo
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  ID: <span className="font-mono text-purple-600">{editingGroup.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  required
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Icono del Grupo
                </label>
                <select
                  value={editingGroup.iconName || 'Folder'}
                  onChange={(e) => setEditingGroup({ ...editingGroup, iconName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-purple-500"
                >
                  {AVAILABLE_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Pertenece al Grupo
                </label>
                <select
                  value={editingItem.groupId || 'NONE'}
                  onChange={(e) => setEditingItem({ ...editingItem, groupId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500 font-bold"
                >
                  <option value="NONE">Sin Grupo (Botón Directo en Barra)</option>
                  {menuGroups.map(g => (
                    <option key={g.id} value={g.id}>📁 {g.name}</option>
                  ))}
                </select>
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

      {/* MODAL PARA CREAR NUEVA OPCIÓN PERSONALIZADA */}
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
                  Asignar a Grupo
                </label>
                <select
                  value={newItemFormData.groupId || 'NONE'}
                  onChange={(e) => setNewItemFormData({ ...newItemFormData, groupId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:outline-blue-500 font-bold"
                >
                  <option value="NONE">Sin Grupo (Botón directo)</option>
                  {menuGroups.map(g => (
                    <option key={g.id} value={g.id}>📁 {g.name}</option>
                  ))}
                </select>
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
