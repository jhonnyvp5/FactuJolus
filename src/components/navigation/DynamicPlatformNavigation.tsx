import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  PlusCircle,
  Plus,
  Receipt,
  Coins,
  FileSpreadsheet,
  Package,
  Users,
  User,
  Settings,
  ShieldCheck,
  Building2,
  Palette,
  Database,
  BarChart3,
  HelpCircle,
  ShoppingBag,
  Zap,
  Globe,
  Layers,
  History,
  ArrowLeftRight,
  Sparkles,
  CreditCard,
  Megaphone,
  CheckCircle2,
  Calculator,
  Sliders,
  Layout,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { CustomMenuItem, MenuGroup, PortalUser } from '../../types';

// Map icon string name to Lucide component
export function renderMenuIcon(iconName?: string, itemKey?: string, className: string = 'w-4 h-4') {
  const name = (iconName || '').toLowerCase();
  const key = (itemKey || '').toLowerCase();

  // Explicit iconName matches
  if (name === 'filetext') return <FileText className={className} />;
  if (name === 'pluscircle' || name === 'plus') return <PlusCircle className={className} />;
  if (name === 'receipt') return <Receipt className={className} />;
  if (name === 'coins') return <Coins className={className} />;
  if (name === 'filespreadsheet') return <FileSpreadsheet className={className} />;
  if (name === 'package') return <Package className={className} />;
  if (name === 'users') return <Users className={className} />;
  if (name === 'user') return <User className={className} />;
  if (name === 'settings') return <Settings className={className} />;
  if (name === 'shieldcheck') return <ShieldCheck className={className} />;
  if (name === 'building2') return <Building2 className={className} />;
  if (name === 'palette') return <Palette className={className} />;
  if (name === 'database') return <Database className={className} />;
  if (name === 'barchart3') return <BarChart3 className={className} />;
  if (name === 'helpcircle') return <HelpCircle className={className} />;
  if (name === 'shoppingbag') return <ShoppingBag className={className} />;
  if (name === 'zap') return <Zap className={className} />;
  if (name === 'creditcard') return <CreditCard className={className} />;
  if (name === 'layers') return <Layers className={className} />;
  if (name === 'sparkles') return <Sparkles className={className} />;
  if (name === 'calculator') return <Calculator className={className} />;
  if (name === 'sliders') return <Sliders className={className} />;
  if (name === 'layout') return <Layout className={className} />;
  if (name === 'folder' || name === 'folderopen') return <Folder className={className} />;
  if (name === 'history') return <History className={className} />;
  if (name === 'arrowleftright') return <ArrowLeftRight className={className} />;
  if (name === 'globe') return <Globe className={className} />;

  // Default keys fallback mapping
  if (key === 'history') return <History className={className} />;
  if (key === 'new-invoice') return <Plus className={className} />;
  if (key === 'new-nc') return <Receipt className={className} />;
  if (key === 'retentions') return <Coins className={className} />;
  if (key === 'proformas') return <FileSpreadsheet className={className} />;
  if (key === 'products') return <Package className={className} />;
  if (key === 'clients') return <Users className={className} />;
  if (key === 'profile') return <User className={className} />;
  if (key === 'settings') return <Settings className={className} />;
  if (key === 'users') return <ShieldCheck className={className} />;
  if (key === 'tenants') return <Building2 className={className} />;
  if (key === 'customizer') return <Palette className={className} />;
  if (key === 'supabase') return <Database className={className} />;

  return <Globe className={className} />;
}

interface DynamicPlatformNavigationProps {
  activeTab: string;
  onSelectTab: (tabKey: string) => void;
  currentUser: PortalUser | null;
  userPermissions: string[];
  layoutMode?: 'topbar-classic' | 'sidebar-left' | 'sidebar-right' | 'compact-dock' | 'floating-island';
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const DynamicPlatformNavigation: React.FC<DynamicPlatformNavigationProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  userPermissions,
  layoutMode = 'topbar-classic',
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const { settings, themeClasses } = usePlatformSettings();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const userRole = currentUser?.role?.toUpperCase() || 'USER';
  const isSuperadmin = userRole === 'SUPERADMIN';
  const isAdmin = userRole === 'ADMIN' || isSuperadmin;

  // Filter items based on visibility, permissions & order
  const rawItems = settings.customMenuItems && settings.customMenuItems.length > 0
    ? settings.customMenuItems
    : [];

