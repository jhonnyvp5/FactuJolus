import React, { useState, useEffect, useRef } from 'react';
import { PortalUser, EmitterConfig, RegimenTributario } from '../types';
import { validateRuc, REGIMENES } from '../sri/utils';
import { apiCheckSignature, apiTestSmtp } from '../lib/apiClient';
import { 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  FileCode, 
  Shield, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Lock, 
  Edit3, 
  Mail, 
  Send,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  AlertTriangle,
  Database
} from 'lucide-react';
import { saveEmitterConfigToSupabase } from '../lib/supabase';
import { modalAlert } from '../context/ModalAlertContext';

interface SettingsFormProps {
  config: EmitterConfig;
  onSave: (newConfig: EmitterConfig) => void;
  currentUser?: PortalUser | null;
}

export default function SettingsForm({ config, onSave, currentUser }: SettingsFormProps) {
  const [ruc, setRuc] = useState(config.ruc || '');
  const [razonSocial, setRazonSocial] = useState(config.razonSocial || '');
  const [nombreComercial, setNombreComercial] = useState(config.nombreComercial || '');
  const [dirMatriz, setDirMatriz] = useState(config.dirMatriz || '');
  const [dirEstablecimiento, setDirEstablecimiento] = useState(config.dirEstablecimiento || '');
  const [codEstablecimiento, setCodEstablecimiento] = useState(config.codEstablecimiento || '001');
  const [codPuntoEmision, setCodPuntoEmision] = useState(config.codPuntoEmision || '001');
  const [correo, setCorreo] = useState(config.correo || '');
  const [telefono, setTelefono] = useState(config.telefono || '');
  const [obligadoContabilidad, setObligadoContabilidad] = useState(config.obligadoContabilidad ?? true);
  const [contribuyenteEspecial, setContribuyenteEspecial] = useState(config.contribuyenteEspecial || '');
  const [agenteRetencion, setAgenteRetencion] = useState(config.agenteRetencion || '');
  const [regimen, setRegimen] = useState<RegimenTributario>(config.regimen || '');
  const [ambiente, setAmbiente] = useState<'1' | '2'>(config.ambiente || '1');
  const [isDemoMode, setIsDemoMode] = useState(config.isDemoMode ?? true);
  const [ultimoSecuencialFactura, setUltimoSecuencialFactura] = useState(config.ultimoSecuencialFactura || '000000001');

  // SMTP Email Server settings
  const [smtpHost, setSmtpHost] = useState(config.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(config.smtpPort ? String(config.smtpPort) : '587');
  const [smtpUser, setSmtpUser] = useState(config.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(config.smtpPass || '');
  const [smtpFrom, setSmtpFrom] = useState(config.smtpFrom || '');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ status: string; message: string } | null>(null);

  // Digital Signature local assets
  const [password, setPassword] = useState(config.p12Password || '');
  const [signatureB64, setSignatureB64] = useState(config.p12FirmaB64 || '');
  const [signatureName, setSignatureName] = useState(config.p12Nombre || '');
  const [validoDesde, setValidoDesde] = useState(config.p12ValidoDesde || config.validoDesde || '');
  const [validoHasta, setValidoHasta] = useState(config.p12ValidoHasta || config.validoHasta || '');
  
  // Checking & Saving indicators
  const [isLoadingSig, setIsLoadingSig] = useState(false);
  const [sigDetails, setSigDetails] = useState<any>(null);
  const [sigError, setSigError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Single unified Edit/Lock toggle state for all sections
  const [isEditingForm, setIsEditingForm] = useState<boolean>(() => {
    return !(config.ruc && config.razonSocial);
  });

  // Helper to extract clean YYYY-MM-DD date format
  const formatCleanDate = (rawDate?: string): string => {
    if (!rawDate) return '';
    try {
      if (rawDate.includes('T')) return rawDate.split('T')[0];
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {
      // ignore
    }
    return rawDate;
  };

  // Sync internal state from external config ONLY on initial mount or when switching company/tenant identity
  const lastSyncedIdRef = useRef<string>('');
  const currentTenantKey = `${config.empresaRuc || config.ruc || ''}`;

  useEffect(() => {
    if (lastSyncedIdRef.current !== currentTenantKey) {
      lastSyncedIdRef.current = currentTenantKey;
      setRuc(config.ruc || '');
      setRazonSocial(config.razonSocial || '');
      setNombreComercial(config.nombreComercial || '');
      setDirMatriz(config.dirMatriz || '');
      setDirEstablecimiento(config.dirEstablecimiento || '');
      setCodEstablecimiento(config.codEstablecimiento || '001');
      setCodPuntoEmision(config.codPuntoEmision || '001');
      setCorreo(config.correo || '');
      setTelefono(config.telefono || '');
      setObligadoContabilidad(config.obligadoContabilidad ?? true);
      setContribuyenteEspecial(config.contribuyenteEspecial || '');
      setAgenteRetencion(config.agenteRetencion || '');
      setRegimen(config.regimen || '');
      setAmbiente(config.ambiente || '1');
      setIsDemoMode(config.isDemoMode ?? true);
      setUltimoSecuencialFactura(config.ultimoSecuencialFactura || '000000001');
      setSmtpHost(config.smtpHost || '');
      setSmtpPort(config.smtpPort ? String(config.smtpPort) : '587');
      setSmtpUser(config.smtpUser || '');
      setSmtpPass(config.smtpPass || '');
      setSmtpFrom(config.smtpFrom || '');
      setPassword(config.p12Password || '');
      setSignatureB64(config.p12FirmaB64 || '');
      setSignatureName(config.p12Nombre || '');
      setValidoDesde(formatCleanDate(config.p12ValidoDesde || config.validoDesde || ''));
      setValidoHasta(formatCleanDate(config.p12ValidoHasta || config.validoHasta || ''));
      setSigDetails(null);
      setSigError(null);
    }
  }, [currentTenantKey, config]);

  const handleClearExampleData = () => {
    setRuc('');
    setRazonSocial('');
    setNombreComercial('');
    setDirMatriz('');
    setDirEstablecimiento('');
    setCodEstablecimiento('001');
    setCodPuntoEmision('001');
    setCorreo('');
    setTelefono('');
    setContribuyenteEspecial('');
    setAgenteRetencion('');
    setPassword('');
    setSignatureB64('');
    setSignatureName('');
    setValidoDesde('');
    setValidoHasta('');
    setSigDetails(null);
    setSigError(null);
  };

  const handleLoadExampleData = () => {
    setRuc('1792451083001');
    setRazonSocial('VALLE PLUA JHONNY ALEXIS');
    setNombreComercial('JV SOLUCIONES');
    setDirMatriz('Av. Amazonas N21-147 y Av. Colón, Quito');
    setDirEstablecimiento('Matriz - Oficinas Administrativas 3B');
    setCodEstablecimiento('001');
    setCodPuntoEmision('001');
    setCorreo('alexis.valle@gmail.com');
    setTelefono('0995831920');
    setObligadoContabilidad(true);
    setRegimen('RIMPE_EMPRENDEDOR');
    setAmbiente('1');
    setIsDemoMode(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignatureName(file.name);
    setSigError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = (event.target?.result as string).split(',')[1];
      setSignatureB64(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifySignature = async () => {
    if (!signatureB64) {
      setSigError('Por favor suba primero un archivo de firma electrónica (.p12)');
      return;
    }
    if (!password) {
      setSigError('Por favor ingrese la contraseña de la firma electrónica');
      return;
    }

    setIsLoadingSig(true);
    setSigError(null);

    try {
      const result = await apiCheckSignature(signatureB64, password);
      if (result.status === 'success' && result.info) {
        const info = result.info;
        setSigDetails(info);
        
        // Autocompletar únicamente los campos de fecha sin pop-ups
        const cleanFrom = formatCleanDate(info.validFrom);
        const cleanTo = formatCleanDate(info.validTo);
        
        if (cleanFrom) setValidoDesde(cleanFrom);
        if (cleanTo) setValidoHasta(cleanTo);
        setSigError(null);
      } else {
        setSigError(result.message || 'No se pudo validar la firma electrónica con la contraseña proporcionada.');
      }
    } catch (err: any) {
      setSigError(err.message || 'Error al validar la firma electrónica.');
    } finally {
      setIsLoadingSig(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpHost || !smtpUser || !smtpPass) {
      modalAlert.warning('Campos Incompletos', 'Por favor complete primero los campos de Servidor SMTP, Usuario y Contraseña.');
      return;
    }
    const testRecipient = prompt('Ingrese la dirección de correo a la que desea enviar el correo de prueba:', correo || smtpUser || 'cliente@ejemplo.com');
    if (!testRecipient) return;

    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await apiTestSmtp({
        host: smtpHost,
        port: Number(smtpPort) || 587,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom || undefined,
        recipient: testRecipient
      });
      setSmtpTestResult(res);
      if (res.status === 'success') {
        modalAlert.success('Servidor SMTP Conectado', res.message || 'El correo de prueba ha sido entregado exitosamente.');
      } else {
        modalAlert.error('Fallo de Envío SMTP', res.message || 'No se pudo despachar el correo de prueba.');
      }
    } catch (err: any) {
      setSmtpTestResult({ status: 'error', message: err.message || String(err) });
      modalAlert.error('Error SMTP', err.message || String(err));
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ruc && !validateRuc(ruc)) {
      modalAlert.warning('Validación de RUC', '¡El número de RUC no parece válido para el algoritmo oficial de Ecuador!');
    }

    setIsSaving(true);
    setSaveMessage('Guardando y aplicando los nuevos parámetros de configuración en la base de datos...');

    const updatedConfig: EmitterConfig = {
      ruc: ruc ? ruc.trim() : '',
      razonSocial: razonSocial ? razonSocial.trim() : '',
      nombreComercial: nombreComercial ? nombreComercial.trim() : '',
      dirMatriz: dirMatriz ? dirMatriz.trim() : '',
      dirEstablecimiento: dirEstablecimiento ? dirEstablecimiento.trim() : '',
      codEstablecimiento: codEstablecimiento || '001',
      codPuntoEmision: codPuntoEmision || '001',
      obligadoContabilidad,
      contribuyenteEspecial: contribuyenteEspecial ? contribuyenteEspecial.trim() : '',
      agenteRetencion: agenteRetencion ? agenteRetencion.trim() : '',
      regimen,
      ambiente,
      isDemoMode,
      p12Nombre: signatureName,
      p12FirmaB64: signatureB64,
      p12Password: password,
      p12ValidoDesde: validoDesde || sigDetails?.validFrom || config.p12ValidoDesde || config.validoDesde || '',
      p12ValidoHasta: validoHasta || sigDetails?.validTo || config.p12ValidoHasta || config.validoHasta || '',
      validoDesde: validoDesde || sigDetails?.validFrom || config.p12ValidoDesde || config.validoDesde || '',
      validoHasta: validoHasta || sigDetails?.validTo || config.p12ValidoHasta || config.validoHasta || '',
      p12Subject: sigDetails?.subject || config.p12Subject,
      p12Issuer: sigDetails?.issuer || config.p12Issuer,
      p12SerialNumber: sigDetails?.serialNumber || config.p12SerialNumber,
      correo: correo ? correo.trim() : '',
      telefono: telefono ? telefono.trim() : '',
      ultimoSecuencialFactura: ultimoSecuencialFactura ? ultimoSecuencialFactura.replace(/\D/g, '').padStart(9, '0') : '000000001',
      smtpHost: smtpHost ? smtpHost.trim() : '',
      smtpPort: smtpPort ? String(smtpPort).trim() : '587',
      smtpUser: smtpUser ? smtpUser.trim() : '',
      smtpPass: smtpPass || '',
      smtpFrom: smtpFrom ? smtpFrom.trim() : '',
      logoB64: config.logoB64,
      empresaRuc: config.empresaRuc || (ruc ? ruc.trim() : ''),
      empresaNombre: config.empresaNombre || (razonSocial ? razonSocial.trim() : '')
    };

    // Instant local state & App update for rapid performance
    onSave(updatedConfig);

    try {
      // Direct & optimized cloud persistence
      await saveEmitterConfigToSupabase(updatedConfig, currentUser?.correo);
    } catch (err) {
      console.warn('Aviso sincronizando configuración en Supabase:', err);
    } finally {
      setIsSaving(false);
      setIsEditingForm(false);
      setSaveSuccess(true);
      setSaveMessage('¡Parámetros y certificado guardados exitosamente!');
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveMessage('');
      }, 4000);
    }
  };

  const rucValido = validateRuc(ruc);

  return (
    <form onSubmit={handleSubmit} id="settings-form" className="space-y-8 max-w-4xl mx-auto">
      
      {/* UNIFIED CONTAINER: CONFIGURACIÓN DEL EMISOR + CERTIFICADO DIGITAL DE FIRMA (.P12) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        
        {/* UNIFIED HEADER WITH SINGLE EDIT BUTTON */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Configuración del Emisor y Firma Electrónica
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure sus datos fiscales, parámetros de facturación y cargue su certificado de firma electrónica (.p12) en un solo lugar.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* SINGLE UNIFIED EDIT FORM BUTTON */}
            <button
              type="button"
              onClick={() => setIsEditingForm(!isEditingForm)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isEditingForm 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/30' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
              }`}
              title={isEditingForm ? "Bloquear la edición de todos los campos" : "Habilitar la edición de todas las secciones del formulario"}
            >
              {isEditingForm ? (
                <>
                  <Lock className="w-4 h-4" /> Bloquear Formulario
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" /> Editar Formulario
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                handleClearExampleData();
                setIsEditingForm(true);
              }}
              disabled={!isEditingForm}
              className="px-3.5 py-2 text-xs font-medium text-red-650 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Borra todos los datos del formulario para ingresar nueva información"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar Datos
            </button>

            <button
              type="button"
              onClick={() => {
                handleLoadExampleData();
                setIsEditingForm(true);
              }}
              disabled={!isEditingForm}
              className="px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cargar datos de prueba de ejemplo"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar Ejemplo
            </button>
          </div>
        </div>

        {/* LOCKED FIELDS NOTICE */}
        {!isEditingForm && (
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 px-4 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium animate-fade-in">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              Los campos de Configuración del Emisor y Firma Electrónica están bloqueados. Haga clic en <strong>Editar Formulario</strong> para modificar todas las secciones.
            </span>
            <button
              type="button"
              onClick={() => setIsEditingForm(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
            >
              <Edit3 className="w-3.5 h-3.5" /> Desbloquear
            </button>
          </div>
        )}

        {/* MODO DE OPERACIÓN */}
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/40 dark:bg-indigo-950/20 dark:border-indigo-900/30 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Modo de Operación</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Simulador Informativo vs Modo Real</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isDemoMode 
                ? 'Modo Simulador activo: Genera XML oficial, simula firmas y replica las respuestas exactas de recepción y autorización del SRI sin enviar datos reales.' 
                : 'Modo Real activo: Envía los comprobantes firmados electrónicamente directamente a los servidores SOAP oficiales de Pruebas o Producción del SRI.'}
            </p>
          </div>
          <div className="flex bg-white dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700 shrink-0">
            <button
              type="button"
              disabled={!isEditingForm}
              onClick={() => setIsDemoMode(true)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed ${isDemoMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
            >
              Simulador (Recomendado)
            </button>
            <button
              type="button"
              disabled={!isEditingForm}
              onClick={() => setIsDemoMode(false)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed ${!isDemoMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
            >
              Conexión Real SRI
            </button>
          </div>
        </div>

        {/* FISCAL DATA INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RUC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">RUC del Emisor (13 dígitos)</label>
            <div className="relative">
              <input
                type="text"
                disabled={!isEditingForm}
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').substring(0, 13))}
                placeholder="Ej. 1792451083001"
                className={`w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-zinc-800 dark:border-zinc-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70 ${ruc ? (rucValido ? 'border-green-300 focus:ring-green-400' : 'border-red-300 focus:ring-red-400') : 'border-gray-200 focus:ring-indigo-500'}`}
                required
              />
              {ruc && (
                <div className="absolute right-3 top-2.5 flex items-center gap-1">
                  {rucValido ? (
                    <span className="flex items-center text-xs text-green-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" /> RUC Válido
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-red-600 font-medium">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-1" /> Inválido
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Razón Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Razón Social</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
              placeholder="Ej. JHONNY ALEXIS VALLE PLUA S.A."
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
              required
            />
          </div>

          {/* Nombre Comercial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Nombre Comercial</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value.toUpperCase())}
              placeholder="Ej. J&V SOLUCIONES DIGITALES"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            />
          </div>

          {/* Regimen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Régimen Tributario del SRI</label>
            <select
              disabled={!isEditingForm}
              value={regimen}
              onChange={(e) => setRegimen(e.target.value as RegimenTributario)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            >
              <option value="">-- Seleccione Régimen Tributario --</option>
              {REGIMENES.map((reg) => (
                <option key={reg.code} value={reg.code}>{reg.label}</option>
              ))}
            </select>
          </div>

          {/* Correo Emisor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Correo Electrónico (Contacto Emisor)</label>
            <input
              type="email"
              disabled={!isEditingForm}
              value={correo}
              onChange={(e) => setCorreo(e.target.value.toUpperCase())}
              placeholder="Ej. emisor@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            />
          </div>

          {/* Telefono Emisor - PERSISTIDO EN BASE DE DATOS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Teléfono (Contacto Emisor)</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.toUpperCase())}
              placeholder="Ej. 0967590168"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            />
          </div>

          {/* Direccion Matriz */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Dirección Matriz</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={dirMatriz}
              onChange={(e) => setDirMatriz(e.target.value.toUpperCase())}
              placeholder="Ej. Av. 10 de Agosto N15-23 y Rio de Janeiro"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
              required
            />
          </div>

          {/* Direccion Establecimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Dirección de Establecimiento de Emisión</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={dirEstablecimiento}
              onChange={(e) => setDirEstablecimiento(e.target.value.toUpperCase())}
              placeholder="Ej. Local Central - Centro Norte de Quito"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            />
          </div>

          {/* Establecimiento (3 digitos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Establecimiento (001)</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={codEstablecimiento}
              onChange={(e) => setCodEstablecimiento(e.target.value.replace(/\D/g, '').substring(0, 3))}
              placeholder="001"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
              required
            />
          </div>

          {/* Punto de Emision (3 digitos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Punto de Emisión (001)</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={codPuntoEmision}
              onChange={(e) => setCodPuntoEmision(e.target.value.replace(/\D/g, '').substring(0, 3))}
              placeholder="001"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
              required
            />
          </div>

          {/* Secuencial Factura (9 digitos) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Secuencial Factura (9 dígitos)</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={ultimoSecuencialFactura}
              onChange={(e) => setUltimoSecuencialFactura(e.target.value.replace(/\D/g, '').substring(0, 9))}
              onBlur={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val) {
                  setUltimoSecuencialFactura(val.padStart(9, '0'));
                }
              }}
              placeholder="Ej. 000000001"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
              required
            />
          </div>
        </div>

        <hr className="border-gray-100 dark:border-zinc-800" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              id="obligado"
              type="checkbox"
              disabled={!isEditingForm}
              checked={obligadoContabilidad}
              onChange={(e) => setObligadoContabilidad(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
            />
            <label htmlFor="obligado" className="ml-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
              Obligado a Llevar Contabilidad
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-400 mb-1">Resolución Contribuyente Especial</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={contribuyenteEspecial}
              onChange={(e) => setContribuyenteEspecial(e.target.value.toUpperCase())}
              placeholder="Ej. RES. 024"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-400 mb-1">Reg. Agente de Retención (Resolución)</label>
            <input
              type="text"
              disabled={!isEditingForm}
              value={agenteRetencion}
              onChange={(e) => setAgenteRetencion(e.target.value.toUpperCase())}
              placeholder="Ej. NO. NAC-DNCR-ASC20-00000001"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Ambiente de Trabajo SRI (WebServices)</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                disabled={!isEditingForm}
                onClick={() => setAmbiente('1')}
                className={`py-2 text-xs font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed ${ambiente === '1' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
              >
                1 - Pruebas (CELCER)
              </button>
              <button
                type="button"
                disabled={!isEditingForm}
                onClick={() => setAmbiente('2')}
                className={`py-2 text-xs font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed ${ambiente === '2' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
              >
                2 - Producción (CEL)
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: CERTIFICADO DIGITAL DE FIRMA ELECTRÓNICA (.P12) INSIDE SAME CONTAINER */}
        <div className="pt-6 border-t-2 border-indigo-50 dark:border-zinc-800/80 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-500 border border-amber-200/60 dark:border-amber-900/50">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Certificado Digital de Firma Electrónica (.p12)
                {signatureName && (
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300 border border-green-300 dark:border-green-800">
                    Archivo cargado
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Cargue su firma .p12 otorgada por entidades acreditadas en Ecuador (Uanataca, Security Data, BCE, etc.) para firmar comprobantes autorizados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Cargar Archivo de Firma (.p12 / .pfx)</label>
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition ${
                  isEditingForm 
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 border-gray-300 dark:border-zinc-700 hover:border-indigo-500' 
                    : 'cursor-not-allowed opacity-60 bg-gray-100/50 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-800'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <FileCode className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold truncate max-w-[280px]">
                      {signatureName ? signatureName : 'Subir archivo .p12'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isEditingForm ? 'Haga clic o arrastre su archivo .p12 aquí' : 'Desbloquee el formulario para cambiar el archivo'}
                    </p>
                  </div>
                  <input type="file" disabled={!isEditingForm} accept=".p12,.pfx" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Contraseña de la Firma Electrónica</label>
                <input
                  type="password"
                  disabled={!isEditingForm}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduzca clave secreta del certificado"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifySignature}
                disabled={!isEditingForm || isLoadingSig || !signatureB64}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer ${(!signatureB64 || !isEditingForm) ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'}`}
              >
                {isLoadingSig ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verificando firma...
                  </>
                ) : (
                  <>Verificar Firma Electrónica</>
                )}
              </button>
            </div>
          </div>

          {/* CAMPOS DE VIGENCIA DE LA FIRMA ELECTRÓNICA: VÁLIDO DESDE Y VÁLIDO HASTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Válido desde
              </label>
              <input
                type="text"
                disabled={!isEditingForm}
                value={validoDesde}
                onChange={(e) => setValidoDesde(e.target.value)}
                placeholder="AAAA-MM-DD (Se autocompleta al verificar firma)"
                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
              />
              <span className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 block">
                Fecha inicial de emisión del certificado digital (.p12)
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Válido hasta
              </label>
              <input
                type="text"
                disabled={!isEditingForm}
                value={validoHasta}
                onChange={(e) => setValidoHasta(e.target.value)}
                placeholder="AAAA-MM-DD (Se autocompleta al verificar firma)"
                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
              />
              <span className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 block">
                Fecha final de expiración o caducidad del certificado digital (.p12)
              </span>
            </div>
          </div>

          {sigError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm flex gap-2 items-center dark:bg-red-950/20 dark:border-red-900/30">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{sigError}</span>
            </div>
          )}

          {/* TARJETA DE VIGENCIA DE LA FIRMA ELECTRÓNICA */}
          {(() => {
            const activeValidFrom = validoDesde || sigDetails?.validFrom || config.p12ValidoDesde || config.validoDesde;
            const activeValidTo = validoHasta || sigDetails?.validTo || config.p12ValidoHasta || config.validoHasta;
            const activeSubject = sigDetails?.subject || config.p12Subject;
            const activeIssuer = sigDetails?.issuer || config.p12Issuer;
            const activeSerialNumber = sigDetails?.serialNumber || config.p12SerialNumber;

            if (!activeValidTo) return null;

            try {
              const toDate = new Date(activeValidTo);
              const fromDate = activeValidFrom ? new Date(activeValidFrom) : new Date(toDate.getTime() - 365 * 24 * 60 * 60 * 1000);
              const now = new Date();

              const totalMs = Math.max(1, toDate.getTime() - fromDate.getTime());
              const remainingMs = toDate.getTime() - now.getTime();
              const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
              const percentRemaining = Math.max(0, Math.min(100, Math.round((remainingMs / totalMs) * 100)));
              const isExpired = daysRemaining <= 0;
              const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;

              return (
                <div className={`p-5 rounded-2xl border transition-all shadow-sm ${
                  isExpired 
                    ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50' 
                    : isExpiringSoon 
                    ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
                    : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/60 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl text-white ${
                        isExpired ? 'bg-rose-600' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base flex items-center gap-2">
                          Vigencia de Firma Electrónica (.p12)
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          Información del certificado digital registrada y validada en base de datos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        isExpired
                          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700'
                          : isExpiringSoon
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700'
                      }`}>
                        {isExpired ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isExpired ? 'EXPIRADA / VENCIDA' : isExpiringSoon ? 'PRÓXIMA A VENCER' : 'ACTIVA Y VIGENTE'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                        <Database className="w-3 h-3" /> Guardado en BD
                      </span>
                    </div>
                  </div>

                  {/* VIGENCIA COUNTDOWN & PROGRESS BAR */}
                  <div className="my-4 bg-white dark:bg-zinc-900/90 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>Tiempo Restante:</span>
                      </div>
                      <div className={`font-bold text-sm sm:text-base ${
                        isExpired ? 'text-rose-600 dark:text-rose-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isExpired 
                          ? `Expiró hace ${Math.abs(daysRemaining)} días` 
                          : `${daysRemaining} días restantes (${Math.max(1, Math.round(daysRemaining / 30))} meses aprox.)`}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isExpired ? 'bg-rose-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentRemaining}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-gray-500 dark:text-zinc-400 pt-0.5">
                      <span>Inicio: {fromDate.toLocaleDateString('es-EC')}</span>
                      <span>{percentRemaining}% de vigencia útil</span>
                      <span>Expiración: {toDate.toLocaleDateString('es-EC')}</span>
                    </div>
                  </div>

                  {/* METADATA DETALLADA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800">
                      <span className="text-gray-500 dark:text-zinc-400 block mb-0.5 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> Válido Desde
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {fromDate.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800">
                      <span className="text-gray-500 dark:text-zinc-400 block mb-0.5 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" /> Válido Hasta (Fecha de Expiración)
                      </span>
                      <span className={`font-semibold ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {toDate.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>

                    {activeSubject && (
                      <div className="bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <span className="text-gray-500 dark:text-zinc-400 block mb-0.5 font-medium flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" /> Propietario / Sujeto
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate block">
                          {activeSubject}
                        </span>
                      </div>
                    )}

                    {activeIssuer && (
                      <div className="bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <span className="text-gray-500 dark:text-zinc-400 block mb-0.5 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" /> Entidad Certificadora (Emisor)
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate block">
                          {activeIssuer}
                        </span>
                      </div>
                    )}

                    {activeSerialNumber && (
                      <div className="sm:col-span-2 bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <span className="text-gray-500 dark:text-zinc-400 block mb-0.5 font-medium">
                          Número Serial del Certificado
                        </span>
                        <span className="font-mono text-[11px] text-gray-700 dark:text-zinc-300 break-all select-all">
                          {activeSerialNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            } catch (e) {
              return null;
            }
          })()}
        </div>

      </div>

      {/* SECCIÓN SERVIDOR DE CORREO SMTP */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Servidor de Correo para Notificaciones a Clientes (SMTP)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure las credenciales de su correo (Gmail, Outlook, Yahoo, cPanel o SendGrid) para despachar automáticamente las facturas autorizadas (XML y PDF RIDE) directamente al correo del cliente.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSmtpHost('smtp.gmail.com');
                setSmtpPort('587');
                setSmtpUser(correo || 'mi_cuenta@gmail.com');
                setSmtpFrom(`${nombreComercial || 'JOLUS SERVICES'} <${correo || 'mi_cuenta@gmail.com'}>`);
              }}
              className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800/40 transition cursor-pointer"
              title="Cargar configuración rápida para Gmail"
            >
              Gmail
            </button>
            <button
              type="button"
              onClick={() => {
                setSmtpHost('smtp.office365.com');
                setSmtpPort('587');
                setSmtpUser(correo || 'mi_cuenta@outlook.com');
                setSmtpFrom(`${nombreComercial || 'JOLUS SERVICES'} <${correo || 'mi_cuenta@outlook.com'}>`);
              }}
              className="px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 rounded-lg border border-sky-200 dark:border-sky-800/40 transition cursor-pointer"
              title="Cargar configuración rápida para Outlook / Office 365"
            >
              Outlook
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Servidor SMTP Host</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="Ej: smtp.gmail.com o mail.midominio.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Puerto SMTP</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587 o 465"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Usuario / Email SMTP</label>
            <input
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="facturacion@midominio.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Contraseña de Aplicación / SMTP</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="Clave SMTP o Contraseña de Aplicación"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">Remitente Personalizado (De)</label>
            <input
              type="text"
              value={smtpFrom}
              onChange={(e) => setSmtpFrom(e.target.value)}
              placeholder='JOLUS SERVICES <factura@jolus.com.ec>'
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            💡 Instrucciones para cuentas Gmail:
          </p>
          <p>
            Si utiliza Gmail, active la Verificación en 2 Pasos en su cuenta de Google y genere una <strong>Contraseña de Aplicación</strong> de 16 caracteres (Seguridad &gt; Contraseñas de Aplicaciones) para ingresarla en la casilla de contraseña.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestSmtp}
            disabled={isTestingSmtp || !smtpHost || !smtpUser || !smtpPass}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {isTestingSmtp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Probando conexión con {smtpHost}...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Probar Conexión SMTP (Enviar Correo de Prueba)
              </>
            )}
          </button>
        </div>

        {smtpTestResult && (
          <div className={`p-4 rounded-xl border text-sm flex items-start gap-2 ${smtpTestResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-900 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300'}`}>
            {smtpTestResult.status === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{smtpTestResult.status === 'success' ? '¡Conexión SMTP exitosa!' : 'Inconveniente con el servidor SMTP'}</p>
              <p className="text-xs mt-0.5 leading-relaxed">{smtpTestResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* SAVING FEEDBACK & SUBMIT ACTION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="w-full sm:w-auto">
          {isSaving && (
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 text-xs sm:text-sm font-semibold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{saveMessage || 'Guardando nuevos parámetros de configuración...'}</span>
            </div>
          )}

          {saveSuccess && !isSaving && (
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 px-4 py-2.5 rounded-xl border border-green-200 dark:border-green-800 text-xs sm:text-sm font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{saveMessage || '¡Configuración guardada y sincronizada con éxito!'}</span>
            </div>
          )}

          {!isSaving && !saveSuccess && (
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Presione el botón para aplicar y guardar todos los cambios en la base de datos.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-8 rounded-xl shadow-md cursor-pointer transition text-sm flex items-center justify-center gap-2 shrink-0"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              Guardar Filtro de Configuración
            </>
          )}
        </button>
      </div>

    </form>
  );
}
