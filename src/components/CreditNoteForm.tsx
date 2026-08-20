import React, { useState, useEffect } from 'react';
import { EmitterConfig, CreditNote, Invoice, Client, Product, CreditNoteDetail, AdicionalInfo, PortalUser } from '../types';
import { generateClaveAcceso, formatSequential, IVA_TARIFAS, IDENTIFICACIONES } from '../sri/utils';
import { Plus, Trash2, ArrowLeftRight, HelpCircle, FileText, Sparkles } from 'lucide-react';
import { modalAlert } from '../context/ModalAlertContext';

interface CreditNoteFormProps {
  config: EmitterConfig;
  clients: Client[];
  invoices: Invoice[];
  onAddCreditNote: (creditNote: CreditNote) => void;
  onNavigateToHistory: () => void;
  currentUser?: PortalUser | null;
}

export default function CreditNoteForm({
  config,
  clients,
  invoices,
  onAddCreditNote,
  onNavigateToHistory,
  currentUser
}: CreditNoteFormProps) {
  // 1. Header and sequences
  const [secuencialVal, setSecuencialVal] = useState('000000001');
  const [fechaEmision, setFechaEmision] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    const stored = localStorage.getItem('sri_highest_secuencial_nc');
    if (stored) {
      const nextSeq = parseInt(stored, 10) + 1;
      setSecuencialVal(formatSequential(nextSeq));
    }
  }, []);

  // 2. Reference/Target Invoice select (or manual fields)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  
  const [targetFacturaSec, setTargetFacturaSec] = useState('');
  const [targetFacturaClave, setTargetFacturaClave] = useState('');
  const [targetFacturaFecha, setTargetFacturaFecha] = useState('');
  const [razonModificacion, setRazonModificacion] = useState('Anulación/Devolución Parcial de Factura');

  // 3. Buyer State (linked or manual)
  const [buyerTipoIdent, setBuyerTipoIdent] = useState<any>('05');
  const [buyerIdent, setBuyerIdent] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerDir, setBuyerDir] = useState('');
  const [buyerTel, setBuyerTel] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // 4. Details/Items (What is being returned/modified)
  const [details, setDetails] = useState<CreditNoteDetail[]>([
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

  // 5. Additional fields
  const [infoAdicional, setInfoAdicional] = useState<AdicionalInfo[]>([
    { id: '1', nombre: 'Email', valor: '' },
    { id: '2', nombre: 'Descripción', valor: '' }
  ]);

  // Link reference Invoice data
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId || invId === 'MANUAL') {
      setTargetFacturaSec('');
      setTargetFacturaClave('');
      setTargetFacturaFecha('');
      return;
    }

    const inv = invoices.find(i => i.id === invId);
    if (inv) {
      setTargetFacturaSec(`${config.codEstablecimiento}-${config.codPuntoEmision}-${inv.secuencial}`);
      setTargetFacturaClave(inv.claveAcceso);
      setTargetFacturaFecha(inv.fechaEmision);

      // Copy Client data
      const c = inv.cliente;
      setBuyerTipoIdent(c.tipoIdentificacion);
      setBuyerIdent(c.identificacion);
      setBuyerName(c.nombre);
      setBuyerDir(c.direccion);
      setBuyerTel(c.telefono);
      setBuyerEmail(c.correo);

      // Pre-fill with reference items (allowing user to adjust or delete lines)
      const copiedDetails = inv.detalles.map(det => ({
        id: 'nc-' + det.id,
        producto: { ...det.producto },
        cantidad: det.cantidad,
        descuento: det.descuento,
        subtotal: det.subtotal,
        ivaCalculado: det.ivaCalculado,
        total: det.total
      }));
      setDetails(copiedDetails);

      const updatedInfo = [...infoAdicional];
      const emailIdx = updatedInfo.findIndex(info => info.nombre.toLowerCase().includes('email'));
      if (emailIdx !== -1) updatedInfo[emailIdx].valor = c.correo;
      setInfoAdicional(updatedInfo);
    }
  };

  const handleProductChange = (index: number, val: string, availableProducts: Product[]) => {
    const updated = [...details];
    const p = availableProducts.find(prod => prod.id === val);
    if (p) {
      updated[index].producto = { ...p };
      updated[index].cantidad = 1;
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
    updated[index].producto[field] = val;
    recalcRow(updated, index);
  };

  const recalcRow = (updated: CreditNoteDetail[], index: number) => {
    const row = updated[index];
    const qty = row.cantidad || 0;
    const price = row.producto.precio || 0;
    const desc = row.descuento || 0;

    const rawSubtotal = qty * price;
    const netSubtotal = Math.max(0, rawSubtotal - desc);
    
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
        producto: { id: '', codigo: '', nombre: '', precio: 0, ivaTipo: '4', descuentoDefault: 0 },
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

  // Obtain flat lists of unique products from historical invoices
  const availableProducts: Product[] = [];
  invoices.forEach(inv => {
    inv.detalles.forEach(d => {
      if (!availableProducts.some(p => p.codigo === d.producto.codigo)) {
        availableProducts.push(d.producto);
      }
    });
  });

  // Calculate Totals refunded
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

  // Real-time Credit Note access key (Type '04')
  let currentClaveAcceso = '';
  let claveError = '';
  try {
    currentClaveAcceso = generateClaveAcceso({
      fechaEmision,
      tipoComprobante: '04', // Credit Note
      ruc: config.ruc,
      ambiente: config.ambiente,
      establecimiento: config.codEstablecimiento,
      puntoEmision: config.codPuntoEmision,
      secuencial: secuencialVal
    });
  } catch (err: any) {
    claveError = err.message || String(err);
  }

  const handleSubmitCreditNote = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerIdent || !buyerName) {
      modalAlert.warning('Datos Incompletos', 'Por favor complete datos del cliente.');
      return;
    }

    if (!targetFacturaSec) {
      modalAlert.warning('Factura Requerida', 'Debe especificar el número secuencial de la factura modificada.');
      return;
    }

    if (!details || details.length === 0) {
      modalAlert.warning('Detalle Requerido', 'Debe agregar al menos un ítem o producto a la Nota de Crédito.');
      return;
    }

    if (details.some(d => !d.producto.nombre || !d.producto.nombre.trim() || d.producto.precio <= 0)) {
      modalAlert.warning('Productos Inválidos', 'Por favor, revise que todos los productos agregados tengan un nombre válido y precio mayor a 0.');
      return;
    }

    const finalBuyer: Client = {
      id: 'c-' + Date.now(),
      tipoIdentificacion: buyerTipoIdent,
      identificacion: buyerIdent,
      nombre: buyerName,
      direccion: buyerDir || 'S/N',
      telefono: buyerTel || '999999999',
      correo: buyerEmail || 'ventas@sri-ecuador.com',
      usuarioCorreo: currentUser?.correo,
      empresaRuc: config.ruc || currentUser?.empresaRuc,
      empresaNombre: config.razonSocial || currentUser?.empresaNombre
    };

    const newCreditNote: CreditNote = {
      id: 'nc-' + Date.now(),
      secuencial: secuencialVal,
      fechaEmision,
      facturaModificadaSecuencial: targetFacturaSec,
      facturaModificadaClaveAcceso: targetFacturaClave || '0000000000000000000000000000000000000000000000000',
      fechaEmisionModificado: targetFacturaFecha || fechaEmision,
      razonModificacion,
      cliente: finalBuyer,
      detalles: details,
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
      },
      empresaRuc: config.ruc || currentUser?.empresaRuc,
      empresaNombre: config.razonSocial || currentUser?.empresaNombre,
      usuarioCorreo: currentUser?.correo,
      creadorNombre: currentUser?.nombre
    };

    const seqNum = parseInt(secuencialVal, 10);
    localStorage.setItem('sri_highest_secuencial_nc', String(seqNum));

    onAddCreditNote(newCreditNote);
    onNavigateToHistory();
    modalAlert.success('Nota de Crédito Creada', `¡Nota de Crédito #${secuencialVal} creada con éxito!`);
  };

  return (
    <form onSubmit={handleSubmitCreditNote} className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* SECCIÓN CABECERA */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-950 dark:text-gray-50 flex items-center gap-2">
            <ArrowLeftRight className="text-indigo-600 w-5.5 h-5.5" />
            Emisión de Nota de Crédito
          </h2>
          <p className="text-xs text-gray-500">
            Punto de Emisión Actual: <span className="font-mono text-indigo-600">{config.codEstablecimiento}-{config.codPuntoEmision}</span> | Nota de Crédito modifica Facturas previamente autorizadas por el SRI.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1 font-mono">SECUENCIAL (Nota NC)</label>
            <input
              type="text"
              value={secuencialVal}
              onChange={(e) => setSecuencialVal(formatSequential(e.target.value.replace(/\D/g, '').substring(0, 9)))}
              className="px-4 py-1.5 border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono text-center text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

      {/* SECCIÓN DOCUMENTO QUE SE MODIFICA */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 pb-2 border-b border-gray-50 dark:border-zinc-800">
          <FileText className="text-indigo-600 w-5 h-5" />
          Sustento / Factura de Referencia que se Modifica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              Seleccionar Factura Existente <span title="Seleccione una factura anteriormente guardada para autocompletar e importar los detalles"><HelpCircle className="w-3.5 h-3.5 text-gray-400" /></span>
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Ingresar Datos Manualmente --</option>
              {invoices.map(i => (
                <option key={i.id} value={i.id}>Factura Sec: {i.secuencial} - {i.cliente.nombre} (${i.resumenImpuestos.total.toFixed(2)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Nro. de Factura Sustento (Estab-PtoEmi-Secuencial)</label>
            <input
              type="text"
              value={targetFacturaSec}
              onChange={(e) => setTargetFacturaSec(e.target.value)}
              placeholder="Ej. 001-001-000000025"
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Fecha Emisión Doc. Sustento</label>
            <input
              type="date"
              value={targetFacturaFecha}
              onChange={(e) => setTargetFacturaFecha(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Clave Acceso de Factura Modificada (si cuenta con ella)</label>
            <input
              type="text"
              value={targetFacturaClave}
              onChange={(e) => setTargetFacturaClave(e.target.value)}
              placeholder="Ej. 1006202601179245108300110010010000000251234567812"
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Motivo Oficial de la Modificación</label>
            <input
              type="text"
              value={razonModificacion}
              onChange={(e) => setRazonModificacion(e.target.value)}
              placeholder="Ej. Devolución de mercadería / Descuento omitido"
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN CLIENTE */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 pb-2 border-b border-gray-50 dark:border-zinc-800">
          Cliente / Destinatario del Reembolso o Ajuste
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Tipo Identificación</label>
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
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Nro. Identificación</label>
            <input
              type="text"
              value={buyerIdent}
              onChange={(e) => setBuyerIdent(e.target.value)}
              placeholder="Ej. 1725619391"
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Ej. JHON DONALDO CHARRY VALLE"
              required
              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
        </div>
      </div>

      {/* DETALLES DE MODIFICACIÓN */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-50 dark:border-zinc-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            Items que Sufren Descuento o Devolución
          </h3>
          <button
            type="button"
            onClick={addDetailRow}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir Item Manual
          </button>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-3 py-2.5 rounded-l-lg">Referencia Catálogo</th>
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Descripción del Item devuelto/ajustado</th>
                <th className="px-3 py-2.5 w-24">Cantidad</th>
                <th className="px-3 py-2.5 w-32">Precio Unitario ($)</th>
                <th className="px-3 py-2.5 w-24">Desc ($)</th>
                <th className="px-3 py-2.5 w-36">Porcentaje IVA</th>
                <th className="px-3 py-2.5 text-right">Subtotal ($)</th>
                <th className="px-3 py-2.5 w-12 text-center rounded-r-lg"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-850">
              {details.map((row, index) => (
                <tr key={row.id}>
                  <td className="px-3 py-4">
                    <select
                      onChange={(e) => handleProductChange(index, e.target.value, availableProducts)}
                      value={row.producto.id || ''}
                      className="p-1 px-2 border rounded-md border-gray-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                    >
                      <option value="">-- Selección --</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3 py-4">
                    <input
                      type="text"
                      value={row.producto.codigo}
                      onChange={(e) => updateCodeName(index, 'codigo', e.target.value)}
                      className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono w-24"
                    />
                  </td>

                  <td className="px-3 py-4">
                    <input
                      type="text"
                      value={row.producto.nombre}
                      onChange={(e) => updateCodeName(index, 'nombre', e.target.value)}
                      className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 w-48"
                    />
                  </td>

                  <td className="px-3 py-4">
                    <input
                      type="number"
                      step="0.01"
                      value={row.cantidad}
                      onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                      className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 w-16 text-center"
                    />
                  </td>

                  <td className="px-3 py-4">
                    <input
                      type="number"
                      step="0.01"
                      value={row.producto.precio}
                      onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                      className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 w-24 text-right"
                    />
                  </td>

                  <td className="px-3 py-4">
                    <input
                      type="number"
                      step="0.01"
                      value={row.descuento}
                      onChange={(e) => updateDiscount(index, parseFloat(e.target.value) || 0)}
                      className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 w-16 text-right"
                    />
                  </td>

                  <td className="px-3 py-4">
                    <select
                      value={row.producto.ivaTipo}
                      onChange={(e) => updateIva(index, e.target.value)}
                      className="p-1 px-2 border border-gray-200 dark:border-zinc-700 rounded-md text-xs bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                    >
                      {Object.entries(IVA_TARIFAS).map(([code, def]) => (
                        <option key={code} value={code}>{def.label}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3 py-4 text-right font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                    ${row.subtotal.toFixed(2)}
                  </td>

                  <td className="px-3 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => removeDetailRow(index)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-4 md:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-800 pb-2">Efecto Tributario</h3>
          <p className="text-xs text-gray-500 leading-normal">
            La nota de crédito deducirá las bases y el IVA indicados abajo de los saldos acumulados de su facturación fiscal mensual. Se generará un comprobante electrónico único firmado del tipo '04'. No requiere definir nuevas formas de pago especiales ya que hereda el método del comprobante original.
          </p>

          <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 mt-4 space-y-3">
            <h4 className="font-bold text-gray-905 dark:text-gray-100 text-xs tracking-wider uppercase">Información Adicional</h4>
            
            <div className="grid grid-cols-1 gap-3">
              {infoAdicional.map((info, idx) => (
                <div key={info.id} className="flex items-center gap-2">
                  <div className="w-1/3">
                    <input
                      type="text"
                      value={info.nombre}
                      onChange={(e) => {
                        const updated = [...infoAdicional];
                        updated[idx].nombre = e.target.value;
                        setInfoAdicional(updated);
                      }}
                      placeholder="Nombre del campo"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-950 dark:text-gray-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={info.valor}
                      onChange={(e) => {
                        const updated = [...infoAdicional];
                        updated[idx].valor = e.target.value;
                        setInfoAdicional(updated);
                      }}
                      placeholder="Valor / Detalle"
                      className="w-full px-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-950 dark:text-gray-100 text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInfoAdicional(infoAdicional.filter(item => item.id !== info.id));
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 transition rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Eliminar campo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setInfoAdicional([
                  ...infoAdicional,
                  { id: String(Date.now()), nombre: '', valor: '' }
                ]);
              }}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Campo Adicional
            </button>
          </div>
        </div>

        {/* RESUMEN TOTALES LIQUIDO */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 space-y-3 font-mono text-xs">
          <h3 className="font-sans font-bold text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-zinc-800 pb-2 text-sm">Ajuste / Retorno NC</h3>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Monto Subtotal Neto:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-150">${(subtotal + totalDescuento).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Descuento Re-aplicado (-):</span>
            <span className="font-semibold text-red-600">-${totalDescuento.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Monto Base 0%:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-150">${base0.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Monto Base IVA:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-150">${baseIva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-indigo-600 font-bold">
            <span>IVA Reembolsado:</span>
            <span>+${valorIva.toFixed(2)}</span>
          </div>
          <hr className="border-gray-100 dark:border-zinc-800 my-1" />
          <div className="flex justify-between font-sans text-base font-bold text-gray-950 dark:text-gray-50">
            <span>Total Nota de Crédito:</span>
            <span>${aggregateTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* CLAVE DE ACCESO NC PREVIEW */}
      <div className="bg-gray-100/70 p-4 rounded-xl border border-gray-200 dark:bg-zinc-950/20 dark:border-zinc-800 space-y-2">
        <span className="block text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
          Clave de Acceso Nota de Crédito (Tipo '04')
        </span>
        {claveError ? (
          <div className="text-xs text-red-500 font-mono">{claveError}</div>
        ) : (
          <div className="font-mono text-[11px] break-all tracking-wider text-gray-800 dark:text-gray-300 bg-white dark:bg-zinc-900/50 p-2.5 rounded-lg border border-gray-200/40">
            {currentClaveAcceso}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-10 rounded-xl cursor-pointer shadow-md transition text-sm flex items-center gap-2"
        >
          Guardar y Crear Nota de Crédito Borrador
        </button>
      </div>
    </form>
  );
}
