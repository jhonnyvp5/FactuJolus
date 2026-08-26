import React, { useState } from 'react';
import {
  Globe,
  ShieldCheck,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  ExternalLink,
  Lock,
  Radio,
  Save,
  Check,
  Clock,
  Sparkles,
  HelpCircle,
  Copy
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { DEFAULT_SRI_WS_ENDPOINTS } from '../../lib/platformSettings';
import { SriWsEndpointsConfig, UserRole, PortalUser } from '../../types';
import { modalAlert } from '../../context/ModalAlertContext';
import { apiTestSriWs } from '../../lib/apiClient';

interface SriWebServiceEditorProps {
  isSuperadmin: boolean;
  currentUserRole?: UserRole;
  currentUser?: PortalUser | null;
}

interface EndpointTestState {
  loading: boolean;
  tested: boolean;
  success: boolean;
  message: string;
  httpStatus?: number;
  latencyMs?: number;
  isWsdl?: boolean;
}

export function SriWebServiceEditor({ isSuperadmin, currentUserRole, currentUser }: SriWebServiceEditorProps) {
  const { settings, updateSettings, saveSettingsToCloud, isSaving } = usePlatformSettings();

  const userRole = (currentUserRole || currentUser?.role || '').toUpperCase();
  const hasSuperadminAccess = isSuperadmin || userRole === 'SUPERADMIN';

  // Active endpoints from settings or fallback to defaults
  const currentEndpoints: SriWsEndpointsConfig = {
    recepcionPruebas: settings.sriWsEndpoints?.recepcionPruebas || DEFAULT_SRI_WS_ENDPOINTS.recepcionPruebas,
    autorizacionPruebas: settings.sriWsEndpoints?.autorizacionPruebas || DEFAULT_SRI_WS_ENDPOINTS.autorizacionPruebas,
    recepcionProduccion: settings.sriWsEndpoints?.recepcionProduccion || DEFAULT_SRI_WS_ENDPOINTS.recepcionProduccion,
    autorizacionProduccion: settings.sriWsEndpoints?.autorizacionProduccion || DEFAULT_SRI_WS_ENDPOINTS.autorizacionProduccion,
  };

  const [formState, setFormState] = useState<SriWsEndpointsConfig>({ ...currentEndpoints });
  const [hasChanges, setHasChanges] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test states for each of the 4 endpoints
  const [testStates, setTestStates] = useState<Record<keyof SriWsEndpointsConfig, EndpointTestState>>({
    recepcionPruebas: { loading: false, tested: false, success: false, message: '' },
    autorizacionPruebas: { loading: false, tested: false, success: false, message: '' },
    recepcionProduccion: { loading: false, tested: false, success: false, message: '' },
    autorizacionProduccion: { loading: false, tested: false, success: false, message: '' },
  });

  const handleChange = (key: keyof SriWsEndpointsConfig, val: string) => {
    setFormState(prev => {
      const next = { ...prev, [key]: val.trim() };
      setHasChanges(true);
      return next;
    });
  };

  const handleTestEndpoint = async (key: keyof SriWsEndpointsConfig) => {
    const url = formState[key];
    if (!url) {
      modalAlert.warning('URL Requerida', 'Ingrese la URL del Web Service antes de realizar la prueba.');
      return;
    }

    setTestStates(prev => ({
      ...prev,
      [key]: { loading: true, tested: false, success: false, message: 'Conectando con el servidor SRI...' }
    }));

    try {
      const res = await apiTestSriWs(url);
      setTestStates(prev => ({
        ...prev,
        [key]: {
          loading: false,
          tested: true,
          success: res.success,
          message: res.message,
          httpStatus: res.httpStatus,
          latencyMs: res.latencyMs,
          isWsdl: res.isWsdl
        }
      }));

      if (res.success) {
        modalAlert.success('Conexión Exitosa con el SRI', `El endpoint respondió con código ${res.httpStatus || 200} en ${res.latencyMs || 0}ms.`);
      } else {
        modalAlert.warning('Servidor SRI No Respondió', res.message || 'Verifique que el servidor del SRI se encuentre operativo.');
      }
    } catch (err: any) {
      setTestStates(prev => ({
        ...prev,
        [key]: {
          loading: false,
          tested: true,
          success: false,
          message: err.message || 'Error de red al conectar con el servidor SRI.'
        }
      }));
      modalAlert.error('Fallo de Red', err.message || 'No se pudo contactar el endpoint.');
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetDefaults = () => {
    modalAlert.confirm(
      '¿Restablecer URLs Oficiales del SRI?',
      'Esta acción reasignará las direcciones WSDL oficiales estándar de celcer (Pruebas) y cel (Producción).',
      () => {
        setFormState({ ...DEFAULT_SRI_WS_ENDPOINTS });
        updateSettings({ sriWsEndpoints: { ...DEFAULT_SRI_WS_ENDPOINTS } });
        setHasChanges(false);
        modalAlert.success('URLs Restablecidas', 'Se han restaurado los enlaces WSDL estándar del SRI Ecuador.');
      }
    );
  };

  const handleSaveEndpoints = async () => {
    if (!formState.recepcionPruebas || !formState.autorizacionPruebas || !formState.recepcionProduccion || !formState.autorizacionProduccion) {
      modalAlert.warning('URLs Incompletas', 'Todos los 4 campos de Web Service SRI deben tener una URL válida.');
      return;
    }

    updateSettings({ sriWsEndpoints: { ...formState } });
    setHasChanges(false);

    try {
      await saveSettingsToCloud();
      modalAlert.success('Web Services SRI Guardados', 'Las nuevas direcciones Web Service del SRI han sido guardadas y aplicadas a toda la plataforma.');
    } catch {
      modalAlert.info('Configuración Aplicada Localmente', 'Los enlaces se guardaron en la sesión activa.');
    }
  };

  if (!hasSuperadminAccess) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-200 dark:border-zinc-800 shadow-sm text-center max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          Acceso Restringido a Superadministrador
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          La modificación de las rutas centrales del Web Service del SRI (WSDL de Recepción y Autorización para Pruebas y Producción) está reservada exclusivamente para el rol <strong>SUPERADMIN</strong> para garantizar la estabilidad tributaria de todo el sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER HERO */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gestión Central de Endpoints SRI • Exclusivo SUPERADMIN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Globe className="w-8 h-8 text-emerald-400 shrink-0" />
              <span>Enlaces del Web Service SRI</span>
            </h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Configura y actualiza en tiempo real las URLs oficiales de los servidores SOAP del SRI de Ecuador (Ambientes de Pruebas y Producción). Si el SRI actualiza sus rutas WSDL u hostnames, puedes modificar estos endpoints aquí de inmediato sin recompilar el sistema.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/20 cursor-pointer shadow-xs"
              title="Restaurar direcciones oficiales del SRI"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restablecer Oficiales</span>
            </button>

            <button
              type="button"
              onClick={handleSaveEndpoints}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-850 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Tienes modificaciones pendientes en los enlaces del Web Service SRI. No olvides hacer clic en <strong>Guardar Cambios</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveEndpoints}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition shrink-0"
          >
            Guardar Ahora
          </button>
        </div>
      )}

      {/* AMBIENTE 1: PRUEBAS (SANDBOX / CELCER) */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Ambiente 1
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Ambiente de Pruebas (celcer.sri.gob.ec)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Utilizado para homologación, pruebas de desarrollo y validación de certificados digitales en el SRI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              <Server className="w-3.5 h-3.5 text-amber-500" />
              <span>Host: celcer.sri.gob.ec</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECEPCION PRUEBAS */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. WSDL Recepción de Comprobantes (Pruebas)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(formState.recepcionPruebas, 'recepcionPruebas')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Copiar URL"
                >
                  {copiedKey === 'recepcionPruebas' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={formState.recepcionPruebas}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Abrir WSDL en navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={formState.recepcionPruebas}
                onChange={(e) => handleChange('recepcionPruebas', e.target.value)}
                placeholder="https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestEndpoint('recepcionPruebas')}
                disabled={testStates.recepcionPruebas.loading}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${testStates.recepcionPruebas.loading ? 'animate-spin' : ''}`} />
                <span>{testStates.recepcionPruebas.loading ? 'Probando...' : 'Probar Conexión WSDL'}</span>
              </button>

              {testStates.recepcionPruebas.tested && (
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  testStates.recepcionPruebas.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {testStates.recepcionPruebas.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{testStates.recepcionPruebas.success ? `En línea (${testStates.recepcionPruebas.latencyMs}ms)` : 'Fallo de conexión'}</span>
                </span>
              )}
            </div>

            {testStates.recepcionPruebas.tested && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 font-mono">
                {testStates.recepcionPruebas.message}
              </div>
            )}
          </div>

          {/* AUTORIZACION PRUEBAS */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>2. WSDL Autorización de Comprobantes (Pruebas)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(formState.autorizacionPruebas, 'autorizacionPruebas')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Copiar URL"
                >
                  {copiedKey === 'autorizacionPruebas' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={formState.autorizacionPruebas}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Abrir WSDL en navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={formState.autorizacionPruebas}
                onChange={(e) => handleChange('autorizacionPruebas', e.target.value)}
                placeholder="https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestEndpoint('autorizacionPruebas')}
                disabled={testStates.autorizacionPruebas.loading}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${testStates.autorizacionPruebas.loading ? 'animate-spin' : ''}`} />
                <span>{testStates.autorizacionPruebas.loading ? 'Probando...' : 'Probar Conexión WSDL'}</span>
              </button>

              {testStates.autorizacionPruebas.tested && (
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  testStates.autorizacionPruebas.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {testStates.autorizacionPruebas.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{testStates.autorizacionPruebas.success ? `En línea (${testStates.autorizacionPruebas.latencyMs}ms)` : 'Fallo de conexión'}</span>
                </span>
              )}
            </div>

            {testStates.autorizacionPruebas.tested && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 font-mono">
                {testStates.autorizacionPruebas.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AMBIENTE 2: PRODUCCIÓN (LIVE / CEL) */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Ambiente 2
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Ambiente de Producción (cel.sri.gob.ec)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Servidores oficiales en vivo con validez jurídica y tributaria inmediata en todo el Ecuador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              <span>Host: cel.sri.gob.ec</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECEPCION PRODUCCION */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>1. WSDL Recepción de Comprobantes (Producción)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(formState.recepcionProduccion, 'recepcionProduccion')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Copiar URL"
                >
                  {copiedKey === 'recepcionProduccion' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={formState.recepcionProduccion}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Abrir WSDL en navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={formState.recepcionProduccion}
                onChange={(e) => handleChange('recepcionProduccion', e.target.value)}
                placeholder="https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestEndpoint('recepcionProduccion')}
                disabled={testStates.recepcionProduccion.loading}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${testStates.recepcionProduccion.loading ? 'animate-spin' : ''}`} />
                <span>{testStates.recepcionProduccion.loading ? 'Probando...' : 'Probar Conexión WSDL'}</span>
              </button>

              {testStates.recepcionProduccion.tested && (
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  testStates.recepcionProduccion.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {testStates.recepcionProduccion.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{testStates.recepcionProduccion.success ? `En línea (${testStates.recepcionProduccion.latencyMs}ms)` : 'Fallo de conexión'}</span>
                </span>
              )}
            </div>

            {testStates.recepcionProduccion.tested && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 font-mono">
                {testStates.recepcionProduccion.message}
              </div>
            )}
          </div>

          {/* AUTORIZACION PRODUCCION */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-850/60 border border-slate-200/80 dark:border-zinc-700/60">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>2. WSDL Autorización de Comprobantes (Producción)</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(formState.autorizacionProduccion, 'autorizacionProduccion')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Copiar URL"
                >
                  {copiedKey === 'autorizacionProduccion' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={formState.autorizacionProduccion}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition"
                  title="Abrir WSDL en navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={formState.autorizacionProduccion}
                onChange={(e) => handleChange('autorizacionProduccion', e.target.value)}
                placeholder="https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleTestEndpoint('autorizacionProduccion')}
                disabled={testStates.autorizacionProduccion.loading}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${testStates.autorizacionProduccion.loading ? 'animate-spin' : ''}`} />
                <span>{testStates.autorizacionProduccion.loading ? 'Probando...' : 'Probar Conexión WSDL'}</span>
              </button>

              {testStates.autorizacionProduccion.tested && (
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  testStates.autorizacionProduccion.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {testStates.autorizacionProduccion.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{testStates.autorizacionProduccion.success ? `En línea (${testStates.autorizacionProduccion.latencyMs}ms)` : 'Fallo de conexión'}</span>
                </span>
              )}
            </div>

            {testStates.autorizacionProduccion.tested && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 font-mono">
                {testStates.autorizacionProduccion.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TECHNICAL GUIDE & RECOMMENDATIONS */}
      <div className="bg-slate-50 dark:bg-zinc-850/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 space-y-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>Información Técnica & Directrices del SRI</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-zinc-300">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Protocolo SOAP & HTTPS</span>
            </div>
            <p className="text-slate-500 dark:text-zinc-400">
              Todas las conexiones se efectúan bajo HTTPS estándar (Puerto 443) con soporte TLS v1.0/1.2 y renegociación segura con los balanceadores del SRI.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Disponibilidad del SRI</span>
            </div>
            <p className="text-slate-500 dark:text-zinc-400">
              El ambiente de pruebas <code className="text-[10px] bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">celcer</code> suele tener ventanas de mantenimiento programadas por el SRI sin previo aviso. El simulador local permite continuar operando.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-500" />
              <span>Esquema Offline XAdES-BES</span>
            </div>
            <p className="text-slate-500 dark:text-zinc-400">
              El esquema offline utiliza validación en 2 fases: primero Recepción de XML firmado y luego consulta asíncrona por Clave de Acceso de 49 dígitos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
