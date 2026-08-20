import React, { useState } from 'react';
import {
  Type,
  Search,
  RotateCcw,
  Check,
  Sparkles,
  MousePointerClick,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  Coins,
  Package,
  Users,
  Settings as SettingsIcon,
  Download,
  Send
} from 'lucide-react';
import { usePlatformSettings } from '../../context/PlatformSettingsContext';
import { modalAlert } from '../../context/ModalAlertContext';

interface TextKeyMeta {
  key: string;
  category: 'buttons' | 'titles' | 'general';
  label: string;
  defaultText: string;
  description: string;
}

const DICTIONARY_KEYS: TextKeyMeta[] = [
  // Buttons
  { key: 'btn_plans', category: 'buttons', label: 'Botón Catálogo de Planes', defaultText: 'Ver Planes de Facturación', description: 'Botón principal para ver los planes y precios de facturación SRI' },
  { key: 'btn_new_invoice', category: 'buttons', label: 'Botón Nueva Factura', defaultText: 'Emitir Factura', description: 'Botón principal para crear una factura' },
  { key: 'btn_sign_transmit', category: 'buttons', label: 'Botón Firmar y Transmitir', defaultText: 'Firmar y Transmitir al SRI', description: 'Botón de envío de comprobante con firma electrónica' },
  { key: 'btn_save_draft', category: 'buttons', label: 'Botón Guardar Borrador', defaultText: 'Guardar Borrador', description: 'Botón para guardar comprobante sin enviar al SRI' },
  { key: 'btn_new_nc', category: 'buttons', label: 'Botón Nueva Nota de Crédito', defaultText: 'Emitir Nota de Crédito', description: 'Botón para emitir una nota de crédito' },
  { key: 'btn_new_retention', category: 'buttons', label: 'Botón Nueva Retención', defaultText: 'Nueva Retención', description: 'Botón para crear un comprobante de retención' },
  { key: 'btn_new_proforma', category: 'buttons', label: 'Botón Nueva Proforma', defaultText: 'Generar Proforma', description: 'Botón para crear una cotización' },
  { key: 'btn_new_client', category: 'buttons', label: 'Botón Nuevo Cliente', defaultText: 'Nuevo Cliente', description: 'Botón para registrar un nuevo cliente' },
  { key: 'btn_new_product', category: 'buttons', label: 'Botón Nuevo Producto', defaultText: 'Nuevo Producto', description: 'Botón para agregar un producto al catálogo' },
  { key: 'btn_download_ride', category: 'buttons', label: 'Botón Descargar RIDE', defaultText: 'Descargar RIDE (PDF)', description: 'Botón para descargar el PDF RIDE autorizado' },
  { key: 'btn_download_xml', category: 'buttons', label: 'Botón Descargar XML', defaultText: 'Descargar XML Firmado', description: 'Botón para descargar el archivo XML firmado' },
  { key: 'btn_send_email', category: 'buttons', label: 'Botón Enviar Correo', defaultText: 'Enviar Comprobante por Correo', description: 'Botón para enviar comprobante al cliente' },
  { key: 'btn_login', category: 'buttons', label: 'Botón Iniciar Sesión', defaultText: 'Ingresar al Sistema', description: 'Botón de login en la pantalla de bienvenida' },
  { key: 'btn_logout', category: 'buttons', label: 'Botón Cerrar Sesión', defaultText: 'Salir', description: 'Botón de desautenticación en el menú' },

  // Titles & Subtitles
  { key: 'title_history', category: 'titles', label: 'Título: Historial de Comprobantes', defaultText: 'Historial de Comprobantes', description: 'Encabezado principal en la vista de historial' },
  { key: 'subtitle_history', category: 'titles', label: 'Subtítulo: Historial de Comprobantes', defaultText: 'Consulta, reenvío y descarga de comprobantes emitidos ante el SRI', description: 'Descripción bajo el título del historial' },
  { key: 'title_new_invoice', category: 'titles', label: 'Título: Nueva Factura', defaultText: 'Emisión de Factura Electrónica', description: 'Encabezado principal del formulario de facturación' },
  { key: 'subtitle_new_invoice', category: 'titles', label: 'Subtítulo: Nueva Factura', defaultText: 'Genera facturas con cálculo automático de impuestos y firma digital XAdES-BES', description: 'Descripción de emisión de factura' },
  { key: 'title_new_nc', category: 'titles', label: 'Título: Nota de Crédito', defaultText: 'Emisión de Nota de Crédito', description: 'Encabezado principal de notas de crédito' },
  { key: 'subtitle_new_nc', category: 'titles', label: 'Subtítulo: Nota de Crédito', defaultText: 'Modifica o anula valores de facturas autorizadas previamente por el SRI', description: 'Descripción de notas de crédito' },
  { key: 'title_retentions', category: 'titles', label: 'Título: Retenciones SRI', defaultText: 'Comprobantes de Retención Electrónica', description: 'Encabezado principal de retenciones' },
  { key: 'subtitle_retentions', category: 'titles', label: 'Subtítulo: Retenciones SRI', defaultText: 'Emisión de retenciones en la fuente de Impuesto a la Renta e IVA', description: 'Descripción de retenciones' },
  { key: 'title_proformas', category: 'titles', label: 'Título: Proformas y Cotizaciones', defaultText: 'Cotizaciones y Proformas Comerciales', description: 'Encabezado principal de proformas' },
  { key: 'subtitle_proformas', category: 'titles', label: 'Subtítulo: Proformas y Cotizaciones', defaultText: 'Crea proformas con conversión directa a factura electrónica', description: 'Descripción de cotizaciones' },
  { key: 'title_products', category: 'titles', label: 'Título: Catálogo de Productos', defaultText: 'Catálogo de Productos y Servicios', description: 'Encabezado de productos' },
  { key: 'subtitle_products', category: 'titles', label: 'Subtítulo: Catálogo de Productos', defaultText: 'Administra precios, tarifas IVA y códigos principales', description: 'Descripción de inventario' },
  { key: 'title_clients', category: 'titles', label: 'Título: Directorio de Clientes', defaultText: 'Directorio de Clientes', description: 'Encabezado de clientes' },
  { key: 'subtitle_clients', category: 'titles', label: 'Subtítulo: Directorio de Clientes', defaultText: 'Gestiona datos tributarios de clientes para emisión rápida', description: 'Descripción de clientes' },
];

