import React, { useState, useEffect } from 'react';
import { EmitterConfig, Invoice, Client, Product, InvoiceDetail, AdicionalInfo } from '../types';
import { generateClaveAcceso, formatSequential, METODOS_PAGO, IVA_TARIFAS, IDENTIFICACIONES } from '../sri/utils';
import { 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Sparkles, 
  User, 
  ShoppingBag, 
  FileSpreadsheet, 
  CheckCircle, 
  FileText, 
  Download, 
  Loader2, 
  Mail,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Receipt,
  FileCode,
  Layers
} from 'lucide-react';
import { generateInvoiceXml } from '../sri/xmlTemplates';
import { uploadInvoiceXmlSinFirmar, uploadInvoiceXmlFirmado } from '../lib/supabase';
import { apiSignXml, apiSendSri, apiAuthorizeSri, apiSendInvoiceEmail } from '../lib/apiClient';
import { modalAlert } from '../context/ModalAlertContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import RideViewer from './RideViewer';

interface InvoiceFormProps {
  config: EmitterConfig;
  clients: Client[];
  products: Product[];
  invoices?: Invoice[];
  onAddInvoice: (invoice: Invoice) => void;
  onAddClient: (client: Client) => void;
  onAddProduct: (product: Product) => void;
  onNavigateToHistory?: () => void;
  onUpdateInvoice?: (id: string, updated: Partial<Invoice>) => void;
  onDeleteInvoice?: (id: string, secuencial?: string, claveAcceso?: string) => void;
  onOpenRide?: (doc: Invoice) => void;
}

