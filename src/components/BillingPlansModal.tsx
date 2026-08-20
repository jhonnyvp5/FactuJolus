import React, { useState } from 'react';
import {
  CreditCard,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  MessageCircle,
  ShieldCheck,
  Building2,
  ArrowRight,
  ExternalLink,
  Tag,
  Star
} from 'lucide-react';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { BillingPlanItem } from '../types';

interface BillingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_SCHEME_STYLES: Record<string, {
  border: string;
  badge: string;
  button: string;
  price: string;
  ring: string;
  accentBg: string;
}> = {
  blue: {
    border: 'border-blue-500',
    badge: 'bg-blue-600 text-white',
    button: 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 shadow-blue-500/25',
    price: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-2 ring-blue-500/20',
    accentBg: 'from-blue-50/50 to-white dark:from-blue-950/20 dark:to-zinc-850',
  },
  indigo: {
    border: 'border-indigo-500',
    badge: 'bg-indigo-600 text-white',
    button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25',
    price: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-2 ring-indigo-500/20',
    accentBg: 'from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-850',
  },
  purple: {
    border: 'border-purple-500',
    badge: 'bg-purple-600 text-white',
    button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/25',
    price: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-2 ring-purple-500/20',
    accentBg: 'from-purple-50/50 to-white dark:from-purple-950/20 dark:to-zinc-850',
  },
  emerald: {
    border: 'border-emerald-500',
    badge: 'bg-emerald-600 text-white',
    button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25',
    price: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-2 ring-emerald-500/20',
    accentBg: 'from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-zinc-850',
  },
  amber: {
    border: 'border-amber-500',
    badge: 'bg-amber-600 text-white',
    button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/25',
    price: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-2 ring-amber-500/20',
    accentBg: 'from-amber-50/50 to-white dark:from-amber-950/20 dark:to-zinc-850',
  },
  rose: {
    border: 'border-rose-500',
    badge: 'bg-rose-600 text-white',
    button: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/25',
    price: 'text-rose-600 dark:text-rose-400',
    ring: 'ring-2 ring-rose-500/20',
    accentBg: 'from-rose-50/50 to-white dark:from-rose-950/20 dark:to-zinc-850',
  },
};

