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
  p12ValidoDesde?: string; // Fecha ISO de inicio de vigencia del certificado
  p12ValidoHasta?: string; // Fecha ISO de expiración del certificado
  validoDesde?: string;    // Alias para vigencia inicio
  validoHasta?: string;    // Alias para vigencia fin
  p12Subject?: string;     // Titular / Propietario del certificado
  p12Issuer?: string;      // Entidad emisora certificada
  p12SerialNumber?: string;// Número de serie del certificado digital
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

export interface TenantModulePermissions {
  invoices?: {
    enabled: boolean;
    canCreate: boolean;
    canExportRide: boolean;
    canSendEmail: boolean;
    canVoid: boolean;
  };
  creditNotes?: {
    enabled: boolean;
    canCreate: boolean;
    canExportRide: boolean;
  };
  retentions?: {
    enabled: boolean;
    canCreate: boolean;
    canExportRide: boolean;
  };
  proformas?: {
    enabled: boolean;
    canCreate: boolean;
    canConvertToInvoice: boolean;
    canExportPdf: boolean;
  };
  products?: {
    enabled: boolean;
    canCreate: boolean;
    canImportExport: boolean;
  };
  clients?: {
    enabled: boolean;
    canCreate: boolean;
    canSearchSri: boolean;
  };
  users?: {
    enabled: boolean;
    canManageRoles: boolean;
  };
  sriSettings?: {
    enabled: boolean;
    canUploadSignature: boolean;
    canChangeEnvironment: boolean;
  };
}

export type CustomizerSubTabKey = 
  | 'layout' 
  | 'screens' 
  | 'texts' 
  | 'theme' 
  | 'containers' 
  | 'plans' 
  | 'code' 
  | 'identity' 
  | 'banners' 
  | 'slides' 
  | 'news' 
  | 'social' 
  | 'modules';

export interface TenantFeaturePermissions {
  allowedLayouts?: ('topbar-classic' | 'sidebar-left' | 'sidebar-right' | 'compact-dock' | 'floating-island')[];
  canCustomizeTheme?: boolean;
  canCustomizeMenu?: boolean;
  canUseGroups?: boolean;
  allowedCustomizerSubtabs?: CustomizerSubTabKey[];
  modules?: TenantModulePermissions;
  customNotes?: string;
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
  featurePermissions?: TenantFeaturePermissions;
  plan?: string;
  vigencia?: string;
  logoUrl?: string;
  colorPrimario?: string;
  ambienteSri?: string;
  establecimiento?: string;
  puntoEmision?: string;
  secuencialFactura?: number;
  secuencialRetencion?: number;
  secuencialNotaCredito?: number;
  secuencialProforma?: number;
  obligadoContabilidad?: boolean;
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

// =========================================================================
// SUPERADMIN PLATFORM CUSTOMIZATION & BRANDING TYPES
// =========================================================================

export interface LoginSlideItem {
  id: string;
  url: string;
  tagline: string;
  alt: string;
  subtitle?: string;
  active: boolean;
}

export interface BillingPlanFeature {
  id: string;
  text: string;
  included: boolean;
}

export interface BillingPlanItem {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  invoiceLimit: number; // 0 for unlimited
  userLimit: number; // 0 for unlimited
  features: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  badge?: string;
  buttonText: string;
  active: boolean;
  colorScheme: 'blue' | 'purple' | 'emerald' | 'amber' | 'indigo' | 'rose';
  whatsappMessage?: string;
}

export interface CustomNewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' | 'rose';
  date: string;
  publishedAt: string;
  url: string;
  isHighlight?: boolean;
  source?: string;
  active?: boolean;
}

export interface SocialLinksConfig {
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  twitterX?: string;
  telegram?: string;
  website?: string;
  email?: string;
  phone?: string;
}

export interface TopAnnouncementBanner {
  enabled: boolean;
  badgeText: string;
  badgeColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'sky';
  message: string;
  linkText?: string;
  linkUrl?: string;
  isDismissible: boolean;
  bgColor?: string;
}

export interface PromotionalBanner {
  enabled: boolean;
  title: string;
  subtitle: string;
  discountText?: string;
  buttonText: string;
  buttonUrl?: string;
  imageUrl?: string;
  gradientTheme: 'blue-indigo' | 'purple-indigo' | 'emerald-teal' | 'amber-orange' | 'rose-pink' | 'cyber-dark';
}

export interface ModuleVisibilityFlags {
  showSriNewsInLogin: boolean;
  showPlansInLogin: boolean;
  showPlansInApp: boolean;
  showTopAnnouncementBar: boolean;
  showPromotionalBanner: boolean;
  showSocialLinksInFooter: boolean;
  showSocialLinksInLogin: boolean;
  showSimulatorIndicator: boolean;
  allowPublicRegistration: boolean;
  showDemoButtons?: boolean;
}

export interface MenuGroup {
  id: string;
  name: string;
  iconName?: string;
  order: number;
  visible?: boolean;
  color?: string;
}

export interface CustomMenuItem {
  id: string;
  key: string;
  label: string;
  iconName: string;
  visible: boolean;
  order: number;
  badge?: string;
  isCustom?: boolean;
  customUrl?: string;
  openInNewTab?: boolean;
  requiredRole?: 'ALL' | 'ADMIN' | 'SUPERADMIN';
  groupId?: string; // Group ID to group items into dropdowns/accordions
}

