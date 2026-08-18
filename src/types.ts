export type TipoIdentificacion = '04' | '05' | '06' | '07' | '08';
export type TipoIva = '0' | '2' | '4' | '6' | '7'; // 0 = 0%, 2 = 12%, 4 = 15%, 6 = No Objeto, 7 = Exento
export type RegimenTributario = 'RIMPE_POPULAR' | 'RIMPE_EMPRENDEDOR' | 'GENERAL' | 'OTRO' | '';
export type EstadoComprobante = 'Borrador' | 'Firmado' | 'Enviado' | 'Autorizado' | 'No Autorizado' | 'Devuelto';

export interface EmitterConfig {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  dirMatriz: string;
  dirEstablecimiento: string;
  codEstablecimiento: string; // 3 dígitos (e.g., '001')
  codPuntoEmision: string;    // 3 dígitos (e.g., '001')
  obligadoContabilidad: boolean;
  contribuyenteEspecial?: string;
  agenteRetencion?: string;
  regimen: RegimenTributario;
  ambiente: '1' | '2'; // '1' = Pruebas, '2' = Producción
  p12Nombre?: string;
  p12FirmaB64?: string; // Firma electrónica .p12 codificada en Base64
  p12Password?: string;
  isDemoMode: boolean; // Si está activo el simulador interactivo
  logoB64?: string; // Logotipo de la empresa en Base64
  correo?: string; // Correo electrónico del emisor
  telefono?: string; // Teléfono del emisor
  ultimoSecuencialFactura?: string; // Siguiente secuencial de factura a emitir (9 dígitos)
  smtpHost?: string; // Servidor SMTP (ej: smtp.gmail.com)
  smtpPort?: string | number; // Puerto SMTP (ej: 587 o 465)
  smtpUser?: string; // Usuario / Correo SMTP
  smtpPass?: string; // Contraseña o App Password
  smtpFrom?: string; // Remitente (ej: Facturación <correo@dominio.com>)
  usuarioCorreo?: string;
  empresaRuc?: string;
  empresaNombre?: string;
}

export interface Client {
  id: string;
  tipoIdentificacion: TipoIdentificacion;
  identificacion: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  usuarioCorreo?: string;
  empresaRuc?: string;
  empresaNombre?: string;
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  ivaTipo: TipoIva;
  descuentoDefault: number;
  usuarioCorreo?: string;
  empresaRuc?: string;
  empresaNombre?: string;
}

export interface InvoiceDetail {
  id: string;
  producto: Product;
  cantidad: number;
  descuento: number;
  subtotal: number;
  ivaCalculado: number;
  total: number;
}

export interface AdicionalInfo {
  id: string;
  nombre: string;
  valor: string;
}

export interface Invoice {
  id: string;
  secuencial: string; // 9 dígitos (e.g., '000000001')
  fechaEmision: string; // YYYY-MM-DD
  cliente: Client;
  detalles: InvoiceDetail[];
  formaPago: string; // Código SRI (e.g., '01', '19', '20')
  plazo: number;
  unidadTiempo: 'dias' | 'meses' | 'anios';
  claveAcceso: string;
  xml?: string;
  xmlFirmado?: string;
  estado: EstadoComprobante;
  mensajesSRI: SriMessage[];
  fechaAutorizacion?: string;
  numeroAutorizacion?: string;
  infoAdicional: AdicionalInfo[];
  resumenImpuestos: {
    base0: number;
    baseIva: number;
    valorIva: number;
    subtotal: number;
    descuento: number;
    total: number;
  };
  creadorNombre?: string; // Nombre del usuario que generó la factura
  usuarioCorreo?: string;
  empresaRuc?: string;
  empresaNombre?: string;
}

export interface CreditNoteDetail {
  id: string;
  producto: Product;
  cantidad: number;
  descuento: number;
  subtotal: number;
  ivaCalculado: number;
  total: number;
}

export interface CreditNote {
  id: string;
  secuencial: string; // 9 dígitos (e.g., '000000001')
  fechaEmision: string; // YYYY-MM-DD
  facturaModificadaSecuencial: string; // e.g., '001-001-000000012'
  facturaModificadaClaveAcceso: string; // Clave de acceso original de 49 dígitos
  fechaEmisionModificado: string; // Fecha de la factura que se modifica
  razonModificacion: string;
  cliente: Client;
  detalles: CreditNoteDetail[];
  claveAcceso: string;
  xml?: string;
  xmlFirmado?: string;
  estado: EstadoComprobante;
  mensajesSRI: SriMessage[];
  fechaAutorizacion?: string;
  numeroAutorizacion?: string;
  infoAdicional: AdicionalInfo[];
  resumenImpuestos: {
    base0: number;
    baseIva: number;
    valorIva: number;
    subtotal: number;
    descuento: number;
    total: number;
  };
  creadorNombre?: string; // Nombre del usuario que generó el comprobante
  usuarioCorreo?: string;
  empresaRuc?: string;
  empresaNombre?: string;
}

