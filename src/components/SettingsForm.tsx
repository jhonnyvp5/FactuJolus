import React, { useState, useEffect } from 'react';
import { PortalUser, EmitterConfig, RegimenTributario } from '../types';
import { validateRuc, REGIMENES } from '../sri/utils';
import { getCertificateInfo } from '../sri/signer';
import { CheckCircle2, AlertCircle, Key, FileCode, Shield, RefreshCw, Trash2, Sparkles, Lock, Edit3, Check } from 'lucide-react';
import { saveEmitterConfigToSupabase } from '../lib/supabase';

interface SettingsFormProps {
  config: EmitterConfig;
  onSave: (newConfig: EmitterConfig) => void;
  currentUser?: PortalUser | null;
}

export default function SettingsForm({ config, onSave, currentUser }: SettingsFormProps) {
  const [ruc, setRuc] = useState(config.ruc);
  const [razonSocial, setRazonSocial] = useState(config.razonSocial);
  const [nombreComercial, setNombreComercial] = useState(config.nombreComercial);
  const [dirMatriz, setDirMatriz] = useState(config.dirMatriz);
  const [dirEstablecimiento, setDirEstablecimiento] = useState(config.dirEstablecimiento);
  const [codEstablecimiento, setCodEstablecimiento] = useState(config.codEstablecimiento);
  const [codPuntoEmision, setCodPuntoEmision] = useState(config.codPuntoEmision);
  const [correo, setCorreo] = useState(config.correo || '');
  const [telefono, setTelefono] = useState(config.telefono || '');
  const [obligadoContabilidad, setObligadoContabilidad] = useState(config.obligadoContabilidad);
  const [contribuyenteEspecial, setContribuyenteEspecial] = useState(config.contribuyenteEspecial || '');
  const [agenteRetencion, setAgenteRetencion] = useState(config.agenteRetencion || '');
  const [regimen, setRegimen] = useState<RegimenTributario>(config.regimen);
  const [ambiente, setAmbiente] = useState<'1' | '2'>(config.ambiente);
  const [isDemoMode, setIsDemoMode] = useState(config.isDemoMode);
  const [ultimoSecuencialFactura, setUltimoSecuencialFactura] = useState(config.ultimoSecuencialFactura || '000000002');

  // Digital Signature local assets
  const [password, setPassword] = useState(config.p12Password || '');
  const [signatureB64, setSignatureB64] = useState(config.p12FirmaB64 || '');
  const [signatureName, setSignatureName] = useState(config.p12Nombre || '');
  
  // Checking indicators
  const [isLoadingSig, setIsLoadingSig] = useState(false);
  const [sigDetails, setSigDetails] = useState<any>(null);
  const [sigError, setSigError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit/Lock toggle state for Emitter fields
  const [isEditingEmitter, setIsEditingEmitter] = useState<boolean>(() => {
    return !(config.ruc && config.razonSocial);
  });

  // Sync internal state ONLY when external config prop deeply changes
  const configKeyStr = JSON.stringify(config);
  React.useEffect(() => {
    setRuc(config.ruc || '');
    setRazonSocial(config.razonSocial || '');
    setNombreComercial(config.nombreComercial || '');
    setDirMatriz(config.dirMatriz || '');
    setDirEstablecimiento(config.dirEstablecimiento || '');
    setCodEstablecimiento(config.codEstablecimiento || '');
    setCodPuntoEmision(config.codPuntoEmision || '');
    setCorreo(config.correo || '');
    setTelefono(config.telefono || '');
    setObligadoContabilidad(config.obligadoContabilidad ?? true);
    setContribuyenteEspecial(config.contribuyenteEspecial || '');
    setAgenteRetencion(config.agenteRetencion || '');
    setRegimen(config.regimen || '');
    setAmbiente(config.ambiente || '1');
    setIsDemoMode(config.isDemoMode ?? true);
    setUltimoSecuencialFactura(config.ultimoSecuencialFactura || '');
    setPassword(config.p12Password || '');
    setSignatureB64(config.p12FirmaB64 || '');
    setSignatureName(config.p12Nombre || '');
    setSigDetails(null);
    setSigError(null);
  }, [configKeyStr]);

  const handleClearExampleData = () => {
    setRuc('');
    setRazonSocial('');
    setNombreComercial('');
    setDirMatriz('');
    setDirEstablecimiento('');
    setCodEstablecimiento('');
    setCodPuntoEmision('');
    setCorreo('');
    setTelefono('');
    setContribuyenteEspecial('');
    setAgenteRetencion('');
    setPassword('');
    setSignatureB64('');
    setSignatureName('');
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
    setSigDetails(null);

    // 1. Try server API endpoint
    try {
      const res = await fetch('/api/check-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p12Base64: signatureB64, password })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.status === 'success') {
          setSigDetails(result.info);
          setIsLoadingSig(false);
          return;
        } else if (result.message) {
          setSigError(result.message);
          setIsLoadingSig(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API check-signature network issue, using client-side validation fallback:', err);
    }

    // 2. Client-side fallback using forge directly in browser
    try {
      const info = getCertificateInfo(signatureB64, password);
      setSigDetails(info);
    } catch (err: any) {
      setSigError(err.message || 'No se pudo validar la firma electrónica con la contraseña proporcionada.');
    } finally {
      setIsLoadingSig(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ruc && !validateRuc(ruc)) {
      alert('¡El número de RUC no parece válido para el algoritmo oficial de Ecuador!');
    }

    const updatedConfig: EmitterConfig = {
      ruc,
      razonSocial,
      nombreComercial,
      dirMatriz,
      dirEstablecimiento,
      codEstablecimiento,
      codPuntoEmision,
      obligadoContabilidad,
      contribuyenteEspecial: contribuyenteEspecial,
      agenteRetencion: agenteRetencion,
      regimen,
      ambiente,
      isDemoMode,
      p12Nombre: signatureName,
      p12FirmaB64: signatureB64,
      p12Password: password,
      correo: correo,
      telefono: telefono,
      ultimoSecuencialFactura: ultimoSecuencialFactura ? ultimoSecuencialFactura.replace(/\D/g, '').padStart(9, '0') : '000000001',
      logoB64: config.logoB64
    };

    onSave(updatedConfig);
    await saveEmitterConfigToSupabase(updatedConfig);

    setIsEditingEmitter(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const rucValido = validateRuc(ruc);

  return (
    <form onSubmit={handleSubmit} id="settings-form" className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Configuración del Emisor
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure sus datos fiscales para el cálculo de claves de acceso y estructuración de los comprobantes XML del SRI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingEmitter(!isEditingEmitter)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isEditingEmitter 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
              }`}
              title={isEditingEmitter ? "Bloquear los campos del emisor" : "Habilitar la edición de los campos del emisor"}
            >
              {isEditingEmitter ? (
                <>
                  <Lock className="w-3.5 h-3.5" /> Bloquear Campos
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" /> Editar Formulario
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                handleClearExampleData();
                setIsEditingEmitter(true);
              }}
              disabled={!isEditingEmitter}
              className="px-3 py-1.5 text-xs font-medium text-red-650 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Borra todos los datos de ejemplo del formulario para escribir sus nuevos datos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar Datos
            </button>
            <button
              type="button"
              onClick={() => {
                handleLoadExampleData();
                setIsEditingEmitter(true);
              }}
              disabled={!isEditingEmitter}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800/40 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cargar datos de prueba de ejemplo"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar Ejemplo
            </button>
          </div>
        </div>

        {!isEditingEmitter && (
          <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 px-4 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-medium">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              Los campos de Configuración del Emisor están bloqueados. Haga clic en <strong>Editar Formulario</strong> para modificar.
            </span>
            <button
              type="button"
              onClick={() => setIsEditingEmitter(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" /> Desbloquear
            </button>
          </div>
        )}

        {/* MODO DE TRABAJO */}
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/40 dark:bg-indigo-950/20 dark:border-indigo-900/30 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Modo de Operación</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Simulador Informativo vs Modo Real</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isDemoMode 
                ? 'Modo Simulador activo: Genera XML oficial, simula firmas y replica las respuestas exactas de recepción y autorización del SRI sin enviar datos reales.' 
                : 'Modo Real activo: Envía los comprobantes firmados electrónicamente directamente a los servidores SOAP oficiales de Pruebas o Producción del SRI.'}
            </p>
          </div>
          <div className="flex bg-white dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700">
            <button
              type="button"
              disabled={!isEditingEmitter}
              onClick={() => setIsDemoMode(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition disabled:opacity-60 disabled:cursor-not-allowed ${isDemoMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
            >
              Simulador (Recomendado)
            </button>
            <button
              type="button"
              disabled={!isEditingEmitter}
              onClick={() => setIsDemoMode(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition disabled:opacity-60 disabled:cursor-not-allowed ${!isDemoMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
            >
              Conexión Real SRI
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RUC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">RUC del Emisor (13 dígitos)</label>
            <div className="relative">
              <input
                type="text"
                disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
              value={correo}
              onChange={(e) => setCorreo(e.target.value.toUpperCase())}
              placeholder="Ej. emisor@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-zinc-800/70"
            />
          </div>

          {/* Telefono Emisor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Teléfono (Contacto Emisor)</label>
            <input
              type="text"
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
              disabled={!isEditingEmitter}
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
                disabled={!isEditingEmitter}
                onClick={() => setAmbiente('1')}
                className={`py-2 text-xs font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed ${ambiente === '1' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
              >
                1 - Pruebas (CELCER)
              </button>
              <button
                type="button"
                disabled={!isEditingEmitter}
                onClick={() => setAmbiente('2')}
                className={`py-2 text-xs font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed ${ambiente === '2' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
              >
                2 - Producción (CEL)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN FIRMA ELECTRÓNICA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-500" />
            Certificado Digital de Firma Electrónica (.p12)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cargue su firma .p12 otorgada por entidades acreditadas en Ecuador (Uanataca, Consejo de la Judicatura, Security Data, etc.) para realizar las transacciones reales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Cargar Archivo de Firma (.p12 / .pfx)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700 hover:border-indigo-500">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <FileCode className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
                    {signatureName ? signatureName : 'Subir archivo .p12'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Drag and drop o click para buscar</p>
                </div>
                <input type="file" accept=".p12,.pfx" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Contraseña de la Firma</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduzca clave secreta de exportación"
                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={handleVerifySignature}
              disabled={isLoadingSig || !signatureB64}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${!signatureB64 ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'}`}
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

        {sigError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm flex gap-2 items-center dark:bg-red-950/20 dark:border-red-900/30">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{sigError}</span>
          </div>
        )}

        {sigDetails && (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-100 text-sm space-y-2 dark:bg-green-950/20 dark:border-green-900/30">
            <h4 className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Firma Electrónica Descifrada y Válida
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div><strong>Propietario (Sujeto):</strong> {sigDetails.subject}</div>
              <div><strong>Emisor (Autoridad):</strong> {sigDetails.issuer}</div>
              <div><strong>Valido Desde:</strong> {new Date(sigDetails.validFrom).toLocaleDateString()}</div>
              <div><strong>Válido Hasta (Expiración):</strong> {new Date(sigDetails.validTo).toLocaleDateString()}</div>
              <div className="sm:col-span-2"><strong>Número Serial:</strong> {sigDetails.serialNumber}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {saveSuccess && (
          <div className="text-sm text-green-600 font-semibold flex items-center gap-1 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" /> ¡Configuración guardada con éxito!
          </div>
        )}
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl shadow-md cursor-pointer transition text-sm"
        >
          Guardar Filtro de Configuración
        </button>
      </div>
    </form>
  );
}
