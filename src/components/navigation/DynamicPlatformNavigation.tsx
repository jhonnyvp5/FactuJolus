import React from 'react';
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
  ExternalLink
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { CustomMenuItem, PortalUser } from '../../types';

// Map icon string name to Lucide component
export function renderMenuIcon(iconName?: string, itemKey?: string, className: string = 'w-4 h-4') {
  const name = (iconName || '').toLowerCase();
  const key = (itemKey || '').toLowerCase();

  if (name === 'filetext' || key === 'history') return <History className={className} />;
  if (name === 'pluscircle' || name === 'plus' || key === 'new-invoice') return <Plus className={className} />;
  if (name === 'receipt' || key === 'new-nc') return <ArrowLeftRight className={className} />;
  if (name === 'coins' || key === 'retentions') return <ShieldCheck className={className} />;
  if (name === 'filespreadsheet' || key === 'proformas') return <FileText className={className} />;
  if (name === 'package' || key === 'products') return <Package className={className} />;
  if (name === 'users' || key === 'clients') return <Users className={className} />;
  if (name === 'user' || key === 'profile') return <User className={className} />;
  if (name === 'settings' || key === 'settings') return <Settings className={className} />;
  if (name === 'shieldcheck' || key === 'users') return <ShieldCheck className={className} />;
  if (name === 'building2' || key === 'tenants') return <Building2 className={className} />;
  if (name === 'palette' || key === 'customizer') return <Palette className={className} />;
  if (name === 'database' || key === 'supabase') return <Database className={className} />;
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

      // Role check
      if (item.requiredRole === 'SUPERADMIN' && !isSuperadmin) return false;
      if (item.requiredRole === 'ADMIN' && !isAdmin) return false;

      // Regular user permissions check
      if (!isAdmin && item.requiredRole === 'ALL') {
        const allowedKeys = ['history', 'new-invoice', 'new-nc', 'retentions', 'proformas', 'products', 'clients', 'profile', 'settings'];
        if (allowedKeys.includes(item.key) && !userPermissions.includes(item.key)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

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
      return;
    }

    onSelectTab(item.key);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  // 1. MOBILE DRAWER RENDER
  if (isMobileDrawer) {
    return (
      <div className="flex flex-col gap-1.5 flex-grow">
        <div className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest pl-2 mb-1">
          Navegación del Portal ({visibleItems.length})
        </div>

        {visibleItems.map(item => {
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
                {isActive && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. SIDEBAR (LEFT OR RIGHT) RENDER
  if (layoutMode === 'sidebar-left' || layoutMode === 'sidebar-right') {
    return (
      <div className="space-y-1 py-2">
        <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-2">
          Menú Principal
        </div>
        {visibleItems.map(item => {
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
        })}
      </div>
    );
  }

  // 3. FLOATING ISLAND RENDER (Figma Style)
  if (layoutMode === 'floating-island') {
    return (
      <nav className="flex flex-wrap items-center justify-center gap-1.5 p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-full border border-slate-200/90 dark:border-zinc-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 max-w-fit mx-auto print:hidden ring-1 ring-slate-900/5 dark:ring-white/10 select-none">
        {visibleItems.map(item => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.id || item.key}
              onClick={() => handleItemClick(item)}
              className={`group px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? `bg-gradient-to-r ${themeClasses.primaryGradient} text-white font-bold shadow-lg shadow-blue-500/30 ring-1 ring-white/40 scale-[1.04]`
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
        })}
      </nav>
    );
  }

  // 4. COMPACT DOCK RENDER (macOS / iPadOS Style)
  if (layoutMode === 'compact-dock') {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-full px-4 print:hidden pointer-events-auto">
        <nav className="flex items-center gap-1 sm:gap-2 p-2 bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-2xl text-white rounded-2xl sm:rounded-full border border-slate-700/60 dark:border-zinc-700/60 shadow-2xl shadow-black/50 ring-1 ring-white/15 overflow-x-auto max-w-[95vw] scrollbar-none">
          {visibleItems.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.id || item.key}
                onClick={() => handleItemClick(item)}
                className={`group px-3 py-2 rounded-xl sm:rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? `bg-gradient-to-r ${themeClasses.primaryGradient} text-white font-bold shadow-lg shadow-blue-500/40 ring-1 ring-white/30 scale-105`
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={item.label}
              >
                <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-blue-400 group-hover:scale-110'}`}>
                  {renderMenuIcon(item.iconName, item.key, 'w-4 h-4')}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // 5. TOPBAR CLASSIC (DEFAULT)
  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 sm:p-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-zinc-800 shadow-sm dark:shadow-xl shadow-slate-200/50 dark:shadow-black/40 w-full mx-auto print:hidden animate-fade-in ring-1 ring-slate-900/5 dark:ring-white/10 select-none">
      {visibleItems.map(item => {
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.id || item.key}
            onClick={() => handleItemClick(item)}
            className={`group px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl text-[11px] lg:text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              isActive
                ? `bg-gradient-to-r ${themeClasses.primaryGradient} text-white font-bold shadow-md shadow-blue-500/25 ring-1 ring-white/30 scale-[1.02]`
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-zinc-800/80'
            }`}
            title={item.label}
          >
            <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400 group-hover:scale-110'}`}>
              {renderMenuIcon(item.iconName, item.key, 'w-4 h-4')}
            </span>
            <span>{item.label}</span>
            {item.badge && (
              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase ${
                isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
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
      })}
    </nav>
  );
};
