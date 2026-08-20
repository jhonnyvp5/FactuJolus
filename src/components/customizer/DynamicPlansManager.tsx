import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  MoveUp,
  MoveDown,
  Copy,
  Sparkles,
  Star,
  MessageCircle,
  Eye,
  EyeOff,
  Sliders,
  DollarSign,
  Tag
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { BillingPlanItem } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';

const COLOR_SCHEMES = [
  { id: 'blue', name: 'Azul Corporativo', bg: 'bg-blue-600', text: 'text-blue-600' },
  { id: 'indigo', name: 'Índigo Moderno', bg: 'bg-indigo-600', text: 'text-indigo-600' },
  { id: 'purple', name: 'Púrpura Premium', bg: 'bg-purple-600', text: 'text-purple-600' },
  { id: 'emerald', name: 'Esmeralda / Verde', bg: 'bg-emerald-600', text: 'text-emerald-600' },
  { id: 'amber', name: 'Ámbar / Dorado', bg: 'bg-amber-600', text: 'text-amber-600' },
  { id: 'rose', name: 'Rose / Rojo Coral', bg: 'bg-rose-600', text: 'text-rose-600' },
];

export default function DynamicPlansManager() {
  const { settings, updateSettings } = usePlatformSettings();
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [previewCycle, setPreviewCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Form state for creating / editing
  const [planFormData, setPlanFormData] = useState<BillingPlanItem>({
    id: '',
    name: '',
    tagline: '',
    priceMonthly: 12.99,
    priceYearly: 119.99,
    invoiceLimit: 250,
    userLimit: 2,
    features: [
      'Emisión de Facturas y Notas de Crédito',
      'Firma Electrónica XAdES-BES Oficial SRI',
      'Catálogo de Clientes y Productos',
      'Soporte Técnico por WhatsApp'
    ],
    isPopular: false,
    isRecommended: false,
    badge: '',
    buttonText: 'Contratar Plan',
    active: true,
    colorScheme: 'indigo',
    whatsappMessage: 'Hola, deseo información para contratar este plan de facturación electrónica SRI.'
  });

  const billingPlans = settings.billingPlans || [];

  // Open modal / form for creating new plan
  const handleOpenNewPlanForm = () => {
    setPlanFormData({
      id: `plan-${Date.now()}`,
      name: 'Nuevo Plan SRI',
      tagline: 'Ideal para profesionales y emprendedores.',
      priceMonthly: 14.99,
      priceYearly: 139.99,
      invoiceLimit: 300,
      userLimit: 2,
      features: [
        'Comprobantes Electrónicos SRI',
        'Firma Digital XAdES-BES',
        'Soporte prioritario por WhatsApp'
      ],
      isPopular: false,
      isRecommended: false,
      badge: '',
      buttonText: 'Contratar Plan',
      active: true,
      colorScheme: 'indigo',
      whatsappMessage: 'Hola, deseo contratar el plan de facturación electrónica SRI.'
    });
    setEditingPlanId(`plan-${Date.now()}`);
  };

  // Open form for editing existing plan
  const handleEditPlan = (plan: BillingPlanItem) => {
    setPlanFormData({ ...plan, features: [...(plan.features || [])] });
    setEditingPlanId(plan.id);
  };

  // Save plan form data
  const handleSavePlanForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormData.name?.trim()) {
      modalAlert.warning('Nombre Requerido', 'Por favor ingresa un nombre para el plan.');
      return;
    }

    const existingIndex = billingPlans.findIndex(p => p.id === planFormData.id);
    let updated: BillingPlanItem[];

    if (existingIndex >= 0) {
      updated = [...billingPlans];
      updated[existingIndex] = { ...planFormData };
    } else {
      updated = [...billingPlans, { ...planFormData }];
    }

    updateSettings({ billingPlans: updated });
    setEditingPlanId(null);
    modalAlert.success('Plan Guardado', `El plan "${planFormData.name}" fue actualizado en el catálogo dinámico.`);
  };

  // Toggle active
  const handleToggleActive = (id: string) => {
    const updated = billingPlans.map(p =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    updateSettings({ billingPlans: updated });
  };

  // Move up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newPlans = [...billingPlans];
    const temp = newPlans[index];
    newPlans[index] = newPlans[index - 1];
    newPlans[index - 1] = temp;
    updateSettings({ billingPlans: newPlans });
  };

  // Move down
  const handleMoveDown = (index: number) => {
    if (index >= billingPlans.length - 1) return;
    const newPlans = [...billingPlans];
    const temp = newPlans[index];
    newPlans[index] = newPlans[index + 1];
    newPlans[index + 1] = temp;
    updateSettings({ billingPlans: newPlans });
  };

  // Duplicate plan
  const handleDuplicate = (plan: BillingPlanItem) => {
    const cloned: BillingPlanItem = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} (Copia)`,
      isPopular: false,
      isRecommended: false
    };
    updateSettings({ billingPlans: [...billingPlans, cloned] });
    modalAlert.success('Plan Duplicado', `Se creó una copia de "${plan.name}".`);
  };

  // Delete plan
  const handleDelete = (id: string) => {
    modalAlert.confirm(
      '¿Eliminar Plan?',
      'Esta acción eliminará el plan del catálogo dinámico.',
      () => {
        const updated = billingPlans.filter(p => p.id !== id);
        updateSettings({ billingPlans: updated });
        if (editingPlanId === id) setEditingPlanId(null);
        modalAlert.info('Plan Eliminado', 'El plan fue eliminado con éxito.');
      }
    );
  };

  // Add feature to current editing plan
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setPlanFormData({
      ...planFormData,
      features: [...(planFormData.features || []), newFeatureText.trim()]
    });
    setNewFeatureText('');
  };

  // Remove feature
  const handleRemoveFeature = (idx: number) => {
    const updatedFeats = (planFormData.features || []).filter((_, i) => i !== idx);
    setPlanFormData({ ...planFormData, features: updatedFeats });
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* HEADER & GENERAL CATALOG SETTINGS */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span>CATÁLOGO DINÁMICO DE PLANES SRI</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Gestor de Planes de Facturación Dinámico
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Crea 1, 2, 3, 4 o más planes. El sistema los agrupa y distribuye automáticamente al tamaño óptimo de la pantalla.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewPlanForm}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nuevo Plan</span>
          </button>
        </div>

        {/* CATALOG HEADINGS CONFIGURATION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-xs text-slate-700 dark:text-zinc-300 mb-1">
              Título Principal del Catálogo
            </label>
            <input
              type="text"
              value={settings.plansCatalogHeading || 'Elige el Plan Perfecto para tu Negocio'}
              onChange={(e) => updateSettings({ plansCatalogHeading: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-xs text-slate-700 dark:text-zinc-300 mb-1">
              Placa de Descuento Anual
            </label>
            <input
              type="text"
              value={settings.plansAnnualDiscountText || 'AHORRA 25% EN PLAN ANUAL'}
              onChange={(e) => updateSettings({ plansAnnualDiscountText: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-xs text-slate-700 dark:text-zinc-300 mb-1">
              Subtítulo del Catálogo
            </label>
            <input
              type="text"
              value={settings.plansCatalogSubheading || 'Emisión instantánea con firma XAdES-BES y autorización automática.'}
              onChange={(e) => updateSettings({ plansCatalogSubheading: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* PLANS LIST AND FORM */}
      <div className="bg-white dark:bg-zinc-850 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
            Planes Configurados ({billingPlans.length}):
          </div>
        </div>

        {billingPlans.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-zinc-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 space-y-3">
            <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="font-bold text-slate-800 dark:text-zinc-200 text-sm">No hay planes registrados</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Haz clic en "+ Crear Nuevo Plan" para añadir opciones de facturación para tus clientes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {billingPlans.map((plan, index) => {
              const isEditing = editingPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isEditing
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md'
                      : plan.active !== false
                      ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                      : 'bg-slate-100/60 dark:bg-zinc-900/40 border-dashed border-slate-300 dark:border-zinc-700 opacity-60'
                  }`}
                >
                  <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                    {/* Left: Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            {plan.name}
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            ${plan.priceMonthly}/mes • ${plan.priceYearly}/año
                          </span>
                          {plan.badge && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase">
                              {plan.badge}
                            </span>
                          )}
                          {plan.isPopular && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                              ★ Más Popular
                            </span>
                          )}
                          {plan.isRecommended && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                              ✓ Recomendado
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {plan.invoiceLimit === 0 ? 'Comprobantes Ilimitados' : `${plan.invoiceLimit} comprobantes/mes`} • {plan.userLimit === 0 ? 'Usuarios Ilimitados' : `${plan.userLimit} usuarios`} • {plan.tagline}
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Mover arriba"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === billingPlans.length - 1}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Mover abajo"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(plan.id)}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          plan.active !== false
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                        title={plan.active !== false ? 'Activo (clic para desactivar)' : 'Inactivo (clic para activar)'}
                      >
                        {plan.active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(plan)}
                        className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                        title="Duplicar plan"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => isEditing ? setEditingPlanId(null) : handleEditPlan(plan)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isEditing
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Cerrar' : 'Editar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Eliminar plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED EDITING FORM */}
                  {isEditing && (
                    <form onSubmit={handleSavePlanForm} className="p-5 sm:p-6 bg-white dark:bg-zinc-900 border-t border-indigo-100 dark:border-indigo-900/40 space-y-5 text-xs animate-fade-in">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Nombre del Plan *
                          </label>
                          <input
                            type="text"
                            required
                            value={planFormData.name}
                            onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Precio Mensual ($ USD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={planFormData.priceMonthly}
                            onChange={(e) => setPlanFormData({ ...planFormData, priceMonthly: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Precio Anual ($ USD)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={planFormData.priceYearly}
                            onChange={(e) => setPlanFormData({ ...planFormData, priceYearly: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Lema / Descripción Corta
                          </label>
                          <input
                            type="text"
                            value={planFormData.tagline}
                            onChange={(e) => setPlanFormData({ ...planFormData, tagline: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Límite de Comprobantes (0 = Ilimitado)
                          </label>
                          <input
                            type="number"
                            value={planFormData.invoiceLimit}
                            onChange={(e) => setPlanFormData({ ...planFormData, invoiceLimit: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Límite de Usuarios (0 = Ilimitado)
                          </label>
                          <input
                            type="number"
                            value={planFormData.userLimit}
                            onChange={(e) => setPlanFormData({ ...planFormData, userLimit: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Esquema de Color
                          </label>
                          <select
                            value={planFormData.colorScheme}
                            onChange={(e) => setPlanFormData({ ...planFormData, colorScheme: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                          >
                            {COLOR_SCHEMES.map(cs => (
                              <option key={cs.id} value={cs.id}>{cs.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* FEATURES LIST BUILDER */}
                      <div className="space-y-3 p-4 bg-slate-50 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700">
                        <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                          <span>Características Incluidas en el Plan ({planFormData.features?.length || 0})</span>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ej: Firma XAdES-BES, Comprobantes ilimitados, Soporte VIP..."
                            value={newFeatureText}
                            onChange={(e) => setNewFeatureText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddFeature();
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                          />
                          <button
                            type="button"
                            onClick={handleAddFeature}
                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                          >
                            + Agregar
                          </button>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {(planFormData.features || []).map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="text-slate-800 dark:text-zinc-200">{feat}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(fIdx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                title="Eliminar característica"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BADGES & WHATSAPP MESSAGE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Placa Superior / Badge (Ej: MÁS VENDIDO, 50% OFF)
                          </label>
                          <input
                            type="text"
                            value={planFormData.badge || ''}
                            onChange={(e) => setPlanFormData({ ...planFormData, badge: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Texto del Botón de Acción
                          </label>
                          <input
                            type="text"
                            value={planFormData.buttonText || 'Contratar Plan'}
                            onChange={(e) => setPlanFormData({ ...planFormData, buttonText: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                            Mensaje Predefinido para WhatsApp
                          </label>
                          <textarea
                            rows={2}
                            value={planFormData.whatsappMessage || ''}
                            onChange={(e) => setPlanFormData({ ...planFormData, whatsappMessage: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* TOGGLES */}
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-zinc-300">
                          <input
                            type="checkbox"
                            checked={planFormData.isPopular === true}
                            onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Marcar como "Más Popular"</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-zinc-300">
                          <input
                            type="checkbox"
                            checked={planFormData.isRecommended === true}
                            onChange={(e) => setPlanFormData({ ...planFormData, isRecommended: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span>Marcar como "Recomendado"</span>
                        </label>
                      </div>

                      {/* FORM ACTION BUTTONS */}
                      <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setEditingPlanId(null)}
                          className="px-4 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Guardar Cambios del Plan</span>
                        </button>
                      </div>

                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
