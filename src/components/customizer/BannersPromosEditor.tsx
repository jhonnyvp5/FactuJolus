import React from 'react';
import { Megaphone, Zap } from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';

export const BannersPromosEditor: React.FC = () => {
  const { settings, updateSettings } = usePlatformSettings();

  return (
    <div className="space-y-6">
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Barra Superior de Anuncios (Top Announcement Bar)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Mensaje flotante visible en la parte superior para avisos tributarios importantes o comunicados.
              </p>
            </div>
          </div>

          {/* TOGGLE SWITCH */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.topBanner.enabled}
              onChange={(e) => updateSettings({
                topBanner: { ...settings.topBanner, enabled: e.target.checked }
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            <span className="ml-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
              {settings.topBanner.enabled ? 'Activado' : 'Desactivado'}
            </span>
          </label>
        </div>

        {settings.topBanner.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Texto del Badge / Etiqueta
              </label>
              <input
                type="text"
                value={settings.topBanner.badgeText}
                onChange={(e) => updateSettings({
                  topBanner: { ...settings.topBanner, badgeText: e.target.value }
                })}
                placeholder="Ej: NOVEDAD SRI"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Mensaje del Anuncio
              </label>
              <input
                type="text"
                value={settings.topBanner.message}
                onChange={(e) => updateSettings({
                  topBanner: { ...settings.topBanner, message: e.target.value }
                })}
                placeholder="Ej: Sistema actualizado con esquema XAdES-BES 2.1..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Texto del Enlace (Opcional)
              </label>
              <input
                type="text"
                value={settings.topBanner.linkText || ''}
                onChange={(e) => updateSettings({
                  topBanner: { ...settings.topBanner, linkText: e.target.value }
                })}
                placeholder="Ej: Ver Noticias SRI"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                URL del Enlace (Opcional)
              </label>
              <input
                type="text"
                value={settings.topBanner.linkUrl || ''}
                onChange={(e) => updateSettings({
                  topBanner: { ...settings.topBanner, linkUrl: e.target.value }
                })}
                placeholder="Ej: https://sri.gob.ec o #news"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.topBanner.isDismissible}
                  onChange={(e) => updateSettings({
                    topBanner: { ...settings.topBanner, isDismissible: e.target.checked }
                  })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Permitir al usuario cerrar el banner (X)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* PROMOTIONAL / DISCOUNT BANNER */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Banner Promocional de Planes & Ofertas
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Banner destacado para promocionar suscripciones anuales, descuentos y novedades.
              </p>
            </div>
          </div>

          {/* TOGGLE SWITCH */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.promoBanner.enabled}
              onChange={(e) => updateSettings({
                promoBanner: { ...settings.promoBanner, enabled: e.target.checked }
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
              {settings.promoBanner.enabled ? 'Activado' : 'Desactivado'}
            </span>
          </label>
        </div>

        {settings.promoBanner.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Título Promocional
              </label>
              <input
                type="text"
                value={settings.promoBanner.title}
                onChange={(e) => updateSettings({
                  promoBanner: { ...settings.promoBanner, title: e.target.value }
                })}
                placeholder="Ej: ¡Potencia tu negocio con facturación ilimitada!"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Etiqueta de Descuento
              </label>
              <input
                type="text"
                value={settings.promoBanner.discountText || ''}
                onChange={(e) => updateSettings({
                  promoBanner: { ...settings.promoBanner, discountText: e.target.value }
                })}
                placeholder="Ej: 30% OFF en Plan Anual"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Subtítulo / Descripción
              </label>
              <textarea
                rows={2}
                value={settings.promoBanner.subtitle}
                onChange={(e) => updateSettings({
                  promoBanner: { ...settings.promoBanner, subtitle: e.target.value }
                })}
                placeholder="Ej: Activa tu plan corporativo con soporte preferencial..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Texto del Botón
              </label>
              <input
                type="text"
                value={settings.promoBanner.buttonText}
                onChange={(e) => updateSettings({
                  promoBanner: { ...settings.promoBanner, buttonText: e.target.value }
                })}
                placeholder="Ej: Ver Planes Disponibles"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Gradiente Visual
              </label>
              <select
                value={settings.promoBanner.gradientTheme}
                onChange={(e) => updateSettings({
                  promoBanner: { ...settings.promoBanner, gradientTheme: e.target.value as any }
                })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold"
              >
                <option value="blue-indigo">Azul & Índigo</option>
                <option value="purple-indigo">Púrpura & Violeta</option>
                <option value="emerald-teal">Esmeralda & Turquesa</option>
                <option value="amber-orange">Ámbar & Dorado</option>
                <option value="cyber-dark">Cyber Dark</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
