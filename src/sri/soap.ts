import https from 'https';
import crypto from 'crypto';
import { SriMessage } from '../types';

// SSL options for supporting legacy renegotiation on the SRI servers (required with OpenSSL 3 / Node.js 18+)
const SSL_OP_LEGACY_SERVER_CONNECT = crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT || 0x00000004;
const SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION = (crypto.constants as any).SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION || 0x00040000;

/**
 * Realiza una petición SOAP al SRI utilizando TLS v1.0/1.2 compatible con sus servidores legacy (resuelve ECONNRESET y fallos de fetch).
 * Incluye reintentos automáticos para lidiar con la inestabilidad de los servidores del SRI.
 */
async function soapRequest(urlStr: string, xmlBody: string, retriesRemaining = 3): Promise<string> {
  try {
    return await new Promise<string>((resolve, reject) => {
      try {
        const parsedUrl = new URL(urlStr);
        const options: https.RequestOptions = {
          method: 'POST',
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          path: parsedUrl.pathname + parsedUrl.search,
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': '',
            'Content-Length': Buffer.byteLength(xmlBody),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.1'
          },
          agent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: false, // Disabling keepAlive avoids using stale/reset sockets by SRI's load balancers
            minVersion: 'TLSv1',
            ciphers: 'DEFAULT:@SECLEVEL=1',
            secureOptions: SSL_OP_LEGACY_SERVER_CONNECT | SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
          }),
          timeout: 25000
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(data);
          });
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.on('timeout', () => {
          req.destroy(new Error('Timeout de conexión de 25 segundos superado al conectar con el SRI'));
        });

        req.write(xmlBody);
        req.end();
      } catch (e) {
        reject(e);
      }
    });
  } catch (err: any) {
    if (retriesRemaining > 0) {
      console.warn(`soapRequest falló (${err.message || err}). Reintentando en 1.5s... (${retriesRemaining} intentos restantes).`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return soapRequest(urlStr, xmlBody, retriesRemaining - 1);
    }
    throw err;
  }
}

/**
 * SRI SOAP Client for communicating with Ecuador's tax authority web services.
 * Features both fully simulated mode (Demo) and real SOAP requests to SRI testing / production environments.
 */

const RECEPCION_URL_SANDBOX = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
const RECEPCION_URL_PRODUCTION = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';

const AUTORIZACION_URL_SANDBOX = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
const AUTORIZACION_URL_PRODUCTION = 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';

export interface RecepcionResponse {
  estado: 'RECIBIDA' | 'DEVUELTA' | 'ERROR_CONEXION';
  mensajes: SriMessage[];
}

export interface AutorizacionResponse {
  estado: 'AUTORIZADO' | 'NO AUTORIZADO' | 'PENDIENTE' | 'ERROR_CONEXION';
  fechaAutorizacion?: string;
  numeroAutorizacion?: string;
  mensajes: SriMessage[];
}

/**
 * Extracts string content inside a specific XML tag using regex
 */
function extractTagContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extracts multiple identical tags
 */
function extractAllTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'gi');
  const matches = xml.match(regex) || [];
  return matches.map(m => {
    const innerRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
    const innerMatch = m.match(innerRegex);
    return innerMatch ? innerMatch[1].trim() : '';
  });
}

/**
 * Sends a signed XML electronic document to the SRI Recepción web service
 */
