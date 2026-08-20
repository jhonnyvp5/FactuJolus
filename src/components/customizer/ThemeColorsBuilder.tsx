import React from 'react';
import {
  Palette,
  Sparkles,
  Sliders,
  Check,
  Paintbrush,
  Sun,
  Moon,
  Layers,
  Layout,
  MousePointer,
  RotateCcw
} from 'lucide-react';
import { usePlatformSettings, THEME_COLOR_MAP } from '../../context/PlatformSettingsContext';
import { modalAlert } from '../../context/ModalAlertContext';

const COLOR_PRESETS = [
  { id: 'blue', label: 'Azul SRI Oficial', primary: '#2563eb', secondary: '#4f46e5', desc: 'Estándar corporativo, sobrio y profesional' },
  { id: 'indigo', label: 'Índigo Moderno', primary: '#4f46e5', secondary: '#7c3aed', desc: 'Diseño SaaS vanguardista' },
  { id: 'purple', label: 'Púrpura Fintech', primary: '#9333ea', secondary: '#c026d3', desc: 'Atractivo, premium y distintivo' },
  { id: 'emerald', label: 'Esmeralda / Finanzas', primary: '#059669', secondary: '#0d9488', desc: 'Asociado a contabilidad, crecimiento y dinero' },
  { id: 'teal', label: 'Verde Azulado / Teal', primary: '#0d9488', secondary: '#0284c7', desc: 'Elegante, tecnológico y limpio' },
  { id: 'rose', label: 'Rosa & Carmín', primary: '#e11d48', secondary: '#db2777', desc: 'Dinámico y moderno' },
  { id: 'amber', label: 'Ámbar & Dorado', primary: '#d97706', secondary: '#ea580c', desc: 'Cálido y energético' },
  { id: 'cyan', label: 'Cian Neón / Cyber', primary: '#0891b2', secondary: '#2563eb', desc: 'Alta tecnología e innovación' },
  { id: 'slate', label: 'Gris Grafito / Slate', primary: '#475569', secondary: '#0f172a', desc: 'Minimalismo y elegancia sobria' },
];

const GRADIENT_OPTIONS = [
  { id: 'blue-indigo', label: 'Azul a Índigo', class: 'from-blue-600 via-indigo-600 to-sky-500' },
  { id: 'purple-indigo', label: 'Púrpura a Índigo', class: 'from-purple-600 via-fuchsia-600 to-indigo-500' },
  { id: 'emerald-teal', label: 'Esmeralda a Teal', class: 'from-emerald-600 via-teal-600 to-cyan-500' },
  { id: 'amber-orange', label: 'Ámbar a Naranja', class: 'from-amber-500 via-orange-500 to-rose-500' },
  { id: 'rose-pink', label: 'Rosa a Carmín', class: 'from-rose-500 via-pink-600 to-purple-500' },
  { id: 'cyber-dark', label: 'Grafito Dark', class: 'from-slate-800 via-zinc-900 to-black' },
];

const BORDER_RADIUS_OPTIONS = [
  { id: 'none', label: 'Recto (0px)', preview: 'rounded-none' },
  { id: 'sm', label: 'Mínimo (4px)', preview: 'rounded-sm' },
  { id: 'md', label: 'Medio (8px)', preview: 'rounded-md' },
  { id: 'lg', label: 'Grande (12px)', preview: 'rounded-lg' },
  { id: 'xl', label: 'Moderno (16px)', preview: 'rounded-2xl' },
  { id: '2xl', label: 'Extra Curvo (20px)', preview: 'rounded-3xl' },
  { id: 'full', label: 'Píldora (Redondo)', preview: 'rounded-full' },
];

