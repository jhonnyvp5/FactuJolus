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
  FolderOpen,
  Tag,
  ChevronDown,
  ChevronRight,
  Info,
  GripVertical,
  ShieldCheck,
  Building2,
  Lock,
  GitBranch,
  CornerDownRight,
  ArrowUpDown,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { CustomMenuItem, MenuGroup, PortalUser, UserRole, EmpresaTenant } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';
import { renderMenuIcon } from '../navigation/DynamicPlatformNavigation';

export interface SpanishMenuIcon {
  value: string;
  labelEs: string;
  desc: string;
  emoji: string;
}

export const SPANISH_MENU_ICONS: SpanishMenuIcon[] = [
  { value: 'FileText', labelEs: 'Facturas / Comprobantes SRI', desc: 'Historial y facturas emitidas', emoji: '📄' },
  { value: 'Receipt', labelEs: 'Notas de Crédito / Recibos', desc: 'Comprobantes de crédito y anulación', emoji: '🧾' },
  { value: 'Coins', labelEs: 'Retenciones / Impuestos SRI', desc: 'Comprobantes de retención', emoji: '🪙' },
  { value: 'FileSpreadsheet', labelEs: 'Proformas / Cotizaciones', desc: 'Presupuestos y proformas comerciales', emoji: '📊' },
  { value: 'Package', labelEs: 'Productos / Inventario', desc: 'Catálogo de artículos y servicios', emoji: '📦' },
  { value: 'Users', labelEs: 'Clientes / Directorio', desc: 'Gestión de clientes y contactos', emoji: '👥' },
  { value: 'User', labelEs: 'Perfil de Usuario', desc: 'Datos y cuenta de usuario', emoji: '👤' },
  { value: 'ShieldCheck', labelEs: 'Seguridad / SRI / Permisos', desc: 'Acceso y firma electrónica', emoji: '🛡️' },
  { value: 'Building2', labelEs: 'Inquilinos / Empresas', desc: 'Gestión multi-empresa y sucursales', emoji: '🏢' },
  { value: 'BarChart3', labelEs: 'Reportes & Estadísticas', desc: 'Gráficos de ventas y métricas', emoji: '📈' },
  { value: 'CreditCard', labelEs: 'Planes & Facturación', desc: 'Suscripciones y cobros', emoji: '💳' },
  { value: 'Folder', labelEs: 'Carpeta / Menú Desplegable', desc: 'Agrupador de opciones', emoji: '📁' },
  { value: 'Layers', labelEs: 'Módulos & Capas', desc: 'Estructura modular', emoji: '📚' },
  { value: 'Sparkles', labelEs: 'Destacado / Función Especial', desc: 'Herramientas VIP e innovaciones', emoji: '✨' },
  { value: 'Zap', labelEs: 'Accesos Rápidos / Acciones', desc: 'Operaciones ágiles', emoji: '⚡' },
  { value: 'ShoppingBag', labelEs: 'Punto de Venta / Tienda', desc: 'Ventas y mostrador', emoji: '🛍️' },
  { value: 'Palette', labelEs: 'Diseño & Personalización', desc: 'Colores, logos y apariencia', emoji: '🎨' },
  { value: 'Database', labelEs: 'Base de Datos / Supabase', desc: 'Almacenamiento y sincronización', emoji: '🗄️' },
  { value: 'Settings', labelEs: 'Configuración del Sistema', desc: 'Ajustes generales', emoji: '⚙️' },
  { value: 'Sliders', labelEs: 'Parámetros & Controles', desc: 'Configuraciones avanzadas', emoji: '🎛️' },
  { value: 'Layout', labelEs: 'Estructura & Vistas', desc: 'Distribución y navegación', emoji: '📐' },
  { value: 'Globe', labelEs: 'Enlace Web / Externo', desc: 'URLs y páginas externas', emoji: '🌐' },
  { value: 'HelpCircle', labelEs: 'Ayuda & Soporte', desc: 'Guías y centro de asistencia', emoji: '❓' }
];