export default function InvoiceForm({
  config,
  clients,
  products,
  invoices = [],
  onAddInvoice,
  onAddClient,
  onAddProduct,
  onNavigateToHistory,
  onUpdateInvoice,
  onDeleteInvoice,
  onOpenRide
}: InvoiceFormProps) {
  const { settings } = usePlatformSettings();
  const allowDemo = Boolean(settings?.modules?.showDemoButtons || settings?.allowDemoData);

  // Tab State
  const [viewTab, setViewTab] = useState<'emit' | 'history'>('emit');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [viewingRideInvoice, setViewingRideInvoice] = useState<Invoice | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // 1. Header State
  const [secuencialVal, setSecuencialVal] = useState('000000001');
  const [fechaEmision, setFechaEmision] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // SRI Database Lookup States (Point 3)
  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [sriLookupError, setSriLookupError] = useState('');
  const [sriLookupSuccess, setSriLookupSuccess] = useState(false);

  // Document Electronic pipeline states (Points 4, 5, 6)
  const [electAction, setElectAction] = useState<'firmar' | 'firmar_enviar'>('firmar_enviar');
  const [isProcessingSri, setIsProcessingSri] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sriLogs, setSriLogs] = useState<string[]>([]);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceRide, setShowInvoiceRide] = useState(false);

  const handleManualSendEmail = async () => {
    if (!createdInvoice) return;
    try {
      setIsSendingEmail(true);
      const data = await apiSendInvoiceEmail(createdInvoice, config);
      if (data.status === 'success') {
        modalAlert.success(
          '¡Correo Notificado con Éxito!',
          `Correo de Notificación de Documento Electrónico procesado exitosamente para ${createdInvoice.cliente.correo || 'cliente'}.\nIncluye los adjuntos XML y PDF RIDE.`
        );
      } else {
        modalAlert.warning('Aviso de Envío', `Inconveniente enviando correo: ${data.message}`);
      }
    } catch (err: any) {
      modalAlert.error('Error al Enviar Correo', `Error al procesar el correo: ${err.message || String(err)}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Since sequentials are managed via central config and incremented, keep in sync with config state
  useEffect(() => {
    if (config.ultimoSecuencialFactura) {
      setSecuencialVal(config.ultimoSecuencialFactura);
    } else {
      const stored = localStorage.getItem('sri_highest_secuencial');
      if (stored) {
        const nextSeq = parseInt(stored, 10) + 1;
        setSecuencialVal(formatSequential(nextSeq));
      } else {
        setSecuencialVal('000000002');
      }
    }
  }, [config.ultimoSecuencialFactura]);

  // 2. Client Selection or Inline Creation
  const [selectedClientId, setSelectedClientId] = useState('');
  const [buyerTipoIdent, setBuyerTipoIdent] = useState<any>('05'); // Default: Cédula
  const [buyerIdent, setBuyerIdent] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerDir, setBuyerDir] = useState('');
  const [buyerTel, setBuyerTel] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // 3. Details/Items state
  const [details, setDetails] = useState<InvoiceDetail[]>([
    {
      id: '1',
      producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 },
      cantidad: 1,
      descuento: 0,
      subtotal: 0,
      ivaCalculado: 0,
      total: 0
    }
  ]);

  const [globalIva, setGlobalIva] = useState<string>('4'); // Default is 15% (code '4')
  const [activeRowSearch, setActiveRowSearch] = useState<number | null>(null);

  // 4. Payment terms
  const [formaPago, setFormaPago] = useState('01'); // Default: Sin utilizacion del sistema financiero
  const [plazo, setPlazo] = useState(0);
  const [unidadTiempo, setUnidadTiempo] = useState<'dias' | 'meses' | 'anios'>('dias');

  // 5. Additional fields
  const [infoAdicional, setInfoAdicional] = useState<AdicionalInfo[]>([
    { id: '1', nombre: 'Descripción', valor: '' }
  ]);

  const handleGlobalIvaChange = (val: string) => {
    setGlobalIva(val);
    const updated = details.map(row => {
      const updatedRow = { ...row, producto: { ...row.producto, ivaTipo: val as any } };
      return updatedRow;
    });
    // Now recalculate all rows
    updated.forEach((_, idx) => recalcRow(updated, idx));
    setDetails(updated);
  };

  // Update client form fields when client is selected
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'NEW') {
      setBuyerIdent('');
      setBuyerName('');
      setBuyerDir('');
      setBuyerTel('');
      setBuyerEmail('');
      return;
    }

    const c = clients.find(client => client.id === clientId);
    if (c) {
      setBuyerTipoIdent(c.tipoIdentificacion);
      setBuyerIdent(c.identificacion.toUpperCase());
      setBuyerName(c.nombre.toUpperCase());
      setBuyerDir(c.direccion.toUpperCase());
      setBuyerTel(c.telefono.toUpperCase());
      setBuyerEmail(c.correo.toUpperCase());
    }
  };

  // Preset Consumidor Final for convenience
  const handleLoadConsumidorFinal = () => {
    setBuyerTipoIdent('07'); // Consumidor final
    setBuyerIdent('9999999999999');
    setBuyerName('CONSUMIDOR FINAL');
    setBuyerDir('S/N S/N');
    setBuyerTel('999999999');
    setBuyerEmail('consumidor@final.com');
    setSelectedClientId('NEW');
  };

  // Preset Example Client
  const handleLoadDemoClient = () => {
    setBuyerTipoIdent('05'); // Cedula
    setBuyerIdent('1725619391');
    setBuyerName('JHON DONALDO CHARRY VALLE');
    setBuyerDir('Quito - San Rafael, Cl. Los Olivos');
    setBuyerTel('0993812739');
    setBuyerEmail('jhon.charry@example.ec');
    setSelectedClientId('NEW');
  };

  // Preset Example Product
  const handleLoadDemoProducts = () => {
    // Inject a default product line if requested
    const demoProds = [
      {
        id: 'p1',
        producto: { id: 'p1', codigo: 'PROD-001', nombre: 'Audífonos Bluetooth Over-Ear High Fidelity', precio: 59.99, ivaTipo: '4' as any, descuentoDefault: 0 },
        cantidad: 1,
        descuento: 0,
        subtotal: 59.99,
        ivaCalculado: 9.00, // 15% of 59.99
        total: 68.99
      },
      {
        id: 'p2',
        producto: { id: 'p2', codigo: 'SOFT-005', nombre: 'Suscripción Mensual SaaS Facturación', precio: 15.00, ivaTipo: '0' as any, descuentoDefault: 0 },
        cantidad: 1,
        descuento: 0,
        subtotal: 15.00,
        ivaCalculado: 0,
        total: 15.00
      }
    ];
    setDetails(demoProds);
  };

  // Handle inline product selector change
  const handleProductChange = (index: number, val: string) => {
    const updated = [...details];
    
    if (val === 'NEW') {
      updated[index].producto = { id: 'NEW', codigo: '', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 };
      recalcRow(updated, index);
      return;
    }

    const p = products.find(prod => prod.id === val);
    if (p) {
      updated[index].producto = { ...p };
      updated[index].cantidad = updated[index].cantidad || 1;
      updated[index].descuento = p.descuentoDefault || 0;
      recalcRow(updated, index);
    }
  };

  const updateQuantity = (index: number, val: number) => {
    const updated = [...details];
    updated[index].cantidad = Math.max(0.01, val);
    recalcRow(updated, index);
  };

  const updatePrice = (index: number, val: number) => {
    const updated = [...details];
    updated[index].producto.precio = Math.max(0, val);
    recalcRow(updated, index);
  };

  const updateDiscount = (index: number, val: number) => {
    const updated = [...details];
    updated[index].descuento = Math.max(0, val);
    recalcRow(updated, index);
  };

  const updateIva = (index: number, val: any) => {
    const updated = [...details];
    updated[index].producto.ivaTipo = val;
    recalcRow(updated, index);
  };

  const updateCodeName = (index: number, field: 'codigo' | 'nombre', val: string) => {
    const updated = [...details];
    updated[index].producto[field] = val.toUpperCase();
    recalcRow(updated, index);
  };

  const recalcRow = (updated: InvoiceDetail[], index: number) => {
    const row = updated[index];
    const qty = row.cantidad || 0;
    const price = row.producto.precio || 0;
    const desc = row.descuento || 0;

    const rawSubtotal = qty * price;
    const netSubtotal = Math.max(0, rawSubtotal - desc);
    
    // Calculate IVA rate
    const ivaMapping = IVA_TARIFAS[row.producto.ivaTipo] || { rate: 0 };
    const rawIva = netSubtotal * ivaMapping.rate;

    row.subtotal = Number(netSubtotal.toFixed(4));
    row.ivaCalculado = Number(rawIva.toFixed(4));
    row.total = Number((netSubtotal + rawIva).toFixed(2));
    
    setDetails(updated);
  };

  const addDetailRow = () => {
    setDetails([
      ...details,
      {
        id: String(Date.now()),
        producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: globalIva as any, descuentoDefault: 0 },
        cantidad: 1,
        descuento: 0,
        subtotal: 0,
        ivaCalculado: 0,
        total: 0
      }
    ]);
  };

  const removeDetailRow = (index: number) => {
    if (details.length <= 1) return;
    const updated = [...details];
    updated.splice(index, 1);
    setDetails(updated);
  };

  const handleCreateProductInline = (index: number) => {
    const detail = details[index];
    if (!detail.producto.codigo || !detail.producto.nombre) {
      modalAlert.warning('Datos Incompletos', 'Por favor ingrese código y nombre para el nuevo producto.');
      return;
    }

    const newProd: Product = {
      id: 'p-' + Date.now(),
      codigo: detail.producto.codigo,
      nombre: detail.producto.nombre,
      precio: detail.producto.precio,
      ivaTipo: detail.producto.ivaTipo,
      descuentoDefault: detail.descuento
    };

    onAddProduct(newProd);
    
    // Replace inline edit with newly saved product code
    const updated = [...details];
    updated[index].producto = { ...newProd };
    setDetails(updated);
    modalAlert.success('Producto Guardado', '¡Producto guardado en su catálogo con éxito!');
  };

  // Totals calculations
  let base0 = 0;
  let baseIva = 0;
  let valorIva = 0;
  let subtotal = 0;
  let totalDescuento = 0;

  details.forEach(row => {
    subtotal += row.subtotal;
    totalDescuento += row.descuento;
    if (row.producto.ivaTipo === '2' || row.producto.ivaTipo === '4') {
      baseIva += row.subtotal;
      valorIva += row.ivaCalculado;
    } else {
      base0 += row.subtotal;
    }
  });

  const aggregateTotal = subtotal + valorIva;

  // Clave Acceso Generation in Realtime
  let currentClaveAcceso = '';
  let claveError = '';
  try {
    currentClaveAcceso = generateClaveAcceso({
      fechaEmision,
      tipoComprobante: '01',
      ruc: config.ruc,
      ambiente: config.ambiente,
      establecimiento: config.codEstablecimiento,
      puntoEmision: config.codPuntoEmision,
      secuencial: secuencialVal
    });
  } catch (err: any) {
    claveError = err.message || String(err);
  }

  // SRI Lookup API handler (Point 3)
  const handleSriLookup = async () => {
    if (!buyerIdent) return;
    setIsSearchingSri(true);
    setSriLookupError('');
    setSriLookupSuccess(false);

    try {
      const resp = await fetch(`/api/sri-lookup?id=${encodeURIComponent(buyerIdent)}`);
      const data = await resp.json();
      if (!resp.ok || data.status === 'error') {
        throw new Error(data.message || 'Error consultando la base de datos de clientes.');
      }

      const clientInfo = data.client;
      setBuyerTipoIdent(clientInfo.tipoIdentificacion);
      setBuyerName(clientInfo.nombre.toUpperCase());
      setBuyerDir(clientInfo.direccion.toUpperCase());
      setBuyerTel(clientInfo.telefono.toUpperCase());
      setBuyerEmail(clientInfo.correo.toUpperCase());
      setSriLookupSuccess(true);

    } catch (err: any) {
      setSriLookupError(err.message || 'No se pudo conectar a la base del SRI o ID inválido.');
    } finally {
      setIsSearchingSri(false);
    }
  };

  const getOrCreateClient = (): Client => {
    const clientExists = clients.some(c => c.identificacion === buyerIdent);
    if (!clientExists) {
      const newClient: Client = {
        id: 'c-' + Date.now(),
        tipoIdentificacion: buyerTipoIdent,
        identificacion: buyerIdent,
        nombre: buyerName,
        direccion: buyerDir || 'S/N',
        telefono: buyerTel || '999999999',
        correo: buyerEmail || 'ventas@sri-ecuador.com'
      };
      onAddClient(newClient);
      return newClient;
    } else {
      return clients.find(c => c.identificacion === buyerIdent)!;
    }
  };

  const handleSaveAsDraftOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!buyerIdent || !buyerName) {
      modalAlert.warning('Datos Incompletos', 'Por favor complete datos del cliente.');
      return;
    }

    if (!details || details.length === 0) {
      modalAlert.warning('Detalle Requerido', 'Debe agregar al menos un ítem o producto a la factura.');
      return;
    }

    if (details.some(d => !d.producto.nombre || !d.producto.nombre.trim() || d.producto.precio <= 0)) {
      modalAlert.warning('Productos Inválidos', 'Por favor, revise que todos los productos agregados tengan un nombre válido y precio mayor a 0.');
      return;
    }

    const finalBuyer = getOrCreateClient();

    // Create Invoice object
    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      secuencial: secuencialVal,
      fechaEmision,
      cliente: finalBuyer,
      detalles: details,
      formaPago,
      plazo,
      unidadTiempo,
      claveAcceso: currentClaveAcceso,
      estado: 'Borrador',
      mensajesSRI: [],
      infoAdicional: infoAdicional.filter(info => info.nombre && info.valor),
      resumenImpuestos: {
        base0,
        baseIva,
        valorIva,
        subtotal,
        descuento: totalDescuento,
        total: aggregateTotal
      }
    };

    // Store highest sequential
    const seqNum = parseInt(secuencialVal, 10);
    localStorage.setItem('sri_highest_secuencial', String(seqNum));

    onAddInvoice(newInvoice);
    onNavigateToHistory();
    modalAlert.success('Borrador Guardado', `¡Factura borrador #${secuencialVal} creada y guardada con éxito!`);
  };

  const handleSaveAndProcessSri = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!buyerIdent || !buyerName) {
      modalAlert.warning('Datos Incompletos', 'Por favor complete datos del cliente.');
      return;
    }

    if (!details || details.length === 0) {
      modalAlert.warning('Detalle Requerido', 'Debe agregar al menos un ítem o producto a la factura.');
      return;
    }

    if (details.some(d => !d.producto.nombre || !d.producto.nombre.trim() || d.producto.precio <= 0)) {
      modalAlert.warning('Productos Inválidos', 'Por favor, revise que todos los productos agregados tengan un nombre válido y precio mayor a 0.');
      return;
    }

    setIsProcessingSri(true);
    setSriLogs(['Iniciando procesamiento de documento electrónico...']);
    setCreatedInvoice(null);

    try {
      const finalBuyer = getOrCreateClient();

      // Initialize base invoice object
      const newInvoice: Invoice = {
        id: 'inv-' + Date.now(),
        secuencial: secuencialVal,
        fechaEmision,
        cliente: finalBuyer,
        detalles: details,
        formaPago,
        plazo,
        unidadTiempo,
        claveAcceso: currentClaveAcceso,
        estado: 'Borrador',
        mensajesSRI: [],
        infoAdicional: infoAdicional.filter(info => info.nombre && info.valor),
        resumenImpuestos: {
          base0,
          baseIva,
          valorIva,
          subtotal,
          descuento: totalDescuento,
          total: aggregateTotal
        }
      };

      // 1. Generate Raw XML
      setSriLogs(prev => [...prev, '⚙️ Generando estructura XML del comprobante...']);
      const rawXml = generateInvoiceXml(newInvoice, config);
      newInvoice.xml = rawXml;

      // Backup unsigned XML to Supabase Storage
      uploadInvoiceXmlSinFirmar(config.codEstablecimiento, config.codPuntoEmision, secuencialVal, rawXml)
        .then(res => {
          if (res.success) setSriLogs(prev => [...prev, '☁️ XML sin firmar guardado en Supabase Storage (facturas-xml-sin-firmar)']);
        })
        .catch(() => {});

      // 2. Electronic signature via XAdES-BES
      setSriLogs(prev => [...prev, '✍️ Conectando con Servicio de Firma Electrónica (XAdES-BES)...']);
      const signData = await apiSignXml(
        rawXml,
        config.isDemoMode ? undefined : config.p12FirmaB64,
        config.isDemoMode ? undefined : config.p12Password,
        config.isDemoMode
      );

      if (signData.status !== 'success' || !signData.signedXml) {
        throw new Error(`Firma Electrónica no autorizada: ${signData.message || 'Error al firmar'}`);
      }

      const signedXml = signData.signedXml;
      newInvoice.xmlFirmado = signedXml;
      newInvoice.estado = 'Firmado';
      setSriLogs(prev => [...prev, '✓ Documento firmado exitosamente con firma .p12 para Ecuador.']);

      // Backup signed XML to Supabase Storage
      uploadInvoiceXmlFirmado(config.codEstablecimiento, config.codPuntoEmision, secuencialVal, signedXml)
        .then(res => {
          if (res.success) setSriLogs(prev => [...prev, '☁️ XML firmado guardado en Supabase Storage (facturas-xml-firmados)']);
        })
        .catch(() => {});

      if (electAction === 'firmar') {
        newInvoice.mensajesSRI = [{ mensaje: 'DOCUMENTO FIRMADO LOCALMENTE', tipo: 'INFORMATIVO' }];
        const seqNum = parseInt(secuencialVal, 10);
        localStorage.setItem('sri_highest_secuencial', String(seqNum));

        // Auto-send email notification to client with XML and PDF attached
        if (finalBuyer.correo) {
          try {
            setSriLogs(prev => [...prev, `📧 Despachando correo de notificación a ${finalBuyer.correo}...`]);
            const emailData = await apiSendInvoiceEmail(newInvoice, config, finalBuyer.correo);
            if (emailData.status === 'success') {
              setSriLogs(prev => [...prev, `✅ Correo enviado exitosamente a ${finalBuyer.correo} (Factura en PDF y XML adjuntos).`]);
            } else {
              setSriLogs(prev => [...prev, `⚠️ Notificación de correo: ${emailData.message}`]);
            }
          } catch (e: any) {
            console.warn('Error al despachar correo:', e);
          }
        }

        onAddInvoice(newInvoice);
        setCreatedInvoice(newInvoice);
        setIsProcessingSri(false);
        setSriLogs(prev => [...prev, '✓ Proceso terminado de forma local. Estado: Firmado con XAdES-BES.']);
        modalAlert.success('Factura Firmada', `¡Factura #${secuencialVal} FIRMADA con éxito!\nSe despachó el correo a ${finalBuyer.correo || 'cliente'}.`);
        return;
      }

      // If action is firmar_enviar (Default)
      setSriLogs(prev => [...prev, '📡 Transmitiendo XML firmado a los servidores de RECEPCIÓN del SRI (SOAP)...']);
      
      const sendResult = await apiSendSri(signedXml, currentClaveAcceso, config.ambiente, config.isDemoMode);

      if (sendResult.status !== 'success' || !sendResult.data) {
        throw new Error(`Fallo transmisión SOAP SRI: ${sendResult.message || 'Sin respuesta de recepción'}`);
      }

      const recepcion = sendResult.data;
      if (recepcion.estado === 'DEVUELTA') {
        newInvoice.estado = 'Devuelto';
        newInvoice.mensajesSRI = recepcion.mensajes;
        onAddInvoice(newInvoice);
        setCreatedInvoice(newInvoice);
        setIsProcessingSri(false);
        setSriLogs(prev => [...prev, '❌ Recibido pero DEVUELTO por el SRI con observaciones de formato o datos.']);
        modalAlert.error('Comprobante Rechazado por el SRI', 'Comprobante rechazado por el SRI (Devuelto). Detalle de observaciones disponible en Historial.');
        return;
      }

      if (recepcion.estado === 'ERROR_CONEXION') {
        newInvoice.mensajesSRI = recepcion.mensajes;
        onAddInvoice(newInvoice);
        setCreatedInvoice(newInvoice);
        setIsProcessingSri(false);
        setSriLogs(prev => [...prev, '⚠️ Error de enlace. Se guardó el comprobante localmente para posterior reIntento.']);
        modalAlert.warning('SRI Fuera de Línea', 'El SRI se encuentra fuera de línea o hubo un timeout. Comprobante guardado en borrador para posterior reintento.');
        return;
      }

      newInvoice.estado = 'Enviado';
      setSriLogs(prev => [...prev, '✓ Comprobante aceptado en recepción. Iniciando consulta de AUTORIZACIÓN (SOAP)...']);

      // 4. Query authorization
      const authResult = await apiAuthorizeSri(currentClaveAcceso, config.ambiente, config.isDemoMode);

      if (authResult.status !== 'success' || !authResult.data) {
        throw new Error(`Error en consulta de Autorización SRI: ${authResult.message || 'Sin respuesta de autorización'}`);
      }

      const autorizacion = authResult.data;
      if (autorizacion.estado === 'AUTORIZADO') {
        newInvoice.estado = 'Autorizado';
        newInvoice.fechaAutorizacion = autorizacion.fechaAutorizacion;
        newInvoice.numeroAutorizacion = autorizacion.numeroAutorizacion;
        newInvoice.mensajesSRI = autorizacion.mensajes;
        
        setSriLogs(prev => [
          ...prev, 
          `🚀 ¡AUTORIZADO por el SRI!`, 
          `Nro. Autorización: ${autorizacion.numeroAutorizacion}`,
          `Fecha de proceso: ${autorizacion.fechaAutorizacion}`
        ]);
        
        const seqNum = parseInt(secuencialVal, 10);
        localStorage.setItem('sri_highest_secuencial', String(seqNum));

        // Auto-send email notification to client with XML and PDF attached
        if (finalBuyer.correo) {
          try {
            setSriLogs(prev => [...prev, `📧 Despachando notificación por correo electrónico a ${finalBuyer.correo}...`]);
            const emailData = await apiSendInvoiceEmail(newInvoice, config, finalBuyer.correo);
            if (emailData.status === 'success') {
              setSriLogs(prev => [...prev, `✅ Correo enviado exitosamente a ${finalBuyer.correo} (Factura en PDF y XML adjuntos).`]);
            } else {
              setSriLogs(prev => [...prev, `⚠️ Notificación de correo: ${emailData.message}`]);
            }
          } catch (e: any) {
            console.warn('Error al despachar correo:', e);
          }
        }
        
        onAddInvoice(newInvoice);
        setCreatedInvoice(newInvoice);
        setIsProcessingSri(false);
        modalAlert.success(
          '¡Factura Autorizada por el SRI!',
          `¡Factura #${secuencialVal} FIRMADA, ENVIADA y AUTORIZADA correctamente por el SRI!\nCorreo enviado a: ${finalBuyer.correo || 'cliente'}`
        );
      } else {
        newInvoice.estado = 'No Autorizado';
        newInvoice.mensajesSRI = autorizacion.mensajes;
        onAddInvoice(newInvoice);
        setCreatedInvoice(newInvoice);
        setIsProcessingSri(false);
        setSriLogs(prev => [...prev, '❌ Comprobante NO AUTORIZADO por el SRI. Detalle registrado para re-procesar.']);
        modalAlert.error('Comprobante No Autorizado', 'Comprobante No Autorizado por discrepancias detectadas por el SRI.');
      }

    } catch (err: any) {
      setIsProcessingSri(false);
      setSriLogs(prev => [...prev, `❌ Error ocurrido: ${err.message || String(err)}`]);
      modalAlert.error('Error Procesando Trámite SRI', `Inconveniente procesando trámite SRI: ${err.message || String(err)}`);
    }
  };

  const downloadCreatedInvoiceXml = () => {
    if (!createdInvoice) return;
    const content = createdInvoice.xmlFirmado || createdInvoice.xml || '';
    const blob = new Blob([content], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FACTURA_${createdInvoice.secuencial}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearFormAndNew = () => {
    setCreatedInvoice(null);
    setDetails([
      {
        id: '1',
        producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: globalIva as any, descuentoDefault: 0 },
        cantidad: 1,
        descuento: 0,
        subtotal: 0,
        ivaCalculado: 0,
        total: 0
      }
    ]);
    
    // Auto-increment secuencial
    const stored = localStorage.getItem('sri_highest_secuencial');
    if (stored) {
      const nextSeq = parseInt(stored, 10) + 1;
      setSecuencialVal(formatSequential(nextSeq));
    }
    
    // Clear client form
    setSelectedClientId('');
    setBuyerIdent('');
    setBuyerName('');
    setBuyerDir('');
    setBuyerTel('');
    setBuyerEmail('');
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerIdent || !buyerName) {
      modalAlert.warning('Datos Incompletos', 'Por favor complete datos del cliente.');
      return;
    }

    if (details.some(d => !d.producto.nombre || d.producto.precio <= 0)) {
      modalAlert.warning('Productos Inválidos', 'Por favor, revise que todos los productos agregados tengan nombre y precio mayor a 0.');
      return;
    }

    // Save Client to catalog if not exists
    const clientExists = clients.some(c => c.identificacion === buyerIdent);
    let finalBuyer: Client;
    if (!clientExists) {
      const newClient: Client = {
        id: 'c-' + Date.now(),
        tipoIdentificacion: buyerTipoIdent,
        identificacion: buyerIdent,
        nombre: buyerName,
        direccion: buyerDir || 'S/N',
        telefono: buyerTel || '999999999',
        correo: buyerEmail || 'ventas@sri-ecuador.com'
      };
      onAddClient(newClient);
      finalBuyer = newClient;
    } else {
      finalBuyer = clients.find(c => c.identificacion === buyerIdent)!;
    }

    // Create Invoice object
    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      secuencial: secuencialVal,
      fechaEmision,
      cliente: finalBuyer,
      detalles: details,
      formaPago,
      plazo,
      unidadTiempo,
      claveAcceso: currentClaveAcceso,
      estado: 'Borrador',
      mensajesSRI: [],
      infoAdicional: infoAdicional.filter(info => info.nombre && info.valor),
      resumenImpuestos: {
        base0,
        baseIva,
        valorIva,
        subtotal,
        descuento: totalDescuento,
        total: aggregateTotal
      }
    };

    // Store highest sequential so it acts as auto-incremental next time
    const seqNum = parseInt(secuencialVal, 10);
    localStorage.setItem('sri_highest_secuencial', String(seqNum));

    onAddInvoice(newInvoice);
    if (onNavigateToHistory) {
      onNavigateToHistory();
    } else {
      setViewTab('history');
    }
    modalAlert.success('Borrador Guardado', `¡Factura borrador #${secuencialVal} creada y lista en el historial para firma/envío!`);
  };

  // Filtered Invoices for History
  const filteredInvoices = (invoices || []).filter(inv => {
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      (inv.secuencial || '').includes(cleanSearch) ||
      (inv.cliente?.nombre || '').toLowerCase().includes(cleanSearch) ||
      (inv.cliente?.identificacion || '').includes(cleanSearch) ||
      (inv.claveAcceso || '').includes(cleanSearch);

    const matchesEstado = filterEstado === 'TODOS' || (inv.estado || 'BORRADOR').toUpperCase() === filterEstado.toUpperCase();
    return matchesSearch && matchesEstado;
  });

  const downloadInvoiceXml = (inv: Invoice) => {
    const xmlContent = inv.xmlFirmado || inv.xml;
    if (!xmlContent) {
      modalAlert.warning('XML No Disponible', 'El XML firmado aún no está generado para este comprobante.');
      return;
    }
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FACTURA_${inv.secuencial}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmailHistory = async (inv: Invoice) => {
    try {
      setSendingEmailId(inv.id);
      const data = await apiSendInvoiceEmail(inv, config);
      if (data.status === 'success') {
        modalAlert.success(
          '¡Correo Notificado con Éxito!',
          `Correo de Notificación procesado exitosamente para ${inv.cliente?.correo || 'cliente'}.\nIncluye los adjuntos XML y PDF RIDE.`
        );
      } else {
        modalAlert.warning('Aviso de Envío', `Inconveniente enviando correo: ${data.message}`);
      }
    } catch (err: any) {
      modalAlert.error('Error al Enviar Correo', `Error al despachar el correo: ${err.message || String(err)}`);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDeleteInvoiceItem = (inv: Invoice) => {
    modalAlert.confirm(
      '¿Eliminar factura?',
      `¿Está seguro de eliminar la Factura #${inv.secuencial} emitida a ${inv.cliente?.nombre || 'Consumidor'}?\nEsta acción borrará el registro de la base de datos y sus archivos generados en Storage.`,
      () => {
        if (onDeleteInvoice) {
          onDeleteInvoice(inv.id, inv.secuencial, inv.claveAcceso);
          modalAlert.success('Factura Eliminada', `La factura #${inv.secuencial} ha sido eliminada con éxito.`);
        }
      },
      true,
      'Eliminar Factura',
      'Cancelar'
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* HEADER BANNER - EXACT IMAGE DESIGN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Facturación Electrónica (SRI Tipo 01)
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Emisión de facturas autorizadas por el SRI con cálculo de IVA, descuentos, firma digital XAdES-BES y almacenamiento seguro en Storage.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle Buttons - FIXED DIMENSIONS PREVENTS CONTAINER OVERFLOW */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 shrink-0">
          <button
            id="tab-emit-invoice"
            type="button"
            onClick={() => setViewTab('emit')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap shrink-0 min-w-[130px] ${
              viewTab === 'emit'
                ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-zinc-700'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Emitir Factura</span>
          </button>
          <button
            id="tab-history-invoice"
            type="button"
            onClick={() => setViewTab('history')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap shrink-0 min-w-[130px] ${
              viewTab === 'history'
                ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-zinc-700'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Historial ({(invoices || []).length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EMITIR FACTURA */}
      {viewTab === 'emit' && (
        <form onSubmit={handleSubmitInvoice} className="space-y-6">

      {/* SECCIÓN CONFIGURACIÓN DE EMISIÓN */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-150 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-gray-700 dark:text-zinc-300">
            Punto de Emisión Actual: <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{config.codEstablecimiento}-{config.codPuntoEmision}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-zinc-400">
            Régimen Tributario: <span className="font-semibold text-gray-700 dark:text-zinc-300">{config.regimen || 'GENERAL'}</span> | Ambiente: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{config.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1 font-mono">SECUENCIAL (9 Dígitos)</label>
            <input
              type="text"
              value={secuencialVal}
              disabled={true}
              className="px-4 py-1.5 border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 font-mono text-center text-sm rounded-xl focus:outline-none cursor-not-allowed select-none opacity-80"
              title="Este campo se autogestiona y se modifica desde la pestaña Configuración SRI"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1 font-mono">FECHA EMISIÓN</label>
            <input
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              className="px-4 py-1.5 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN DATOS DEL COMPRADOR / CLIENTE */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-zinc-800">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <User className="text-indigo-600 w-5 h-5" />
            Información del Comprador / Cliente
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLoadConsumidorFinal}
              className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
            >
              Consumidor Final
            </button>
            {allowDemo && (
              <button
                type="button"
                onClick={handleLoadDemoClient}
                className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
              >
                Cargar Cliente Demo
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Buscar en Catálogo</label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="NEW">-- Registrar Nuevo Cliente --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.identificacion})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Tipo de Identificación</label>
            <select
              value={buyerTipoIdent}
              onChange={(e) => setBuyerTipoIdent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {IDENTIFICACIONES.map(i => (
                <option key={i.code} value={i.code}>{i.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">
              Nro. Identificación (Cédula/RUC)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={buyerIdent}
                onChange={(e) => {
                  setBuyerIdent(e.target.value.replace(/[^\d\w-]/g, '').toUpperCase());
                  setSriLookupError('');
                  setSriLookupSuccess(false);
                }}
                placeholder="Ej. 1725619391"
                required
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono"
              />
              <button
                type="button"
                onClick={handleSriLookup}
                disabled={isSearchingSri || !buyerIdent}
                className="px-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                title="Consultar Registro SRI"
              >
                {isSearchingSri ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>🔍 Consultar SRI</span>
                )}
              </button>
            </div>
            {sriLookupError && (
              <span className="text-[10px] text-red-500 font-medium mt-1 block">{sriLookupError}</span>
            )}
            {sriLookupSuccess && (
              <span className="text-[10px] text-emerald-600 font-medium mt-1 block">✓ Datos cargados del SRI</span>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Nombre Completo / Razón Social</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value.toUpperCase())}
              placeholder="Ej. JHON DONALDO CHARRY VALLE"
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Dirección del Cliente</label>
            <input
              type="text"
              value={buyerDir}
              onChange={(e) => setBuyerDir(e.target.value.toUpperCase())}
              placeholder="Ej. San Rafael, Valle de Los Chillos"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Teléfono</label>
            <input
              type="text"
              value={buyerTel}
              onChange={(e) => setBuyerTel(e.target.value.toUpperCase())}
              placeholder="Ej. 0993812739"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Correo Electrónico (Para envío de XML/RIDE)</label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value.toUpperCase())}
              placeholder="Ej. john.charry@gmail.com"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Porcentaje IVA de la Factura</label>
            <select
              value={globalIva}
              onChange={(e) => handleGlobalIvaChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
            >
              {Object.entries(IVA_TARIFAS).map(([code, def]) => (
                <option key={code} value={code}>{def.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN DETALLES O PRODUCTOS AGREGADOS */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-50 dark:border-zinc-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <ShoppingBag className="text-indigo-600 w-5 h-5" />
            Detalles de Factura (Servicios o Productos)
          </h3>
          <div className="flex gap-2">
            {allowDemo && (
              <button
                type="button"
                onClick={handleLoadDemoProducts}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Agregar Productos de Prueba
              </button>
            )}
            <button
              type="button"
              onClick={addDetailRow}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Fila
            </button>
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className={`overflow-x-auto pt-1 transition-all duration-200 ${activeRowSearch !== null ? 'min-h-[400px] pb-72' : 'min-h-[140px] pb-4'}`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 rounded-l-xl w-24 sm:w-28">Código</th>
                <th className="px-3 py-3 min-w-[220px]">Descripción del Servicio / Bien</th>
                <th className="px-2.5 py-3 w-16 sm:w-20 text-center">Cant.</th>
                <th className="px-2.5 py-3 w-22 sm:w-26 text-right">Precio ($)</th>
                <th className="px-2.5 py-3 w-16 sm:w-20 text-right">Desc ($)</th>
                <th className="px-3 py-3 text-right w-24 sm:w-28">Subtotal ($)</th>
                <th className="px-2 py-3 w-10 text-center rounded-r-xl"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
              {details.map((row, index) => {
                const isNewProd = row.producto.id === 'NEW' || !row.producto.id;
                const searchTerm = (row.producto.nombre || '').toLowerCase().trim();
                const filteredProducts = products.filter(p =>
                  !searchTerm ||
                  (p.nombre && p.nombre.toLowerCase().includes(searchTerm)) ||
                  (p.codigo && p.codigo.toLowerCase().includes(searchTerm))
                );
                
                return (
                  <tr key={row.id} className="group hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                    {/* Código Único */}
                    <td className="px-3 py-2.5 align-top">
                      <input
                        type="text"
                        placeholder="Ej. 001"
                        value={row.producto.codigo}
                        onChange={(e) => updateCodeName(index, 'codigo', e.target.value)}
                        className="w-full py-1.5 px-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase transition shadow-2xs"
                      />
                    </td>

                    {/* Descripción con Autocompletado del Catálogo */}
                    <td className="px-3 py-2.5 align-top relative">
                      <div className="relative w-full">
                        <input
                          type="text"
                          placeholder="Buscar en catálogo o escribir servicio/bien..."
                          value={row.producto.nombre || ''}
                          onFocus={() => setActiveRowSearch(index)}
                          onBlur={() => {
                            setTimeout(() => {
                              if (activeRowSearch === index) {
                                setActiveRowSearch(null);
                              }
                            }, 220);
                          }}
                          onChange={(e) => {
                            updateCodeName(index, 'nombre', e.target.value);
                          }}
                          className="w-full py-1.5 px-3 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase font-medium transition shadow-2xs"
                        />
                        
                        {/* Dropdown list search overlay con diseño amplio y sin recortes */}
                        {activeRowSearch === index && (
                          <div className="absolute left-0 top-full mt-2 w-full min-w-[340px] max-w-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150 overflow-hidden ring-1 ring-black/10 dark:ring-white/10">
                            <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-950 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex justify-between items-center border-b border-gray-100 dark:border-zinc-800">
                              <span className="flex items-center gap-1.5">
                                📦 <span>Catálogo de Productos y Servicios</span>
                              </span>
                              <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border border-indigo-200/50 dark:border-indigo-800/50">
                                {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
                              </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/60">
                              {filteredProducts.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onMouseDown={() => {
                                    const updated = [...details];
                                    updated[index].producto = { ...p };
                                    updated[index].cantidad = updated[index].cantidad || 1;
                                    updated[index].descuento = p.descuentoDefault || 0;
                                    recalcRow(updated, index);
                                    setActiveRowSearch(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 text-xs text-gray-800 dark:text-zinc-200 transition-colors flex flex-col gap-1 cursor-pointer group/item"
                                >
                                  <div className="font-bold text-gray-900 dark:text-gray-100 uppercase flex justify-between items-center text-xs">
                                    <span className="truncate pr-3 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">{p.nombre}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black shrink-0 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">${p.precio.toFixed(2)}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono flex items-center justify-between">
                                    <span className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded text-[9px] font-semibold text-gray-600 dark:text-zinc-400">
                                      CÓD: {p.codigo}
                                    </span>
                                    {p.descuentoDefault > 0 && (
                                      <span className="text-amber-600 dark:text-amber-400 font-bold text-[9px]">
                                        Desc. recurrente: ${p.descuentoDefault.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                              {filteredProducts.length === 0 && (
                                <div className="px-4 py-4 text-xs text-gray-500 dark:text-zinc-400 text-center bg-gray-50/50 dark:bg-zinc-950/50 space-y-1">
                                  <p className="font-medium">
                                    {products.length === 0 
                                      ? 'No hay productos guardados en el catálogo aún.' 
                                      : 'Sin resultados para este criterio.'}
                                  </p>
                                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                    Puedes escribir libremente la descripción en esta fila.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td className="px-2.5 py-2.5 align-top">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={row.cantidad}
                        onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                        className="w-full py-1.5 px-2 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-2xs"
                      />
                    </td>

                    {/* Precio Unitario */}
                    <td className="px-2.5 py-2.5 align-top">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.producto.precio}
                        onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                        className="w-full py-1.5 px-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-2xs"
                      />
                    </td>

                    {/* Descuento */}
                    <td className="px-2.5 py-2.5 align-top">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.descuento}
                        onChange={(e) => updateDiscount(index, parseFloat(e.target.value) || 0)}
                        className="w-full py-1.5 px-2 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-right font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-2xs"
                      />
                    </td>

                    {/* Subtotal */}
                    <td className="px-3 py-2.5 align-middle text-right font-mono text-xs font-black text-gray-900 dark:text-gray-100">
                      ${row.subtotal.toFixed(2)}
                    </td>

                    {/* Acciones */}
                    <td className="px-2 py-2.5 align-middle text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {isNewProd && row.producto.codigo && row.producto.nombre && (
                          <button
                            type="button"
                            onClick={() => handleCreateProductInline(index)}
                            title="Guardar este item al catálogo recurrente"
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeDetailRow(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition cursor-pointer"
                          title="Eliminar fila"
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

      {/* METODOS PAGO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-4 md:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-800 pb-2">Formas de Pago SRI</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Método de Pago SRI</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                {METODOS_PAGO.map(item => (
                  <option key={item.code} value={item.code}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Plazo</label>
                <input
                  type="number"
                  value={plazo}
                  onChange={(e) => setPlazo(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-4 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Unidad</label>
                <select
                  value={unidadTiempo}
                  onChange={(e) => setUnidadTiempo(e.target.value as any)}
                  className="w-full px-4 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs"
                >
                  <option value="dias">Días</option>
                  <option value="meses">Meses</option>
                  <option value="anios">Años</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-4 space-y-3">
            <h4 className="font-bold text-gray-905 dark:text-gray-100 text-xs tracking-wider uppercase">Información Adicional</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 mb-1 uppercase">Descripción Únicamente</label>
                <textarea
                  value={infoAdicional[0]?.valor || ''}
                  onChange={(e) => {
                    const updated = [...infoAdicional];
                    if (updated[0]) {
                      updated[0].valor = e.target.value.toUpperCase();
                    } else {
                      updated.push({ id: '1', nombre: 'Descripción', valor: e.target.value.toUpperCase() });
                    }
                    setInfoAdicional(updated);
                  }}
                  placeholder="Detalle o descripción adicional de la forma de pago..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-indigo-500 uppercase font-medium"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESUMEN TOTALES LIQUIDO */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-3 font-mono text-xs">
          <h3 className="font-sans font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-800 pb-2 text-sm">Resumen Tributario</h3>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal Sin Impuesto:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-150">${(subtotal + totalDescuento).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Descuento Global (-):</span>
            <span className="font-semibold text-red-600">-${totalDescuento.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal 0% (Base Exenta):</span>
            <span className="font-semibold text-gray-900 dark:text-gray-150">${base0.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal Gravado (Base IVA):</span>
            <span className="font-semibold text-gray-900 dark:text-gray-150">${baseIva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-indigo-600 font-bold">
            <span>IVA Calculado (+):</span>
            <span>+${valorIva.toFixed(2)}</span>
          </div>
          <hr className="border-gray-100 dark:border-zinc-800 my-1" />
          <div className="flex justify-between font-sans text-base font-bold text-gray-950 dark:text-gray-50">
            <span>Total a Pagar:</span>
            <span>${aggregateTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* CLAVE DE ACCESO PREVIEW */}
      <div className="bg-gray-100/70 p-4 rounded-xl border border-gray-200 dark:bg-zinc-950/20 dark:border-zinc-800 space-y-2">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            <ShieldAlert className="w-4 h-4" />
            Clave de Acceso Generada en Tiempo Real (SRI Modulo 11)
          </span>
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded font-mono">
            Longitud: {currentClaveAcceso.length} dígitos
          </span>
        </div>
        
        {claveError ? (
          <div className="text-xs text-red-500 font-mono">{claveError}</div>
        ) : (
          <div className="font-mono text-[11px] break-all leading-relaxed tracking-wider text-gray-800 dark:text-gray-300 bg-white dark:bg-zinc-900/50 p-2.5 rounded-lg border border-gray-200/40">
            {currentClaveAcceso}
          </div>
        )}
        <p className="text-[10px] text-gray-500 leading-normal">
          Esta clave es única para cada comprobante electrónico y contiene la fecha de emisión ({fechaEmision.split('-').reverse().join('')}), tipo ('01'), RUC del emisor, ambiente ('{config.ambiente === '1' ? 'Pruebas' : 'Producción'}'), establecimiento ('{config.codEstablecimiento}'), punto de emisión ('{config.codPuntoEmision}'), secuencial ('{secuencialVal}') y dígito verificador módulo 11 ({currentClaveAcceso.substring(currentClaveAcceso.length - 1)}).
        </p>
      </div>

      {/* PROCESSING STATUS LOGS AND DETAILS */}
      {isProcessingSri && (
        <div className="bg-white p-5 rounded-2xl border border-indigo-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
            <h4 className="font-bold text-sm">Tramitando Comprobante Electrónico...</h4>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-gray-100 dark:border-zinc-850 font-mono text-[10px] space-y-1.5 max-h-[140px] overflow-y-auto">
            {sriLogs.map((log, lIdx) => (
              <div key={lIdx} className="text-gray-600 dark:text-zinc-400 leading-normal">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RIDE BARCODE & XML ACCORDION TRIGGER (Point 6) */}
      {createdInvoice && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-150 dark:border-emerald-900/50 space-y-3 animate-fade-in" id="ride-preview-action-card">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">¡Factura Electrónica Procesada!</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-500">
                Se registró el comprobante #{createdInvoice.secuencial} en estado <strong>{createdInvoice.estado}</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowInvoiceRide(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Visualizar RIDE (Factura PDF)
            </button>
            <button
              type="button"
              onClick={handleManualSendEmail}
              disabled={isSendingEmail}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" /> {isSendingEmail ? 'Enviando...' : 'Re-Enviar Correo al Cliente'}
            </button>
            <button
              type="button"
              onClick={downloadCreatedInvoiceXml}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> {createdInvoice.estado === 'Firmado' ? 'Descargar XML Firmado' : 'Descargar XML Autorizado'}
            </button>
            <button
              type="button"
              onClick={handleClearFormAndNew}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-semibold transition cursor-pointer font-sans"
            >
              ✨ Emitir otra Factura Nueva
            </button>
          </div>
        </div>
      )}

      {/* SRI SETTINGS & SUBMIT PANEL FOOTER (Points 4, 5) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 dark:bg-zinc-900 dark:border-zinc-805 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Dropdown Documento Electronico (Point 5) */}
          <div className="w-full sm:max-w-xs">
            <label className="block text-xs font-semibold text-gray-650 dark:text-zinc-400 mb-1">
              Acción de Documento Electrónico
            </label>
            <select
              value={electAction}
              onChange={(e) => setElectAction(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="firmar_enviar">Firmar y Enviar al SRI (Autorización Completa)</option>
              <option value="firmar">Firmar Comprobante únicamente (XAdES-BES)</option>
            </select>
          </div>

          {/* Opciones Guardar o Guardar y Enviar (Point 4) */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSaveAsDraftOnly()}
              disabled={isProcessingSri}
              className="px-5 py-3 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-zinc-800 font-semibold rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              💾 Guardar como Borrador
            </button>
            <button
              type="button"
              onClick={() => handleSaveAndProcessSri()}
              disabled={isProcessingSri}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessingSri ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>⚙️ Guardar y Procesar Trámite</span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* END TAB 1 */}
        </form>
      )}

      {/* TAB 2: HISTORIAL DE FACTURAS */}
      {viewTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número, cliente, RUC o clave de acceso..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 shrink-0">Estado:</span>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="AUTORIZADO">AUTORIZADO</option>
                <option value="ENVIADO">ENVIADO / PENDIENTE</option>
                <option value="DEVUELTO">DEVUELTO</option>
                <option value="NO AUTORIZADO">NO AUTORIZADO</option>
                <option value="BORRADOR">BORRADOR</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterEstado('TODOS');
                }}
                className="p-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0"
                title="Limpiar filtros"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 p-12 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto" />
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">No hay facturas registradas</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                No se encontraron facturas emitidas con los filtros actuales. Haga clic en "Emitir Factura" para crear una nueva factura.
              </p>
              <button
                type="button"
                onClick={() => setViewTab('emit')}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-sky-700 transition-all inline-flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Emitir Primera Factura</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                      <th className="p-3.5">Secuencial</th>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Cliente / Comprador</th>
                      <th className="p-3.5">Forma Pago</th>
                      <th className="p-3.5 text-right">Total</th>
                      <th className="p-3.5 text-center">Estado SRI</th>
                      <th className="p-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {filteredInvoices.map((inv) => {
                      const estado = (inv.estado || 'BORRADOR').toUpperCase();
                      const isAuth = estado === 'AUTORIZADO';
                      const isPend = estado === 'ENVIADO' || estado === 'PENDIENTE';
                      const isDev = estado === 'DEVUELTO' || estado === 'NO AUTORIZADO';

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-zinc-100">
                            {config.codEstablecimiento || '001'}-{config.codPuntoEmision || '001'}-{inv.secuencial}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-zinc-400 font-medium">
                            {inv.fechaEmision}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-zinc-100">{inv.cliente?.nombre}</div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{inv.cliente?.identificacion}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                              {inv.formaPago || '01 - SIN SISTEMA FINANCIERO'}
                            </span>
                            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">{inv.detalles?.length || 0} ítems</div>
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-zinc-100 text-sm">
                            ${Number(inv.resumenImpuestos?.total || 0).toFixed(2)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${
                                isAuth
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                  : isPend
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                  : isDev
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
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
                                onClick={() => {
                                  if (onOpenRide) {
                                    onOpenRide(inv);
                                  } else {
                                    setViewingRideInvoice(inv);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                title="Ver RIDE / Comprobante"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadInvoiceXml(inv)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                title="Descargar XML"
                              >
                                <FileCode className="w-4 h-4" />
                              </button>

                              {inv.cliente?.correo && (
                                <button
                                  type="button"
                                  disabled={sendingEmailId === inv.id}
                                  onClick={() => handleSendEmailHistory(inv)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 rounded-lg transition disabled:opacity-50 cursor-pointer"
                                  title="Reenviar Notificación por Correo"
                                >
                                  {sendingEmailId === inv.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                                  ) : (
                                    <Mail className="w-4 h-4" />
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteInvoiceItem(inv)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                title="Eliminar comprobante"
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

      {/* RIDE VIEW MODAL */}
      {(showInvoiceRide || viewingRideInvoice) && (
        <RideViewer
          document={createdInvoice || viewingRideInvoice!}
          config={config}
          onClose={() => {
            setShowInvoiceRide(false);
            setViewingRideInvoice(null);
          }}
        />
      )}
    </div>
  );
}
