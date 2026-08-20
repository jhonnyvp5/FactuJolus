import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlatformCustomizationSettings } from '../types';
import {
  DEFAULT_PLATFORM_SETTINGS,
  loadPlatformSettings,
  savePlatformSettings,
} from '../lib/platformSettings';
import { modalAlert } from './ModalAlertContext';

interface PlatformSettingsContextType {
  settings: PlatformCustomizationSettings;
  updateSettings: (newSettingsOrUpdater: Partial<PlatformCustomizationSettings> | ((prev: PlatformCustomizationSettings) => Partial<PlatformCustomizationSettings> | PlatformCustomizationSettings)) => void;
  saveSettingsToCloud: (userEmail?: string) => Promise<{ success: boolean; message: string }>;
  resetToDefaults: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  getLabel: (key: string, fallback: string) => string;
  themeClasses: {
    primaryBg: string;
    primaryText: string;
    primaryBorder: string;
    primaryGradient: string;
    badgeBg: string;
    activeTabBg: string;
  };
}

const PlatformSettingsContext = createContext<PlatformSettingsContextType | null>(null);

export const THEME_COLOR_MAP: Record<string, {
  primaryBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryGradient: string;
  badgeBg: string;
  activeTabBg: string;
  hex: string;
}> = {
  blue: {
    primaryBg: 'bg-blue-600 hover:bg-blue-700',
    primaryText: 'text-blue-600 dark:text-blue-400',
    primaryBorder: 'border-blue-500',
    primaryGradient: 'from-blue-600 via-indigo-600 to-sky-500',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    activeTabBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold shadow-md shadow-blue-500/25',
    hex: '#2563eb'
  },
  indigo: {
    primaryBg: 'bg-indigo-600 hover:bg-indigo-700',
    primaryText: 'text-indigo-600 dark:text-indigo-400',
    primaryBorder: 'border-indigo-500',
    primaryGradient: 'from-indigo-600 via-purple-600 to-pink-500',
    badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300',
    activeTabBg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-bold shadow-md shadow-indigo-500/25',
    hex: '#4f46e5'
  },
  purple: {
    primaryBg: 'bg-purple-600 hover:bg-purple-700',
    primaryText: 'text-purple-600 dark:text-purple-400',
    primaryBorder: 'border-purple-500',
    primaryGradient: 'from-purple-600 via-fuchsia-600 to-indigo-500',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
    activeTabBg: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-500 text-white font-bold shadow-md shadow-purple-500/25',
    hex: '#9333ea'
  },
  emerald: {
    primaryBg: 'bg-emerald-600 hover:bg-emerald-700',
    primaryText: 'text-emerald-600 dark:text-emerald-400',
    primaryBorder: 'border-emerald-500',
    primaryGradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    activeTabBg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white font-bold shadow-md shadow-emerald-500/25',
    hex: '#059669'
  },
  teal: {
    primaryBg: 'bg-teal-600 hover:bg-teal-700',
    primaryText: 'text-teal-600 dark:text-teal-400',
    primaryBorder: 'border-teal-500',
    primaryGradient: 'from-teal-600 via-cyan-600 to-blue-500',
    badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
    activeTabBg: 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-500 text-white font-bold shadow-md shadow-teal-500/25',
    hex: '#0d9488'
  },
  rose: {
    primaryBg: 'bg-rose-600 hover:bg-rose-700',
    primaryText: 'text-rose-600 dark:text-rose-400',
    primaryBorder: 'border-rose-500',
    primaryGradient: 'from-rose-600 via-pink-600 to-purple-500',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    activeTabBg: 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-500 text-white font-bold shadow-md shadow-rose-500/25',
    hex: '#e11d48'
  },
  amber: {
    primaryBg: 'bg-amber-600 hover:bg-amber-700',
    primaryText: 'text-amber-600 dark:text-amber-400',
    primaryBorder: 'border-amber-500',
    primaryGradient: 'from-amber-600 via-orange-600 to-red-500',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    activeTabBg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-500 text-white font-bold shadow-md shadow-amber-500/25',
    hex: '#d97706'
  },
  cyan: {
    primaryBg: 'bg-cyan-600 hover:bg-cyan-700',
    primaryText: 'text-cyan-600 dark:text-cyan-400',
    primaryBorder: 'border-cyan-500',
    primaryGradient: 'from-cyan-600 via-blue-600 to-indigo-500',
    badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300',
    activeTabBg: 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-500 text-white font-bold shadow-md shadow-cyan-500/25',
    hex: '#0891b2'
  },
  slate: {
    primaryBg: 'bg-slate-800 hover:bg-slate-900',
    primaryText: 'text-slate-800 dark:text-slate-200',
    primaryBorder: 'border-slate-700',
    primaryGradient: 'from-slate-800 via-zinc-800 to-neutral-700',
    badgeBg: 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200',
    activeTabBg: 'bg-gradient-to-r from-slate-800 via-zinc-800 to-neutral-700 text-white font-bold shadow-md shadow-black/20',
    hex: '#1e293b'
  },
  custom: {
    primaryBg: 'bg-blue-600 hover:bg-blue-700',
    primaryText: 'text-blue-600 dark:text-blue-400',
    primaryBorder: 'border-blue-500',
    primaryGradient: 'from-blue-600 via-indigo-600 to-sky-500',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    activeTabBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold shadow-md shadow-blue-500/25',
    hex: '#2563eb'
  }
};

