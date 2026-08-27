import React, { useState, useEffect } from 'react';
import { EmitterConfig, Client, Product, Proforma, ProformaDetail } from '../types';
import { Plus, Trash2, Printer, CheckCircle, FileText, Download, Eye, RotateCcw, Copy, Pencil, X, Mail, Phone, MapPin, Palette, Layout, Award, Briefcase, ChevronDown, ChevronUp, Check, Search, RefreshCw } from 'lucide-react';
import { fetchProformasFromSupabase, saveProformaToSupabase, deleteProformaFromSupabase } from '../lib/supabase';
import { modalAlert } from '../context/ModalAlertContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';

interface ProformaFormProps {
  config: EmitterConfig;
  clients: Client[];
  products: Product[];
  onAddActivityLog?: (action: string, details: string) => void;
  onAddClient?: (client: Client) => void;
  onAddProduct?: (product: Product) => void;
  currentUserEmail?: string;
}

const PROFORMA_DESIGN_TEMPLATES = [
  { id: 'modern_purple', name: 'Swoop Creativo', desc: 'Curvas fluidas moradas y turquesas', color: '#703bb0' },
  { id: 'navy_corporate', name: 'Corporativo Clásico', desc: 'Líneas sólidas azul marino y acero', color: '#1d4ed8' },
  { id: 'slate_minimalist', name: 'Slate Minimalista', desc: 'Esquema sobrio de grises y plata', color: '#3f3f46' },
  { id: 'emerald_premium', name: 'Esmeralda & Oro', desc: 'Líneas en verde esmeralda y oro', color: '#047857' },
  { id: 'crimson_luxury', name: 'Carmesí Ejecutivo', desc: 'Estilo elegante en vino y oro fino', color: '#991b1b' },
  { id: 'modern_dark_gold', name: 'Gris & Oro Premium', desc: 'Fondo oscuro, acentos oro y ámbar', color: '#d97706' },
  { id: 'orange_tech', name: 'Naranja Tecnológico', desc: 'Estilo moderno de start-up digital', color: '#ea580c' },
];

