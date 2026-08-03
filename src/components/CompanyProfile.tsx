import React, { useRef, useState } from 'react';
import { EmitterConfig, Invoice, Client, Product } from '../types';
import { User, Image, FileText, CheckCircle, ShieldCheck, Landmark, Palette, Check } from 'lucide-react';
import RideViewer from './RideViewer';
import { saveEmitterLogoToSupabase } from '../lib/supabase';

const TEMPLATES = [
  { id: 'oficial', name: 'Oficial SRI (Clásico)', desc: 'Diseño clásico estandarizado idéntico al PDF del SRI con columnas alternadas', color: 'from-gray-700 to-gray-800' },
  { id: 'vibrant_indigo', name: 'Índigo Moderno', desc: 'Esquema moderno con degradados y diseño de alta definición', color: 'from-indigo-600 to-indigo-800' },
  { id: 'emerald_premium', name: 'Esmeralda Premium', desc: 'Detalles corporativos sofisticados con marcas ejecutivas', color: 'from-emerald-600 to-emerald-800' },
  { id: 'carmesi_bento', name: 'Carmesí Bento', desc: 'Estructuración modular de paneles con temática colorida', color: 'from-rose-600 to-rose-800' },
  { id: 'carbono_minimal', name: 'Carbono Minimal', desc: 'Minimalismo y estética suiza de líneas limpias', color: 'from-zinc-800 to-zinc-950' },
  { id: 'nordic_amber', name: 'Ámbar Nórdico', desc: 'Minimalismo escandinavo con acentos cálidos y un acabado editorial sobresaliente', color: 'from-amber-500 to-amber-600' },
  { id: 'executive_blue', name: 'Azul Ejecutivo', desc: 'Precisión técnica helvética con azul profundo y un ordenado impecable', color: 'from-blue-700 to-blue-900' },
  { id: 'cyber_neon', name: 'Mint Tech Futurista', desc: 'Estilo neon-mint de alta definición tecnológica, idóneo para agencias, software y startups', color: 'from-emerald-450 to-teal-500 bg-linear-to-r' },
  { id: 'warm_editorial', name: 'Editorial Terracota', desc: 'Inspiración arquitectónica y galerías con finos acentos terracota y espaciado de alta costura', color: 'from-orange-600 to-amber-800' },
  { id: 'slate_lux', name: 'Pizarra de Lujo', desc: 'Estética de platino metálico y carbón mate para consultorías de prestigio y firmas corporativas', color: 'from-slate-700 to-slate-900' }
];

interface CompanyProfileProps {
  config: EmitterConfig;
  onSaveConfig: (updatedConfig: EmitterConfig) => void;
  currentUserEmail?: string;
}

