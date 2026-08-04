import { EmitterConfig, Invoice, CreditNote, InvoiceDetail, CreditNoteDetail } from '../types';

// Helper to escape XML special characters
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Format number for XML (2 decimals)
function formatNum(num: number): string {
  return Number(num || 0).toFixed(2);
}

// Format integer/quantity (6 decimals maximum or 2 decimals)
function formatQty(num: number): string {
  return Number(num || 0).toFixed(2);
}

// Convert date YYYY-MM-DD to DD/MM/YYYY for SRI xml compatibility
function formatDateDDMMYYYY(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Generates the unsigned XML for an Ecuadorian Invoice (Factura) version 1.1.0
 */
export function generateInvoiceXml(invoice: Invoice, config: EmitterConfig): string {
  const fechaEmiFormatted = formatDateDDMMYYYY(invoice.fechaEmision);
  
  // Group taxes to build totals
  const subtotalZero = invoice.resumenImpuestos.base0;
  const subtotalIva = invoice.resumenImpuestos.baseIva;
  const valIva = invoice.resumenImpuestos.valorIva;
  
  // Obtain percentage codes based on tariff
  // 12% is code '2', 15% is code '4', 0% is code '0'
  const taxTotalsXml: string[] = [];
  
  if (subtotalIva > 0) {
    // Check if 12% or 15% - we can look at the first item that has VAT to determine
    const has15 = invoice.detalles.some(d => d.producto.ivaTipo === '4');
    const pctCode = has15 ? '4' : '2';
    const tariffRate = has15 ? '15.00' : '12.00';
    taxTotalsXml.push(`
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>${pctCode}</codigoPorcentaje>
        <baseImponible>${formatNum(subtotalIva)}</baseImponible>
        <tarifa>${tariffRate}</tarifa>
        <valor>${formatNum(valIva)}</valor>
      </totalImpuesto>`);
  }
  
  if (subtotalZero > 0 || taxTotalsXml.length === 0) {
    taxTotalsXml.push(`
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>0</codigoPorcentaje>
        <baseImponible>${formatNum(subtotalZero || (subtotalIva > 0 ? 0 : invoice.resumenImpuestos.subtotal))}</baseImponible>
        <tarifa>0.00</tarifa>
        <valor>0.00</valor>
      </totalImpuesto>`);
  }

  // Details
  const itemsToProcess = (invoice.detalles && invoice.detalles.length > 0) ? invoice.detalles : [
    {
      id: 'default-1',
      producto: {
        id: 'p1',
        codigo: '001',
        nombre: 'PRODUCTO O SERVICIO',
        precio: invoice.resumenImpuestos?.subtotal || 1.0,
        ivaTipo: '4',
        descuentoDefault: 0
      },
      cantidad: 1,
      descuento: 0,
      subtotal: invoice.resumenImpuestos?.subtotal || 1.0,
      ivaCalculado: invoice.resumenImpuestos?.valorIva || 0.15,
      total: invoice.resumenImpuestos?.total || 1.15
    }
  ];

  const detailsXml = itemsToProcess.map(det => {
    let pctCode = '0';
    let rateStr = '0.00';
    
    if (det.producto.ivaTipo === '2') {
      pctCode = '2';
      rateStr = '12.00';
    } else if (det.producto.ivaTipo === '4') {
      pctCode = '4';
      rateStr = '15.00';
    } else if (det.producto.ivaTipo === '6') {
      pctCode = '6';
    } else if (det.producto.ivaTipo === '7') {
      pctCode = '7';
    }

    const codigoClean = escapeXml(det.producto.codigo || '001');
    const nombreClean = escapeXml(det.producto.nombre || 'PRODUCTO O SERVICIO');
    const cantFormatted = formatQty(det.cantidad > 0 ? det.cantidad : 1);
    const unitPrice = det.producto.precio > 0 ? det.producto.precio : (det.subtotal || 1);
    const precioFormatted = Number(unitPrice).toFixed(4);
    const descFormatted = formatNum(det.descuento || 0);
    const detailTotalSinImp = det.subtotal > 0 ? det.subtotal : (det.cantidad * unitPrice);
    const itemIvaVal = det.ivaCalculado || 0;

    return `
    <detalle>
      <codigoPrincipal>${codigoClean}</codigoPrincipal>
      <descripcion>${nombreClean}</descripcion>
      <cantidad>${cantFormatted}</cantidad>
      <precioUnitario>${precioFormatted}</precioUnitario>
      <descuento>${descFormatted}</descuento>
      <precioTotalSinImpuesto>${formatNum(detailTotalSinImp)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>${pctCode}</codigoPorcentaje>
          <tarifa>${rateStr}</tarifa>
          <baseImponible>${formatNum(detailTotalSinImp)}</baseImponible>
          <valor>${formatNum(itemIvaVal)}</valor>
        </impuesto>
      </impuestos>
    </detalle>`;
  }).join('');

  // Payment methods xml
  const paymentsXml = `
    <pagos>
      <pago>
        <formaPago>${invoice.formaPago}</formaPago>
        <total>${formatNum(invoice.resumenImpuestos.total)}</total>
        <plazo>${invoice.plazo}</plazo>
        <unidadTiempo>${invoice.unidadTiempo}</unidadTiempo>
      </pago>
    </pagos>`;

  // Additional info xml
  let additionalInfoXml = '';
  if (invoice.infoAdicional && invoice.infoAdicional.length > 0) {
    additionalInfoXml = `
    <infoAdicional>${invoice.infoAdicional.map(info => `
      <campoAdicional nombre="${escapeXml(info.nombre)}">${escapeXml(info.valor)}</campoAdicional>`).join('')}
    </infoAdicional>`;
  }

  // Régimen tags indicator
  let regimenCommentsXml = '';
  if (config.regimen === 'RIMPE_POPULAR') {
    regimenCommentsXml = `\n    <contribuyenteRimpe>CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE</contribuyenteRimpe>`;
  } else if (config.regimen === 'RIMPE_EMPRENDEDOR') {
    regimenCommentsXml = `\n    <contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>`;
  }

  let agenteRetencionXml = '';
  if (config.agenteRetencion) {
    agenteRetencionXml = `\n    <agenteRetencion>${escapeXml(config.agenteRetencion)}</agenteRetencion>`;
  }

  const estabFormatted = (config.codEstablecimiento || '001').toString().trim().padStart(3, '0');
  const ptoEmiFormatted = (config.codPuntoEmision || '001').toString().trim().padStart(3, '0');
  const secuencialFormatted = (invoice.secuencial || '1').toString().trim().padStart(9, '0');
  const rucFormatted = (config.ruc || '1792451083001').toString().trim().padStart(13, '0');
  const dirMatrizClean = escapeXml(config.dirMatriz || config.dirEstablecimiento || 'Quito - Ecuador');
  const dirEstabClean = escapeXml(config.dirEstablecimiento || config.dirMatriz || 'Quito - Ecuador');

  return `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>${config.ambiente || '1'}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(config.razonSocial || 'EMISOR')}</razonSocial>
    <nombreComercial>${escapeXml(config.nombreComercial || config.razonSocial || 'EMISOR')}</nombreComercial>
    <ruc>${rucFormatted}</ruc>
    <claveAcceso>${invoice.claveAcceso}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${estabFormatted}</estab>
    <ptoEmi>${ptoEmiFormatted}</ptoEmi>
    <secuencial>${secuencialFormatted}</secuencial>
    <dirMatriz>${dirMatrizClean}</dirMatriz>${agenteRetencionXml}${regimenCommentsXml}
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${fechaEmiFormatted}</fechaEmision>
    <dirEstablecimiento>${dirEstabClean}</dirEstablecimiento>${config.contribuyenteEspecial ? `\n    <contribuyenteEspecial>${escapeXml(config.contribuyenteEspecial)}</contribuyenteEspecial>` : ''}
    <obligadoContabilidad>${config.obligadoContabilidad ? 'SI' : 'NO'}</obligadoContabilidad>
    <tipoIdentificacionComprador>${invoice.cliente.tipoIdentificacion}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(invoice.cliente.nombre)}</razonSocialComprador>
    <identificacionComprador>${invoice.cliente.identificacion}</identificacionComprador>${invoice.cliente.direccion ? `\n    <direccionComprador>${escapeXml(invoice.cliente.direccion)}</direccionComprador>` : ''}
    <totalSinImpuestos>${formatNum(invoice.resumenImpuestos.subtotal)}</totalSinImpuestos>
    <totalDescuento>${formatNum(invoice.resumenImpuestos.descuento)}</totalDescuento>
    <totalConImpuestos>${taxTotalsXml.join('')}
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${formatNum(invoice.resumenImpuestos.total)}</importeTotal>
    <moneda>DOLAR</moneda>${paymentsXml}
  </infoFactura>
  <detalles>${detailsXml}
  </detalles>${additionalInfoXml}
</factura>`;
}

/**
 * Generates the unsigned XML for an Ecuadorian Credit Note (Nota de Crédito) version 1.0.0
 */
export function generateCreditNoteXml(creditNote: CreditNote, config: EmitterConfig): string {
  const fechaEmiFormatted = formatDateDDMMYYYY(creditNote.fechaEmision);
  const fechaModFormatted = formatDateDDMMYYYY(creditNote.fechaEmisionModificado);
  
  const subtotalZero = creditNote.resumenImpuestos.base0;
  const subtotalIva = creditNote.resumenImpuestos.baseIva;
  const valIva = creditNote.resumenImpuestos.valorIva;
  
  const taxTotalsXml: string[] = [];
  
  if (subtotalIva > 0) {
    const has15 = creditNote.detalles.some(d => d.producto.ivaTipo === '4');
    const pctCode = has15 ? '4' : '2';
    const tariffRate = has15 ? '15.00' : '12.00';
    taxTotalsXml.push(`
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>${pctCode}</codigoPorcentaje>
        <baseImponible>${formatNum(subtotalIva)}</baseImponible>
        <valor>${formatNum(valIva)}</valor>
      </totalImpuesto>`);
  }
  
  if (subtotalZero > 0 || taxTotalsXml.length === 0) {
    taxTotalsXml.push(`
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>0</codigoPorcentaje>
        <baseImponible>${formatNum(subtotalZero || (subtotalIva > 0 ? 0 : creditNote.resumenImpuestos.subtotal))}</baseImponible>
        <valor>0.00</valor>
      </totalImpuesto>`);
  }

  // Details
  const itemsToProcess = (creditNote.detalles && creditNote.detalles.length > 0) ? creditNote.detalles : [
    {
      id: 'default-nc-1',
      producto: {
        id: 'p1',
        codigo: '001',
        nombre: 'PRODUCTO O SERVICIO',
        precio: creditNote.resumenImpuestos?.subtotal || 1.0,
        ivaTipo: '4',
        descuentoDefault: 0
      },
      cantidad: 1,
      descuento: 0,
      subtotal: creditNote.resumenImpuestos?.subtotal || 1.0,
      ivaCalculado: creditNote.resumenImpuestos?.valorIva || 0.15,
      total: creditNote.resumenImpuestos?.total || 1.15
    }
  ];

  const detailsXml = itemsToProcess.map(det => {
    let pctCode = '0';
    let rateStr = '0.00';
    
    if (det.producto.ivaTipo === '2') {
      pctCode = '2';
      rateStr = '12.00';
    } else if (det.producto.ivaTipo === '4') {
      pctCode = '4';
      rateStr = '15.00';
    } else if (det.producto.ivaTipo === '6') {
      pctCode = '6';
    } else if (det.producto.ivaTipo === '7') {
      pctCode = '7';
    }

    const codigoClean = escapeXml(det.producto.codigo || '001');
    const nombreClean = escapeXml(det.producto.nombre || 'PRODUCTO O SERVICIO');
    const cantFormatted = formatQty(det.cantidad > 0 ? det.cantidad : 1);
    const unitPrice = det.producto.precio > 0 ? det.producto.precio : (det.subtotal || 1);
    const precioFormatted = Number(unitPrice).toFixed(4);
    const descFormatted = formatNum(det.descuento || 0);
    const detailTotalSinImp = det.subtotal > 0 ? det.subtotal : (det.cantidad * unitPrice);
    const itemIvaVal = det.ivaCalculado || 0;

    return `
    <detalle>
      <codigoInterno>${codigoClean}</codigoInterno>
      <descripcion>${nombreClean}</descripcion>
      <cantidad>${cantFormatted}</cantidad>
      <precioUnitario>${precioFormatted}</precioUnitario>
      <descuento>${descFormatted}</descuento>
      <precioTotalSinImpuesto>${formatNum(detailTotalSinImp)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>${pctCode}</codigoPorcentaje>
          <tarifa>${rateStr}</tarifa>
          <baseImponible>${formatNum(detailTotalSinImp)}</baseImponible>
          <valor>${formatNum(itemIvaVal)}</valor>
        </impuesto>
      </impuestos>
    </detalle>`;
  }).join('');

  // Additional info xml
  let additionalInfoXml = '';
  if (creditNote.infoAdicional && creditNote.infoAdicional.length > 0) {
    additionalInfoXml = `
    <infoAdicional>${creditNote.infoAdicional.map(info => `
      <campoAdicional nombre="${escapeXml(info.nombre)}">${escapeXml(info.valor)}</campoAdicional>`).join('')}
    </infoAdicional>`;
  }

  let regimenCommentsXml = '';
  if (config.regimen === 'RIMPE_POPULAR') {
    regimenCommentsXml = `\n    <contribuyenteRimpe>CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE</contribuyenteRimpe>`;
  } else if (config.regimen === 'RIMPE_EMPRENDEDOR') {
    regimenCommentsXml = `\n    <contribuyenteRimpe>CONTRIBUYENTE RÉGIMEN RIMPE</contribuyenteRimpe>`;
  }

  let agenteRetencionXml = '';
  if (config.agenteRetencion) {
    agenteRetencionXml = `\n    <agenteRetencion>${escapeXml(config.agenteRetencion)}</agenteRetencion>`;
  }

  const estabFormatted = (config.codEstablecimiento || '001').toString().trim().padStart(3, '0');
  const ptoEmiFormatted = (config.codPuntoEmision || '001').toString().trim().padStart(3, '0');
  const secuencialFormatted = (creditNote.secuencial || '1').toString().trim().padStart(9, '0');
  const rucFormatted = (config.ruc || '1792451083001').toString().trim().padStart(13, '0');
  const dirMatrizClean = escapeXml(config.dirMatriz || config.dirEstablecimiento || 'Quito - Ecuador');
  const dirEstabClean = escapeXml(config.dirEstablecimiento || config.dirMatriz || 'Quito - Ecuador');

  let formattedDocMod = creditNote.facturaModificadaSecuencial || '001-001-000000001';
  if (!formattedDocMod.includes('-')) {
    formattedDocMod = `${estabFormatted}-${ptoEmiFormatted}-${formattedDocMod.padStart(9, '0')}`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<notaCredito id="comprobante" version="1.0.0">
  <infoTributaria>
    <ambiente>${config.ambiente || '1'}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(config.razonSocial || 'EMISOR')}</razonSocial>
    <nombreComercial>${escapeXml(config.nombreComercial || config.razonSocial || 'EMISOR')}</nombreComercial>
    <ruc>${rucFormatted}</ruc>
    <claveAcceso>${creditNote.claveAcceso}</claveAcceso>
    <codDoc>04</codDoc>
    <estab>${estabFormatted}</estab>
    <ptoEmi>${ptoEmiFormatted}</ptoEmi>
    <secuencial>${secuencialFormatted}</secuencial>
    <dirMatriz>${dirMatrizClean}</dirMatriz>${agenteRetencionXml}${regimenCommentsXml}
  </infoTributaria>
  <infoNotaCredito>
    <fechaEmision>${fechaEmiFormatted}</fechaEmision>
    <dirEstablecimiento>${dirEstabClean}</dirEstablecimiento>
    <tipoIdentificacionComprador>${creditNote.cliente.tipoIdentificacion}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(creditNote.cliente.nombre)}</razonSocialComprador>
    <identificacionComprador>${creditNote.cliente.identificacion}</identificacionComprador>${config.contribuyenteEspecial ? `\n    <contribuyenteEspecial>${escapeXml(config.contribuyenteEspecial)}</contribuyenteEspecial>` : ''}
    <obligadoContabilidad>${config.obligadoContabilidad ? 'SI' : 'NO'}</obligadoContabilidad>
    <codDocModificado>01</codDocModificado>
    <numDocModificado>${formattedDocMod}</numDocModificado>
    <fechaEmisionDocSustento>${fechaModFormatted}</fechaEmisionDocSustento>
    <totalSinImpuestos>${formatNum(creditNote.resumenImpuestos.subtotal)}</totalSinImpuestos>
    <valorModificacion>${formatNum(creditNote.resumenImpuestos.total)}</valorModificacion>
    <moneda>DOLAR</moneda>
    <totalConImpuestos>${taxTotalsXml.join('')}
    </totalConImpuestos>
    <motivo>${escapeXml(creditNote.razonModificacion)}</motivo>
  </infoNotaCredito>
  <detalles>${detailsXml}
  </detalles>${additionalInfoXml}
</notaCredito>`;
}