function SpanishIconPicker({
  value,
  onChange,
  accentColor = 'purple'
}: {
  value: string;
  onChange: (val: string) => void;
  accentColor?: 'purple' | 'blue';
}) {
  const activeIcon = SPANISH_MENU_ICONS.find(i => i.value.toLowerCase() === (value || 'folder').toLowerCase()) || SPANISH_MENU_ICONS[11];

  return (
    <div className="space-y-2">
      {/* ACTIVE ICON PREVIEW CARD */}
      <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
        accentColor === 'purple'
          ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800/60'
          : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/60'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            accentColor === 'purple'
              ? 'bg-purple-600 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            {renderMenuIcon(value || 'folder', undefined, 'w-5 h-5')}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              <span>{activeIcon.emoji}</span>
              <span>{activeIcon.labelEs}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              {activeIcon.desc}
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 shrink-0">
          {activeIcon.value}
        </span>
      </div>

      {/* SPANISH DROPDOWN SELECT */}
      <div>
        <select
          value={value || 'Folder'}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-medium focus:outline-none ${
            accentColor === 'purple' ? 'focus:ring-2 focus:ring-purple-500' : 'focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {SPANISH_MENU_ICONS.map(icon => (
            <option key={icon.value} value={icon.value}>
              {icon.emoji} {icon.labelEs} ({icon.value})
            </option>
          ))}
        </select>
      </div>

      {/* POPULAR QUICK PICK ICONS GALLERY */}
      <div className="pt-1">
        <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
          Iconos Rápidos de Referencia:
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
          {SPANISH_MENU_ICONS.map(icon => {
            const isSelected = (value || 'folder').toLowerCase() === icon.value.toLowerCase();
            return (
              <button
                key={icon.value}
                type="button"
                onClick={() => onChange(icon.value)}
                className={`p-1.5 px-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? accentColor === 'purple'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700'
                }`}
                title={`${icon.labelEs} - ${icon.desc}`}
              >
                <span>{renderMenuIcon(icon.value, undefined, 'w-3.5 h-3.5')}</span>
                <span className="text-[11px] truncate max-w-[120px]">{icon.labelEs.split('/')[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface VisualLayoutBuilderProps {
  currentUser?: PortalUser | null;
  currentUserRole?: UserRole;
  currentUserEmail?: string;
  currentEmpresa?: EmpresaTenant | null;
}

export default function VisualLayoutBuilder({
  currentUser,
  currentUserRole,
  currentUserEmail,
  currentEmpresa,
}: VisualLayoutBuilderProps = {}) {
  const { 
    settings, 
    updateSettings, 
    saveSettingsToCloud,
    saveTenantMenuToCloud,
    isSaving 
  } = usePlatformSettings();

  const isSuperadmin = currentUserRole === 'SUPERADMIN' || (!currentUserRole && !currentUser?.empresaRuc);
  const tenantKey = currentEmpresa?.ruc || currentUser?.empresaRuc || (currentUser?.role !== 'SUPERADMIN' ? currentUser?.correo : null);
  const tenantDisplayName = currentEmpresa?.razonSocial || currentUser?.empresaNombre || 'Mi Empresa';

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

  // Collapsed branches state for branch mode
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});

  // Drag & Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    type: 'item' | 'group' | 'root';
    id: string;
    groupId?: string;
  } | null>(null);

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
    modalAlert.success('Distribución Actualizada', `Se ha aplicado el diseño "${mode}" a la navegación.`);
  };

  // Update content width
  const handleWidthChange = (width: 'contained-sm' | 'contained-lg' | 'full-width' | 'fluid') => {
    updateSettings({ contentLayoutWidth: width });
  };

  // Move entire group (branch) UP
  const handleMoveGroupUp = (groupId: string) => {
    const grpIdx = menuGroups.findIndex(g => g.id === groupId);
    if (grpIdx <= 0) return;
    const newGroups = [...menuGroups];
    const temp = newGroups[grpIdx];
    newGroups[grpIdx] = newGroups[grpIdx - 1];
    newGroups[grpIdx - 1] = temp;
    newGroups.forEach((g, idx) => {
      g.order = idx + 1;
    });
    updateSettings({ menuGroups: newGroups });
    modalAlert.success('Rama Reordenada', `La rama "${temp.name}" se movió hacia arriba.`);
  };

  // Move entire group (branch) DOWN
  const handleMoveGroupDown = (groupId: string) => {
    const grpIdx = menuGroups.findIndex(g => g.id === groupId);
    if (grpIdx === -1 || grpIdx >= menuGroups.length - 1) return;
    const newGroups = [...menuGroups];
    const temp = newGroups[grpIdx];
    newGroups[grpIdx] = newGroups[grpIdx + 1];
    newGroups[grpIdx + 1] = temp;
    newGroups.forEach((g, idx) => {
      g.order = idx + 1;
    });
    updateSettings({ menuGroups: newGroups });
    modalAlert.success('Rama Reordenada', `La rama "${temp.name}" se movió hacia abajo.`);
  };

  // Start editing a branch/group - Auto close all other branches!
  const handleStartEditGroup = (grp: MenuGroup) => {
    setEditingGroup({ ...grp });
    // Accordion behavior: Close all other branches when editing a branch
    const newCollapsed: Record<string, boolean> = { '__root__': true };
    menuGroups.forEach(g => {
      if (g.id !== grp.id) {
        newCollapsed[g.id] = true;
      }
    });
    setCollapsedBranches(newCollapsed);
  };

  // Remove a sub-branch (menu item) from its group and place it into loose options (Opciones Sueltas)
  const handleRemoveFromBranch = (itemId: string) => {
    const targetItem = menuItems.find(it => it.id === itemId);
    const updated = menuItems.map(it =>
      it.id === itemId ? { ...it, groupId: undefined } : it
    );
    updateSettings({ customMenuItems: updated });
    modalAlert.info('Opción Desagrupada', `"${targetItem?.label || 'Opción'}" fue retirada de la rama y ahora está en "Opciones Sueltas (Botones Directos en Barra)".`);
  };

  // Toggle branch with accordion auto-close support
  const toggleBranch = (branchId: string) => {
    setCollapsedBranches(prev => {
      const isCurrentlyCollapsed = !!prev[branchId];
      if (isCurrentlyCollapsed) {
        // When expanding this branch, collapse all OTHER branches
        const next: Record<string, boolean> = { '__root__': true };
        menuGroups.forEach(g => {
          if (g.id !== branchId) {
            next[g.id] = true;
          }
        });
        if (branchId === '__root__') {
          delete next['__root__'];
        }
        return next;
      } else {
        // Closing this branch
        return {
          ...prev,
          [branchId]: true
        };
      }
    });
  };

  const expandAllBranches = () => {
    setCollapsedBranches({});
  };

  const collapseAllBranches = () => {
    const collapsed: Record<string, boolean> = { '__root__': true };
    menuGroups.forEach(g => { collapsed[g.id] = true; });
    setCollapsedBranches(collapsed);
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
    modalAlert.success('Grupo Asignado', 'La opción de menú fue reubicada en la rama correspondiente.');
  };

  // Move item up within its branch
  const handleMoveUpInBranch = (itemId: string, groupId?: string) => {
    const branchItems = menuItems.filter(it => groupId ? it.groupId === groupId : !it.groupId);
    const itemIndex = branchItems.findIndex(it => it.id === itemId);
    if (itemIndex <= 0) return;

    const prevItem = branchItems[itemIndex - 1];
    
    // Swap global positions in menuItems array
    const newItems = [...menuItems];
    const idxA = newItems.findIndex(i => i.id === itemId);
    const idxB = newItems.findIndex(i => i.id === prevItem.id);
    
    const temp = newItems[idxA];
    newItems[idxA] = newItems[idxB];
    newItems[idxB] = temp;

    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    updateSettings({ customMenuItems: newItems });
  };

  // Move item down within its branch
  const handleMoveDownInBranch = (itemId: string, groupId?: string) => {
    const branchItems = menuItems.filter(it => groupId ? it.groupId === groupId : !it.groupId);
    const itemIndex = branchItems.findIndex(it => it.id === itemId);
    if (itemIndex === -1 || itemIndex >= branchItems.length - 1) return;

    const nextItem = branchItems[itemIndex + 1];
    
    const newItems = [...menuItems];
    const idxA = newItems.findIndex(i => i.id === itemId);
    const idxB = newItems.findIndex(i => i.id === nextItem.id);
    
    const temp = newItems[idxA];
    newItems[idxA] = newItems[idxB];
    newItems[idxB] = temp;

    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    updateSettings({ customMenuItems: newItems });
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(itemId);
  };

  const handleDragOver = (
    e: React.DragEvent, 
    targetType: 'item' | 'group' | 'root', 
    targetId: string, 
    groupId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget?.id !== targetId || dragOverTarget?.type !== targetType) {
      setDragOverTarget({ type: targetType, id: targetId, groupId });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (
    e: React.DragEvent, 
    targetType: 'item' | 'group' | 'root', 
    targetGroupId?: string, 
    targetItemId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const sourceItemId = draggedItemId || e.dataTransfer.getData('text/plain');
    if (!sourceItemId) return;

    const sourceItem = menuItems.find(i => i.id === sourceItemId);
    if (!sourceItem) return;

    let updatedList = [...menuItems];
    const sourceIndex = updatedList.findIndex(i => i.id === sourceItemId);
    if (sourceIndex === -1) return;

    // Remove item from current position
    const [movedItem] = updatedList.splice(sourceIndex, 1);

    // Apply target group
    const newGroupId = targetGroupId === 'NONE' || !targetGroupId ? undefined : targetGroupId;
    movedItem.groupId = newGroupId;

    if (targetType === 'item' && targetItemId && targetItemId !== sourceItemId) {
      const targetIndex = updatedList.findIndex(i => i.id === targetItemId);
      if (targetIndex !== -1) {
        updatedList.splice(targetIndex, 0, movedItem);
      } else {
        updatedList.push(movedItem);
      }
    } else {
      // If dropped onto a group header or root branch container, append to the end of that group
      let lastGroupItemIndex = -1;
      for (let i = updatedList.length - 1; i >= 0; i--) {
        if (newGroupId ? updatedList[i].groupId === newGroupId : !updatedList[i].groupId) {
          lastGroupItemIndex = i;
          break;
        }
      }
      if (lastGroupItemIndex !== -1) {
        updatedList.splice(lastGroupItemIndex + 1, 0, movedItem);
      } else {
        updatedList.push(movedItem);
      }
    }

    // Re-index all orders sequentially
    updatedList.forEach((item, idx) => {
      item.order = idx + 1;
    });

    updateSettings({ customMenuItems: updatedList });
    setDraggedItemId(null);
    modalAlert.success('Menú Actualizado', `Opción "${movedItem.label}" organizada en la rama.`);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverTarget(null);
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
      modalAlert.warning('Campo Requerido', 'Ingresa un nombre para el nuevo grupo o rama.');
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
    modalAlert.success('Rama Creada', `Se creó la rama "${newGroup.name}". Ahora puedes organizar opciones dentro de ella.`);
  };

  const handleSaveEditedGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    const updated = menuGroups.map(g => g.id === editingGroup.id ? editingGroup : g);
    updateSettings({ menuGroups: updated });
    setEditingGroup(null);
    modalAlert.success('Rama Actualizada', 'Los datos de la rama se guardaron correctamente.');
  };

  const handleDeleteGroup = (groupId: string) => {
    const grp = menuGroups.find(g => g.id === groupId);
    if (!grp) return;

    // Unassign items in this group -> move to loose options
    const updatedItems = menuItems.map(it => it.groupId === groupId ? { ...it, groupId: undefined } : it);
    const updatedGroups = menuGroups.filter(g => g.id !== groupId);

    updateSettings({
      menuGroups: updatedGroups,
      customMenuItems: updatedItems
    });
    modalAlert.info('Rama Eliminada', `La rama "${grp.name}" fue eliminada. Sus opciones pasaron a "Opciones Sueltas (Botones Directos en Barra)".`);
  };

  const handleResetMenuItems = () => {
    const confirmed = window.confirm('¿Restablecer el menú y la distribución a los valores predeterminados?');
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
        { id: 'menu-retenciones', key: 'retenciones', label: 'Retenciones', iconName: 'Coins', visible: true, order: 4, requiredRole: 'ALL', groupId: 'group-facturacion' },
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
    modalAlert.info('Menú Restaurado', 'Se ha restablecido la distribución original de las secciones.');
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
    modalAlert.success('Elemento Añadido', 'El nuevo elemento fue agregado a la estructura.');
  };

  const handleSaveMenuChanges = async () => {
    if (tenantKey && !isSuperadmin) {
      await saveTenantMenuToCloud(tenantKey, currentUserEmail || currentUser?.correo);
    } else {
      await saveSettingsToCloud(currentUserEmail || 'SUPERADMIN');
    }
  };

  // Ungrouped items (root branch)
  const ungroupedItems = menuItems.filter(it => !it.groupId);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* TENANT / INQUILINO ISOLATION BANNER */}
      {tenantKey && (
        <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/70 dark:bg-blue-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Personalización Aislada por Inquilino
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {tenantKey}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Empresa: {tenantDisplayName}
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-300">
                Los cambios en la estructura visual, orden y distribución de opciones se guardan exclusivamente para esta empresa y no afectarán a otros inquilinos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveMenuChanges}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 shrink-0"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Guardar Menú de esta Empresa</span>
          </button>
        </div>
      )}

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
              Escoge cómo se distribuye la barra de herramientas, menús desplegables e islas interactivas. Cada inquilino puede configurar su propia arquitectura.
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
                Barra horizontal fija en la parte superior con botones y menús desplegables.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {settings.menuLayout === 'topbar-classic' ? 'Activo' : 'Seleccionar'}
            </div>
          </div>

          {/* FLOATING ISLAND */}
          <div
            onClick={() => handleLayoutChange('floating-island')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              settings.menuLayout === 'floating-island'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md shadow-blue-500/10'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}
          >
            <div>
              <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-zinc-800 p-2 mb-3 flex flex-col items-center justify-between border border-slate-200/50 dark:border-zinc-700/50">
                <div className="h-4 w-4/5 bg-blue-600 rounded-full shrink-0 flex items-center justify-center px-2 shadow-xs">
                  <div className="flex gap-1.5">
                    <div className="h-1 w-2.5 bg-white/90 rounded-full" />
                    <div className="h-1 w-2.5 bg-white/90 rounded-full" />
                    <div className="h-1 w-2.5 bg-white/90 rounded-full" />
                  </div>
                </div>
                <div className="h-5 w-full bg-slate-200/60 dark:bg-zinc-700/60 rounded-md" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Isla Flotante</span>
                {settings.menuLayout === 'floating-island' && <Check className="w-4 h-4 text-blue-600" />}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Cápsula flotante y moderna con efecto vidrio y esquinas redondeadas.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {settings.menuLayout === 'floating-island' ? 'Activo' : 'Seleccionar'}
            </div>
          </div>

          {/* COMPACT DOCK */}
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
                <div className="h-5 w-full bg-slate-200/60 dark:bg-zinc-700/60 rounded-md" />
                <div className="h-4 w-3/4 mx-auto bg-slate-900 dark:bg-white rounded-full flex items-center justify-center gap-1">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                </div>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Dock Inferior</span>
                {settings.menuLayout === 'compact-dock' && <Check className="w-4 h-4 text-blue-600" />}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                Barra interactiva al estilo macOS en la parte inferior para agilidad táctil.
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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
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

      {/* 2. SECCIÓN: GESTIÓN DE GRUPOS DE MENÚ (AGRUPADOR DE ÍTEMS) */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Folder className="w-3.5 h-3.5" />
              <span>GRUPOS Y MENÚS DESPLEGABLES</span>
              {tenantKey && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ml-1">
                  {tenantKey}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Agrupador de Ítems del Menú
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Crea carpetas y categorías para organizar las opciones en menús desplegables. Cada inquilino puede configurar sus propios grupos y ramas.
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
          {menuGroups.map((grp, grpIdx) => {
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
                    onClick={() => handleMoveGroupUp(grp.id)}
                    disabled={grpIdx === 0}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-20 cursor-pointer transition"
                    title="Mover rama arriba"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveGroupDown(grp.id)}
                    disabled={grpIdx === menuGroups.length - 1}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-20 cursor-pointer transition"
                    title="Mover rama abajo"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEditGroup(grp)}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                    title="Editar grupo (Cierra las demás ramas)"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(grp.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition cursor-pointer"
                    title="Eliminar grupo (Opciones pasan a Sueltas)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ORGANIZADOR Y DISTRIBUCIÓN DE ÍTEMS DEL MENÚ (MODO RAMAS JERÁRQUICO + ARRASTRAR Y SOLTAR) */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <GitBranch className="w-3.5 h-3.5" />
              <span>MODO RAMAS & ARRASTRAR Y SOLTAR</span>
              {tenantKey && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-sm bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ml-1">
                  INQUILINO: {tenantDisplayName}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Organizador en Modo Ramas Jerárquico con Arrastrar y Soltar (Drag & Drop)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Estructura en árbol interactivo (Rama principal = Grupo, Subramas = Ítems de navegación). 
              Arrastra y suelta cualquier opción para reordenar secuencialmente o trasladarla entre ramas y carpetas para tu empresa.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={expandAllBranches}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer"
              title="Expandir todas las ramas"
            >
              Expandir Todo
            </button>
            <button
              type="button"
              onClick={collapseAllBranches}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer"
              title="Colapsar todas las ramas"
            >
              Colapsar
            </button>
            <button
              type="button"
              onClick={handleResetMenuItems}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer"
              title="Restablecer menú por defecto"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => setShowNewItemModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Opción</span>
            </button>
          </div>
        </div>

        {/* MODO RAMAS TREE VIEW */}
        <div className="space-y-6">

          {/* 1. RAMAS DE CADA GRUPO */}
          {menuGroups.map((grp, grpIndex) => {
            const groupSubItems = menuItems
              .filter(it => it.groupId === grp.id)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            const isCollapsed = !!collapsedBranches[grp.id];
            const isGroupDropTarget = dragOverTarget?.type === 'group' && dragOverTarget?.id === grp.id;

            return (
              <div 
                key={grp.id}
                onDragOver={(e) => handleDragOver(e, 'group', grp.id, grp.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'group', grp.id)}
                className={`rounded-2xl border transition-all duration-200 ${
                  isGroupDropTarget 
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/40' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40'
                }`}
              >
                {/* RAMA PRINCIPAL (ENCABEZADO DE GRUPO) */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-white dark:bg-zinc-850 rounded-2xl border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleBranch(grp.id)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition cursor-pointer"
                      title={isCollapsed ? 'Expandir rama (cierra las demás)' : 'Colapsar rama'}
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      {renderMenuIcon(grp.iconName || 'folder', undefined, 'w-4 h-4')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          Rama {grpIndex + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {grp.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {groupSubItems.length} {groupSubItems.length === 1 ? 'subrama / opción' : 'subramas / opciones'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Botones para Mover Rama de Posición */}
                    <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveGroupUp(grp.id); }}
                        disabled={grpIndex === 0}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 disabled:opacity-20 transition cursor-pointer"
                        title="Mover rama arriba en la posición general"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveGroupDown(grp.id); }}
                        disabled={grpIndex === menuGroups.length - 1}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 disabled:opacity-20 transition cursor-pointer"
                        title="Mover rama abajo en la posición general"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Botón Editar Rama (Cierra las demás ramas) */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleStartEditGroup(grp); }}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Editar esta rama (las demás ramas se cerrarán automáticamente)"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="hidden sm:inline">Editar Rama</span>
                    </button>

                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-black">
                      {groupSubItems.length}
                    </span>
                  </div>
                </div>

                {/* SUBRAMAS (ITEMS DEL GRUPO) */}
                {!isCollapsed && (
                  <div className="p-4 pt-3 pl-6 sm:pl-8 space-y-2 relative">
                    {/* TRONCO VERTICAL DE LA RAMA */}
                    <div className="absolute left-6 sm:left-8 top-0 bottom-6 w-0.5 bg-purple-200 dark:bg-purple-900/60" />

                    {groupSubItems.length === 0 ? (
                      <div 
                        onDragOver={(e) => handleDragOver(e, 'group', grp.id, grp.id)}
                        onDrop={(e) => handleDrop(e, 'group', grp.id)}
                        className="py-6 px-4 border-2 border-dashed border-purple-200 dark:border-purple-900/60 rounded-xl text-center text-xs text-purple-600/80 dark:text-purple-400/80 bg-purple-50/20 dark:bg-purple-950/10 ml-4"
                      >
                        <FolderOpen className="w-5 h-5 mx-auto mb-1 opacity-60" />
                        Rama vacía. Arrastra y suelta aquí opciones de menú para incluirlas en "{grp.name}".
                      </div>
                    ) : (
                      groupSubItems.map((item, itemIdx) => {
                        const isDragging = draggedItemId === item.id;
                        const isDropTarget = dragOverTarget?.type === 'item' && dragOverTarget?.id === item.id;

                        return (
                          <div
                            key={item.id || item.key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, 'item', item.id, grp.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, 'item', grp.id, item.id)}
                            onDragEnd={handleDragEnd}
                            className={`relative ml-4 pl-3 py-2.5 px-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-150 ${
                              isDragging 
                                ? 'opacity-40 scale-98 border-blue-400 bg-blue-50 dark:bg-zinc-800' 
                                : isDropTarget
                                ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/60 ring-2 ring-blue-500/50 shadow-md'
                                : item.visible !== false
                                ? 'bg-white dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700 shadow-xs'
                                : 'bg-slate-100/50 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-700 opacity-60'
                            }`}
                          >
                            {/* CONECTOR HORIZONTAL DE LA SUBRAMA */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-purple-200 dark:bg-purple-900/60" />

                            {/* Left: Drag Handle, Number & Item Details */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div 
                                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 rounded-md transition"
                                title="Arrastrar para reordenar o cambiar de grupo"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <span className="w-5 h-5 rounded-md bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                {itemIdx + 1}
                              </span>

                              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                {renderMenuIcon(item.iconName, item.key, 'w-3.5 h-3.5')}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    {item.label}
                                  </span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                    key: {item.key}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.isCustom && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase">
                                      Personalizado
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Group Selector, Botón Quitar de Rama & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800 flex-wrap">
                              {/* Botón dedicado para eliminar la subrama de este grupo y pasarla a Opciones Sueltas */}
                              <button
                                type="button"
                                onClick={() => handleRemoveFromBranch(item.id)}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-amber-200/80 dark:border-amber-800/80 shadow-2xs"
                                title="Eliminar subrama de este grupo y pasar a Opciones Sueltas (Botones Directos en Barra)"
                              >
                                <CornerDownRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>Quitar de Rama</span>
                              </button>

                              {/* Quick Move between Groups */}
                              <select
                                value={item.groupId || 'NONE'}
                                onChange={(e) => handleAssignGroup(item.id, e.target.value)}
                                className="text-[11px] px-2 py-1 rounded-lg border font-semibold bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer"
                              >
                                <option value="NONE">Desagrupar (Suelto)</option>
                                {menuGroups.map(g => (
                                  <option key={g.id} value={g.id}>📁 {g.name}</option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleMoveUpInBranch(item.id, grp.id)}
                                disabled={itemIdx === 0}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-20 cursor-pointer"
                                title="Subir en esta rama"
                              >
                                <MoveUp className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMoveDownInBranch(item.id, grp.id)}
                                disabled={itemIdx === groupSubItems.length - 1}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-20 cursor-pointer"
                                title="Bajar en esta rama"
                              >
                                <MoveDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingItem({ ...item })}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 cursor-pointer"
                                title="Editar opción"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(item.id)}
                                className={`p-1 rounded-lg cursor-pointer ${
                                  item.visible !== false ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                }`}
                                title={item.visible !== false ? 'Visible' : 'Oculto'}
                              >
                                {item.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>

                              {item.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                  title="Eliminar opción personalizada"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 2. RAMA DE ÍTEMS SUELTOS / NIVEL SUPERIOR (SIN GRUPO) */}
          <div
            onDragOver={(e) => handleDragOver(e, 'root', '__root__', undefined)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'root', 'NONE')}
            className={`rounded-2xl border transition-all duration-200 ${
              dragOverTarget?.type === 'root'
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/40'
                : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40'
            }`}
          >
            {/* ENCABEZADO DE RAMA SIN GRUPO */}
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-white dark:bg-zinc-850 rounded-2xl border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleBranch('__root__')}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition cursor-pointer"
                  title={collapsedBranches['__root__'] ? 'Expandir rama' : 'Colapsar rama'}
                >
                  {collapsedBranches['__root__'] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                  <Layout className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      Nivel Superior
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      Opciones Sueltas (Botones Directos en Barra)
                    </h4>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {ungroupedItems.length} {ungroupedItems.length === 1 ? 'opción directa' : 'opciones directas'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-zinc-500 hidden sm:inline">
                  Arrastra aquí para desagrupar
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-black">
                  {ungroupedItems.length}
                </span>
              </div>
            </div>

            {/* SUBRAMAS SUELTAS */}
            {!collapsedBranches['__root__'] && (
              <div className="p-4 pt-3 pl-6 sm:pl-8 space-y-2 relative">
                <div className="absolute left-6 sm:left-8 top-0 bottom-6 w-0.5 bg-slate-200 dark:bg-zinc-700" />

                {ungroupedItems.length === 0 ? (
                  <div 
                    onDragOver={(e) => handleDragOver(e, 'root', '__root__', undefined)}
                    onDrop={(e) => handleDrop(e, 'root', 'NONE')}
                    className="py-6 px-4 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-xl text-center text-xs text-slate-500 dark:text-zinc-400 bg-slate-50/20 dark:bg-zinc-950/10 ml-4"
                  >
                    No hay opciones sueltas. Todas las opciones están clasificadas dentro de grupos.
                  </div>
                ) : (
                  ungroupedItems.map((item, itemIdx) => {
                    const isDragging = draggedItemId === item.id;
                    const isDropTarget = dragOverTarget?.type === 'item' && dragOverTarget?.id === item.id;

                    return (
                      <div
                        key={item.id || item.key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, 'item', item.id, undefined)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'item', 'NONE', item.id)}
                        onDragEnd={handleDragEnd}
                        className={`relative ml-4 pl-3 py-2.5 px-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-150 ${
                          isDragging 
                            ? 'opacity-40 scale-98 border-blue-400 bg-blue-50 dark:bg-zinc-800' 
                            : isDropTarget
                            ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/60 ring-2 ring-blue-500/50 shadow-md'
                            : item.visible !== false
                            ? 'bg-white dark:bg-zinc-850 border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700 shadow-xs'
                            : 'bg-slate-100/50 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-700 opacity-60'
                        }`}
                      >
                        {/* Conector horizontal */}
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-200 dark:bg-zinc-700" />

                        {/* Left */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 rounded-md transition"
                            title="Arrastrar para reordenar o asignar a un grupo"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-black flex items-center justify-center shrink-0">
                            {itemIdx + 1}
                          </span>

                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            {renderMenuIcon(item.iconName, item.key, 'w-3.5 h-3.5')}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {item.label}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                key: {item.key}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  {item.badge}
                                </span>
                              )}
                              {item.isCustom && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase">
                                  Personalizado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right */}
                        <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800">
                          <select
                            value="NONE"
                            onChange={(e) => handleAssignGroup(item.id, e.target.value)}
                            className="text-[11px] px-2 py-1 rounded-lg border font-semibold bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 cursor-pointer"
                          >
                            <option value="NONE">Sin Grupo (Suelto)</option>
                            {menuGroups.map(g => (
                              <option key={g.id} value={g.id}>📁 Asignar a {g.name}</option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleMoveUpInBranch(item.id, undefined)}
                            disabled={itemIdx === 0}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-20 cursor-pointer"
                            title="Subir en esta rama"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveDownInBranch(item.id, undefined)}
                            disabled={itemIdx === ungroupedItems.length - 1}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 disabled:opacity-20 cursor-pointer"
                            title="Bajar en esta rama"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...item })}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 cursor-pointer"
                            title="Editar opción"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(item.id)}
                            className={`p-1 rounded-lg cursor-pointer ${
                              item.visible !== false ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                            title={item.visible !== false ? 'Visible' : 'Oculto'}
                          >
                            {item.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Eliminar opción"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* MODAL PARA CREAR NUEVO GRUPO / RAMA */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Crear Nueva Rama / Grupo de Menú
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Aparecerá en el TopBar y al darle clic saldrán sus subramas asociadas.
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
                  Nombre de la Rama *
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
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Icono de la Rama (En Español con Referencia Visual)
                </label>
                <SpanishIconPicker
                  value={newGroupFormData.iconName || 'Folder'}
                  onChange={(icon) => setNewGroupFormData({ ...newGroupFormData, iconName: icon })}
                  accentColor="purple"
                />
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
                  Crear Rama
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA EDITAR GRUPO / RAMA */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-zinc-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Editar Rama / Grupo
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
                  Nombre de la Rama *
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
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Icono de la Rama (En Español con Referencia Visual)
                </label>
                <SpanishIconPicker
                  value={editingGroup.iconName || 'Folder'}
                  onChange={(icon) => setEditingGroup({ ...editingGroup, iconName: icon })}
                  accentColor="purple"
                />
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
                  Pertenece a la Rama / Grupo
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

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Icono del Botón (En Español con Referencia Visual)
                </label>
                <SpanishIconPicker
                  value={editingItem.iconName || 'FileText'}
                  onChange={(icon) => setEditingItem({ ...editingItem, iconName: icon })}
                  accentColor="blue"
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
                  Asignar a Rama / Grupo
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
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Icono de la Opción (En Español con Referencia Visual)
                </label>
                <SpanishIconPicker
                  value={newItemFormData.iconName || 'FileText'}
                  onChange={(icon) => setNewItemFormData({ ...newItemFormData, iconName: icon })}
                  accentColor="blue"
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