export function ThemeColorsBuilder() {
  const { settings, updateSettings } = usePlatformSettings();

  const handleSelectPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateSettings({
      primaryColorName: preset.id as any,
      customPrimaryHex: preset.primary,
      customSecondaryHex: preset.secondary,
      customButtonColorHex: preset.primary,
      enableCustomColorPalette: false,
    });
    modalAlert.success('Tema Aplicado', `Se ha aplicado la paleta "${preset.label}".`);
  };

  const handleCustomPrimaryChange = (hex: string) => {
    updateSettings({
      customPrimaryHex: hex,
      customButtonColorHex: hex,
      primaryColorName: 'custom',
      enableCustomColorPalette: true,
    });
  };

  const handleResetColors = () => {
    updateSettings({
      primaryColorName: 'blue',
      customPrimaryHex: '#2563eb',
      customSecondaryHex: '#4f46e5',
      customNavbarBgHex: '#ffffff',
      customSidebarBgHex: '#0f172a',
      customCardBgHex: '#ffffff',
      customTextColorHex: '#0f172a',
      customButtonColorHex: '#2563eb',
      customButtonTextColorHex: '#ffffff',
      buttonBorderRadius: 'xl',
      enableCustomColorPalette: false,
      accentGradient: 'blue-indigo',
      headerStyle: 'modern-white',
      borderRadiusStyle: 'xl',
    });
    modalAlert.info('Colores Restaurados', 'Se han restablecido los colores por defecto.');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider">
            <Palette className="w-3.5 h-3.5" />
            <span>Colores, Paletas & Estilo Global</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Personalizador de Colores y Apariencia
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Cambia los colores primarios, secundarios, botones, barras de navegación y bordes de toda la plataforma en tiempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetColors}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Colores</span>
        </button>
      </div>

      {/* Preset Color Palettes */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Paletas de Color Prediseñadas
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Selecciona una paleta equilibrada con un solo clic
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = settings.primaryColorName === preset.id && !settings.enableCustomColorPalette;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center -space-x-2">
                    <span
                      className="w-7 h-7 rounded-full shadow-md shrink-0 border-2 border-white dark:border-zinc-900"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-6 h-6 rounded-full shadow-sm shrink-0 border-2 border-white dark:border-zinc-900"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {preset.desc}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Custom Color HEX Pickers */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Personalizador de Colores Específicos (HEX)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Define los códigos de color exactos para cada elemento de la interfaz
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
            <span>Habilitar Modo Color Personalizado</span>
            <input
              type="checkbox"
              checked={settings.enableCustomColorPalette ?? false}
              onChange={(e) => updateSettings({ enableCustomColorPalette: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Primary Color */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 space-y-2">
            <label className="block font-bold text-slate-900 dark:text-white">
              Color Primario (Marca)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.customPrimaryHex || '#2563eb'}
                onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={settings.customPrimaryHex || '#2563eb'}
                onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono uppercase font-bold"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 space-y-2">
            <label className="block font-bold text-slate-900 dark:text-white">
              Color Secundario / Acento
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.customSecondaryHex || '#4f46e5'}
                onChange={(e) => updateSettings({ customSecondaryHex: e.target.value, enableCustomColorPalette: true })}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={settings.customSecondaryHex || '#4f46e5'}
                onChange={(e) => updateSettings({ customSecondaryHex: e.target.value, enableCustomColorPalette: true })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono uppercase font-bold"
              />
            </div>
          </div>

          {/* Button Color */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 space-y-2">
            <label className="block font-bold text-slate-900 dark:text-white">
              Color de Botones de Acción
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.customButtonColorHex || settings.customPrimaryHex || '#2563eb'}
                onChange={(e) => updateSettings({ customButtonColorHex: e.target.value, enableCustomColorPalette: true })}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={settings.customButtonColorHex || settings.customPrimaryHex || '#2563eb'}
                onChange={(e) => updateSettings({ customButtonColorHex: e.target.value, enableCustomColorPalette: true })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono uppercase font-bold"
              />
            </div>
          </div>

          {/* Button Text Color */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 space-y-2">
            <label className="block font-bold text-slate-900 dark:text-white">
              Texto de Botones
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.customButtonTextColorHex || '#ffffff'}
                onChange={(e) => updateSettings({ customButtonTextColorHex: e.target.value, enableCustomColorPalette: true })}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={settings.customButtonTextColorHex || '#ffffff'}
                onChange={(e) => updateSettings({ customButtonTextColorHex: e.target.value, enableCustomColorPalette: true })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono uppercase font-bold"
              />
            </div>
          </div>
        </div>

        {/* Button Radius Selector */}
        <div className="space-y-3 pt-2">
          <label className="block font-bold text-xs text-slate-900 dark:text-white">
            Curvatura / Radio de Bordes de Botones y Tarjetas
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {BORDER_RADIUS_OPTIONS.map((rad) => {
              const isSelected = (settings.buttonBorderRadius || settings.borderRadiusStyle || 'xl') === rad.id;
              return (
                <button
                  key={rad.id}
                  type="button"
                  onClick={() => updateSettings({ buttonBorderRadius: rad.id as any, borderRadiusStyle: rad.id as any })}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-xs font-bold">{rad.label}</div>
                  <div className={`mt-2 h-4 w-full bg-blue-600 ${rad.preview} mx-auto opacity-70`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
