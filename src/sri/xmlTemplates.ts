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
  const detailsXml = invoice.detalles.map(det => {
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

    const detailTotalSinImp = det.subtotal;
    const itemIvaVal = det.ivaCalculado;

    return `
    <detalle>
      <codigoPrincipal>${escapeXml(det.producto.codigo)}</codigoPrincipal>
      <descripcion>${escapeXml(det.producto.nombre)}</descripcion>
      <cantidad>${formatQty(det.cantidad)}</cantidad>
      <precioUnitario>${Number(det.producto.precio).toFixed(4)}</precioUnitario>
      <descuento>${formatNum(det.descuento)}</descuento>
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>${config.ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(config.razonSocial)}</razonSocial>
    <nombreComercial>${escapeXml(config.nombreComercial || config.razonSocial)}</nombreComercial>
    <ruc>${config.ruc}</ruc>
    <claveAcceso>${invoice.claveAcceso}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${config.codEstablecimiento}</estab>
    <ptoEmi>${config.codPuntoEmision}</ptoEmi>
    <secuencial>${invoice.secuencial}</secuencial>
    <dirMatriz>${escapeXml(config.dirMatriz)}</dirMatriz>${agenteRetencionXml}${regimenCommentsXml}
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${fechaEmiFormatted}</fechaEmision>
    <dirEstablecimiento>${escapeXml(config.dirEstablecimiento || config.dirMatriz)}</dirEstablecimiento>${config.contribuyenteEspecial ? `\n    <contribuyenteEspecial>${escapeXml(config.contribuyenteEspecial)}</contribuyenteEspecial>` : ''}
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
  const detailsXml = creditNote.detalles.map(det => {
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

    const detailTotalSinImp = det.subtotal;
    const itemIvaVal = det.ivaCalculado;

    return `
    <detalle>
      <codigoInterno>${escapeXml(det.producto.codigo)}</codigoInterno>
      <descripcion>${escapeXml(det.producto.nombre)}</descripcion>
      <cantidad>${formatQty(det.cantidad)}</cantidad>
      <precioUnitario>${Number(det.producto.precio).toFixed(4)}</precioUnitario>
      <descuento>${formatNum(det.descuento)}</descuento>
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<notaCredito id="comprobante" version="1.0.0">
  <infoTributaria>
    <ambiente>${config.ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(config.razonSocial)}</razonSocial>
    <nombreComercial>${escapeXml(config.nombreComercial || config.razonSocial)}</nombreComercial>
    <ruc>${config.ruc}</ruc>
    <claveAcceso>${creditNote.claveAcceso}</claveAcceso>
    <codDoc>04</codDoc>
    <estab>${config.codEstablecimiento}</estab>
    <ptoEmi>${config.codPuntoEmision}</ptoEmi>
    <secuencial>${creditNote.secuencial}</secuencial>
    <dirMatriz>${escapeXml(config.dirMatriz)}</dirMatriz>${agenteRetencionXml}${regimenCommentsXml}
  </infoTributaria>
  <infoNotaCredito>
    <fechaEmision>${fechaEmiFormatted}</fechaEmision>
    <dirEstablecimiento>${escapeXml(config.dirEstablecimiento || config.dirMatriz)}</dirEstablecimiento>
    <tipoIdentificacionComprador>${creditNote.cliente.tipoIdentificacion}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(creditNote.cliente.nombre)}</razonSocialComprador>
    <identificacionComprador>${creditNote.cliente.identificacion}</identificacionComprador>${config.contribuyenteEspecial ? `\n    <contribuyenteEspecial>${escapeXml(config.contribuyenteEspecial)}</contribuyenteEspecial>` : ''}
    <obligadoContabilidad>${config.obligadoContabilidad ? 'SI' : 'NO'}</obligadoContabilidad>
    <codDocModificado>01</codDocModificado>
    <numDocModificado>${creditNote.facturaModificadaSecuencial}</numDocModificado>
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