export function TextDictionaryEditor() {
  const { settings, updateSettings } = usePlatformSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'buttons' | 'titles'>('all');

  const textOverrides = settings.textOverrides || {};

  const handleUpdateText = (key: string, value: string) => {
    updateSettings({
      textOverrides: {
        ...textOverrides,
        [key]: value
      }
    });
  };

  const handleResetSingle = (key: string, defaultText: string) => {
    const next = { ...textOverrides };
    delete next[key];
    updateSettings({ textOverrides: next });
    modalAlert.info('Texto Restablecido', `Se ha restaurado el valor predeterminado.`);
  };

  const handleResetAllTexts = () => {
    const confirmed = window.confirm('¿Deseas restablecer todos los nombres de botones, títulos y subtítulos a sus valores por defecto?');
    if (!confirmed) return;
    updateSettings({ textOverrides: {} });
    modalAlert.success('Textos Restablecidos', 'Todos los nombres de botones y títulos han sido restaurados.');
  };

  const filteredList = DICTIONARY_KEYS.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (textOverrides[item.key] || item.defaultText).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider">
            <Type className="w-3.5 h-3.5" />
            <span>Nombres de Botones, Títulos & Subtítulos</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Diccionario y Editor de Textos Global
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Modifica los nombres de los botones de acción, títulos y subtítulos de toda la plataforma. Todos los cambios se reflejan en tiempo real en la aplicación.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAllTexts}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Todos los Textos</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            Todos ({DICTIONARY_KEYS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('buttons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'buttons'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Botones de Acción ({DICTIONARY_KEYS.filter(k => k.category === 'buttons').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('titles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'titles'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Títulos & Subtítulos ({DICTIONARY_KEYS.filter(k => k.category === 'titles').length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar texto o botón..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs focus:outline-blue-500"
          />
        </div>
      </div>

      {/* Grid of Dictionary Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((item) => {
          const currentValue = textOverrides[item.key] !== undefined ? textOverrides[item.key] : item.defaultText;
          const isModified = textOverrides[item.key] !== undefined && textOverrides[item.key] !== item.defaultText;

          return (
            <div
              key={item.key}
              className={`p-5 rounded-3xl border transition-all duration-200 space-y-3 ${
                isModified
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    {isModified && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white tracking-wider">
                        Personalizado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                    {item.description}
                  </p>
                </div>

                {isModified && (
                  <button
                    type="button"
                    onClick={() => handleResetSingle(item.key, item.defaultText)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="Restablecer a valor original"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleUpdateText(item.key, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                <span>Clave: <code className="font-mono text-slate-600 dark:text-zinc-400">{item.key}</code></span>
                <span>Original: "{item.defaultText}"</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
