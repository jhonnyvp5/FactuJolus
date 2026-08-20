import React, { useState, useEffect, useMemo } from 'react';
import { 
  EmitterConfig, 
  Retention, 
  RetentionTax, 
  RetentionSustento, 
  Client, 
  Invoice,
  PortalUser, 
  AdicionalInfo, 
  EmpresaTenant 
} from '../types';
import { 
  generateClaveAcceso, 
  formatSequential, 
  IDENTIFICACIONES 
} from '../sri/utils';
import { generateRetentionXml } from '../sri/xmlTemplates';
import { 
  fetchRetencionesFromSupabase, 
  saveRetencionToSupabase, 
  deleteRetencionFromSupabase,
  uploadRetentionPdf,
  uploadRetentionXmlFirmado,
  uploadRetentionXmlSinFirmar
} from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';
import { modalAlert } from '../context/ModalAlertContext';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Send, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Eye, 
  Printer, 
  Building2, 
  Layers, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Receipt,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface RetentionManagerProps {
  config: EmitterConfig;
  clients: Client[];
  invoices?: Invoice[];
  currentUser?: PortalUser | null;
  currentEmpresa?: EmpresaTenant | null;
  onAddClient?: (client: Client) => void;
}

// Catálogo estándar SRI de códigos de retención
const SRI_CODIGOS_RENTA = [
  { codigo: '312', descripcion: 'Transferencia de bienes muebles de naturaleza corporal (1.75%)', porcentaje: 1.75 },
  { codigo: '343', descripcion: 'Otras retenciones en la fuente aplicables el 1.00%', porcentaje: 1.00 },
  { codigo: '344', descripcion: 'Otras retenciones en la fuente aplicables el 2.00%', porcentaje: 2.00 },
  { codigo: '304', descripcion: 'Servicios donde predomine el intelecto no profesionales (8.00%)', porcentaje: 8.00 },
  { codigo: '303', descripcion: 'Honorarios profesionales y demás servicios calificados (10.00%)', porcentaje: 10.00 },
  { codigo: '320', descripcion: 'Arrendamiento de bienes inmuebles (8.00%)', porcentaje: 8.00 },
  { codigo: '332', descripcion: 'Servicios donde predomine la mano de obra (2.00%)', porcentaje: 2.00 },
  { codigo: '310', descripcion: 'Actividades de construcción y obra material (1.75%)', porcentaje: 1.75 },
  { codigo: '322', descripcion: 'Seguros y reaseguros (1.00%)', porcentaje: 1.00 },
  { codigo: '3440', descripcion: 'Rendimientos financieros e intereses (2.00%)', porcentaje: 2.00 },
  { codigo: '323', descripcion: 'Servicios de docencia y capacitación (8.00%)', porcentaje: 8.00 }
];

const SRI_CODIGOS_IVA = [
  { codigo: '1', descripcion: 'Retención del 10% del IVA (Bienes)', porcentaje: 10.00 },
  { codigo: '2', descripcion: 'Retención del 20% del IVA (Servicios)', porcentaje: 20.00 },
  { codigo: '3', descripcion: 'Retención del 30% del IVA (Bienes transferidos)', porcentaje: 30.00 },
  { codigo: '7', descripcion: 'Retención del 70% del IVA (Servicios prestados)', porcentaje: 70.00 },
  { codigo: '8', descripcion: 'Retención del 100% del IVA (Honorarios profesionales, liquidaciones)', porcentaje: 100.00 }
];

const SRI_CODIGOS_ISD = [
  { codigo: '4580', descripcion: 'Impuesto a la Salida de Divisas (5.00%)', porcentaje: 5.00 }
];