export interface SriMessage {
  mensaje: string;
  informacionAdicional?: string;
  tipo: 'ERROR' | 'INFORMATIVO';
  identificador?: string;
}

// Simple User and Role Management Systems
export type UserRole = 'ADMIN' | 'USER' | 'SUPERADMIN';

export interface PortalUser {
  id: string;
  correo: string;
  clave: string;
  role: UserRole;
  nombre?: string;
  fechaRegistro: string;
  isTemp?: boolean;
  empresaRuc?: string;
  empresaNombre?: string;
  creadorCorreo?: string;
}

export interface Invitation {
  id: string;
  correo: string;
  claveTemporal: string;
  role: UserRole;
  nombreInvitado?: string; // Nombre y Apellido completos
  fechaCreacion: string;
  estado: 'PENDIENTE' | 'ACEPTADA';
  empresaRuc?: string;
  empresaNombre?: string;
  creadorCorreo?: string;
}

export interface ActivityLog {
  id: string;
  usuarioCorreo: string;
  usuarioNombre: string;
  usuarioRol: UserRole;
  fecha: string;
  accion: string; // e.g. 'Inicio de Sesión', 'Emisión de Factura', etc.
  detalles: string;
  empresaRuc?: string;
  empresaNombre?: string;
}

export interface EmpresaTenant {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  adminCorreo: string;
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'VENCIDO';
  fechaInicio: string;
  fechaExpiracion: string;
  limiteComprobantes: number;
  limiteUsuarios: number;
  comprobantesEmitidos?: number;
  usuariosRegistrados?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProformaDetail {
  id: string;
  producto: Product;
  cantidad: number;
  precio: number;
  subtotal: number;
  ivaCalculado: number;
  total: number;
  nombrePersonalizado?: string;
}

export interface Proforma {
  id: string;
  secuencial: string;
  fechaEmision: string;
  cliente: {
    nombre: string;
    telefono: string;
    correo: string;
    direccion?: string;
    identificacion?: string;
    tipoIdentificacion?: string;
  };
  detalles: ProformaDetail[];
  resumenImpuestos: {
    subtotal: number;
    ivaPorcentaje: number;
    ivaValor: number;
    total: number;
  };
  informacionPago: string;
  notaDudas?: string;
  empresaNombre?: string;
  empresaDireccion?: string;
  empresaTelefono?: string;
  empresaCorreo?: string;
  ivaOptionLabel?: string;
  ivaOption?: string;
  templateId?: string;
  usuarioCorreo?: string;
  empresaRuc?: string;
}

// =========================================================================
// COMPROBANTES DE RETENCIÓN (SRI COMPROBANTE TIPO 07)
// =========================================================================
export type RetentionTaxType = '1' | '2' | '6'; // 1 = Renta, 2 = IVA, 6 = ISD

export interface RetentionTax {
  id: string;
  codigo: RetentionTaxType; // 1 = Renta, 2 = IVA, 6 = ISD
  codigoRetencion: string; // Ej: 303, 304, 312, 343, 3440, 701, 702, 703
  descripcion: string;
  baseImponible: number;
  porcentajeRetener: number; // Ej: 10, 8, 1.75, 2.75, 3, 30, 70, 100
  valorRetenido: number;
  tipoComprobanteSustento?: string; // Ej: 01 (Factura)
  numDocSustento?: string; // Ej: 001-001-000000123
  fechaEmisionDocSustento?: string;
}

export interface RetentionSustento {
  tipoComprobante: string; // '01' Factura, '03' Liq. Compra, '05' Nota Débito
  numComprobante: string; // 001-001-000000001
  fechaEmision: string; // YYYY-MM-DD
  numAutorizacion?: string; // 49 dígitos o 10/37 dígitos
  totalComprobante?: number;
  totalSinImpuestos?: number;
  importeTotal?: number;
}

export interface Retention {
  id: string;
  secuencial: string; // 9 dígitos (e.g., '000000001')
  fechaEmision: string; // YYYY-MM-DD
  periodoFiscal: string; // MM/YYYY (e.g. '08/2026')
  proveedor: Client; // Sujeto retenido
  sustento: RetentionSustento;
  impuestos: RetentionTax[];
  totalRetenido: number;
  claveAcceso: string;
  xml?: string;
  xmlFirmado?: string;
  estado: EstadoComprobante;
  mensajesSRI: SriMessage[];
  fechaAutorizacion?: string;
  numeroAutorizacion?: string;
  pdfUrl?: string; // URL en Bucket de Supabase
  xmlUrl?: string; // URL en Bucket de Supabase
  infoAdicional?: AdicionalInfo[];
  creadorNombre?: string;
  usuarioCorreo?: string;
  empresaRuc?: string;
  empresaNombre?: string;
  createdAt?: string;
}

