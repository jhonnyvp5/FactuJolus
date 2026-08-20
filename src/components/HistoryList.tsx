import React, { useState } from 'react';
import { Invoice, CreditNote, EmitterConfig, SriMessage } from '../types';
import { generateInvoiceXml, generateCreditNoteXml } from '../sri/xmlTemplates';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Send, 
  Download, 
  Printer, 
  AlertTriangle, 
  Trash2, 
  Mail, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Info,
  ShieldAlert,
  FileCheck2,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertOctagon,
  Cpu,
  Key,
  FileEdit,
  Layers,
  Activity,
  Copy,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { apiSignXml, apiSendSri, apiAuthorizeSri, apiSendInvoiceEmail } from '../lib/apiClient';

interface HistoryListProps {
  config: EmitterConfig;
  invoices: Invoice[];
  creditNotes: CreditNote[];
  onUpdateInvoice: (index: string, updated: Partial<Invoice>) => void;
  onUpdateCreditNote: (index: string, updated: Partial<CreditNote>) => void;
  onDeleteInvoice: (id: string, secuencial?: string, claveAcceso?: string) => void;
  onDeleteCreditNote: (id: string, secuencial?: string, claveAcceso?: string) => void;
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
  const [selectedDiagnosticDoc, setSelectedDiagnosticDoc] = useState<Invoice | CreditNote | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Sorting state for History Grid
  const [sortField, setSortField] = useState<'secuencial' | 'fechaEmision' | 'cliente' | 'total' | 'estado' | 'tipo'>('fechaEmision');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'secuencial' | 'fechaEmision' | 'cliente' | 'total' | 'estado' | 'tipo') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  // Sort according to active sortField and sortDirection
  filteredDocuments.sort((a, b) => {
    const isInvoiceA = !('facturaModificadaSecuencial' in a);
    const isInvoiceB = !('facturaModificadaSecuencial' in b);

    let valA: any = '';
    let valB: any = '';

    if (sortField === 'tipo') {
      valA = isInvoiceA ? 'Factura' : 'Nota Cred';
      valB = isInvoiceB ? 'Factura' : 'Nota Cred';
    } else if (sortField === 'secuencial') {
      valA = a.secuencial;
      valB = b.secuencial;
    } else if (sortField === 'fechaEmision') {
      valA = a.fechaEmision;
      valB = b.fechaEmision;
    } else if (sortField === 'cliente') {
      valA = (a.cliente.nombre || '').toLowerCase();
      valB = (b.cliente.nombre || '').toLowerCase();
    } else if (sortField === 'total') {
      valA = a.resumenImpuestos.total || 0;
      valB = b.resumenImpuestos.total || 0;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    } else if (sortField === 'estado') {
      valA = a.estado || '';
      valB = b.estado || '';
    }

    const cmp = String(valA).localeCompare(String(valB));
    return sortDirection === 'asc' ? cmp : -cmp;
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
    setSelectedDiagnosticDoc(null);

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
        const errorMsg = `Error de Firma Electrónica: ${signData.message || 'Contraseña inválida o certificado .p12 no encontrado'}`;
        const errObj: SriMessage[] = [{ identificador: 'FIRMA_ERR', mensaje: errorMsg, tipo: 'ERROR' }];
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'Borrador', mensajesSRI: errObj });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'Borrador', mensajesSRI: errObj });
        }
        throw new Error(errorMsg);
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
        const errorMsg = `Error de conexión SRI: ${sendResult.message || 'Sin respuesta de recepción'}`;
        const errObj: SriMessage[] = [{ identificador: 'CONN_ERR', mensaje: errorMsg, tipo: 'ERROR' }];
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'Borrador', mensajesSRI: errObj });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'Borrador', mensajesSRI: errObj });
        }
        throw new Error(errorMsg);
      }

      const recepcion = sendResult.data;
      if (recepcion.estado === 'DEVUELTA') {
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'Devuelto', mensajesSRI: recepcion.mensajes });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'Devuelto', mensajesSRI: recepcion.mensajes });
        }
        alert(`❌ Comprobante RECHAZADO (DEVUELTO) por el SRI. Revise la columna de Diagnóstico.`);
        return;
      }

      // If connection was offline/timeout/error
      if (recepcion.estado === 'ERROR_CONEXION') {
        const fallbackMsg: SriMessage[] = recepcion.mensajes && recepcion.mensajes.length > 0 
          ? recepcion.mensajes 
          : [{ identificador: 'TIMEOUT', mensaje: 'SRI fuera de línea o tiempo de espera agotado (Timeout)', tipo: 'ERROR' }];
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'Borrador', mensajesSRI: fallbackMsg });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'Borrador', mensajesSRI: fallbackMsg });
        }
        alert('⚠️ El SRI se encuentra fuera de línea o hubo un timeout. Comprobante guardado en borrador para reintento.');
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
        const errorMsg = `Error consultando autorización: ${authResult.message || 'Sin respuesta'}`;
        const errObj: SriMessage[] = [{ identificador: 'AUTH_ERR', mensaje: errorMsg, tipo: 'ERROR' }];
        if (isInvoice) {
          onUpdateInvoice(doc.id, { mensajesSRI: errObj });
        } else {
          onUpdateCreditNote(doc.id, { mensajesSRI: errObj });
        }
        throw new Error(errorMsg);
      }

      const autorizacion = authResult.data;
      if (autorizacion.estado === 'AUTORIZADO') {
        if (isInvoice) {
          const updatedInv: Invoice = {
            ...(doc as Invoice),
            estado: 'Autorizado',
            fechaAutorizacion: autorizacion.fechaAutorizacion,
            numeroAutorizacion: autorizacion.numeroAutorizacion,
            mensajesSRI: autorizacion.mensajes || []
          };
          onUpdateInvoice(doc.id, updatedInv);

          // Auto-send email notification to client
          apiSendInvoiceEmail(updatedInv, config).catch(err => console.warn('Error en despacho automático de correo:', err));

        } else {
          onUpdateCreditNote(doc.id, {
            estado: 'Autorizado',
            fechaAutorizacion: autorizacion.fechaAutorizacion,
            numeroAutorizacion: autorizacion.numeroAutorizacion,
            mensajesSRI: autorizacion.mensajes || []
          });
        }
        alert(`✅ ¡Comprobante ${isInvoice ? 'Factura' : 'Nota de Crédito'} #${doc.secuencial} AUTORIZADO con éxito por el SRI!\n${isInvoice ? '📧 Notificación enviada a: ' + doc.cliente.correo : ''}`);
      } else {
        if (isInvoice) {
          onUpdateInvoice(doc.id, { estado: 'No Autorizado', mensajesSRI: autorizacion.mensajes });
        } else {
          onUpdateCreditNote(doc.id, { estado: 'No Autorizado', mensajesSRI: autorizacion.mensajes });
        }
        alert(`❌ Comprobante No Autorizado por el SRI. Revise los motivos en la columna de Diagnóstico.`);
      }

    } catch (err: any) {
      const errorMsg = err.message || String(err);
      const errObj: SriMessage[] = [{ identificador: 'SYS_ERR', mensaje: errorMsg, tipo: 'ERROR' }];
      if (isInvoice) {
        onUpdateInvoice(doc.id, { mensajesSRI: errObj });
      } else {
        onUpdateCreditNote(doc.id, { mensajesSRI: errObj });
      }
      alert(`Ocurrió un inconveniente: ${errorMsg}`);
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

  const handleDelete = async (doc: Invoice | CreditNote) => {
    const isInvoice = !('facturaModificadaSecuencial' in doc);
    if (!confirm(`¿Está seguro de eliminar el comprobante ${isInvoice ? 'Factura' : 'Nota de Crédito'} #${doc.secuencial}?\n\nEsta acción borrará el registro de la base de datos y eliminará automáticamente el PDF y los archivos XMLs generados en los buckets de almacenamiento.`)) {
      return;
    }
    if (isInvoice) {
      onDeleteInvoice(doc.id, doc.secuencial, doc.claveAcceso);
    } else {
      onDeleteCreditNote(doc.id, doc.secuencial, doc.claveAcceso);
    }
    setSelectedIds(prev => prev.filter(id => id !== doc.id));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`¿Está seguro de eliminar los ${selectedIds.length} comprobantes seleccionados?\n\nSe eliminarán de la base de datos junto con sus archivos PDF y XMLs asociados en los buckets de Storage.`)) {
      return;
    }
    let countInvoices = 0;
    let countNCs = 0;
    selectedIds.forEach(id => {
      const inv = invoices.find(i => i.id === id);
      const nc = creditNotes.find(n => n.id === id);
      if (inv) {
        onDeleteInvoice(id, inv.secuencial, inv.claveAcceso);
        countInvoices++;
      } else if (nc) {
        onDeleteCreditNote(id, nc.secuencial, nc.claveAcceso);
        countNCs++;
      }
    });

    setSelectedIds([]);
    alert(`Se eliminaron con éxito ${countInvoices + countNCs} comprobantes y sus archivos PDF/XML asociados en los buckets.`);
  };

  // Get visible documents that are deletable (Borrador, Devuelto, No Autorizado)
  const deletableDocs = filteredDocuments.filter(doc =>
    doc.estado === 'Borrador' || doc.estado === 'Devuelto' || doc.estado === 'No Autorizado'
  );

  // Helper to render high-tech diagnostic / failure reason text and tags
  const renderDiagnosticColumn = (doc: Invoice | CreditNote) => {
    const hasErrors = doc.estado === 'Devuelto' || 
                      doc.estado === 'No Autorizado' || 
                      (doc.mensajesSRI && doc.mensajesSRI.some(m => m.tipo === 'ERROR' || m.identificador === 'FIRMA_ERR' || m.identificador === 'TIMEOUT'));

    // CASO 1: AUTORIZADO Y CORRECTO (VERDE)
    if (doc.estado === 'Autorizado') {
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 font-bold text-[11px] shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Correcto SRI</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDiagnosticDoc(doc)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 dark:bg-zinc-800 dark:text-emerald-300 dark:border-emerald-800/80 dark:hover:bg-emerald-950/40 transition shadow-2xs cursor-pointer"
            title="Ver detalle completo de la autorización SRI"
          >
            <Info className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Ver detalle</span>
          </button>
        </div>
      );
    }

    // CASO 2: ERROR / RECHAZADO / OBSERVACIÓN (ROJO)
    if (hasErrors || (doc.mensajesSRI && doc.mensajesSRI.length > 0)) {
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 font-bold text-[11px] shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{doc.estado === 'Devuelto' ? 'Rechazado SRI' : (doc.estado === 'No Autorizado' ? 'No Autorizado' : 'Con Problema')}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDiagnosticDoc(doc)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 dark:bg-zinc-800 dark:text-rose-300 dark:border-rose-800/80 dark:hover:bg-rose-950/40 transition shadow-2xs cursor-pointer"
            title="Ver diagnóstico completo del SRI y mensajes de error"
          >
            <Info className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Ver detalle</span>
          </button>
        </div>
      );
    }

    // CASO 3: EN PROCESO DE RECEPCIÓN (AZUL)
    if (doc.estado === 'Enviado') {
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 font-bold text-[11px] shadow-2xs">
            <RefreshCw className="w-3 h-3 animate-spin text-sky-600 dark:text-sky-400 shrink-0" />
            <span>En Proceso SRI</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDiagnosticDoc(doc)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-sky-700 bg-white hover:bg-sky-50 border border-sky-300 dark:bg-zinc-800 dark:text-sky-300 dark:border-sky-800/80 dark:hover:bg-sky-950/40 transition shadow-2xs cursor-pointer"
            title="Ver estado de transmisión al SRI"
          >
            <Info className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Ver detalle</span>
          </button>
        </div>
      );
    }

    // CASO 4: FIRMADO ELECTRÓNICAMENTE (PÚRPURA)
    if (doc.estado === 'Firmado') {
      return (
        <div className="flex items-center gap-2 py-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 font-bold text-[11px] shadow-2xs">
            <FileCheck2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Firmado XAdES</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDiagnosticDoc(doc)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-50 border border-purple-300 dark:bg-zinc-800 dark:text-purple-300 dark:border-purple-800/80 dark:hover:bg-purple-950/40 transition shadow-2xs cursor-pointer"
            title="Ver detalles de la firma digital"
          >
            <Info className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>Ver detalle</span>
          </button>
        </div>
      );
    }

    // CASO 5: BORRADOR (GRIS/NEUTRO)
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700 font-bold text-[11px] shadow-2xs">
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Borrador</span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedDiagnosticDoc(doc)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-750 transition shadow-2xs cursor-pointer"
          title="Ver información del comprobante"
        >
          <Info className="w-3 h-3 text-slate-500" />
          <span>Ver detalle</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* TARJETAS DE SUMMARY CONTABLE - MODERNIZADAS & PROFESIONALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* CARD 1: FACTURACIÓN BRUTA */}
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-gray-200/80 dark:bg-zinc-900 dark:border-zinc-800 transition hover:shadow-sm hover:border-emerald-200 dark:hover:border-emerald-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Facturación Bruta</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              ${totalInvoiced.toFixed(2)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {authorizedInvoices.length} {authorizedInvoices.length === 1 ? 'Factura Autorizada' : 'Facturas Autorizadas'}
            </span>
          </div>
        </div>

        {/* CARD 2: AJUSTES NOTAS DE CRÉDITO */}
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-gray-200/80 dark:bg-zinc-900 dark:border-zinc-800 transition hover:shadow-sm hover:border-rose-200 dark:hover:border-rose-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Ajustes Notas Crédito</span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              -${totalRefunded.toFixed(2)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              {authorizedNCs.length} {authorizedNCs.length === 1 ? 'Nota de Crédito' : 'Notas de Crédito'}
            </span>
          </div>
        </div>

        {/* CARD 3: RESULTADOS NETOS */}
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-gray-200/80 dark:bg-zinc-900 dark:border-zinc-800 transition hover:shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Resultados Netos</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
              ${netEarnings.toFixed(2)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-600 bg-slate-50 dark:bg-zinc-800/80 dark:text-zinc-300 border border-slate-200/70 dark:border-zinc-700/60">
              <Activity className="w-3 h-3 text-indigo-500" /> Base imponible + IVA
            </span>
          </div>
        </div>

        {/* CARD 4: INCONCLUSOS / RECHAZADOS */}
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-gray-200/80 dark:bg-zinc-900 dark:border-zinc-800 transition hover:shadow-sm hover:border-amber-200 dark:hover:border-amber-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Inconclusos / Alertas</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                <AlertOctagon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                  <FileEdit className="w-3 h-3 text-slate-400" /> Borradores:
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                  {draftInvoices.length} <span className="text-slate-400 font-normal">(${totalDraftAmount.toFixed(0)})</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <XCircle className="w-3 h-3 text-rose-500" /> Devueltas:
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                  {devueltoInvoices.length} <span className="text-rose-500/70 font-normal">(${totalDevueltoAmount.toFixed(0)})</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> No Autoriz.:
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  {noAutorizadoInvoices.length} <span className="text-amber-500/70 font-normal">(${totalNoAutorizadoAmount.toFixed(0)})</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: AMBIENTE DE OPERACIÓN */}
        <div className="bg-white p-4.5 rounded-2xl shadow-xs border border-gray-200/80 dark:bg-zinc-900 dark:border-zinc-800 transition hover:shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Ambiente Operación</span>
              <div className={`p-1.5 rounded-lg border ${
                config.isDemoMode 
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40' 
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
              }`}>
                <Cpu className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="mt-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide uppercase border shadow-2xs ${
                config.isDemoMode 
                  ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' 
                  : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.isDemoMode ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${config.isDemoMode ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                </span>
                {config.isDemoMode ? 'SIMULADOR SRI' : `REAL · ${config.ambiente === '1' ? 'PRUEBAS' : 'PRODUCCIÓN'}`}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 dark:text-zinc-500">Firma .p12:</span>
            <span className={`inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded-md text-[10px] border ${
              config.isDemoMode 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900' 
                : (config.p12Nombre 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' 
                    : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900')
            }`}>
              <Key className="w-2.5 h-2.5" />
              {config.isDemoMode ? 'Simulada' : (config.p12Nombre ? 'Cargada' : 'No configurada')}
            </span>
          </div>
        </div>

      </div>

      {/* MODAL DETALLE DE DIAGNÓSTICO / AUTORIZACIÓN SRI */}
      {selectedDiagnosticDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
            
            {/* MODAL HEADER */}
            <div className={`p-5 flex items-center justify-between border-b ${
              selectedDiagnosticDoc.estado === 'Autorizado'
                ? 'bg-emerald-50/70 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                : selectedDiagnosticDoc.estado === 'Devuelto' || selectedDiagnosticDoc.estado === 'No Autorizado' || (selectedDiagnosticDoc.mensajesSRI && selectedDiagnosticDoc.mensajesSRI.some(m => m.tipo === 'ERROR'))
                ? 'bg-rose-50/70 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50'
                : 'bg-gray-50 border-gray-100 dark:bg-zinc-850 dark:border-zinc-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  selectedDiagnosticDoc.estado === 'Autorizado'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : selectedDiagnosticDoc.estado === 'Devuelto' || selectedDiagnosticDoc.estado === 'No Autorizado' || (selectedDiagnosticDoc.mensajesSRI && selectedDiagnosticDoc.mensajesSRI.some(m => m.tipo === 'ERROR'))
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                }`}>
                  {selectedDiagnosticDoc.estado === 'Autorizado' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : selectedDiagnosticDoc.estado === 'Devuelto' || selectedDiagnosticDoc.estado === 'No Autorizado' || (selectedDiagnosticDoc.mensajesSRI && selectedDiagnosticDoc.mensajesSRI.some(m => m.tipo === 'ERROR')) ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    <Info className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {selectedDiagnosticDoc.estado === 'Autorizado'
                      ? 'Detalle de Autorización SRI'
                      : selectedDiagnosticDoc.estado === 'Devuelto' || selectedDiagnosticDoc.estado === 'No Autorizado'
                      ? 'Diagnóstico y Observaciones SRI'
                      : 'Información del Comprobante'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono">
                    {('facturaModificadaSecuencial' in selectedDiagnosticDoc) ? 'Nota de Crédito' : 'Factura'} #{selectedDiagnosticDoc.secuencial} • Total: ${selectedDiagnosticDoc.resumenImpuestos.total.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDiagnosticDoc(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* CASO: AUTORIZADO */}
              {selectedDiagnosticDoc.estado === 'Autorizado' && (
                <div className="space-y-4">
                  {/* Banner de éxito */}
                  <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                        Comprobante Autorizado y Válido ante el SRI
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-0.5">
                        El documento tributario electrónico fue recibido, validado y autorizado formalmente con validez tributaria por el Servicio de Rentas Internas del Ecuador.
                      </p>
                    </div>
                  </div>

                  {/* Tarjetas de datos oficiales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Número de Autorización */}
                    <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-1 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                          Número de Autorización SRI
                        </span>
                        {selectedDiagnosticDoc.numeroAutorizacion && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedDiagnosticDoc.numeroAutorizacion || '', 'auth')}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            {copiedKey === 'auth' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'auth' ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        )}
                      </div>
                      <p className="font-mono text-xs font-bold text-gray-900 dark:text-zinc-100 break-all select-all">
                        {selectedDiagnosticDoc.numeroAutorizacion || selectedDiagnosticDoc.claveAcceso}
                      </p>
                    </div>

                    {/* Fecha de Autorización */}
                    <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-1">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                        Fecha y Hora de Autorización
                      </span>
                      <p className="font-mono text-xs font-semibold text-gray-900 dark:text-zinc-100">
                        {selectedDiagnosticDoc.fechaAutorizacion 
                          ? selectedDiagnosticDoc.fechaAutorizacion.replace('T', ' ').substring(0, 19)
                          : 'Registrada'}
                      </p>
                    </div>

                    {/* Ambiente SRI */}
                    <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-1">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                        Ambiente de Emisión
                      </span>
                      <p className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                        {config.isDemoMode ? 'SIMULADOR SRI' : (config.ambiente === '1' ? '1 - PRUEBAS (CELCER)' : '2 - PRODUCCIÓN')}
                      </p>
                    </div>

                    {/* Clave de Acceso SRI */}
                    <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-1 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                          Clave de Acceso SRI (49 Dígitos)
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedDiagnosticDoc.claveAcceso, 'clave')}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          {copiedKey === 'clave' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'clave' ? '¡Copiada!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-xs text-gray-800 dark:text-zinc-200 break-all select-all">
                        {selectedDiagnosticDoc.claveAcceso}
                      </p>
                    </div>

                    {/* Cliente / Receptor */}
                    <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-1 md:col-span-2">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                        Cliente Receptor
                      </span>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {selectedDiagnosticDoc.cliente.nombre} • <span className="font-mono">{selectedDiagnosticDoc.cliente.identificacion}</span>
                      </p>
                    </div>
                  </div>

                  {/* Mensajes adicionales informativos si existen */}
                  {selectedDiagnosticDoc.mensajesSRI && selectedDiagnosticDoc.mensajesSRI.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                        Mensajes adicionales del Web Service SRI:
                      </h5>
                      {selectedDiagnosticDoc.mensajesSRI.map((msg, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-mono space-y-1">
                          <div className="flex justify-between items-center text-gray-800 dark:text-zinc-200 font-bold">
                            <span>[{msg.identificador || 'INFO'}] - {msg.mensaje}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-sans">
                              {msg.tipo || 'INFORMATIVO'}
                            </span>
                          </div>
                          {msg.informacionAdicional && (
                            <p className="text-[11px] font-sans text-gray-600 dark:text-zinc-400 pt-0.5">
                              <strong>Info:</strong> {msg.informacionAdicional}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CASO: ERRORES / DEVUELTO / NO AUTORIZADO */}
              {(selectedDiagnosticDoc.estado === 'Devuelto' || selectedDiagnosticDoc.estado === 'No Autorizado' || (selectedDiagnosticDoc.mensajesSRI && selectedDiagnosticDoc.mensajesSRI.length > 0 && selectedDiagnosticDoc.estado !== 'Autorizado')) && (
                <div className="space-y-4">
                  {/* Banner de error */}
                  <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                        Observaciones / Rechazo del SRI o Proceso de Firma
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300/90 mt-0.5">
                        El proceso de validación o transmisión electrónica reportó las siguientes observaciones que impidieron la autorización del comprobante:
                      </p>
                    </div>
                  </div>

                  {/* Listado de mensajes de error */}
                  <div className="space-y-2.5">
                    {selectedDiagnosticDoc.mensajesSRI && selectedDiagnosticDoc.mensajesSRI.length > 0 ? (
                      selectedDiagnosticDoc.mensajesSRI.map((msg, index) => (
                        <div key={index} className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/40 space-y-1.5 shadow-2xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                                [{msg.identificador || 'N/A'}]
                              </span>
                              <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                                {msg.mensaje}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950 rounded text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                              {msg.tipo || 'ERROR'}
                            </span>
                          </div>
                          {msg.informacionAdicional && (
                            <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-sans bg-gray-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-gray-200/70 dark:border-zinc-750">
                              <strong className="text-gray-900 dark:text-zinc-100">Información Adicional:</strong> {msg.informacionAdicional}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl text-center text-xs text-gray-500">
                        No se registraron mensajes detallados de error adicionales.
                      </div>
                    )}
                  </div>

                  {/* Clave de Acceso para rastreo */}
                  <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                        Clave de Acceso Asociada (49 Dígitos)
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedDiagnosticDoc.claveAcceso, 'clave')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {copiedKey === 'clave' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'clave' ? '¡Copiada!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-xs text-gray-800 dark:text-zinc-200 break-all select-all">
                      {selectedDiagnosticDoc.claveAcceso}
                    </p>
                  </div>

                  {/* Guía rápida de solución */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <span className="font-bold block">💡 Recomendaciones de Solución:</span>
                    <ul className="list-disc list-inside space-y-1 text-amber-800/90 dark:text-amber-300/90">
                      <li>Si el error es <strong>[43] CLAVE EN PROCESAMIENTO</strong>: El SRI está ocupado; espere unos segundos y vuelva a presionar "Firmar y Enviar".</li>
                      <li>Si el error es <strong>[45] SECUENCIAL YA REGISTRADO</strong>: Este secuencial ya fue emitido previamente ante el SRI.</li>
                      <li>Si el error es de <strong>Firma Electrónica</strong>: Verifique en la pestaña "Configuración Emisor" que el certificado .p12 y la contraseña sean correctos.</li>
                      <li>Si el comprobante no es válido, puede eliminarlo con el botón de papelera y generar uno nuevo.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* CASO: BORRADOR / FIRMADO / ENVIADO */}
              {selectedDiagnosticDoc.estado !== 'Autorizado' && selectedDiagnosticDoc.estado !== 'Devuelto' && selectedDiagnosticDoc.estado !== 'No Autorizado' && (!selectedDiagnosticDoc.mensajesSRI || selectedDiagnosticDoc.mensajesSRI.length === 0) && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        Estado del Comprobante: {selectedDiagnosticDoc.estado}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                        {selectedDiagnosticDoc.estado === 'Enviado'
                          ? 'El comprobante fue transmitido con éxito al SRI y se encuentra en cola de autorización.'
                          : selectedDiagnosticDoc.estado === 'Firmado'
                          ? 'El XML está firmado digitalmente con estándar XAdES-BES y listo para transmitir.'
                          : 'El comprobante se encuentra en estado de borrador local listo para ser emitido.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                        Clave de Acceso SRI
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedDiagnosticDoc.claveAcceso, 'clave')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {copiedKey === 'clave' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'clave' ? '¡Copiada!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-xs text-gray-800 dark:text-zinc-200 break-all select-all">
                      {selectedDiagnosticDoc.claveAcceso}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-gray-50 dark:bg-zinc-850 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenRide(selectedDiagnosticDoc)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Ver RIDE PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDiagnosticDoc(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition cursor-pointer shadow-2xs"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* UNIFIED SINGLE CONTAINER: BUSCADOR + FILTROS + TABLA GRID */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden space-y-0">
        
        {/* TOP FILTER BAR INSIDE UNIFIED CONTAINER */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/40 dark:bg-zinc-900/80">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por RUC, cliente o secuencial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
            />
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center w-full md:w-auto">
            
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 p-1.5 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-medium">Tipo:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="p-1 px-2 border-0 bg-transparent text-xs text-gray-900 dark:text-zinc-100 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-zinc-800">Todos los Comprobantes</option>
                <option value="INVOICES" className="dark:bg-zinc-800">Solo Facturas</option>
                <option value="CREDIT_NOTES" className="dark:bg-zinc-800">Solo Notas de Crédito</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 p-1.5 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xs">
              <span className="font-medium">Estado SRI:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1 px-2 border-0 bg-transparent text-xs text-gray-900 dark:text-zinc-100 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-zinc-800">Cualquiera</option>
                <option value="Borrador" className="dark:bg-zinc-800">Borrador</option>
                <option value="Firmado" className="dark:bg-zinc-800">Firmado</option>
                <option value="Enviado" className="dark:bg-zinc-800">Enviado (Procesando)</option>
                <option value="Autorizado" className="dark:bg-zinc-800">Autorizado</option>
                <option value="Devuelto" className="dark:bg-zinc-800">Devuelto (Rechazado)</option>
                <option value="No Autorizado" className="dark:bg-zinc-800">No Autorizado</option>
              </select>
            </div>

          </div>

        </div>

        {/* BATCH ACTION CONTROLLER (INSIDE CONTAINER) */}
        {selectedIds.length > 0 && (
          <div className="bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 p-3.5 px-5 border-b border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row justify-between items-center gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Se han seleccionado <strong className="font-bold underline">{selectedIds.length}</strong> comprobantes para eliminar.
              </span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 border border-rose-300 dark:border-rose-800 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold text-rose-800 dark:text-rose-300 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar {selectedIds.length} Seleccionados
              </button>
            </div>
          </div>
        )}

        {/* TABLE COMPONENT */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-gray-50/80 dark:bg-zinc-800/90 text-gray-600 dark:text-zinc-400 text-xs font-semibold uppercase select-none border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
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
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                    title="Seleccionar todos los comprobantes eliminables"
                  />
                </th>
                <th 
                  onClick={() => handleSort('tipo')}
                  className="px-4 py-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Ordenar por Tipo"
                >
                  <div className="flex items-center gap-1">
                    <span>Tipo</span>
                    {sortField === 'tipo' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('secuencial')}
                  className="px-4 py-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Ordenar por Secuencial"
                >
                  <div className="flex items-center gap-1">
                    <span>Secuencial</span>
                    {sortField === 'secuencial' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('fechaEmision')}
                  className="px-4 py-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Ordenar por Fecha de Emisión"
                >
                  <div className="flex items-center gap-1">
                    <span>Fecha Emisión</span>
                    {sortField === 'fechaEmision' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cliente')}
                  className="px-4 py-3.5 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Ordenar por Cliente"
                >
                  <div className="flex items-center gap-1">
                    <span>Cliente / Comprador</span>
                    {sortField === 'cliente' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5">Usuario Emisor</th>
                <th 
                  onClick={() => handleSort('total')}
                  className="px-4 py-3.5 text-right cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Ordenar por Monto Total"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Monto Total ($)</span>
                    {sortField === 'total' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('estado')}
                  className="px-4 py-3.5 text-center cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Ordenar por Estado SRI"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Estado SRI</span>
                    {sortField === 'estado' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                {/* COLUMNA DE DIAGNÓSTICO / ESTADO SRI */}
                <th className="px-4 py-3.5 text-left min-w-[220px]">
                  <span>Diagnóstico / Mensaje SRI</span>
                </th>
                <th className="px-4 py-3.5 text-right">Acciones de Emisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-400 font-medium">
                    No se encontraron comprobantes fiscales emitidos. Cargue su configuración o emita una nueva factura.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map(doc => {
                  const isInvoice = !('facturaModificadaSecuencial' in doc);
                  const isProcessing = processingId === doc.id;

                  // High-tech modern tags styling
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      Borrador
                    </span>
                  );

                  if (doc.estado === 'Autorizado') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Autorizado
                      </span>
                    );
                  } else if (doc.estado === 'Devuelto') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Devuelto
                      </span>
                    );
                  } else if (doc.estado === 'No Autorizado') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        No Autorizado
                      </span>
                    );
                  } else if (doc.estado === 'Enviado') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 shadow-2xs">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin text-sky-500" />
                        Enviado
                      </span>
                    );
                  } else if (doc.estado === 'Firmado') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Firmado
                      </span>
                    );
                  }

                  return (
                    <tr key={doc.id} className="align-middle hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition">
                      
                      {/* CHECKBOX */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, doc.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== doc.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                        />
                      </td>

                      {/* TIPO COMPROBANTE BADGE */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg border shadow-2xs ${
                          isInvoice 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60' 
                            : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                        }`}>
                          {isInvoice ? 'Factura' : 'Nota Créd'}
                        </span>
                      </td>

                      {/* SECUENCIAL */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-xs text-gray-800 dark:text-zinc-200 bg-gray-100/80 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-gray-200/80 dark:border-zinc-700">
                          {config.codEstablecimiento}-{config.codPuntoEmision}-{doc.secuencial}
                        </span>
                      </td>

                      {/* FECHA EMISION */}
                      <td className="px-4 py-3.5 text-gray-700 dark:text-zinc-300 font-mono text-[11px]">
                        {doc.fechaEmision.split('-').reverse().join('/')}
                      </td>

                      {/* CLIENTE */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 max-w-[180px] truncate" title={doc.cliente.nombre}>
                          {doc.cliente.nombre}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{doc.cliente.identificacion}</div>
                      </td>

                      {/* USUARIO EMISOR - MODERN HIGH-TECH CHIP */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium font-sans text-cyan-800 dark:text-cyan-300 bg-cyan-50/70 dark:bg-cyan-950/30 rounded-lg border border-cyan-200/60 dark:border-cyan-800/50 shadow-2xs max-w-[180px] truncate" title={doc.creadorNombre || 'ADMINISTRADOR'}>
                          <User className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span className="truncate">{doc.creadorNombre || 'ADMIN'}</span>
                        </span>
                      </td>

                      {/* TOTAL */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-sm text-gray-900 dark:text-zinc-100">
                        ${doc.resumenImpuestos.total.toFixed(2)}
                      </td>

                      {/* ESTADO SRI */}
                      <td className="px-4 py-3.5 text-center">
                        {statusBadge}
                      </td>

                      {/* SOLICITUD 1: COLUMNA DIAGNÓSTICO / MOTIVO DE PROCESAMIENTO */}
                      <td className="px-4 py-3.5 whitespace-normal min-w-[300px] max-w-[480px] align-top">
                        {renderDiagnosticColumn(doc)}
                      </td>

                      {/* ACCIONES DE EMISOR */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex gap-1.5 justify-end items-center">
                          
                          {/* Botón Firmar y Enviar */}
                          {(doc.estado === 'Borrador' || doc.estado === 'Devuelto' || doc.estado === 'Firmado') && (
                            <button
                              type="button"
                              onClick={() => handleProcessDocument(doc)}
                              disabled={isProcessing}
                              className={`p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-1.5 text-[11px] cursor-pointer transition shadow-xs ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Firmar electrónicamente con certificado .p12 y transmitir al SRI"
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              {doc.estado === 'Firmado' ? 'Transmitir SRI' : 'Firmar y Enviar'}
                            </button>
                          )}

                          {/* Re-Consultar SRI */}
                          {doc.estado === 'Enviado' && (
                            <button
                              type="button"
                              onClick={() => handleProcessDocument(doc)}
                              disabled={isProcessing}
                              className="p-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold flex items-center gap-1.5 text-[11px] cursor-pointer transition shadow-xs"
                            >
                              <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                              Re-Consultar
                            </button>
                          )}

                          {/* RIDE PDF */}
                          <button
                            type="button"
                            onClick={() => onOpenRide(doc)}
                            className="p-1.5 px-2.5 border border-gray-200 hover:bg-gray-100 hover:text-indigo-600 dark:border-zinc-700 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl flex items-center gap-1 cursor-pointer text-[11px] transition shadow-2xs"
                            title="Ver e Imprimir Documento RIDE PDF Oficial"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-500" />
                            RIDE
                          </button>

                          {/* Enviar Correo */}
                          {isInvoice && (
                            <button
                              type="button"
                              onClick={() => handleSendEmail(doc as Invoice)}
                              disabled={sendingEmailId === doc.id}
                              className="p-1.5 px-2.5 border border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl flex items-center gap-1 cursor-pointer text-[11px] disabled:opacity-50 transition shadow-2xs"
                              title={`Enviar correo de notificación con factura adjunta (XML y PDF) a ${doc.cliente.correo || 'cliente'}`}
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-500" />
                              {sendingEmailId === doc.id ? 'Enviando...' : 'Enviar Correo'}
                            </button>
                          )}

                          {/* Descargar XML */}
                          {(doc.xml || doc.xmlFirmado) && (
                            <button
                              type="button"
                              onClick={() => downloadRawXml(doc)}
                              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition"
                              title="Descargar código XML oficial"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Eliminar Comprobante */}
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer transition"
                            title="Eliminar este comprobante y sus archivos PDF/XML en Storage"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

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
