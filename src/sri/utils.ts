/**
 * SRI Utility functions for Ecuador Electronic Invoicing
 */

// Format sequential number to 9 digits with padding
export function formatSequential(num: number | string): string {
  const str = String(num).trim();
  return str.padStart(9, '0');
}

// Compute Modulo 11 Check Digit for SRI Clave de Acceso
export function calculateModulo11(keyWithoutCheckDigit: string): number {
  let sum = 0;
  let factor = 2;
  
  // Calculate weights right-to-left
  for (let i = keyWithoutCheckDigit.length - 1; i >= 0; i--) {
    const digit = parseInt(keyWithoutCheckDigit[i], 10);
    sum += digit * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  
  const remainder = sum % 11;
  const result = 11 - remainder;
  
  if (result === 11) {
    return 0;
  } else if (result === 10) {
    return 1;
  } else {
    return result;
  }
}

/**
 * Generate 49-digit SRI Access Key (Clave de Acceso)
 * @param date YYYY-MM-DD
 * @param docType '01' (Factura), '04' (Nota de Crédito)
 * @param ruc 13 digit RUC
 * @param environment '1' (Pruebas), '2' (Producción)
 * @param establishment '001' (3 digits)
 * @param emissionPoint '001' (3 digits)
 * @param sequential '000000001' (9 digits)
 * @param numericCode '12345678' (8 digits)
 * @param emissionType '1' (Emisión Normal)
 */
export function generateClaveAcceso({
  fechaEmision,
  tipoComprobante,
  ruc,
  ambiente,
  establecimiento,
  puntoEmision,
  secuencial,
  codigoNumerico = '12345678',
  tipoEmision = '1'
}: {
  fechaEmision: string; // YYYY-MM-DD
  tipoComprobante: '01' | '04';
  ruc: string;
  ambiente: '1' | '2';
  establecimiento: string;
  puntoEmision: string;
  secuencial: string;
  codigoNumerico?: string;
  tipoEmision?: string;
}): string {
  // 1. Format date as ddmmyyyy
  const parts = fechaEmision.split('-');
  if (parts.length !== 3) {
    throw new Error('Fecha debe tener formato YYYY-MM-DD');
  }
  const dateFormatted = `${parts[2]}${parts[1]}${parts[0]}`; // DDMMYYYY

  // 2. Build 48 digits key
  const serie = establecerSerie(establecimiento, puntoEmision);
  const key48 = [
    dateFormatted,
    tipoComprobante,
    (ruc || '1792451083001').toString().trim().padStart(13, '0'),
    ambiente || '1',
    serie,
    secuencial.padStart(9, '0'),
    codigoNumerico.padStart(8, '0'),
    tipoEmision
  ].join('');

  if (key48.length !== 48) {
    throw new Error(`Error generando clave de acceso de 48 digitos (talla actual: ${key48.length})`);
  }

  // 3. Compute check digit
  const checkDigit = calculateModulo11(key48);

  return `${key48}${checkDigit}`;
}

export function establecerSerie(establecimiento?: string, puntoEmision?: string): string {
  const estab = (establecimiento || '001').toString().trim().padStart(3, '0');
  const pto = (puntoEmision || '001').toString().trim().padStart(3, '0');
  return `${estab}${pto}`;
}

// Validate Ecuadorian Identification (Cédula de Identidad)
export function validateCedula(cedula: string): boolean {
  const str = String(cedula).trim();
  if (str.length !== 10) return false;
  
  if (!/^\d+$/.test(str)) return false;

  const province = parseInt(str.substring(0, 2), 10);
  if (province < 1 || province > 24) {
    // Province code check (Ecuador has 24 provinces + code 30 for foreigners registered domestically)
    if (province !== 30) {
      return false;
    }
  }

  const thirdDigit = parseInt(str[2], 10);
  if (thirdDigit >= 6) return false; // Cedula third digit must be < 6

  // Modulo 10 algorithm
  let sum = 0;
  const coefs = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  
  for (let i = 0; i < 9; i++) {
    let prod = parseInt(str[i], 10) * coefs[i];
    if (prod >= 10) prod -= 9;
    sum += prod;
  }

  const checkDigit = parseInt(str[9], 10);
  const calculated = (10 - (sum % 10)) % 10;

  return calculated === checkDigit;
}

// Validate Ecuadorian RUC
export function validateRuc(ruc: string): boolean {
  const str = String(ruc).trim();
  if (str.length !== 13) return false;
  if (!/^\d+$/.test(str)) return false;

  // Last 3 digits must be '001', '002', etc. (usually, must end with non-zero third-to-last digit or general suffix)
  const suffix = str.substring(10, 13);
  if (parseInt(suffix, 10) < 1) return false;

  const cedulaPart = str.substring(0, 10);
  const thirdDigit = parseInt(str[2], 10);

  // If third digit is < 6, it is a natural person (checks out via traditional Cedula check)
  if (thirdDigit < 6) {
    return validateCedula(cedulaPart);
  }

  // If third digit is 9: Private Corporate Societies
  if (thirdDigit === 9) {
    const coefs = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(str[i], 10) * coefs[i];
    }
    const remainder = sum % 11;
    const checkDigit = parseInt(str[9], 10);
    const calculated = remainder === 0 ? 0 : 11 - remainder;
    return calculated === checkDigit;
  }

  // If third digit is 6: Public/State Institutions
  if (thirdDigit === 6) {
    const coefs = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(str[i], 10) * coefs[i];
    }
    const remainder = sum % 11;
    const checkDigit = parseInt(str[8], 10);
    const calculated = remainder === 0 ? 0 : 11 - remainder;
    return calculated === checkDigit;
  }

  return false;
}

