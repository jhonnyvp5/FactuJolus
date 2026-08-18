import PDFDocument from 'pdfkit';
import { Invoice, EmitterConfig, Retention } from '../types';

export function generateInvoicePdfBuffer(invoice: Invoice, config: EmitterConfig): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const isInvoice = !('facturaModificadaSecuencial' in invoice);
      const title = isInvoice ? 'FACTURA' : 'NOTA DE CRÉDITO';
      const emitterName = config.razonSocial || 'ORIONNX';
      const tradeName = config.nombreComercial || 'ORIONNX';
      const numDoc = `${config.codEstablecimiento || '001'}-${config.codPuntoEmision || '001'}-${invoice.secuencial}`;
      const claveAcceso = invoice.claveAcceso || '0000000000000000000000000000000000000000000000000';
      const ambienteStr = config.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS';

      // --- Header Box (Left: Company, Right: SRI Box) ---
      // Company Info (Left)
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e1b4b').text(tradeName, 30, 35, { width: 250 });
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155').text(emitterName, 30, 55, { width: 250 });
      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      doc.text(`RUC: ${config.ruc || '1792451083001'}`, 30, 70);
      doc.text(`Dir. Matriz: ${config.dirMatriz || 'Quito, Ecuador'}`, 30, 83, { width: 250 });
      doc.text(`Dir. Establecimiento: ${config.dirEstablecimiento || config.dirMatriz || 'Quito, Ecuador'}`, 30, 105, { width: 250 });
      doc.text(`Obligado a Llevar Contabilidad: ${config.obligadoContabilidad ? 'SI' : 'NO'}`, 30, 127);
      if (config.contribuyenteEspecial) {
        doc.text(`Contribuyente Especial Nro: ${config.contribuyenteEspecial}`, 30, 140);
      }

      // SRI Box (Right)
      doc.roundedRect(290, 30, 275, 140, 6).lineWidth(1).strokeColor('#cbd5e1').stroke();
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(title, 305, 38);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#2563eb').text(`No. ${numDoc}`, 305, 52);

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(`NÚMERO DE AUTORIZACIÓN:`, 305, 68);
      doc.fontSize(7.5).font('Helvetica-Bold').text(invoice.numeroAutorizacion || claveAcceso, 305, 78, { width: 250 });

      doc.fontSize(8).font('Helvetica').text(`FECHA Y HORA DE AUTORIZACIÓN: ${invoice.fechaAutorizacion || invoice.fechaEmision}`, 305, 93);
      doc.text(`AMBIENTE: ${ambienteStr}`, 305, 105);
      doc.text(`EMISIÓN: NORMAL`, 305, 117);
      doc.text(`CLAVE DE ACCESO:`, 305, 129);
      doc.fontSize(7.5).font('Helvetica-Bold').text(claveAcceso, 305, 139, { width: 250 });

      // --- Client Info Box ---
      const clientY = 180;
      doc.roundedRect(30, clientY, 535, 60, 4).lineWidth(0.8).strokeColor('#e2e8f0').stroke();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text(`Razón Social / Nombres y Apellidos: `, 38, clientY + 8, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(invoice.cliente.nombre);

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Identificación: `, 38, clientY + 23, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(invoice.cliente.identificacion);

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Fecha Emisión: `, 320, clientY + 23, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(invoice.fechaEmision);

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Dirección: `, 38, clientY + 38, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(invoice.cliente.direccion || 'S/N');

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Teléfono / Correo: `, 320, clientY + 38, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(`${invoice.cliente.telefono || ''} - ${invoice.cliente.correo || ''}`);

      // --- Details Table ---
      let tableY = clientY + 70;
      doc.rect(30, tableY, 535, 18).fill('#f1f5f9');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text('Cod. Principal', 35, tableY + 5, { width: 75 });
      doc.text('Cantidad', 115, tableY + 5, { width: 50, align: 'right' });
      doc.text('Descripción', 175, tableY + 5, { width: 210 });
      doc.text('Precio Unit.', 390, tableY + 5, { width: 50, align: 'right' });
      doc.text('Descuento', 445, tableY + 5, { width: 50, align: 'right' });
      doc.text('Precio Total', 500, tableY + 5, { width: 60, align: 'right' });

      tableY += 18;
      doc.font('Helvetica').fontSize(8).fillColor('#334155');

      invoice.detalles.forEach((det, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(30, tableY, 535, 16).fill(bg);
        doc.fillColor('#334155');
        doc.text(det.producto.codigo || `P-${idx + 1}`, 35, tableY + 4, { width: 75 });
        doc.text(det.cantidad.toString(), 115, tableY + 4, { width: 50, align: 'right' });
        doc.text(det.producto.nombre, 175, tableY + 4, { width: 210, height: 12, ellipsis: true });
        doc.text(`${Number(det.producto.precio).toFixed(2)}`, 390, tableY + 4, { width: 50, align: 'right' });
        doc.text(`${Number(det.descuento || 0).toFixed(2)}`, 445, tableY + 4, { width: 50, align: 'right' });
        doc.text(`${Number(det.subtotal).toFixed(2)}`, 500, tableY + 4, { width: 60, align: 'right' });
        tableY += 16;
      });

      tableY += 10;

      // --- Totals Section (Right side) & Info Adicional (Left side) ---
      const totalBoxY = tableY;

      // Left Box: Informacion Adicional
      doc.roundedRect(30, totalBoxY, 300, 110, 4).lineWidth(0.8).strokeColor('#e2e8f0').stroke();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('INFORMACIÓN ADICIONAL', 38, totalBoxY + 8);
      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      let infoY = totalBoxY + 22;
      doc.text(`Email Cliente: ${invoice.cliente.correo}`, 38, infoY);
      infoY += 12;
      doc.text(`Teléfono: ${invoice.cliente.telefono || 'N/A'}`, 38, infoY);
      infoY += 12;
      doc.text(`Forma de Pago: Sin utilización del sistema financiero (01)`, 38, infoY);
      infoY += 12;

      if (invoice.infoAdicional && invoice.infoAdicional.length > 0) {
        invoice.infoAdicional.forEach(info => {
          if (info.nombre && info.valor) {
            doc.text(`${info.nombre}: ${info.valor}`, 38, infoY, { width: 280, height: 10, ellipsis: true });
            infoY += 12;
          }
        });
      }

      // Right Box: Totals
      const totalsX = 340;
      doc.roundedRect(totalsX, totalBoxY, 225, 120, 4).lineWidth(0.8).strokeColor('#cbd5e1').stroke();
      let totY = totalBoxY + 8;

      const res = invoice.resumenImpuestos || { subtotal: 0, descuento: 0, base0: 0, baseIva: 0, valorIva: 0, total: 0 };

      const drawTotalLine = (label: string, val: number, bold = false) => {
        doc.fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? '#0f172a' : '#334155');
        doc.text(label, totalsX + 10, totY, { width: 130 });
        doc.text(`${Number(val).toFixed(2)}`, totalsX + 140, totY, { width: 75, align: 'right' });
        totY += 14;
      };

      drawTotalLine('SUBTOTAL 15%', res.baseIva || 0);
      drawTotalLine('SUBTOTAL 0%', res.base0 || 0);
      drawTotalLine('SUBTOTAL SIN IMPUESTOS', res.subtotal || 0);
      drawTotalLine('DESCUENTO', res.descuento || 0);
      drawTotalLine('IVA 15%', res.valorIva || 0);
      doc.moveTo(totalsX + 10, totY).lineTo(totalsX + 215, totY).strokeColor('#cbd5e1').stroke();
      totY += 4;
      drawTotalLine('VALOR TOTAL', res.total || 0, true);

      // Footer message
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b').text('Comprobante Electrónico emitido en conformidad con la normativa del SRI Ecuador. ORIONNX', 30, 780, { align: 'center', width: 535 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export function generateRetentionPdfBuffer(retention: Retention, config: EmitterConfig): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const title = 'COMPROBANTE DE RETENCIÓN';
      const emitterName = config.razonSocial || 'ORIONNX';
      const tradeName = config.nombreComercial || 'ORIONNX';
      const numDoc = `${config.codEstablecimiento || '001'}-${config.codPuntoEmision || '001'}-${retention.secuencial}`;
      const claveAcceso = retention.claveAcceso || '0000000000000000000000000000000000000000000000000';
      const ambienteStr = config.ambiente === '2' ? 'PRODUCCIÓN' : 'PRUEBAS';

      // --- Header Box (Left: Company, Right: SRI Box) ---
      // Company Info (Left)
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e1b4b').text(tradeName, 30, 35, { width: 250 });
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155').text(emitterName, 30, 55, { width: 250 });
      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      doc.text(`RUC: ${config.ruc || '1792451083001'}`, 30, 70);
      doc.text(`Dir. Matriz: ${config.dirMatriz || 'Quito, Ecuador'}`, 30, 83, { width: 250 });
      doc.text(`Dir. Establecimiento: ${config.dirEstablecimiento || config.dirMatriz || 'Quito, Ecuador'}`, 30, 105, { width: 250 });
      doc.text(`Obligado a Llevar Contabilidad: ${config.obligadoContabilidad ? 'SI' : 'NO'}`, 30, 127);
      if (config.contribuyenteEspecial) {
        doc.text(`Contribuyente Especial Nro: ${config.contribuyenteEspecial}`, 30, 140);
      }

      // SRI Box (Right)
      doc.roundedRect(290, 30, 275, 140, 6).lineWidth(1).strokeColor('#cbd5e1').stroke();
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(title, 305, 38);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0284c7').text(`No. ${numDoc}`, 305, 52);

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(`NÚMERO DE AUTORIZACIÓN:`, 305, 68);
      doc.fontSize(7.5).font('Helvetica-Bold').text(retention.numeroAutorizacion || claveAcceso, 305, 78, { width: 250 });

      doc.fontSize(8).font('Helvetica').text(`FECHA Y HORA DE AUTORIZACIÓN: ${retention.fechaAutorizacion || retention.fechaEmision}`, 305, 93);
      doc.text(`AMBIENTE: ${ambienteStr}`, 305, 105);
      doc.text(`EMISIÓN: NORMAL`, 305, 117);
      doc.text(`CLAVE DE ACCESO:`, 305, 129);
      doc.fontSize(7.5).font('Helvetica-Bold').text(claveAcceso, 305, 139, { width: 250 });

      // --- Sujeto Retenido Info Box ---
      const clientY = 180;
      doc.roundedRect(30, clientY, 535, 60, 4).lineWidth(0.8).strokeColor('#e2e8f0').stroke();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text(`Razón Social / Sujeto Retenido: `, 38, clientY + 8, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(retention.proveedor?.nombre || 'PROVEEDOR');

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Identificación: `, 38, clientY + 23, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(retention.proveedor?.identificacion || '');

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Fecha Emisión: `, 320, clientY + 23, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(retention.fechaEmision);

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Dirección: `, 38, clientY + 38, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(retention.proveedor?.direccion || 'S/N');

      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`Período Fiscal: `, 320, clientY + 38, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(retention.periodoFiscal || `${retention.fechaEmision.split('-')[1]}/${retention.fechaEmision.split('-')[0]}`);

      // --- Impuestos Retenidos Table ---
      let tableY = clientY + 70;
      doc.rect(30, tableY, 535, 18).fill('#f1f5f9');
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text('Comprobante', 35, tableY + 5, { width: 85 });
      doc.text('Número Doc.', 125, tableY + 5, { width: 105 });
      doc.text('Impuesto', 235, tableY + 5, { width: 70 });
      doc.text('Base Imponible', 310, tableY + 5, { width: 75, align: 'right' });
      doc.text('% Ret', 390, tableY + 5, { width: 50, align: 'right' });
      doc.text('Valor Retenido', 445, tableY + 5, { width: 115, align: 'right' });

      tableY += 18;
      doc.font('Helvetica').fontSize(8).fillColor('#334155');

      (retention.impuestos || []).forEach((imp, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(30, tableY, 535, 16).fill(bg);
        doc.fillColor('#334155');
        const docTipo = imp.tipoComprobanteSustento === '01' ? 'Factura' : 'Doc Sustento';
        const impNom = imp.codigo === '1' ? 'RENTA' : (imp.codigo === '2' ? 'IVA' : 'ISD');
        doc.text(docTipo, 35, tableY + 4, { width: 85 });
        doc.text(imp.numDocSustento || retention.sustento?.numComprobante || '001-001-000000001', 125, tableY + 4, { width: 105 });
        doc.text(`${impNom} (${imp.codigoRetencion})`, 235, tableY + 4, { width: 70 });
        doc.text(`${Number(imp.baseImponible).toFixed(2)}`, 310, tableY + 4, { width: 75, align: 'right' });
        doc.text(`${Number(imp.porcentajeRetener).toFixed(2)}%`, 390, tableY + 4, { width: 50, align: 'right' });
        doc.text(`${Number(imp.valorRetenido).toFixed(2)}`, 445, tableY + 4, { width: 115, align: 'right' });
        tableY += 16;
      });

      tableY += 10;

      // --- Info Adicional (Left) & Total Retenido (Right) ---
      const totalBoxY = tableY;
      doc.roundedRect(30, totalBoxY, 300, 90, 4).lineWidth(0.8).strokeColor('#e2e8f0').stroke();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text('INFORMACIÓN ADICIONAL', 38, totalBoxY + 8);
      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      let infoY = totalBoxY + 22;
      doc.text(`Email Proveedor: ${retention.proveedor?.correo || 'N/A'}`, 38, infoY);
      infoY += 12;
      doc.text(`Teléfono: ${retention.proveedor?.telefono || 'N/A'}`, 38, infoY);
      infoY += 12;

      if (retention.infoAdicional && retention.infoAdicional.length > 0) {
        retention.infoAdicional.forEach(info => {
          if (info.nombre && info.valor) {
            doc.text(`${info.nombre}: ${info.valor}`, 38, infoY, { width: 280, height: 10, ellipsis: true });
            infoY += 12;
          }
        });
      }

      const totalsX = 340;
      doc.roundedRect(totalsX, totalBoxY, 225, 90, 4).lineWidth(0.8).strokeColor('#cbd5e1').stroke();
      let totY = totalBoxY + 16;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text('TOTAL RETENIDO', totalsX + 10, totY, { width: 110 });
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0284c7');
      doc.text(`${Number(retention.totalRetenido || 0).toFixed(2)}`, totalsX + 120, totY - 1, { width: 95, align: 'right' });

      // Footer message
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b').text('Comprobante de Retención Electrónico emitido de conformidad con la normativa del SRI Ecuador. ORIONNX', 30, 780, { align: 'center', width: 535 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
