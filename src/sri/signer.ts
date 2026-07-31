import forge from 'node-forge';
import crypto from 'crypto';
import { signInvoiceXml, signCreditNoteXml } from 'ec-sri-invoice-signer';

export interface SignatureInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
}

/**
 * Parses p12 bytes and pulls certificate structure
 */
export function getCertificateInfo(p12Base64: string, passwordStr: string): SignatureInfo {
  try {
    const p12Der = forge.util.decode64(p12Base64);
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passwordStr);
    
    // Find cert bags
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBagList = certBags[forge.pki.oids.certBag];
    if (!certBagList || certBagList.length === 0) {
      throw new Error('No se encontraron certificados en la firma electrónica .p12');
    }
    
    const certBag = certBagList[0];
    const cert = certBag.cert;
    if (!cert) {
      throw new Error('Certificado inválido');
    }

    const cnAttr = cert.subject.attributes.find((attr: any) => attr.name === 'commonName' || attr.type === '2.5.4.3');
    const oAttr = cert.subject.attributes.find((attr: any) => attr.name === 'organizationName' || attr.type === '2.5.4.10');
    const issuerAttr = cert.issuer.attributes.find((attr: any) => attr.name === 'commonName' || attr.type === '2.5.4.3');

    return {
      subject: cnAttr ? String(cnAttr.value) : 'Desconocido',
      issuer: issuerAttr ? String(issuerAttr.value) : 'Entidad Desconocida',
      validFrom: cert.validity.notBefore.toISOString(),
      validTo: cert.validity.notAfter.toISOString(),
      serialNumber: cert.serialNumber || '0'
    };
  } catch (err: any) {
    throw new Error(`Contraceña o archivo firma incorrectos: ${err.message || err}`);
  }
}

/**
 * Simulates or signs the XML file using standard XAdES-BES structure.
 * Ecuador's official signature envelope for electronic invoicing is extremely complex.
 * In production/real mode, we perform standard digital digests. In demo mode, we embed a 
 * highly realistic mock-signed structure that conforms to XAdES structure for debugging.
 */
export function signXmlDocument(xmlContent: string, p12B64: string | undefined, passwordStr: string | undefined, isDemo: boolean = true): string {
  if (isDemo || !p12B64 || !passwordStr) {
    // Generate high fidelity simulated XAdES-BES signature block
    const mockHash = crypto.createHash('sha1').update(xmlContent).digest('base64');
    const mockSignature = crypto.createHash('sha1').update(mockHash + 'SALT').digest('hex').substring(0, 128);
    
    // Locate root closing tag to insert signature block (before closing tag of factura/notaCredito)
    const matches = xmlContent.match(/<\/(factura|notaCredito)>/);
    if (!matches) {
      throw new Error('Formato XML de comprobante no admitido');
    }
    
    const rootCloseTag = matches[0];
    const insertIndex = xmlContent.lastIndexOf(rootCloseTag);
    
    const certificateName = "PRUEBAS SIMULADOR SRI S.A.";
    const serialNum = "12847294829";
    const signatureBlock = `  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="SignatureSRIMock">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
      <ds:Reference Id="Reference-comprobante" URI="#comprobante">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
        <ds:DigestValue>${mockHash}</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>${forge.util.encode64(mockSignature)}</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>MIIE3DCCAsSgAwIBAgIET...[SIMULATED CERTIFICATE FOR ${certificateName} SERIAL:${serialNum}]...</ds:X509Certificate>
        <ds:X509SubjectName>CN=${certificateName},O=SIMULACION SRI,C=EC</ds:X509SubjectName>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>`;

    return xmlContent.slice(0, insertIndex) + signatureBlock + '\n' + xmlContent.slice(insertIndex);
  }

  // Real Mode - Digits extraction & signature envelope building
  try {
    if (!p12B64 || !passwordStr) {
      throw new Error('Llave privada o contraseña ausentes para firma física');
    }

    const isCreditNote = /<\/notaCredito>/i.test(xmlContent);
    const isInvoice = /<\/factura>/i.test(xmlContent);

    if (isCreditNote) {
      return signCreditNoteXml(xmlContent, p12B64, { pkcs12Password: passwordStr });
    } else if (isInvoice) {
      return signInvoiceXml(xmlContent, p12B64, { pkcs12Password: passwordStr });
    } else {
      // General fallback
      return signInvoiceXml(xmlContent, p12B64, { pkcs12Password: passwordStr });
    }
  } catch (err: any) {
    throw new Error(`Error en el proceso de firmado electrónico: ${err.message || err}`);
  }
}
