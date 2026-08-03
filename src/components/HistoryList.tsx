import React, { useState } from 'react';
import { Invoice, CreditNote, EmitterConfig, EstadoComprobante } from '../types';
import { generateInvoiceXml, generateCreditNoteXml } from '../sri/xmlTemplates';
import { Search, Filter, RefreshCw, Send, ShieldCheck, Download, Printer, AlertTriangle, HelpCircle, ArrowDownCircle, Trash2, Mail } from 'lucide-react';
import { apiSignXml, apiSendSri, apiAuthorizeSri, apiSendInvoiceEmail } from '../lib/apiClient';

interface HistoryListProps {
  config: EmitterConfig;
  invoices: Invoice[];
  creditNotes: CreditNote[];
  onUpdateInvoice: (index: string, updated: Partial<Invoice>) => void;
  onUpdateCreditNote: (index: string, updated: Partial<CreditNote>) => void;
  onDeleteInvoice: (id: string) => void;
  onDeleteCreditNote: (id: string) => void;
  onOpenRide: (doc: Invoice | CreditNote) => void;
}

export default function HistoryList({
  config,
  invoices,
  creditNotes,
  onUpdateInvoice,
  onUpdateCreditNote,
  onDeleteInvoice,
  onDeleteCreditNote,
  onOpenRide
}: HistoryListProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INVOICES' | 'CREDIT_NOTES'>('ALL');

  // Selected document IDs for batch deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Loading states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [selectedErrorDoc, setSelectedErrorDoc] = useState<Invoice | CreditNote | null>(null);

  const handleSendEmail = async (doc: Invoice) => {
    try {
      setSendingEmailId(doc.id);
      const data = await apiSendInvoiceEmail(doc, config);
      if (data.status === 'success') {
        alert(`✅ Correo de Notificación de Documento Electrónico procesado exitosamente para ${doc.cliente.correo || 'cliente'}.\n\nIncluye los adjuntos XML y PDF RIDE.`);
      } else {
        alert(`⚠️ Inconveniente enviando correo: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Error al despachar el correo: ${err.message || String(err)}`);
    } finally {
      setSendingEmailId(null);
    }
  };

  // Combine into single document list Sorted by date descending
  const allDocuments: (Invoice | CreditNote)[] = [];
  if (typeFilter === 'ALL' || typeFilter === 'INVOICES') {
    allDocuments.push(...invoices);
  }
  if (typeFilter === 'ALL' || typeFilter === 'CREDIT_NOTES') {
    allDocuments.push(...creditNotes);
  }

  // Sort by ID or date descending
  allDocuments.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision) || b.secuencial.localeCompare(a.secuencial));

  // Filter list
  const filteredDocuments = allDocuments.filter(doc => {
    const isInvoice = !('facturaModificadaSecuencial' in doc);
    const clientName = (doc.cliente.nombre || '').toLowerCase();
    const clientIdent = (doc.cliente.identificacion || '');
    const seq = doc.secuencial;
    const cleanSearch = searchTerm.toLowerCase();

    const matchesSearch = clientName.includes(cleanSearch) || 
                          clientIdent.includes(cleanSearch) ||
                          seq.includes(cleanSearch) ||
                          doc.claveAcceso.includes(cleanSearch);
    
    const matchesStatus = statusFilter === 'ALL' || doc.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate cumulative stats
  const authorizedInvoices = invoices.filter(i => i.estado === 'Autorizado');
  const authorizedNCs = creditNotes.filter(n => n.estado === 'Autorizado');
  
  const totalInvoiced = authorizedInvoices.reduce((sum, item) => sum + item.resumenImpuestos.total, 0);
  const totalRefunded = authorizedNCs.reduce((sum, item) => sum + item.resumenImpuestos.total, 0);
  const netEarnings = totalInvoiced - totalRefunded;

  const draftInvoices = invoices.filter(i => i.estado === 'Borrador');
  const devueltoInvoices = invoices.filter(i => i.estado === 'Devuelto');
  const noAutorizadoInvoices = invoices.filter(i => i.estado === 'No Autorizado');

  const totalDraftAmount = draftInvoices.reduce((sum, item) => sum + item.resumenImpuestos.total, 0);
  const totalDevueltoAmount = devueltoInvoices.reduce((sum, item) => sum + item.resumenImpuestos.total, 0);
  const totalNoAutorizadoAmount = noAutorizadoInvoices.reduce((sum, item) => sum + item.resumenImpuestos.total, 0);

  // PIPELINE DE COMUNICACIÓN CON EL SRI
  const handleProcessDocument = async (doc: Invoice | CreditNote) => {
    const isInvoice = !('facturaModificadaSecuencial' in doc);
    setProcessingId(doc.id);
    setSelectedErrorDoc(null);

    try {
      // 1. Generate XML
      const rawXml = isInvoice 
        ? generateInvoiceXml(doc as Invoice, config)
        : generateCreditNoteXml(doc as CreditNote, config);

      // Save intermediate XML to state
      if (isInvoice) {
        onUpdateInvoice(doc.id, { xml: rawXml, estado: 'Borrador' });
      } else {
        onUpdateCreditNote(doc.id, { xml: rawXml, estado: 'Borrador' });
      }

      // 2. Sign XML via server or client fallback
      const signData = await apiSignXml(
        rawXml,
        config.isDemoMode ? undefined : config.p12FirmaB64,
        config.isDemoMode ? undefined : config.p12Password,
        config.isDemoMode
      );

      if (signData.status !== 'success' || !signData.signedXml) {
        throw new Error(`Error de Firma Electrónica: ${signData.message || 'Error al firmar'}`);
      }

      const signedXml = signData.signedXml;
      
      if (isInvoice) {
        onUpdateInvoice(doc.id, { xmlFirmado: signedXml, estado: 'Firmado' });
      } else {
        onUpdateCreditNote(doc.id, { xmlFirmado: signedXml, estado: 'Firmado' });
      }

      // 3. Transmit to SRI Reception soap endpoint
      const sendResult = await apiSendSri(signedXml, doc.claveAcceso, config.ambiente, config.isDemoMode);

      if (sendResult.status !== 'success' || !sendResult.data) {
        throw new Error(`Error de conexión SRI: ${sendResult.message || 'Sin respuesta'}`);
      }

      const recepcion = sendResult.data;
      if (recepcion.estado === 'DEVUELTA') {
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'Devuelto', mensajesSRI: recepcion.mensajes });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'Devuelto', mensajesSRI: recepcion.mensajes });
        }
        alert(`❌ Comprobante RECHAZADO (DEVUELTO) por el SRI. Revise los detalles.`);
        return;
      }

      // If connection was offline/error
      if (recepcion.estado === 'ERROR_CONEXION') {
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'Borrador', mensajesSRI: recepcion.mensajes });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'Borrador', mensajesSRI: recepcion.mensajes });
        }
        return;
      }

      // Move into sent/received state
      if (isInvoice) {
        onUpdateInvoice(doc.id, { estado: 'Enviado' });
      } else {
        onUpdateCreditNote(doc.id, { estado: 'Enviado' });
      }

      // 4. Query background authorization status
      const authResult = await apiAuthorizeSri(doc.claveAcceso, config.ambiente, config.isDemoMode);

      if (authResult.status !== 'success' || !authResult.data) {
        throw new Error(`Error consultando autorización: ${authResult.message || 'Sin respuesta'}`);
      }

      const autorizacion = authResult.data;
      if (autorizacion.estado === 'AUTORIZADO') {
        if (isInvoice) {
          const updatedInv = {
            ...doc,
            estado: 'Autorizado' as const,
            fechaAutorizacion: autorizacion.fechaAutorizacion,
            numeroAutorizacion: autorizacion.numeroAutorizacion,
            mensajesSRI: autorizacion.mensajes
          };
          onUpdateInvoice(doc.id, updatedInv);

          // Auto-send email notification to client
          apiSendInvoiceEmail(updatedInv, config).catch(err => console.warn('Error en despacho automático de correo:', err));

        } else {
          onUpdateCreditNote(doc.id, {
            estado: 'Autorizado',
            fechaAutorizacion: autorizacion.fechaAutorizacion,
            numeroAutorizacion: autorizacion.numeroAutorizacion,
            mensajesSRI: autorizacion.mensajes
          });
        }
        alert(`✅ ¡Comprobante ${isInvoice ? 'Factura' : 'Nota de Crédito'} #${doc.secuencial} AUTORIZADO con éxito por el SRI!\n${isInvoice ? '📧 Correo enviado a: ' + doc.cliente.correo : ''}`);
      } else {
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'No Autorizado', mensajesSRI: autorizacion.mensajes });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'No Autorizado', mensajesSRI: autorizacion.mensajes });
        }
        alert(`❌ Comprobante No Autorizado por motivos del SRI.`);
      }

    } catch (err: any) {
      alert(`Ocurrió un inconveniente: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const downloadRawXml = (doc: Invoice | CreditNote) => {
    const rawXml = doc.xmlFirmado || doc.xml;
    if (!rawXml) {
      alert('Debe procesar la firma del documento antes para generar el XML definitivo.');
      return;
    }
    const blob = new Blob([rawXml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRI_COMPROBANTE_${doc.secuencial}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (doc: Invoice | CreditNote) => {
    const isInvoice = !('facturaModificadaSecuencial' in doc);
    if (!confirm(`¿Está seguro de eliminar de su historial local el comprobante ${isInvoice ? 'Factura' : 'Nota de Crédito'} #${doc.secuencial}?`)) {
      return;
    }
    if (isInvoice) {
      onDeleteInvoice(doc.id);
    } else {
      onDeleteCreditNote(doc.id);
    }
    setSelectedIds(prev => prev.filter(id => id !== doc.id));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`¿Está seguro de eliminar de su historial local los ${selectedIds.length} comprobantes seleccionados? Esta acción es irreversible.`)) {
      return;
    }
    let countInvoices = 0;
    let countNCs = 0;
    selectedIds.forEach(id => {
      const isInv = invoices.some(i => i.id === id);
      const isNc = creditNotes.some(n => n.id === id);
      if (isInv) {
        onDeleteInvoice(id);
        countInvoices++;
      } else if (isNc) {
        onDeleteCreditNote(id);
        countNCs++;
      }
    });

    setSelectedIds([]);
    alert(`Se eliminaron con éxito ${countInvoices + countNCs} comprobantes.`);
  };

  // Get visible documents that are deletable (Borrador, Devuelto, No Autorizado)
  const deletableDocs = filteredDocuments.filter(doc =>
    doc.estado === 'Borrador' || doc.estado === 'Devuelto' || doc.estado === 'No Autorizado'
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* TARJETAS DE SUMMARY CONTABLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Facturación Bruta (SRI)</span>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white font-mono">${totalInvoiced.toFixed(2)}</div>
          <p className="text-[10px] text-green-600 mt-1 font-semibold">{authorizedInvoices.length} Facturas Autorizadas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Ajustes Notas de Crédito (-)</span>
          <div className="mt-2 text-2xl font-black text-red-600 font-mono">-${totalRefunded.toFixed(2)}</div>
          <p className="text-[10px] text-red-500 mt-1 font-semibold">{authorizedNCs.length} Directivas Modificadas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Resultados Netos</span>
          <div className="mt-2 text-2xl font-black text-indigo-650 font-mono text-indigo-600">${netEarnings.toFixed(2)}</div>
          <p className="text-[10px] text-gray-500 mt-1">Cálculos en base imponible + IVA</p>
        </div>

        {/* TARJETA SOLICITADA: BORRADOR, DEVUELTA, NO AUTORIZADO */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Inconclusos / Rechazados</span>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500 dark:text-zinc-400 font-medium">📝 Borradores:</span>
                <span className="font-mono font-bold text-gray-800 dark:text-zinc-200">
                  {draftInvoices.length} <span className="text-gray-400 font-normal">(${totalDraftAmount.toFixed(0)})</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500 dark:text-zinc-400 font-medium font-semibold text-red-600">❌ Devueltas:</span>
                <span className="font-mono font-bold text-red-650 dark:text-red-400">
                  {devueltoInvoices.length} <span className="text-red-500/80 font-normal">(${totalDevueltoAmount.toFixed(0)})</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500 dark:text-zinc-400 font-medium font-semibold text-amber-500">⚠️ No Autorizadas:</span>
                <span className="font-mono font-bold text-amber-650 dark:text-amber-400">
                  {noAutorizadoInvoices.length} <span className="text-amber-500/80 font-normal">(${totalNoAutorizadoAmount.toFixed(0)})</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Ambiente de Operación</span>
            <div className={`mt-1.5 text-xs font-mono font-bold uppercase inline-flex items-center px-1.5 py-0.5 rounded ${config.isDemoMode ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px]' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px]'}`}>
              {config.isDemoMode ? 'Simulación' : `REAL - ${config.ambiente === '1' ? 'SAND' : 'PROD'}`}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 leading-none mt-1">
            Firma: {config.isDemoMode ? 'Ninguna' : (config.p12Nombre ? 'Lista' : 'Sin *.p12')}
          </p>
        </div>

      </div>

      {/* BATCH ACTION CONTROLLER */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-300 p-4 rounded-2xl border border-red-200 dark:border-red-900/30 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 animate-bounce" />
            <span className="font-semibold">
              Se han seleccionado <strong className="font-bold underline">{selectedIds.length}</strong> comprobantes en estado Borrador, Devuelto o No Autorizado para eliminar.
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-300 transition cursor-pointer"
            >
              Cancelar Selección
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar {selectedIds.length} Seleccionados
            </button>
          </div>
        </div>
      )}

      {/* FILTER HEADER */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por RUC, cliente o secuencial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        </div>

        {/* Combobox Filters */}
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Tipo:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-xs text-gray-800 dark:text-zinc-200"
            >
              <option value="ALL">Todos los Comprobantes</option>
              <option value="INVOICES">Solo Facturas</option>
              <option value="CREDIT_NOTES">Solo Notas de Crédito</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>Estado SRI:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-xs text-gray-800 dark:text-zinc-200"
            >
              <option value="ALL">Cualquiera</option>
              <option value="Borrador">Borrador</option>
              <option value="Firmado">Firmado</option>
              <option value="Enviado">Enviado (Procesando)</option>
              <option value="Autorizado">Autorizado</option>
              <option value="Devuelto">Devuelto (Rechazado)</option>
              <option value="No Autorizado">No Autorizado</option>
            </select>
          </div>

        </div>

      </div>

      {/* DETALLE SRI ERROR DESCRIPCIÓN */}
      {selectedErrorDoc && (
        <div className="bg-red-50 text-red-900 p-5 rounded-2xl border border-red-150 space-y-2 dark:bg-red-950/20 dark:border-red-900/30">
          <div className="flex justify-between items-start">
            <h4 className="font-bold flex items-center gap-1 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Detalle de Observaciones de Rechazo SRI ({selectedErrorDoc.secuencial})
            </h4>
            <button
              onClick={() => setSelectedErrorDoc(null)}
              className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
            >
              Ocultar diagnóstico
            </button>
          </div>
          <p className="text-xs text-red-650 opacity-80 leading-normal">
            El validador de Facturación Electrónica del SRI devolvió los siguientes diagnósticos de error en la estructura:
          </p>
          <div className="space-y-2 font-mono text-xs pt-1">
            {selectedErrorDoc.mensajesSRI.map((msg, index) => (
              <div key={index} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-red-100/50 dark:border-red-900/10 space-y-1">
                <div className="font-bold text-red-700 dark:text-red-400 flex justify-between">
                  <span>[{msg.identificador || 'N/A'}] - {msg.mensaje}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-red-100 rounded text-red-800 dark:bg-red-950">{msg.tipo}</span>
                </div>
                {msg.informacionAdicional && (
                  <p className="text-[11px] text-gray-500 leading-normal font-sans pt-1">
                    <strong>Información Adicional SRI:</strong> {msg.informacionAdicional}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DASH TABLE HISTORIAL */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-5 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={deletableDocs.length > 0 && deletableDocs.every(d => selectedIds.includes(d.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(deletableDocs.map(d => d.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-gray-350 dark:border-zinc-705 dark:bg-zinc-800 cursor-pointer"
                    title="Seleccionar todos los comprobantes eliminables"
                  />
                </th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Est-PtoEmi-Secuencial</th>
                <th className="px-5 py-3">Fecha Emisión</th>
                <th className="px-5 py-3">Cliente / Comprador</th>
                <th className="px-5 py-3">Usuario Emisor</th>
                <th className="px-5 py-3 text-right">Monto Total ($)</th>
                <th className="px-5 py-3 text-center">Estado SRI</th>
                <th className="px-5 py-3 text-right">Acciones de Emisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-400 font-medium">
                    No se encontraron comprobantes fiscales emitidos. Cargue su configuración o emita una nueva factura.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map(doc => {
                  const isInvoice = !('facturaModificadaSecuencial' in doc);
                  const isProcessing = processingId === doc.id;
                  
                  // Color codes for actions and bubbles
                  let statusColor = 'bg-gray-100 text-gray-600';
                  if (doc.estado === 'Autorizado') statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold';
                  else if (doc.estado === 'Devuelto' || doc.estado === 'No Autorizado') statusColor = 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold';
                  else if (doc.estado === 'Enviado') statusColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
                  else if (doc.estado === 'Firmado') statusColor = 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400';

                  const canBeDeleted = doc.estado === 'Borrador' || doc.estado === 'Devuelto' || doc.estado === 'No Autorizado';

                  return (
                    <tr key={doc.id} className="align-middle hover:bg-gray-50/50 dark:hover:bg-zinc-850/30">
                      
                      {/* SELECT CHECKBOX COLUMN */}
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          disabled={!canBeDeleted}
                          checked={selectedIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, doc.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== doc.id));
                            }
                          }}
                          className={`rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-gray-350 dark:border-zinc-705 dark:bg-zinc-800 ${canBeDeleted ? 'cursor-pointer' : 'opacity-20 cursor-not-allowed'}`}
                        />
                      </td>

                      {/* TIPO */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg ${isInvoice ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                          {isInvoice ? 'Factura' : 'Nota Cred'}
                        </span>
                      </td>

                      {/* SECUENCIAL COMPLETO */}
                      <td className="px-5 py-4 font-mono font-bold text-gray-800 dark:text-zinc-200">
                        {config.codEstablecimiento}-{config.codPuntoEmision}-{doc.secuencial}
                      </td>

                      {/* FECHA EMISION */}
                      <td className="px-5 py-4">
                        {doc.fechaEmision.split('-').reverse().join('/')}
                      </td>

                      {/* CLIENTE DESCRIPCION */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 max-w-[180px] truncate" title={doc.cliente.nombre}>
                          {doc.cliente.nombre}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{doc.cliente.identificacion}</div>
                      </td>

                      {/* USUARIO EMISOR */}
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 font-sans font-semibold text-[10px] bg-indigo-50/50 text-indigo-700 dark:bg-zinc-800 dark:text-zinc-300 rounded border border-indigo-100/20 dark:border-zinc-700/80">
                          {doc.creadorNombre || 'ADMIN'}
                        </span>
                      </td>

                      {/* TOTAL DOLAR */}
                      <td className="px-5 py-4 text-right font-mono font-bold text-gray-900 dark:text-zinc-100">
                        ${doc.resumenImpuestos.total.toFixed(2)}
                      </td>

                      {/* ESTADO SRI */}
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold text-center ${statusColor}`}>
                          {doc.estado}
                        </span>
                        
                        {(doc.estado === 'Devuelto' || doc.estado === 'No Autorizado') && doc.mensajesSRI.length > 0 && (
                          <button
                            onClick={() => setSelectedErrorDoc(doc)}
                            className="ml-1.5 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer inline-flex align-middle"
                            title="Ver diagnóstico detallado SRI"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>

                      {/* ACCIONES DE EMISOR */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          
                          {/* 1-Click Sign and Send pipeline */}
                          {(doc.estado === 'Borrador' || doc.estado === 'Devuelto') && (
                            <button
                              onClick={() => handleProcessDocument(doc)}
                              disabled={isProcessing}
                              className={`p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Firmar y Enviar
                            </button>
                          )}

                          {/* Consult Authorization when already transmitted */}
                          {doc.estado === 'Enviado' && (
                            <button
                              onClick={() => handleProcessDocument(doc)}
                              disabled={isProcessing}
                              className="p-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 text-[11px] cursor-pointer transition"
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              Re-Consultar SRI
                            </button>
                          )}

                          {/* Ver RIDE PDF Print */}
                          <button
                            onClick={() => onOpenRide(doc)}
                            className="p-1 px-2.5 border border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-800 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
                          >
                            <Printer className="w-3 h-3 text-indigo-500" />
                            RIDE
                          </button>

                          {/* Email notification button for invoices */}
                          {isInvoice && (
                            <button
                              onClick={() => handleSendEmail(doc as Invoice)}
                              disabled={sendingEmailId === doc.id}
                              className="p-1 px-2 border border-blue-100 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg flex items-center gap-1 cursor-pointer text-[11px] disabled:opacity-50"
                              title={`Enviar correo de notificación con factura adjunta (XML y PDF) a ${doc.cliente.correo || 'cliente'}`}
                            >
                              <Mail className="w-3 h-3 text-blue-500" />
                              {sendingEmailId === doc.id ? 'Enviando...' : 'Enviar Correo'}
                            </button>
                          )}

                          {/* XML descriptor download */}
                          {(doc.xml || doc.xmlFirmado) && (
                            <button
                              onClick={() => downloadRawXml(doc)}
                              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                              title="Descargar código *.XML"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete local drafts, rejects, or unauthorized */}
                          {canBeDeleted && (
                            <button
                              onClick={() => handleDelete(doc)}
                              className="p-1 text-red-400 hover:text-red-750 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer animate-fade-in"
                              title="Eliminar este comprobante del historial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
