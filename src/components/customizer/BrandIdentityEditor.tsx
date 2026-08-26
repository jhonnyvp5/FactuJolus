import React from 'react';
import { Image as ImageIcon, Upload, FileCode, ShieldCheck } from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { modalAlert } from '../../context/ModalAlertContext';

export const BrandIdentityEditor: React.FC = () => {
  const { settings, updateSettings } = usePlatformSettings();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        modalAlert.warning('Tamaño Excedido', 'El archivo de imagen no debe superar los 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        updateSettings({ logoUrl: reader.result as string });
        modalAlert.success('Logotipo Actualizado', 'Logotipo cargado exitosamente.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateSettings({ faviconUrl: reader.result as string });
        modalAlert.success('Favicon Actualizado', 'Favicon cargado exitosamente.');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
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
                    type="button"
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
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
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
  );
};
