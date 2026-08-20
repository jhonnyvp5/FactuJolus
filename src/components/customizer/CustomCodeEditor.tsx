import React, { useState } from 'react';
import {
  Code,
  FileCode,
  Sparkles,
  Play,
  Check,
  RotateCcw,
  Copy,
  Info,
  Layers,
  Terminal
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { modalAlert } from '../../context/ModalAlertContext';

const CODE_PRESETS = [
  {
    title: 'Scrollbar Neumórfico & Moderno',
    description: 'Estiliza la barra de desplazamiento de toda la aplicación.',
    css: `/* Scrollbar Elegante */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.5);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.8);
}`
  },
  {
    title: 'Tarjetas con Efecto Brillo (Glow)',
    description: 'Añade sombras luminosas sutiles a las tarjetas interactivas.',
    css: `/* Glow Effect para Tarjetas */
.sri-glow-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.sri-glow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -10px rgba(59, 130, 246, 0.3);
}`
  },
  {
    title: 'Animación de Gradiente Suave',
    description: 'Crea fondos con animación infinita de degradados suaves.',
    css: `/* Animación de Fondo Gradiente */
@keyframes sriGradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animated-bg {
  background-size: 200% 200%;
  animation: sriGradientFlow 8s ease infinite;
}`
  }
];

export default function CustomCodeEditor() {
  const { settings, updateSettings } = usePlatformSettings();
  const [activeTab, setActiveTab] = useState<'css' | 'head' | 'footer'>('css');

  const handleApplyPreset = (css: string) => {
    const currentCss = settings.customCss || '';
    const newCss = currentCss ? `${currentCss}\n\n${css}` : css;
    updateSettings({ customCss: newCss });
    modalAlert.success('Snippet Aplicado', 'Se ha agregado el código CSS a tus estilos personalizados.');
  };

  const handleClear = () => {
    modalAlert.confirm(
      '¿Limpiar Código?',
      '¿Estás seguro de que deseas vaciar este bloque de código?',
      () => {
        if (activeTab === 'css') updateSettings({ customCss: '' });
        if (activeTab === 'head') updateSettings({ customHeadHtml: '' });
        if (activeTab === 'footer') updateSettings({ customFooterHtml: '' });
        modalAlert.info('Código Limpiado', 'El campo ha sido vaciado.');
      }
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              <span>DESARROLLO AVANZADO & INYECCIÓN DE CÓDIGO</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Editor de Código Personalizado (CSS / HTML / Scripts)
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Personaliza con precisión quirúrgica cualquier aspecto visual, fuentes, animaciones y widgets embebidos.
            </p>
          </div>

          {/* CODE TAB SELECTOR */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('css')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'css'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>CSS Global</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('head')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'head'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>&lt;head&gt; Scripts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('footer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'footer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Footer / Widgets</span>
            </button>
          </div>
        </div>

        {/* EDITOR AREA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {activeTab === 'css' && 'styles.custom.css (Inyectado en tiempo real)'}
              {activeTab === 'head' && 'head.scripts.html (Meta tags, fuentes Google Fonts, Analytics)'}
              {activeTab === 'footer' && 'footer.widgets.html (Chatbots, tracking scripts, widgets externos)'}
            </span>

            <button
              type="button"
              onClick={handleClear}
              className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
            >
              Limpiar Bloque
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-mono text-slate-400 ml-2">
                  {activeTab === 'css' ? 'custom-styles.css' : 'custom-code.html'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                ● En vivo
              </span>
            </div>

            {activeTab === 'css' && (
              <textarea
                rows={12}
                value={settings.customCss || ''}
                onChange={(e) => updateSettings({ customCss: e.target.value })}
                placeholder={`/* Escribe tus reglas CSS aquí */\n:root {\n  --custom-accent: #3b82f6;\n}\n\n.my-custom-box {\n  border-radius: 1rem;\n}`}
                className="w-full p-4 bg-transparent text-emerald-300 font-mono text-xs focus:outline-none leading-relaxed resize-y"
              />
            )}

            {activeTab === 'head' && (
              <textarea
                rows={12}
                value={settings.customHeadHtml || ''}
                onChange={(e) => updateSettings({ customHeadHtml: e.target.value })}
                placeholder={`<!-- Scripts para el <head> -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<!-- Meta tags adicionales -->`}
                className="w-full p-4 bg-transparent text-cyan-300 font-mono text-xs focus:outline-none leading-relaxed resize-y"
              />
            )}

            {activeTab === 'footer' && (
              <textarea
                rows={12}
                value={settings.customFooterHtml || ''}
                onChange={(e) => updateSettings({ customFooterHtml: e.target.value })}
                placeholder={`<!-- Widgets o scripts de pie de página -->\n<!-- Chat de atención al cliente, analytics, etc. -->`}
                className="w-full p-4 bg-transparent text-amber-300 font-mono text-xs focus:outline-none leading-relaxed resize-y"
              />
            )}
          </div>
        </div>

        {/* PRESET SNIPPETS */}
        {activeTab === 'css' && (
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
              Snippets y Efectos Rápidos (Clic para insertar):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CODE_PRESETS.map((preset, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {preset.title}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset.css)}
                    className="w-full py-1.5 px-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Insertar Snippet</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
