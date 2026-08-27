import React from 'react';
import { Layers } from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';

export const GlobalModulesToggles: React.FC = () => {
  const { settings, updateSettings } = usePlatformSettings();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Interruptores de Visibilidad de Componentes</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Enciende o apaga componentes y botones en las distintas pantallas de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { key: 'showSriNewsInLogin', label: 'Mostrar Widget de Noticias en la Pantalla de Login', desc: 'Permite a los visitantes ver las noticias y resoluciones SRI actualizadas.' },
          { key: 'showPlansInLogin', label: 'Mostrar Botón de "Planes de Facturación" en Login', desc: 'Abre el modal interactivo con los planes y precios para nuevos clientes.' },
          { key: 'showPlansInApp', label: 'Mostrar Botón de "Planes" en el Menú Superior para Inquilinos', desc: 'Permite a los usuarios consultar mejoras de plan dentro de la plataforma.' },
          { key: 'showTopAnnouncementBar', label: 'Mostrar Barra de Anuncio Superior', desc: 'Muestra la barra superior fija con el mensaje oficial configurado.' },
          { key: 'showPromotionalBanner', label: 'Mostrar Banner Promocional de Descuentos', desc: 'Habilita el banner con ofertas en el área de trabajo.' },
          { key: 'showSocialLinksInFooter', label: 'Mostrar Enlaces de Redes Sociales en el Pie de Página', desc: 'Iconos directos a WhatsApp, Instagram, Facebook y soporte.' },
          { key: 'showSocialLinksInLogin', label: 'Mostrar Enlaces de Redes Sociales en la Pantalla de Login', desc: 'Acceso directo a canales de contacto antes de iniciar sesión.' },
          { key: 'showSimulatorIndicator', label: 'Mostrar Indicador de Conexión SRI / Modo Simulador', desc: 'Insignia de estado verde/azul en el encabezado.' },
          { key: 'showDemoButtons', label: 'Habilitar Botones de Carga de Datos Demo (Demostraciones)', desc: 'Muestra u oculta los botones para cargar clientes, productos y proformas de prueba con un solo clic.' },
        ].map(moduleItem => (
          <div
            key={moduleItem.key}
            className="p-4 bg-slate-50 dark:bg-zinc-850 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {moduleItem.label}
              </h4>
              <p className="text-[11px] text-slate-400">
                {moduleItem.desc}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={(settings.modules as any)[moduleItem.key] ?? (moduleItem.key === 'showDemoButtons' ? false : true)}
                onChange={(e) => updateSettings({
                  modules: { ...settings.modules, [moduleItem.key]: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
