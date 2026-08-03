import forge from 'node-forge';
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
    let cert: any = null;
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBagList = certBags[forge.pki.oids.certBag];
    if (certBagList && certBagList.length > 0) {
      cert = certBagList[0].cert;
    }

    if (!cert) {
      // Fallback: search all bags in p12
      const bagsObj = (p12 as any).bags || {};
      for (const bagType in bagsObj) {
        const bagArray = bagsObj[bagType];
        if (bagArray) {
          for (const bag of bagArray) {
            if (bag.cert) {
              cert = bag.cert;
              break;
            }
          }
        }
        if (cert) break;
      }
    }

    if (!cert) {
      throw new Error('No se encontraron certificados válidos dentro del archivo .p12');
    }

    const cnAttr = cert.subject.attributes.find((attr: any) => attr.name === 'commonName' || attr.type === '2.5.4.3');
    const oAttr = cert.subject.attributes.find((attr: any) => attr.name === 'organizationName' || attr.type === '2.5.4.10');
    const givenAttr = cert.subject.attributes.find((attr: any) => attr.name === 'givenName' || attr.type === '2.5.4.42');
    const surAttr = cert.subject.attributes.find((attr: any) => attr.name === 'surname' || attr.type === '2.5.4.4');
    const issuerAttr = cert.issuer.attributes.find((attr: any) => attr.name === 'commonName' || attr.type === '2.5.4.3' || attr.name === 'organizationName');

    let subjectName = 'Propietario de la Firma';
    if (cnAttr?.value) {
      subjectName = String(cnAttr.value);
    } else if (givenAttr?.value || surAttr?.value) {
      subjectName = `${givenAttr?.value || ''} ${surAttr?.value || ''}`.trim();
    } else if (oAttr?.value) {
      subjectName = String(oAttr.value);
    }

    return {
      subject: subjectName,
      issuer: issuerAttr ? String(issuerAttr.value) : 'Entidad Certificadora Ecuador',
      validFrom: cert.validity.notBefore.toISOString(),
      validTo: cert.validity.notAfter.toISOString(),
      serialNumber: cert.serialNumber || '0'
    };
  } catch (err: any) {
    if (err.message && err.message.includes('No se encontraron certificados')) {
      throw err;
    }
    throw new Error(`Contraseña o archivo .p12 incorrecto: ${err.message || err}`);
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
    const md1 = forge.md.sha1.create();
    md1.update(xmlContent, 'utf8');
    const mockHash = forge.util.encode64(md1.digest().getBytes());

    const md2 = forge.md.sha1.create();
    md2.update(mockHash + 'SALT', 'utf8');
    const mockSignature = md2.digest().toHex().substring(0, 128);
    
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