export function PlatformSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformCustomizationSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadPlatformSettings().then(loaded => {
      if (isMounted) {
        setSettings(loaded);
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Sync document title and favicon
  useEffect(() => {
    if (settings.platformName) {
      document.title = `${settings.platformName} • ${settings.platformTagline || 'Facturación SRI'}`;
    }
    if (settings.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings.platformName, settings.platformTagline, settings.faviconUrl]);

  // Inject Dynamic Color Variables
  useEffect(() => {
    const primaryHex = settings.primaryColorName === 'custom' || settings.enableCustomColorPalette
      ? settings.customPrimaryHex || '#2563eb'
      : (THEME_COLOR_MAP[settings.primaryColorName]?.hex || '#2563eb');
    
    const secondaryHex = settings.customSecondaryHex || '#4f46e5';
    const buttonHex = settings.customButtonColorHex || primaryHex;
    const buttonTextHex = settings.customButtonTextColorHex || '#ffffff';
    const navbarBg = settings.customNavbarBgHex || '#ffffff';
    const sidebarBg = settings.customSidebarBgHex || '#0f172a';

    const radiusMap: Record<string, string> = {
      none: '0px',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      '2xl': '1.25rem',
      full: '9999px'
    };
    const borderRadius = radiusMap[settings.buttonBorderRadius || settings.borderRadiusStyle || 'xl'] || '0.75rem';

    let styleEl = document.getElementById('sri-platform-dynamic-colors-style') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'sri-platform-dynamic-colors-style';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --color-brand-primary: ${primaryHex};
        --color-brand-secondary: ${secondaryHex};
        --color-brand-button: ${buttonHex};
        --color-brand-button-text: ${buttonTextHex};
        --color-brand-navbar: ${navbarBg};
        --color-brand-sidebar: ${sidebarBg};
        --radius-brand: ${borderRadius};
      }
      ${settings.enableCustomColorPalette ? `
        .bg-blue-600, .bg-indigo-600 {
          background-color: ${primaryHex} !important;
        }
        .text-blue-600, .text-indigo-600 {
          color: ${primaryHex} !important;
        }
        .border-blue-500, .border-indigo-500 {
          border-color: ${primaryHex} !important;
        }
      ` : ''}
    `;
  }, [
    settings.primaryColorName,
    settings.customPrimaryHex,
    settings.customSecondaryHex,
    settings.customButtonColorHex,
    settings.customButtonTextColorHex,
    settings.customNavbarBgHex,
    settings.customSidebarBgHex,
    settings.buttonBorderRadius,
    settings.borderRadiusStyle,
    settings.enableCustomColorPalette
  ]);

  const getLabel = (key: string, fallback: string): string => {
    return settings.textOverrides?.[key] || fallback;
  };

  const updateSettings = (newSettingsOrUpdater: Partial<PlatformCustomizationSettings> | ((prev: PlatformCustomizationSettings) => Partial<PlatformCustomizationSettings> | PlatformCustomizationSettings)) => {
    setSettings(prev => {
      const result = typeof newSettingsOrUpdater === 'function' ? newSettingsOrUpdater(prev) : newSettingsOrUpdater;
      const next = { ...prev, ...result };
      // Instant local persistence for live responsive UI
      localStorage.setItem('sri_platform_custom_settings', JSON.stringify(next));
      return next;
    });
  };

  const saveSettingsToCloud = async (userEmail?: string) => {
    setIsSaving(true);
    try {
      const res = await savePlatformSettings(settings, userEmail);
      if (res.success) {
        modalAlert.success('Diseño y Configuración Guardados', 'Los cambios en colores, logotipos, banners, noticias, planes y componentes se han aplicado y sincronizado exitosamente.');
      } else {
        modalAlert.warning('Aviso de Guardado', res.message);
      }
      return res;
    } catch (err: any) {
      modalAlert.error('Error al Guardar', err.message || 'No se pudo guardar la configuración');
      return { success: false, message: err.message };
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    const confirmed = window.confirm('¿Está seguro de restaurar el diseño, colores, noticias y planes a los valores predeterminados de fábrica?');
    if (!confirmed) return;

    setSettings(DEFAULT_PLATFORM_SETTINGS);
    await savePlatformSettings(DEFAULT_PLATFORM_SETTINGS);
    modalAlert.info('Valores Restaurados', 'Se ha restablecido el diseño y configuración original de la plataforma.');
  };

  const selectedTheme = settings.primaryColorName === 'custom' || settings.enableCustomColorPalette ? {
    primaryBg: `bg-blue-600 hover:bg-blue-700`,
    primaryText: `text-blue-600 dark:text-blue-400`,
    primaryBorder: `border-blue-500`,
    primaryGradient: `from-blue-600 via-indigo-600 to-sky-500`,
    badgeBg: `bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300`,
    activeTabBg: `bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white font-bold shadow-md shadow-blue-500/25`,
    hex: settings.customPrimaryHex || '#2563eb'
  } : (THEME_COLOR_MAP[settings.primaryColorName] || THEME_COLOR_MAP.blue);

  return (
    <PlatformSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        saveSettingsToCloud,
        resetToDefaults,
        isLoading,
        isSaving,
        getLabel,
        themeClasses: selectedTheme,
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const context = useContext(PlatformSettingsContext);
  if (!context) {
    throw new Error('usePlatformSettings must be used within a PlatformSettingsProvider');
  }
  return context;
}
