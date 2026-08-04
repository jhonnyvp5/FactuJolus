import express from 'express';
import { getCertificateInfo, signXmlDocument } from '../src/sri/signer';
import { enviarComprobanteSri, consultarAutorizacionSri } from '../src/sri/soap';
import { sendInvoiceEmail } from '../src/sri/emailService';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.post('/api/check-signature', (req, res) => {
  try {
    const { p12Base64, password } = req.body;
    if (!p12Base64 || !password) {
      return res.status(400).json({ status: 'error', message: 'Faltan parámetros p12Base64 o password.' });
    }
    const info = getCertificateInfo(p12Base64, password);
    res.json({ status: 'success', info });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message || String(err) });
  }
});

app.post('/api/sign-xml', (req, res) => {
  try {
    const { xmlContent, p12Base64, password, isDemo } = req.body;
    if (!xmlContent) {
      return res.status(400).json({ status: 'error', message: 'Falta parámetro de contenido XML.' });
    }
    const signedXml = signXmlDocument(xmlContent, p12Base64, password, isDemo === true);
    res.json({ status: 'success', signedXml });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message || String(err) });
  }
});

app.post('/api/send-sri', async (req, res) => {
  try {
    const { signedXml, claveAcceso, ambiente, isDemo } = req.body;
    if (!signedXml || !claveAcceso || !ambiente) {
      return res.status(400).json({ status: 'error', message: 'Faltan parámetros requeridos: signedXml, claveAcceso, ambiente.' });
    }
    const result = await enviarComprobanteSri(signedXml, claveAcceso, ambiente, isDemo === true);
    res.json({ status: 'success', data: result });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message || String(err) });
  }
});

app.post('/api/authorize-sri', async (req, res) => {
  try {
    const { claveAcceso, ambiente, isDemo } = req.body;
    if (!claveAcceso || !ambiente) {
      return res.status(400).json({ status: 'error', message: 'Faltan parámetros requeridos: claveAcceso, ambiente.' });
    }
    const result = await consultarAutorizacionSri(claveAcceso, ambiente, isDemo === true);
    res.json({ status: 'success', data: result });
  } catch (err: any) {
    res.status(400).json({ status: 'error', message: err.message || String(err) });
  }
});

app.post('/api/send-invoice-email', async (req, res) => {
  try {
    const { invoice, config, recipientEmail } = req.body;
    if (!invoice) {
      return res.status(400).json({ status: 'error', message: 'Falta el objeto de la factura para enviar por correo.' });
    }
    const result = await sendInvoiceEmail(invoice, config || {}, recipientEmail);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || String(err), emailSent: false });
  }
});

app.get('/api/sri-lookup', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Identificación requerida.' });
    }
    const cleanId = id.trim().replace(/[^\d]/g, '');
    const tipoIdentificacion = cleanId.length === 13 ? '04' : '05';
    return res.json({
      status: 'success',
      client: {
        id: 'c-auto-' + cleanId,
        identificacion: cleanId,
        tipoIdentificacion,
        nombre: `CONTRIBUYENTE ${cleanId}`,
        direccion: 'Ecuador',
        telefono: '0999999999',
        correo: `${cleanId}@sri-ecuador.com`
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default app;