export async function enviarComprobanteSri(
  signedXml: string,
  claveAcceso: string,
  ambiente: '1' | '2',
  isDemo: boolean = true
): Promise<RecepcionResponse> {
  if (isDemo) {
    // Simular recepción exitosa o lanzar un error controlado si falta algún campo crítico
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate natural valid check
    if (!claveAcceso || claveAcceso.length !== 49) {
      return {
        estado: 'DEVUELTA',
        mensajes: [
          {
            mensaje: 'CLAVE DE ACCESO CON TAMAÑO INCORRECTO',
            informacionAdicional: 'La clave de acceso del comprobante debe tener exactamente 49 caracteres numéricos.',
            tipo: 'ERROR',
            identificador: '35'
          }
        ]
      };
    }
    
    // Default success simulation
    return {
      estado: 'RECIBIDA',
      mensajes: []
    };
  }

  // Real SOAP Request to SRI
  const url = ambiente === '1' ? RECEPCION_URL_SANDBOX : RECEPCION_URL_PRODUCTION;
  const base64Xml = Buffer.from(signedXml, 'utf-8').toString('base64');
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:validarComprobante>
         <xml>${base64Xml}</xml>
      </ec:validarComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const xmlText = await soapRequest(url, soapEnvelope);
    const estado = extractTagContent(xmlText, 'estado') as 'RECIBIDA' | 'DEVUELTA';
    
    const mensajes: SriMessage[] = [];
    if (estado === 'DEVUELTA') {
      const normalizedXml = xmlText.replace(/<mensaje[^>]*>([^<]*?)<\/mensaje>/gi, '<textoMensaje>$1</textoMensaje>');
      const mensajeNodes = extractAllTags(normalizedXml, 'mensaje');
      for (const node of mensajeNodes) {
        mensajes.push({
          mensaje: extractTagContent(node, 'textoMensaje') || 'Error en validación',
          informacionAdicional: extractTagContent(node, 'informacionAdicional') || undefined,
          tipo: 'ERROR',
          identificador: extractTagContent(node, 'identificador') || undefined
        });
      }
    }

    return {
      estado: estado || 'DEVUELTA',
      mensajes
    };
  } catch (err: any) {
    console.error('SOAP Recepcion error:', err);
    return {
      estado: 'ERROR_CONEXION',
      mensajes: [
        {
          mensaje: 'Error de Red con el Web Service del SRI',
          informacionAdicional: `No se pudo establecer conexión con el SRI (${url}). Detalle: ${err.message || err}`,
          tipo: 'ERROR'
        }
      ]
    };
  }
}

/**
 * Consults the SRI Autorización web service for the status of an electronic document
 */
export async function consultarAutorizacionSri(
  claveAcceso: string,
  ambiente: '1' | '2',
  isDemo: boolean = true
): Promise<AutorizacionResponse> {
  if (isDemo) {
    // Simular autorización exitosa
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const now = new Date();
    // Format timestamp in Ecuador timezone (GMT-5)
    const formattedDate = now.toISOString().replace('Z', '-05:00');

    // Simulate failure for specific demo situations if desired, but default to authorized
    return {
      estado: 'AUTORIZADO',
      fechaAutorizacion: formattedDate,
      numeroAutorizacion: claveAcceso,
      mensajes: [
        {
          mensaje: 'COMPROBANTE AUTORIZADO (MODO SIMULACION)',
          tipo: 'INFORMATIVO'
        }
      ]
    };
  }

  // Real SOAP Request to SRI
  const url = ambiente === '1' ? AUTORIZACION_URL_SANDBOX : AUTORIZACION_URL_PRODUCTION;
  
  const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:autorizacionComprobante>
         <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
      </ec:autorizacionComprobante>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const xmlText = await soapRequest(url, soapEnvelope);
    
    // Look for the first <autorizacion> block
    const autorizacionNode = extractTagContent(xmlText, 'autorizacion');
    if (!autorizacionNode) {
      // If there are no authorizations yet, the invoice is probably still in queue
      return {
        estado: 'PENDIENTE',
        mensajes: [{ mensaje: 'El comprobante aún no ha sido procesado por el lote.', tipo: 'INFORMATIVO' }]
      };
    }

    const estado = extractTagContent(autorizacionNode, 'estado') as 'AUTORIZADO' | 'NO AUTORIZADO';
    const fechaAutorizacion = extractTagContent(autorizacionNode, 'fechaAutorizacion');
    const numeroAutorizacion = extractTagContent(autorizacionNode, 'numeroAutorizacion');

    const mensajes: SriMessage[] = [];
    const normalizedAutorizacionNode = autorizacionNode.replace(/<mensaje[^>]*>([^<]*?)<\/mensaje>/gi, '<textoMensaje>$1</textoMensaje>');
    const mensajeNodes = extractAllTags(normalizedAutorizacionNode, 'mensaje');
    for (const node of mensajeNodes) {
      mensajes.push({
        mensaje: extractTagContent(node, 'textoMensaje') || 'Aviso del SRI',
        informacionAdicional: extractTagContent(node, 'informacionAdicional') || undefined,
        tipo: extractTagContent(node, 'tipo') === 'INFORMATIVO' ? 'INFORMATIVO' : 'ERROR',
        identificador: extractTagContent(node, 'identificador') || undefined
      });
    }

    return {
      estado: estado || 'PENDIENTE',
      fechaAutorizacion,
      numeroAutorizacion,
      mensajes
    };
  } catch (err: any) {
    console.error('SOAP Autorizacion error:', err);
    return {
      estado: 'ERROR_CONEXION',
      mensajes: [
        {
          mensaje: 'Error de Red con el Web Service del SRI de Autorización',
          informacionAdicional: `No se pudo conectar con el SRI para consultar autorización: ${err.message || err}`,
          tipo: 'ERROR'
        }
      ]
    };
  }
}