export interface CustomWidgetMetric {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  iconName?: string;
  color?: string;
  trend?: string;
}

export interface CustomWidgetQuickAction {
  id: string;
  label: string;
  actionTab?: string;
  url?: string;
  iconName?: string;
  color?: string;
}

export interface CustomContainerWidget {
  id: string;
  title: string;
  subtitle?: string;
  type: 'hero-banner' | 'stat-metrics' | 'custom-html-code' | 'quick-actions' | 'plans-catalog' | 'info-card' | 'iframe-embed' | 'rich-text';
  columnSpan: 'col-12' | 'col-6' | 'col-4' | 'col-3' | 'col-8';
  order: number;
  visible: boolean;
  showInDashboard: boolean;
  showInLogin: boolean;
  style: {
    bgType: 'solid' | 'gradient' | 'glass' | 'card';
    bgColor?: string;
    gradient?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'glow';
    padding?: 'sm' | 'md' | 'lg' | 'xl';
  };
  content: {
    htmlCode?: string;
    iframeUrl?: string;
    iframeHeight?: number;
    heroTitle?: string;
    heroSubtitle?: string;
    heroButtonText?: string;
    heroButtonUrl?: string;
    heroBadge?: string;
    heroBgImage?: string;
    metrics?: CustomWidgetMetric[];
    quickActions?: CustomWidgetQuickAction[];
    richText?: string;
  };
}

export interface ScreenSectionItem {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  customTitle?: string;
  customHelp?: string;
}

export interface ScreenCustomBlock {
  id: string;
  title: string;
  type: 'notice' | 'html' | 'kpis' | 'actions' | 'faq' | 'embed';
  content: string;
  order: number;
  visible: boolean;
  columnSpan?: 'full' | 'half' | 'third';
  accentColor?: string;
}

export interface ScreenCustomizationConfig {
  screenId: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  iconName?: string;
  bannerAlert?: {
    enabled: boolean;
    type: 'info' | 'success' | 'warning' | 'purple' | 'rose';
    message: string;
    linkText?: string;
    linkUrl?: string;
  };
  sections?: ScreenSectionItem[];
  customBlocks?: ScreenCustomBlock[];
}

export interface SriWsEndpointsConfig {
  recepcionPruebas: string;
  autorizacionPruebas: string;
  recepcionProduccion: string;
  autorizacionProduccion: string;
}

export interface PlatformCustomizationSettings {
  id: string;
  updatedAt: string;
  updatedBy: string;

  // SRI Web Service Dynamic Endpoints (Configurable exclusively by SUPERADMIN)
  sriWsEndpoints?: SriWsEndpointsConfig;

  // Visual Identity & Branding
  platformName: string;
  platformTagline: string;
  systemBadge: string;
  logoUrl?: string;
  faviconUrl?: string;
  loginWelcomeHeading: string;
  loginWelcomeSubheading: string;
  footerCopyright: string;
  footerLegalText: string;

  // Layout & Menu Architecture (Hostinger & Figma Style)
  menuLayout: 'topbar-classic' | 'sidebar-left' | 'sidebar-right' | 'compact-dock' | 'floating-island';
  contentLayoutWidth: 'contained-sm' | 'contained-lg' | 'full-width' | 'fluid';
  density: 'comfortable' | 'compact' | 'spacious';
  menuGroups?: MenuGroup[];
  customMenuItems: CustomMenuItem[];

  // Global Theme & Advanced Colors Engine
  primaryColorName: 'blue' | 'indigo' | 'purple' | 'emerald' | 'teal' | 'rose' | 'amber' | 'cyan' | 'slate' | 'custom';
  customPrimaryHex: string;
  customSecondaryHex?: string;
  customNavbarBgHex?: string;
  customSidebarBgHex?: string;
  customCardBgHex?: string;
  customTextColorHex?: string;
  customButtonColorHex?: string;
  customButtonTextColorHex?: string;
  buttonBorderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  enableCustomColorPalette?: boolean;
  accentGradient: 'blue-indigo' | 'purple-indigo' | 'emerald-teal' | 'amber-orange' | 'rose-pink' | 'cyber-dark';
  headerStyle: 'modern-white' | 'gradient-glass' | 'dark-slate' | 'minimal-clean';
  borderRadiusStyle: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Global Text & Button Names / Microcopy Overrides
  textOverrides?: Record<string, string>;

  // Screen-by-Screen Builder & Component Customizations
  screenCustomizations?: Record<string, ScreenCustomizationConfig>;

  // Custom Visual Containers & Blocks (Hostinger / Figma Drag-and-Build)
  customContainers: CustomContainerWidget[];

  // Custom Code & Script Injector (CSS / HTML / Embeds)
  customCss?: string;
  customHeadHtml?: string;
  customFooterHtml?: string;

  // Plans Catalog Config
  plansCatalogHeading?: string;
  plansCatalogSubheading?: string;
  plansAnnualDiscountText?: string;

  // Components & Content
  allowDemoData?: boolean;
  topBanner: TopAnnouncementBanner;
  promoBanner: PromotionalBanner;
  loginSlides: LoginSlideItem[];
  customNews: CustomNewsItem[];
  billingPlans: BillingPlanItem[];
  socialLinks: SocialLinksConfig;
  modules: ModuleVisibilityFlags;
}