export default function ProformaForm({
  config,
  clients,
  products,
  onAddActivityLog,
  onAddClient,
  onAddProduct,
  currentUserEmail
}: ProformaFormProps) {
  const { settings } = usePlatformSettings();
  const allowDemo = Boolean(settings?.modules?.showDemoButtons || settings?.allowDemoData);

  const getUserStorageKey = (baseKey: string) => {
    if (!currentUserEmail) return baseKey;
    const safeEmail = currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${baseKey}_user_${safeEmail}`;
  };
  // --- STATE ---
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [activeTab, setActiveTab2] = useState<'create' | 'list'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesignAccordionOpen, setIsDesignAccordionOpen] = useState(false);
  
  // Client Selection
  const [selectedClientId, setSelectedClientId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerTel, setBuyerTel] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerDir, setBuyerDir] = useState('');
  const [buyerIdentificacion, setBuyerIdentificacion] = useState('');
  const [buyerTipoIdentificacion, setBuyerTipoIdentificacion] = useState('05');

  // Proforma Header
  const [secuencial, setSecuencial] = useState('');
  const [fechaEmision, setFechaEmision] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Items State
  const [details, setDetails] = useState<ProformaDetail[]>([
    {
      id: '1',
      producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 },
      cantidad: 1,
      precio: 0,
      subtotal: 0,
      ivaCalculado: 0,
      total: 0,
      nombrePersonalizado: ''
    }
  ]);

  // IVA option for calculations ('15' by default)
  const [ivaOption, setIvaOption] = useState<string>('15');

  // Design Template ID ('modern_purple' by default)
  const [templateId, setTemplateId] = useState<string>('modern_purple');

  // Payment Options
  const [informacionPago, setInformacionPago] = useState('70% ANTICIPO Y 30% AL CIERRE DEL CONTRATO');
  const [notaDudas, setNotaDudas] = useState('');

  // Custom Company Details
  const [empresaNombre, setEmpresaNombre] = useState(config.nombreComercial || config.razonSocial || 'ORIONNX');
  const [empresaDireccion, setEmpresaDireccion] = useState(config.dirMatriz || config.dirEstablecimiento || '');
  const [empresaTelefono, setEmpresaTelefono] = useState(config.telefono || '');
  const [empresaCorreo, setEmpresaCorreo] = useState(config.correo || currentUserEmail || '');

  // Synchronize company info when active config changes
  useEffect(() => {
    if (config.nombreComercial || config.razonSocial) {
      setEmpresaNombre(config.nombreComercial || config.razonSocial);
    }
    if (config.dirMatriz || config.dirEstablecimiento) {
      setEmpresaDireccion(config.dirMatriz || config.dirEstablecimiento || '');
    }
    if (config.telefono) {
      setEmpresaTelefono(config.telefono);
    }
    if (config.correo) {
      setEmpresaCorreo(config.correo);
    }
  }, [config.nombreComercial, config.razonSocial, config.dirMatriz, config.dirEstablecimiento, config.telefono, config.correo]);

  // Preview Modal
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Success Feedback
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Focus and Search states for compact dynamic product inputs
  const [activeFocusedPrice, setActiveFocusedPrice] = useState<number | null>(null);
  const [activeRowSearch, setActiveRowSearch] = useState<number | null>(null);

  // Load existing proformas on mount or user change
  useEffect(() => {
    const loadProformas = async () => {
      const dbProformas = await fetchProformasFromSupabase(currentUserEmail);
      if (dbProformas && dbProformas.length > 0) {
        setProformas(dbProformas);
        localStorage.setItem(getUserStorageKey('sri_proformas'), JSON.stringify(dbProformas));
        return;
      }
      const saved = localStorage.getItem(getUserStorageKey('sri_proformas'));
      if (saved) {
        try {
          setProformas(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading proformas', e);
        }
      } else {
        setProformas([]);
      }
    };
    loadProformas();
    
    // Set initial sequential
    const storedSeq = localStorage.getItem(getUserStorageKey('sri_proforma_highest_secuencial'));
    if (storedSeq) {
      const next = parseInt(storedSeq, 10) + 1;
      setSecuencial(String(next).padStart(8, '0'));
    } else {
      setSecuencial('00000001');
    }

    // Default dudas note
    setNotaDudas(`¿Tienes dudas? Envíanos un correo a ${config.correo || 'jhonnyvp5@gmail.com'}`);
  }, [currentUserEmail, config.correo]);

  // Watch for profile/emitter config updates to pre-populate custom info
  useEffect(() => {
    if (config) {
      setEmpresaNombre(config.nombreComercial || config.razonSocial || 'ORIONNX');
      setEmpresaDireccion(config.dirMatriz || 'Cdla. Los Esteros Mz. 4A Sl. 26');
      setEmpresaTelefono(config.telefono || '0967590168');
      setEmpresaCorreo(config.correo || 'jhonnyvp5@gmail.com');
      setNotaDudas(`¿Tienes dudas? Envíanos un correo a ${config.correo || 'jhonnyvp5@gmail.com'}`);
    }
  }, [config]);

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'NEW') {
      setBuyerName('');
      setBuyerTel('');
      setBuyerEmail('');
      setBuyerDir('');
      setBuyerIdentificacion('');
      setBuyerTipoIdentificacion('05');
      return;
    }
    const c = clients.find(client => client.id === clientId);
    if (c) {
      setBuyerName(c.nombre);
      setBuyerTel(c.telefono || '0984961268');
      setBuyerEmail(c.correo || 'cliente@correo.com');
      setBuyerDir(c.direccion || 'Quito, Ecuador');
      setBuyerIdentificacion(c.identificacion || '');
      setBuyerTipoIdentificacion(c.tipoIdentificacion || '05');
    }
  };

  // Preset default image test-data to look EXACTLY like the user request image immediately
  const handleLoadDemoThemeData = () => {
    setIvaOption('15');
    setEmpresaNombre('JOLUS SERVICES');
    setEmpresaDireccion('Cdla. Los Esteros Mz. 4A Sl. 26');
    setEmpresaTelefono('0967590168');
    setEmpresaCorreo('jhonnyvp5@gmail.com');
    setNotaDudas('¿Tienes dudas? Envíanos un correo a jhonnyvp5@gmail.com');

    setBuyerName('Carolina Leon');
    setBuyerTel('0984961268');
    setBuyerEmail('Carolina.landeta@worq.com.ec');
    setBuyerDir('Cdla. Los Esteros, Guayaquil');
    setBuyerIdentificacion('1712398472');
    setBuyerTipoIdentificacion('05');

    setInformacionPago('70% ANTICIPO Y 30% AL CIERRE DEL CONTRATO');

    const demoDetails: ProformaDetail[] = [
      {
        id: 'demo-1',
        producto: { id: 'p1', codigo: 'S001', nombre: 'Sillas', precio: 2.0, ivaTipo: '4', descuentoDefault: 0 },
        cantidad: 20,
        precio: 2.0,
        subtotal: 40.0,
        ivaCalculado: 6.0,
        total: 46.0,
        nombrePersonalizado: 'Sillas'
      },
      {
        id: 'demo-2',
        producto: { id: 'p2', codigo: 'T002', nombre: 'Transporte', precio: 20.0, ivaTipo: '4', descuentoDefault: 0 },
        cantidad: 1,
        precio: 20.0,
        subtotal: 20.0,
        ivaCalculado: 3.0,
        total: 23.0,
        nombrePersonalizado: 'Transporte'
      }
    ];
    setDetails(demoDetails);
  };

  const getIvaRate = (opt: string) => {
    switch (opt) {
      case '12': return 0.12;
      case '15': return 0.15;
      default: return 0.0;
    }
  };

  const getIvaPercent = (opt: string) => {
    if (opt === '12') return 12;
    if (opt === '15') return 15;
    return 0;
  };

  const getIvaLabel = (opt: string) => {
    switch (opt) {
      case '15': return '15% (Nueva Tarifa Activa)';
      case '12': return '12% (Tarifa Estándar)';
      case '0': return '0% (Exento/Servicios/Exportación)';
      case 'no_objeto': return 'No Objeto de Impuesto';
      case 'exento': return 'Exento de IVA';
      case 'no_aplica': return 'No Aplica';
      default: return '15% (Nueva Tarifa Activa)';
    }
  };

  // Detail Items calculations
  const calculateRowValues = (row: ProformaDetail, updatedFields: Partial<ProformaDetail>, rateOverride?: number) => {
    const qty = updatedFields.cantidad !== undefined ? updatedFields.cantidad : row.cantidad;
    const price = updatedFields.precio !== undefined ? updatedFields.precio : row.precio;
    const subtotal = qty * price;
    
    const rate = rateOverride !== undefined ? rateOverride : getIvaRate(ivaOption);
    const ivaCalculado = subtotal * rate; 
    const total = subtotal + ivaCalculado;

    return {
      ...row,
      ...updatedFields,
      subtotal: parseFloat(subtotal.toFixed(2)),
      ivaCalculado: parseFloat(ivaCalculado.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  // Recalculate all row values when ivaOption changes
  const handleIvaOptionChange = (newOpt: string) => {
    setIvaOption(newOpt);
    const rate = getIvaRate(newOpt);
    const updated = details.map(row => calculateRowValues(row, {}, rate));
    setDetails(updated);
  };

  const handleRowChange = (index: number, updatedFields: Partial<ProformaDetail>) => {
    const updatedDetails = [...details];
    updatedDetails[index] = calculateRowValues(updatedDetails[index], updatedFields);
    setDetails(updatedDetails);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      handleRowChange(index, {
        producto: prod,
        precio: prod.precio,
        nombrePersonalizado: prod.nombre
      });
    } else if (productId === 'CUSTOM') {
      handleRowChange(index, {
        producto: { id: 'custom', codigo: 'CUSTOM', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 },
        precio: 0,
        nombrePersonalizado: ''
      });
    }
  };

  const addDetailRow = () => {
    setDetails([
      ...details,
      {
        id: Date.now().toString(),
        producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 },
        cantidad: 1,
        precio: 0,
        subtotal: 0,
        ivaCalculado: 0,
        total: 0,
        nombrePersonalizado: ''
      }
    ]);
  };

  const removeDetailRow = (index: number) => {
    if (details.length <= 1) return;
    const filtered = details.filter((_, idx) => idx !== index);
    setDetails(filtered);
  };

  // Grand totals
  const subtotalSum = details.reduce((acc, row) => acc + row.subtotal, 0);
  const ivaSum = details.reduce((acc, row) => acc + row.ivaCalculado, 0);
  const totalSum = subtotalSum + ivaSum;

  // Save Proforma
  const handleSaveProforma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      modalAlert.warning('Datos Incompletos', 'Por favor ingrese el nombre del cliente');
      return;
    }

    const newProforma: Proforma = {
      id: isEditing || Date.now().toString(),
      secuencial: secuencial,
      fechaEmision: fechaEmision,
      cliente: {
        nombre: buyerName,
        telefono: buyerTel,
        correo: buyerEmail,
        direccion: buyerDir,
        identificacion: buyerIdentificacion,
        tipoIdentificacion: buyerTipoIdentificacion
      },
      detalles: details.map(d => ({
        ...d,
        nombrePersonalizado: d.nombrePersonalizado || d.producto.nombre
      })),
      resumenImpuestos: {
        subtotal: parseFloat(subtotalSum.toFixed(2)),
        ivaPorcentaje: getIvaPercent(ivaOption),
        ivaValor: parseFloat(ivaSum.toFixed(2)),
        total: parseFloat(totalSum.toFixed(2))
      },
      informacionPago: informacionPago,
      notaDudas: notaDudas,
      empresaNombre: empresaNombre,
      empresaDireccion: empresaDireccion,
      empresaTelefono: empresaTelefono,
      empresaCorreo: empresaCorreo,
      ivaOptionLabel: getIvaLabel(ivaOption),
      ivaOption: ivaOption,
      templateId: templateId
    };

    let updatedList: Proforma[] = [];
    if (isEditing) {
      updatedList = proformas.map(p => p.id === isEditing ? newProforma : p);
      setIsEditing(null);
      if (onAddActivityLog) {
        onAddActivityLog('Proforma Editada', `Se actualizó la proforma #${secuencial} para ${buyerName}`);
      }
    } else {
      updatedList = [newProforma, ...proformas];
      // Increment sequential for next
      const nextSeq = parseInt(secuencial, 10);
      localStorage.setItem(getUserStorageKey('sri_proforma_highest_secuencial'), String(nextSeq));
      
      // Update local state next sequential
      setSecuencial(String(nextSeq + 1).padStart(8, '0'));

      if (onAddActivityLog) {
        onAddActivityLog('Proforma Generada', `Proforma #${secuencial} emitida para ${buyerName} por un total de $${totalSum.toFixed(2)}`);
      }
    }

    // Inline Client registration
    if (onAddClient) {
      const exists = clients.some(c => 
        (buyerIdentificacion && c.identificacion === buyerIdentificacion) ||
        (buyerEmail && c.correo.toLowerCase() === buyerEmail.toLowerCase())
      );
      if (!exists && buyerName.trim()) {
        const generatedId = 'buyer-c-' + Date.now();
        const newClient: Client = {
          id: generatedId,
          tipoIdentificacion: (buyerTipoIdentificacion as any) || '05',
          identificacion: buyerIdentificacion.trim() || String(Math.floor(1000000000 + Math.random() * 9000000000)),
          nombre: buyerName.trim().toUpperCase(),
          direccion: buyerDir.trim() || 'Guayaquil, Ecuador',
          telefono: buyerTel.trim() || '0999999999',
          correo: buyerEmail.trim().toLowerCase() || 'cliente@correo.com'
        };
        onAddClient(newClient);
      }
    }

    // Inline Product registration
    if (onAddProduct) {
      details.forEach((row, idx) => {
        const prod = row.producto;
        if (prod.codigo && prod.nombre) {
          const exists = products.some(p => p.codigo.trim().toLowerCase() === prod.codigo.trim().toLowerCase());
          if (!exists) {
            const newProduct: Product = {
              id: 'p-' + Date.now() + '-' + idx,
              codigo: prod.codigo.trim().toUpperCase(),
              nombre: (row.nombrePersonalizado || prod.nombre).trim(),
              precio: row.precio,
              ivaTipo: prod.ivaTipo || '4',
              descuentoDefault: 0
            };
            onAddProduct(newProduct);
          }
        }
      });
    }

    setProformas(updatedList);
    localStorage.setItem(getUserStorageKey('sri_proformas'), JSON.stringify(updatedList));
    saveProformaToSupabase(newProforma, currentUserEmail);

    // Reset Form
    setSelectedClientId('');
    setBuyerName('');
    setBuyerTel('');
    setBuyerEmail('');
    setBuyerDir('');
    setBuyerIdentificacion('');
    setBuyerTipoIdentificacion('05');
    setIvaOption('15');
    setTemplateId('modern_purple');
    setDetails([
      {
        id: Date.now().toString(),
        producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 },
        cantidad: 1,
        precio: 0,
        subtotal: 0,
        ivaCalculado: 0,
        total: 0,
        nombrePersonalizado: ''
      }
    ]);

    // Triggers feedback & views proforma immediately
    setSelectedProforma(newProforma);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  const handleDeleteProforma = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    modalAlert.confirm(
      '¿Eliminar proforma?',
      '¿Está seguro de que desea eliminar esta proforma?',
      () => {
        const filtered = proformas.filter(p => p.id !== id);
        setProformas(filtered);
        localStorage.setItem(getUserStorageKey('sri_proformas'), JSON.stringify(filtered));
        deleteProformaFromSupabase(id);
        modalAlert.success('Proforma Eliminada', 'La proforma ha sido eliminada con éxito.');
      },
      true,
      'Eliminar Proforma',
      'Cancelar'
    );
  };

  const handleEditProforma = (proforma: Proforma, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(proforma.id);
    setSecuencial(proforma.secuencial);
    setFechaEmision(proforma.fechaEmision);
    setBuyerName(proforma.cliente.nombre);
    setBuyerTel(proforma.cliente.telefono);
    setBuyerEmail(proforma.cliente.correo);
    setBuyerDir(proforma.cliente.direccion || '');
    setDetails(proforma.detalles);
    setIvaOption(proforma.ivaOption || '15');
    setTemplateId(proforma.templateId || 'modern_purple');
    setInformacionPago(proforma.informacionPago);
    setNotaDudas(proforma.notaDudas || '');
    setEmpresaNombre(proforma.empresaNombre || 'Jolus Services');
    setEmpresaDireccion(proforma.empresaDireccion || config.dirMatriz);
    setEmpresaTelefono(proforma.empresaTelefono || config.telefono || '');
    setEmpresaCorreo(proforma.empresaCorreo || config.correo || '');
    setActiveTab2('create');
  };

  // Convert Date to Spanish format: e.g. "2025-10-28" to "28 DE OCTUBRE DEL 2025"
  const formatSpanishDate = (dateStr: string) => {
    if (!dateStr) return '';
    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr.toUpperCase();
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    
    return `${day} DE ${months[monthIdx] || 'ENERO'} DEL ${year}`;
  };

  return (
    <div className="space-y-6">
      
      {/* SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 z-55 bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-fade-in border border-emerald-505">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">¡Proforma Guardada!</p>
            <p className="text-[10px] text-emerald-100">La proforma se registró correctamente y se abrió el visor.</p>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-white/80 hover:text-white text-xs font-bold pl-2 cursor-pointer">OK</button>
        </div>
      )}

      {/* COMPONENT NAVIGATION HEADER - EXACT IMAGE DESIGN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Cotizaciones & Proformas Comerciales
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Generación de cotizaciones formales, cálculo comercial de precios, plantillas de diseño y exportación a PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {allowDemo && (
            <button
              type="button"
              onClick={() => handleLoadDemoThemeData()}
              className="px-3 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer whitespace-nowrap shrink-0"
              title="Carga de inmediato el ejemplo corporativo"
            >
              Cargar Demo
            </button>
          )}

          {/* Tab Toggle Buttons - FIXED DIMENSIONS PREVENTS CONTAINER OVERFLOW */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 shrink-0">
            <button
              id="tab-emit-proforma"
              type="button"
              onClick={() => setActiveTab2('create')}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap shrink-0 min-w-[140px] ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-zinc-700'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Emitir Proforma {isEditing ? '(Editando)' : ''}</span>
            </button>
            <button
              id="tab-history-proforma"
              type="button"
              onClick={() => setActiveTab2('list')}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap shrink-0 min-w-[140px] ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-zinc-700'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Historial ({proformas.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSaveProforma} className="space-y-6">
          
          {/* TOP FULL-WIDTH COMPACT BENTO CARD: DATOS DEL CLIENTE Y CABECERA */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#703bb0]" />
              <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-zinc-200 tracking-wider">
                Datos de la Cotización & Cliente
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 text-[#703bb0] ml-auto">Compacto & Inteligente</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Row 1, Col 1: Client Lookup */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Cargar de Clientes SRI</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 uppercase font-bold dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- SELECIONAR CLIENTE --</option>
                  <option value="NEW">+ INGRESAR MANUALMENTE</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.identificacion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 1, Col 2: Name */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Carolina Leon"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Row 1, Col 3: Identificación (Cédula / RUC) */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Identificación (Cédula / RUC) *</label>
                <div className="flex gap-1.5">
                  <select
                    value={buyerTipoIdentificacion}
                    onChange={(e) => setBuyerTipoIdentificacion(e.target.value)}
                    className="text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500 shrink-0 font-bold uppercase"
                  >
                    <option value="05">Cédula</option>
                    <option value="04">RUC</option>
                    <option value="06">Pasap.</option>
                    <option value="07">C.F.</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={buyerIdentificacion}
                    onChange={(e) => setBuyerIdentificacion(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                    placeholder="e.g. 1712398472"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Row 2, Col 1: Tel */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Teléfono de contacto</label>
                <input
                  type="text"
                  value={buyerTel}
                  onChange={(e) => setBuyerTel(e.target.value)}
                  placeholder="e.g. 0984961268"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Row 2, Col 1: Email */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Correo Electrónico</label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="e.g. carolina@worq.com.ec"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Row 2, Col 2: Dir */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Dirección</label>
                <input
                  type="text"
                  value={buyerDir}
                  onChange={(e) => setBuyerDir(e.target.value)}
                  placeholder="e.g. Cdla. Los Esteros, Guayaquil"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Row 2, Col 3: Secuencial & Fecha */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Nº Secuencial</label>
                  <input
                    type="text"
                    required
                    value={secuencial}
                    onChange={(e) => setSecuencial(e.target.value)}
                    placeholder="00000001"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500 font-mono text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Fecha Emisión</label>
                  <input
                    type="date"
                    required
                    value={fechaEmision}
                    onChange={(e) => setFechaEmision(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* TWO COLUMN GRID FOR ITEMS AND METRICS/TEMPLATES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: ITEMS LIST DETAILS (SPAN 2) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                
                {/* Header of Item Management Panel */}
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-zinc-200 tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#703bb0]" />
                      Catálogo de Productos y Servicios de Cotización
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">Busque un producto de su inventario o digite una descripción libre directamente en la casilla.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="px-3.5 py-1.5 bg-[#703bb0] text-white hover:bg-opacity-95 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Ítem
                  </button>
                </div>

                {/* DETAILS ROWS */}
                <div className={`space-y-3 max-h-[640px] overflow-y-auto pr-1 transition-all duration-200 ${activeRowSearch !== null ? 'min-h-[380px] pb-60' : 'min-h-[180px] pb-6'}`}>
                  {details.map((row, index) => (
                    <div 
                      key={row.id} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-gray-50 p-3.5 rounded-xl border border-gray-200 dark:bg-zinc-950 dark:border-zinc-850 items-center relative"
                    >
                      
                      {/* Unified Search & Custom Input Box (6 cols) */}
                      <div className="md:col-span-6 space-y-1 relative">
                        <div className="flex justify-between items-center">
                          <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Descripción o Buscar Ítem *</label>
                          <span className="text-[8px] text-[#703bb0] bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded font-bold font-mono">#{index + 1}</span>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={row.nombrePersonalizado || ''}
                            onFocus={() => setActiveRowSearch(index)}
                            onBlur={() => {
                              // delay slightly to allow clicking suggestions
                              setTimeout(() => {
                                if (activeRowSearch === index) {
                                  setActiveRowSearch(null);
                                }
                              }, 220);
                            }}
                            onChange={(e) => {
                              const term = e.target.value;
                              handleRowChange(index, { nombrePersonalizado: term });
                            }}
                            placeholder="Escriba descripción o busque producto..."
                            className="w-full text-xs p-2.5 pr-8 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 uppercase font-medium text-gray-750 dark:text-zinc-200 focus:ring-2 focus:ring-purple-500 focus:border-[#703bb0] outline-none shadow-xs"
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <Eye className="w-3.5 h-3.5 text-[#703bb0]" />
                          </div>

                          {/* Autocomplete Dropdown overlay */}
                          {activeRowSearch === index && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-gray-100 dark:divide-zinc-800 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                              <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-950 text-[10px] font-bold text-gray-450 dark:text-zinc-500 uppercase tracking-wider flex justify-between items-center">
                                <span>SELECCIONAR DEL CATÁLOGO DE PRODUCTOS</span>
                                <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold font-mono text-[9px]">
                                  {products.filter(p => p.nombre.toLowerCase().includes((row.nombrePersonalizado || '').toLowerCase())).length} ÍTEMS
                                </span>
                              </div>
                              {products
                                .filter(p => p.nombre.toLowerCase().includes((row.nombrePersonalizado || '').toLowerCase()))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onMouseDown={() => {
                                      handleRowChange(index, {
                                        producto: p,
                                        precio: p.precio,
                                        nombrePersonalizado: p.nombre
                                      });
                                      setActiveRowSearch(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs text-gray-800 dark:text-zinc-200 transition-colors flex flex-col gap-0.5 cursor-pointer"
                                  >
                                    <div className="font-bold text-gray-900 dark:text-gray-100 uppercase flex justify-between items-center">
                                      <span className="truncate pr-4">{p.nombre}</span>
                                      <span className="text-purple-600 dark:text-purple-400 font-mono font-extrabold shrink-0">${p.precio.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono flex items-center justify-between">
                                      <span>CÓDIGO: {p.codigo}</span>
                                      {p.descuentoDefault !== undefined && p.descuentoDefault > 0 && (
                                        <span className="text-emerald-600 dark:text-emerald-450 font-bold">DESC: ${p.descuentoDefault.toFixed(2)}</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              {products.filter(p => p.nombre.toLowerCase().includes((row.nombrePersonalizado || '').toLowerCase())).length === 0 && (
                                <div className="px-4 py-3 text-xs text-gray-400 text-center bg-gray-50/50 dark:bg-zinc-950/50">
                                  Sin coincidencias. Presione 'Enter' o continúe escribiendo para guardar como ítem personalizado.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cantidad (1.5 cols) */}
                      <div className="md:col-span-1.5 space-y-1">
                        <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase text-center">Cant *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={row.cantidad}
                          onChange={(e) => handleRowChange(index, { cantidad: Math.max(1, parseInt(e.target.value, 10) || 0) })}
                          placeholder="1"
                          className="w-full text-xs p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 text-center font-bold text-gray-800 dark:text-zinc-200"
                        />
                      </div>

                      {/* Precio Unit (1.5 cols) - Clears zero on focus */}
                      <div className="md:col-span-1.5 space-y-1">
                        <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase text-center">Precio Unit *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={row.precio === 0 && activeFocusedPrice === index ? '' : row.precio}
                          onFocus={(e) => {
                            setActiveFocusedPrice(index);
                            e.target.select();
                          }}
                          onBlur={() => {
                            setActiveFocusedPrice(null);
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = parseFloat(val);
                            handleRowChange(index, { precio: isNaN(parsed) ? 0 : parsed });
                          }}
                          placeholder="0.00"
                          className="w-full text-xs p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 text-center font-bold text-gray-800 dark:text-zinc-200"
                        />
                      </div>

                      {/* Subtotal calculated (2 cols) */}
                      <div className="md:col-span-2 space-y-1">
                        <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase text-center">Subtotal</label>
                        <div className="w-full text-xs p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-150 dark:border-zinc-850 text-center font-mono font-bold text-gray-600 dark:text-zinc-400">
                          ${(row.cantidad * row.precio).toFixed(2)}
                        </div>
                      </div>

                      {/* Trash action button (1 col) */}
                      <div className="md:col-span-1 text-center flex justify-center pt-4 md:pt-0">
                        <button
                          type="button"
                          onClick={() => removeDetailRow(index)}
                          disabled={details.length <= 1}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-655 disabled:opacity-40 disabled:bg-gray-100 disabled:text-gray-400 rounded-xl cursor-pointer transition border border-red-100 dark:bg-red-950/20 dark:border-none"
                          title="Eliminar este ítem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Info and calculated instructions */}
                <div className="bg-purple-50/50 hover:bg-purple-50 dark:bg-purple-950/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 text-[11px] text-gray-550 leading-relaxed text-left flex items-start gap-2.5 mt-2">
                  <span className="h-2 w-2 rounded-full bg-[#703bb0] block mt-1 shrink-0" />
                  <div>
                    <strong>Instrucciones de IVA Proforma:</strong> Este generador está configurado para calcular <strong>{getIvaLabel(ivaOption)}</strong> sobre el subtotal de los servicios y productos cargados (aplicando {getIvaPercent(ivaOption)}% de impuesto si corresponde) para plasmar exactamente las directrices fiscales seleccionadas.
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: SUMMARY, TERMS, TEMPLATE PICKER (SPAN 1) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* MATH AND BILLING SUMMARY BENTO CARD */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-zinc-200 tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#703bb0]" />
                  Resumen de Totales
                </h3>

                {/* Inline tax selector */}
                <div className="space-y-1">
                  <label className="block text-[9.5px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Tarifa de IVA</label>
                  <select
                    value={ivaOption}
                    onChange={(e) => handleIvaOptionChange(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500 font-semibold text-slate-750 dark:text-zinc-300"
                  >
                    <option value="15">15% (Nueva Tarifa Activa)</option>
                    <option value="12">12% (Tarifa Estándar)</option>
                    <option value="0">0% (Exento/Servicios/Exportación)</option>
                    <option value="no_objeto">No Objeto de Impuesto</option>
                    <option value="exento">Exento de IVA</option>
                    <option value="no_aplica">No Aplica</option>
                  </select>
                </div>

                {/* Mathematical matrix details */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs space-y-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">SUBTOTAL</span>
                    <span className="font-black text-slate-800 dark:text-zinc-200 text-xs">${subtotalSum.toFixed(2)}</span>
                  </div>
                  {ivaOption !== 'no_aplica' && (
                    <div className="flex justify-between text-sky-600 dark:text-sky-400 font-bold">
                      <span>
                        {ivaOption === 'no_objeto' ? 'NO OBJETO IVA' : 
                         ivaOption === 'exento' ? 'EXENTO IVA' : 
                         `IMPUESTOS (${getIvaPercent(ivaOption)}%)`}
                      </span>
                      <span className="font-black">${ivaSum.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="border-slate-200 dark:border-zinc-800" />
                  <div className="flex justify-between text-[#703bb0] text-sm font-black uppercase pt-1">
                    <span className="font-black">TOTAL</span>
                    <span className="text-sm font-black bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-lg">${totalSum.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Condition Terms */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Condiciones de pago / Plazos *</label>
                    <textarea
                      required
                      rows={2}
                      value={informacionPago}
                      onChange={(e) => setInformacionPago(e.target.value)}
                      placeholder="e.g. 70% ANTICIPO Y 30% AL CIERRE DEL CONTRATO"
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Nota de dudas (Pie de Proforma)</label>
                    <input
                      type="text"
                      value={notaDudas}
                      onChange={(e) => setNotaDudas(e.target.value)}
                      placeholder="¿Tienes dudas? Envíanos un correo a..."
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Action submit trigger buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#703bb0] hover:bg-opacity-95 text-white font-black uppercase text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-purple-600/10"
                  >
                    <FileText className="w-4 h-4" />
                    {isEditing ? 'Guardar Cambios' : 'Registrar y Previsualizar'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(null);
                        setBuyerName('');
                        setBuyerTel('');
                        setBuyerEmail('');
                        setBuyerDir('');
                        setDetails([
                          {
                            id: Date.now().toString(),
                            producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 },
                            cantidad: 1,
                            precio: 0,
                            subtotal: 0,
                            ivaCalculado: 0,
                            total: 0,
                            nombrePersonalizado: ''
                          }
                        ]);
                        // Restore default sequence from localStorage
                        const storedSeq = localStorage.getItem(getUserStorageKey('sri_proforma_highest_secuencial'));
                        if (storedSeq) {
                          setSecuencial(String(parseInt(storedSeq, 10) + 1).padStart(8, '0'));
                        } else {
                          setSecuencial('00000001');
                        }
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 font-extrabold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1 border border-slate-200 dark:border-zinc-700"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </div>

              {/* MODELOS DE DISEÑO PROFESIONAL (PLANTILLAS) - MODELO ACORDEÓN */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
                <div 
                  onClick={() => setIsDesignAccordionOpen(!isDesignAccordionOpen)}
                  className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2.5 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-zinc-200 tracking-wider">
                      Modelo de Diseño
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                      {PROFORMA_DESIGN_TEMPLATES.length} Plantillas
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDesignAccordionOpen(!isDesignAccordionOpen);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
                    >
                      {isDesignAccordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* VISTA PRINCIPAL: DISEÑO SELECCIONADO ACTUAL */}
                {(() => {
                  const current = PROFORMA_DESIGN_TEMPLATES.find(t => t.id === templateId) || PROFORMA_DESIGN_TEMPLATES[0];
                  return (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-850/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white/40"
                          style={{ backgroundColor: current.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {current.name}
                            </span>
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Seleccionado</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">
                            {current.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsDesignAccordionOpen(!isDesignAccordionOpen)}
                        className="px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 rounded-lg transition whitespace-nowrap"
                      >
                        {isDesignAccordionOpen ? 'Cerrar' : 'Cambiar'}
                      </button>
                    </div>
                  );
                })()}

                {/* CATÁLOGO COMPLETO DESPLEGABLE EN ACORDEÓN */}
                {isDesignAccordionOpen && (
                  <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1 pt-2 border-t border-slate-100 dark:border-zinc-800 animate-in fade-in-50 duration-200">
                    {PROFORMA_DESIGN_TEMPLATES.map((tmpl) => {
                      const isSelected = templateId === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => {
                            setTemplateId(tmpl.id);
                          }}
                          className={`flex items-center justify-between gap-2.5 text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-slate-300 dark:border-zinc-700 bg-slate-50/90 dark:bg-zinc-800/80 shadow-xs'
                              : 'border-gray-150 dark:border-zinc-800 hover:bg-gray-55 dark:hover:bg-zinc-850'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-5 h-5 rounded-full shrink-0 border border-white/40 shadow-xs"
                              style={{ backgroundColor: tmpl.color }}
                            />
                            <div>
                              <div className="text-[11px] font-black text-gray-850 dark:text-zinc-200 leading-tight">
                                {tmpl.name}
                              </div>
                              <div className="text-[9px] text-gray-450">
                                {tmpl.desc}
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Seleccionado</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                              Elegir
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

        </form>
      ) : (
        /* PROFORMA HISTORY TAB LIST */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número, cliente, RUC/cédula, teléfono o correo..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0"
                title="Limpiar búsqueda"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {proformas.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    modalAlert.confirm(
                      '¿Limpiar historial?',
                      '¿Desea limpiar el historial completo de proformas?',
                      () => {
                        setProformas([]);
                        localStorage.removeItem(getUserStorageKey('sri_proformas'));
                        modalAlert.success('Historial Limpiado', 'Se ha vaciado el historial local de proformas.');
                      },
                      true,
                      'Limpiar Historial',
                      'Cancelar'
                    );
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  Limpiar Historial
                </button>
              )}
            </div>
          </div>

          {(() => {
            const filtered = proformas.filter(p => {
              const clean = searchQuery.toLowerCase().trim();
              if (!clean) return true;
              return (
                (p.secuencial || '').includes(clean) ||
                (p.cliente?.nombre || '').toLowerCase().includes(clean) ||
                (p.cliente?.identificacion || '').includes(clean) ||
                (p.cliente?.telefono || '').includes(clean) ||
                (p.cliente?.correo || '').toLowerCase().includes(clean)
              );
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200">No hay proformas encontradas</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                    {searchQuery ? 'No se encontraron cotizaciones con los criterios de búsqueda.' : 'Genere su primera cotización desde la pestaña "Emitir Proforma" para visualizarla aquí.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab2('create')}
                    className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-sky-700 transition-all inline-flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Emitir Primera Proforma</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                        <th className="p-3.5">Cotización #</th>
                        <th className="p-3.5">Fecha Emisión</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Contacto</th>
                        <th className="p-3.5 text-center">Ítems</th>
                        <th className="p-3.5 text-right">Monto Total</th>
                        <th className="p-3.5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {filtered.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-zinc-100">
                            PROFORMA #{p.secuencial}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-zinc-400 font-medium">
                            {p.fechaEmision}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-zinc-100">{p.cliente?.nombre}</div>
                            {p.cliente?.identificacion && (
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{p.cliente.identificacion}</div>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-zinc-400">
                            <div className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 font-semibold">{p.cliente?.telefono || 'S/N'}</div>
                            <div className="text-[10px] text-slate-400">{p.cliente?.correo}</div>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-700 dark:text-zinc-300 font-mono">
                            {p.detalles.length}
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-zinc-100 text-sm">
                            ${p.resumenImpuestos.total.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setSelectedProforma(p)}
                                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                title="Visualizar Proforma / PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleEditProforma(p, e)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                title="Editar Proforma"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteProforma(p.id, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                                title="Eliminar Proforma"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* RIDE / PROFORMA MODAL VIEWER WITH PRECISE HIGH-FIDELITY LAYOUT MATCHING IMAGE */}
      {selectedProforma && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 flex items-center justify-center p-4 backdrop-blur-xs print:fixed print:inset-0 print:bg-white print:p-0">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col print:fixed print:inset-0 print:max-h-none print:shadow-none print:rounded-none">
            
             {/* Modal actions header (HIDDEN ON PRINTSTAGES) */}
            <div className="bg-gray-50 border-b border-gray-100 dark:bg-zinc-950 dark:border-zinc-850 p-4 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                  Visor PDF Oficial - Cotización Proforma
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 text-[#703bb0]">Format 2026/06</span>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-850 p-1 px-2 rounded-xl border border-gray-200 dark:border-zinc-750">
                  <Palette className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase hidden md:inline">Diseño:</span>
                  <select
                    value={selectedProforma.templateId || 'modern_purple'}
                    onChange={(e) => {
                      const updated = { ...selectedProforma, templateId: e.target.value };
                      setSelectedProforma(updated);
                      // Also sync in saved list so it persists
                      const newList = proformas.map(p => p.id === selectedProforma.id ? updated : p);
                      setProformas(newList);
                      localStorage.setItem(getUserStorageKey('sri_proformas'), JSON.stringify(newList));
                    }}
                    className="text-[11px] font-bold bg-transparent border-none text-gray-700 dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-0 p-0 pr-6"
                  >
                    <option value="modern_purple">Swoop Creativo</option>
                    <option value="navy_corporate">Corporativo Clásico</option>
                    <option value="slate_minimalist">Slate Minimalista</option>
                    <option value="emerald_premium">Esmeralda & Oro</option>
                    <option value="crimson_luxury">Carmesí Ejecutivo</option>
                    <option value="modern_dark_gold">Gris & Oro Premium</option>
                    <option value="orange_tech">Naranja Tecnológico</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const originalTitle = window.document.title;
                    window.document.title = `PROFORMA_${selectedProforma.secuencial}`;
                    window.print();
                    setTimeout(() => {
                      window.document.title = originalTitle;
                    }, 1000);
                  }}
                  className="px-3.5 py-1.5 bg-[#703bb0] hover:bg-opacity-95 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Documento
                </button>
                <button
                  onClick={() => {
                    const originalTitle = window.document.title;
                    window.document.title = `PROFORMA_${selectedProforma.secuencial}`;
                    window.print();
                    setTimeout(() => {
                      window.document.title = originalTitle;
                    }, 1000);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
                <button
                  onClick={() => setSelectedProforma(null)}
                  className="p-1.5 bg-white hover:bg-gray-100 text-gray-500 rounded-xl border border-gray-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* HIGH FIDELITY PRINTABLE WRAPPER (This contains the EXACT layout design requested) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-50 dark:bg-zinc-950 print:bg-white print:overflow-visible print:p-0">
              
              <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] mx-auto p-12 pb-16 pt-10 shadow-sm border border-gray-150 rounded-lg flex flex-col justify-between relative overflow-hidden print:shadow-none print:border-none print:p-12 print:pb-16 print:pt-10 print:rounded-none bg-white text-black font-sans leading-relaxed">
                
                {/* DECORATIVE FULL-BLEED BACKGROUND ELEMENTS BASED ON SELECTED TEMPLATE */}
                {(selectedProforma.templateId === 'modern_purple' || !selectedProforma.templateId) && (
                  <>
                    {/* 1. TOP PURPLE WAVEY ACCENT BACKGROUND */}
                    <div className="absolute left-0 top-0 w-[64%] h-[360px] select-none pointer-events-none z-0">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-[#703bb0] fill-current">
                        <path d="M 0,0 L 100,0 C 100,42 62,100 0,100 Z" />
                      </svg>
                    </div>
                    {/* 2. TOP RIGHT CYAN DESIGNATION STRIP */}
                    <div className="absolute right-0 top-0 h-5 w-[44%] bg-[#96e5ea] select-none pointer-events-none z-0" />
                    {/* 3. BOTTOM SOLID PURPLE FOOTER BAR */}
                    <div className="absolute left-0 bottom-0 w-full h-[32px] bg-[#703bb0] select-none pointer-events-none z-0" />
                  </>
                )}

                {selectedProforma.templateId === 'navy_corporate' && (
                  <>
                    {/* Dark Navy top border bands and clean geometric headers */}
                    <div className="absolute left-0 top-0 w-full h-[200px] bg-slate-900 select-none pointer-events-none z-0 border-b-4 border-blue-600" />
                    <div className="absolute right-8 top-[160px] h-8 px-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-lg select-none pointer-events-none z-10 shadow-sm">
                      Documento Oficial
                    </div>
                    {/* Bottom navy footer bar */}
                    <div className="absolute left-0 bottom-0 w-full h-[32px] bg-slate-900 border-t-4 border-blue-600 select-none pointer-events-none z-0" />
                  </>
                )}

                {selectedProforma.templateId === 'slate_minimalist' && (
                  <>
                    {/* Clean minimal design, fine double lines and gray framing */}
                    <div className="absolute left-6 top-6 right-6 bottom-6 border border-zinc-200 pointer-events-none z-0 rounded" />
                    <div className="absolute left-6 top-6 h-2 w-32 bg-zinc-900 pointer-events-none z-0" />
                    <div className="absolute right-6 top-6 h-2 w-32 bg-zinc-900 pointer-events-none z-0" />
                    <div className="absolute left-6 bottom-6 h-2 w-32 bg-zinc-900 pointer-events-none z-0" />
                    <div className="absolute right-6 bottom-6 h-2 w-32 bg-zinc-900 pointer-events-none z-0" />
                  </>
                )}

                {selectedProforma.templateId === 'emerald_premium' && (
                  <>
                    {/* Royal Emerald & Gold accent design */}
                    <div className="absolute left-0 top-0 w-full h-[220px] bg-gradient-to-r from-emerald-950 to-emerald-900 select-none pointer-events-none z-0 border-b-4 border-amber-500" />
                    <div className="absolute right-8 top-[180px] h-8 px-4 bg-amber-500 text-emerald-950 text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-xs select-none pointer-events-none z-10 shadow-sm border border-amber-400">
                      Edición Corporativa Premium
                    </div>
                    <div className="absolute left-0 bottom-0 w-full h-[32px] bg-emerald-950 border-t-4 border-amber-500 select-none pointer-events-none z-0" />
                  </>
                )}

                {selectedProforma.templateId === 'crimson_luxury' && (
                  <>
                    {/* Carmesí Ejecutivo background */}
                    <div className="absolute left-0 top-0 w-full h-[210px] bg-gradient-to-r from-red-950 to-rose-900 select-none pointer-events-none z-0 border-b-4 border-amber-500" />
                    <div className="absolute right-8 top-[170px] h-8 px-4 bg-amber-500 text-red-950 text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-xs select-none pointer-events-none z-10 shadow-sm border border-amber-400">
                      Carmesí Ejecutivo
                    </div>
                    <div className="absolute left-0 bottom-0 w-full h-[32px] bg-red-950 border-t-4 border-amber-500 select-none pointer-events-none z-0" />
                  </>
                )}

                {selectedProforma.templateId === 'modern_dark_gold' && (
                  <>
                    {/* Gris & Oro Premium background */}
                    <div className="absolute left-0 top-0 w-full h-[230px] bg-zinc-950 select-none pointer-events-none z-0 border-b-4 border-amber-500" />
                    <div className="absolute right-0 top-0 w-[40%] h-[230px] select-none pointer-events-none z-0 opacity-20">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-amber-500 fill-current">
                        <path d="M 100,0 L 0,0 C 40,50 80,80 100,100 Z" />
                      </svg>
                    </div>
                    <div className="absolute right-8 top-[190px] h-8 px-4 bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-xs select-none pointer-events-none z-10 shadow-md border border-amber-400">
                      Gold Premium
                    </div>
                    <div className="absolute left-0 bottom-0 w-full h-[32px] bg-zinc-950 border-t-4 border-amber-500 select-none pointer-events-none z-0" />
                  </>
                )}

                {selectedProforma.templateId === 'orange_tech' && (
                  <>
                    {/* Naranja Tecnológico background */}
                    <div className="absolute left-0 top-0 w-full h-[200px] bg-zinc-900 select-none pointer-events-none z-0 border-b-4 border-orange-500" />
                    <div className="absolute right-0 top-0 w-[50%] h-[200px] select-none pointer-events-none z-0">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-orange-500 opacity-15 fill-current">
                        <path d="M 100,0 L 100,100 L 0,0 Z" />
                      </svg>
                    </div>
                    <div className="absolute right-8 top-[160px] h-8 px-4 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-lg select-none pointer-events-none z-10 shadow-sm">
                      Tecnología Digital
                    </div>
                    <div className="absolute left-0 bottom-0 w-full h-[32px] bg-zinc-900 border-t-4 border-orange-500 select-none pointer-events-none z-0" />
                  </>
                )}

                {/* TEMPLATE DYNAMIC DESIGN CONSTANTS & LOGIC */}
                {(() => {
                  const currentTemplate = selectedProforma.templateId || 'modern_purple';
                  const isDarkHeader = currentTemplate === 'modern_purple' || currentTemplate === 'navy_corporate' || currentTemplate === 'emerald_premium' || currentTemplate === 'crimson_luxury' || currentTemplate === 'modern_dark_gold' || currentTemplate === 'orange_tech';
                  
                  let headerTitleColor = 'text-white';
                  let headerSubtitleColor = 'text-white/80';
                  let docTitleColor = 'text-[#703bb0]';
                  let clientTitleColor = 'text-[#703bb0]';
                  let tableHeaderBorderColor = 'border-[#703bb0]/44';
                  let tableHeaderTextColor = 'text-[#703bb0]';
                  let tableRowTextColor = 'text-[#703bb0]';
                  let tableRowBorderColor = 'divide-[#703bb0]/22';
                  let summaryTextColor = 'text-[#703bb0]';
                  let summaryTotalBorderColor = 'border-[#703bb0]/44';
                  let summaryTotalTextColor = 'text-[#703bb0]';
                  let paymentTitleColor = 'text-[#703bb0]';
                  let paymentTextColor = 'text-[#703bb0]';
                  let noteTextColor = 'text-[#703bb0]';
                  let mapPinColor = 'text-white';
                  
                  if (currentTemplate === 'navy_corporate') {
                    headerTitleColor = 'text-white';
                    headerSubtitleColor = 'text-slate-300';
                    docTitleColor = 'text-slate-900';
                    clientTitleColor = 'text-blue-900';
                    tableHeaderBorderColor = 'border-slate-300';
                    tableHeaderTextColor = 'text-white';
                    tableRowTextColor = 'text-slate-800';
                    tableRowBorderColor = 'divide-slate-100';
                    summaryTextColor = 'text-slate-850';
                    summaryTotalBorderColor = 'border-slate-300';
                    summaryTotalTextColor = 'text-slate-950';
                    paymentTitleColor = 'text-blue-900';
                    paymentTextColor = 'text-slate-700';
                    noteTextColor = 'text-slate-600';
                    mapPinColor = 'text-slate-300';
                  } else if (currentTemplate === 'slate_minimalist') {
                    headerTitleColor = 'text-zinc-900';
                    headerSubtitleColor = 'text-zinc-500';
                    docTitleColor = 'text-zinc-900';
                    clientTitleColor = 'text-zinc-800';
                    tableHeaderBorderColor = 'border-zinc-300';
                    tableHeaderTextColor = 'text-zinc-900';
                    tableRowTextColor = 'text-zinc-800';
                    tableRowBorderColor = 'divide-zinc-150';
                    summaryTextColor = 'text-zinc-800';
                    summaryTotalBorderColor = 'border-zinc-800';
                    summaryTotalTextColor = 'text-zinc-950';
                    paymentTitleColor = 'text-zinc-900';
                    paymentTextColor = 'text-zinc-700';
                    noteTextColor = 'text-zinc-600';
                    mapPinColor = 'text-zinc-500';
                  } else if (currentTemplate === 'emerald_premium') {
                    headerTitleColor = 'text-white';
                    headerSubtitleColor = 'text-amber-200/80';
                    docTitleColor = 'text-emerald-900';
                    clientTitleColor = 'text-emerald-900';
                    tableHeaderBorderColor = 'border-amber-500';
                    tableHeaderTextColor = 'text-emerald-900';
                    tableRowTextColor = 'text-emerald-950';
                    tableRowBorderColor = 'divide-emerald-100';
                    summaryTextColor = 'text-emerald-950';
                    summaryTotalBorderColor = 'border-amber-500';
                    summaryTotalTextColor = 'text-emerald-950';
                    paymentTitleColor = 'text-emerald-900';
                    paymentTextColor = 'text-emerald-900/80';
                    noteTextColor = 'text-emerald-950/70';
                    mapPinColor = 'text-amber-300';
                  } else if (currentTemplate === 'crimson_luxury') {
                    headerTitleColor = 'text-white';
                    headerSubtitleColor = 'text-amber-200/85';
                    docTitleColor = 'text-red-950';
                    clientTitleColor = 'text-red-950';
                    tableHeaderBorderColor = 'border-amber-500';
                    tableHeaderTextColor = 'text-red-950';
                    tableRowTextColor = 'text-rose-950';
                    tableRowBorderColor = 'divide-red-100';
                    summaryTextColor = 'text-rose-950';
                    summaryTotalBorderColor = 'border-amber-500';
                    summaryTotalTextColor = 'text-red-950';
                    paymentTitleColor = 'text-red-950';
                    paymentTextColor = 'text-rose-950/80';
                    noteTextColor = 'text-rose-950/70';
                    mapPinColor = 'text-amber-300';
                  } else if (currentTemplate === 'modern_dark_gold') {
                    headerTitleColor = 'text-white';
                    headerSubtitleColor = 'text-amber-400';
                    docTitleColor = 'text-zinc-950';
                    clientTitleColor = 'text-amber-550';
                    tableHeaderBorderColor = 'border-amber-500';
                    tableHeaderTextColor = 'text-zinc-950';
                    tableRowTextColor = 'text-zinc-900';
                    tableRowBorderColor = 'divide-zinc-200';
                    summaryTextColor = 'text-zinc-800';
                    summaryTotalBorderColor = 'border-amber-500';
                    summaryTotalTextColor = 'text-zinc-950';
                    paymentTitleColor = 'text-amber-500';
                    paymentTextColor = 'text-zinc-700';
                    noteTextColor = 'text-zinc-500';
                    mapPinColor = 'text-amber-400';
                  } else if (currentTemplate === 'orange_tech') {
                    headerTitleColor = 'text-white';
                    headerSubtitleColor = 'text-orange-400';
                    docTitleColor = 'text-zinc-900';
                    clientTitleColor = 'text-orange-600';
                    tableHeaderBorderColor = 'border-orange-500';
                    tableHeaderTextColor = 'text-zinc-900';
                    tableRowTextColor = 'text-zinc-800';
                    tableRowBorderColor = 'divide-zinc-150';
                    summaryTextColor = 'text-zinc-800';
                    summaryTotalBorderColor = 'border-orange-500';
                    summaryTotalTextColor = 'text-zinc-950';
                    paymentTitleColor = 'text-orange-600';
                    paymentTextColor = 'text-zinc-700';
                    noteTextColor = 'text-zinc-500';
                    mapPinColor = 'text-orange-400';
                  }

                  return (
                    <>
                      {/* PROFORMA CORE BODY CONTENT */}
                      <div className="relative z-10 w-full">
                        
                        {/* HEADER SECTION GRID */}
                        <div className="grid grid-cols-12 justify-between items-start gap-4 mb-2">
                          
                          {/* LEFT COLUMN: BRANDING */}
                          <div className={`col-span-7 ${isDarkHeader ? 'text-white' : 'text-zinc-900'} text-left flex flex-col items-start pt-1 z-10`}>
                            <div className="flex items-center gap-4">
                              {config.logoB64 ? (
                                <div className="flex flex-col items-center shrink-0">
                                  <img
                                    src={config.logoB64}
                                    alt="Logo Emisor"
                                    className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-md shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className={`text-[10px] font-black tracking-widest mt-1 uppercase leading-none ${isDarkHeader ? 'text-white' : 'text-zinc-900'}`} style={{ fontWeight: 950 }}>JOLUS</span>
                                  <span className={`text-[6px] font-black tracking-[0.2em] uppercase leading-none mt-0.5 ${isDarkHeader ? 'text-white/90' : 'text-zinc-500'}`}>- SERVICES -</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center shrink-0">
                                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                                    {/* HIGH-FIDELITY CONCENTRIC SPIRAL SWIRL (AS SEEN IN JOLUS SERVICES LOGO) */}
                                    <svg viewBox="0 0 120 120" className="w-13 h-13" fill="none">
                                      <circle cx="60" cy="60" r="56" fill="white" />
                                      <path 
                                        d="M 60 16 A 44 44 0 1 1 20 74 C 20 54 36 38 60 38" 
                                        stroke={currentTemplate === 'emerald_premium' ? '#047857' : '#703bb0'} 
                                        strokeWidth="8" 
                                        strokeLinecap="round" 
                                      />
                                      <path 
                                        d="M 60 28 A 32 32 0 1 1 31 71 C 31 56 43 44 60 44" 
                                        stroke={currentTemplate === 'emerald_premium' ? '#f59e0b' : '#96e5ea'} 
                                        strokeWidth="8" 
                                        strokeLinecap="round" 
                                      />
                                      <path 
                                        d="M 60 40 A 20 20 0 1 1 42 68 C 42 59 49 50 60 50" 
                                        stroke={currentTemplate === 'emerald_premium' ? '#059669' : '#3b82f6'} 
                                        strokeWidth="8" 
                                        strokeLinecap="round" 
                                      />
                                      <circle cx="60" cy="60" r="6" fill={currentTemplate === 'emerald_premium' ? '#047857' : '#703bb0'} />
                                    </svg>
                                  </div>
                                  <span className={`text-[10px] font-black tracking-widest mt-1 uppercase leading-none ${isDarkHeader ? 'text-white' : 'text-zinc-900'}`} style={{ fontWeight: 955 }}>JOLUS</span>
                                  <span className={`text-[6px] font-black tracking-[0.2em] uppercase leading-none mt-0.5 ${isDarkHeader ? 'text-white/90' : 'text-zinc-500'}`}>- SERVICES -</span>
                                </div>
                              )}

                              <div className="text-left font-sans flex flex-col justify-center">
                                <h2 className={`text-3.5xl font-black uppercase tracking-tight leading-none ${headerTitleColor}`} style={{ fontWeight: 955, letterSpacing: '-0.04em' }}>
                                  JOLUS
                                </h2>
                                <h2 className={`text-3.5xl font-black uppercase tracking-tight leading-none ${headerSubtitleColor}`} style={{ fontWeight: 950, letterSpacing: '-0.04em' }}>
                                  SERVICES
                                </h2>
                              </div>
                            </div>

                            {/* Location & phone metadata stack */}
                            <div className={`space-y-2.5 text-[12px] font-bold text-left mt-8 pl-2 ${isDarkHeader ? 'text-white' : 'text-zinc-700'}`}>
                              <div className="flex items-center gap-2">
                                <MapPin className={`w-4 h-4 shrink-0 ${mapPinColor}`} fill="currentColor" fillOpacity="0.15" />
                                <span className="select-all leading-tight">
                                  {selectedProforma.empresaDireccion || 'Cdla. Los Esteros Mz. 4A Sl. 26'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className={`w-4 h-4 shrink-0 ${mapPinColor}`} fill="currentColor" fillOpacity="0.15" />
                                <span className="select-all leading-tight font-mono">
                                  {selectedProforma.empresaTelefono || '0967590168'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT COLUMN: DOCUMENT INFO */}
                          <div className="col-span-5 text-right flex flex-col items-end pt-5 pr-1 z-10">
                            <h1 className={`text-4xl font-extrabold uppercase tracking-wide ${isDarkHeader ? 'text-white' : docTitleColor}`} style={{ fontWeight: 955 }}>
                              PROFORMA
                            </h1>
                            <p className={`text-sm font-bold italic select-all tracking-wider pt-3 block ${isDarkHeader ? 'text-white/95' : 'text-zinc-600'}`}>
                              {formatSpanishDate(selectedProforma.fechaEmision)}
                            </p>
                            <p className={`text-xs font-mono font-bold select-all mt-1.5 ${isDarkHeader ? 'text-white/80' : 'text-zinc-500'}`}>
                              Nº {selectedProforma.secuencial}
                            </p>
                          </div>

                        </div>

                        {/* CUSTOM SPACE ADJUSTMENT TO ACCELERATE VERTICAL HARMONY */}
                        <div className="h-14 w-full" />

                        {/* CUSTOMER DATA SUB-PANEL */}
                        <div className="space-y-2 text-left mt-10">
                          <h3 className={`text-sm font-black uppercase tracking-normal ${clientTitleColor}`} style={{ fontSize: '13.5px', fontWeight: 950 }}>
                            Datos del cliente
                          </h3>
                          <div className={`space-y-1.5 pt-1 text-[11px] leading-tight font-medium ${isDarkHeader ? 'opacity-95' : ''}`}>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Nombre:</span>
                              <span className={`font-semibold select-all ${isDarkHeader ? 'text-zinc-900' : 'text-zinc-800'}`}>{selectedProforma.cliente.nombre || 'Carolina Leon'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Teléfono:</span>
                              <span className={`font-mono font-semibold select-all ${isDarkHeader ? 'text-zinc-900' : 'text-zinc-800'}`}>{selectedProforma.cliente.telefono || '0984961268'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Correo electrónico:</span>
                              <span className={`font-semibold select-all break-all ${isDarkHeader ? 'text-zinc-900' : 'text-zinc-800'}`}>{selectedProforma.cliente.correo || 'Carolina.landeta@worq.com.ec'}</span>
                            </div>
                          </div>
                        </div>

                        {/* DYNAMIC ITEMS & PRICING TABLE */}
                        <div className="pt-8">
                          <div className="w-full text-left text-xs">
                            
                            {/* HEADERS */}
                            <div className={`grid grid-cols-12 pb-1.5 font-black text-[11.5px] uppercase tracking-wider ${
                              currentTemplate === 'navy_corporate' 
                                ? 'bg-slate-900 text-white p-2.5 rounded-lg border-none' 
                                : currentTemplate === 'emerald_premium'
                                ? 'border-b border-amber-500 text-emerald-900 pb-2 font-extrabold'
                                : `border-b ${tableHeaderBorderColor} ${tableHeaderTextColor}`
                            }`}>
                              <div className="col-span-6 text-left pl-1">Descripción</div>
                              <div className="col-span-2 text-center">Cantidad</div>
                              <div className="col-span-2 text-center">Precio</div>
                              <div className="col-span-2 text-right pr-1">Total</div>
                            </div>

                            {/* DATA ROWS */}
                            <div className={`divide-y ${tableRowBorderColor} py-0.5 ${currentTemplate === 'navy_corporate' ? 'px-1' : ''}`}>
                              {selectedProforma.detalles.map((det) => (
                                <div key={det.id} className={`grid grid-cols-12 py-2.5 items-center font-medium ${tableRowTextColor}`}>
                                  <div className="col-span-6 text-left select-all pr-4 text-[11.5px] font-medium break-words">
                                    {det.nombrePersonalizado || det.producto.nombre || 'Servicio General'}
                                  </div>
                                  <div className="col-span-2 text-center select-all text-[11.5px] font-medium">
                                    {det.cantidad}
                                  </div>
                                  <div className="col-span-2 text-center select-all text-[11.5px] font-mono">
                                    {det.precio % 1 === 0 ? `$${det.precio.toFixed(0)}` : `$${det.precio.toFixed(2)}`}
                                  </div>
                                  <div className="col-span-2 text-right select-all text-[11.5px] font-mono font-bold">
                                    {det.subtotal % 1 === 0 ? `$${det.subtotal.toFixed(0)}` : `$${det.subtotal.toFixed(2)}`}
                                  </div>
                                </div>
                              ))}
                            </div>

                          </div>
                        </div>

                        {/* SUMMARY BLOCK: EXACTLY POSITIONED SUB-TOTALS */}
                        <div className="grid grid-cols-12 pt-4">
                          <div className="col-span-6" />
                          <div className="col-span-6 text-right space-y-1 text-[11px] pl-4">
                            
                            <div className={`grid grid-cols-2 items-center justify-end ${summaryTextColor}`}>
                              <div className="text-right pr-6 font-medium">Subtotal</div>
                              <div className="font-mono text-right pr-1 font-semibold">
                                ${selectedProforma.resumenImpuestos.subtotal % 1 === 0 ? selectedProforma.resumenImpuestos.subtotal.toFixed(0) : selectedProforma.resumenImpuestos.subtotal.toFixed(2)}
                              </div>
                            </div>

                            {selectedProforma.ivaOption !== 'no_aplica' && (
                              <div className={`grid grid-cols-2 items-center justify-end ${summaryTextColor}`}>
                                <div className="text-right pr-6 font-medium">
                                  {selectedProforma.ivaOption === 'no_objeto' ? 'No Objeto de Impuesto' : 
                                   selectedProforma.ivaOption === 'exento' ? 'Exento de IVA' : 
                                   `Impuestos (${selectedProforma.resumenImpuestos.ivaPorcentaje}%)`}
                                </div>
                                <div className="font-mono text-right pr-1 font-semibold">
                                  ${selectedProforma.resumenImpuestos.ivaValor % 1 === 0 ? selectedProforma.resumenImpuestos.ivaValor.toFixed(0) : selectedProforma.resumenImpuestos.ivaValor.toFixed(2)}
                                </div>
                              </div>
                            )}

                            <div className={`grid grid-cols-2 text-xs pt-1.5 border-t ${summaryTotalBorderColor} items-center justify-end font-black uppercase mt-1`}>
                              <div className={`text-right pr-6 font-black leading-none ${summaryTotalTextColor}`} style={{ fontWeight: 950 }}>Total</div>
                              <div className={`font-mono text-base pr-1 font-black leading-none ${
                                currentTemplate === 'navy_corporate' ? 'text-blue-700' :
                                currentTemplate === 'emerald_premium' ? 'text-emerald-700' :
                                currentTemplate === 'slate_minimalist' ? 'text-zinc-900' :
                                'text-[#703bb0]'
                              }`} style={{ fontWeight: 955 }}>
                                ${selectedProforma.resumenImpuestos.total % 1 === 0 ? selectedProforma.resumenImpuestos.total.toFixed(0) : selectedProforma.resumenImpuestos.total.toFixed(2)}
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* PAYMENT CONDITIONS BLOCK */}
                        <div className="mt-14 space-y-2 text-left">
                          <h4 className={`text-xs font-black uppercase tracking-wider ${paymentTitleColor}`} style={{ fontWeight: 950 }}>
                            Información de pago
                          </h4>
                          <p className={`text-[11px] font-semibold select-all uppercase ${paymentTextColor}`}>
                            {selectedProforma.informacionPago || '70% ANTICIPO Y 30% AL CIERRE DEL CONTRATO'}
                          </p>
                        </div>

                      </div>

                      {/* BOTTOM BLOCK: dudas notes & standard footer strip */}
                      <div className="relative z-10 pt-16 pb-4 flex flex-col items-center">
                        
                        {/* HELPER EMAIL/CONCERNS INCENTIVE SENTENCE */}
                        <div className={`text-center italic text-[11.5px] font-bold leading-normal ${noteTextColor}`}>
                          {selectedProforma.notaDudas === `¿Tienes dudas? Envíanos un correo a jhonnyvp5@gmail.com` || !selectedProforma.notaDudas ? (
                            <>
                              <span>¿Tienes dudas? Envíanos un correo a</span>
                              <br />
                              <span className="font-semibold not-italic">{selectedProforma.empresaCorreo || 'jhonnyvp5@gmail.com'}</span>
                            </>
                          ) : (
                            <span className="whitespace-pre-line">{selectedProforma.notaDudas}</span>
                          )}
                        </div>

                      </div>
                    </>
                  );
                })()}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