export default function CompanyProfile({ config, onSaveConfig, currentUserEmail }: CompanyProfileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logoB64 || null);
  const [showModelPreview, setShowModelPreview] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const getUserStorageKey = (baseKey: string) => {
    if (!currentUserEmail) return baseKey;
    const safeEmail = currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${baseKey}_user_${safeEmail}`;
  };

  const [activeTemplate, setActiveTemplate] = useState<string>(() => {
    return localStorage.getItem(getUserStorageKey('sri_ride_selected_template')) || 'oficial';
  });

  // Sync state if config changes
  React.useEffect(() => {
    setLogoPreview(config.logoB64 || null);
  }, [config.logoB64]);

  // Sync activeTemplate when user changes
  React.useEffect(() => {
    setActiveTemplate(localStorage.getItem(getUserStorageKey('sri_ride_selected_template')) || 'oficial');
  }, [currentUserEmail]);

  const handleSelectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    localStorage.setItem(getUserStorageKey('sri_ride_selected_template'), templateId);
  };

  // Handle file logo load
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande (máximo 2MB). Elige una imagen pequeña (.png, .jpg).');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Formato inválido. Elige un archivo de tipo imagen (.png, .jpeg, .jpg).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setLogoPreview(b64);
      const updated = {
        ...config,
        logoB64: b64
      };
      onSaveConfig(updated);
      await saveEmitterLogoToSupabase(config.ruc, b64);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.onerror = () => {
      setUploadError('Error decodificando el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setLogoPreview(null);
    onSaveConfig({
      ...config,
      logoB64: undefined
    });
    await saveEmitterLogoToSupabase(config.ruc, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate a mock invoice structure for visualizing the "Modelo de Factura RIDE"
  const getMockInvoiceModel = (): Invoice => {
    const mockClient: Client = {
      id: 'c-mock',
      tipoIdentificacion: '05',
      identificacion: '1725619391',
      nombre: 'JUAN PÉREZ (CLIENTE MODELO DE PRUEBA)',
      direccion: 'Av. de los Shyris N34-102 y Portugal, Quito',
      telefono: '0995001000',
      correo: 'juan.perez@example.com'
    };

    const mockProduct1: Product = { id: 'p-m1', codigo: 'SOF-01', nombre: 'Servicio de Facturación Electrónica Integrada', precio: 80.00, ivaTipo: '4', descuentoDefault: 10 };
    const mockProduct2: Product = { id: 'p-m2', codigo: 'SOP-02', nombre: 'Soporte de Integración de Sistemas Especiales', precio: 20.00, ivaTipo: '0', descuentoDefault: 0 };

    return {
      id: 'mock-model-invoice',
      secuencial: '000000999',
      fechaEmision: new Date().toISOString().substring(0, 10),
      cliente: mockClient,
      detalles: [
        {
          id: 'dm-1',
          producto: mockProduct1,
          cantidad: 1,
          descuento: 10,
          subtotal: 70.00,
          ivaCalculado: 10.50, // 15% of 70
          total: 80.50
        },
        {
          id: 'dm-2',
          producto: mockProduct2,
          cantidad: 2,
          descuento: 0,
          subtotal: 40.00,
          ivaCalculado: 0.00,
          total: 40.00
        }
      ],
      formaPago: '20', // Otros con utilizacion del sistema financiero
      plazo: 15,
      unidadTiempo: 'dias',
      claveAcceso: '1006202601' + config.ruc + config.ambiente + '0010010000009991234567812',
      estado: 'Autorizado',
      fechaAutorizacion: new Date().toISOString(),
      numeroAutorizacion: '1006202601' + config.ruc + config.ambiente + '0010010000009991234567812',
      mensajesSRI: [{ mensaje: 'AUTORIZADO', tipo: 'INFORMATIVO' }],
      infoAdicional: [
        { id: 'ia-1', nombre: 'Email', valor: 'juan.perez@example.com' },
        { id: 'ia-2', nombre: 'Observación', valor: 'Este es un comprobante modelo interactivo de visualización RIDE' }
      ],
      resumenImpuestos: {
        base0: 40.00,
        baseIva: 70.00,
        valorIva: 10.50,
        subtotal: 110.00,
        descuento: 10.00,
        total: 120.50
      }
    };
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in" id="company-profile-box">
      
      {/* HEADER BAR */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-850">
        <h2 className="text-xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
          <User className="text-indigo-600 w-5.5 h-5.5" />
          Mi Perfil de Emisor (SRI)
        </h2>
        <p className="text-xs text-gray-500">
          Visualiza los datos tributarios autorizados y personaliza el logotipo oficial para los comprobantes electrónicos (RIDE).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LOGO ACTIONS BOX */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-805 pb-2 text-sm flex items-center gap-1.5">
              <Image className="w-4 h-4 text-indigo-650 text-indigo-600" />
              Logotipo Comercial
            </h3>

            <div className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-gray-50/50 dark:bg-zinc-950/20 text-center relative overflow-hidden group">
              {logoPreview ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <img
                    src={logoPreview}
                    alt="Uploaded Logo Preview"
                    className="max-h-24 max-w-[80%] object-contain rounded-lg drop-shadow-sm transition"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[10px] text-red-500 hover:text-red-700 font-semibold underline cursor-pointer"
                  >
                    Quitar logotipo de la base
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 text-gray-400">
                  <div className="mx-auto w-10 h-10 rounded-full bg-gray-150 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                    📷
                  </div>
                  <p className="text-[11px] font-semibold text-gray-650 dark:text-zinc-550">Sin logotipo comercial</p>
                  <p className="text-[9px] text-gray-400">Soporta formatos .jpg, .jpeg o .png (Máx 2MB)</p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="file-emit-logo"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition text-center text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                📥 Cargar Logo de Empresa
              </button>
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-500 font-medium bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100/50">
                ⚠️ {uploadError}
              </p>
            )}

            {uploadSuccess && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100/50 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> ¡Logotipo sincronizado!
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-805">
            <span className="text-[10px] text-gray-400 block leading-normal leading-relaxed">
              El logotipo cargado se codifica e incrusta automáticamente en el RIDE (Representación Impresa de Documentos Electrónicos), reflejándose con total fidelidad en las descargas de factura.
            </span>
          </div>
        </div>

        {/* PROFILE VISUALIZATION TABLE & MODEL RIDE INVOICE TRIGGER */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 md:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-805 pb-2 text-sm flex items-center gap-1.5">
              <Landmark className="w-4.5 h-4.5 text-indigo-650 text-indigo-600" />
              Ficha del Emisor autorizada por el SRI
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans leading-relaxed">
              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">RUC / Identificación tributaria</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">{config.ruc}</span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Régimen Impositivo</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {config.regimen.replace('_', ' ')}
                </span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20 sm:col-span-2">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Razón Social</span>
                <span className="font-bold text-gray-800 dark:text-gray-150">{config.razonSocial}</span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20 sm:col-span-2">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Nombre Comercial</span>
                <span className="font-medium text-gray-700 dark:text-zinc-300">{config.nombreComercial}</span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20 sm:col-span-2">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Dirección Matriz / Oficinas</span>
                <span className="text-gray-700 dark:text-zinc-300">{config.dirMatriz}</span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Punto de Emisión configurado</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {config.codEstablecimiento}-{config.codPuntoEmision}
                </span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Obligado a llevar Contabilidad</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {config.obligadoContabilidad ? 'SÍ' : 'NO'}
                </span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Correo Electrónico Emisor</span>
                <span className="font-medium text-gray-850 dark:text-gray-200">
                  {config.correo || 'No registrado'}
                </span>
              </div>

              <div className="bg-gray-50/50 dark:bg-zinc-950/10 p-3 rounded-xl border border-gray-250/20">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Siguiente Secuencial Factura</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {config.ultimoSecuencialFactura || '000000002'}
                </span>
              </div>
            </div>
          </div>

          {/* VISUAL MODELO FACTURA ACTION */}
          <div className="pt-4 border-t border-gray-100 dark:border-zinc-805 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                  Visualizador de Documentos Electrónicos
                </h4>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Visualiza el formato RIDE de prueba que recibirán tus clientes usando el diseño actualmente seleccionado: <strong className="text-indigo-600 dark:text-indigo-400">{TEMPLATES.find(t => t.id === activeTemplate)?.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModelPreview(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Visualizar RIDE Seleccionado ({TEMPLATES.find(t => t.id === activeTemplate)?.name})
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SECCIÓN DETALLADA DE SELECCIÓN DE DISEÑO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6" id="ride-design-selector-box">
        <div>
          <h3 className="text-lg font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
            <Palette className="text-indigo-650 text-indigo-600 w-5.5 h-5.5" />
            Configurar y Seleccionar Diseño de Factura RIDE
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Selecciona el diseño visual definitivo para tus comprobantes autorizados. El estilo escogido se reflejará instantáneamente en todas las facturas y notas de crédito en PDF, descargas de correo, y soportes físicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => {
            const isSelected = activeTemplate === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`group relative p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between h-40 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/15 dark:bg-indigo-950/20'
                    : 'border-gray-150 bg-white hover:bg-gray-50 dark:border-zinc-850 dark:bg-zinc-950/25 dark:hover:bg-zinc-900'
                }`}
              >
                {/* Visual palette indicators */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-xs text-gray-950 dark:text-gray-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition uppercase tracking-wide text-left">
                      {tmpl.name}
                    </span>
                    {isSelected ? (
                      <span className="bg-indigo-600 text-white p-1 rounded-full text-xs flex items-center justify-center w-5 h-5">
                        <Check className="w-3 h-3 font-bold" />
                      </span>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-zinc-700 hover:border-indigo-400 transition" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-450 dark:text-zinc-400 leading-snug text-left">
                    {tmpl.desc}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-1.5">
                    {/* Visual representative bullets */}
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${tmpl.color}`} />
                    <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-zinc-750" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'
                  }`}>
                    {isSelected ? '✓ Activo' : 'Hacer Activo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL POPUP RIDE FOR MODEL PREVIEW */}
      {showModelPreview && (
        <RideViewer
          document={getMockInvoiceModel()}
          config={config}
          onClose={() => setShowModelPreview(false)}
        />
      )}

    </div>
  );
}