export default function RetentionManager({
  config,
  clients,
  invoices = [],
  currentUser,
  currentEmpresa,
  onAddClient
}: RetentionManagerProps) {
  const [viewTab, setViewTab] = useState<'emit' | 'history'>('emit');
  const [retenciones, setRetenciones] = useState<Retention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form State
  const [secuencialVal, setSecuencialVal] = useState('000000001');
  const [fechaEmision, setFechaEmision] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [periodoFiscal, setPeriodoFiscal] = useState(() => {
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${m}/${y}`;
  });

  // Proveedor State
  const [selectedClientId, setSelectedClientId] = useState('MANUAL');
  const [provTipoId, setProvTipoId] = useState<'04' | '05' | '06' | '07' | '08'>('04');
  const [provIdent, setProvIdent] = useState('');
  const [provNombre, setProvNombre] = useState('');
  const [provDireccion, setProvDireccion] = useState('');
  const [provTelefono, setProvTelefono] = useState('');
  const [provCorreo, setProvCorreo] = useState('');
  const [isSearchingSri, setIsSearchingSri] = useState(false);

  // Documento Sustento State
  const [tipoDocSustento, setTipoDocSustento] = useState('01');
  const [selectedDocSustentoId, setSelectedDocSustentoId] = useState('MANUAL');
  const [numDocSustento, setNumDocSustento] = useState('');
  const [fechaDocSustento, setFechaDocSustento] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [totalDocSustento, setTotalDocSustento] = useState<number>(0);

  // Impuestos Retenidos List
  const [impuestos, setImpuestos] = useState<RetentionTax[]>([
    {
      id: 'tax-1',
      codigo: '1', // Renta
      codigoRetencion: '312',
      descripcion: 'Transferencia de bienes muebles de naturaleza corporal (1.75%)',
      baseImponible: 100,
      porcentajeRetener: 1.75,
      valorRetenido: 1.75,
      tipoComprobanteSustento: '01',
      numDocSustento: '',
      fechaEmisionDocSustento: ''
    }
  ]);

  // Info Adicional
  const [infoAdicional, setInfoAdicional] = useState<AdicionalInfo[]>([
    { id: '1', nombre: 'Email', valor: '' },
    { id: '2', nombre: 'Observación', valor: 'Comprobante de Retención Electrónico emitido vía ORIONNX' }
  ]);

  // Active Retention for RIDE Modal
  const [selectedRetentionRide, setSelectedRetentionRide] = useState<Retention | null>(null);

  // Search in History
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');

  // Load Retenciones and Sequential
  const loadRetencionesData = async () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem('sri_highest_secuencial_ret');
      if (stored) {
        const nextSeq = parseInt(stored, 10) + 1;
        setSecuencialVal(formatSequential(nextSeq));
      }

      // Local storage
      const localData = localStorage.getItem('sri_retenciones_history');
      if (localData) {
        try {
          setRetenciones(JSON.parse(localData));
        } catch {
          // ignore
        }
      }

      // Supabase
      const dbData = await fetchRetencionesFromSupabase(
        currentUser?.correo, 
        currentUser?.role, 
        currentUser?.empresaRuc || config.ruc
      );

      if (dbData && dbData.length > 0) {
        setRetenciones(dbData);
        localStorage.setItem('sri_retenciones_history', JSON.stringify(dbData));
        
        // Find highest sequence
        const maxSeq = dbData.reduce((max, r) => {
          const num = parseInt(r.secuencial.replace(/\D/g, ''), 10);
          return !isNaN(num) && num > max ? num : max;
        }, 0);
        if (maxSeq > 0) {
          setSecuencialVal(formatSequential(maxSeq + 1));
          localStorage.setItem('sri_highest_secuencial_ret', maxSeq.toString());
        }
      }
    } catch (err) {
      console.warn('Error cargando retenciones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRetencionesData();
  }, [currentUser?.correo, currentUser?.empresaRuc]);

  // Handle Client Selection (Clear completely on MANUAL selection)
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedDocSustentoId('MANUAL');

    if (!clientId || clientId === 'MANUAL') {
      setProvIdent('');
      setProvTipoId('04');
      setProvNombre('');
      setProvDireccion('');
      setProvTelefono('');
      setProvCorreo('');
      return;
    }

    const c = clients.find(cl => cl.id === clientId);
    if (c) {
      setProvIdent(c.identificacion || '');
      setProvTipoId((c.tipoIdentificacion || '04') as any);
      setProvNombre(c.nombre || '');
      setProvDireccion(c.direccion || '');
      setProvTelefono(c.telefono || '');
      setProvCorreo(c.correo || '');
    }
  };

  // Filter available sustento documents in function of the selected Provider and Document Type
  const availableDocs = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];

    const cleanProvId = (provIdent || '').trim().replace(/\s+/g, '');
    const cleanProvName = (provNombre || '').trim().toLowerCase();

    // 01 - Factura
    if (tipoDocSustento === '01') {
      return invoices.filter(inv => {
        if (cleanProvId && inv.cliente?.identificacion === cleanProvId) return true;
        if (cleanProvName && inv.cliente?.nombre && inv.cliente.nombre.toLowerCase().includes(cleanProvName)) return true;
        return false;
      });
    }

    return [];
  }, [invoices, provIdent, provNombre, tipoDocSustento]);

  // Handle selecting a sustento document from the provider's available list
  const handleSelectSustentoDoc = (docId: string) => {
    setSelectedDocSustentoId(docId);
    if (!docId || docId === 'MANUAL') {
      return;
    }

    const inv = invoices.find(i => i.id === docId);
    if (inv) {
      const estab = (config.codEstablecimiento || '001').padStart(3, '0');
      const pto = (config.codPuntoEmision || '001').padStart(3, '0');
      const seq = (inv.secuencial || '1').padStart(9, '0');
      const formattedDocNum = `${estab}-${pto}-${seq}`;
      const invTotal = inv.resumenImpuestos?.total ?? 0;
      const invSubtotal = inv.resumenImpuestos?.subtotal ?? invTotal;

      setNumDocSustento(formattedDocNum);
      if (inv.fechaEmision) {
        setFechaDocSustento(inv.fechaEmision);
      }
      setTotalDocSustento(invTotal);

      // Update all tax rows with the selected doc number and date
      const baseToUse = invSubtotal;
      setImpuestos(prev => prev.map((tax, idx) => {
        const updated = {
          ...tax,
          numDocSustento: formattedDocNum,
          fechaEmisionDocSustento: inv.fechaEmision || fechaDocSustento,
          tipoComprobanteSustento: tipoDocSustento
        };
        // Auto-assign base to first tax row if empty/default
        if (idx === 0 && (tax.baseImponible === 100 || tax.baseImponible === 0) && baseToUse > 0) {
          updated.baseImponible = baseToUse;
          updated.valorRetenido = Number((baseToUse * (tax.porcentajeRetener || 0) / 100).toFixed(2));
        }
        return updated;
      }));
    }
  };

  // Helper to format document number on blur / change (e.g. 001001000012345 -> 001-001-000012345)
  const handleNumDocSustentoChange = (value: string) => {
    let clean = value.replace(/[^\d-]/g, '');
    const rawDigits = clean.replace(/-/g, '');
    if (rawDigits.length === 15 && !clean.includes('-')) {
      clean = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 6)}-${rawDigits.slice(6, 15)}`;
    }
    setNumDocSustento(clean);
    setImpuestos(prev => prev.map(t => ({ ...t, numDocSustento: clean })));
  };

  // SRI Live Lookup for Proveedor
  const handleSriLookup = async () => {
    const clean = provIdent.trim().replace(/[^\d]/g, '');
    if (clean.length !== 10 && clean.length !== 13) {
      setStatusMessage({ type: 'error', text: 'Ingrese un RUC (13 dígitos) o Cédula (10 dígitos) para consultar en el SRI.' });
      return;
    }

    setIsSearchingSri(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/sri-lookup?id=${clean}`);
      const data = await res.json();

      if (data.status === 'success' && data.client) {
        const found = data.client;
        setProvNombre(found.nombre);
        setProvDireccion(found.direccion || provDireccion);
        setProvTelefono(found.telefono || provTelefono);
        setProvCorreo(found.correo || provCorreo);
        setProvTipoId(found.tipoIdentificacion);
        setStatusMessage({ type: 'success', text: `Datos de "${found.nombre}" obtenidos exitosamente desde el SRI.` });

        // Auto-save to catalog if not present
        if (onAddClient && !clients.some(c => c.identificacion === clean)) {
          onAddClient({
            id: 'c-' + Date.now(),
            identificacion: clean,
            tipoIdentificacion: found.tipoIdentificacion,
            nombre: found.nombre,
            direccion: found.direccion,
            telefono: found.telefono,
            correo: found.correo
          });
        }
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'No se encontró información para esta identificación.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error consultando en la base de datos del SRI.' });
    } finally {
      setIsSearchingSri(false);
    }
  };

  // Tax Row Management
  const handleAddTax = () => {
    const newTax: RetentionTax = {
      id: 'tax-' + Date.now(),
      codigo: '1',
      codigoRetencion: '312',
      descripcion: 'Transferencia de bienes muebles de naturaleza corporal (1.75%)',
      baseImponible: 0,
      porcentajeRetener: 1.75,
      valorRetenido: 0,
      tipoComprobanteSustento: tipoDocSustento,
      numDocSustento: numDocSustento,
      fechaEmisionDocSustento: fechaDocSustento
    };
    setImpuestos([...impuestos, newTax]);
  };

  const handleRemoveTax = (index: number) => {
    if (impuestos.length === 1) {
      modalAlert.warning('Impuesto Requerido', 'El comprobante de retención debe contener al menos un impuesto retenido.');
      return;
    }
    setImpuestos(impuestos.filter((_, i) => i !== index));
  };

  const handleTaxTypeChange = (index: number, taxType: '1' | '2' | '6') => {
    const updated = [...impuestos];
    let defaultCode = '312';
    let defaultDesc = 'Transferencia de bienes muebles de naturaleza corporal (1.75%)';
    let defaultPct = 1.75;

    if (taxType === '2') {
      defaultCode = '3';
      defaultDesc = 'Retención del 30% del IVA (Bienes transferidos)';
      defaultPct = 30.00;
    } else if (taxType === '6') {
      defaultCode = '4580';
      defaultDesc = 'Impuesto a la Salida de Divisas (5.00%)';
      defaultPct = 5.00;
    }

    updated[index] = {
      ...updated[index],
      codigo: taxType,
      codigoRetencion: defaultCode,
      descripcion: defaultDesc,
      porcentajeRetener: defaultPct,
      valorRetenido: Number(((updated[index].baseImponible || 0) * defaultPct / 100).toFixed(2))
    };
    setImpuestos(updated);
  };

  const handleTaxCodeChange = (index: number, code: string) => {
    const updated = [...impuestos];
    const currentTax = updated[index];
    let catalog = SRI_CODIGOS_RENTA;
    if (currentTax.codigo === '2') catalog = SRI_CODIGOS_IVA;
    if (currentTax.codigo === '6') catalog = SRI_CODIGOS_ISD;

    const found = catalog.find(item => item.codigo === code);
    if (found) {
      updated[index] = {
        ...currentTax,
        codigoRetencion: found.codigo,
        descripcion: found.descripcion,
        porcentajeRetener: found.porcentaje,
        valorRetenido: Number(((currentTax.baseImponible || 0) * found.porcentaje / 100).toFixed(2))
      };
      setImpuestos(updated);
    }
  };

  const handleTaxBaseChange = (index: number, base: number) => {
    const updated = [...impuestos];
    const currentTax = updated[index];
    const val = Number(((base || 0) * (currentTax.porcentajeRetener || 0) / 100).toFixed(2));
    updated[index] = {
      ...currentTax,
      baseImponible: base,
      valorRetenido: val
    };
    setImpuestos(updated);
  };

  const handleTaxPercentChange = (index: number, pct: number) => {
    const updated = [...impuestos];
    const currentTax = updated[index];
    const val = Number(((currentTax.baseImponible || 0) * (pct || 0) / 100).toFixed(2));
    updated[index] = {
      ...currentTax,
      porcentajeRetener: pct,
      valorRetenido: val
    };
    setImpuestos(updated);
  };

  // Totals
  const totalRetenidoRenta = impuestos.filter(t => t.codigo === '1').reduce((sum, t) => sum + (t.valorRetenido || 0), 0);
  const totalRetenidoIva = impuestos.filter(t => t.codigo === '2').reduce((sum, t) => sum + (t.valorRetenido || 0), 0);
  const totalRetenidoIsd = impuestos.filter(t => t.codigo === '6').reduce((sum, t) => sum + (t.valorRetenido || 0), 0);
  const totalRetenidoGlobal = totalRetenidoRenta + totalRetenidoIva + totalRetenidoIsd;
  const baseTotalRetenciones = impuestos.reduce((sum, t) => sum + (t.baseImponible || 0), 0);

  // Generate and Submit Retention
  const handleSaveAndTransmit = async (isDraft: boolean = false) => {
    setStatusMessage(null);

    // Validations
    if (!provIdent || !provNombre) {
      setStatusMessage({ type: 'error', text: 'Debe ingresar el RUC/Cédula y la Razón Social del Sujeto Retenido.' });
      return;
    }

    if (!numDocSustento) {
      setStatusMessage({ type: 'error', text: 'Debe ingresar el número del documento sustento (ej. 001-001-000012345).' });
      return;
    }

    if (impuestos.length === 0 || impuestos.some(t => !t.baseImponible || t.baseImponible <= 0)) {
      setStatusMessage({ type: 'error', text: 'Todos los impuestos retenidos deben tener una base imponible mayor a cero.' });
      return;
    }

    setIsProcessing(true);

    try {
      const cleanEstab = (config.codEstablecimiento || '001').padStart(3, '0');
      const cleanPto = (config.codPuntoEmision || '001').padStart(3, '0');
      const cleanSeq = secuencialVal.padStart(9, '0');
      const rucEmisor = config.ruc || currentUser?.empresaRuc || '1792451083001';

      // 1. Generate 49-digit Access Key (codDoc: '07' for retentions)
      const claveAcceso = generateClaveAcceso({
        fechaEmision,
        tipoComprobante: '07',
        ruc: rucEmisor,
        ambiente: (config.ambiente || '1') as '1' | '2',
        establecimiento: cleanEstab,
        puntoEmision: cleanPto,
        secuencial: cleanSeq,
        codigoNumerico: '12345678',
        tipoEmision: '1'
      });

      // 2. Build Retention Object
      const sustentoData: RetentionSustento = {
        tipoComprobante: tipoDocSustento,
        numComprobante: numDocSustento,
        fechaEmision: fechaDocSustento,
        totalSinImpuestos: baseTotalRetenciones,
        importeTotal: totalDocSustento > 0 ? totalDocSustento : baseTotalRetenciones
      };

      const proveedorData: Client = {
        id: selectedClientId || 'prov-' + Date.now(),
        identificacion: provIdent.trim(),
        tipoIdentificacion: provTipoId,
        nombre: provNombre.trim(),
        direccion: provDireccion.trim() || 'S/N',
        telefono: provTelefono.trim(),
        correo: provCorreo.trim()
      };

      const retentionObj: Retention = {
        id: 'ret-' + Date.now(),
        secuencial: cleanSeq,
        fechaEmision,
        periodoFiscal: periodoFiscal || `${fechaEmision.split('-')[1]}/${fechaEmision.split('-')[0]}`,
        proveedor: proveedorData,
        sustento: sustentoData,
        impuestos: impuestos.map(t => ({
          ...t,
          numDocSustento: t.numDocSustento || numDocSustento,
          fechaEmisionDocSustento: t.fechaEmisionDocSustento || fechaDocSustento,
          tipoComprobanteSustento: t.tipoComprobanteSustento || tipoDocSustento
        })),
        totalRetenido: Number(totalRetenidoGlobal.toFixed(2)),
        claveAcceso,
        estado: isDraft ? 'Borrador' : 'Enviado',
        mensajesSRI: [],
        infoAdicional: infoAdicional.filter(i => i.nombre && i.valor),
        creadorNombre: currentUser?.nombre || 'Operador',
        usuarioCorreo: currentUser?.correo || '',
        empresaRuc: currentUser?.empresaRuc || config.ruc || '',
        empresaNombre: currentUser?.empresaNombre || config.razonSocial || '',
        createdAt: new Date().toISOString()
      };

      // 3. Generate XML
      const unsignedXml = generateRetentionXml(retentionObj, config);
      retentionObj.xml = unsignedXml;

      let signedXml = '';
      let isAuthorized = false;
      let sriMessages: any[] = [];

      if (!isDraft) {
        // Sign XML via API
        try {
          const signRes = await fetch('/api/sign-xml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              xmlContent: unsignedXml,
              p12Base64: config.p12FirmaB64,
              password: config.p12Password || '',
              isDemo: config.isDemoMode
            })
          });
          const signData = await signRes.json();
          if (signData.status === 'success' && signData.signedXml) {
            signedXml = signData.signedXml;
            retentionObj.xmlFirmado = signedXml;
          } else {
            console.warn('Firma digital no disponible o modo demo:', signData.message);
          }
        } catch (e) {
          console.warn('Error en firma de XML:', e);
        }

        // Transmit to SRI
        try {
          const sendRes = await fetch('/api/send-sri', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              signedXml: signedXml || unsignedXml,
              claveAcceso,
              ambiente: config.ambiente || '1',
              isDemo: config.isDemoMode
            })
          });
          const sendData = await sendRes.json();

          if (sendData.status === 'success') {
            // Check authorization
            const authRes = await fetch('/api/authorize-sri', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                claveAcceso,
                ambiente: config.ambiente || '1',
                isDemo: config.isDemoMode
              })
            });
            const authData = await authRes.json();

            if (authData.status === 'success' && authData.data?.estado === 'AUTORIZADO') {
              isAuthorized = true;
              retentionObj.estado = 'Autorizado';
              retentionObj.numeroAutorizacion = authData.data.numeroAutorizacion || claveAcceso;
              retentionObj.fechaAutorizacion = authData.data.fechaAutorizacion || new Date().toISOString();
            } else if (authData.data?.estado === 'NO AUTORIZADO' || authData.data?.estado === 'DEVUELTA') {
              retentionObj.estado = 'Devuelto';
              retentionObj.mensajesSRI = authData.data?.mensajes || [{ mensaje: 'Comprobante devuelto por el SRI' }];
            } else {
              retentionObj.estado = config.isDemoMode ? 'Autorizado' : 'Enviado';
              retentionObj.numeroAutorizacion = claveAcceso;
              retentionObj.fechaAutorizacion = new Date().toISOString();
              if (config.isDemoMode) isAuthorized = true;
            }
          }
        } catch (e) {
          console.warn('Error en envío SRI:', e);
          if (config.isDemoMode) {
            retentionObj.estado = 'Autorizado';
            retentionObj.numeroAutorizacion = claveAcceso;
            retentionObj.fechaAutorizacion = new Date().toISOString();
          }
        }
      }

      // 4. Generate PDF RIDE & Upload to Supabase Storage Buckets
      try {
        // Upload XML Sin Firmar
        if (unsignedXml) {
          const xmlSinFirmarRes = await uploadRetentionXmlSinFirmar(cleanEstab, cleanPto, cleanSeq, unsignedXml);
          if (xmlSinFirmarRes.publicUrl) {
            retentionObj.xmlUrl = xmlSinFirmarRes.publicUrl;
          }
        }

        // Upload XML Firmado
        if (signedXml) {
          await uploadRetentionXmlFirmado(cleanEstab, cleanPto, cleanSeq, signedXml);
        }

        // Generate and Upload PDF RIDE
        try {
          const pdfRes = await fetch('/api/generate-retention-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ retention: retentionObj, config })
          });
          if (pdfRes.ok) {
            const pdfBlob = await pdfRes.blob();
            const uploadRes = await uploadRetentionPdf(cleanEstab, cleanPto, cleanSeq, pdfBlob);
            if (uploadRes.publicUrl) {
              retentionObj.pdfUrl = uploadRes.publicUrl;
            }
          }
        } catch (pdfErr) {
          console.warn('Aviso generando y subiendo PDF de retención:', pdfErr);
        }
      } catch (uploadErr) {
        console.warn('Aviso subiendo archivos de retención a buckets Supabase:', uploadErr);
      }

      // 5. Save Retention to Supabase Table `retenciones` and `retencion_detalles`
      await saveRetencionToSupabase(retentionObj, currentUser?.correo);

      // 6. Update Local State
      const updatedList = [retentionObj, ...retenciones];
      setRetenciones(updatedList);
      localStorage.setItem('sri_retenciones_history', JSON.stringify(updatedList));

      // 7. Increment sequential
      const currentSeqNum = parseInt(cleanSeq, 10);
      const nextSeqFormatted = formatSequential(currentSeqNum + 1);
      setSecuencialVal(nextSeqFormatted);
      localStorage.setItem('sri_highest_secuencial_ret', currentSeqNum.toString());

      if (currentUser) {
        logActivity(
          currentUser,
          isDraft ? 'Borrador Retención' : 'Emisión de Retención SRI',
          `Retención No. ${cleanEstab}-${cleanPto}-${cleanSeq} emitida a ${proveedorData.nombre} por $${retentionObj.totalRetenido.toFixed(2)} (Estado: ${retentionObj.estado}).`
        );
      }

      setStatusMessage({
        type: 'success',
        text: isDraft 
          ? `Borrador de retención No. ${cleanEstab}-${cleanPto}-${cleanSeq} guardado exitosamente.`
          : `¡Comprobante de Retención No. ${cleanEstab}-${cleanPto}-${cleanSeq} emitido y procesado exitosamente! (Estado: ${retentionObj.estado})`
      });

      // Switch to history to view
      setTimeout(() => {
        setViewTab('history');
      }, 1200);

    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error procesando el comprobante de retención: ${err.message || 'Error inesperado'}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Retention
  const handleDeleteRetention = async (id: string, seq: string) => {
    const targetRet = retenciones.find(r => r.id === id);
    modalAlert.confirm(
      '¿Eliminar comprobante de retención?',
      `¿Está seguro de eliminar el comprobante de retención No. ${seq}?\nEsta acción borrará el registro de la base de datos y eliminará automáticamente el PDF y los XMLs generados en los buckets de almacenamiento.`,
      async () => {
        try {
          await deleteRetencionFromSupabase(
            id,
            seq || targetRet?.secuencial,
            targetRet?.claveAcceso,
            config.codEstablecimiento || '001',
            config.codPuntoEmision || '001'
          );
          const filtered = retenciones.filter(r => r.id !== id);
          setRetenciones(filtered);
          localStorage.setItem('sri_retenciones_history', JSON.stringify(filtered));
          setStatusMessage({ type: 'success', text: `Retención No. ${seq} y sus archivos asociados en Storage fueron eliminados correctamente.` });
          modalAlert.success('Comprobante Eliminado', `La retención No. ${seq} ha sido eliminada con éxito.`);
        } catch {
          setStatusMessage({ type: 'error', text: 'Error al eliminar la retención en la base de datos.' });
          modalAlert.error('Error al Eliminar', 'Error al eliminar la retención en la base de datos.');
        }
      },
      true,
      'Eliminar Retención',
      'Cancelar'
    );
  };

  // Filtered Retenciones for History
  const filteredRetenciones = retenciones.filter(ret => {
    const matchesSearch = 
      (ret.secuencial || '').includes(searchQuery) ||
      (ret.proveedor?.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ret.proveedor?.identificacion || '').includes(searchQuery) ||
      (ret.claveAcceso || '').includes(searchQuery) ||
      (ret.sustento?.numComprobante || '').includes(searchQuery);

    const matchesEstado = filterEstado === 'TODOS' || (ret.estado || 'BORRADOR').toUpperCase() === filterEstado.toUpperCase();

    return matchesSearch && matchesEstado;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Comprobantes de Retención (SRI Tipo 07)
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Emisión, cálculo automático de retenciones en la fuente de Renta, IVA e ISD, firma electrónica y almacenamiento seguro en Storage.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="tab-emit-retention"
            type="button"
            onClick={() => setViewTab('emit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              viewTab === 'emit'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Retención</span>
          </button>
          <button
            id="tab-history-retention"
            type="button"
            onClick={() => setViewTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              viewTab === 'history'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Historial ({retenciones.length})</span>
          </button>
        </div>
      </div>

      {/* Global Status Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: EMITIR RETENCIÓN */}
      {viewTab === 'emit' && (
        <div className="space-y-6">
          {/* Section 1: Datos Generales y Emisor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>1. Datos del Comprobante y Período Fiscal</span>
              </h2>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/60">
                Ambiente: {config.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Establecimiento - Punto Emisión
                </label>
                <input
                  type="text"
                  disabled
                  value={`${config.codEstablecimiento || '001'} - ${config.codPuntoEmision || '001'}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Secuencial No. (9 dígitos)
                </label>
                <input
                  id="input-retention-secuencial"
                  type="text"
                  value={secuencialVal}
                  onChange={(e) => setSecuencialVal(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="000000001"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Fecha de Emisión
                </label>
                <input
                  id="input-retention-fecha"
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => {
                    setFechaEmision(e.target.value);
                    if (e.target.value) {
                      const parts = e.target.value.split('-');
                      if (parts.length === 3) {
                        setPeriodoFiscal(`${parts[1]}/${parts[0]}`);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Período Fiscal (MM/YYYY)
                </label>
                <input
                  id="input-retention-periodo"
                  type="text"
                  value={periodoFiscal}
                  onChange={(e) => setPeriodoFiscal(e.target.value)}
                  placeholder="01/2026"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Proveedor / Sujeto Retenido */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>2. Sujeto Retenido (Proveedor / Vendedor)</span>
              </h2>

              {/* Select from catalog dropdown & manual clear */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-slate-500">Cargar de Catálogo:</span>
                <select
                  id="select-retention-catalog"
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="MANUAL">-- Ingreso Manual --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.identificacion})
                    </option>
                  ))}
                </select>

                {selectedClientId !== 'MANUAL' && (
                  <button
                    type="button"
                    onClick={() => handleClientSelect('MANUAL')}
                    className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                    title="Limpiar todos los campos y pasar a ingreso manual"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tipo de Identificación
                </label>
                <select
                  value={provTipoId}
                  onChange={(e) => setProvTipoId(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="04">RUC (04)</option>
                  <option value="05">CÉDULA (05)</option>
                  <option value="06">PASAPORTE (06)</option>
                  <option value="07">CONSUMIDOR FINAL (07)</option>
                  <option value="08">IDENTIFICACIÓN DEL EXTERIOR (08)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  RUC / Cédula / Identificación
                </label>
                <div className="flex space-x-2">
                  <input
                    id="input-retention-prov-ident"
                    type="text"
                    value={provIdent}
                    onChange={(e) => {
                      setProvIdent(e.target.value.replace(/\s+/g, ''));
                      setSelectedDocSustentoId('MANUAL');
                    }}
                    placeholder="1790016919001"
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSriLookup}
                    disabled={isSearchingSri || !provIdent}
                    className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-xl text-xs font-black transition-all flex items-center space-x-1 shrink-0 disabled:opacity-50"
                    title="Consultar RUC en el SRI"
                  >
                    {isSearchingSri ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>SRI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Razón Social / Nombre Completo
                </label>
                <input
                  id="input-retention-prov-nombre"
                  type="text"
                  value={provNombre}
                  onChange={(e) => {
                    setProvNombre(e.target.value);
                    setSelectedDocSustentoId('MANUAL');
                  }}
                  placeholder="NOMBRE DEL PROVEEDOR O EMPRESA"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  value={provDireccion}
                  onChange={(e) => setProvDireccion(e.target.value)}
                  placeholder="Av. 10 de Agosto y Patria, Quito"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Correo Electrónico (Para envío RIDE)
                </label>
                <input
                  type="email"
                  value={provCorreo}
                  onChange={(e) => setProvCorreo(e.target.value)}
                  placeholder="proveedor@empresa.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={provTelefono}
                  onChange={(e) => setProvTelefono(e.target.value)}
                  placeholder="0991234567"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Documento Sustento */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-sky-600" />
                  <span>3. Documento Sustento del Comprobante Retenido</span>
                </h2>
                {provNombre ? (
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Proveedor: <strong className="text-slate-800 font-bold">{provNombre}</strong> {provIdent && <span className="font-mono text-slate-600">({provIdent})</span>}</span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    Defina el proveedor en la sección anterior para vincular automáticamente sus comprobantes emitidos.
                  </p>
                )}
              </div>

              {/* Status pill for documents mode */}
              <div className="flex items-center gap-2">
                {availableDocs.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-lg">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    {availableDocs.length} {availableDocs.length === 1 ? 'comprobante disponible' : 'comprobantes disponibles'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg">
                    <span>Modo Físico / Manual</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tipo de Comprobante Sustento
                </label>
                <select
                  value={tipoDocSustento}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setTipoDocSustento(newType);
                    setSelectedDocSustentoId('MANUAL');
                    setImpuestos(impuestos.map(t => ({ ...t, tipoComprobanteSustento: newType })));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="01">01 - FACTURA</option>
                  <option value="02">02 - NOTA DE VENTA</option>
                  <option value="03">03 - LIQUIDACIÓN DE COMPRA</option>
                  <option value="05">05 - NOTA DE DÉBITO</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Número Documento Sustento
                  </label>
                  {availableDocs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDocSustentoId === 'MANUAL') {
                          // Select the first available doc if switching
                          if (availableDocs[0]) handleSelectSustentoDoc(availableDocs[0].id);
                        } else {
                          setSelectedDocSustentoId('MANUAL');
                        }
                      }}
                      className="text-[10px] font-bold text-sky-600 hover:text-sky-800 underline cursor-pointer"
                    >
                      {selectedDocSustentoId === 'MANUAL' ? 'Elegir de lista' : 'Ingresar manual'}
                    </button>
                  )}
                </div>

                {/* If multiple available documents exist, display the selector */}
                {availableDocs.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      id="select-retention-doc-sustento"
                      value={selectedDocSustentoId}
                      onChange={(e) => handleSelectSustentoDoc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-sky-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    >
                      <option value="MANUAL">✍️ -- Ingreso Manual / Físico --</option>
                      <optgroup label={`Comprobantes de ${provNombre || 'Proveedor'}`}>
                        {availableDocs.map(inv => {
                          const est = (config.codEstablecimiento || '001').padStart(3, '0');
                          const pto = (config.codPuntoEmision || '001').padStart(3, '0');
                          const seq = (inv.secuencial || '1').padStart(9, '0');
                          const docNum = `${est}-${pto}-${seq}`;
                          const total = inv.resumenImpuestos?.total || 0;
                          return (
                            <option key={inv.id} value={inv.id}>
                              {docNum} • ${total.toFixed(2)} ({inv.fechaEmision})
                            </option>
                          );
                        })}
                      </optgroup>
                    </select>

                    {/* If in manual mode, or to edit manually */}
                    {selectedDocSustentoId === 'MANUAL' && (
                      <input
                        id="input-retention-doc-num"
                        type="text"
                        value={numDocSustento}
                        onChange={(e) => handleNumDocSustentoChange(e.target.value)}
                        placeholder="001-001-000012345 (Físico)"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      id="input-retention-doc-num"
                      type="text"
                      value={numDocSustento}
                      onChange={(e) => handleNumDocSustentoChange(e.target.value)}
                      placeholder="001-001-000012345"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Formato SRI: 3 dígitos estab. - 3 pto. emisión - 9 secuencial
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Fecha Emisión Doc. Sustento
                </label>
                <input
                  type="date"
                  value={fechaDocSustento}
                  onChange={(e) => {
                    setFechaDocSustento(e.target.value);
                    setImpuestos(impuestos.map(t => ({ ...t, fechaEmisionDocSustento: e.target.value })));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Total Documento Sustento ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalDocSustento || ''}
                  onChange={(e) => setTotalDocSustento(parseFloat(e.target.value) || 0)}
                  placeholder="100.00"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-right"
                />
              </div>
            </div>

            {/* Contextual notification when a document is selected */}
            {availableDocs.length > 0 && selectedDocSustentoId !== 'MANUAL' && (
              <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-2.5 rounded-xl text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Documento <strong>{numDocSustento}</strong> vinculado exitosamente (${(totalDocSustento || 0).toFixed(2)} - {fechaDocSustento}).</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDocSustentoId('MANUAL')}
                  className="text-emerald-700 hover:text-emerald-900 underline text-[10px] font-black cursor-pointer"
                >
                  Cambiar a ingreso físico / manual
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Impuestos Retenidos (Filas dinámicas) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>4. Desglose de Impuestos Retenidos</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seleccione el impuesto (Renta, IVA o ISD) y el código de retención aplicable según la normativa SRI.
                </p>
              </div>

              <button
                id="btn-add-tax-row"
                type="button"
                onClick={handleAddTax}
                className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Impuesto</span>
              </button>
            </div>

            {/* Impuestos Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    <th className="p-3">Impuesto</th>
                    <th className="p-3">Código SRI / Concepto</th>
                    <th className="p-3 text-right">Base Imponible ($)</th>
                    <th className="p-3 text-right">% Retener</th>
                    <th className="p-3 text-right">Valor Retenido ($)</th>
                    <th className="p-3 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {impuestos.map((tax, idx) => {
                    const catalog = tax.codigo === '1' ? SRI_CODIGOS_RENTA : (tax.codigo === '2' ? SRI_CODIGOS_IVA : SRI_CODIGOS_ISD);

                    return (
                      <tr key={tax.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <select
                            value={tax.codigo}
                            onChange={(e) => handleTaxTypeChange(idx, e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          >
                            <option value="1">RENTA (1)</option>
                            <option value="2">IVA (2)</option>
                            <option value="6">ISD (6)</option>
                          </select>
                        </td>

                        <td className="p-3">
                          <select
                            value={tax.codigoRetencion}
                            onChange={(e) => handleTaxCodeChange(idx, e.target.value)}
                            className="w-full max-w-md px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 truncate"
                          >
                            {catalog.map(cat => (
                              <option key={cat.codigo} value={cat.codigo}>
                                [{cat.codigo}] - {cat.descripcion}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tax.baseImponible}
                            onChange={(e) => handleTaxBaseChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-right font-mono"
                          />
                        </td>

                        <td className="p-3 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={tax.porcentajeRetener}
                              onChange={(e) => handleTaxPercentChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-right font-mono"
                            />
                            <span className="text-slate-500 font-bold">%</span>
                          </div>
                        </td>

                        <td className="p-3 text-right">
                          <span className="font-mono font-black text-sky-700 text-sm">
                            ${Number(tax.valorRetenido || 0).toFixed(2)}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTax(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar fila de retención"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="block text-[11px] font-bold text-slate-500">Base Sujeta a Retención</span>
                <span className="text-base font-black text-slate-800 font-mono">${baseTotalRetenciones.toFixed(2)}</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="block text-[11px] font-bold text-blue-700">Retención Impuesto a la Renta</span>
                <span className="text-base font-black text-blue-900 font-mono">${totalRetenidoRenta.toFixed(2)}</span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <span className="block text-[11px] font-bold text-indigo-700">Retención Impuesto IVA</span>
                <span className="text-base font-black text-indigo-900 font-mono">${totalRetenidoIva.toFixed(2)}</span>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
                <span className="block text-[11px] font-bold text-sky-100 uppercase tracking-wider">TOTAL RETENIDO</span>
                <span className="text-xl font-black font-mono">${totalRetenidoGlobal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
            <button
              id="btn-save-draft-retention"
              type="button"
              disabled={isProcessing}
              onClick={() => handleSaveAndTransmit(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all border border-slate-300 disabled:opacity-50"
            >
              Guardar Borrador
            </button>

            <button
              id="btn-transmit-retention"
              type="button"
              disabled={isProcessing}
              onClick={() => handleSaveAndTransmit(false)}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-sky-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando con SRI y Storage...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Firmar, Transmitir al SRI y Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL DE RETENCIONES */}
      {viewTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número, proveedor, RUC o clave de acceso..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Estado:</span>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="AUTORIZADO">AUTORIZADO</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="DEVUELTA">DEVUELTA</option>
                <option value="BORRADOR">BORRADOR</option>
              </select>

              <button
                type="button"
                onClick={loadRetencionesData}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                title="Refrescar lista"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Retenciones List */}
          {filteredRetenciones.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-800">No hay comprobantes de retención</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No se encontraron retenciones emitidas con los filtros actuales. Haga clic en "Emitir Retención" para crear un nuevo comprobante.
              </p>
              <button
                type="button"
                onClick={() => setViewTab('emit')}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-sky-700 transition-all inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Emitir Primera Retención</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      <th className="p-3.5">Secuencial</th>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Proveedor / Sujeto Retenido</th>
                      <th className="p-3.5">Doc. Sustento</th>
                      <th className="p-3.5 text-right">Total Retenido</th>
                      <th className="p-3.5 text-center">Estado SRI</th>
                      <th className="p-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRetenciones.map((ret) => {
                      const estado = (ret.estado || 'BORRADOR').toUpperCase();
                      const isAuth = estado === 'AUTORIZADO';
                      const isPend = estado === 'PENDIENTE';
                      const isDev = estado === 'DEVUELTA';

                      return (
                        <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            {config.codEstablecimiento || '001'}-{config.codPuntoEmision || '001'}-{ret.secuencial}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">
                            {ret.fechaEmision}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{ret.proveedor?.nombre}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{ret.proveedor?.identificacion}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {ret.sustento?.numComprobante || '001-001-000000001'}
                            </span>
                            <div className="text-[10px] text-slate-500 font-medium">Período: {ret.periodoFiscal}</div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-slate-900 text-sm">
                            ${Number(ret.totalRetenido || 0).toFixed(2)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${
                                isAuth
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isPend
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isDev
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {isAuth && <CheckCircle2 className="w-3 h-3" />}
                              {isPend && <Clock className="w-3 h-3" />}
                              {isDev && <AlertCircle className="w-3 h-3" />}
                              <span>{estado}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setSelectedRetentionRide(ret)}
                                className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                                title="Ver RIDE (Comprobante de Retención)"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {ret.xml && (
                                <a
                                  href={`data:text/xml;charset=utf-8,${encodeURIComponent(ret.xmlFirmado || ret.xml)}`}
                                  download={`RET_${config.codEstablecimiento || '001'}-${config.codPuntoEmision || '001'}-${ret.secuencial}.xml`}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-block"
                                  title="Descargar XML"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteRetention(ret.id, ret.secuencial)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Eliminar retención"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: RIDE VIEWER FOR COMPROBANTE DE RETENCIÓN */}
      {selectedRetentionRide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black tracking-tight">
                  RIDE - Comprobante de Retención No. {config.codEstablecimiento || '001'}-{config.codPuntoEmision || '001'}-{selectedRetentionRide.secuencial}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRetentionRide(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* RIDE Content Preview */}
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 text-slate-800">
              {/* Header Box Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Emisor Info */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-base font-black text-slate-900">
                    {config.nombreComercial || config.razonSocial || 'ORIONNX'}
                  </h4>
                  <div className="text-xs font-bold text-slate-600">{config.razonSocial || 'ORIONNX'}</div>
                  <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                    <div><strong>RUC:</strong> {config.ruc || '1792451083001'}</div>
                    <div><strong>Matriz:</strong> {config.dirMatriz || 'Quito, Ecuador'}</div>
                    <div><strong>Establecimiento:</strong> {config.dirEstablecimiento || config.dirMatriz || 'Quito, Ecuador'}</div>
                    <div><strong>Obligado Contabilidad:</strong> {config.obligadoContabilidad ? 'SÍ' : 'NO'}</div>
                  </div>
                </div>

                {/* Right: SRI Box */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="text-sm font-black text-sky-800">COMPROBANTE DE RETENCIÓN</div>
                  <div className="text-xs font-mono font-black text-slate-900">
                    No. {config.codEstablecimiento || '001'}-{config.codPuntoEmision || '001'}-{selectedRetentionRide.secuencial}
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div><strong>Autorización:</strong> {selectedRetentionRide.numeroAutorizacion || selectedRetentionRide.claveAcceso}</div>
                    <div><strong>Fecha:</strong> {selectedRetentionRide.fechaAutorizacion || selectedRetentionRide.fechaEmision}</div>
                    <div><strong>Ambiente:</strong> {config.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS'}</div>
                    <div><strong>Emisión:</strong> NORMAL</div>
                    <div className="pt-1">
                      <strong>Clave de Acceso:</strong>
                      <div className="font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 break-all select-all font-bold text-slate-700">
                        {selectedRetentionRide.claveAcceso}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sujeto Retenido Box */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div><strong>Razón Social / Sujeto Retenido:</strong> {selectedRetentionRide.proveedor?.nombre}</div>
                  <div><strong>Identificación:</strong> {selectedRetentionRide.proveedor?.identificacion}</div>
                  <div><strong>Dirección:</strong> {selectedRetentionRide.proveedor?.direccion || 'S/N'}</div>
                </div>
                <div>
                  <div><strong>Fecha Emisión:</strong> {selectedRetentionRide.fechaEmision}</div>
                  <div><strong>Período Fiscal:</strong> {selectedRetentionRide.periodoFiscal}</div>
                  <div><strong>Correo:</strong> {selectedRetentionRide.proveedor?.correo || 'N/A'}</div>
                </div>
              </div>

              {/* Impuestos Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black text-slate-700">
                      <th className="p-2.5">Comprobante</th>
                      <th className="p-2.5">Número Doc.</th>
                      <th className="p-2.5">Impuesto</th>
                      <th className="p-2.5 text-right">Base Imponible</th>
                      <th className="p-2.5 text-right">% Ret</th>
                      <th className="p-2.5 text-right">Valor Retenido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRetentionRide.impuestos?.map((imp, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">Factura (01)</td>
                        <td className="p-2.5 font-mono">{imp.numDocSustento || selectedRetentionRide.sustento?.numComprobante}</td>
                        <td className="p-2.5">
                          {imp.codigo === '1' ? 'RENTA' : (imp.codigo === '2' ? 'IVA' : 'ISD')} ({imp.codigoRetencion})
                        </td>
                        <td className="p-2.5 text-right font-mono">${Number(imp.baseImponible).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono">{Number(imp.porcentajeRetener).toFixed(2)}%</td>
                        <td className="p-2.5 text-right font-mono font-bold">${Number(imp.valorRetenido).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Retenido Footer */}
              <div className="flex justify-end">
                <div className="w-64 p-3 bg-sky-50 rounded-xl border border-sky-200 text-right space-y-1">
                  <div className="text-xs font-bold text-sky-800">TOTAL VALOR RETENIDO</div>
                  <div className="text-xl font-black text-sky-900 font-mono">
                    ${Number(selectedRetentionRide.totalRetenido || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