export const METODOS_PAGO = [
  { code: '01', name: '01 - SIN UTILIZACIÓN DEL SISTEMA FINANCIERO' },
  { code: '16', name: '16 - TARJETA DE DÉBITO' },
  { code: '17', name: '17 - DINERO ELECTRÓNICO' },
  { code: '18', name: '18 - TARJETA DE PREPAGO' },
  { code: '19', name: '19 - TARJETA DE CRÉDITO' },
  { code: '20', name: '20 - OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO' },
  { code: '15', name: '15 - COMPENSACIÓN DE DEUDAS' },
  { code: '21', name: '21 - ENDOSO DE TÍTULOS' }
];

export const TIPO_DOCUMENTOS_COMPLEMENTARIOS = {
  '01': 'Factura',
  '04': 'Nota de Crédito',
  '05': 'Nota de Débito',
  '06': 'Guía de Remisión',
  '07': 'Comprobante de Retención'
};

export const IVA_TARIFAS = {
  '0': { label: '0% (Exento/Servicios/Exportación)', rate: 0, codeSrl: '0' },
  '2': { label: '12% (Tarifa Estándar)', rate: 0.12, codeSrl: '2' },
  '4': { label: '15% (Nueva Tarifa Activa)', rate: 0.15, codeSrl: '4' },
  '6': { label: 'No Objeto de Impuesto', rate: 0, codeSrl: '6' },
  '7': { label: 'Exento de IVA', rate: 0, codeSrl: '7' }
};

export const REGIMENES = [
  { code: 'RIMPE_POPULAR', label: 'Negocio Popular - Régimen RIMPE' },
  { code: 'RIMPE_EMPRENDEDOR', label: 'Régimen RIMPE Emprendedor' },
  { code: 'GENERAL', label: 'Régimen General' },
  { code: 'OTRO', label: 'Otros' }
];

export const IDENTIFICACIONES = [
  { code: '04', label: 'RUC' },
  { code: '05', label: 'Cédula' },
  { code: '06', label: 'Pasaporte' },
  { code: '07', label: 'Consumidor Final' },
  { code: '08', label: 'Identificación Exterior' }
];