  const visibleItems = [...rawItems]
    .filter(item => {
      if (item.visible === false) return false;

      // Allow 'customizer' for tenants and inquilinos to customize their menu layout and hierarchy
      if (item.key === 'customizer') {
        if (!isAdmin && userPermissions && userPermissions.length > 0 && !userPermissions.includes('customizer')) {
          // If explicitly restricted in user permissions for simple USER role
          return false;
        }
        return true;
      }

      // Role check
      if (item.requiredRole === 'SUPERADMIN' && !isSuperadmin) return false;
      if (item.requiredRole === 'ADMIN' && !isAdmin) return false;

      // Regular user permissions check
      if (!isAdmin && item.requiredRole === 'ALL') {
        const allowedKeys = ['history', 'new-invoice', 'new-nc', 'retenciones', 'proformas', 'products', 'clients', 'profile', 'settings', 'customizer'];
        if (allowedKeys.includes(item.key) && !userPermissions.includes(item.key)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Groups definitions
  const rawGroups: MenuGroup[] = settings.menuGroups && settings.menuGroups.length > 0
    ? settings.menuGroups
    : [
        { id: 'group-facturacion', name: 'Facturación SRI', iconName: 'FileText', order: 1, visible: true },
        { id: 'group-catalogos', name: 'Catálogos', iconName: 'Package', order: 2, visible: true },
        { id: 'group-admin', name: 'Administración', iconName: 'ShieldCheck', order: 3, visible: true },
      ];

  const sortedGroups = [...rawGroups]
    .filter(g => g.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Group items by groupId
  const itemsByGroup: Record<string, CustomMenuItem[]> = {};
  const ungroupedItems: CustomMenuItem[] = [];

  visibleItems.forEach(item => {
    if (item.groupId && sortedGroups.some(g => g.id === item.groupId)) {
      if (!itemsByGroup[item.groupId]) {
        itemsByGroup[item.groupId] = [];
      }
      itemsByGroup[item.groupId].push(item);
    } else {
      ungroupedItems.push(item);
    }
  });

  // Find active group ID containing activeTab
  const getActiveGroupId = (currentTab: string): string | null => {
    for (const grp of sortedGroups) {
      const items = itemsByGroup[grp.id] || [];
      if (items.some(it => it.key === currentTab)) {
        return grp.id;
      }
    }
    return null;
  };

  const initialActiveGrpId = getActiveGroupId(activeTab);

  // Expanded accordions: only the active group starts open
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>(() => {
    return initialActiveGrpId ? { [initialActiveGrpId]: true } : {};
  });

  // When activeTab changes or menu items change, automatically open ONLY the active branch accordion
  useEffect(() => {
    const activeGrp = getActiveGroupId(activeTab);
    if (activeGrp) {
      setExpandedAccordions({ [activeGrp]: true });
    } else {
      setExpandedAccordions({});
    }
  }, [activeTab, settings.customMenuItems, settings.menuGroups]);

  const navRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Combined list of display nodes: either a Group (with children) or an Ungrouped Item
  type NavNode = 
    | { type: 'group'; group: MenuGroup; children: CustomMenuItem[]; order: number }
    | { type: 'item'; item: CustomMenuItem; order: number };

  const navNodes: NavNode[] = [];

  // Add populated groups
  sortedGroups.forEach(grp => {
    const children = itemsByGroup[grp.id] || [];
    if (children.length > 0) {
      navNodes.push({
        type: 'group',
        group: grp,
        children,
        order: grp.order || 99
      });
    }
  });

  // Add ungrouped items
  ungroupedItems.forEach(item => {
    navNodes.push({
      type: 'item',
      item,
      order: item.order || 99
    });
  });

  navNodes.sort((a, b) => a.order - b.order);

  const handleItemClick = (item: CustomMenuItem) => {
    if (item.isCustom && item.customUrl) {
      if (item.openInNewTab !== false) {
        window.open(item.customUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.customUrl;
      }
      if (isMobileDrawer && onCloseMobileDrawer) {
        onCloseMobileDrawer();
      }
      setOpenDropdownId(null);
      return;
    }

    onSelectTab(item.key);
    setOpenDropdownId(null);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const toggleAccordion = (groupId: string) => {
    setExpandedAccordions(prev => {
      const isCurrentlyOpen = !!prev[groupId];
      if (isCurrentlyOpen) {
        return {};
      } else {
        return { [groupId]: true };
      }
    });
  };

  // 1. MOBILE DRAWER RENDER (ACCORDION STYLE)
  if (isMobileDrawer) {
    return (
      <div className="flex flex-col gap-1.5 flex-grow" ref={navRef}>
        <div className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest pl-2 mb-1">
          Navegación del Portal ({visibleItems.length})
        </div>

        {navNodes.map(node => {
          if (node.type === 'item') {
            const item = node.item;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.id || item.key}
                onClick={() => handleItemClick(item)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${themeClasses.primaryGradient} text-white shadow-md shadow-blue-500/20`
                    : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}>
                    {renderMenuIcon(item.iconName, item.key, 'w-4 h-4 shrink-0')}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.isCustom && item.customUrl && (
                    <ExternalLink className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                  {isActive && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </div>
              </button>
            );
          }

          // GROUP ACCORDION IN MOBILE
          const grp = node.group;
          const isSingleOption = node.children.length === 1;
          const isExpanded = !isSingleOption && !!expandedAccordions[grp.id];
          const hasActiveChild = node.children.some(c => c.key === activeTab);
          const singleChild = isSingleOption ? node.children[0] : null;

          return (
            <div key={grp.id} className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                disabled={isSingleOption}
                onClick={() => {
                  if (!isSingleOption) toggleAccordion(grp.id);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-black transition flex items-center justify-between ${
                  isSingleOption
                    ? 'cursor-not-allowed opacity-75 text-slate-600 dark:text-zinc-400 bg-slate-100/60 dark:bg-zinc-800/40'
                    : hasActiveChild
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/30 cursor-pointer'
                    : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 cursor-pointer'
                }`}
                title={isSingleOption ? `Opción única disponible (${singleChild?.label}) - Desplegable bloqueado` : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <span className={hasActiveChild ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-zinc-400'}>
                    {renderMenuIcon(grp.iconName || 'folder', undefined, 'w-4 h-4')}
                  </span>
                  <span>{grp.name}</span>
                  {isSingleOption ? (
                    <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                      1 opción (bloqueado)
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-normal opacity-60">({node.children.length})</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasActiveChild && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
                    </span>
                  )}
                  {isSingleOption ? (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">🔒</span>
                  ) : (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>

              {isExpanded && !isSingleOption && (
                <div className="p-1.5 space-y-1 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
                  {node.children.map(child => {
                    const isChildActive = activeTab === child.key;
                    return (
                      <button
                        key={child.id || child.key}
                        onClick={() => handleItemClick(child)}
                        className={`w-full py-2.5 px-3 pl-4 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isChildActive
                            ? `bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-black`
                            : 'text-slate-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={isChildActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>
                            {renderMenuIcon(child.iconName, child.key, 'w-4 h-4')}
                          </span>
                          <span className="truncate">{child.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {child.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                              isChildActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {child.badge}
                            </span>
                          )}
                          {isChildActive && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-xs"></span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 2. SIDEBAR (LEFT OR RIGHT) RENDER WITH ACCORDIONS
  if (layoutMode === 'sidebar-left' || layoutMode === 'sidebar-right') {
    return (
      <div className="space-y-2 py-1" ref={navRef}>
        <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-2">
          Navegación
        </div>

        {navNodes.map(node => {
          if (node.type === 'item') {
            const item = node.item;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.id || item.key}
                onClick={() => handleItemClick(item)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer group text-left ${
                  isActive
                    ? `bg-gradient-to-r ${themeClasses.primaryGradient} text-white font-bold shadow-md shadow-blue-500/25 ring-1 ring-white/20 scale-[1.01]`
                    : 'text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-zinc-800/70'
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400 group-hover:scale-110'}`}>
                    {renderMenuIcon(item.iconName, item.key, 'w-4 h-4')}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.isCustom && item.customUrl && (
                    <ExternalLink className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  )}
                  {isActive && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </div>
              </button>
            );
          }

          // GROUP ACCORDION IN SIDEBAR
          const grp = node.group;
          const isSingleOption = node.children.length === 1;
          const isExpanded = !isSingleOption && !!expandedAccordions[grp.id];
          const hasActiveChild = node.children.some(c => c.key === activeTab);
          const singleChild = isSingleOption ? node.children[0] : null;

          return (
            <div key={grp.id} className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                disabled={isSingleOption}
                onClick={() => {
                  if (!isSingleOption) toggleAccordion(grp.id);
                }}
                className={`w-full py-2.5 px-3.5 text-xs font-bold transition-colors flex items-center justify-between ${
                  isSingleOption
                    ? 'cursor-not-allowed opacity-75 text-slate-600 dark:text-zinc-400 bg-slate-100/60 dark:bg-zinc-800/40'
                    : hasActiveChild
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20 cursor-pointer'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 cursor-pointer'
                }`}
                title={isSingleOption ? `Opción única disponible (${singleChild?.label}) - Desplegable bloqueado` : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <span className={hasActiveChild ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-400'}>
                    {renderMenuIcon(grp.iconName || 'folder', undefined, 'w-3.5 h-3.5')}
                  </span>
                  <span className="truncate font-extrabold">{grp.name}</span>
                  {isSingleOption && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                      1 opción
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasActiveChild && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
                    </span>
                  )}
                  {isSingleOption ? (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">🔒</span>
                  ) : (
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>

              {isExpanded && !isSingleOption && (
                <div className="p-1 space-y-0.5 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
                  {node.children.map(child => {
                    const isChildActive = activeTab === child.key;
                    return (
                      <button
                        key={child.id || child.key}
                        onClick={() => handleItemClick(child)}
                        className={`w-full py-2 px-3 pl-4 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-between cursor-pointer group text-left ${
                          isChildActive
                            ? `bg-indigo-600 text-white font-black shadow-xs shadow-indigo-500/20`
                            : 'text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800/70'
                        }`}
                        title={child.label}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={isChildActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>
                            {renderMenuIcon(child.iconName, child.key, 'w-3.5 h-3.5')}
                          </span>
                          <span className="truncate">{child.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {child.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                              isChildActive ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                            }`}>
                              {child.badge}
                            </span>
                          )}
                          {isChildActive && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // 3. FLOATING ISLAND RENDER (Figma & Dynamic Floating Bar with All Options & Dropdowns)
  if (layoutMode === 'floating-island') {
    return (
      <div className="w-full flex justify-center print:hidden select-none" ref={navRef}>
        <nav className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 sm:p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-full border border-slate-200/90 dark:border-zinc-800 shadow-xl shadow-slate-900/10 dark:shadow-black/60 max-w-full mx-auto ring-1 ring-slate-900/5 dark:ring-white/10">
          {navNodes.map(node => {
            if (node.type === 'item') {
              const item = node.item;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.id || item.key}
                  onClick={() => handleItemClick(item)}
                  className={`group px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? `bg-gradient-to-r ${themeClasses.primaryGradient} text-white font-bold shadow-lg shadow-blue-500/30 ring-1 ring-white/40 scale-[1.03]`
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-zinc-800/80'
                  }`}
                  title={item.label}
                >
                  <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400 group-hover:scale-110'}`}>
                    {renderMenuIcon(item.iconName, item.key, 'w-3.5 h-3.5')}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                  )}
                </button>
              );
            }

            // GROUP DROPDOWN IN FLOATING ISLAND
            const grp = node.group;
            const isSingleOption = node.children.length === 1;
            const isDropdownOpen = !isSingleOption && openDropdownId === grp.id;
            const hasActiveChild = node.children.some(c => c.key === activeTab);
            const activeChild = node.children.find(c => c.key === activeTab);
            const singleChild = isSingleOption ? node.children[0] : null;

            return (
              <div key={grp.id} className="relative shrink-0">
                <button
                  type="button"
                  disabled={isSingleOption}
                  onClick={() => {
                    if (!isSingleOption) setOpenDropdownId(isDropdownOpen ? null : grp.id);
                  }}
                  className={`group px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    isSingleOption
                      ? 'cursor-not-allowed opacity-75 bg-slate-100/80 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400'
                      : hasActiveChild
                      ? `bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold ring-1 ring-indigo-500/30 shadow-xs cursor-pointer`
                      : 'text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-zinc-800/80 cursor-pointer'
                  }`}
                  title={isSingleOption ? `Opción única disponible (${singleChild?.label}) - Desplegable bloqueado` : undefined}
                >
                  <span className={hasActiveChild ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500'}>
                    {renderMenuIcon(grp.iconName || 'folder', undefined, 'w-3.5 h-3.5')}
                  </span>
                  <span className="font-extrabold">{grp.name}</span>
                  {isSingleOption ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                      1 opción
                    </span>
                  ) : activeChild ? (
                    <span className="hidden md:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      {activeChild.label}
                    </span>
                  ) : null}
                  {isSingleOption ? (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">🔒</span>
                  ) : (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* DROPDOWN MENU */}
                {isDropdownOpen && !isSingleOption && (
                  <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 min-w-[240px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10 dark:ring-white/10">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 mb-1.5 flex items-center justify-between">
                      <span className="text-slate-800 dark:text-zinc-200 font-bold">{grp.name}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                        {node.children.length} opciones
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {node.children.map(child => {
                        const isChildActive = activeTab === child.key;
                        return (
                          <button
                            key={child.id || child.key}
                            onClick={() => handleItemClick(child)}
                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer text-left ${
                              isChildActive
                                ? `bg-indigo-600 text-white font-black shadow-md shadow-indigo-500/25`
                                : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={isChildActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>
                                {renderMenuIcon(child.iconName, child.key, 'w-4 h-4')}
                              </span>
                              <span className="truncate">{child.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {child.badge && (
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                  isChildActive ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                }`}>
                                  {child.badge}
                                </span>
                              )}
                              {isChildActive && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    );
  }

  // 4. COMPACT DOCK RENDER (macOS / iPadOS Style with Group Dropdowns Opening Upwards)
  if (layoutMode === 'compact-dock') {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-full px-4 print:hidden pointer-events-auto select-none" ref={navRef}>
        <nav className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-2xl text-white rounded-2xl sm:rounded-full border border-slate-700/60 dark:border-zinc-700/60 shadow-2xl shadow-black/50 ring-1 ring-white/15 overflow-visible max-w-[95vw]">
          {navNodes.map(node => {
            if (node.type === 'item') {
              const item = node.item;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.id || item.key}
                  onClick={() => handleItemClick(item)}
                  className={`group px-3 py-2 rounded-xl sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? `bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/40 ring-1 ring-white/30 scale-105`
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={item.label}
                >
                  <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-indigo-400 group-hover:scale-110'}`}>
                    {renderMenuIcon(item.iconName, item.key, 'w-4 h-4')}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </button>
              );
            }

            // GROUP BUTTON IN DOCK WITH POPUP OPENING UPWARDS
            const grp = node.group;
            const isSingleOption = node.children.length === 1;
            const isDropdownOpen = !isSingleOption && openDropdownId === grp.id;
            const hasActiveChild = node.children.some(c => c.key === activeTab);
            const activeChild = node.children.find(c => c.key === activeTab);
            const singleChild = isSingleOption ? node.children[0] : null;

            return (
              <div key={grp.id} className="relative shrink-0">
                <button
                  type="button"
                  disabled={isSingleOption}
                  onClick={() => {
                    if (!isSingleOption) setOpenDropdownId(isDropdownOpen ? null : grp.id);
                  }}
                  className={`group px-3 py-2 rounded-xl sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    isSingleOption
                      ? 'cursor-not-allowed opacity-75 bg-slate-800/80 text-slate-400'
                      : hasActiveChild
                      ? `bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/40 ring-1 ring-white/30 scale-105 cursor-pointer`
                      : 'text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer'
                  }`}
                  title={isSingleOption ? `Opción única disponible (${singleChild?.label}) - Desplegable bloqueado` : undefined}
                >
                  <span className={hasActiveChild ? 'text-white' : 'text-indigo-400'}>
                    {renderMenuIcon(grp.iconName || 'folder', undefined, 'w-4 h-4')}
                  </span>
                  <span className="hidden sm:inline font-extrabold">{grp.name}</span>
                  {isSingleOption ? (
                    <span className="hidden sm:inline text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                      1 opción
                    </span>
                  ) : activeChild ? (
                    <span className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                      {activeChild.label}
                    </span>
                  ) : null}
                  {isSingleOption ? (
                    <span className="text-[10px] font-bold text-slate-400">🔒</span>
                  ) : (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* DOCK POPUP OPENING UPWARDS */}
                {isDropdownOpen && !isSingleOption && (
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 min-w-[240px] bg-slate-900 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-white ring-1 ring-white/20">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1.5 flex items-center justify-between">
                      <span className="text-white font-bold">{grp.name}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {node.children.length} opciones
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {node.children.map(child => {
                        const isChildActive = activeTab === child.key;
                        return (
                          <button
                            key={child.id || child.key}
                            onClick={() => handleItemClick(child)}
                            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                              isChildActive
                                ? `bg-indigo-600 text-white font-black shadow-md shadow-indigo-500/30`
                                : 'text-slate-200 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={isChildActive ? 'text-white' : 'text-indigo-400'}>
                                {renderMenuIcon(child.iconName, child.key, 'w-4 h-4')}
                              </span>
                              <span className="truncate">{child.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {child.badge && (
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                  isChildActive ? 'bg-white/20 text-white' : 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                                }`}>
                                  {child.badge}
                                </span>
                              )}
                              {isChildActive && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    );
  }

  // 5. TOPBAR CLASSIC (DEFAULT) WITH GROUPS & DIRECT ITEMS
  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 sm:p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-sm dark:shadow-xl shadow-slate-200/50 dark:shadow-black/40 w-full mx-auto print:hidden animate-fade-in ring-1 ring-slate-900/5 dark:ring-white/10 select-none" ref={navRef}>
      {navNodes.map(node => {
        if (node.type === 'item') {
          const item = node.item;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.id || item.key}
              onClick={() => handleItemClick(item)}
              className={`group px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-[11px] lg:text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? `bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25 ring-1 ring-white/30 scale-[1.02]`
                  : 'text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-zinc-800/80'
              }`}
              title={item.label}
            >
              <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400 group-hover:scale-110'}`}>
                {renderMenuIcon(item.iconName, item.key, 'w-4 h-4')}
              </span>
              <span className="font-bold">{item.label}</span>
              {item.badge && (
                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                  isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}>
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="relative flex h-2 w-2 shrink-0 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              )}
            </button>
          );
        }

        // GROUP DROPDOWN IN TOPBAR CLASSIC
        const grp = node.group;
        const isSingleOption = node.children.length === 1;
        const isDropdownOpen = !isSingleOption && openDropdownId === grp.id;
        const hasActiveChild = node.children.some(c => c.key === activeTab);
        const activeChild = node.children.find(c => c.key === activeTab);
        const singleChild = isSingleOption ? node.children[0] : null;

        return (
          <div key={grp.id} className="relative shrink-0">
            <button
              type="button"
              disabled={isSingleOption}
              onClick={() => {
                if (!isSingleOption) setOpenDropdownId(isDropdownOpen ? null : grp.id);
              }}
              className={`group px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-[11px] lg:text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                isSingleOption
                  ? 'cursor-not-allowed opacity-75 bg-slate-100/70 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400'
                  : hasActiveChild
                  ? `bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold ring-1 ring-indigo-500/30 shadow-xs cursor-pointer`
                  : 'text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-zinc-800/80 cursor-pointer'
              }`}
              title={isSingleOption ? `Opción única disponible (${singleChild?.label}) - Desplegable bloqueado` : undefined}
            >
              <span className={`shrink-0 transition-transform duration-200 ${hasActiveChild ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-500 group-hover:scale-110'}`}>
                {renderMenuIcon(grp.iconName || 'folder', undefined, 'w-4 h-4')}
              </span>
              <span className="font-extrabold">{grp.name}</span>
              {isSingleOption ? (
                <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300">
                  1 opción
                </span>
              ) : activeChild ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                  {activeChild.label}
                </span>
              ) : null}
              {isSingleOption ? (
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">🔒</span>
              ) : (
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 opacity-70 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* TOPBAR DROPDOWN POPOVER */}
            {isDropdownOpen && !isSingleOption && (
              <div className="absolute top-full mt-2 left-0 sm:left-1/2 sm:-translate-x-1/2 min-w-[240px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10 dark:ring-white/10">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 mb-1.5 flex items-center justify-between">
                  <span className="text-slate-800 dark:text-zinc-200 font-bold">{grp.name}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                    {node.children.length} opciones
                  </span>
                </div>
                <div className="space-y-0.5">
                  {node.children.map(child => {
                    const isChildActive = activeTab === child.key;
                    return (
                      <button
                        key={child.id || child.key}
                        onClick={() => handleItemClick(child)}
                        className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer text-left ${
                          isChildActive
                            ? `bg-indigo-600 text-white font-black shadow-md shadow-indigo-500/25`
                            : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={isChildActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>
                            {renderMenuIcon(child.iconName, child.key, 'w-4 h-4')}
                          </span>
                          <span className="truncate">{child.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {child.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase shrink-0 ${
                              isChildActive ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            }`}>
                              {child.badge}
                            </span>
                          )}
                          {isChildActive && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