export default function BillingPlansModal({ isOpen, onClose }: BillingPlansModalProps) {
  const { settings } = usePlatformSettings();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  if (!isOpen) return null;

  const activePlans = (settings.billingPlans || []).filter(p => p.active !== false);
  const planCount = activePlans.length;

  // Dynamic grid column setup based on number of active plans
  let gridColsClass = 'grid-cols-1 md:grid-cols-3';
  let modalMaxWidthClass = 'max-w-5xl';

  if (planCount === 1) {
    gridColsClass = 'grid-cols-1 max-w-md mx-auto';
    modalMaxWidthClass = 'max-w-2xl';
  } else if (planCount === 2) {
    gridColsClass = 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto';
    modalMaxWidthClass = 'max-w-4xl';
  } else if (planCount === 3) {
    gridColsClass = 'grid-cols-1 md:grid-cols-3';
    modalMaxWidthClass = 'max-w-5xl';
  } else if (planCount === 4) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    modalMaxWidthClass = 'max-w-7xl';
  } else if (planCount >= 5) {
    gridColsClass = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    modalMaxWidthClass = 'max-w-[96vw]';
  }

  const handleContractPlan = (plan: BillingPlanItem) => {
    const priceText = billingCycle === 'yearly' ? `$${plan.priceYearly}/año` : `$${plan.priceMonthly}/mes`;
    const defaultMsg = encodeURIComponent(
      plan.whatsappMessage ||
      `Hola, deseo contratar el "${plan.name}" (${priceText}) de Facturación Electrónica SRI.`
    );
    const whatsappBase = settings.socialLinks?.whatsapp || 'https://wa.me/593995831920';
    const cleanUrl = whatsappBase.includes('?') ? `${whatsappBase}&text=${defaultMsg}` : `${whatsappBase}?text=${defaultMsg}`;
    window.open(cleanUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full ${modalMaxWidthClass} bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden max-h-[92vh] flex flex-col transition-all duration-300`}>
        
        {/* TOP MODAL HEADER */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shrink-0 overflow-hidden border-b border-indigo-900/40">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer z-10"
            aria-label="Cerrar catálogo"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-2 max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>PLANES DE FACTURACIÓN ELECTRÓNICA SRI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {settings.plansCatalogHeading || 'Elige el Plan Perfecto para tu Negocio'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {settings.plansCatalogSubheading || 'Emisión instantánea con firma XAdES-BES, catálogo de clientes, productos y autorización automática con el SRI de Ecuador.'}
            </p>
          </div>

          {/* BILLING CYCLE SELECTOR */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 relative z-10 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-slate-950/80 rounded-2xl border border-slate-700/80 flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Facturación Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Facturación Anual</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                    {settings.plansAnnualDiscountText || 'AHORRA 25%'}
                  </span>
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{planCount} {planCount === 1 ? 'plan disponible' : 'planes disponibles'} • Activación Inmediata</span>
            </div>
          </div>
        </div>

        {/* MODAL BODY WITH ADAPTIVE PLANS GRID */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-zinc-950/50">
          {planCount === 0 ? (
            <div className="text-center py-16 space-y-3 bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-200 dark:border-zinc-800">
              <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No hay planes activos disponibles</h3>
              <p className="text-xs text-slate-500">Configura y activa planes desde el panel "Diseño & Plataforma" de Superadmin.</p>
            </div>
          ) : (
            <div className={`grid ${gridColsClass} gap-5 sm:gap-6 items-stretch`}>
              {activePlans.map((plan) => {
                const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
                const periodLabel = billingCycle === 'yearly' ? '/ año' : '/ mes';
                const style = COLOR_SCHEME_STYLES[plan.colorScheme] || COLOR_SCHEME_STYLES.blue;
                const isHighlight = plan.isPopular || plan.isRecommended;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white dark:bg-zinc-850 rounded-3xl p-5 sm:p-6 border shadow-md flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                      isHighlight
                        ? `${style.border} ${style.ring} md:-translate-y-1.5 bg-gradient-to-b ${style.accentBg}`
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* TOP BADGE */}
                    {(plan.badge || plan.isPopular || plan.isRecommended) && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 z-10 whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{plan.badge || (plan.isPopular ? 'MÁS POPULAR' : 'RECOMENDADO')}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Plan Header */}
                      <div className="pt-1">
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {plan.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 min-h-[32px] leading-relaxed">
                          {plan.tagline}
                        </p>
                      </div>

                      {/* Price Section */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-3xl sm:text-4xl font-black tracking-tight ${style.price}`}>
                            ${price.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{periodLabel}</span>
                        </div>
                        {billingCycle === 'yearly' && plan.priceMonthly > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            Equivalente a ${(plan.priceYearly / 12).toFixed(2)}/mes
                          </div>
                        )}
                      </div>

                      {/* Limits Box */}
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl text-xs space-y-2 font-medium border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-zinc-400">Comprobantes:</span>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            {plan.invoiceLimit === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">Ilimitados 🚀</span>
                            ) : (
                              <span>{plan.invoiceLimit} / mes</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                          <span className="text-slate-500 dark:text-zinc-400">Usuarios Emisión:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {plan.userLimit === 0 ? (
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">Ilimitados</span>
                            ) : (
                              <span>{plan.userLimit} {plan.userLimit === 1 ? 'Usuario' : 'Usuarios'}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* FEATURES LIST */}
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                          Características incluidas:
                        </div>
                        <div className="space-y-2">
                          {(plan.features || []).map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-zinc-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-snug">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleContractPlan(plan)}
                        className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${style.button}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{plan.buttonText || 'Contratar por WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* GUARANTEE & ASSISTANCE FOOTER */}
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-zinc-400 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Cumplimiento Oficial SRI Ecuador</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Esquema XML XAdES-BES 2.1, clave de acceso 49 dígitos y envío directo por correo electrónico.</div>
              </div>
            </div>

            {settings.socialLinks?.whatsapp && (
              <a
                href={settings.socialLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-bold transition whitespace-nowrap cursor-pointer shrink-0"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>¿Dudas sobre los planes? Escríbenos</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
