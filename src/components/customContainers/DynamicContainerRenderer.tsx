import React from 'react';
import {
  FileText,
  ShieldCheck,
  Users,
  Coins,
  Receipt,
  FileSpreadsheet,
  PlusCircle,
  Package,
  Sparkles,
  ArrowRight,
  Zap,
  CreditCard,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { CustomContainerWidget } from '../../types';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';

const ICON_MAP: Record<string, any> = {
  FileText,
  ShieldCheck,
  Users,
  Coins,
  Receipt,
  FileSpreadsheet,
  PlusCircle,
  Package,
  Sparkles,
  Zap,
  CreditCard,
  Building2
};

interface DynamicContainerRendererProps {
  location: 'dashboard' | 'login';
  onNavigateTab?: (tab: string) => void;
  onOpenPlansModal?: () => void;
}

export default function DynamicContainerRenderer({
  location,
  onNavigateTab,
  onOpenPlansModal
}: DynamicContainerRendererProps) {
  const { settings } = usePlatformSettings();
  const containers = (settings.customContainers || []).filter(c => {
    if (c.visible === false) return false;
    if (location === 'dashboard' && c.showInDashboard !== false) return true;
    if (location === 'login' && c.showInLogin === true) return true;
    return false;
  });

  if (containers.length === 0) return null;

  // Helper for column span class
  const getColSpanClass = (span?: string) => {
    switch (span) {
      case 'col-3': return 'col-span-12 md:col-span-6 lg:col-span-3';
      case 'col-4': return 'col-span-12 md:col-span-6 lg:col-span-4';
      case 'col-6': return 'col-span-12 lg:col-span-6';
      case 'col-8': return 'col-span-12 lg:col-span-8';
      case 'col-12':
      default:
        return 'col-span-12';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 w-full mb-6">
      {containers.map((container) => {
        const colClass = getColSpanClass(container.columnSpan);

        return (
          <div key={container.id} className={colClass}>
            
            {/* 1. HERO BANNER */}
            {container.type === 'hero-banner' && (
              <div
                className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl ${
                  container.style?.bgType === 'gradient'
                    ? (container.style?.gradient ? `bg-gradient-to-r ${container.style.gradient}` : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900')
                    : 'bg-slate-900'
                }`}
              >
                <div className="relative z-10 max-w-2xl space-y-4">
                  {container.content?.heroBadge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{container.content.heroBadge}</span>
                    </div>
                  )}

                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    {container.content?.heroTitle || 'Facturación Electrónica SRI'}
                  </h2>

                  {container.content?.heroSubtitle && (
                    <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                      {container.content.heroSubtitle}
                    </p>
                  )}

                  {container.content?.heroButtonText && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = container.content?.heroButtonUrl;
                          if (url?.startsWith('#') && onNavigateTab) {
                            onNavigateTab(url.replace('#', ''));
                          } else if (url?.startsWith('http')) {
                            window.open(url, '_blank');
                          } else if (onNavigateTab) {
                            onNavigateTab('new-invoice');
                          }
                        }}
                        className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-lg hover:bg-slate-100 transition active:scale-95 flex items-center gap-2 cursor-pointer"
                      >
                        <span>{container.content.heroButtonText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Decorative background ambient glow */}
                <div className="absolute right-0 bottom-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              </div>
            )}

            {/* 2. STAT METRICS */}
            {container.type === 'stat-metrics' && (
              <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                {container.title && (
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {container.title}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(container.content?.metrics || []).map((m) => {
                    const IconComp = ICON_MAP[m.iconName || 'FileText'] || FileText;

                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                            {m.label}
                          </span>
                          <div
                            className="p-2 rounded-xl"
                            style={{ backgroundColor: `${m.color || '#3b82f6'}15`, color: m.color || '#3b82f6' }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                        </div>

                        <div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {m.value}
                          </div>
                          {m.trend && (
                            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {m.trend}
                            </div>
                          )}
                          {m.subtext && (
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {m.subtext}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. CUSTOM HTML CODE BLOCK */}
            {container.type === 'custom-html-code' && (
              <div
                className="rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm"
                dangerouslySetInnerHTML={{ __html: container.content?.htmlCode || '' }}
              />
            )}

            {/* 4. QUICK ACTIONS */}
            {container.type === 'quick-actions' && (
              <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                {container.title && (
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>{container.title}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(container.content?.quickActions || []).map((qa) => {
                    const IconComp = ICON_MAP[qa.iconName || 'PlusCircle'] || PlusCircle;

                    return (
                      <button
                        key={qa.id}
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab(qa.actionTab)}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 transition cursor-pointer flex flex-col items-center text-center gap-2 group"
                      >
                        <div
                          className="p-3 rounded-2xl transition group-hover:scale-110"
                          style={{ backgroundColor: `${qa.color || '#2563eb'}15`, color: qa.color || '#2563eb' }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                          {qa.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. EMBEDDED PLANS CATALOG */}
            {container.type === 'plans-catalog' && (
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>PLANES SRI 2026</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">
                    {container.content?.heroTitle || 'Planes de Facturación Electrónica'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    {container.content?.heroSubtitle || 'Comprueba nuestros paquetes con firma digital y soporte 24/7.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenPlansModal}
                  className="px-6 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-slate-100 font-black text-xs shadow-lg transition active:scale-95 shrink-0 cursor-pointer"
                >
                  Ver Todos los Planes
                </button>
              </div>
            )}

            {/* 6. IFRAME EMBED */}
            {container.type === 'iframe-embed' && container.content?.iframeUrl && (
              <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                {container.title && (
                  <div className="p-3 bg-slate-50 dark:bg-zinc-800 font-bold text-xs text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-700">
                    {container.title}
                  </div>
                )}
                <iframe
                  src={container.content.iframeUrl}
                  style={{ height: `${container.content.iframeHeight || 400}px` }}
                  className="w-full border-0"
                  title={container.title}
                />
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
